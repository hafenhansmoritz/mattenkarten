// ============================================================
// Deck-Codes zum Teilen: "MK1-" + base64url(Payload + Prüfbyte)
//
// Payload: pro Karte 3 Bytes = 22-Bit-Hash der Karten-ID + 2 Bit (Anzahl − 1).
// Warum Hash statt Index in einer sortierten Liste? Neue Karten verschieben
// Indizes – alte Codes würden dann still auf falsche Karten zeigen. Ein Hash
// der ID bleibt stabil; unbekannte Hashes (Karte entfernt / neuere Version)
// werden gezählt statt falsch zugeordnet. Kollisionsfreiheit prüft der Test.
// ============================================================
import { CARD, CARDS } from "./data/cards";

export const DECK_CODE_PREFIX = "MK1-";
const MAX_CODE_LEN = 400;   // Schutz vor Müll-Eingaben
const MAX_CARDS = 60;       // mehr Karten ergibt kein sinnvolles Deck
const MAX_PER_ENTRY = 4;    // 2 Bit Anzahl

/** FNV-1a 32 Bit. */
function fnv1a(bytes: ArrayLike<number>): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function utf8(s: string): number[] {
  return Array.from(new TextEncoder().encode(s));
}

/** Stabiler 22-Bit-Hash einer Karten-ID. */
export function cardHash(id: string): number {
  return fnv1a(utf8(id)) & 0x3fffff;
}

let hashIndex: Map<number, string> | null = null;
function lookup(): Map<number, string> {
  if (!hashIndex) {
    hashIndex = new Map();
    for (const c of CARDS) hashIndex.set(cardHash(c.id), c.id);
  }
  return hashIndex;
}

function checksum(payload: number[]): number {
  return fnv1a([0x4d, 0x4b, 0x31, ...payload]) & 0xff; // "MK1" gesalzen
}

function toBase64Url(bytes: number[]): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): number[] | null {
  if (!/^[A-Za-z0-9_-]*$/.test(s) || s.length % 4 === 1) return null;
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  try {
    const bin = atob(b64);
    return Array.from(bin, (ch) => ch.charCodeAt(0));
  } catch {
    return null;
  }
}

/** Kodiert eine Kartenliste (Reihenfolge egal, Duplikate erlaubt). */
export function encodeDeck(ids: string[]): string {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  // Stabile Reihenfolge → gleiches Deck ergibt immer denselben Code
  const keys = [...counts.keys()].sort();
  const payload: number[] = [];
  for (const id of keys) {
    let n = counts.get(id)!;
    const h = cardHash(id);
    while (n > 0) {
      const take = Math.min(n, MAX_PER_ENTRY);
      const v = (h << 2) | (take - 1); // 24 Bit
      payload.push((v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff);
      n -= take;
    }
  }
  return DECK_CODE_PREFIX + toBase64Url([...payload, checksum(payload)]);
}

/**
 * Dekodiert einen Deck-Code. Akzeptiert auch einen ganzen Link mit "#deck=…".
 * `unknown` = Anzahl Karten, die diese Spielversion nicht kennt.
 * Gibt `null` zurück, wenn der Code kaputt ist.
 */
export function decodeDeck(code: string): { ids: string[]; unknown: number } | null {
  if (typeof code !== "string") return null;
  let s = code.trim();
  const at = s.indexOf("deck=");
  if (at >= 0) s = s.slice(at + 5).split(/[&#\s]/)[0];
  try { s = decodeURIComponent(s); } catch { return null; }
  if (s.length > MAX_CODE_LEN) return null;
  if (s.slice(0, DECK_CODE_PREFIX.length).toUpperCase() !== DECK_CODE_PREFIX) return null;
  const bytes = fromBase64Url(s.slice(DECK_CODE_PREFIX.length));
  if (!bytes || bytes.length < 1 || (bytes.length - 1) % 3 !== 0) return null;
  const payload = bytes.slice(0, -1);
  if (checksum(payload) !== bytes[bytes.length - 1]) return null;

  const map = lookup();
  const ids: string[] = [];
  let unknown = 0;
  for (let i = 0; i < payload.length; i += 3) {
    const v = (payload[i] << 16) | (payload[i + 1] << 8) | payload[i + 2];
    const n = (v & 0b11) + 1;
    const id = map.get(v >>> 2);
    if (id) for (let k = 0; k < n; k++) ids.push(id);
    else unknown += n;
    if (ids.length + unknown > MAX_CARDS) return null;
  }
  return { ids, unknown };
}

/** Wie oft eine Karte im Deck sein darf (wie im Deckbau). */
export const maxCopies = (id: string) => (CARD[id]?.rarity === "legendaer" ? 1 : 2);

export interface AdoptResult {
  /** Neues Deck (immer 20 Karten, wenn genug eigene Karten da sind). */
  deck: string[];
  /** Übernommene Karten aus dem Code. */
  taken: string[];
  /** Karten aus dem Code, die der Spieler noch nicht besitzt (eindeutig). */
  locked: string[];
  /** Mit Karten aus dem bisherigen Deck aufgefüllt. */
  filled: number;
  /** Ausgelassen wegen Kopien-Limit oder Grundtechnik. */
  skipped: number;
}

/**
 * Übernimmt nur Karten, die der Spieler besitzt (Kopien-Limit, keine Grundtechniken).
 * Fehlende Plätze bis `size` werden mit dem bisherigen Deck aufgefüllt.
 */
export function adoptDeck(imported: string[], collection: string[], current: string[], size = 20): AdoptResult {
  const owned = new Set(collection);
  const deck: string[] = [];
  const count = (id: string) => deck.filter((x) => x === id).length;
  const locked: string[] = [];
  let skipped = 0;
  for (const id of imported) {
    const c = CARD[id];
    if (!c) continue;
    if (!owned.has(id)) { if (!locked.includes(id)) locked.push(id); continue; }
    if (c.basic || deck.length >= size || count(id) >= maxCopies(id)) { skipped++; continue; }
    deck.push(id);
  }
  const taken = [...deck];
  let filled = 0;
  for (const id of current) {
    if (deck.length >= size) break;
    const c = CARD[id];
    if (!c || c.basic || !owned.has(id) || count(id) >= maxCopies(id)) continue;
    deck.push(id);
    filled++;
  }
  return { deck, taken, locked, filled, skipped };
}
