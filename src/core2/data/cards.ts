// Kern 2 – Karten (werden vom Content-Strang befüllt).
import type { Card2, Pos2, Role2 } from "../types";
export const CARDS2: Card2[] = [];
export const CARD2: Record<string, Card2> = Object.fromEntries(CARDS2.map((c) => [c.id, c]));
export function cardsFor(pos: Pos2, role: Role2): Card2[] {
  return CARDS2.filter((c) => c.slots.some((s) => s.pos === pos && s.role === role));
}
