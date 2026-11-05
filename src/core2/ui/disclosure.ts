// Kern 2 – schrittweises Aufdecken des Bretts (Progressive Disclosure, KB 8.1/8.3).
// Reiner UI-Filter: Die Engine kennt weiter alle Zonen und Karten.
import type { Card2, Zone } from "../types";
import { ZONES } from "../types";

/** Zonen, die in dieser Lektion grau bleiben ("kommt später"). Leer = alle aktiv. */
export function hiddenZones(zones?: Zone[] | null): Zone[] {
  if (!zones || zones.length === 0) return [];
  return ZONES.filter((z) => !zones.includes(z));
}

/**
 * Hand für die Lektion: nur Karten aktiver Zonen.
 * Ausnahmen: die geforderte Tutorial-Karte bleibt immer sichtbar.
 * Ist keine sichtbare Karte spielbar, kommen die spielbaren aus versteckten Zonen dazu –
 * so steckt der Spieler nie fest.
 */
export function filterHandByZones(
  cards: Card2[],
  legal: { id: string; ok: boolean }[],
  zones?: Zone[] | null,
  requireCard?: string,
): Card2[] {
  const hidden = new Set(hiddenZones(zones));
  if (hidden.size === 0) return cards;
  const lmap = new Map(legal.map((l) => [l.id, l.ok]));
  const ok = (c: Card2) => lmap.get(c.id) ?? true;
  const shown = cards.filter((c) => !hidden.has(c.zone) || c.id === requireCard);
  if (shown.some(ok)) return shown;
  return cards.filter((c) => !hidden.has(c.zone) || c.id === requireCard || ok(c));
}
