import { describe, expect, it } from "vitest";
import { CHAIN, chainPhase, chainRepeats } from "./chain";

describe("Kampfkette (Bauplan 40)", () => {
  it("fünf Glieder in fester Reihenfolge", () => {
    expect(CHAIN.map((c) => c.label)).toEqual(["Distanz", "Clinch", "Takedown", "Kontrolle", "Aufgabe"]);
  });
  it("Phase aus der Position", () => {
    expect(chainPhase("stand", [])).toBe("distanz");
    expect(chainPhase("clinch", [])).toBe("clinch");
    expect(chainPhase("headlock", [])).toBe("clinch");
    for (const p of ["guard", "half", "side", "mount", "back", "turtle"] as const) expect(chainPhase(p, [])).toBe("kontrolle");
  });
  it("Takedown nur als Übergang in der eben aufgedeckten Runde", () => {
    expect(chainPhase("half", [], { posBefore: "clinch" })).toBe("takedown");
    expect(chainPhase("guard", [], { posBefore: "stand" })).toBe("takedown");
    expect(chainPhase("turtle", [], { posBefore: "headlock" })).toBe("takedown");
    expect(chainPhase("side", [], { posBefore: "half" })).toBe("kontrolle");
    expect(chainPhase("clinch", [], { posBefore: "stand" })).toBe("clinch");
  });
  it("laufende Aufgabe-Leiste hat Vorrang", () => {
    expect(chainPhase("mount", [{ step: 1 }])).toBe("aufgabe");
    expect(chainPhase("mount", [{ step: 0 }])).toBe("kontrolle");
  });
  it("Repeat zählt Rückkehr in den Stand vom Boden oder aus der Kopfklammer", () => {
    expect(chainRepeats([{ posBefore: "stand" }, { posBefore: "clinch" }], "stand")).toBe(0);
    expect(chainRepeats([{ posBefore: "stand" }, { posBefore: "turtle" }], "stand")).toBe(1);
    expect(chainRepeats([{ posBefore: "guard" }, { posBefore: "stand" }, { posBefore: "headlock" }], "stand")).toBe(2);
  });
});
