import type { CardDef, PositionId, Role } from "../engine/types";
import { BASIC_CARDS } from "./basics";
import { DECK_CARDS } from "./deckCards";

import { EXPANSION_CARDS } from "./expansion";
export const CARDS: CardDef[] = [...BASIC_CARDS, ...DECK_CARDS, ...EXPANSION_CARDS];

export const CARD: Record<string, CardDef> = Object.fromEntries(CARDS.map((c) => [c.id, c]));

/** Grundtechniken für eine Position/Rolle (immer spielbar, nicht im Deck). */
export function basicsFor(pos: PositionId, role: Role): CardDef[] {
  return BASIC_CARDS.filter((c) => c.slots.some((s) => s.pos === pos && s.role === role));
}

/** Nur Deck-Karten (für Deckbau und Validierung). */
export const DECK_CARD_IDS: string[] = [...DECK_CARDS, ...EXPANSION_CARDS].map((c) => c.id);

/**
 * Verbotene Techniken – NICHT spielbar, nur als Regel-Lektion in Weiß (Spec 3).
 * Quelle: BJJ Fanatics – Illegal Moves in BJJ (Sekundärquelle zum IBJJF-Regelwerk).
 */
/** No-Gi-Fokus (KB 8.12): Karten der alten Kampagne, die nur mit Gi funktionieren (Kragen-/Ärmelgriffe).
 *  Seit dem UX-Review 2026-11-06 sind alle drei auf No-Gi umgeschrieben (Arm Triangle, Hände an den Hals,
 *  Scissor Sweep mit Nacken + Handgelenk) – die Menge bleibt als Schalter für künftige Gi-Karten. */
export const GI_ONLY: ReadonlySet<string> = new Set<string>([]);

export const BANNED_LESSONS: { id: string; name: string; why: string }[] = [
  { id: "slam", name: "Slam", why: "Im IBJJF auf allen Stufen verboten (sofortige Disqualifikation), auch der Suplex." },
  { id: "neck_crank", name: "Neck Crank", why: "Verboten, solange das Regelwerk ihn nicht ausdrücklich erlaubt – Wirbelsäulengefahr." },
  { id: "heel_hook", name: "Heel Hook", why: "Im Gi verboten; für Einsteiger wegen Knieverletzungen tabu." },
  { id: "kani_basami", name: "Kani Basami", why: "Gefährlicher Sprungangriff mit Risiko einer Knie-Überstreckung." },
];
