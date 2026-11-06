// Mechanik 2 „Griffe bleiben liegen“ (Spec B31–B34). Vorbild: Permanents (Magic) / Diener (Hearthstone).
// BJJ: Kontrolle ist ein Zustand, kein Moment – ein Griff bleibt, bis man ihn aktiv löst (Grip Fighting).
// Eine Wirkung für alle Griffe: deine Angriffe brauchen in der Zone des Griffs 1 weniger.
import type { Card2, Grip2, Pos2, Role2, Side, State2, Zone } from "../types";
import { roleOf } from "./board";
import { allCards } from "./registry";

/** Höchstens so viele Griffe je Spieler; ein neuer ersetzt den ältesten (zwei Hände). */
export const GRIP_MAX = 2;
/** Wirkung eines Griffs: so viel weniger brauchen deine Angriffe in seiner Zone. */
export const GRIP_EFFECT = 1;

let slotCache: { src: Card2[]; len: number; by: Map<string, { pos: Pos2; role: Role2 }[]> } | null = null;

/** Lagen, in denen ein Griff liegen bleibt: Slots aller Karten mit dieser Griff-ID (z. B. Seatbelt: Rücken oben, Turtle oben). */
export function gripSlots(id: string): { pos: Pos2; role: Role2 }[] {
  const src = allCards();
  if (!slotCache || slotCache.src !== src || slotCache.len !== src.length) {
    const by = new Map<string, { pos: Pos2; role: Role2 }[]>();
    for (const c of src) if (c.grip) by.set(c.grip.id, [...(by.get(c.grip.id) ?? []), ...c.slots]);
    slotCache = { src, len: src.length, by };
  }
  return slotCache.by.get(id) ?? [];
}

/** Passt der Griff zur Lage (Position + Rolle seines Besitzers)? */
export function gripFits(s: Pick<State2, "pos" | "top">, g: Pick<Grip2, "id" | "owner">): boolean {
  const role = roleOf(s as State2, g.owner);
  return gripSlots(g.id).some((sl) => sl.pos === s.pos && sl.role === role);
}

/** Liegende Griffe (leer, wenn Griffe aus sind). */
export function gripsOf(s: State2, side?: Side): Grip2[] {
  if (s.noGrips) return [];
  const gs = s.grips ?? [];
  return side ? gs.filter((g) => g.owner === side) : gs;
}

/** Bonus von side in zone durch eigene Griffe (0 oder GRIP_EFFECT; Griffe in derselben Zone stapeln nicht). */
export function gripBonus(s: State2, side: Side, zone: Zone): number {
  return gripsOf(s, side).some((g) => g.zone === zone) ? GRIP_EFFECT : 0;
}

/** Gegnerische Griffe, die Karte c lösen würde (B32 „Griff lösen“). */
export function breakable(s: State2, side: Side, c: Card2): Grip2[] {
  if (!c.breaks?.length) return [];
  return gripsOf(s).filter((g) => g.owner !== side && c.breaks!.includes(g.id));
}
