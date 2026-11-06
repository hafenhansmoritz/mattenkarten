// Bauplan 83: Balance-Ziele als CI-Test (verkleinerte Simulation von scripts/simulate2.ts).
// 100 Matches je Paarung (L1–L3 × L1–L3), feste Seeds (Mechanik 3: vorher 60 – „kein Griff > 30 %“ lag schon ohne Ketten
// genau auf der Grenze, RNC 30,0 %; ein einziger anders verlaufender Seed kippte den Test). Toleranzen etwas weiter als in simulate2.ts,
// weil die Stichprobe kleiner ist – ein Ausreißer im Balancing bricht trotzdem den Build.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pos2 } from "../types";
import { setCardRegistry } from "./registry";
import { grundlageShare, seedStil, simMatch, stilPlayer, type SimMatch } from "./sim";
import { STIL_IDS } from "./stil";

beforeAll(() => setCardRegistry(null));
afterAll(() => setCardRegistry(null));

const N = 100;
const POS: Pos2[] = ["stand", "clinch", "headlock", "guard", "half", "turtle", "side", "mount", "back"];
type Lv = 1 | 2 | 3;

const runs: { lp: Lv; lo: Lv; m: SimMatch }[] = [];
function all() {
  if (runs.length) return runs;
  for (const lp of [1, 2, 3] as Lv[]) for (const lo of [1, 2, 3] as Lv[])
    for (let i = 0; i < N; i++) {
      // Mechanik 5: freie Matches haben auf beiden Seiten einen Spielstil (fest je Seed, wie in simulate2.ts).
      const seed = lp * 100000 + lo * 10000 + i;
      runs.push({ lp, lo, m: simMatch(stilPlayer(lp, seedStil(seed, "p")), stilPlayer(lo, seedStil(seed, "o")), seed) });
    }
  return runs;
}

describe("Kern 2 – Balance (Sim in CI)", () => {
  it("Taps gesamt 10–32 % (Mechanik 5 hebt die Abschlüsse: simulate2 verlangt 12–18 %)", () => {
    const r = all();
    const taps = r.filter((x) => x.m.state.result?.type === "tap").length / r.length;
    console.info(`[balance] Taps ${(100 * taps).toFixed(1)} %`);
    expect(taps).toBeGreaterThanOrEqual(0.1);
    expect(taps).toBeLessThanOrEqual(0.32);
  });

  it("L3 schlägt L1 in ≥ 60 % der entschiedenen Matches (beide Seiten)", () => {
    let w = 0, l = 0;
    for (const { lp, lo, m } of all()) {
      const win = m.state.result?.winner;
      if (!win) continue;
      if (lp === 3 && lo === 1) win === "p" ? w++ : l++;
      if (lp === 1 && lo === 3) win === "o" ? w++ : l++;
    }
    expect(w / (w + l)).toBeGreaterThanOrEqual(0.6);
  });

  it("jede Position wird in ≥ 2 % der Matches erreicht", () => {
    const r = all();
    const low = POS.filter((p) => r.filter((x) => x.m.reached.has(p)).length / r.length < 0.02);
    expect(low).toEqual([]);
  });

  it("kein Griff > 30 % der Taps", () => {
    const by = new Map<string, number>();
    let t = 0;
    for (const { m } of all()) {
      const res = m.state.result;
      if (res?.type !== "tap") continue;
      t++;
      by.set(res.sub, (by.get(res.sub) ?? 0) + 1);
    }
    expect(t).toBeGreaterThan(0);
    const worst = Math.max(...by.values()) / t;
    expect(worst).toBeLessThanOrEqual(0.3);
  });

  it("Didaktik (84): ≥ 25 % der Unten-Entscheidungen sind Grundlage-Karten (Rahmen, Befreiungen)", () => {
    let n = 0, bottom = 0;
    for (const { m } of all()) { const g = grundlageShare(m.picks); n += g.n; bottom += g.bottom; }
    expect(bottom).toBeGreaterThan(0);
    expect(n / bottom).toBeGreaterThanOrEqual(0.25);
  });

  it("Mechanik 5: kein Spielstil gewinnt gegen einen anderen auf gleicher Stufe > 62 % (CI-Stichprobe; simulate2: 58 %)", () => {
    const NS = 30;
    let worst = 0, at = "";
    for (const lv of [2, 3] as const) for (const a of STIL_IDS) for (const b of STIL_IDS) {
      if (a === b) continue;
      let w = 0, l = 0;
      for (let i = 0; i < NS; i++) {
        const ap = i % 2 === 0;
        const A = stilPlayer(lv, a), B = stilPlayer(lv, b);
        const m = ap ? simMatch(A, B, 7000 + i) : simMatch(B, A, 7000 + i);
        const win = m.state.result?.winner;
        if (!win) continue;
        if ((win === "p") === ap) w++; else l++;
      }
      const share = w / Math.max(1, w + l);
      if (share > worst) { worst = share; at = `${a} gegen ${b} (L${lv})`; }
    }
    console.info(`[balance] Stil-Matrix max ${(100 * worst).toFixed(1)} % – ${at}`);
    expect(worst, at).toBeLessThanOrEqual(0.62);
  }, 60000);
});
