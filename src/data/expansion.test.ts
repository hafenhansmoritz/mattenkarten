import { describe, expect, it } from "vitest";
import { EXPANSION_CARDS, EXPANSION_REWARDS } from "./expansion";
import { BASIC_CARDS } from "./basics";
import { DECK_CARDS } from "./deckCards";
import { CARD, CARDS, DECK_CARD_IDS, BANNED_LESSONS, GI_ONLY } from "./cards";
import { ARCHETYPES } from "./campaign";
import { TAG_DE } from "../engine/text";
import type { PositionId, Role, Slot, Tag } from "../engine/types";

const POSITIONS: PositionId[] = ["dist", "clinch", "fhl", "guard", "side", "mount", "back"];
const NEUTRAL: PositionId[] = ["dist", "clinch"];
const TAGS = Object.keys(TAG_DE) as Tag[];
const words = (s: string) => s.split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w));

function legalSlot(pos: PositionId, role: Role): boolean {
  if (!POSITIONS.includes(pos)) return false;
  return NEUTRAL.includes(pos) ? role === "neutral" : role === "top" || role === "bottom";
}

/** Slot des Gegners, wenn ich in `s` stehe. */
function opposite(s: Slot): Slot {
  if (s.role === "neutral") return s;
  return { pos: s.pos, role: s.role === "top" ? "bottom" : "top" };
}

describe("Content-Paket 2", () => {
  it("hat etwa 14 Karten", () => {
    expect(EXPANSION_CARDS.length).toBeGreaterThanOrEqual(12);
    expect(EXPANSION_CARDS.length).toBeLessThanOrEqual(16);
  });

  it("IDs eindeutig und ohne Kollision mit Grund- und Deck-Karten", () => {
    const ids = EXPANSION_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const old = new Set([...BASIC_CARDS, ...DECK_CARDS].map((c) => c.id));
    for (const id of ids) expect(old.has(id), id).toBe(false);
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
  });

  it("ist Teil von CARDS und DECK_CARD_IDS, keine Grundtechnik", () => {
    for (const c of EXPANSION_CARDS) {
      expect(CARD[c.id], c.id).toBe(c);
      expect(DECK_CARD_IDS, c.id).toContain(c.id);
      expect(c.basic, c.id).toBeFalsy();
    }
  });

  it("nur bestehende Positionen, legale Rollen und Outcomes", () => {
    for (const c of EXPANSION_CARDS) {
      expect(c.slots.length, c.id).toBeGreaterThan(0);
      for (const s of c.slots) expect(legalSlot(s.pos, s.role), `${c.id} ${s.pos}/${s.role}`).toBe(true);
      for (const o of [c.success, c.onCountered, c.onCounter]) {
        if (o) expect(legalSlot(o.pos, o.role), `${c.id} → ${o.pos}/${o.role}`).toBe(true);
      }
    }
  });

  it("legale Felder: Tags, Tempo, Gas, Kontrolle, Typ-Konsistenz", () => {
    for (const c of EXPANSION_CARDS) {
      for (const t of [...(c.tags ?? []), ...(c.counters ?? []), ...(c.opening?.tags ?? [])]) {
        expect(TAGS, `${c.id}: ${t}`).toContain(t);
      }
      expect(c.gas, c.id).toBeGreaterThanOrEqual(0);
      expect(c.gas, c.id).toBeLessThanOrEqual(3);
      expect(c.requiresControl ?? 0, c.id).toBeLessThanOrEqual(5);
      if (c.kind === "angriff") {
        expect(c.tags?.length, c.id).toBeGreaterThan(0);
        expect(c.tempo, c.id).toBeGreaterThanOrEqual(1);
        expect(c.tempo, c.id).toBeLessThanOrEqual(5);
        expect(c.counters, c.id).toBeUndefined();
        if (c.submission) {
          expect(c.success, c.id).toBeUndefined();
          expect(c.requiresControl ?? 0, c.id).toBeGreaterThanOrEqual(2);
        } else expect(c.success || c.drainGas, c.id).toBeTruthy();
      }
      if (c.kind === "reaktion") {
        expect(c.counters?.length, c.id).toBeGreaterThan(0);
        expect(c.tags, c.id).toBeUndefined();
      }
      if (c.kind === "setup") {
        expect(c.tags, c.id).toBeUndefined();
        expect(c.submission, c.id).toBeFalsy();
      }
      if (c.dilemmaWith) {
        expect(CARD[c.dilemmaWith], c.id).toBeDefined();
        expect(c.dilemmaWith, c.id).not.toBe(c.id);
        expect(CARD[c.dilemmaWith].slots.some((s) => c.slots.some((t) => t.pos === s.pos && t.role === s.role)), c.id).toBe(true);
      }
    }
  });

  it("jede Reaktion kontert Angriffe, die der Gegner in diesem Slot wirklich spielen kann", () => {
    for (const c of EXPANSION_CARDS.filter((x) => x.kind === "reaktion")) {
      for (const s of c.slots) {
        const opp = opposite(s);
        const attacks = CARDS.filter((a) => a.kind === "angriff" && a.slots.some((t) => t.pos === opp.pos && t.role === opp.role));
        const hit = attacks.some((a) => a.tags?.some((t) => c.counters!.includes(t)));
        expect(hit, `${c.id} in ${s.pos}/${s.role}`).toBe(true);
      }
    }
  });

  it("Lerntexte vollständig: plain 2–4 Wörter, plainDo ≤ 12 Wörter, desc/keys/mistakes, Quelle", () => {
    for (const c of EXPANSION_CARDS) {
      expect(c.plain, c.id).toBeTruthy();
      expect(c.plainDo, c.id).toBeTruthy();
      const pw = words(c.plain!).length;
      expect(pw, `${c.id} plain: ${c.plain}`).toBeGreaterThanOrEqual(2);
      expect(pw, `${c.id} plain: ${c.plain}`).toBeLessThanOrEqual(4);
      expect(words(c.plainDo!).length, `${c.id} plainDo: ${c.plainDo}`).toBeLessThanOrEqual(12);
      expect(c.desc.length, c.id).toBeGreaterThan(20);
      expect(c.keys.length, c.id).toBeGreaterThan(0);
      expect(c.mistakes.length, c.id).toBeGreaterThan(0);
      expect(c.source || c.check, c.id).toBeTruthy();
      if (c.source) expect(c.source.url, c.id).toMatch(/^https:\/\//);
      if (c.submission) expect(c.safety, `${c.id}: Submission braucht safety`).toBeTruthy();
    }
  });

  it("keine verbotenen Techniken", () => {
    const banned = /slam|neck ?crank|heel ?hook|kani|suplex|wrist ?lock|knee ?bar|toe ?hold|can ?opener|spine|scissor ?takedown/i;
    const bannedIds = new Set(BANNED_LESSONS.map((b) => b.id));
    for (const c of EXPANSION_CARDS) {
      expect(banned.test(c.name), c.id).toBe(false);
      expect(bannedIds.has(c.id), c.id).toBe(false);
    }
  });

  it("IBJJF-Punkte: Sweep 2, Pass 3", () => {
    for (const c of EXPANSION_CARDS) {
      if (c.tags?.includes("sweep")) expect(c.success?.points, c.id).toBe(2);
      if (c.tags?.includes("pass")) expect(c.success?.points, c.id).toBe(3);
      if (c.tags?.includes("escape")) expect(c.success?.points ?? 0, c.id).toBe(0);
    }
  });

  it("Belohnungen: gültige Archetypen, nur ab Blau, jede neue Karte genau einmal", () => {
    const archIds = new Set(ARCHETYPES.map((a) => a.id));
    const expIds = new Set(EXPANSION_CARDS.map((c) => c.id));
    const seen: string[] = [];
    for (const [aid, ids] of Object.entries(EXPANSION_REWARDS)) {
      expect(archIds.has(aid), aid).toBe(true);
      const arch = ARCHETYPES.find((a) => a.id === aid)!;
      expect(arch.belt, aid).not.toBe("weiss");
      for (const id of ids) {
        expect(expIds.has(id), `${aid}: ${id}`).toBe(true);
        expect(arch.reward, `${aid}: ${id}`).toContain(id);
        seen.push(id);
      }
    }
    expect(new Set(seen).size).toBe(seen.length);
    expect([...seen].sort()).toEqual([...expIds].sort());
  });

  it("Lernreihenfolge: Abwehr vor dem passenden Angriff", () => {
    const order = ARCHETYPES.map((a) => a.id);
    const unlockIndex = (card: string) =>
      order.findIndex((aid) => (EXPANSION_REWARDS[aid] ?? []).includes(card));
    expect(unlockIndex("collar_defense")).toBeLessThan(unlockIndex("cross_collar"));
    expect(unlockIndex("shrimp_back_escape")).toBeLessThan(unlockIndex("back_armbar"));
    expect(unlockIndex("knee_shield")).toBeLessThan(unlockIndex("toreando"));
    expect(unlockIndex("wrist_control")).toBeLessThan(unlockIndex("cage_press"));
  });
});

describe("No-Gi-Fokus: Gi-Karten der alten Kampagne", () => {
  it("GI_ONLY nennt nur Bibliothekskarten, die Kragen oder Ärmel brauchen", () => {
    expect(GI_ONLY.size).toBeGreaterThan(0);
    for (const id of GI_ONLY) {
      expect(DECK_CARD_IDS, id).toContain(id);
      const c = CARD[id];
      expect([c.desc, c.de, c.plain, ...(c.keys ?? [])].join(" "), id).toMatch(/Kragen|Ärmel|Gi/);
    }
  });
});
