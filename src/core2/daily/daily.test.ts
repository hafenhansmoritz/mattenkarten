import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mulberry32 } from "../../engine/rng";
import { aiChoose, cardById, legalCards, newMatch, playRound, setCardRegistry } from "../engine";
import { SLOTS2 } from "../data/cards";
import { DAILY_POOL, dailyFor, dailySuccess, dateKey, seedOf, toTutorial, type DailyDef } from "./daily";

beforeAll(() => setCardRegistry(null));
afterAll(() => setCardRegistry(null));

const VALID_SLOT = new Set(SLOTS2.map((s) => `${s.pos}:${s.role}`));

function run(def: DailyDef, seed: number, pSeed: number) {
  const t = toTutorial(def, seed);
  let s = newMatch({ seed, maxRounds: t.maxRounds, start: t.start, goal: t.goal });
  const oRng = mulberry32(seed || 1);
  const pRng = mulberry32(pSeed ^ 0x9e3779b9);
  while (!s.result) {
    // Spieler, der die Aufgabe liest: führt eine spielbare Karte direkt ins Ziel, nimmt er sie.
    const ok = legalCards(s, "p").filter((l) => l.ok).map((l) => cardById(l.id)!);
    const toGoal = ok.find((c) => c.to && def.goal?.some((g) => g.pos === c.to!.pos && g.role === c.to!.role));
    const p = toGoal ? toGoal.id : ok.length ? aiChoose(s, "p", 3, pRng) : "pass";
    const o = legalCards(s, "o").some((l) => l.ok) ? aiChoose(s, "o", def.aiLevel, oRng) : "pass";
    s = playRound(s, p, o).state;
  }
  return s;
}

describe("Tages-Challenge", () => {
  it("Seed ist deterministisch und hängt nur am Datum", () => {
    expect(seedOf("2026-11-05")).toBe(seedOf("2026-11-05"));
    expect(seedOf("2026-11-05")).not.toBe(seedOf("2026-11-06"));
    const a = dailyFor("2026-11-05"), b = dailyFor("2026-11-05");
    expect(a.def.id).toBe(b.def.id);
    expect(a.seed).toBe(b.seed);
    expect(dateKey(new Date(2026, 0, 3))).toBe("2026-01-03");
  });

  it("wiederholt sich nie an zwei Tagen hintereinander und nutzt den ganzen Pool", () => {
    const seen = new Set<string>();
    let prev = "";
    for (let i = 0; i < 120; i++) {
      const k = dateKey(new Date(2026, 10, 1 + i));
      const id = dailyFor(k).def.id;
      expect(id, k).not.toBe(prev);
      prev = id; seen.add(id);
    }
    expect(seen.size).toBe(DAILY_POOL.length);
  });

  it("Pool-Daten sind gültig", () => {
    const ids = new Set<string>();
    for (const d of DAILY_POOL) {
      expect(ids.has(d.id)).toBe(false); ids.add(d.id);
      const role = d.start.top === null ? "neutral" : d.start.top === "p" ? "top" : "bottom";
      expect(VALID_SLOT.has(`${d.start.pos}:${role}`), d.id).toBe(true);
      for (const g of d.goal ?? []) expect(VALID_SLOT.has(`${g.pos}:${g.role}`), `${d.id} ${g.pos}:${g.role}`).toBe(true);
      expect(d.task.length).toBeLessThan(120);
    }
  });

  it("Erfolg: Ziel erreicht bzw. per Aufgabe gewonnen", () => {
    const esc = DAILY_POOL.find((d) => d.goal)!, fin = DAILY_POOL.find((d) => !d.goal)!;
    expect(dailySuccess(esc, { type: "goal", winner: "p" })).toBe(true);
    expect(dailySuccess(esc, { type: "points", winner: "p" })).toBe(false);
    expect(dailySuccess(esc, { type: "tap", winner: "p" })).toBe(true);
    expect(dailySuccess(esc, { type: "tap", winner: "o" })).toBe(false);
    expect(dailySuccess(fin, { type: "tap", winner: "p" })).toBe(true);
    expect(dailySuccess(fin, { type: "points", winner: "p" })).toBe(false);
    expect(dailySuccess(fin, null)).toBe(false);
  });

  it("jede Challenge ist schaffbar (guter Spieler, mehrere Tage)", () => {
    const rates: string[] = [];
    for (const d of DAILY_POOL) {
      let ok = 0; const N = 40;
      for (let i = 0; i < N; i++) if (dailySuccess(d, run(d, i * 977 + 13, i).result)) ok++;
      rates.push(`${d.id}: ${ok}/${N}`);
    }
    console.log(rates.join("\n"));
    for (const r of rates) { const [, ok] = r.match(/: (\d+)\//)!; expect(Number(ok), r).toBeGreaterThanOrEqual(10); }
  });
});
