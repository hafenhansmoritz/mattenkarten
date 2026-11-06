// Engine-API Kern 2 „Körperkarte“ (Vertrag: src/core2/types.ts).
import type { Board, Card2, Pos2, Side, State2 } from "../types";
import { ZONES } from "../types";
import { clampZone, emptyBoard } from "./board";
import { setCardRegistry } from "./registry";
import { resolveRound } from "./resolve";

export { roleOf, boardFor, other, posValue, ZONE_LABEL, POS_LABEL } from "./board";
export { legalCards, threats, PASS } from "./legal";
export { aiChoose } from "./ai";
export { setCardRegistry, cardById, slotCards, allCards } from "./registry";
export { KRAFT_MAX } from "./resolve";
export { GRIP_MAX, GRIP_EFFECT, gripsOf, gripBonus, gripFits, breakable } from "./grips";
export { needIn } from "./legal";

export const KRAFT_START = 3;

export interface NewMatchOpts {
  seed: number;
  maxRounds?: number;
  start?: { pos: Pos2; top: Side | null; board?: Partial<Board> };
  goal?: State2["goal"];
  /** false: Griffe aus (erste drei Lektionen) – Griff-Karten wirken dann nur als Keil. */
  grips?: boolean;
  /** Optional: eigenes Kartenregister (setzt das globale Register; Tests/Tutorials). */
  cards?: Card2[];
}

export function newMatch(opts: NewMatchOpts): State2 {
  if (opts.cards) setCardRegistry(opts.cards);
  const board = emptyBoard();
  if (opts.start?.board) for (const z of ZONES) { const v = opts.start.board[z]; if (v !== undefined) board[z] = clampZone(v); }
  return {
    pos: opts.start?.pos ?? "stand",
    top: opts.start ? opts.start.top : null,
    board,
    round: 1,
    maxRounds: opts.maxRounds ?? 9,
    p: { pts: 0, kraft: KRAFT_START, locked: [] },
    o: { pts: 0, kraft: KRAFT_START, locked: [] },
    subs: [],
    grips: [],
    ...(opts.grips === false ? { noGrips: true } : {}),
    history: [],
    result: null,
    goal: opts.goal,
  };
}

/** Eine Runde spielen. Karten-IDs müssen in legalCards ok sein; PASS ("pass"), wenn eine Seite keine Karte hat. */
export function playRound(s: State2, pCard: string, oCard: string) {
  return resolveRound(s, pCard, oCard);
}
