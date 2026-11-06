// Mechanik 10 „Gürtel-Rangliste“ – Speicher (localStorage "mk.k2.rangliste.v1"): Gürtel, Streifen, versteckte Wertung,
// Saison, Rahmen und die letzten 20 Kämpfe. Das Ergebnis wird beim Kampfende sofort gespeichert; ein angefangener Kampf startet neu.
import { localDate, newLadder, sanitizeLadder, type LadderState } from "./ladder";
import type { StilId } from "../types";

export const LADDER_KEY = "mk.k2.rangliste.v1";

export function readLadder(today = localDate()): LadderState | null {
  try {
    const raw = localStorage.getItem(LADDER_KEY);
    return raw ? sanitizeLadder(JSON.parse(raw), today) : null;
  } catch { return null; }
}
/** Gespeicherter Stand (mit Saisonwechsel) oder ein neuer. */
export function loadLadder(stil: StilId, today = localDate()): LadderState {
  return readLadder(today) ?? newLadder(Date.now() >>> 0, today, stil);
}
export function writeLadder(s: LadderState): void {
  try { localStorage.setItem(LADDER_KEY, JSON.stringify(s)); } catch { /* privat oder voll – die Rangliste geht in dieser Sitzung weiter */ }
}
/** Gewählter Kartenrücken-Rahmen (Gürtel-Index) für das Paket-Öffnen; null = Standard. */
export function activeFrame(): number | null {
  return readLadder()?.frame ?? null;
}
