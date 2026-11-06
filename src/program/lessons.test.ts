import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mulberry32 } from "../engine/rng";
import { aiChoose, legalCards, newMatch, playRound, roleOf, setCardRegistry } from "../core2/engine";
import type { State2 } from "../core2/types";
import type { TutorialK2Def } from "../core2/ui/tutorialTypes";
import { CARD2, SLOTS2 } from "../core2/data/cards";
import { LESSONS_PROGRAM } from "./lessons";

beforeAll(() => setCardRegistry(null));
afterAll(() => setCardRegistry(null));

const SEEDS = Array.from({ length: 30 }, (_, i) => i * 101 + 7);
const words = (s: string) => s.trim().split(/\s+/).filter((w) => w !== "–" && w !== "-").length;
const VALID_SLOT = new Set(SLOTS2.map((s) => `${s.pos}:${s.role}`));

/** Wie ArenaK2: requireCard aus dem pick-Schritt, sonst aus der Start-Blase der Runde. */
function requiredCard(t: TutorialK2Def, round: number): string | undefined {
  const here = t.steps.filter((st) => st.round == null || st.round === round);
  return here.find((st) => st.when === "pick")?.requireCard ?? here.find((st) => st.when === "start" && st.requireCard)?.requireCard;
}

export function runLesson(t: TutorialK2Def, oSeed: number, pSeed: number) {
  let s = newMatch({ seed: oSeed, maxRounds: t.maxRounds, start: t.start, goal: t.goal, grips: t.grips, chains: t.chains });
  const oRng = mulberry32(oSeed || 1);
  const pRng = mulberry32(pSeed ^ 0x9e3779b9);
  const log: string[] = [];
  while (!s.result) {
    const req = requiredCard(t, s.round);
    if (req) {
      const l = legalCards(s, "p").find((x) => x.id === req);
      expect(l?.ok, `${t.id} Runde ${s.round}: ${req} muss spielbar sein (seed ${oSeed}) – ${l?.reason ?? "nicht im Slot"}`).toBe(true);
    }
    const p = req ?? aiChoose(s, "p", 3, pRng);
    const o = aiChoose(s, "o", t.aiLevel, oRng);
    const r = playRound(s, p, o);
    log.push(`${r.round.round}: ${p} / ${o} → ${r.state.pos}`);
    s = r.state;
  }
  return { s, log };
}

const reached = (t: TutorialK2Def, s: State2) =>
  t.goal ? s.result?.type === "goal" && s.result.winner === "p" : s.result?.type === "tap" && s.result.winner === "p";

describe("Startprogramm – neue Kern-2-Lektionen", () => {
  it("IDs eindeutig, Slots gültig, Karten existieren", () => {
    const ids = LESSONS_PROGRAM.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of LESSONS_PROGRAM) {
      const s = newMatch({ seed: 1, start: t.start, grips: t.grips, chains: t.chains });
      expect(VALID_SLOT.has(`${s.pos}:${roleOf(s, "p")}`), t.id).toBe(true);
      for (const g of t.goal ?? []) expect(VALID_SLOT.has(`${g.pos}:${g.role}`), `${t.id} goal`).toBe(true);
      for (const st of t.steps) if (st.requireCard) expect(CARD2[st.requireCard], st.requireCard).toBeDefined();
    }
  });

  it("Texte: ≤ 25 Wörter pro Schritt, Idee ≤ 15 Wörter, du-Form", () => {
    for (const t of LESSONS_PROGRAM) {
      expect(words(t.idea), t.idea).toBeLessThanOrEqual(15);
      for (const st of t.steps) {
        expect(words(st.text), st.text).toBeLessThanOrEqual(25);
        expect(st.text).not.toMatch(/\bSie\b|\bIhr(e|en)?\b/);
      }
    }
  });

  for (const t of LESSONS_PROGRAM) {
    it(`${t.title}: lösbar ≥ 90 % über 30 Seeds`, () => {
      let ok = 0;
      const fails: string[] = [];
      for (const seed of SEEDS) {
        const { s, log } = runLesson(t, seed, seed);
        if (reached(t, s)) ok++; else fails.push(`${seed}: ${log.join(" | ")} → ${JSON.stringify(s.result)}`);
      }
      expect(ok / SEEDS.length, fails.slice(0, 3).join("\n")).toBeGreaterThanOrEqual(0.9);
    });
  }
});
