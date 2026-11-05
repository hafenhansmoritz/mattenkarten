// Balance-Regressionstest: kleine, deterministische Stichprobe des Kampagnen-Simulators (scripts/simulate.ts).
// Die vollen Zielbänder (300 Matches je Gegner und Stufe) prüft `npx vite-node scripts/simulate.ts`;
// hier gelten breitere Bänder (Stichprobe 80 → 2σ ≈ ±11 Punkte, plus Puffer), damit echte Regressionen auffallen,
// Zufall aber nicht.
import { describe, expect, it } from "vitest";
import { ARCHETYPES } from "../data/campaign";
import { CARD } from "../data/cards";
import { type Row, type SimResult, autoDeck, collectionAfter, simulate, targetBand } from "../../scripts/simulate";
import { chooseCard, predictKindIn } from "./ai";
import { mulberry32 } from "./rng";
import { stateAt } from "./testUtils";
import type { TurnRecord } from "./types";

const N = 80;
const SLACK = 0.15;
let cached: SimResult | null = null;
function result(): SimResult {
  cached ??= simulate(N);
  return cached;
}
const row = (id: string, skill: Row["skill"]) => result().rows.find((r) => r.id === id && r.skill === skill)!;

describe("Balance: Kampagnen-Simulation (Stichprobe)", () => {
  it("Auto-Deck ist gültig (20 Karten, Kopienlimit) und wächst mit den Belohnungen", () => {
    for (let i = 0; i < ARCHETYPES.length; i++) {
      const deck = autoDeck(collectionAfter(i));
      expect(deck).toHaveLength(20);
      const counts: Record<string, number> = {};
      for (const id of deck) counts[id] = (counts[id] ?? 0) + 1;
      for (const [id, n] of Object.entries(counts)) expect(n, id).toBeLessThanOrEqual(CARD[id].rarity === "legendaer" ? 1 : 2);
    }
    expect(collectionAfter(ARCHETYPES.length).length).toBeGreaterThan(collectionAfter(0).length);
  });

  it("Siegquoten liegen in den (erweiterten) Zielbändern", () => {
    const misses: string[] = [];
    for (const r of result().rows) {
      const a = ARCHETYPES.find((x) => x.id === r.id)!;
      const band = targetBand(a, r.skill);
      if (!band) continue;
      const lo = a.tutorial ? band[0] - 0.06 : band[0] - SLACK;
      const hi = band[1] + SLACK;
      if (r.win < lo || r.win > hi) misses.push(`${r.id}/${r.skill}: ${Math.round(r.win * 100)}% (Ziel ${band.map((x) => x * 100).join("–")}%)`);
    }
    expect(misses).toEqual([]);
  });

  it("Lernkurve: Experte ≥ Fortgeschrittener ≥ Neuling (über alle regulären Gegner)", () => {
    const avg = (skill: Row["skill"]) => {
      const rs = result().rows.filter((r) => r.skill === skill && !r.tutorial);
      return rs.reduce((s, r) => s + r.win, 0) / rs.length;
    };
    expect(avg("intermediate")).toBeGreaterThan(avg("novice") + 0.1);
    expect(avg("expert")).toBeGreaterThan(avg("intermediate") + 0.1);
  });

  it("Schwierigkeit steigt über die Gürtel (Fortgeschrittener, Gürtel-Mittel)", () => {
    const belts = ["weiss", "blau", "lila", "braun", "schwarz"];
    const mean = belts.map((b) => {
      const rs = result().rows.filter((r) => r.belt === b && r.skill === "intermediate" && !r.tutorial);
      return rs.reduce((s, r) => s + r.win, 0) / rs.length;
    });
    expect(mean[0]).toBeGreaterThan(mean[4] + 0.1);
    expect(mean[1]).toBeGreaterThan(mean[4]);
  });

  it("Submission-Anteil 10–40 %, keine Karte > 45 % aller Submissions", () => {
    const r = result();
    const share = r.subs / r.total;
    expect(share).toBeGreaterThan(0.1);
    expect(share).toBeLessThan(0.4);
    const total = Object.values(r.subCards).reduce((a, b) => a + b, 0);
    for (const [card, n] of Object.entries(r.subCards)) expect(n / total, card).toBeLessThan(0.45);
    expect(Object.keys(r.subCards).length).toBeGreaterThanOrEqual(5);
  });

  it("Matchlänge im Schnitt 9–12 Züge; alle 12 Positions-Rollen werden erreicht", () => {
    const r = result();
    const avg = r.nonTutorialTurns / r.nonTutorialMatches;
    expect(avg).toBeGreaterThanOrEqual(9);
    expect(avg).toBeLessThanOrEqual(12);
    expect(r.positions.size).toBe(12);
  });

  it("KI spielt nie offensichtlich dumm: kein Setup statt freier Submission, nie dauerhaft passiv bei 0 Gas", () => {
    for (const r of result().rows) {
      expect(r.dumbSetup, `${r.id}/${r.skill}`).toBe(0);
      expect(r.passive, `${r.id}/${r.skill}`).toBe(0);
    }
  });

  it("Archetypen sind unterscheidbar: Signatur-Karten tauchen in ihrem Spiel auf", () => {
    const top = (id: string) => row(id, "intermediate").topCards;
    const plays = (id: string, cards: string[]) => expect(top(id).some((c) => cards.includes(c)), `${id}: ${top(id).join(",")}`).toBe(true);
    plays("w_boss", ["snap_down", "clinch_entry", "guillotine"]);
    plays("b_judoka", ["o_goshi", "o_soto", "body_lock_trip", "clinch_entry"]);
    plays("b_striker", ["jab"]);
    plays("l_guard", ["hip_bump", "scissor_sweep"]);
    plays("l_passer", ["stack_pass", "knee_slice"]);
    plays("br_wrestler", ["snap_down", "go_behind", "seatbelt_hooks"]);
    plays("br_backtaker", ["arm_drag", "seatbelt_hooks", "mount_to_back"]);
    plays("s_mma", ["jab", "single_leg", "double_leg"]);
    plays("s_system", ["hip_bump", "snap_down"]);
    // Striker spielt deutlich mehr Schläge als der Durchschnitt, Passer deutlich mehr Pässe
    expect(row("b_striker", "intermediate").likeShare).toBeGreaterThan(0.15);
    expect(row("l_passer", "intermediate").likeShare).toBeGreaterThan(0.4);
    // Submission-Stil: Guard-Spielerinnen tappen aus der Guard, Back-Taker mit dem Würger
    const aiSubs = (id: string) => ["novice", "intermediate", "expert"].reduce<Record<string, number>>((acc, sk) => {
      for (const [c, n] of Object.entries(row(id, sk as Row["skill"]).aiSubCards)) acc[c] = (acc[c] ?? 0) + n;
      return acc;
    }, {});
    const guardSubs = aiSubs("l_guard");
    expect((guardSubs.armbar_guard ?? 0) + (guardSubs.kimura_guard ?? 0) + (guardSubs.triangle ?? 0)).toBeGreaterThan(0);
    expect(Object.keys(aiSubs("br_backtaker"))).toEqual(["rnc"]);
  });
});

describe("KI-Heuristiken (Balance-Pass)", () => {
  const vale = ARCHETYPES.find((a) => a.id === "s_system")!;

  it("Kontext-Read: Muster in genau dieser Lage zählt mehr als die letzten Züge insgesamt", () => {
    const rec = (pos: TurnRecord["pos"], top: TurnRecord["top"], pCard: string): TurnRecord => ({
      turn: 1, pos, top, pCard, oCard: "b_stance", rule: "patt", winner: "none", headline: "", pPlayable: [],
      ptsBefore: { p: 0, o: 0 }, ptsAfter: { p: 0, o: 0 }, posAfter: pos, topAfter: top,
    });
    // In der Guard oben griff der Spieler zweimal an; danach am Boden nur Setups
    const history = [rec("guard", "p", "stack_pass"), rec("guard", "p", "b_guard_open_pass"),
      rec("side", "p", "b_side_crossface"), rec("side", "p", "b_side_crossface"), rec("side", "p", "b_side_crossface")];
    const s = stateAt("guard", "p", { history: ["angriff", "angriff", "setup", "setup", "setup"] }, {}, { history });
    expect(predictKindIn(s, "p")).toBe("angriff");
  });

  it("Dilemma: nach gekontertem Hip Bump spielt der System-Grappler die Kimura", () => {
    const s = stateAt("guard", "p", {}, {
      hand: ["kimura_guard", "hip_bump", "shrimp_recover"], control: 1, lastPlayed: "hip_bump", lastCounteredBy: ["sweep"],
    });
    const rng = mulberry32(7);
    let kimura = 0;
    for (let i = 0; i < 40; i++) if (chooseCard(s, { ...vale, reads: 0 }, rng).card === "kimura_guard") kimura++;
    expect(kimura).toBeGreaterThan(30);
  });

  it("Position vor Submission: fehlt ein Griff zur Submission, wird festgemacht statt blind angegriffen", () => {
    const okada = ARCHETYPES.find((a) => a.id === "br_boss")!;
    const s = stateAt("mount", "o", {}, { hand: ["armbar_mount", "upa"], control: 2 });
    const rng = mulberry32(11);
    let setups = 0;
    for (let i = 0; i < 40; i++) if (chooseCard(s, { ...okada, reads: 0 }, rng).card === "b_mount_base") setups++;
    expect(setups).toBeGreaterThan(20);
  });
});

describe("Balance mit Erweiterungspaket (nur Smoke-Test)", () => {
  it("Auto-Deck mit allen Belohnungen bleibt gültig; Matches enden", async () => {
    const { simConfig } = await import("../../scripts/simulate");
    simConfig.expansion = true;
    try {
      const r = simulate(6, ["intermediate"], (a) => !a.tutorial, "exp");
      expect(r.total).toBeGreaterThan(0);
      for (let i = 0; i < ARCHETYPES.length; i++) expect(autoDeck(collectionAfter(i))).toHaveLength(20);
    } finally {
      simConfig.expansion = false;
    }
  });
});
