import { describe, expect, it } from "vitest";
import { CARD, CARDS, basicsFor, DECK_CARD_IDS } from "../data/cards";
import { ALL_SLOTS } from "../data/cardHelpers";
import { ARCHETYPES, BELTS, STARTER_COLLECTION, STARTER_DECK } from "../data/campaign";

function validDeck(deck: string[]) {
  expect(deck).toHaveLength(20);
  const counts: Record<string, number> = {};
  for (const id of deck) {
    expect(CARD[id], `unbekannte Karte ${id}`).toBeDefined();
    expect(CARD[id].basic, `${id} ist Grundtechnik`).toBeFalsy();
    counts[id] = (counts[id] ?? 0) + 1;
  }
  for (const [id, n] of Object.entries(counts)) {
    expect(n, `${id} zu oft`).toBeLessThanOrEqual(CARD[id].rarity === "legendaer" ? 1 : 2);
  }
}

describe("Karten", () => {
  it("eindeutige IDs", () => {
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
  });

  it("etwa 34–45 Deck-Karten", () => {
    expect(DECK_CARD_IDS.length).toBeGreaterThanOrEqual(34);
    expect(DECK_CARD_IDS.length).toBeLessThanOrEqual(45);
  });

  it("jeder Slot hat 2–3 Grundtechniken mit Angriff/Escape, Setup und Reaktion, 0–1 Gas", () => {
    for (const slot of ALL_SLOTS) {
      const b = basicsFor(slot.pos, slot.role);
      const label = `${slot.pos}/${slot.role}`;
      expect(b.length, label).toBeGreaterThanOrEqual(2);
      expect(b.length, label).toBeLessThanOrEqual(3);
      expect(b.some((c) => c.kind === "angriff"), `${label}: Angriff/Escape`).toBe(true);
      expect(b.some((c) => c.kind === "setup"), `${label}: Setup`).toBe(true);
      expect(b.some((c) => c.kind === "reaktion"), `${label}: Reaktion`).toBe(true);
      for (const c of b) expect(c.gas, c.id).toBeLessThanOrEqual(1);
      for (const c of b) expect(c.requiresControl ?? 0, c.id).toBe(0);
    }
  });

  it("Typ-Konsistenz: Angriffe haben Tags+Tempo, Reaktionen Counters, Submissions Kontrollbedarf von oben", () => {
    for (const c of CARDS) {
      if (c.kind === "angriff") {
        expect(c.tags?.length, c.id).toBeGreaterThan(0);
        expect(c.tempo, c.id).toBeDefined();
        if (c.submission) expect(c.success, `${c.id}: Submission ohne success`).toBeUndefined();
        else expect(c.success || c.drainGas, `${c.id}: Wirkung`).toBeTruthy();
      }
      if (c.kind === "reaktion") expect(c.counters?.length, c.id).toBeGreaterThan(0);
      if (c.submission && c.slots.some((s) => s.role === "top")) {
        expect(c.requiresControl ?? 0, c.id).toBeGreaterThanOrEqual(2);
      }
      expect(c.desc.length, c.id).toBeGreaterThan(10);
      expect(c.keys.length, c.id).toBeGreaterThan(0);
      expect(c.source || c.check, `${c.id}: Quelle oder check`).toBeTruthy();
      if (c.dilemmaWith) expect(CARD[c.dilemmaWith], c.id).toBeDefined();
    }
  });

  it("keine verbotenen Techniken als Karte", () => {
    const banned = /slam|neck crank|heel hook|kani|suplex|wrist ?lock|knee ?bar|toe ?hold/i;
    for (const c of CARDS) expect(banned.test(c.name), c.id).toBe(false);
  });

  it("Punkte nach IBJJF", () => {
    expect(CARD.double_leg.success?.points).toBe(2);
    expect(CARD.hip_bump.success?.points).toBe(2);
    expect(CARD.stack_pass.success?.points).toBe(3);
    expect(CARD.to_mount.success?.points).toBe(4);
    expect(CARD.arm_drag.success?.points ?? 0).toBe(0);
    expect(CARD.go_behind.success?.points ?? 0).toBe(0);
    expect(CARD.seatbelt_hooks.backPoints).toBe(4);
  });
});

describe("Kampagne", () => {
  it("5 Gürtel", () => {
    expect(BELTS.map((b) => b.id)).toEqual(["weiss", "blau", "lila", "braun", "schwarz"]);
  });

  it("pro Gürtel 2–3 Gegner plus genau ein Boss", () => {
    for (const b of BELTS) {
      const list = ARCHETYPES.filter((a) => a.belt === b.id);
      expect(list.filter((a) => a.boss)).toHaveLength(1);
      const normal = list.filter((a) => !a.boss).length;
      expect(normal).toBeGreaterThanOrEqual(2);
      expect(normal).toBeLessThanOrEqual(3);
    }
  });

  it("alle Decks gültig (20 Karten, max. 2 Kopien, Legendär 1×)", () => {
    validDeck(STARTER_DECK);
    for (const a of ARCHETYPES) validDeck(a.deck);
  });

  it("Decks unterscheiden sich", () => {
    const keys = ARCHETYPES.map((a) => [...a.deck].sort().join(","));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("reads steigt, telegraph sinkt", () => {
    for (let i = 1; i < ARCHETYPES.length; i++) {
      expect(ARCHETYPES[i].reads).toBeGreaterThanOrEqual(ARCHETYPES[i - 1].reads);
      expect(ARCHETYPES[i].telegraph).toBeLessThanOrEqual(ARCHETYPES[i - 1].telegraph);
    }
    expect(ARCHETYPES[0].reads).toBeCloseTo(0.1);
    expect(ARCHETYPES[ARCHETYPES.length - 1].reads).toBeCloseTo(0.7);
    expect(ARCHETYPES[0].telegraph).toBeCloseTo(0.9);
    expect(ARCHETYPES[ARCHETYPES.length - 1].telegraph).toBeCloseTo(0.15);
  });

  it("Belohnungen sind gültige Deck-Karten; Ringer schaltet Sprawl/Whizzer frei", () => {
    for (const a of ARCHETYPES) for (const id of a.reward) expect(DECK_CARD_IDS, `${a.id}: ${id}`).toContain(id);
    const ringer = ARCHETYPES.find((a) => a.id === "w_ringer")!;
    expect(ringer.reward).toEqual(expect.arrayContaining(["sprawl", "whizzer"]));
  });

  it("die ersten drei weißen Kämpfe sind Tutorials 1–3", () => {
    const white = ARCHETYPES.filter((a) => a.belt === "weiss");
    expect(white.slice(0, 3).map((a) => a.tutorial)).toEqual([1, 2, 3]);
  });

  it("Startsammlung = eindeutige Karten des Starterdecks", () => {
    expect(new Set(STARTER_COLLECTION).size).toBe(STARTER_COLLECTION.length);
    for (const id of STARTER_DECK) expect(STARTER_COLLECTION).toContain(id);
  });
});
