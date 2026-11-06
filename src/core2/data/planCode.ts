// Mechanik 7 (B59): Spielplan-Codes zum Teilen – wie die alten Deck-Codes (src/deckCode.ts): "MP1-" + base64url(Payload + Prüfbyte).
// Payload: 1 Byte Spielstil, dann pro Karte 3 Bytes = 22-Bit-Hash der Karten-ID (stabil, auch wenn neue Karten dazukommen).
// Link: …/#plan=MP1-…  Unbekannte Karten (neuere/ältere Version) werden gezählt statt falsch zugeordnet.
import { CARDS2 } from "./cards";
import { STIL_IDS } from "../engine/stil";
import type { StilId } from "../types";

export const PLAN_CODE_PREFIX = "MP1-";
const MAX_CODE_LEN = 200;
const MAX_CARDS = 30;

function fnv1a(bytes: ArrayLike<number>): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) { h ^= bytes[i]; h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
/** Stabiler 22-Bit-Hash einer Karten-ID (gleich wie in deckCode.ts). */
export function planCardHash(id: string): number {
  return fnv1a(Array.from(new TextEncoder().encode(id))) & 0x3fffff;
}
let index: Map<number, string> | null = null;
function lookup(): Map<number, string> {
  if (!index) { index = new Map(); for (const c of CARDS2) index.set(planCardHash(c.id), c.id); }
  return index;
}
const checksum = (payload: number[]) => fnv1a([0x4d, 0x50, 0x31, ...payload]) & 0xff; // "MP1" gesalzen

function toB64(bytes: number[]): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64(s: string): number[] | null {
  if (!/^[A-Za-z0-9_-]*$/.test(s) || s.length % 4 === 1) return null;
  try { return Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (ch) => ch.charCodeAt(0)); } catch { return null; }
}

/** Kodiert einen Plan (Reihenfolge egal – gleicher Plan ergibt denselben Code). */
export function encodePlan(cards: string[], stil: StilId): string {
  const payload = [Math.max(0, STIL_IDS.indexOf(stil))];
  for (const id of [...new Set(cards)].sort()) { const v = planCardHash(id) << 2; payload.push((v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff); }
  return PLAN_CODE_PREFIX + toB64([...payload, checksum(payload)]);
}

/** Dekodiert einen Plan-Code (auch einen ganzen Link mit "#plan=…"). null = kaputt. */
export function decodePlan(code: string): { cards: string[]; stil: StilId; unknown: number } | null {
  if (typeof code !== "string") return null;
  let s = code.trim();
  const at = s.indexOf("plan=");
  if (at >= 0) s = s.slice(at + 5).split(/[&#\s]/)[0];
  try { s = decodeURIComponent(s); } catch { return null; }
  if (s.length > MAX_CODE_LEN || s.slice(0, PLAN_CODE_PREFIX.length).toUpperCase() !== PLAN_CODE_PREFIX) return null;
  const bytes = fromB64(s.slice(PLAN_CODE_PREFIX.length));
  if (!bytes || bytes.length < 2 || (bytes.length - 2) % 3 !== 0) return null;
  const payload = bytes.slice(0, -1);
  if (checksum(payload) !== bytes[bytes.length - 1]) return null;
  const stil = STIL_IDS[payload[0]];
  if (!stil) return null;
  const map = lookup();
  const cards: string[] = [];
  let unknown = 0;
  for (let i = 1; i < payload.length; i += 3) {
    const v = (payload[i] << 16) | (payload[i + 1] << 8) | payload[i + 2];
    const id = map.get(v >>> 2);
    if (id) cards.push(id); else unknown++;
    if (cards.length + unknown > MAX_CARDS) return null;
  }
  return { cards, stil, unknown };
}

/** Teilen-Link für einen Plan. */
export function planLink(cards: string[], stil: StilId, origin = typeof location !== "undefined" ? location.origin : ""): string {
  return `${origin}/#plan=${encodePlan(cards, stil)}`;
}
/** Liest `#plan=<code>` aus der Adresszeile. */
export function readPlanFromHash(): ReturnType<typeof decodePlan> {
  try {
    const m = /(?:^#|&)plan=([^&]+)/.exec(window.location.hash);
    return m ? decodePlan(m[1]) : null;
  } catch { return null; }
}
