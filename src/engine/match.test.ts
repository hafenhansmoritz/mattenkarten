import { describe, expect, it } from "vitest";
import { createMatch, playTurn, playableCards, isOver, chainStep, roleOf, drawUp } from "./match";
import { mulberry32 } from "./rng";
import { stateAt } from "./testUtils";
import { STARTER_DECK } from "../data/campaign";

describe("Match-Ablauf", () => {
  it("createMatch: beide haben 5 Handkarten und 15 im Deck, Start in Distanz", () => {
    const s = createMatch(STARTER_DECK, STARTER_DECK, 7);
    expect(s.p.hand).toHaveLength(5);
    expect(s.o.hand).toHaveLength(5);
    expect(s.p.deck).toHaveLength(15);
    expect(s.pos).toBe("dist");
    expect(s.turn).toBe(1);
    expect(s.p.gas).toBe(12);
  });

  it("ist deterministisch für denselben Seed", () => {
    expect(createMatch(STARTER_DECK, STARTER_DECK, 3)).toEqual(createMatch(STARTER_DECK, STARTER_DECK, 3));
  });

  it("drawUp mischt die Ablage neu, wenn das Deck leer ist", () => {
    const s = stateAt("dist", null, { deck: [], hand: ["jab"], discard: ["sprawl", "double_leg", "level_change", "collar_tie"] });
    const d = drawUp(s, mulberry32(1));
    expect(d.p.hand).toHaveLength(5);
    expect(d.p.discard).toHaveLength(0);
  });

  it("Position vor Submission: RNC ohne Kontrolle nicht spielbar, mit Grund", () => {
    const s = stateAt("back", "p", { hand: ["rnc"], control: 1 });
    const pl = playableCards(s, "p").find((x) => x.id === "rnc")!;
    expect(pl.playable).toBe(false);
    expect(pl.reason).toBe("Braucht Kontrolle 2");
    const s2 = stateAt("back", "p", { hand: ["rnc"], control: 2 });
    expect(playableCards(s2, "p").find((x) => x.id === "rnc")!.playable).toBe(true);
  });

  it("falsche Position und fehlendes Gas werden begründet", () => {
    const s = stateAt("dist", null, { hand: ["rnc", "double_leg"], gas: 1 });
    const pl = playableCards(s, "p");
    expect(pl.find((x) => x.id === "rnc")!.reason).toBe("Passt nicht zur Position");
    expect(pl.find((x) => x.id === "double_leg")!.reason).toBe("Braucht 2 Gas");
    expect(pl.some((x) => x.basic && x.playable)).toBe(true); // Grundtechniken bleiben
  });

  it("playTurn: ablegen, ziehen, Zug +1", () => {
    let s = createMatch(STARTER_DECK, STARTER_DECK, 11);
    const pc = playableCards(s, "p").find((x) => x.playable && !x.basic)!.id;
    const r = playTurn(s, pc, "b_stance", mulberry32(5));
    expect(r.state.turn).toBe(2);
    expect(r.state.p.hand).toHaveLength(5);
    expect(r.state.p.discard).toContain(pc);
  });

  it("Spielende nach Punkten nach maxTurns", () => {
    let s = createMatch(STARTER_DECK, STARTER_DECK, 2, 1);
    s = { ...s, p: { ...s.p, hand: ["double_leg", ...s.p.hand.slice(1)] } };
    const r = playTurn(s, "double_leg", "b_stance", mulberry32(1));
    expect(isOver(r.state)).toBe(true);
    expect(r.state.result).toEqual({ type: "points", winner: "p" });
  });

  it("Unentschieden bei Punktegleichstand", () => {
    const s = createMatch(STARTER_DECK, STARTER_DECK, 2, 1);
    const r = playTurn(s, "b_stance", "b_stance", mulberry32(1));
    expect(r.state.result).toEqual({ type: "points", winner: null });
  });

  it("Spielende per Submission", () => {
    const s = stateAt("back", "p", { hand: ["rnc"], control: 2 });
    const r = playTurn(s, "rnc", "b_back_handfight", mulberry32(1));
    expect(r.state.result).toEqual({ type: "submission", winner: "p", card: "rnc" });
    expect(() => playTurn(r.state, "b_back_seatbelt", "b_back_handfight", mulberry32(1))).toThrow();
  });

  it("roleOf und chainStep", () => {
    const s = stateAt("mount", "o");
    expect(roleOf(s, "o")).toBe("top");
    expect(roleOf(s, "p")).toBe("bottom");
    expect(chainStep("dist", "neutral")).toBe(1);
    expect(chainStep("clinch", "neutral")).toBe(2);
    expect(chainStep("guard", "top")).toBe(3);
    expect(chainStep("back", "top")).toBe(4);
  });
});
