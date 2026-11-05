// Erweiterungs-Karten (Content-Paket 2). Wird von cards.ts eingebunden; Belohnungen von campaign.ts.
import type { CardDef } from "../engine/types";
export const EXPANSION_CARDS: CardDef[] = [];
/** Zusätzliche Belohnungen je Archetyp-id (werden an reward angehängt). */
export const EXPANSION_REWARDS: Record<string, string[]> = {};
