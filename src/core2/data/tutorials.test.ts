import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mulberry32 } from "../../engine/rng";
import { aiChoose, legalCards, newMatch, playRound, roleOf, setCardRegistry } from "../engine";
import type { Side, State2 } from "../types";
import type { TutorialK2Def } from "../ui/tutorialTypes";
import { CARD2, SLOTS2 } from "./cards";
import { TUTORIALS_K2 } from "./tutorials";

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

const SUB_CARD: Record<string, string> = { americana: "mt_americana", armbar: "mt_armbar", kimura: "sct_kimura" };

/** Vernünftiger Neuling, der den Hinweisen folgt. */
function policy(t: TutorialK2Def, s: State2, rng: () => number): string {
  const ok = legalCards(s, "p").filter((l) => l.ok).map((l) => l.id);
  if (t.id === "k2-erst-griff-dann-beenden") {
    // „Bleib bei einem Griff, bis er sitzt“ – dann Americana/Armbar, sonst Arm isolieren.
    const mine = s.subs.filter((x) => x.owner === "p").sort((a, b) => b.step - a.step);
    for (const x of mine) if (ok.includes(SUB_CARD[x.id])) return SUB_CARD[x.id];
    for (const id of ["mt_americana", "mt_armbar"]) if (ok.includes(id)) return id;
    if (s.pos === "mount" && ok.includes("mt_isolate")) return "mt_isolate";
  }
  return aiChoose(s, "p", 3, rng);
}

function run(t: TutorialK2Def, oSeed: number, pSeed: number) {
  let s = newMatch({ seed: oSeed, maxRounds: t.maxRounds, start: t.start, goal: t.goal, grips: t.grips });
  const oRng = mulberry32(oSeed || 1); // ArenaK2: mulberry(seed || 1)
  const pRng = mulberry32(pSeed ^ 0x9e3779b9);
  const log: string[] = [];
  while (!s.result) {
    const req = requiredCard(t, s.round);
    if (req) {
      const l = legalCards(s, "p").find((x) => x.id === req);
      expect(l?.ok, `${t.id} Runde ${s.round}: ${req} muss spielbar sein (seed ${oSeed}) – ${l?.reason ?? "nicht im Slot"}`).toBe(true);
    }
    const p = req ?? policy(t, s, pRng);
    const o = aiChoose(s, "o", t.aiLevel, oRng);
    const r = playRound(s, p, o);
    log.push(`${r.round.round}: ${p} / ${o} → ${r.state.pos}`);
    s = r.state;
  }
  return { s, log };
}

const reached = (t: TutorialK2Def, s: State2) =>
  t.goal ? s.result?.type === "goal" && s.result.winner === "p" : s.result?.type === "tap" && s.result.winner === "p";

describe("Kern 2 – Tutorials: Daten", () => {
  it("drei Lektionen in Danaher-Reihenfolge, eindeutige IDs", () => {
    expect(TUTORIALS_K2.map((t) => t.id)).toEqual(["k2-raus-von-unten", "k2-keile-vorbeigehen", "k2-erst-griff-dann-beenden"]);
    const [l1, l2, l3] = TUTORIALS_K2;
    expect(l1.start).toMatchObject({ pos: "mount", top: "o" });
    expect(l2.start).toMatchObject({ pos: "guard", top: "p" });
    expect(["side", "mount"]).toContain(l3.start.pos);
    expect(l3.start.top).toBe("p");
    expect(l3.seed).toBeTypeOf("number");
    for (const t of TUTORIALS_K2) expect(t.aiLevel).toBe(1);
  });

  it("Ziele und Startlagen sind gültige Slots", () => {
    for (const t of TUTORIALS_K2) {
      const s = newMatch({ seed: 1, start: t.start, grips: t.grips });
      expect(VALID_SLOT.has(`${s.pos}:${roleOf(s, "p")}`), t.id).toBe(true);
      for (const g of t.goal ?? []) expect(VALID_SLOT.has(`${g.pos}:${g.role}`), `${t.id} goal`).toBe(true);
      for (const v of Object.values(t.start.board ?? {})) expect(Math.abs(v!)).toBeLessThanOrEqual(2);
    }
  });

  it("Lektion 1 startet leicht gegen dich", () => {
    const b = TUTORIALS_K2[0].start.board ?? {};
    expect(Object.values(b).reduce((a, v) => a! + v!, 0)).toBeLessThan(0);
  });

  it("referenzierte Karten existieren und passen in den Startslot ihrer Runde", () => {
    for (const t of TUTORIALS_K2) {
      for (const st of t.steps) {
        if (!st.requireCard) continue;
        const c = CARD2[st.requireCard];
        expect(c, st.requireCard).toBeDefined();
        expect(st.round, `${t.id}: requireCard braucht eine Runde`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("Texte: ≤ 25 Wörter pro Schritt, Idee ≤ 15 Wörter, du-Form", () => {
    for (const t of TUTORIALS_K2) {
      expect(words(t.idea), t.idea).toBeLessThanOrEqual(15);
      for (const st of t.steps) {
        expect(words(st.text), st.text).toBeLessThanOrEqual(25);
        expect(st.text).not.toMatch(/\bSie\b|\bIhr(e|en)?\b/);
      }
      expect(t.steps.some((st) => /\b(du|dein|deine|dich|dir)\b/i.test(st.text)), t.id).toBe(true);
    }
  });

  it("Lektion 3 endet mit dem Loslass-Hinweis", () => {
    const l3 = TUTORIALS_K2[2];
    expect(l3.steps.some((st) => st.when === "after" && /loslassen/i.test(st.text))).toBe(true);
  });
});

describe("Kern 2 – Tutorials: mit echter Engine lösbar", () => {
  it("Lektion 1: Runde 1 Rahmen (Knie innen), Runde 2 Befreiung ist spielbar; Ziel ≥ 90 %", () => {
    const t = TUTORIALS_K2[0];
    let ok = 0;
    for (const seed of SEEDS) {
      const { s, log } = run(t, seed, seed);
      expect(log[0], `seed ${seed}`).toMatch(/^1: mb_knee_inside/);
      if (reached(t, s)) ok++;
      // Befreiung führt aus dem Mount heraus (Half Guard unten oder Guard).
      if (reached(t, s)) expect(["half", "guard"]).toContain(s.pos);
    }
    expect(ok / SEEDS.length).toBeGreaterThanOrEqual(0.9);
  });

  it("Lektion 2: Keil an den Beinen macht den Pass spielbar; Ziel ≥ 90 %", () => {
    const t = TUTORIALS_K2[1];
    let ok = 0;
    for (const seed of SEEDS) {
      let s = newMatch({ seed, start: t.start, goal: t.goal, grips: t.grips });
      const passes = () => legalCards(s, "p").filter((l) => l.ok && (l.id === "gt_knee_slice" || l.id === "gt_toreando"));
      expect(passes(), "vor dem Keil kein Pass").toHaveLength(0);
      s = playRound(s, "gt_open_guard", aiChoose(s, "o", 1, mulberry32(seed))).state;
      expect(passes().length, `seed ${seed}: Pass nach Keil`).toBeGreaterThan(0);
      if (reached(t, run(t, seed, seed).s)) ok++;
    }
    expect(ok / SEEDS.length).toBeGreaterThanOrEqual(0.9);
  });

  it("Lektion 3 (fester Seed): Tap in 100 % der Spielerläufe, Robustheit ≥ 90 % über andere Seeds", () => {
    const t = TUTORIALS_K2[2];
    for (const pSeed of SEEDS) {
      const { s, log } = run(t, t.seed!, pSeed);
      expect(reached(t, s), `pSeed ${pSeed}: ${log.join(" | ")}`).toBe(true);
      expect(s.history.length).toBeLessThanOrEqual(t.maxRounds ?? 8);
    }
    let ok = 0;
    for (const seed of SEEDS) if (reached(t, run(t, seed, seed).s)) ok++;
    expect(ok / SEEDS.length).toBeGreaterThanOrEqual(0.9);
  });

  it("requireCard-Karten liegen im Slot ihrer Runde (geprüft im Lauf)", () => {
    for (const t of TUTORIALS_K2) {
      const { s } = run(t, t.seed ?? 7, 7);
      for (const r of s.history) {
        const req = requiredCard(t, r.round);
        if (!req) continue;
        expect(r.pCard).toBe(req);
        const side: Side = "p";
        const role = r.topBefore === null ? "neutral" : r.topBefore === side ? "top" : "bottom";
        expect(CARD2[req].slots.some((sl) => sl.pos === r.posBefore && sl.role === role), `${t.id} ${req}`).toBe(true);
      }
    }
  });
});
