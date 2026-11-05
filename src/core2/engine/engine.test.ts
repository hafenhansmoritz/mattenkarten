import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { State2 } from "../types";
import { FIX } from "./fixtures";
import { aiChoose, boardFor, legalCards, newMatch, PASS, playRound, roleOf, setCardRegistry, threats } from "./index";
import { mulberry32 } from "../../engine/rng";

beforeEach(() => setCardRegistry(FIX));
afterAll(() => setCardRegistry(null));

const stand = (board: Partial<State2["board"]> = {}) => newMatch({ seed: 1, start: { pos: "stand", top: null, board } });
const sideTop = (board: Partial<State2["board"]> = {}, top: "p" | "o" = "p") => newMatch({ seed: 1, start: { pos: "side", top, board } });

describe("Brett & Rollen", () => {
  it("boardFor dreht das Vorzeichen für o", () => {
    const s = stand({ beine: 2, arme: -1 });
    expect(boardFor(s, "p")).toEqual({ kopf: 0, arme: -1, huefte: 0, beine: 2 });
    expect(boardFor(s, "o")).toEqual({ kopf: 0, arme: 1, huefte: 0, beine: -2 });
  });
  it("Startwerte werden gekappt; roleOf", () => {
    const s = sideTop({ kopf: 5 });
    expect(s.board.kopf).toBe(2);
    expect(roleOf(s, "p")).toBe("top");
    expect(roleOf(s, "o")).toBe("bottom");
    expect(roleOf(stand(), "p")).toBe("neutral");
  });
  it("Kartenregister via newMatch opts", () => {
    const s = newMatch({ seed: 1, cards: FIX });
    expect(legalCards(s, "p").length).toBe(6);
  });
});

describe("Verschiedene Zonen", () => {
  it("beide Aufbauen wirken unabhängig, inkl. alsoGain", () => {
    const { state, round } = playRound(stand(), "s_build_beine", "s_build_arme");
    expect(round.rule).toBe("verschiedene-zonen");
    expect(round.winner).toBe("both");
    expect(state.board).toEqual({ kopf: -1, arme: -1, huefte: 0, beine: 1 });
  });
  it("Rahmen ins Leere verpufft", () => {
    const { state, round } = playRound(stand(), "s_frame_beine", "s_build_arme");
    expect(round.rule).toBe("rahmen-ins-leere");
    expect(state.board.beine).toBe(0);
    expect(state.board.arme).toBe(-1);
    expect(round.headline).toMatch(/Leere/);
  });
  it("Angriff in anderer Zone gelingt, wenn requires erfüllt", () => {
    const { state, round } = playRound(stand({ beine: 1 }), "s_double", "s_build_arme");
    expect(round.rule).toBe("verschiedene-zonen");
    expect(state.pos).toBe("side");
    expect(state.top).toBe("p");
    expect(state.p.pts).toBe(2);
  });
  it("Clamp bei ±2", () => {
    const { state } = playRound(stand({ beine: 2 }), "s_build_beine", "s_build_arme");
    expect(state.board.beine).toBe(2);
  });
});

describe("Dreieck (gleiche Zone)", () => {
  it("Angriff > Aufbauen", () => {
    const s = stand({ arme: 0 });
    const { state, round } = playRound(s, "s_clinch", "s_build_arme");
    expect(round.rule).toBe("angriff>aufbauen");
    expect(round.winner).toBe("p");
    expect(state.pos).toBe("clinch");
    expect(state.board.kopf).toBe(0); // Aufbauen gab nichts
  });
  it("Aufbauen > Rahmen: +gain und +1 extra", () => {
    const { state, round } = playRound(stand(), "s_build_beine", "s_frame_beine");
    expect(round.rule).toBe("aufbauen>rahmen");
    expect(round.winner).toBe("p");
    expect(state.board.beine).toBe(2);
  });
  it("Rahmen > Angriff: Angriff scheitert, Reagierender gewinnt Zone; Dilemma öffnet Zone", () => {
    const s = stand({ beine: 1 });
    const { state, round } = playRound(s, "s_double", "s_frame_beine");
    expect(round.rule).toBe("rahmen>angriff");
    expect(round.winner).toBe("o");
    expect(state.pos).toBe("stand");
    expect(state.board.beine).toBe(0); // o +1
    expect(state.board.kopf).toBe(1);  // Dilemma-Bonus für p
    expect(round.events).toContainEqual({ t: "dilemma", side: "p", zone: "kopf" });
    expect(round.why).toMatch(/Dilemma/);
  });
  it("Rahmen > Angriff ohne Dilemma: kein Bonus", () => {
    const { state, round } = playRound(stand(), "s_clinch", "s_frame_arme");
    expect(round.rule).toBe("rahmen>angriff");
    expect(state.board).toEqual({ kopf: 0, arme: -1, huefte: 0, beine: 0 });
    expect(round.events.some((e) => e.t === "dilemma")).toBe(false);
  });
  it("Angriff = Angriff: höherer Zonenwert gewinnt", () => {
    const s = stand({ arme: -1 }); // o vorne an den Armen
    const { state, round } = playRound(s, "s_clinch", "s_clinch");
    expect(round.rule).toBe("angriff=angriff");
    expect(round.winner).toBe("o");
    expect(state.pos).toBe("clinch");
  });
  it("Angriff = Angriff bei Gleichstand: Gerangel, beide −1 Kraft", () => {
    const { state, round } = playRound(stand(), "s_clinch", "s_clinch");
    expect(round.winner).toBe("none");
    expect(state.pos).toBe("stand");
    // 3 −1 = 2, +1 Rundenende = 3
    expect(state.p.kraft).toBe(3);
    expect(state.o.kraft).toBe(3);
    expect(round.events.filter((e) => e.t === "kraft").length).toBe(2);
    expect(round.headline).toMatch(/Gerangel/);
  });
  it("Aufbauen = Aufbauen hebt sich auf", () => {
    const { state, round } = playRound(stand(), "s_build_beine", "s_build_beine");
    expect(round.rule).toBe("aufbauen=aufbauen");
    expect(state.board.beine).toBe(0);
  });
  it("Rahmen = Rahmen: nichts", () => {
    const { state, round } = playRound(stand(), "s_frame_beine", "s_frame_beine");
    expect(round.rule).toBe("rahmen=rahmen");
    expect(state.board).toEqual(stand().board);
  });
});

describe("requires, Kraft, Sperre", () => {
  it("requires sperrt Angriff mit Grund", () => {
    const l = legalCards(stand(), "p").find((c) => c.id === "s_double")!;
    expect(l.ok).toBe(false);
    expect(l.reason).toBe("Braucht Beine +1");
    expect(legalCards(stand({ beine: 1 }), "p").find((c) => c.id === "s_double")!.ok).toBe(true);
    // aus Sicht von o: board beine -1 heißt o +1
    expect(legalCards(stand({ beine: -1 }), "o").find((c) => c.id === "s_double")!.ok).toBe(true);
  });
  it("Kraftkosten: Grund und Bezahlung", () => {
    const s = sideTop();
    expect(legalCards(s, "p").find((c) => c.id === "sc_bigmove")).toEqual({ id: "sc_bigmove", ok: false, reason: "Braucht 4 Kraft" });
    const s2 = { ...s, p: { ...s.p, kraft: 4 } };
    const { state } = playRound(s2, "sc_bigmove", "scb_build_kopf");
    expect(state.pos).toBe("back");
    expect(state.p.kraft).toBe(1); // 4 − 4 + 1
  });
  it("Kraft +1 pro Runde, max 5", () => {
    let s = stand();
    s = playRound(s, "s_build_beine", "s_build_arme").state;
    expect(s.p.kraft).toBe(4);
    s = playRound(s, "s_build_arme", "s_build_beine").state;
    s = playRound(s, "s_build_beine", "s_build_arme").state;
    expect(s.p.kraft).toBe(5);
  });
  it("gespielte Karte ist nächste Runde gesperrt", () => {
    const { state } = playRound(stand(), "s_build_beine", "s_build_arme");
    expect(legalCards(state, "p").find((c) => c.id === "s_build_beine")).toEqual({ id: "s_build_beine", ok: false, reason: "Gesperrt (gerade gespielt)" });
    expect(legalCards(state, "o").find((c) => c.id === "s_build_arme")!.ok).toBe(false);
    expect(() => playRound(state, "s_build_beine", "s_build_beine")).toThrow();
    const s3 = playRound(state, "s_build_arme", "s_build_beine").state;
    expect(legalCards(s3, "p").find((c) => c.id === "s_build_beine")!.ok).toBe(true);
  });
});

describe("Positionswechsel & Aufgaben", () => {
  it("Wechsel kappt die tragende Zone auf ±1 und löscht Leisten", () => {
    let s = sideTop({ huefte: 2 });
    s = playRound(s, "sc_kimura", "scb_build_kopf").state;
    expect(s.subs).toHaveLength(1);
    const { state, round } = playRound(s, "sc_mount", "scb_frame_arme");
    expect(state.pos).toBe("mount");
    expect(state.top).toBe("p");
    expect(state.board.huefte).toBe(1);
    expect(state.subs).toHaveLength(0);
    expect(state.p.pts).toBe(4);
    expect(round.events).toContainEqual({ t: "move", pos: "mount", top: "p", escape: undefined });
  });
  it("Befreiung von o: Rolle aus Sicht des Handelnden, Escape-Typ im Event", () => {
    const s = sideTop({}, "p"); // p oben, o unten
    const { state, round } = playRound(s, "sc_cross", "scb_escape");
    expect(state.pos).toBe("guard");
    expect(state.top).toBe("p"); // o ist unten in der Guard
    expect(roleOf(state, "o")).toBe("bottom");
    expect(round.events.find((e) => e.t === "move")).toMatchObject({ escape: "guard" });
  });
  it("Aufgabe-Leiste: 3 Schritte → Tap", () => {
    let s = sideTop();
    s = { ...s, p: { ...s.p, kraft: 5 } };
    let r = playRound(s, "sc_kimura", "scb_build_kopf");
    expect(r.state.subs[0]).toMatchObject({ id: "kimura", owner: "p", step: 1, zone: "arme" });
    r = playRound(r.state, "sc_kimura_fin", "scb_frame_huefte");
    expect(r.state.subs[0].step).toBe(2);
    r = playRound(r.state, "sc_kimura", "scb_build_kopf");
    expect(r.state.result).toEqual({ type: "tap", winner: "p", sub: "Kimura" });
    expect(r.round.headline).toMatch(/Tap/);
    expect(() => playRound(r.state, "sc_cross", "scb_frame_arme")).toThrow();
  });
  it("Rahmen in derselben Zone setzt die Leiste zurück (auch ohne Angriff)", () => {
    let s = sideTop();
    s = playRound(s, "sc_kimura", "scb_build_kopf").state;
    expect(s.subs[0].step).toBe(1);
    const { state, round } = playRound(s, "sc_hip", "scb_frame_arme");
    expect(round.rule).toBe("verschiedene-zonen"); // kein Rahmen ins Leere
    expect(state.subs).toHaveLength(0);
    expect(round.events).toContainEqual({ t: "sub", owner: "p", id: "kimura", step: 0 });
  });
  it("Rahmen > Angriff auf Leiste: Angriff scheitert und Leiste −1", () => {
    let s = sideTop();
    s = playRound(s, "sc_kimura", "scb_build_kopf").state;
    s = playRound(s, "sc_hip", "scb_frame_huefte").state;
    const s2 = { ...s, p: { ...s.p, kraft: 5 } };
    const { state, round } = playRound(s2, "sc_kimura_fin", "scb_frame_arme");
    expect(round.rule).toBe("rahmen>angriff");
    expect(state.subs).toHaveLength(0);
  });
});

describe("Rundenlimit & Ziel", () => {
  it("nach maxRounds Punkte-Sieg bzw. Unentschieden", () => {
    let s = newMatch({ seed: 1, maxRounds: 2 });
    s = playRound(s, "s_build_beine", "s_build_arme").state;
    expect(s.round).toBe(2);
    s = playRound(s, "s_build_arme", "s_build_beine").state;
    expect(s.result).toEqual({ type: "points", winner: null });
    expect(s.history).toHaveLength(2);
    let t = newMatch({ seed: 1, maxRounds: 1, start: { pos: "stand", top: null, board: { beine: 1 } } });
    t = playRound(t, "s_double", "s_build_arme").state;
    expect(t.result).toEqual({ type: "points", winner: "p" });
  });
  it("Ziel erreicht → goal", () => {
    const s = newMatch({ seed: 1, start: { pos: "side", top: "o" }, goal: [{ pos: "guard", role: "bottom" }] });
    const { state } = playRound(s, "scb_escape", "sc_cross");
    expect(state.result).toEqual({ type: "goal", winner: "p" });
  });
});

describe("threats & KI", () => {
  it("threats zeigt ok-Angriffe des Gegners", () => {
    const s = stand({ beine: -1 });
    const t = threats(s, "p");
    expect(t).toEqual([{ zone: "arme", cardIds: ["s_clinch"] }, { zone: "beine", cardIds: ["s_double"] }]);
    expect(threats(stand(), "p")).toEqual([{ zone: "arme", cardIds: ["s_clinch"] }]);
  });
  it("aiChoose liefert legale Karten auf allen Stufen, deterministisch", () => {
    for (const level of [1, 2, 3] as const) {
      const s = sideTop({ huefte: 1 });
      const a = aiChoose(s, "p", level, mulberry32(7));
      const b = aiChoose(s, "p", level, mulberry32(7));
      expect(a).toBe(b);
      expect(legalCards(s, "p").find((c) => c.id === a)!.ok).toBe(true);
    }
  });
  it("KI Stufe 2 beendet eine Aufgabe auf Schritt 2", () => {
    let s = sideTop();
    s = { ...s, subs: [{ id: "kimura", name: "Kimura", owner: "p", step: 2, zone: "arme" }], p: { ...s.p, kraft: 5 } };
    expect(["sc_kimura", "sc_kimura_fin"]).toContain(aiChoose(s, "p", 2, mulberry32(3)));
  });
  it("KI rahmt gegen laufende Aufgabe", () => {
    let s = sideTop();
    s = { ...s, subs: [{ id: "kimura", name: "Kimura", owner: "p", step: 2, zone: "arme" }] };
    expect(aiChoose(s, "o", 2, mulberry32(3))).toBe("scb_frame_arme");
  });
  it("PASS, wenn keine Karte spielbar ist", () => {
    const s = newMatch({ seed: 1, start: { pos: "mount", top: "p" } });
    const s2 = { ...s, o: { ...s.o, locked: ["mb_frame"] } };
    expect(aiChoose(s2, "o", 2, mulberry32(1))).toBe(PASS);
    const { state } = playRound(s2, "m_build", PASS);
    expect(state.board.huefte).toBe(1);
  });
  it("KI-gegen-KI-Match endet", () => {
    for (const level of [1, 2, 3] as const) {
      let s = newMatch({ seed: 9 });
      const rng = mulberry32(level);
      let n = 0;
      while (!s.result && n++ < 20) s = playRound(s, aiChoose(s, "p", level, rng), aiChoose(s, "o", level, rng)).state;
      expect(s.result).not.toBeNull();
      for (const r of s.history) {
        expect(r.headline.split(/\s+/).length).toBeLessThanOrEqual(10);
        expect(r.why.split(/\s+/).length).toBeLessThanOrEqual(20);
      }
    }
  });
});
