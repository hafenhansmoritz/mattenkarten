// Bauplan 73: Bosse mit Spielstil – Daten und Simulation (verkleinert, feste Seeds).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { setCardRegistry } from "../engine";
import { roundShare, simMatch, type SimPlayer } from "../engine/sim";
import type { Side } from "../types";
import { BOSSES, type BossDef } from "./bosses";
import { CARD2 } from "./cards";

beforeAll(() => setCardRegistry(null));
afterAll(() => setCardRegistry(null));

const N = 60;
const words = (s: string) => s.trim().split(/\s+/).filter((w) => w !== "–").length;

/** Boss abwechselnd als p und o; Siege aus Boss-Sicht, Anteil der Matches mit Signatur-Lage. */
function vs(boss: SimPlayer, foe: SimPlayer, sig: string[], seed0 = 9000) {
  let w = 0, l = 0, sigHits = 0, sigR = 0, rounds = 0;
  for (let i = 0; i < N; i++) {
    const bp = i % 2 === 0;
    const m = bp ? simMatch(boss, foe, seed0 + i) : simMatch(foe, boss, seed0 + i);
    const bs: Side = bp ? "p" : "o";
    const win = m.state.result?.winner;
    if (win === bs) w++; else if (win) l++;
    if (sig.some((k) => m.slots[bs].has(k))) sigHits++;
    const rs = roundShare(m, bs, sig); sigR += rs.n; rounds += rs.rounds;
  }
  return { win: w / Math.max(1, w + l), foeWin: l / Math.max(1, w + l), sig: sigHits / N, sigRounds: sigR / Math.max(1, rounds) };
}

const asBoss = (b: BossDef): SimPlayer => ({ level: b.level, style: b.style });

describe("Kern 2 – Bosse: Daten", () => {
  it("vier Bosse in Freischalt-Reihenfolge, eindeutige IDs", () => {
    expect(BOSSES.map((b) => b.id)).toEqual(["ringer", "guard", "druecker", "ruecken"]);
  });

  it("Gewichte verweisen nur auf echte Karten", () => {
    for (const b of BOSSES) for (const k of [...Object.keys(b.style.cards ?? {}), ...Object.keys(b.counter.cards ?? {})]) expect(CARD2[k], `${b.id}: ${k}`).toBeDefined();
  });

  it("Texte kurz, Konter ohne Sie-Form, Quelle vorhanden", () => {
    for (const b of BOSSES) {
      expect(words(b.likes), b.likes).toBeLessThanOrEqual(25);
      expect(words(b.howTo), b.howTo).toBeLessThanOrEqual(25);
      expect(words(b.lesson), b.lesson).toBeLessThanOrEqual(15);
      expect(words(b.tagline)).toBeLessThanOrEqual(5);
      if (b.mma) expect(words(b.mma)).toBeLessThanOrEqual(15);
      expect(b.howTo, "Konter-Tipp ohne Sie-Form").not.toMatch(/\bSie\b/);
      expect(b.sources.length > 0 || b.check, b.id).toBe(true);
    }
  });

  it("Guard-Spielerin erklärt das MMA-Risiko (Guard ziehen trägt mma: nein)", () => {
    const g = BOSSES.find((b) => b.id === "guard")!;
    expect(g.mma).toMatch(/MMA/);
    expect(CARD2.cl_pull_guard.mma).toBe("nein");
  });
});

describe("Kern 2 – Bosse: Simulation", () => {
  for (const b of BOSSES) {
    it(`${b.name}: schlägt L1 ≥ 65 %, Stil sichtbar, verliert manchmal gegen die Konter-Strategie`, () => {
      const r1 = vs(asBoss(b), { level: 1 }, b.signature);
      expect(r1.win, "Boss vs L1").toBeGreaterThanOrEqual(0.65);
      // Stil sichtbar: Signatur-Lagen häufiger als dieselbe Stufe ohne Stil.
      const r0 = vs({ level: b.level }, { level: 1 }, b.signature);
      expect(r1.sig, `Signatur ${b.signature.join(",")} (Matches)`).toBeGreaterThan(r0.sig);
      expect(r1.sigRounds, `Signatur ${b.signature.join(",")} (Runden)`).toBeGreaterThan(r0.sigRounds);
      // Konter: der Spieler mit der richtigen Strategie gewinnt manchmal …
      const plain = vs(asBoss(b), { level: 2 }, b.signature);
      const counter = vs(asBoss(b), { level: 2, style: b.counter }, b.signature);
      expect(counter.foeWin, "Konter gewinnt manchmal").toBeGreaterThanOrEqual(0.1);
      // … und nimmt dem Boss etwas weg: weniger Siege oder seltener seine Lieblingslage.
      expect(counter.win < plain.win || counter.sig < plain.sig, "Konter wirkt").toBe(true);
    }, 30000);
  }
});
