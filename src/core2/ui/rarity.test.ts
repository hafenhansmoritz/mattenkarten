import { describe, expect, it } from "vitest";
import { CARDS2 } from "../data/cards";
import type { Card2 } from "../types";
import { RARITIES, mmaNote, rarityOf } from "./rarity";

const base = (p: Partial<Card2>): Card2 => ({
  id: "x", plain: "x", term: "x", plainDo: "x", kind: "aufbauen", zone: "kopf", slots: [{ pos: "stand", role: "neutral" }],
  why: "x", keys: [], mistakes: [], ...p,
});

describe("Seltenheit nach Lernwert", () => {
  it("Rahmen und Befreiungen = Grundlage, Aufgabegriffe = Meister, Rest = Technik", () => {
    expect(rarityOf(base({ kind: "rahmen" }))).toBe("grundlage");
    expect(rarityOf(base({ kind: "angriff", to: { pos: "half", role: "bottom", escape: "guard" } }))).toBe("grundlage");
    expect(rarityOf(base({ kind: "angriff", submission: { id: "armbar", name: "Armbar" } }))).toBe("meister");
    expect(rarityOf(base({ kind: "angriff", to: { pos: "side", role: "top", points: 3 } }))).toBe("technik");
    expect(rarityOf(base({ kind: "aufbauen" }))).toBe("technik");
  });

  it("echte Karten: jede Stufe kommt vor, alle Aufgabegriffe sind Meister", () => {
    const got = new Set(CARDS2.map(rarityOf));
    for (const r of RARITIES) expect(got.has(r), r).toBe(true);
    for (const c of CARDS2) {
      if (c.submission) expect(rarityOf(c), c.id).toBe("meister");
      else if (c.kind === "rahmen" || c.to?.escape) expect(rarityOf(c), c.id).toBe("grundlage");
    }
  });

  it("MMA-Hinweis aus Schlüssel „MMA: …“ oder eigenem Feld", () => {
    expect(mmaNote(base({ keys: ["A", "MMA: zählt wegen der Schläge"] }))).toBe("zählt wegen der Schläge");
    expect(mmaNote(base({ keys: ["A"] }))).toBeNull();
    expect(mmaNote({ ...base({}), mma: "Kopf weg von den Schlägen" } as Card2)).toBe("Kopf weg von den Schlägen");
  });
});
