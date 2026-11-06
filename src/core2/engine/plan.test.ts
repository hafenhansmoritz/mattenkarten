// Mechanik 6 „Spielplan-Modus“ (Spec B51–B56).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { State2 } from "../types";
import { setCardRegistry, cardById, slotCards } from "./registry";
import { legalCards, needIn } from "./legal";
import { newMatch, playRound } from "./index";
import { publicView } from "./konter";
import { aiChoose } from "./ai";
import { simMatch, stilPlayer } from "./sim";
import {
  MULLIGAN_MAX, PLAN_DRAW, PLAN_SIZE, PLAN_START, aiMulligan, canMulligan, isBasic, isPlanCard, mulligan, planBlock, planErrors, planPlayed,
} from "./plan";
import { ALL_PLANS, BOSS_PLANS, DEFAULT_PLAN, DEFAULT_PLANS, PLAN_RULE } from "../data/plans";
import { STIL_IDS } from "./stil";
import { mulberry32 } from "../../engine/rng";

beforeAll(() => setCardRegistry(null));
afterAll(() => setCardRegistry(null));

const R = DEFAULT_PLAN.ringer.cards, D = DEFAULT_PLAN.druecker.cards;
const start = (seed = 7): State2 => newMatch({ seed, plan: { p: R, o: D } });
const words = (t: string) => t.split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length;

describe("Spielplan – Daten", () => {
  it("jeder Standard- und Boss-Plan: 15 verschiedene Spielplan-Angriffe, keine Grundlage, keine Beinhebel", () => {
    expect(DEFAULT_PLANS.map((p) => p.stil)).toEqual(STIL_IDS);
    for (const p of ALL_PLANS) {
      expect(planErrors(p.cards, cardById), p.id).toEqual([]);
      for (const id of p.cards) {
        const c = cardById(id)!;
        expect(c.kind, id).toBe("angriff");
        expect(isPlanCard(c), id).toBe(true);
        expect(`${c.term} ${c.plain}`, id).not.toMatch(/heel hook|kneebar|ankle lock|toe hold|beinhebel/i);
      }
    }
    for (const id of STIL_IDS) expect(BOSS_PLANS[id].stil).toBe(id);
  });
  it("Regel in zwei Sätzen à ≤ 20 Wörter", () => {
    expect(PLAN_RULE).toHaveLength(2);
    for (const r of PLAN_RULE) expect(words(r), r).toBeLessThanOrEqual(20);
  });
  it("planErrors meldet falsche Größe, Doppel und Grundlagen", () => {
    expect(planErrors(R.slice(0, 14), cardById).join()).toMatch(/15/);
    expect(planErrors([...R.slice(0, 14), R[0]], cardById).join()).toMatch(/einmal/);
    expect(planErrors([...R.slice(0, 14), "nd_sprawl"], cardById).join()).toMatch(/Grundlage/);
  });
});

describe("Spielplan – Ziehen und Mulligan", () => {
  it(`Start: ${PLAN_START} gezogen, Rest im Stapel, seed-fest gemischt`, () => {
    const s = start();
    expect(s.plan!.p!.hand).toHaveLength(PLAN_START);
    expect(s.plan!.p!.deck).toHaveLength(PLAN_SIZE - PLAN_START);
    expect([...s.plan!.p!.hand, ...s.plan!.p!.deck].sort()).toEqual([...R].sort());
    expect(start().plan).toEqual(s.plan);
    expect(start(8).plan!.p!.hand).not.toEqual(s.plan!.p!.hand);
  });
  it(`nach jeder Runde ${PLAN_DRAW} Karte nachziehen (oberste vom Stapel)`, () => {
    let s = start();
    const top = s.plan!.p!.deck[0];
    s = playRound(s, "nd_sprawl", "nd_hand_fight").state;
    expect(s.plan!.p!.hand).toHaveLength(PLAN_START + 1);
    expect(s.plan!.p!.hand.at(-1)).toBe(top);
    expect(s.plan!.o!.hand).toHaveLength(PLAN_START + 1);
  });
  it(`Mulligan: bis zu ${MULLIGAN_MAX} tauschen, unter den Stapel, nur einmal vor Runde 1`, () => {
    const s = start();
    const [a, b] = s.plan!.p!.hand;
    const t = mulligan(s, "p", [a, b]);
    expect(t.plan!.p!.hand).toHaveLength(PLAN_START);
    expect(t.plan!.p!.hand).not.toContain(a);
    expect(t.plan!.p!.deck.slice(-2)).toEqual([a, b]);
    expect(t.plan!.p!.hand.slice(0, 2)).toEqual(s.plan!.p!.deck.slice(0, 2));
    expect(canMulligan(t, "p")).toBe(false);
    expect(() => mulligan(t, "p", [])).toThrow();
    expect(() => mulligan(s, "p", s.plan!.p!.hand.slice(0, 3))).toThrow();
    expect(() => mulligan(s, "p", ["nd_sprawl"])).toThrow();
    // „Behalten“ verbraucht den Mulligan auch.
    expect(canMulligan(mulligan(s, "p", []), "p")).toBe(false);
    // Nach Runde 1 kein Mulligan mehr.
    expect(canMulligan(playRound(s, "nd_sprawl", "nd_hand_fight").state, "p")).toBe(false);
  });
  it("KI-Mulligan tauscht höchstens 2 und behält Stand-Karten", () => {
    for (let seed = 1; seed < 40; seed++) {
      for (const id of STIL_IDS) {
        const s = newMatch({ seed, plan: { p: DEFAULT_PLAN[id].cards } });
        const sw = aiMulligan(s.plan!.p!.hand, cardById);
        expect(sw.length).toBeLessThanOrEqual(MULLIGAN_MAX);
        for (const x of sw) expect(cardById(x)!.slots.some((sl) => sl.pos === "stand" || sl.pos === "clinch"), x).toBe(false);
      }
    }
  });
});

describe("Spielplan – Spielbarkeit", () => {
  it("Grundlagen (Aufbauen, Rahmen, Befreiungen) gehen immer; Angriffe nur gezogen", () => {
    const s = start();
    const hand = s.plan!.p!.hand;
    for (const l of legalCards(s, "p")) {
      const c = cardById(l.id)!;
      const basic = isBasic(c, s.pos, "neutral");
      if (basic) expect(planBlock(s, "p", c), l.id).toBeNull();
      else if (hand.includes(l.id)) expect(planBlock(s, "p", c)).toBeNull();
      else expect(l.ok, l.id).toBe(false);
    }
    const notDrawn = R.find((id) => !hand.includes(id) && cardById(id)!.slots.some((sl) => sl.pos === "stand"));
    if (notDrawn) expect(legalCards(s, "p").find((l) => l.id === notDrawn)?.reason).toBe("Noch nicht gezogen");
    const foreign = slotCards("stand", "neutral").find((c) => !isBasic(c, "stand", "neutral") && !R.includes(c.id));
    if (foreign) expect(legalCards(s, "p").find((l) => l.id === foreign.id)?.reason).toBe("Nicht in deinem Spielplan");
  });
  it("unten in Side Control: alle Befreiungen und Rahmen ohne Plan spielbar (nie festgesteckt)", () => {
    const s = newMatch({ seed: 3, plan: { p: R }, start: { pos: "side", top: "o", board: { kopf: 2, arme: 2, huefte: 2, beine: 2 } } });
    s.p.kraft = 5;
    const ok = legalCards(s, "p").filter((l) => l.ok).map((l) => l.id);
    expect(ok.length).toBe(slotCards("side", "bottom").length);
  });
  it("Geübt: ein gezogener Angriff braucht in seiner Zone 1 weniger (ohne Plan unverändert)", () => {
    const c = cardById("nd_double_leg")!; // Beine ≥ 0
    const s = newMatch({ seed: 1, plan: { p: ["nd_double_leg", ...R.filter((x) => x !== "nd_double_leg")] } });
    const drawn = s.plan!.p!.hand.includes(c.id);
    const plain = newMatch({ seed: 1 });
    expect(needIn(plain, "p", c, c.zone)).toBe(c.requires![c.zone]);
    if (drawn) expect(needIn(s, "p", c, c.zone)).toBe(c.requires![c.zone]! - 1);
    const forced: State2 = { ...s, plan: { p: { hand: [c.id], deck: [], mulligan: true } } };
    expect(needIn(forced, "p", c, c.zone)).toBe(c.requires![c.zone]! - 1);
  });
});

describe("Spielplan – keine Spickerei (B55)", () => {
  it("öffentliche Sicht: eigener Stapel leer, vom Gegner nur sein ganzer Plan", () => {
    const s = start();
    const v = publicView(s, "p");
    expect(v.plan!.p!.deck).toEqual([]);
    expect(v.plan!.p!.hand).toEqual(s.plan!.p!.hand);
    expect([...v.plan!.o!.hand].sort()).toEqual([...D].sort());
  });
  it("die KI spielt nur gezogene Angriffe oder Grundlagen", () => {
    for (let seed = 1; seed <= 12; seed++) {
      const rng = mulberry32(seed);
      let s = newMatch({ seed, plan: { p: R, o: D }, stil: { p: "ringer", o: "druecker" } });
      while (!s.result) {
        const ids = { p: aiChoose(s, "p", 3, rng), o: aiChoose(s, "o", 2, rng) };
        for (const side of ["p", "o"] as const) {
          const id = ids[side].split("&")[0];
          const c = cardById(id);
          if (c) expect(isBasic(c, s.pos, s.top === null ? "neutral" : s.top === side ? "top" : "bottom") || s.plan![side]!.hand.includes(id), `${seed} ${side} ${id}`).toBe(true);
        }
        s = playRound(s, ids.p, ids.o).state;
      }
    }
  });
  it("Sim: Plan-Kämpfe laufen, Ende zählt gespielte Plan-Karten", () => {
    let taps = 0, w = 0, l = 0;
    for (let i = 0; i < 40; i++) {
      const pp = i % 2 === 0;
      const plan = { ...stilPlayer(3, "ringer"), plan: R }, full = stilPlayer(3, "ringer");
      const m = pp ? simMatch(plan, full, 500 + i) : simMatch(full, plan, 500 + i);
      if (m.state.result?.type === "tap") taps++;
      const win = m.state.result?.winner;
      if (win) { if ((win === "p") === pp) w++; else l++; }
      const pc = planPlayed(m.state, pp ? "p" : "o", R);
      expect(pc.total).toBe(PLAN_SIZE);
      expect(pc.played).toBeLessThanOrEqual(PLAN_SIZE);
    }
    const share = w / Math.max(1, w + l);
    console.info(`[plan] Ringer-Plan gegen volle Hand ${(100 * share).toFixed(0)} %, Taps ${taps}/40`);
    expect(share).toBeGreaterThanOrEqual(0.2);
    expect(share).toBeLessThanOrEqual(0.65);
  });
});
