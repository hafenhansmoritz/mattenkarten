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
    expect(pl.reason).toBe("Braucht 2 Griff");
    const s2 = stateAt("back", "p", { hand: ["rnc"], control: 2 });
    expect(playableCards(s2, "p").find((x) => x.id === "rnc")!.playable).toBe(true);
  });

  it("falsche Position und fehlendes Gas werden begründet", () => {
    const s = stateAt("dist", null, { hand: ["rnc", "double_leg"], gas: 1 });
    const pl = playableCards(s, "p");
    expect(pl.find((x) => x.id === "rnc")!.reason).toBe("Passt nicht zur Position");
    expect(pl.find((x) => x.id === "double_leg")!.reason).toBe("Braucht 2 Atem");
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

describe("MatchOptions (Tutorial)", () => {
  it("ohne Optionen unverändert: Distanz, keine options, leere history", () => {
    const s = createMatch(STARTER_DECK, STARTER_DECK, 7);
    expect(s.options).toBeUndefined();
    expect(s.history).toEqual([]);
    expect(s.p.control).toBe(0);
  });

  it("Startposition am Boden: Oberer hat Kontrolle 1", () => {
    const s = createMatch(STARTER_DECK, STARTER_DECK, 7, 12, { startPos: "mount", startTop: "o" });
    expect(s.pos).toBe("mount");
    expect(s.top).toBe("o");
    expect(s.o.control).toBe(1);
    expect(s.p.control).toBe(0);
    expect(roleOf(s, "p")).toBe("bottom");
    const n = createMatch(STARTER_DECK, STARTER_DECK, 7, 12, { startPos: "clinch", startTop: "p" });
    expect(n.top).toBeNull();
    expect(n.options).toEqual({ startPos: "clinch", startTop: "p" });
  });

  it("handSize", () => {
    const s = createMatch(STARTER_DECK, STARTER_DECK, 7, 12, { handSize: 3 });
    expect(s.p.hand).toHaveLength(3);
    expect(s.o.hand).toHaveLength(3);
    expect(playableCards(s, "p").filter((x) => !x.basic)).toHaveLength(3);
    const pc = playableCards(s, "p").find((x) => x.playable)!.id;
    const r = playTurn(s, pc, "b_stance", mulberry32(1));
    expect(r.state.p.hand).toHaveLength(3);
  });

  it("fixedHand wird jede Runde wiederhergestellt", () => {
    const hand = ["double_leg", "sprawl", "level_change"];
    let s = createMatch(STARTER_DECK, STARTER_DECK, 7, 12, { fixedHand: hand });
    expect(s.p.hand).toEqual(hand);
    s = playTurn(s, "level_change", "b_stance", mulberry32(1)).state;
    expect(s.p.hand).toEqual(hand);
  });

  it("noResources: Gas bleibt voll, Kontrolle egal", () => {
    let s = createMatch(STARTER_DECK, STARTER_DECK, 7, 12, { startPos: "back", startTop: "p", noResources: true, fixedHand: ["rnc"] });
    expect(playableCards(s, "p").find((x) => x.id === "rnc")!.playable).toBe(true);
    s = { ...s, pos: "dist", top: null, p: { ...s.p, gas: 0 } };
    s = { ...s, options: { ...s.options, fixedHand: ["double_leg"] }, p: { ...s.p, hand: ["double_leg"] } };
    expect(playableCards(s, "p").find((x) => x.id === "double_leg")!.playable).toBe(true);
    const r = playTurn(s, "double_leg", "b_stance", mulberry32(1)).state;
    expect(r.p.gas).toBe(12);
    expect(r.o.gas).toBe(12);
  });

  it("winAt beendet das Match mit Sieg", () => {
    const s = createMatch(STARTER_DECK, STARTER_DECK, 7, 12, { fixedHand: ["double_leg"], winAt: [{ pos: "guard", role: "top" }] });
    const r = playTurn(s, "double_leg", "b_stance", mulberry32(1)).state;
    expect(r.result).toEqual({ type: "points", winner: "p" });
    expect(r.log[r.log.length - 1].text).toBe("Ziel erreicht!");
  });

  it("protokolliert jeden Zug in history", () => {
    const s = createMatch(STARTER_DECK, STARTER_DECK, 7, 12, { fixedHand: ["double_leg", "sprawl"] });
    const pl = playableCards(s, "p").filter((x) => x.playable).map((x) => x.id);
    const r = playTurn(s, "double_leg", "b_stance", mulberry32(1)).state;
    expect(r.history).toHaveLength(1);
    const h = r.history![0];
    expect(h).toMatchObject({
      turn: 1, pos: "dist", top: null, pCard: "double_leg", oCard: "b_stance",
      rule: "angriff>setup", winner: "p", ptsBefore: { p: 0, o: 0 }, ptsAfter: { p: 2, o: 0 },
      posAfter: "guard", topAfter: "p",
    });
    expect(h.pPlayable).toEqual(pl);
    expect(h.headline.length).toBeGreaterThan(0);
    expect(h.lesson).toBeTruthy();
    const r2 = playTurn(r, playableCards(r, "p").find((x) => x.playable)!.id, "b_break_posture", mulberry32(2)).state;
    expect(r2.history).toHaveLength(2);
    expect(r2.history![1].pos).toBe("guard");
  });
});
