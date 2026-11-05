import type { CardDef, PositionId, Role } from "../engine/types";
import { BASIC_CARDS } from "./basics";
import { DECK_CARDS } from "./deckCards";

export const CARDS: CardDef[] = [...BASIC_CARDS, ...DECK_CARDS];

export const CARD: Record<string, CardDef> = Object.fromEntries(CARDS.map((c) => [c.id, c]));

/** Grundtechniken für eine Position/Rolle (immer spielbar, nicht im Deck). */
export function basicsFor(pos: PositionId, role: Role): CardDef[] {
  return BASIC_CARDS.filter((c) => c.slots.some((s) => s.pos === pos && s.role === role));
}

/** Nur Deck-Karten (für Deckbau und Validierung). */
export const DECK_CARD_IDS: string[] = DECK_CARDS.map((c) => c.id);

/**
 * Verbotene Techniken – NICHT spielbar, nur als Regel-Lektion in Weiß (Spec 3).
 * Quelle: BJJ Fanatics – Illegal Moves in BJJ (Sekundärquelle zum IBJJF-Regelwerk).
 */
export const BANNED_LESSONS: { id: string; name: string; why: string }[] = [
  { id: "slam", name: "Slam", why: "Im IBJJF auf allen Stufen verboten (sofortige Disqualifikation), auch der Suplex." },
  { id: "neck_crank", name: "Neck Crank", why: "Verboten, solange das Regelwerk ihn nicht ausdrücklich erlaubt – Wirbelsäulengefahr." },
  { id: "heel_hook", name: "Heel Hook", why: "Im Gi verboten; für Einsteiger wegen Knieverletzungen tabu." },
  { id: "kani_basami", name: "Kani Basami", why: "Gefährlicher Sprungangriff mit Risiko einer Knie-Überstreckung." },
];
