// Engine-API Kern 2 „Körperkarte“ (Vertrag: src/core2/types.ts).
import type { Board, Card2, Pos2, Side, StilId, State2 } from "../types";
import { ZONES } from "../types";
import { clampZone, emptyBoard } from "./board";
import { setCardRegistry } from "./registry";
import { resolveRound } from "./resolve";
import { initPlan } from "./plan";

export { roleOf, boardFor, other, posValue, ZONE_LABEL, POS_LABEL } from "./board";
export { legalCards, threats, PASS } from "./legal";
export { aiChoose } from "./ai";
export { setCardRegistry, cardById, slotCards, allCards } from "./registry";
export { KRAFT_MAX } from "./resolve";
export { GRIP_MAX, GRIP_EFFECT, gripsOf, gripBonus, gripFits, breakable } from "./grips";
export { needIn, finishThreats, type FinishThreat } from "./legal";
export { CHAIN_EFFECT, chainFrom, chainPrev, chainAfterNames } from "./chains";
export {
  KONTER_COST, KONTER_ROUNDS, KONTER_PREFIX, withKonter, splitPlay, konterOf, konterOptions,
  checkKonter, canKonter, konterTargets, konterCards, publicView, konterBelief, withStil, STIL_TAG,
} from "./konter";
export {
  STIL_COST, STIL_GAIN, STIL_COOLDOWN, STIL_POWERS, STIL_POWER, STIL_IDS, stilOf, stilFits, stilReadyRound, checkStil, stilStats,
} from "./stil";

export {
  PLAN_SIZE, PLAN_START, PLAN_DRAW, MULLIGAN_MAX, PLAN_SHARP, planSharp, isBasic, isPlanCard, planBlock, canMulligan, mulligan, planPlayed, aiMulligan, planErrors, planOf,
} from "./plan";

export const KRAFT_START = 3;

export interface NewMatchOpts {
  seed: number;
  maxRounds?: number;
  start?: { pos: Pos2; top: Side | null; board?: Partial<Board> };
  goal?: State2["goal"];
  /** false: Griffe aus (erste drei Lektionen) – Griff-Karten wirken dann nur als Keil. */
  grips?: boolean;
  /** false: Ketten aus (erste drei Lektionen, Mechanik 3). */
  chains?: boolean;
  /** false: Konter aus (erste drei Lektionen, Mechanik 4). */
  konter?: boolean;
  /** Mechanik 5: Spielstil je Seite (fehlt = keine Stil-Fähigkeit; Lektionen setzen keinen). */
  stil?: Partial<Record<Side, StilId>>;
  /** Mechanik 6: Spielplan je Seite (Karten-IDs, 15) – fehlt er, hat die Seite die volle Hand. */
  plan?: Partial<Record<Side, string[] | undefined>>;
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
    ...(opts.chains === false ? { noChains: true } : {}),
    ...(opts.konter === false ? { noKonter: true } : {}),
    ...(opts.stil && (opts.stil.p || opts.stil.o) ? { stil: { ...opts.stil } } : {}),
    ...(opts.plan && (opts.plan.p || opts.plan.o) ? { plan: Object.fromEntries((["p", "o"] as Side[]).filter((x) => opts.plan![x]).map((x) => [x, initPlan(opts.plan![x]!, opts.seed, x)])) } : {}),
    history: [],
    result: null,
    goal: opts.goal,
  };
}

/** Eine Runde spielen. Karten-IDs müssen in legalCards ok sein; PASS ("pass"), wenn eine Seite keine Karte hat. */
export function playRound(s: State2, pCard: string, oCard: string) {
  return resolveRound(s, pCard, oCard);
}
