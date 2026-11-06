// Mechanik 9 „Draft“ – Speicher des laufenden Laufs (localStorage "mk.k2.draft.v1"), damit du nach dem Neuladen weitermachst.
// Gespeichert werden nur Spielstand und Karten-Namen; ein angefangener Kampf startet nach dem Neuladen neu.
import { sanitizeRun, type DraftRun } from "./run";

export const DRAFT_KEY = "mk.k2.draft.v1";

export function readRun(known: (id: string) => boolean): DraftRun | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? sanitizeRun(JSON.parse(raw), known) : null;
  } catch { return null; }
}
export function writeRun(r: DraftRun | null): void {
  try {
    if (r) localStorage.setItem(DRAFT_KEY, JSON.stringify(r));
    else localStorage.removeItem(DRAFT_KEY);
  } catch { /* privat oder voll – der Lauf geht trotzdem weiter */ }
}
