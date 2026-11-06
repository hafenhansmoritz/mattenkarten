// Mechanik 3 „Kette“ (Spec B35–B37). Vorbild: Combo (Hearthstone) und Lethal-Anzeige.
// BJJ: Techniken kommen in Ketten – wehrt er die eine ab, öffnet er die nächste (Armbar → Triangle, Americana ↔ Armbar,
// Snap Down → Go-Behind). Eine Wirkung für alle Ketten: die Ketten-Karte braucht in ihrer Zone 1 weniger.
import type { Card2, Side, State2, Zone } from "../types";
import { roleOf } from "./board";
import { allCards, cardById } from "./registry";

/** Wirkung einer Kette: so viel weniger braucht die Ketten-Karte in ihrer Zone. */
export const CHAIN_EFFECT = 1;

/** Passt Karte `prev` zu einem Eintrag in `after`? Karten-ID oder Tag "sub:<Aufgabe-ID>". */
export function matchesAfter(after: string[], prev: Card2): boolean {
  return after.some((a) => a === prev.id || (a.startsWith("sub:") && prev.submission?.id === a.slice(4)));
}

/** Eigene Karte der Vorrunde – nur, wenn die Lage seitdem dieselbe ist oder genau diese Karte sie herbeigeführt hat
 *  (Snap Down → Kopfklammer). Hat er die Lage gewechselt (Sweep, Flucht), ist die Kette gerissen. */
export function chainPrev(s: Pick<State2, "history" | "pos" | "top">, side: Side): Card2 | null {
  const last = s.history[s.history.length - 1];
  if (!last) return null;
  const prev = cardById(side === "p" ? last.pCard : last.oCard);
  if (!prev) return null;
  const same = s.pos === last.posBefore && s.top === last.topBefore;
  const byIt = !!prev.to && s.pos === prev.to.pos && roleOf(s as State2, side) === prev.to.role;
  return same || byIt ? prev : null;
}

/** Ist die Kette dieser Karte für side gerade bereit? Gibt die Vorrunden-Karte zurück (sonst null). */
export function chainFrom(s: State2, side: Side, c: Pick<Card2, "chain" | "kind">): Card2 | null {
  if (!c.chain || c.kind !== "angriff" || s.noChains) return null;
  const prev = chainPrev(s, side);
  return prev && matchesAfter(c.chain.after, prev) ? prev : null;
}

/** Bonus von side für Karte c in Zone z (nur in der eigenen Zone der Karte). */
export function chainBonus(s: State2, side: Side, c: Pick<Card2, "chain" | "kind" | "zone">, z: Zone): number {
  return z === c.zone && chainFrom(s, side, c) ? CHAIN_EFFECT : 0;
}

/** Lesbare Namen der Vorgänger-Techniken einer Ketten-Karte (Fachbegriff, Tag "sub:x" → Name der Aufgabe). */
export function chainAfterNames(c: Pick<Card2, "chain">): string[] {
  if (!c.chain) return [];
  return c.chain.after.map((a) => {
    if (a.startsWith("sub:")) return allCards().find((x) => x.submission?.id === a.slice(4))?.submission?.name ?? a.slice(4);
    return cardById(a)?.term ?? a;
  });
}
