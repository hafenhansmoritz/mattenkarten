// Bauplan 38: Zusatz-Lektion „Guard ziehen oder Takedown?“ – Daten und Lösbarkeit mit der echten Engine.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mulberry32 } from "../../engine/rng";
import { aiChoose, legalCards, newMatch, playRound, roleOf, setCardRegistry } from "../engine";
import type { State2 } from "../types";
import { CARD2, SLOTS2 } from "./cards";
import { TUTORIAL_GUARD_ODER_TD as T, TUTORIALS_K2 } from "./tutorials";

beforeAll(() => setCardRegistry(null));
afterAll(() => setCardRegistry(null));

const SEEDS = Array.from({ length: 30 }, (_, i) => i * 101 + 7);
const words = (s: string) => s.trim().split(/\s+/).filter((w) => w !== "–" && w !== "-").length;
const VALID_SLOT = new Set(SLOTS2.map((s) => `${s.pos}:${s.role}`));

/** Neuling, der den Hinweisen folgt: Runde 1 Body Lock, danach Stufe 3 – aber nie Guard ziehen. */
const NO_PULL = { cards: { cl_pull_guard: -50 } };
function run(seed: number) {
  let s: State2 = newMatch({ seed, maxRounds: T.maxRounds, start: T.start, goal: T.goal });
  const oRng = mulberry32(seed || 1);
  const pRng = mulberry32(seed ^ 0x9e3779b9);
  const log: string[] = [];
  while (!s.result) {
    const req = T.steps.find((st) => st.when === "pick" && st.round === s.round)?.requireCard;
    if (req) expect(legalCards(s, "p").find((l) => l.id === req)?.ok, `Runde ${s.round}: ${req} spielbar (seed ${seed})`).toBe(true);
    const p = req ?? aiChoose(s, "p", 3, pRng, NO_PULL);
    const o = aiChoose(s, "o", T.aiLevel, oRng);
    const r = playRound(s, p, o);
    log.push(`${r.round.round}: ${p}/${o} → ${r.state.pos}`);
    s = r.state;
  }
  return { s, log };
}

describe("Kern 2 – Lektion „Guard ziehen oder Takedown?“", () => {
  it("eigene ID, nicht Teil der Danaher-Reihe; gültige Start- und Ziellagen", () => {
    expect(TUTORIALS_K2.some((t) => t.id === T.id)).toBe(false);
    const s = newMatch({ seed: 1, start: T.start });
    expect(VALID_SLOT.has(`${s.pos}:${roleOf(s, "p")}`)).toBe(true);
    for (const g of T.goal ?? []) {
      expect(VALID_SLOT.has(`${g.pos}:${g.role}`)).toBe(true);
      expect(g.role, "Ziel ist oben – nicht in der eigenen Guard").toBe("top");
    }
  });

  it("erklärt BJJ vs. MMA; Guard ziehen trägt mma: nein, der Takedown mma: ok", () => {
    const all = T.steps.map((st) => st.text).join(" ");
    expect(all).toMatch(/BJJ/);
    expect(all).toMatch(/MMA/);
    expect(CARD2.cl_pull_guard.mma).toBe("nein");
    expect(CARD2.cl_body_lock.mma).toBe("ok");
    expect(CARD2.cl_body_lock.to).toMatchObject({ role: "top", points: 2 });
    expect(CARD2.cl_pull_guard.to?.points ?? 0).toBe(0);
  });

  it("Texte: ≤ 25 Wörter pro Schritt, Idee ≤ 15 Wörter, du-Form", () => {
    expect(words(T.idea)).toBeLessThanOrEqual(15);
    for (const st of T.steps) {
      expect(words(st.text), st.text).toBeLessThanOrEqual(25);
      expect(st.text).not.toMatch(/\bSie\b|\bIhr(e|en)?\b/);
    }
    expect(T.steps.some((st) => /\b(du|dein|deine|dich|dir)\b/i.test(st.text))).toBe(true);
  });

  it("lösbar: Ziel (oben am Boden) in ≥ 90 % von 30 Seeds", () => {
    let ok = 0;
    for (const seed of SEEDS) {
      const { s, log } = run(seed);
      expect(log[0], `seed ${seed}`).toMatch(/^1: cl_body_lock/);
      if (s.result?.type === "goal" && s.result.winner === "p") ok++;
    }
    expect(ok / SEEDS.length).toBeGreaterThanOrEqual(0.9);
  });
});
