// Test-Helfer: Zustand an beliebiger Position bauen.
import { STARTER_DECK } from "../data/campaign";
import { createMatch } from "./match";
import type { FighterState, MatchState, PositionId, Side } from "./types";

export function stateAt(
  pos: PositionId, top: Side | null,
  p: Partial<FighterState> = {}, o: Partial<FighterState> = {},
  extra: Partial<MatchState> = {},
): MatchState {
  const base = createMatch(STARTER_DECK, STARTER_DECK, 1);
  return { ...base, pos, top, p: { ...base.p, ...p }, o: { ...base.o, ...o }, ...extra };
}
