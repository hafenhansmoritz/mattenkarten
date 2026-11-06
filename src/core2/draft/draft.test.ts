// Mechanik 9 „Draft“ (Spec B69–B75): Angebote, Hinweise, Coach-Tipp, Notfall-Tausch, Lauf, Speicher.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { allCards, cardById, isPlanCard, newMatch, setCardRegistry } from "../engine";
import { planGraph, systemCheck } from "../engine/planBuilder";
import { stilCards } from "../data/plans";
import { STIL_IDS } from "../engine/stil";
import { mulberry32 } from "../../engine/rng";
import {
  DRAFT_OFFER, DRAFT_PICKS, coachPick, draftFit, draftGapText, draftHint, makeOffer, notfallOptions, phaseOf, slotPhase,
} from "./draft";
import {
  BOSS_AT, NOTFALL_MAX, RUN_LOSSES, RUN_WINS, applyNotfall, foeFor, matchLog, newRun, pickCard, recordMatch, runSummary, sanitizeRun,
  type DraftCtx, type DraftRun, type MatchLog,
} from "./run";
import { DRAFT_KEY, readRun, writeRun } from "./store";

const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: Pick<Storage, "getItem" | "setItem" | "removeItem" | "clear"> }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => { mem.set(k, v); },
  removeItem: (k: string) => { mem.delete(k); },
  clear: () => mem.clear(),
};
beforeAll(() => setCardRegistry(null));
afterAll(() => setCardRegistry(null));

const ctx = (): DraftCtx => ({ pool: allCards().filter(isPlanCard).map((c) => c.id), cardOf: cardById, basics: allCards().filter((c) => !isPlanCard(c)) });
const words = (t: string) => t.split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length;
const reachableNow = (id: string, picks: string[], c: DraftCtx) => {
  const { reach } = planGraph(picks, c.cardOf, c.basics);
  return cardById(id)!.slots.some((sl) => reach.has(`${sl.pos}/${sl.role}`));
};
/** Draft bis zum Ende: Wähler pick(offer, picks) → Index. */
function draftAll(seed: number, pick: (offer: string[], picks: string[]) => number, c = ctx()): { run: DraftRun; offers: string[][] } {
  let r = newRun(seed, STIL_IDS[seed % 4], false, c);
  const offers: string[][] = [];
  while (r.phase === "draft") { offers.push(r.offer); r = pickCard(r, r.offer[pick(r.offer, r.picks)], c); }
  return { run: r, offers };
}

describe("Angebote (B70)", () => {
  it("3 verschiedene, ungewählte Karten; Phasen im Wechsel Boden → Nach vorn → Aufgabe", () => {
    const c = ctx();
    for (let seed = 1; seed <= 40; seed++) {
      const rng = mulberry32(seed);
      const { offers, run } = draftAll(seed, () => Math.floor(rng() * 3), c);
      expect(offers.length).toBe(DRAFT_PICKS);
      offers.forEach((o, i) => {
        expect(o.length).toBe(DRAFT_OFFER);
        expect(new Set(o).size).toBe(DRAFT_OFFER);
        const before = run.picks.slice(0, i);
        // nach Notfall-Tausch können picks abweichen – nur bis zum ersten Tausch prüfen
        if (run.notfallUsed === 0) for (const id of o) expect(before).not.toContain(id);
      });
    }
    expect([0, 1, 2, 3, 4, 5].map(slotPhase)).toEqual(["boden", "vorn", "aufgabe", "boden", "vorn", "aufgabe"]);
  });
  it("nie drei Karten, die alle unerreichbar sind – mindestens eine passt (auch bei Zufalls-Wahl)", () => {
    const c = ctx();
    for (let seed = 1; seed <= 150; seed++) {
      const rng = mulberry32(seed * 31);
      let r = newRun(seed, STIL_IDS[seed % 4], false, c);
      while (r.phase === "draft") {
        expect(r.offer.some((id) => reachableNow(id, r.picks, c)), `seed ${seed} pick ${r.picks.length}`).toBe(true);
        r = pickCard(r, r.offer[Math.floor(rng() * 3)], c);
      }
    }
  });
  it("kohärent: meist aus der Phase des Picks; sonst eine Brücke, die passt", () => {
    const c = ctx();
    let inPhase = 0, total = 0;
    for (let seed = 1; seed <= 60; seed++) {
      let r = newRun(seed, "guard", false, c);
      while (r.phase === "draft") {
        const o = makeOffer(r.picks, r.seed, c.pool, cardById, c.basics, stilCards("guard"));
        expect(o.cards).toEqual(r.offer);
        const ph = slotPhase(r.picks.length);
        const n = o.cards.filter((id) => phaseOf(cardById(id)!) === ph).length;
        inPhase += n; total += 3;
        if (o.bridge) expect(o.cards.some((id) => phaseOf(cardById(id)!) !== ph && reachableNow(id, r.picks, c))).toBe(true);
        r = pickCard(r, r.offer[coachPick(r.offer, r.picks, cardById, c.basics, c.pool)], c);
      }
    }
    expect(inPhase / total).toBeGreaterThan(0.75);
  });
  it("seed-fest: gleicher Seed + gleiche Picks = gleiches Angebot; anderer Seed = meist anderes", () => {
    const c = ctx();
    const picks = ["nd_double_leg", "gt_knee_slice"];
    const a = makeOffer(picks, 77, c.pool, cardById, c.basics);
    expect(makeOffer(picks, 77, c.pool, cardById, c.basics)).toEqual(a);
    const diff = [78, 79, 80, 81, 82].filter((s) => JSON.stringify(makeOffer(picks, s, c.pool, cardById, c.basics).cards) !== JSON.stringify(a.cards));
    expect(diff.length).toBeGreaterThan(2);
    expect(newRun(5, "ringer", false, c).offer).toEqual(newRun(5, "ringer", false, c).offer);
  });
  it("kein Pick außerhalb des Angebots", () => {
    const c = ctx();
    const r = newRun(1, "ringer", false, c);
    const outside = c.pool.find((id) => !r.offer.includes(id))!;
    expect(() => pickCard(r, outside, c)).toThrow();
  });
});

describe("Hinweise (B71) und Coach-Tipp (B72)", () => {
  const c = ctx();
  const h = (id: string, picks: string[]) => draftHint(id, picks, cardById, c.basics, c.pool);
  it("erster Pick: Takedown passt, Guard ziehen ist eine Lücke mit Brücken-Vorschlag", () => {
    expect(h("nd_double_leg", [])).toEqual({ ok: true, text: "Passt, weil du aus dem Stand in seine Guard kommst." });
    const pg = h("cl_pull_guard", []);
    expect(pg.ok).toBe(false);
    expect(pg.text).toBe("Lücke: Du kommst noch nicht in den Clinch – z. B. mit „Ranrücken und festhalten“.");
  });
  it("Aufgabe, zweiter Weg, Folge-Lage – Texte erklären mit Positions-Logik", () => {
    const p = ["nd_double_leg", "gt_knee_slice"];
    expect(h("sct_kimura", p).text).toBe("Passt, weil du in Side Control kommst – dort beendest du.");
    expect(h("gt_toreando", p).text).toBe("Passt: zweiter Weg in Side Control neben „Knie schneidet durch“ – blockt er einen, nimmst du den anderen.");
    expect(h("sct_to_mount", [...p, "mt_armbar"]).text).toBe("Passt, weil du aus Side Control in den Mount kommst – dort wartet schon „Arm strecken von oben“.");
    expect(h("sct_americana", [...p, "sct_kimura"]).text).toMatch(/^Passt: zweite Aufgabe in Side Control/);
    const rnc = h("bt_rnc", p);
    expect(rnc.ok).toBe(false);
    expect(rnc.text).toMatch(/^Lücke: Du kommst noch nicht an seinen Rücken/);
  });
  it("jeder Hinweis: „Passt …“ oder „Lücke: …“, höchstens 20 Wörter, ok genau dann, wenn erreichbar", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const rng = mulberry32(seed);
      let r = newRun(seed, STIL_IDS[seed % 4], false, c);
      while (r.phase === "draft") {
        for (const id of r.offer) {
          const x = h(id, r.picks);
          expect(x.text).toMatch(x.ok ? /^Passt[,:]/ : /^Lücke: /);
          expect(words(x.text), x.text).toBeLessThanOrEqual(20);
          expect(x.ok).toBe(reachableNow(id, r.picks, c));
        }
        r = pickCard(r, r.offer[Math.floor(rng() * 3)], c);
      }
    }
  });
  it("Coach-Tipp wählt eine passende Karte, wenn es eine gibt, und bevorzugt, was die Kette schließt", () => {
    expect(draftFit("nd_double_leg", [], cardById, c.basics, c.pool)).toBeGreaterThan(draftFit("cl_pull_guard", [], cardById, c.basics, c.pool));
    const p = ["nd_double_leg", "gt_knee_slice"];
    expect(coachPick(["bt_rnc", "sct_kimura", "mt_armbar"], p, cardById, c.basics, c.pool)).toBe(1);
  });
  it("Coach-Wähler besteht die System-Prüfung fast immer (≥ 95 %)", () => {
    let ok = 0;
    const n = 80;
    for (let seed = 1; seed <= n; seed++) {
      const { run } = draftAll(seed, (o, p) => coachPick(o, p, cardById, c.basics, c.pool), c);
      if (run.phase === "run") ok++;
    }
    expect(ok / n).toBeGreaterThanOrEqual(0.95);
  });
});

describe("Notfall-Tausch (B73)", () => {
  const c = ctx();
  // Ein Plan ohne Weg nach vorn am Boden: nur Stand-Karten und Aufgaben.
  const broken = ["nd_double_leg", "nd_single_leg", "nd_clinch_entry", "cl_snap_down", "nd_arm_drag", "cl_body_lock", "cl_pull_guard",
    "gb_armbar", "gb_triangle", "gb_guillotine", "hl_guillotine", "hl_go_behind", "sct_kimura", "mt_armbar", "bt_rnc"];
  it("bietet bis zu 3 Tausche, nach denen die Prüfung besteht; Text nennt die Lücke", () => {
    expect(systemCheck(broken, cardById, c.basics).ok).toBe(false);
    const n = notfallOptions(broken, c.pool, cardById, c.basics);
    expect(n.swaps.length).toBeGreaterThan(0);
    expect(n.swaps.length).toBeLessThanOrEqual(3);
    for (const sw of n.swaps) expect(broken).toContain(sw.out);
    if (n.fixes) for (const sw of n.swaps) expect(systemCheck(broken.map((x) => (x === sw.out ? sw.in : x)), cardById, c.basics).ok).toBe(true);
    expect(draftGapText(broken, cardById, c.basics)).toBeTruthy();
  });
  it("Zufalls-Drafts: nach dem Notfall-Tausch ist jeder Plan gültig, meist nach einem Tausch", () => {
    let one = 0, need = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const rng = mulberry32(seed * 7);
      let { run } = draftAll(seed, () => Math.floor(rng() * 3), c);
      if (run.phase === "notfall") need++;
      let k = 0;
      while (run.phase === "notfall") { run = applyNotfall(run, 0, c); k++; }
      expect(k).toBeLessThanOrEqual(NOTFALL_MAX);
      if (k === 1) one++;
      expect(systemCheck(run.picks, cardById, c.basics).ok, `seed ${seed}`).toBe(true);
      expect(run.phase).toBe("run");
    }
    expect(one).toBeGreaterThanOrEqual(need * 0.9);
  });
  it("applyNotfall nur im Notfall", () => {
    const r = newRun(1, "ringer", false, c);
    expect(() => applyNotfall(r, 0, c)).toThrow();
  });
});

describe("Lauf (B74) und Ende (B75)", () => {
  const c = ctx();
  const done = () => draftAll(3, (o, p) => coachPick(o, p, cardById, c.basics, c.pool), c).run;
  const log = (result: MatchLog["result"], chain: string[] = [], tap = false): Omit<MatchLog, "foe"> =>
    ({ result, chain, tap, stages: { boden: chain.length > 0, kontrolle: chain.length > 1, aufgabe: tap }, hit: chain });
  it("Gegner: Stufe 2, 2, dann 3; der 5. ist ein Boss mit Signatur-Plan; seed-fest", () => {
    const r = done();
    expect(r.phase).toBe("run");
    const foes = [0, 1, 2, 3, 4, 5].map((n) => foeFor(r, n, c));
    expect(foes.map((f) => f.level).slice(0, 4)).toEqual([2, 2, 3, 3]);
    expect(foes[BOSS_AT].boss).toBeTruthy();
    expect(foes.filter((f) => f.boss).length).toBe(1);
    for (const f of foes) expect(f.plan.length).toBe(15);
    expect(foeFor(r, 3, c)).toEqual(foeFor(r, 3, c));
  });
  it("bis 7 Siege oder 3 Niederlagen; Unentschieden zählt als Niederlage; danach keine Kämpfe mehr", () => {
    let r = done();
    for (let i = 0; i < RUN_WINS; i++) r = recordMatch(r, log("win", ["nd_double_leg"]), c);
    expect(r.phase).toBe("done");
    expect(r.next).toBeNull();
    expect(() => recordMatch(r, log("win"), c)).toThrow();
    let q = done();
    q = recordMatch(q, log("win"), c);
    q = recordMatch(q, log("draw"), c);
    q = recordMatch(q, log("loss"), c);
    expect(q.phase).toBe("run");
    q = recordMatch(q, log("loss"), c);
    expect(q).toMatchObject({ phase: "done", wins: 1, losses: RUN_LOSSES });
    expect(q.matches.map((m) => m.foe.level)).toEqual([2, 2, 3, 3]);
  });
  it("Zusammenfassung: beste Kette (Tap zählt mit), Wege genutzt, getroffene Karten", () => {
    let r = done();
    r = recordMatch(r, log("win", ["nd_double_leg", "gt_knee_slice"]), c);
    r = recordMatch(r, log("win", ["nd_single_leg", "ht_pass", "sct_kimura"], true), c);
    r = recordMatch(r, log("loss", ["nd_double_leg"]), c);
    const s = runSummary(r);
    expect(s.best?.chain).toEqual(["nd_single_leg", "ht_pass", "sct_kimura"]);
    expect(s.best?.tap).toBe(true);
    expect(s.stages).toEqual({ boden: true, kontrolle: true, aufgabe: true });
    expect(s.hitCards).toBe(5);
    expect(s.taps).toBe(1);
  });
  it("matchLog: Ergebnis aus dem Endzustand", () => {
    const s = newMatch({ seed: 1 });
    expect(matchLog({ ...s, result: { type: "points", winner: "p" } } as never, "p", [], cardById).result).toBe("win");
    expect(matchLog({ ...s, result: { type: "points", winner: null } } as never, "p", [], cardById).result).toBe("draw");
    expect(matchLog({ ...s, result: { type: "tap", winner: "o", sub: "x" } } as never, "p", [], cardById).result).toBe("loss");
  });
  it("Speicher: Lauf übersteht Neuladen; kaputte Daten werden verworfen", () => {
    const r = newRun(9, "druecker", true, c);
    writeRun(r);
    expect(mem.has(DRAFT_KEY)).toBe(true);
    expect(readRun((id) => !!cardById(id))).toEqual(r);
    const d = done();
    writeRun(d);
    expect(readRun((id) => !!cardById(id))).toEqual(d);
    mem.set(DRAFT_KEY, "{kaputt");
    expect(readRun(() => true)).toBeNull();
    expect(sanitizeRun({ ...r, picks: ["gibts_nicht"] }, (id) => !!cardById(id))).toBeNull();
    expect(sanitizeRun({ ...r, wins: 99 }, (id) => !!cardById(id))).toBeNull();
    writeRun(null);
    expect(mem.has(DRAFT_KEY)).toBe(false);
  });
});
