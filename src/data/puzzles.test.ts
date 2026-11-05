import { describe, expect, it } from "vitest";
import { CARD } from "./cards";
import {
  PUZZLES, PUZZLE_CONCEPTS, dateKey, playPuzzle, practiceSet, puzzleOfDay, puzzleRole, puzzleState,
} from "./puzzles";
import { cardFitsSlot } from "../engine/state";
import { resolveReveal } from "../engine/resolve";
import { advanceStreak, liveStreak, MAX_FREEZES } from "../puzzleStore";
import type { Role } from "../engine/types";

const oppRole = (r: Role): Role => (r === "top" ? "bottom" : r === "bottom" ? "top" : "neutral");
const words = (s: string) => s.split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length;

describe("Rätsel-Daten", () => {
  it("mindestens 40 Rätsel, eindeutige IDs", () => {
    expect(PUZZLES.length).toBeGreaterThanOrEqual(40);
    expect(new Set(PUZZLES.map((p) => p.id)).size).toBe(PUZZLES.length);
  });

  it.each(PUZZLES.map((p) => [p.id, p] as const))("%s: Karten existieren und sind in der Lage spielbar", (_id, p) => {
    const role = puzzleRole(p);
    expect(CARD[p.oppCard], p.oppCard).toBeDefined();
    expect(cardFitsSlot(CARD[p.oppCard], p.pos, oppRole(role))).toBe(true);
    expect(new Set(p.options).size).toBe(3);
    expect(p.options).toContain(p.answer);
    for (const id of p.options) {
      expect(CARD[id], id).toBeDefined();
      expect(cardFitsSlot(CARD[id], p.pos, role), `${id} @ ${p.pos}/${role}`).toBe(true);
    }
    if (p.prior) {
      expect(CARD[p.prior.played]).toBeDefined();
      expect(CARD[p.prior.counteredBy]?.kind).toBe("reaktion");
    }
    expect(p.difficulty).toBeGreaterThanOrEqual(1);
    expect(p.difficulty).toBeLessThanOrEqual(3);
    expect(words(p.why), p.why).toBeLessThanOrEqual(20);
    expect(p.situation.length).toBeGreaterThan(10);
  });

  it.each(PUZZLES.map((p) => [p.id, p] as const))("%s: Lösung gewinnt mit der echten Engine, Falsche sind schlechter", (_id, p) => {
    const state = puzzleState(p);
    // direkt über resolveReveal auf dem gebauten Zustand
    const { outcome } = resolveReveal(state, p.answer, p.oppCard);
    expect(outcome.winner, `${p.answer} vs ${p.oppCard}: ${outcome.rule}`).toBe("p");
    const best = playPuzzle(p, p.answer);
    for (const id of p.options) {
      if (id === p.answer) continue;
      const r = playPuzzle(p, id);
      expect(r.score, `${id} (${r.outcome.rule}) muss schlechter sein als ${p.answer} (${best.outcome.rule})`).toBeLessThan(best.score);
    }
  });

  it("deckt alle Positionen, beide Rollen und alle Konzepte ab", () => {
    const slots = new Set(PUZZLES.map((p) => `${p.pos}|${puzzleRole(p)}`));
    for (const s of ["dist|neutral", "clinch|neutral", "fhl|top", "fhl|bottom", "guard|top", "guard|bottom",
      "side|top", "side|bottom", "mount|top", "mount|bottom", "back|top", "back|bottom"]) {
      expect(slots.has(s), s).toBe(true);
    }
    for (const c of PUZZLE_CONCEPTS) expect(PUZZLES.some((p) => p.concept === c), c).toBe(true);
    for (const d of [1, 2, 3]) expect(PUZZLES.filter((p) => p.difficulty === d).length).toBeGreaterThanOrEqual(8);
  });

  it("Dilemma mit Vorgeschichte: ohne sie würde der Konter greifen", () => {
    const p = PUZZLES.find((x) => x.id === "guardb-dilemma-armbar")!;
    const withPrior = resolveReveal(puzzleState(p), p.answer, p.oppCard).outcome;
    const without = resolveReveal(puzzleState({ ...p, prior: undefined }), p.answer, p.oppCard).outcome;
    expect(withPrior.events.some((e) => e.t === "dilemma")).toBe(true);
    expect(without.winner).toBe("o");
  });
});

describe("Tagesauswahl", () => {
  it("3 Rätsel pro Tag, leicht → schwer, deterministisch", () => {
    const a = puzzleOfDay("2026-11-05");
    expect(a.map((p) => p.difficulty)).toEqual([1, 2, 3]);
    expect(puzzleOfDay(new Date(2026, 10, 5)).map((p) => p.id)).toEqual(a.map((p) => p.id));
    expect(puzzleOfDay("2026-11-06").map((p) => p.id)).not.toEqual(a.map((p) => p.id));
  });

  it("keine Wiederholung, bevor ein Pool durch ist", () => {
    const n = PUZZLES.filter((p) => p.difficulty === 1).length;
    const seen = new Set<string>();
    const start = new Date(2026, 0, 1);
    for (let i = 0; i < n; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i);
      seen.add(puzzleOfDay(d)[0].id);
    }
    expect(seen.size).toBe(n);
  });

  it("dateKey ist lokal und stabil", () => {
    expect(dateKey(new Date(2026, 0, 9))).toBe("2026-01-09");
    expect(dateKey("2026-01-09T23:00:00Z")).toBe("2026-01-09");
  });

  it("Üben: nach Konzept, ungelöste zuerst", () => {
    const set = practiceSet("Kontern");
    expect(set.every((p) => p.concept === "Kontern")).toBe(true);
    const solvedFirst = set[0].id;
    const resorted = practiceSet("Kontern", [solvedFirst]);
    expect(resorted[resorted.length - 1].id).toBe(solvedFirst);
    expect(practiceSet(null).length).toBe(PUZZLES.length);
  });
});

describe("Streak", () => {
  const base = { streak: 0, bestStreak: 0, freezes: MAX_FREEZES, lastPlayed: null as string | null };
  it("zählt Folgetage hoch", () => {
    let s = { ...base, ...advanceStreak(base, "2026-11-01") };
    s = { ...s, ...advanceStreak(s, "2026-11-02") };
    expect(s.streak).toBe(2);
    expect(advanceStreak(s, "2026-11-02").extended).toBe(false);
  });
  it("Freezes überbrücken bis zu 2 verpasste Tage", () => {
    const s = { ...base, streak: 5, bestStreak: 5, lastPlayed: "2026-11-01" };
    const r = advanceStreak(s, "2026-11-04"); // 2 Tage verpasst
    expect(r.streak).toBe(6);
    expect(r.freezes).toBe(0);
    expect(r.usedFreezes).toBe(2);
    expect(liveStreak(s, "2026-11-04")).toBe(5);
  });
  it("zu viele verpasste Tage → neu anfangen", () => {
    const s = { ...base, streak: 5, bestStreak: 5, lastPlayed: "2026-11-01" };
    const r = advanceStreak(s, "2026-11-05");
    expect(r.streak).toBe(1);
    expect(r.bestStreak).toBe(5);
    expect(liveStreak(s, "2026-11-05")).toBe(0);
  });
  it("alle 7 Tage gibt es einen Freeze zurück", () => {
    const s = { ...base, streak: 6, bestStreak: 6, freezes: 0, lastPlayed: "2026-11-01" };
    expect(advanceStreak(s, "2026-11-02").freezes).toBe(1);
  });
});
