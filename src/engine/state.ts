// Kleine, reine Helfer rund um MatchState (von resolve, match und ai genutzt).
import type { CardDef, ChainStep, FighterState, MatchState, PositionId, Role, Side, Tag } from "./types";

export const MAX_GAS = 12;
export const MAX_CONTROL = 5;
export const HAND_SIZE = 5;

export const other = (s: Side): Side => (s === "p" ? "o" : "p");
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function roleOf(state: MatchState, side: Side): Role {
  if (state.top === null) return "neutral";
  return state.top === side ? "top" : "bottom";
}

/** Kettenglied aus Sicht eines Kämpfers (1 Distanz … 4 Kontrolle; 5 = Submission, nur bei Sieg). */
export function chainStep(pos: PositionId, role: Role): ChainStep {
  if (pos === "dist") return 1;
  if (pos === "clinch") return 2;
  if (role === "bottom") return pos === "guard" ? 3 : 2;
  if (pos === "fhl" || pos === "guard") return 3;
  return 4;
}

export function cardFitsSlot(card: CardDef, pos: PositionId, role: Role): boolean {
  return card.slots.some((s) => s.pos === pos && s.role === role);
}

export function intersects(a: readonly Tag[] | undefined, b: readonly Tag[] | undefined): boolean {
  if (!a || !b) return false;
  return a.some((t) => b.includes(t));
}

/** Danaher-Dilemma aktiv? Partnerkarte wurde im letzten eigenen Zug gekontert. */
export function dilemmaActive(card: CardDef, f: FighterState): boolean {
  return !!card.dilemmaWith && f.lastPlayed === card.dilemmaWith && !!f.lastCounteredBy;
}

/** Effektive Mindest-Kontrolle: im aktiven Dilemma entfällt sie (Danaher: den verwundbaren Moment nutzen). */
export function requiredControl(card: CardDef, f: FighterState): number {
  if (dilemmaActive(card, f)) return 0;
  return card.requiresControl ?? 0;
}

export function newFighter(deck: string[]): FighterState {
  return {
    pts: 0, gas: MAX_GAS, control: 0, deck, hand: [], discard: [],
    opening: null, lastPlayed: null, lastCounteredBy: null, history: [],
  };
}
