// Mechanik 4 „Vorbereiteter Konter“ (B38–B43).
import { beforeEach, describe, expect, it } from "vitest";
import type { State2 } from "../types";
import { CARD2 } from "../data/cards";
import { TUTORIALS_K2, TUTORIAL_GUARD_ODER_TD } from "../data/tutorials";
import { aiChoose, finishThreats, KRAFT_MAX, legalCards, newMatch, PASS, playRound, setCardRegistry } from "./index";
import {
  canKonter, checkKonter, KONTER_COST, KONTER_MIN_ATEM, KONTER_PER_MATCH, KONTER_ROUNDS, konterBelief, konterCards,
  konterOptions, konterTargets, publicView, splitPlay, withKonter,
} from "./konter";
import { mulberry32 } from "../../engine/rng";

beforeEach(() => setCardRegistry(null));
const ok = (s: State2, side: "p" | "o", id: string) => legalCards(s, side).find((l) => l.id === id)?.ok ?? false;

function stand(board: Partial<State2["board"]> = {}): State2 {
  const s = newMatch({ seed: 1, start: { pos: "stand", top: null, board } });
  s.p.kraft = KRAFT_MAX; s.o.kraft = KRAFT_MAX;
  return s;
}
const SPRAWL = withKonter("nd_outside_foot", "nd_sprawl");

describe("Konter: Daten (Schlüsselwort)", () => {
  it("nur Rahmen, jeder mit mindestens einem Angriff des Gegners in derselben Zone", () => {
    const ks = konterCards();
    expect(ks.length).toBeGreaterThan(10);
    for (const c of ks) {
      expect(c.kind, c.id).toBe("rahmen");
      expect(konterTargets(c).every((a) => a.kind === "angriff" && a.zone === c.zone), c.id).toBe(true);
    }
    expect(konterTargets(CARD2.nd_sprawl).map((a) => a.id)).toEqual(expect.arrayContaining(["nd_double_leg", "nd_single_leg"]));
    expect(canKonter(CARD2.nd_double_leg)).toBe(false);
    expect(canKonter(CARD2.nd_outside_foot)).toBe(false);
  });
  it("Zug-Kodierung: Karte & Konter", () => {
    expect(splitPlay(SPRAWL)).toEqual({ card: "nd_outside_foot", konter: "nd_sprawl" });
    expect(splitPlay("nd_double_leg")).toEqual({ card: "nd_double_leg", konter: null });
  });
});

describe("Konter: Regeln (B38–B41)", () => {
  it("B38/B40: zusätzlich gelegt, springt noch in derselben Runde ein – statt deiner Karte, ohne Zonengewinn", () => {
    const s = stand();
    const { state, round } = playRound(s, SPRAWL, "nd_double_leg");
    expect(round.events).toContainEqual({ t: "konter", side: "p", on: "set" });
    expect(round.events).toContainEqual({ t: "konter", side: "p", on: "trigger", card: "nd_sprawl", zone: "beine", instead: "nd_outside_foot" });
    expect(round.rule).toBe("rahmen>angriff");
    expect(round.pCard).toBe("nd_sprawl");
    expect(round.konterSet).toEqual(["p"]);
    expect(round.headline).toMatch(/^Konter!/);
    expect(state.pos).toBe("stand"); // gestoppt
    expect(state.board.beine).toBe(0); // B40: gewinnt keine Zone
    expect(state.board.kopf).toBe(0); // die gewählte Karte (Auslage, Kopf) wirkte nicht
    expect(state.p.locked).toEqual(["nd_sprawl"]); // gespielt = gesperrt; die Auslage bleibt frei
    expect(state.konter?.p).toBeUndefined();
    expect(state.p.kraft).toBe(KRAFT_MAX - KONTER_COST + 1);
  });

  it("B40: Sprawl-Konter mit Kopf-Führung wechselt in den Front Headlock (Rahmen-Regeln gelten)", () => {
    const s = stand({ kopf: 1 });
    const { state } = playRound(s, SPRAWL, "nd_double_leg");
    expect(state.pos).toBe("headlock");
    expect(state.top).toBe("p");
  });

  it("B40: liegt bis zur nächsten Runde und springt dann ein", () => {
    let s = stand();
    s = playRound(s, SPRAWL, "nd_hand_fight").state;
    expect(s.konter?.p).toEqual({ card: "nd_sprawl", zone: "beine", left: KONTER_ROUNDS - 1 });
    expect(ok(s, "p", "nd_sprawl")).toBe(false); // liegt verdeckt
    const { round } = playRound(s, "nd_level_change", "nd_double_leg");
    expect(round.events.some((e) => e.t === "konter" && e.on === "trigger")).toBe(true);
    expect(round.pCard).toBe("nd_sprawl");
  });

  it("B40: eine Finte in seiner Zone weckt den Konter – und schlägt ihn (+2, Konter verbraucht)", () => {
    const s = stand();
    const { state, round } = playRound(s, SPRAWL, "nd_level_change");
    expect(CARD2.nd_level_change.zone).toBe("beine");
    expect(round.rule).toBe("aufbauen>rahmen");
    expect(state.board.beine).toBe(-2);
    expect(state.konter?.p).toBeUndefined();
    expect(round.headline).toMatch(/Finte/);
  });

  it("B41: verfällt nach zwei Runden (Karte 1 Runde gesperrt); höchstens einer pro Kampf", () => {
    let s = stand();
    s = playRound(s, SPRAWL, "nd_hand_fight").state;
    const r = playRound(s, "nd_hand_fight", "nd_outside_foot");
    s = r.state;
    expect(r.round.events).toContainEqual({ t: "konter", side: "p", on: "gone", why: "zeit", card: "nd_sprawl", zone: "beine" });
    expect(s.konter).toBeUndefined();
    expect(s.p.locked).toContain("nd_sprawl");
    s.p.kraft = KRAFT_MAX;
    expect(KONTER_PER_MATCH).toBe(1);
    expect(checkKonter(s, "p", CARD2.nd_hand_fight, CARD2.nd_level_change).reason).toMatch(/pro Kampf/);
  });

  it("B41: Positionswechsel – passt der Rahmen nicht in die neue Lage, fällt er (ohne Sperre)", () => {
    let s = stand();
    const r = playRound(s, withKonter("nd_outside_foot", "nd_hand_fight"), "nd_clinch_entry");
    s = r.state;
    // nd_hand_fight passt auch in den Clinch – bleibt liegen.
    expect(s.pos).toBe("clinch");
    expect(s.konter?.p?.card).toBe("nd_hand_fight");
    let t = stand();
    t = playRound(t, SPRAWL, "nd_clinch_entry").state;
    expect(t.pos).toBe("clinch");
    expect(t.konter).toBeUndefined();
    expect(t.p.locked).not.toContain("nd_sprawl");
  });

  it("B38: braucht genug Atem, nicht die gespielte Karte, nicht während seine Aufgabe läuft, nicht in Lektionen", () => {
    const s = stand();
    s.p.kraft = KONTER_MIN_ATEM - 1;
    expect(checkKonter(s, "p", CARD2.nd_sprawl, CARD2.nd_outside_foot).ok).toBe(false);
    s.p.kraft = KRAFT_MAX;
    expect(checkKonter(s, "p", CARD2.nd_sprawl, CARD2.nd_sprawl).ok).toBe(false);
    expect(checkKonter(s, "p", CARD2.nd_double_leg, null).ok).toBe(false);
    expect(() => playRound(s, withKonter("nd_outside_foot", "nd_double_leg"), PASS)).toThrow();
    const m = newMatch({ seed: 1, start: { pos: "mount", top: "o", board: { arme: -1 } } });
    m.p.kraft = KRAFT_MAX;
    m.subs = [{ id: "americana", name: "Americana", owner: "o", step: 1, zone: "arme" }];
    expect(checkKonter(m, "p", CARD2.mb_elbows_tight, null).reason).toMatch(/Zu spät/);
    const off = newMatch({ seed: 1, konter: false });
    off.p.kraft = KRAFT_MAX;
    expect(konterOptions(off, "p", CARD2.nd_outside_foot)).toEqual([]);
  });

  it("Griffe (B32): der ausgelöste Konter löst seinen Griff in dieser Zone", () => {
    const s = newMatch({ seed: 1, start: { pos: "clinch", top: null, board: { kopf: 0 } } });
    s.p.kraft = KRAFT_MAX; s.o.kraft = KRAFT_MAX;
    s.grips = [{ id: "collar_tie", name: "Collar Tie", owner: "o", zone: "kopf", card: "cl_collar_tie" }];
    expect(ok(s, "o", "cl_snap_down")).toBe(true);
    const { state, round } = playRound(s, withKonter("cl_underhook", "nd_hand_fight"), "cl_snap_down");
    expect(round.events.some((e) => e.t === "konter" && e.on === "trigger")).toBe(true);
    expect(state.grips.some((g) => g.owner === "o")).toBe(false);
    expect(state.pos).toBe("clinch");
  });

  it("Dilemma (B1): stoppt der Konter einen Dilemma-Angriff, öffnet sich die andere Zone", () => {
    const s = newMatch({ seed: 1, start: { pos: "side", top: "o", board: { huefte: -1 } } });
    s.p.kraft = KRAFT_MAX; s.o.kraft = KRAFT_MAX;
    const a = CARD2.sct_to_mount;
    expect(a.dilemmaOpens).toBeDefined();
    const frame = konterTargets(CARD2.scb_v_frame).some((x) => x.id === a.id) ? "scb_v_frame" : null;
    expect(frame).toBe("scb_v_frame");
    const other = legalCards(s, "p").find((l) => l.ok && l.id !== frame && CARD2[l.id].zone !== a.zone)!.id;
    const { state, round } = playRound(s, withKonter(other, frame!), a.id);
    expect(round.events).toContainEqual({ t: "dilemma", side: "o", zone: a.dilemmaOpens });
    expect(state.pos).toBe("side");
  });
});

describe("Konter: verdeckte Information (B39) und KI (B42)", () => {
  it("publicView zeigt dem Gegner nur „liegt, noch n Runden“", () => {
    let s = stand();
    s = playRound(s, SPRAWL, "nd_hand_fight").state;
    expect(publicView(s, "o").konter?.p).toEqual({ left: 1 });
    expect(publicView(s, "p").konter?.p?.card).toBe("nd_sprawl");
    // Belief: nur Zonen seiner möglichen Konter-Rahmen; offen gespielte zählen nicht.
    const b = konterBelief(publicView(s, "o"), "o");
    expect(Object.keys(b).length).toBeGreaterThan(0);
    expect(Object.values(b).reduce((x, y) => x + (y ?? 0), 0)).toBeCloseTo(1);
  });

  it("die KI schummelt nicht: dieselbe Wahl, egal welcher Rahmen verdeckt liegt", () => {
    for (let seed = 1; seed <= 8; seed++) {
      const base = stand();
      const a = playRound(base, SPRAWL, "nd_hand_fight").state;
      const b = playRound(base, withKonter("nd_outside_foot", "nd_hand_fight"), "nd_hand_fight").state;
      // Gleiche öffentliche Lage, anderer verdeckter Rahmen.
      a.board = { ...b.board }; a.p.locked = [...b.p.locked];
      for (const lv of [2, 3] as const) {
        expect(aiChoose(a, "o", lv, mulberry32(seed)), `L${lv} seed ${seed}`).toBe(aiChoose(b, "o", lv, mulberry32(seed)));
      }
    }
  });

  it("„Abschluss möglich“ (B36) verrät keinen verdeckten Konter", () => {
    const s = newMatch({ seed: 1, start: { pos: "mount", top: "o", board: { arme: -1 } } });
    s.o.kraft = KRAFT_MAX;
    s.subs = [{ id: "americana", name: "Americana", owner: "o", step: 1, zone: "arme" }];
    const before = finishThreats(s, "o");
    const hidden: State2 = { ...s, konter: { p: { card: "mb_elbows_tight", zone: "arme", left: 2 } } };
    expect(finishThreats(hidden, "o")).toEqual(before);
  });

  it("Stufe 1 legt nie Konter; Stufe 2/3 legen nur legale", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const rng = mulberry32(seed);
      let s = newMatch({ seed });
      for (let r = 0; r < 9 && !s.result; r++) {
        const p = aiChoose(s, "p", 1, rng), o = aiChoose(s, "o", ((seed % 2) + 2) as 2 | 3, rng);
        expect(splitPlay(p).konter).toBeNull();
        s = playRound(s, p, o).state; // wirft bei illegalem Konter
      }
    }
  });
});

describe("Konter: Lektionen", () => {
  it("die ersten drei Lektionen und die Zusatz-Lektion schalten Konter aus", () => {
    for (const t of [...TUTORIALS_K2.slice(0, 3), TUTORIAL_GUARD_ODER_TD]) expect(t.konter, t.id).toBe(false);
  });
});
