import { describe, expect, it } from "vitest";
import { CARD, CARDS, DECK_CARD_IDS } from "./data/cards";
import { STARTER_DECK } from "./data/campaign";
import { DECK_CODE_PREFIX, adoptDeck, cardHash, decodeDeck, encodeDeck } from "./deckCode";

const sorted = (a: string[]) => [...a].sort();

/** Baut einen Code mit beliebigen Roh-Einträgen (für "unbekannte Karte"). */
function rawCode(entries: { hash: number; n: number }[]): string {
  // Über encodeDeck nicht erreichbar – Payload samt Prüfbyte hier nachbauen.
  const payload: number[] = [];
  for (const { hash, n } of entries) {
    const v = (hash << 2) | (n - 1);
    payload.push((v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff);
  }
  let h = 0x811c9dc5;
  for (const b of [0x4d, 0x4b, 0x31, ...payload]) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; }
  const bytes = [...payload, h & 0xff];
  const b64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return DECK_CODE_PREFIX + b64;
}

describe("Deck-Code", () => {
  it("Karten-Hashes sind kollisionsfrei", () => {
    const hashes = new Set(CARDS.map((c) => cardHash(c.id)));
    expect(hashes.size).toBe(CARDS.length);
  });

  it("Round Trip mit dem Starterdeck", () => {
    const code = encodeDeck(STARTER_DECK);
    expect(code.startsWith(DECK_CODE_PREFIX)).toBe(true);
    expect(code).toMatch(/^MK1-[A-Za-z0-9_-]+$/);
    const r = decodeDeck(code);
    expect(r).not.toBeNull();
    expect(sorted(r!.ids)).toEqual(sorted(STARTER_DECK));
    expect(r!.unknown).toBe(0);
  });

  it("Round Trip mit allen Deck-Karten, je 2×", () => {
    const ids = DECK_CARD_IDS.flatMap((id) => [id, id]).slice(0, 60);
    const r = decodeDeck(encodeDeck(ids));
    expect(sorted(r!.ids)).toEqual(sorted(ids));
  });

  it("mehr als 4 Kopien werden auf mehrere Einträge verteilt", () => {
    const ids = Array(6).fill("jab");
    expect(decodeDeck(encodeDeck(ids))!.ids).toEqual(ids);
  });

  it("Reihenfolge egal → gleicher Code", () => {
    expect(encodeDeck([...STARTER_DECK].reverse())).toBe(encodeDeck(STARTER_DECK));
  });

  it("kompakt: 20 Karten < 90 Zeichen", () => {
    expect(encodeDeck(STARTER_DECK).length).toBeLessThan(90);
  });

  it("leeres Deck", () => {
    expect(decodeDeck(encodeDeck([]))).toEqual({ ids: [], unknown: 0 });
  });

  it("akzeptiert ganze Links und Leerzeichen", () => {
    const code = encodeDeck(STARTER_DECK);
    expect(sorted(decodeDeck(`  https://x.app/#deck=${code}  `)!.ids)).toEqual(sorted(STARTER_DECK));
    expect(sorted(decodeDeck("mk1-" + code.slice(4))!.ids)).toEqual(sorted(STARTER_DECK));
  });

  it("lehnt kaputte Codes ab", () => {
    const code = encodeDeck(STARTER_DECK);
    const flip = code.slice(0, -2) + (code[code.length - 2] === "A" ? "B" : "A") + code[code.length - 1];
    for (const bad of ["", "hallo", "MK1-", "MK2-" + code.slice(4), "MK1-!!!!", code.slice(0, -1), flip, "MK1-" + "A".repeat(500)]) {
      expect(decodeDeck(bad), bad).toBeNull();
    }
    expect(decodeDeck(undefined as unknown as string)).toBeNull();
  });

  it("zählt unbekannte Karten statt sie falsch zuzuordnen", () => {
    const known = new Set(CARDS.map((c) => cardHash(c.id)));
    let fake = 12345;
    while (known.has(fake)) fake++;
    const code = rawCode([{ hash: cardHash("jab"), n: 2 }, { hash: fake, n: 3 }]);
    expect(decodeDeck(code)).toEqual({ ids: ["jab", "jab"], unknown: 3 });
  });
});

describe("adoptDeck", () => {
  it("übernimmt nur eigene Karten und füllt mit dem bisherigen Deck auf", () => {
    const locked = DECK_CARD_IDS.find((id) => !STARTER_DECK.includes(id))!;
    const imported = [locked, locked, "level_change", "level_change", "sprawl"];
    const r = adoptDeck(imported, Array.from(new Set(STARTER_DECK)), STARTER_DECK);
    expect(r.locked).toEqual([locked]);
    expect(r.taken).toEqual(["level_change", "level_change", "sprawl"]);
    expect(r.deck).toHaveLength(20);
    for (const id of r.deck) expect(r.deck.filter((x) => x === id).length).toBeLessThanOrEqual(CARD[id].rarity === "legendaer" ? 1 : 2);
  });
});
