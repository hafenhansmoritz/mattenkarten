// Schritt 60: Gym-Code – Wochenthema als kurzer Code oder Link (#gym=…), ganz ohne Server.
// Format: "GYM1-" + base64url(Version, Positions-Maske (2 Byte), Tag (2 Byte), Anzahl Spiele, Spiel-Codes…, Prüfbyte).
// Positionen als Bit-Maske in fester Reihenfolge (neue Positionen nur hinten anhängen).
// Spiele über ihren festen `code` (games.ts), nie über den Listen-Index. Unbekannte Codes werden gezählt.
import type { Pos2 } from "../core2/types";
import { GAME_BY_CODE, GAME_BY_ID } from "./games";

export const GYM_CODE_PREFIX = "GYM1-";
const VERSION = 1;
const MAX_CODE_LEN = 120;
const MAX_GAMES = 24;

/** Feste Bit-Reihenfolge. Nur hinten erweitern! */
export const GYM_POS_ORDER: Pos2[] = ["stand", "clinch", "headlock", "guard", "half", "turtle", "side", "mount", "back"];

/** Tag 0 = 2024-01-01 (UTC). 2 Byte reichen bis 2203. */
const EPOCH = Date.UTC(2024, 0, 1);
const DAY = 86_400_000;

export interface GymTheme {
  positions: Pos2[];
  /** Spiel-IDs (games.ts). */
  games: string[];
  /** Datum des Wochenthemas, YYYY-MM-DD. */
  date: string;
}

export interface DecodedGym extends GymTheme {
  /** Spiele, die diese App-Version nicht kennt. */
  unknownGames: number;
}

export function dayNumber(date: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return 0;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  return Math.max(0, Math.min(0xffff, Math.round((t - EPOCH) / DAY)));
}

export function dateOfDay(n: number): string {
  const d = new Date(EPOCH + n * DAY);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function fnv1a(bytes: ArrayLike<number>): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}
const checksum = (payload: number[]) => fnv1a([0x47, 0x59, 0x4d, ...payload]) & 0xff; // "GYM" gesalzen

function toBase64Url(bytes: number[]): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): number[] | null {
  if (!/^[A-Za-z0-9_-]*$/.test(s) || s.length % 4 === 1) return null;
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  try {
    return Array.from(atob(b64), (ch) => ch.charCodeAt(0));
  } catch {
    return null;
  }
}

/** Wochenthema → Code. Unbekannte Positionen und Spiele werden still ausgelassen. */
export function encodeGym(t: GymTheme): string {
  let mask = 0;
  for (const p of t.positions) {
    const i = GYM_POS_ORDER.indexOf(p);
    if (i >= 0) mask |= 1 << i;
  }
  const codes = [...new Set(t.games.map((id) => GAME_BY_ID[id]?.code).filter((c): c is number => !!c))]
    .sort((x, y) => x - y)
    .slice(0, MAX_GAMES);
  const day = dayNumber(t.date);
  const payload = [VERSION, (mask >>> 8) & 0xff, mask & 0xff, (day >>> 8) & 0xff, day & 0xff, codes.length, ...codes];
  return GYM_CODE_PREFIX + toBase64Url([...payload, checksum(payload)]);
}

/**
 * Code (oder ganzer Link mit „#gym=…“) → Wochenthema. `null`, wenn kaputt.
 * Braucht mindestens eine bekannte Position.
 */
export function decodeGym(input: unknown): DecodedGym | null {
  if (typeof input !== "string") return null;
  let s = input.trim();
  const at = s.indexOf("gym=");
  if (at >= 0) s = s.slice(at + 4).split(/[&#\s]/)[0];
  try { s = decodeURIComponent(s); } catch { return null; }
  if (s.length > MAX_CODE_LEN) return null;
  if (s.slice(0, GYM_CODE_PREFIX.length).toUpperCase() !== GYM_CODE_PREFIX) return null;
  const bytes = fromBase64Url(s.slice(GYM_CODE_PREFIX.length));
  if (!bytes || bytes.length < 7) return null;
  const payload = bytes.slice(0, -1);
  if (checksum(payload) !== bytes[bytes.length - 1]) return null;
  if (payload[0] !== VERSION) return null;
  const n = payload[5];
  if (n > MAX_GAMES || payload.length !== 6 + n) return null;

  const mask = (payload[1] << 8) | payload[2];
  const positions = GYM_POS_ORDER.filter((_, i) => mask & (1 << i));
  if (!positions.length) return null;
  const date = dateOfDay((payload[3] << 8) | payload[4]);
  const games: string[] = [];
  let unknownGames = 0;
  for (const c of payload.slice(6)) {
    const g = GAME_BY_CODE[c];
    if (g && !games.includes(g.id)) games.push(g.id);
    else if (!g) unknownGames++;
  }
  return { positions, games, date, unknownGames };
}

/** Liest `#gym=<code>` aus der Adresszeile. */
export function readGymFromHash(hash: string = typeof window !== "undefined" ? window.location.hash : ""): DecodedGym | null {
  const m = /(?:^#|&)gym=([^&]+)/.exec(hash);
  return m ? decodeGym(m[1]) : null;
}

export function gymLink(code: string, origin: string = window.location.origin): string {
  return `${origin}/#gym=${code}`;
}
