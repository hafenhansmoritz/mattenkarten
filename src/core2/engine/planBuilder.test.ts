// Mechanik 7 „Spielplan-Bauer“ (Spec B57–B62): System-Prüfung, Kurve, Speichern/Teilen, Sideboard, Ende-Auswertung.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { setCardRegistry, cardById, allCards } from "./registry";
import { isPlanCard } from "./plan";
import {
  CURVE_MAX_HEAVY, SIDEBOARD_MAX, applySideboard, planCost, planCurve, planGraph, planPaths, planValid, randomValidPlan, recommendSwaps,
  suggestFix, systemCheck,
} from "./planBuilder";
import { simMatch, stilPlayer } from "./sim";
import {
  BOSS_PLANS, BOSS_SIDEBOARD, DEFAULT_PLAN, DEFAULT_PLANS, LEIH_MIN, MY_PLANS_KEY, MY_PLANS_MAX, availablePlanCards, deleteMyPlan,
  planName, readMyPlans, saveMyPlan, stilCards, stilOfPlanId,
} from "../data/plans";
import { decodePlan, encodePlan, planCardHash, planLink } from "../data/planCode";
import { STIL_IDS } from "./stil";
import { mulberry32 } from "../../engine/rng";

const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: Pick<Storage, "getItem" | "setItem" | "removeItem" | "clear"> }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => { mem.set(k, v); },
  removeItem: (k: string) => { mem.delete(k); },
  clear: () => mem.clear(),
};
beforeAll(() => setCardRegistry(null));
afterAll(() => setCardRegistry(null));

const basics = () => allCards().filter((c) => !isPlanCard(c));
const pool = () => allCards().filter(isPlanCard).map((c) => c.id);
const sys = (ids: string[]) => systemCheck(ids, cardById, basics());
const words = (t: string) => t.split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length;

describe("System-Prüfung (Erreichbarkeit)", () => {
  it("alle Standard- und Boss-Pläne bestehen; Standard-Pläne ohne Lücken, ohne tote Karten, Kurve ok", () => {
    for (const p of DEFAULT_PLANS) {
      const r = sys(p.cards);
      expect(r.ok, p.id).toBe(true);
      expect(r.gaps, p.id).toEqual([]);
      expect(r.dead, p.id).toEqual([]);
      expect(Object.values(r.stages).filter((v) => v === "gap"), p.id).toEqual([]);
      expect(planCurve(p.cards, cardById).tooHeavy, p.id).toBe(false);
    }
    for (const id of STIL_IDS) expect(sys(BOSS_PLANS[id].cards).ok, id).toBe(true);
  });
  it("Graph: vom Stand über eigene Positionswechsel; ohne Takedown bleibt der Boden unerreichbar", () => {
    const { reach } = planGraph(["nd_single_leg", "ht_pass"], cardById);
    expect([...reach].sort()).toEqual(["half/top", "side/top", "stand/neutral"]);
    const noGround = planGraph(["nd_clinch_entry", "sct_kimura"], cardById);
    expect(noGround.reach.has("side/top")).toBe(false);
  });
  it("Regeln: Boden, ≥ 2 Wege nach vorn, ≥ 3 erreichbare Aufgaben, jede Aufgabe erreichbar", () => {
    // Nur Stand-Karten und Aufgaben: kein Weg zum Boden, Aufgaben unerreichbar.
    const r = sys(["nd_clinch_entry", "sct_kimura", "mt_armbar", "bt_rnc"]);
    expect(r.rules.find((x) => x.id === "boden")!.ok).toBe(false);
    expect(r.rules.find((x) => x.id === "erreichbar")!.ok).toBe(false);
    expect(r.unreachableFinishes.sort()).toEqual(["bt_rnc", "mt_armbar", "sct_kimura"]);
    expect(r.stages.boden).toBe("gap");
    // Der Ringer-Plan ohne Pässe: Boden ja, nach vorn zu wenig.
    const noPass = DEFAULT_PLAN.ringer.cards.filter((id) => !["gt_knee_slice", "gt_toreando", "gt_body_lock", "ht_pass", "ht_knee_slide", "cl_body_lock"].includes(id));
    const r2 = sys(noPass);
    expect(r2.rules.find((x) => x.id === "boden")!.ok).toBe(true);
    expect(r2.ok).toBe(false);
    expect(r2.unreachableFinishes.length).toBeGreaterThan(0);
  });
  it("Rückenaufgabe ohne Weg zum Rücken wird erkannt; Rückennahme schließt die Lücke", () => {
    const base = DEFAULT_PLAN.ringer.cards.filter((id) => id !== "sct_arm_triangle");
    const r = sys([...base, "bt_rnc"]);
    expect(r.unreachableFinishes).toEqual(["bt_rnc"]);
    expect(r.ok).toBe(false);
    const fixed = sys([...base.filter((id) => id !== "gt_toreando"), "mt_to_back", "bt_rnc"]);
    expect(fixed.unreachableFinishes).toEqual([]);
  });
  it("Sackgasse Guard unten: ‚Du hast keinen Weg aus der Guard nach oben – nimm einen Sweep.‘ + Fix-Vorschlag", () => {
    const g = DEFAULT_PLAN.guard.cards.filter((id) => id !== "gb_butterfly_sweep");
    const r = sys(g);
    expect(r.gaps.map((x) => x.text)).toContain("Du hast keinen Weg aus der Guard nach oben – nimm einen Sweep.");
    expect(r.stages.kontrolle).toBe("gap");
    const fix = suggestFix(g, pool(), cardById, basics());
    expect(fix).not.toBeNull();
    expect(fix!.text).toMatch(/Guard nach oben/);
    expect(words(fix!.text)).toBeLessThanOrEqual(25);
    expect(sys([...g, fix!.add].filter((x) => x !== fix!.remove)).gaps.length).toBeLessThan(r.gaps.length);
  });
  it("planValid = 15 Karten + System; zufälliger gültiger Plan ist gültig", () => {
    expect(planValid(DEFAULT_PLAN.guard.cards, cardById, basics())).toBe(true);
    expect(planValid(DEFAULT_PLAN.guard.cards.slice(0, 14), cardById, basics())).toBe(false);
    const g = randomValidPlan(mulberry32(3), pool(), cardById, basics());
    expect(g).not.toBeNull();
    expect(planValid(g!, cardById, basics())).toBe(true);
  });
});

describe("Kurve", () => {
  it("Kosten = Atem + Keile vorher; Hinweis bei mehr als 6 Karten mit Kosten ≥ 2", () => {
    expect(planCost(cardById("nd_single_leg")!)).toBe(0);
    expect(planCost(cardById("nd_double_leg")!)).toBe(1);
    expect(planCost(cardById("sct_kimura")!)).toBe(4);
    const heavy = pool().filter((id) => planCost(cardById(id)!) >= 2);
    expect(heavy.length).toBeGreaterThan(CURVE_MAX_HEAVY);
    const six = planCurve(heavy.slice(0, 6), cardById);
    expect(six.tooHeavy).toBe(false);
    const seven = planCurve(heavy.slice(0, 7), cardById);
    expect(seven.heavy).toBe(7);
    expect(seven.tooHeavy).toBe(true);
    expect(seven.bins.reduce((a, b) => a + b, 0)).toBe(7);
  });
});

describe("Speichern, Laden, Teilen", () => {
  beforeEach(() => localStorage.clear());
  it("bis zu 5 Pläne speichern, umbenennen, löschen; Name und Stil kommen zurück", () => {
    for (let i = 0; i < MY_PLANS_MAX; i++) saveMyPlan({ id: `p${i}`, name: `Plan ${i}`, stil: STIL_IDS[i % 4], cards: DEFAULT_PLAN[STIL_IDS[i % 4]].cards });
    expect(readMyPlans()).toHaveLength(MY_PLANS_MAX);
    expect(() => saveMyPlan({ id: "p9", name: "zu viel", stil: "guard", cards: DEFAULT_PLAN.guard.cards })).toThrow(/Höchstens 5/);
    saveMyPlan({ id: "p1", name: "  Neuer Name  ", stil: "guard", cards: DEFAULT_PLAN.guard.cards });
    expect(readMyPlans().find((p) => p.id === "p1")!.name).toBe("Neuer Name");
    expect(planName({ id: "p1", cards: [] })).toBe("Neuer Name");
    expect(stilOfPlanId("p1")).toBe("guard");
    expect(deleteMyPlan("p0")).toHaveLength(MY_PLANS_MAX - 1);
    expect(JSON.parse(localStorage.getItem(MY_PLANS_KEY)!).plans).toHaveLength(MY_PLANS_MAX - 1);
  });
  it("kaputter Speicher → leere Liste", () => {
    localStorage.setItem(MY_PLANS_KEY, "{kaputt");
    expect(readMyPlans()).toEqual([]);
    localStorage.setItem(MY_PLANS_KEY, JSON.stringify({ plans: [{ id: 1 }, { id: "x", name: "y", stil: "ninja", cards: [] }] }));
    expect(readMyPlans()).toEqual([]);
  });
  it("Code-Roundtrip (auch als Link), Reihenfolge egal, kaputte Codes → null", () => {
    for (const p of [...DEFAULT_PLANS, ...Object.values(BOSS_PLANS)]) {
      const code = encodePlan(p.cards, p.stil);
      const back = decodePlan(code)!;
      expect(back.stil).toBe(p.stil);
      expect(back.unknown).toBe(0);
      expect([...back.cards].sort()).toEqual([...p.cards].sort());
      expect(encodePlan([...p.cards].reverse(), p.stil)).toBe(code);
      expect(decodePlan(planLink(p.cards, p.stil, "https://x.de"))!.cards.sort()).toEqual([...p.cards].sort());
    }
    const code = encodePlan(DEFAULT_PLAN.ringer.cards, "ringer");
    expect(decodePlan(code.slice(0, -2) + (code.endsWith("AA") ? "BB" : "AA"))).toBeNull();
    expect(decodePlan("MK1-abc")).toBeNull();
    expect(decodePlan("")).toBeNull();
  });
  it("Karten-Hashes ohne Kollision", () => {
    const hs = allCards().map((c) => planCardHash(c.id));
    expect(new Set(hs).size).toBe(hs.length);
  });
  it("Leihkarten: kleine Sammlung → Karten des Stils; große Sammlung → nur eigene", () => {
    const pc = pool();
    const small = availablePlanCards(["nd_single_leg"], pc, "ruecken");
    expect(small.small).toBe(true);
    expect(small.leih.sort()).toEqual(stilCards("ruecken").filter((id) => id !== "nd_single_leg").sort());
    // Mit Leihkarten lässt sich der Standard-Plan des Stils bauen.
    for (const id of DEFAULT_PLAN.ruecken.cards) expect([...small.owned, ...small.leih]).toContain(id);
    const big = availablePlanCards(pc.slice(0, LEIH_MIN), pc, "ruecken");
    expect(big.small).toBe(false);
    expect(big.leih).toEqual([]);
  });
});

describe("Sideboard vor dem Boss", () => {
  it("höchstens 3 Tausche, nur Karten aus dem Plan, keine doppelten", () => {
    const R = DEFAULT_PLAN.ringer.cards;
    const out = applySideboard(R, [{ out: "nd_double_leg", in: "cl_pull_guard" }]);
    expect(out).toContain("cl_pull_guard");
    expect(out).not.toContain("nd_double_leg");
    expect(out).toHaveLength(15);
    const four = [["nd_double_leg", "cl_pull_guard"], ["nd_single_leg", "gb_butterfly_sweep"], ["gt_toreando", "gb_guillotine"], ["mt_armbar", "bt_rnc"]].map(([o, i]) => ({ out: o, in: i }));
    expect(SIDEBOARD_MAX).toBe(3);
    expect(() => applySideboard(R, four)).toThrow(/Höchstens 3/);
    expect(applySideboard(R, four.slice(0, 3))).toHaveLength(15);
    expect(() => applySideboard(R, [{ out: "bt_rnc", in: "gb_armbar" }])).toThrow(/nicht im Plan/);
    expect(() => applySideboard(R, [{ out: "nd_double_leg", in: "nd_single_leg" }])).toThrow(/schon im Plan/);
  });
  it("Empfehlung: ≤ 3 Tausche, Ergebnis besteht die System-Prüfung, Tipp ≤ 20 Wörter", () => {
    for (const s of STIL_IDS) {
      const adv = BOSS_SIDEBOARD[s];
      expect(words(adv.tip), s).toBeLessThanOrEqual(20);
      for (const id of [...adv.signature, ...adv.basics, ...adv.wants, ...adv.avoid]) expect(cardById(id), id).toBeTruthy();
      for (const id of adv.basics) expect(isPlanCard(cardById(id)!), id).toBe(false);
      for (const p of DEFAULT_PLANS) {
        const sw = recommendSwaps(p.cards, adv.wants, adv.avoid, pool(), cardById, basics());
        expect(sw.length).toBeLessThanOrEqual(SIDEBOARD_MAX);
        expect(sys(applySideboard(p.cards, sw)).ok, `${p.id} gegen ${s}`).toBe(true);
        for (const x of sw) expect(adv.wants).toContain(x.in);
        const after = sys(applySideboard(p.cards, sw));
        for (const x of sw) expect([...after.dead, ...after.unreachableFinishes], `${x.in} erreichbar`).not.toContain(x.in);
      }
    }
  });
});

describe("Ende: Wege genutzt", () => {
  it("planPaths zählt erreichte Abschnitte und Treffer mit geübten Angriffen", () => {
    let full = 0, hits = 0;
    for (let i = 0; i < 30; i++) {
      const m = simMatch({ ...stilPlayer(3, "ringer"), plan: DEFAULT_PLAN.ringer.cards }, { ...stilPlayer(1, "guard"), plan: DEFAULT_PLAN.guard.cards }, 500 + i);
      const pp = planPaths(m.state, "p", DEFAULT_PLAN.ringer.cards, cardById);
      if (pp.stages.kontrolle) expect(pp.stages.boden).toBe(true); // Aufgabe geht auch ohne Boden (Guillotine aus der Kopfklammer)
      if (pp.stages.boden && pp.stages.kontrolle && pp.stages.aufgabe) full++;
      hits += pp.hits;
      expect(pp.hitCards).toBeLessThanOrEqual(pp.hits);
    }
    expect(hits / 30).toBeGreaterThan(1);
    expect(full).toBeGreaterThan(0);
  });
});
