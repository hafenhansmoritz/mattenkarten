// Mechanik 5 „Spielstil-Fähigkeit“ (B44–B50): Regeln per Engine, Daten, KI, Lektionen.
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import type { Side, StilId, State2 } from "../types";
import { CARD2 } from "../data/cards";
import { BOSSES } from "../data/bosses";
import { STILE, STIL_KEY, matchStil } from "../data/stile";
import { KEYWORD } from "../data/keywords";
import { TUTORIALS_K2, TUTORIAL_GUARD_ODER_TD } from "../data/tutorials";
import { aiChoose, KRAFT_MAX, legalCards, newMatch, playRound, setCardRegistry, slotCards, splitPlay, withKonter, withStil } from "./index";
import { checkStil, STIL_COOLDOWN, STIL_COST, STIL_IDS, STIL_POWER, STIL_POWERS, stilReadyRound, stilStats } from "./stil";
import { seedStil, simMatch, stilPlayer } from "./sim";
import { mulberry32 } from "../../engine/rng";

beforeEach(() => setCardRegistry(null));
const words = (s: string) => s.trim().split(/\s+/).filter((w) => !/^[–\-→:]$/.test(w)).length;

function at(pos: State2["pos"], top: Side | null, stil: Partial<Record<Side, StilId>>, board: Partial<State2["board"]> = {}): State2 {
  const s = newMatch({ seed: 1, start: { pos, top, board }, stil });
  s.p.kraft = KRAFT_MAX; s.o.kraft = KRAFT_MAX;
  return s;
}
const stilEv = (r: { events: { t: string }[] }) => r.events.find((e) => e.t === "stil") as { on: string; why?: string } | undefined;

describe("Spielstil: Daten", () => {
  it("vier Stile in Boss-Reihenfolge; jede Fähigkeit ist der Keil einer echten Karte in ihrer Zone und Lage", () => {
    expect(STIL_IDS).toEqual(BOSSES.map((b) => b.id));
    expect(STILE.map((x) => x.id)).toEqual(STIL_IDS);
    for (const p of STIL_POWERS) {
      const like = CARD2[p.like];
      expect(like, p.id).toBeDefined();
      expect(like.zone, p.id).toBe(p.zone);
      expect(like.kind === "aufbauen", `${p.id}: ${p.like} ist ein Keil`).toBe(true);
      expect(p.slots.some((sl) => like.slots.some((x) => x.pos === sl.pos && x.role === sl.role)), p.id).toBe(true);
    }
  });
  it("Texte kurz, du-Form, Quelle oder Trainer-Prüfung", () => {
    for (const x of STILE) {
      expect(words(x.tagline)).toBeLessThanOrEqual(5);
      expect(words(x.agame), x.agame).toBeLessThanOrEqual(20);
      expect(words(x.powerDo), x.powerDo).toBeLessThanOrEqual(12);
      expect(words(x.bjj), x.bjj).toBeLessThanOrEqual(20);
      for (const t of [x.agame, x.powerDo, x.bjj]) expect(t).not.toMatch(/\b(Sie|Ihr|Ihnen)\b/);
      expect(!!x.source || x.check === true, x.id).toBe(true);
      if (x.source) expect(x.source.url).toMatch(/^https:\/\//);
    }
    expect(KEYWORD.stil.name).toBe("Spielstil");
    expect(KEYWORD.stil.rule).toContain(`${STIL_COST} Atem`);
  });
  it("neuer localStorage-Schlüssel steht in der Datenschutzerklärung", () => {
    expect(readFileSync("public/landing/datenschutz.html", "utf8")).toContain(`<code>${STIL_KEY}</code>`);
  });
});

describe("Spielstil: Regeln (B44–B46)", () => {
  it("B44: zusätzlich zur Karte, 2 Atem, +1 in ihrer Zone nach den Karten; öffentlich in Round2.stilUsed", () => {
    const s = at("stand", null, { p: "ringer" });
    const { state, round } = playRound(s, withStil("nd_outside_foot"), "nd_hand_fight");
    expect(round.stilUsed).toEqual(["p"]);
    expect(round.pCard).toBe("nd_outside_foot"); // die Fähigkeit ist keine Karte (Kette, Sperre, Statistik bleiben gleich)
    expect(stilEv(round)).toMatchObject({ on: "hit" });
    expect(state.board.beine).toBe(1);
    expect(state.p.kraft).toBe(KRAFT_MAX - STIL_COST + 1);
    expect(state.p.locked).toEqual(["nd_outside_foot"]);
    expect(splitPlay(withStil(withKonter("nd_outside_foot", "nd_sprawl")))).toEqual({ card: "nd_outside_foot", konter: "nd_sprawl", stil: true });
  });

  it("nur in den Lagen des Stils, danach eine Runde Pause, nicht über +2, Atem reicht", () => {
    const s = at("stand", null, { p: "druecker", o: "ringer" });
    expect(checkStil(s, "p")).toEqual({ ok: false, reason: `Nur ${STIL_POWER.druecker.where}` });
    expect(checkStil(s, "o").ok).toBe(true);
    expect(() => playRound(s, withStil("nd_outside_foot"), "nd_hand_fight")).toThrow(/Stil-Fähigkeit/);
    const r1 = playRound(s, "nd_outside_foot", withStil("nd_clinch_entry")).state;
    expect(stilReadyRound(r1, "o")).toBe(2 + STIL_COOLDOWN);
    expect(checkStil(r1, "o")).toEqual({ ok: false, reason: `Wieder ab Runde ${2 + STIL_COOLDOWN}` });
    const full = at("side", "p", { p: "druecker" }, { huefte: 2 });
    expect(checkStil(full, "p").reason).toBe("Zone schon voll (+2)");
    const poor = at("side", "p", { p: "druecker" });
    poor.p.kraft = 2;
    expect(checkStil(poor, "p", CARD2.sct_americana).reason).toBe("Braucht 3 Atem");
    expect(checkStil(at("stand", null, {}), "p").reason).toBe("Kein Spielstil");
  });

  it("B44: macht keine Karte dieser Runde spielbar – Bedingungen zählen den Stand zu Rundenbeginn", () => {
    const s = at("stand", null, { p: "ringer" }, { beine: -1 });
    expect(legalCards(s, "p").find((l) => l.id === "nd_double_leg")?.ok).toBe(false);
    expect(() => playRound(s, withStil("nd_double_leg"), "nd_outside_foot")).toThrow();
  });

  it("B45: spielt er in ihrer Zone eine Karte (Angriff, Keil oder Rahmen), hält er dagegen – sie verpufft, der Atem ist weg", () => {
    for (const foe of ["nd_sprawl", "nd_level_change", "nd_double_leg"]) {
      const s = at("stand", null, { p: "ringer" });
      const { state, round } = playRound(s, withStil("nd_outside_foot"), foe);
      expect(stilEv(round), foe).toMatchObject({ on: "fizzle", why: "dagegen" });
      expect(state.p.kraft, foe).toBe(KRAFT_MAX - STIL_COST + 1);
      if (foe === "nd_sprawl") expect(state.board.beine).toBe(0);
    }
  });

  it("B45: liegst du oben, hält nur sein Angriff dagegen – sein Rahmen und sein Keil dort nicht (Gewicht, wie B3)", () => {
    const frame = playRound(at("side", "p", { p: "druecker" }), withStil("sct_crossface"), "scb_v_frame");
    expect(stilEv(frame.round)).toMatchObject({ on: "hit" });
    expect(frame.state.board.huefte).toBe(1);
    const keil = playRound(at("side", "p", { p: "druecker" }), withStil("sct_crossface"), "bot_elbow_knee");
    expect(stilEv(keil.round)).toMatchObject({ on: "hit" });
    const shrimp = playRound(at("side", "p", { p: "druecker" }), withStil("sct_crossface"), "scb_shrimp");
    expect(stilEv(shrimp.round)).toMatchObject({ on: "fizzle" });
    // Unten (Guard-Spieler) hält auch sein Rahmen dagegen.
    const bottom = playRound(at("guard", "o", { p: "guard" }), withStil("gb_break_posture"), "gt_base_post");
    expect(stilEv(bottom.round)).toMatchObject({ on: "fizzle", why: "dagegen" });
  });

  it("B45: wechselt die Lage in dieser Runde, verpufft sie (wirkt nur in der Lage, in der du sie einsetzt)", () => {
    const s = at("stand", null, { p: "ringer" });
    const { state, round } = playRound(s, withStil("nd_double_leg"), "nd_outside_foot");
    expect(state.pos).toBe("guard");
    expect(stilEv(round)).toMatchObject({ on: "fizzle", why: "position" });
  });

  it("Konter: die Fähigkeit weckt keinen Konter (nur Karten); ein ausgelöster Konter in ihrer Zone hält dagegen", () => {
    // Er legt den Sprawl verdeckt; ich setze Level Change mit einer Kopf-Karte ein – kein Auslösen, die Fähigkeit wirkt.
    const s = at("stand", null, { p: "ringer" });
    const r1 = playRound(s, withStil("nd_outside_foot"), withKonter("nd_hand_fight", "nd_sprawl"));
    expect(r1.round.events.some((e) => e.t === "konter" && e.on === "trigger")).toBe(false);
    expect(stilEv(r1.round)).toMatchObject({ on: "hit" });
    expect(r1.state.konter?.o).toBeDefined();
    expect(r1.state.board.beine).toBe(1);
  });

  it("Konter: ein ausgelöster Sprawl ist seine Karte an den Beinen – die Fähigkeit verpufft", () => {
    const s = at("stand", null, { p: "ringer" });
    s.konter = { o: { card: "nd_sprawl", zone: "beine", left: 1 } }; // liegt verdeckt seit der Vorrunde
    const { round } = playRound(s, withStil("nd_single_leg"), "nd_hand_fight");
    expect(round.events.some((e) => e.t === "konter" && e.on === "trigger")).toBe(true);
    expect(stilEv(round)).toMatchObject({ on: "fizzle", why: "dagegen" });
  });

  it("Griffe: die Fähigkeit legt keinen Griff, stapelt aber mit einem Griff (Zone +1, Bedingung −1)", () => {
    const s = at("clinch", null, { p: "ringer" });
    const { state, round } = playRound(s, withStil("cl_collar_tie"), "cl_underhook");
    expect(stilEv(round)).toMatchObject({ on: "hit" });
    expect(state.grips.filter((g) => g.owner === "p").map((g) => g.id)).toEqual(["collar_tie"]);
    expect(state.board.beine).toBe(1);
  });

  it("stilStats zählt Einsätze und Treffer", () => {
    const s = at("stand", null, { p: "ringer" });
    const a = playRound(s, withStil("nd_outside_foot"), "nd_hand_fight").state;
    expect(stilStats(a, "p")).toEqual({ used: 1, hit: 1 });
    const b = playRound(at("stand", null, { p: "ringer" }), withStil("nd_outside_foot"), "nd_sprawl").state;
    expect(stilStats(b, "p")).toEqual({ used: 1, hit: 0 });
  });
});

describe("Spielstil: KI (B47)", () => {
  it("alle Stufen spielen nur legale Züge mit Stil; Stufe 2/3 setzen die Fähigkeit ein; ohne Stil nie", () => {
    let used = 0;
    for (let i = 0; i < 24; i++) {
      const lv = ((i % 3) + 1) as 1 | 2 | 3;
      const m = simMatch(stilPlayer(lv, seedStil(i, "p")), stilPlayer(lv, seedStil(i, "o")), 500 + i);
      used += m.state.history.filter((r) => r.stilUsed?.length).length;
      const n = simMatch({ level: lv }, { level: lv }, 500 + i);
      expect(n.state.history.some((r) => r.stilUsed?.length)).toBe(false);
    }
    expect(used).toBeGreaterThan(5);
  });
  it("KI rechnet nur mit öffentlicher Info: der Stil des Gegners ist öffentlich, seine Wahl nicht", () => {
    const s = at("side", "o", { p: "guard", o: "druecker" });
    const a = aiChoose(s, "o", 3, mulberry32(3));
    expect(slotCards("side", "top").some((c) => c.id === splitPlay(a).card)).toBe(true);
  });
});

describe("Spielstil: Lektionen (B50)", () => {
  it("erste drei Lektionen und „Guard ziehen oder Takedown?“ ohne Fähigkeit – auch wenn ein Stil mitkommt", () => {
    for (const t of [...TUTORIALS_K2, TUTORIAL_GUARD_ODER_TD]) {
      expect(t.stil, t.id).toBe(false);
      expect(matchStil({ tutorial: t, stil: "ringer", foeStil: "guard" }), t.id).toBeUndefined();
    }
  });
  it("Tages-Challenge (Lektion ohne stil:false): nur dein Stil; freies Match: beide; Boss: sein eigener", () => {
    expect(matchStil({ tutorial: {}, stil: "ringer", foeStil: "guard" })).toEqual({ p: "ringer", o: undefined });
    expect(matchStil({ stil: "ringer", foeStil: "guard" })).toEqual({ p: "ringer", o: "guard" });
    expect(matchStil({ stil: "ringer", bossId: "druecker" })).toEqual({ p: "ringer", o: "druecker" });
    expect(matchStil({})).toBeUndefined();
  });
});
