// Kartenregister der Engine. Default: echte Daten aus src/core2/data/cards.ts (CARDS2).
// Tests (und Tutorials) können ein eigenes Register setzen.
import { CARDS2 } from "../data/cards";
import type { Card2, Pos2, Role2 } from "../types";

let override: Card2[] | null = null;
let cache: { src: Card2[]; len: number; byId: Map<string, Card2>; bySlot: Map<string, Card2[]> } | null = null;

/** Eigenes Kartenregister setzen (null = zurück zu CARDS2). */
export function setCardRegistry(cards: Card2[] | null): void {
  override = cards;
  cache = null;
}

export function allCards(): Card2[] {
  return override ?? CARDS2;
}

function idx() {
  const src = allCards();
  if (!cache || cache.src !== src || cache.len !== src.length) {
    const byId = new Map<string, Card2>();
    const bySlot = new Map<string, Card2[]>();
    for (const c of src) {
      byId.set(c.id, c);
      for (const sl of c.slots) {
        const k = `${sl.pos}|${sl.role}`;
        const arr = bySlot.get(k) ?? [];
        if (!arr.includes(c)) arr.push(c);
        bySlot.set(k, arr);
      }
    }
    cache = { src, len: src.length, byId, bySlot };
  }
  return cache;
}

export function cardById(id: string): Card2 | undefined {
  return idx().byId.get(id);
}

export function slotCards(pos: Pos2, role: Role2): Card2[] {
  return idx().bySlot.get(`${pos}|${role}`) ?? [];
}
