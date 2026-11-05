// Zuglogik: Match anlegen, Ziehen, spielbare Karten, Zug spielen, Ende.
import { CARD, basicsFor } from "../data/cards";
import { resolveReveal } from "./resolve";
import { type Rng, mulberry32, shuffle } from "./rng";
import {
  HAND_SIZE, cardFitsSlot, chainStep as chainStepOf, newFighter, requiredControl,
  roleOf as roleOfState,
} from "./state";
import type { ChainStep, FighterState, MatchState, PositionId, RevealOutcome, Role, Side } from "./types";

export const roleOf = roleOfState;
export function chainStep(pos: PositionId, role: Role): ChainStep {
  return chainStepOf(pos, role);
}

export interface Playable { id: string; playable: boolean; reason?: string; basic?: boolean }

export function createMatch(pDeck: string[], oDeck: string[], seed: number, maxTurns = 12): MatchState {
  const rng = mulberry32(seed);
  for (const id of [...pDeck, ...oDeck]) if (!CARD[id]) throw new Error(`Unbekannte Karte im Deck: ${id}`);
  const state: MatchState = {
    pos: "dist", top: null, turn: 1, maxTurns,
    p: newFighter(shuffle(pDeck, rng)),
    o: newFighter(shuffle(oDeck, rng)),
    log: [{ turn: 0, text: "Kampf beginnt in der Distanz.", who: "sys" }],
    result: null,
    backPointsAwarded: { p: false, o: false },
  };
  return drawUp(state, mulberry32(seed ^ 0x5bd1e995));
}

function drawFighter(f: FighterState, rng: Rng): FighterState {
  let deck = [...f.deck];
  let discard = [...f.discard];
  const hand = [...f.hand];
  while (hand.length < HAND_SIZE) {
    if (deck.length === 0) {
      if (discard.length === 0) break;
      deck = shuffle(discard, rng); // Ablage wird neu gemischt
      discard = [];
    }
    hand.push(deck.shift()!);
  }
  return { ...f, deck, discard, hand };
}

/** Beide ziehen auf 5 Handkarten. Ohne rng wird deterministisch aus dem Zug abgeleitet. */
export function drawUp(state: MatchState, rng?: Rng): MatchState {
  const r = rng ?? mulberry32(state.turn * 7919 + state.p.deck.length * 31 + state.o.deck.length);
  return { ...state, p: drawFighter(state.p, r), o: drawFighter(state.o, r) };
}

function check(state: MatchState, side: Side, id: string): Playable {
  const card = CARD[id];
  const f = state[side];
  const role = roleOfState(state, side);
  if (!card) return { id, playable: false, reason: "Unbekannte Karte" };
  if (!cardFitsSlot(card, state.pos, role)) return { id, playable: false, reason: "Passt nicht zur Position" };
  if (f.gas < card.gas) return { id, playable: false, reason: `Braucht ${card.gas} Gas` };
  const req = requiredControl(card, f);
  if (f.control < req) return { id, playable: false, reason: `Braucht Kontrolle ${req}` };
  return { id, playable: true };
}

/** Hand + Grundtechniken des aktuellen Slots (Grundtechniken am Ende, als `basic` markiert). */
export function playableCards(state: MatchState, side: Side): Playable[] {
  const role = roleOfState(state, side);
  const hand = state[side].hand.map((id) => check(state, side, id));
  const basics = basicsFor(state.pos, role).map((c) => ({ ...check(state, side, c.id), basic: true }));
  return [...hand, ...basics];
}

export function isOver(state: MatchState): boolean {
  return state.result !== null;
}

export interface TurnResult { state: MatchState; outcome: RevealOutcome }

/**
 * Ein kompletter Zug: Auflösung (inkl. Gas-Kosten und +1 Regeneration, siehe resolve.ts),
 * Handkarte ablegen, Ziehen, Zug +1, Ende prüfen.
 */
export function playTurn(state: MatchState, pCard: string, oCard: string, rng: Rng): TurnResult {
  if (state.result) throw new Error("Match ist bereits beendet");
  for (const [side, id] of [["p", pCard], ["o", oCard]] as const) {
    const pl = playableCards(state, side).find((x) => x.id === id);
    if (!pl || !pl.playable) throw new Error(`Karte ${id} für ${side} nicht spielbar: ${pl?.reason ?? "nicht auf der Hand"}`);
  }
  const { state: resolved, outcome } = resolveReveal(state, pCard, oCard, rng);
  let s: MatchState = { ...resolved, p: discardPlayed(resolved.p, pCard), o: discardPlayed(resolved.o, oCard) };
  s = { ...s, p: cycleStale(s, "p", state.p, pCard), o: cycleStale(s, "o", state.o, oCard) };
  s = drawUp(s, rng);
  s = { ...s, turn: s.turn + 1 };
  if (!s.result && s.turn > s.maxTurns) {
    const winner: Side | null = s.p.pts > s.o.pts ? "p" : s.o.pts > s.p.pts ? "o" : null;
    s = {
      ...s, result: { type: "points", winner },
      log: [...s.log, {
        turn: state.turn, who: "sys",
        text: winner ? `Zeit! Sieg nach Punkten ${s.p.pts}:${s.o.pts}.` : `Zeit! Unentschieden ${s.p.pts}:${s.o.pts}.`,
      }],
    };
  }
  return { state: s, outcome };
}

function discardPlayed(f: FighterState, id: string): FighterState {
  const i = f.hand.indexOf(id);
  if (i < 0) return f; // Grundtechnik – nicht aus der Hand
  const hand = [...f.hand];
  hand.splice(i, 1);
  return { ...f, hand, discard: [...f.discard, id] };
}

/**
 * Hand-Rotation (Ergänzung zur Spec, damit die Hand nicht mit Karten vergangener Phasen verstopft):
 * Nach jedem Zug legt jeder höchstens eine Handkarte ab, die zu einem früheren Kettenglied gehört
 * als die aktuelle Position (z. B. Shots, wenn man im Mount ist). Wer eine Grundtechnik gespielt hat,
 * darf stattdessen irgendeine unpassende Karte ablegen (Submissions zuletzt).
 */
function cycleStale(s: MatchState, side: Side, prev: FighterState, played: string): FighterState {
  const f = s[side];
  const playedBasic = !prev.hand.includes(played);
  const role = roleOfState(s, side);
  const here = chainStepOf(s.pos, role);
  const stale = f.hand
    .filter((id) => !cardFitsSlot(CARD[id], s.pos, role))
    .map((id) => {
      const step = Math.max(...CARD[id].slots.map((sl) => chainStepOf(sl.pos, sl.role)));
      return { id, behind: step < here, w: (step < here ? 0 : 10) + step + (CARD[id].submission ? 5 : 0) };
    })
    .filter((x) => playedBasic || x.behind)
    .sort((a, b) => a.w - b.w)[0];
  return stale ? discardPlayed(f, stale.id) : f;
}
