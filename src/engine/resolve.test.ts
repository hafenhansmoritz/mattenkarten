import { describe, expect, it } from "vitest";
import { resolveReveal, effectiveTempo } from "./resolve";
import { mulberry32 } from "./rng";
import { stateAt } from "./testUtils";
import { CARD } from "../data/cards";
import { playableCards } from "./match";

const rng = mulberry32(42);

describe("Dreieck", () => {
  it("Angriff schlägt Setup", () => {
    const s = stateAt("dist", null);
    const { state, outcome } = resolveReveal(s, "double_leg", "b_stance", rng);
    expect(outcome.rule).toBe("angriff>setup");
    expect(outcome.winner).toBe("p");
    expect(state.pos).toBe("guard");
    expect(state.top).toBe("p");
    expect(state.p.pts).toBe(2);
    expect(state.o.control).toBe(0); // Setup hat nicht gewirkt
  });

  it("Setup schlägt Reaktion: Reagierender −1 Gas, Setup-Spieler Effekt + Öffnung", () => {
    const s = stateAt("dist", null);
    const { state, outcome } = resolveReveal(s, "level_change", "sprawl", rng);
    expect(outcome.rule).toBe("setup>reaktion");
    expect(state.p.control).toBe(1);
    expect(state.p.opening).toEqual(["shot", "single", "legs"]);
    // o: 12 − 1 (Sprawl) − 1 (Strafe) + 1 (Regen) = 11
    expect(state.o.gas).toBe(11);
    expect(outcome.events).toContainEqual({ t: "opening", side: "p" });
  });

  it("Reaktion schlägt Angriff bei passendem Tag (Sprawl → du oben im Front Headlock)", () => {
    const s = stateAt("dist", null);
    const { state, outcome } = resolveReveal(s, "double_leg", "sprawl", rng);
    expect(outcome.rule).toBe("reaktion>angriff");
    expect(outcome.winner).toBe("o");
    expect(state.pos).toBe("fhl");
    expect(state.top).toBe("o");
    expect(outcome.headline).toMatch(/Sprawl|Beine weg, Hüfte drauf/);
    expect(outcome.lesson).toMatch(/\(Sprawl\) stoppt Beinangriffe/);
    expect(state.p.lastCounteredBy).toEqual(["shot"]);
  });

  it("Tag passt nicht → Angriff geht durch", () => {
    const s = stateAt("clinch", null, { control: 1 });
    const { state, outcome } = resolveReveal(s, "o_goshi", "sprawl", rng);
    expect(outcome.rule).toBe("durch");
    expect(outcome.winner).toBe("p");
    expect(state.pos).toBe("side");
    expect(state.top).toBe("p");
    expect(outcome.lesson).toContain("nicht");
  });

  it("Whizzer kontert Single Leg, aber nicht Double Leg", () => {
    const s = stateAt("clinch", null);
    expect(resolveReveal(s, "single_leg", "whizzer", rng).outcome.rule).toBe("reaktion>angriff");
    expect(resolveReveal(s, "double_leg", "whizzer", rng).outcome.rule).toBe("durch");
  });

  it("Setup gegen Setup: beide Effekte", () => {
    const s = stateAt("clinch", null);
    const { state, outcome } = resolveReveal(s, "collar_tie", "underhook", rng);
    expect(outcome.rule).toBe("beide-setup");
    expect(state.p.control).toBe(1);
    expect(state.o.control).toBe(1);
  });

  it("Reaktion gegen Reaktion: Patt, beide +1 Gas", () => {
    const s = stateAt("dist", null, { gas: 6 }, { gas: 6 });
    const { state, outcome } = resolveReveal(s, "sprawl", "b_distance", rng);
    expect(outcome.rule).toBe("patt");
    // p: 6 − 1 + 1 (Patt) + 1 (Regen) = 7; o: 6 − 0 + 1 + 1 = 8
    expect(state.p.gas).toBe(7);
    expect(state.o.gas).toBe(8);
  });
});

describe("Tempo", () => {
  it("Angriff gegen Angriff: niedrigeres Tempo gewinnt", () => {
    const s = stateAt("dist", null);
    const { state, outcome } = resolveReveal(s, "jab", "double_leg", rng); // 2 vs 3
    expect(outcome.rule).toBe("tempo");
    expect(outcome.winner).toBe("p");
    expect(state.pos).toBe("dist");
    // o: 12 − 2 (Kosten) − 2 (Jab drain) + 1 = 9
    expect(state.o.gas).toBe(9);
  });

  it("Gleichstand = Scramble, beide −1 Gas, nichts passiert", () => {
    const s = stateAt("dist", null);
    const { state, outcome } = resolveReveal(s, "double_leg", "single_leg", rng);
    expect(outcome.rule).toBe("scramble");
    expect(outcome.winner).toBe("none");
    expect(state.pos).toBe("dist");
    expect(state.p.gas).toBe(12 - 2 - 1 + 1);
  });

  it("Öffnung macht passenden Angriff 2 Tempo schneller und wird verbraucht", () => {
    const s = stateAt("dist", null, { opening: ["shot", "single", "legs"] });
    expect(effectiveTempo(CARD.double_leg, s.p)).toBe(1);
    const { state, outcome } = resolveReveal(s, "double_leg", "jab", rng); // 1 vs 2
    expect(outcome.winner).toBe("p");
    expect(state.pos).toBe("guard");
    expect(state.p.opening).toBeNull();
  });

  it("Gas ≤ 2: Angriffe +1 Tempo", () => {
    const s = stateAt("dist", null, { gas: 2 });
    expect(effectiveTempo(CARD.jab, s.p)).toBe(3);
    const { outcome } = resolveReveal(s, "jab", "double_leg", rng); // 3 vs 3
    expect(outcome.rule).toBe("scramble");
  });

  it("Regeneration ist auf 12 begrenzt", () => {
    const s = stateAt("clinch", null);
    const { state } = resolveReveal(s, "head_up", "b_hips_back", rng); // 0 Gas, Patt
    expect(state.p.gas).toBe(12);
    expect(state.o.gas).toBe(12);
  });
});

describe("Dilemma (Danaher)", () => {
  it("Hip Bump → Base & Post → Kimura: Dilemma hebt die Kontroll-Voraussetzung auf und die Kimura sitzt", () => {
    const s0 = stateAt("guard", "o", { control: 0 });
    expect(playableCards(s0, "p").find((x) => x.id === "kimura_guard")).toBeUndefined(); // nicht auf der Hand
    const r1 = resolveReveal(s0, "hip_bump", "base_post", rng);
    expect(r1.outcome.rule).toBe("reaktion>angriff");
    expect(r1.state.p.lastCounteredBy).toEqual(["sweep"]);
    const s1 = { ...r1.state, p: { ...r1.state.p, hand: ["kimura_guard"] } };
    const pl = playableCards(s1, "p").find((x) => x.id === "kimura_guard")!;
    expect(pl.playable).toBe(true); // ohne Dilemma bräuchte sie Kontrolle 1
    const r2 = resolveReveal(s1, "kimura_guard", "base_post", rng);
    expect(r2.state.result).toEqual({ type: "submission", winner: "p", card: "kimura_guard" });
  });

  it("Dilemma ignoriert nur die Familie, die letzte Runde gekontert hat", () => {
    // Double Leg wurde gesprawlt ('shot'); Head Up kontert 'snap' → Snap Down wird trotzdem gekontert
    const s = stateAt("clinch", null, { lastPlayed: "double_leg", lastCounteredBy: ["shot"] });
    const { outcome, state } = resolveReveal(s, "snap_down", "head_up", rng);
    expect(outcome.rule).toBe("reaktion>angriff");
    expect(state.pos).toBe("clinch");
  });

  it("Triangle ignoriert die Reaktion, die die Armbar gekontert hat", () => {
    const s = stateAt("guard", "o", { lastPlayed: "armbar_guard", lastCounteredBy: ["armlock", "trianglechoke"], control: 0 });
    const { state, outcome } = resolveReveal(s, "triangle", "posture_defense", rng);
    expect(outcome.events).toContainEqual({ t: "dilemma", side: "p" });
    expect(outcome.rule).toBe("durch");
    expect(state.result).toEqual({ type: "submission", winner: "p", card: "triangle" });
    expect(outcome.lesson).toMatch(/Paaren/);
  });

  it("ohne gekonterte Partnerkarte kein Dilemma", () => {
    const s = stateAt("guard", "o", { control: 2 });
    const { outcome } = resolveReveal(s, "triangle", "posture_defense", rng);
    expect(outcome.rule).toBe("reaktion>angriff");
  });
});

describe("Kontrolle und Submissions", () => {
  it("gekonterte Submission: Kontrolle 0 + onCountered (Armbar aus dem Mount → Gegner holt Guard)", () => {
    const s = stateAt("mount", "p", { control: 3 }, { control: 0 });
    const { state, outcome } = resolveReveal(s, "armbar_mount", "b_mount_elbows", rng);
    expect(outcome.rule).toBe("reaktion>angriff");
    expect(state.p.control).toBe(0);
    expect(state.pos).toBe("guard");
    expect(state.top).toBe("p"); // du endest in seiner Guard (oben)
    expect(outcome.events.some((e) => e.t === "submissionDefended")).toBe(true);
    expect(state.result).toBeNull();
  });

  it("gekonterte Guillotine: Kontrolle 0 und du liegst unten in der Guard", () => {
    const s = stateAt("fhl", "p", { control: 2 });
    const { state } = resolveReveal(s, "guillotine", "b_fhl_chin", rng);
    expect(state.p.control).toBe(0);
    expect(state.pos).toBe("guard");
    expect(state.top).toBe("o");
  });

  it("erfolgreiche Submission beendet das Match", () => {
    const s = stateAt("back", "p", { control: 2 });
    const { state, outcome } = resolveReveal(s, "rnc", "b_back_handfight", rng);
    expect(state.result).toEqual({ type: "submission", winner: "p", card: "rnc" });
    expect(outcome.events).toContainEqual({ t: "submission", side: "p", card: "rnc" });
    expect(outcome.headline).toContain("Tap");
  });

  it("normaler Konter kostet 1 Kontrolle", () => {
    const s = stateAt("side", "p", { control: 2 });
    const { state } = resolveReveal(s, "to_mount", "b_side_arms", rng); // passt nicht → durch
    expect(state.pos).toBe("mount");
    const s2 = stateAt("guard", "p", { control: 2 });
    const r2 = resolveReveal(s2, "stack_pass", "b_guard_frame", rng);
    expect(r2.state.p.control).toBe(1);
  });

  it("Aufstieg setzt Kontrolle des Gegners auf 0", () => {
    const s = stateAt("guard", "p", { control: 1 }, { control: 2 });
    const { state } = resolveReveal(s, "stack_pass", "b_break_posture", rng);
    expect(state.pos).toBe("side");
    expect(state.p.control).toBe(1);
    expect(state.o.control).toBe(0);
    expect(state.p.pts).toBe(3);
  });
});

describe("Rückenpunkte (Hooks)", () => {
  it("Seatbelt & Hooks gibt 4 Punkte nur einmal pro Back-Phase", () => {
    const s = stateAt("back", "p");
    const r1 = resolveReveal(s, "seatbelt_hooks", "b_back_handfight", rng);
    expect(r1.state.p.pts).toBe(4);
    expect(r1.state.backPointsAwarded.p).toBe(true);
    expect(r1.outcome.lesson).toMatch(/Hooks/);
    const r2 = resolveReveal(r1.state, "seatbelt_hooks", "b_back_handfight", rng);
    expect(r2.state.p.pts).toBe(4);
  });

  it("Arm Drag bringt dich hinter den Gegner, aber ohne Punkte", () => {
    const s = stateAt("clinch", null);
    const { state } = resolveReveal(s, "arm_drag", "b_pummel", rng);
    expect(state.pos).toBe("back");
    expect(state.top).toBe("p");
    expect(state.p.pts).toBe(0);
  });

  it("Neue Back-Phase setzt die Hooks-Punkte zurück", () => {
    const s = stateAt("back", "p", {}, {}, { backPointsAwarded: { p: true, o: false } });
    const r = resolveReveal(s, "b_back_to_mount", "b_back_handfight", rng);
    expect(r.state.pos).toBe("mount");
    expect(r.state.backPointsAwarded.p).toBe(false);
  });
});

describe("Immutabilität", () => {
  it("verändert den Eingabe-State nicht", () => {
    const s = stateAt("dist", null);
    const snapshot = JSON.stringify(s);
    resolveReveal(s, "double_leg", "sprawl", rng);
    expect(JSON.stringify(s)).toBe(snapshot);
  });
});
