// Kern 2 – schlanke KI-gegen-KI-Simulation für Tests (Balance-CI, Bosse) und simulate2.ts.
// Deterministisch: gleicher Seed → gleiches Match.
import { mulberry32 } from "../../engine/rng";
import type { Card2, Pos2, Role2, Side, StilId, State2 } from "../types";
import { aiChoose, type AiStyle } from "./ai";
import { roleOf } from "./board";
import { newMatch, playRound } from "./index";
import { PASS } from "./legal";
import { cardById } from "./registry";
import { splitPlay } from "./konter";
import { STIL_IDS } from "./stil";
import { stilAi } from "../data/stile";
import { isGrundlage, aiMulligan, mulligan } from "./plan";

/** stil (Mechanik 5): Spielstil dieser Seite – Stufe 1 setzt seine Fähigkeit ein, sobald sie geht, Stufe 2/3 gezielt (B47). */
export interface SimPlayer { level: 1 | 2 | 3; style?: AiStyle; stil?: StilId; /** Mechanik 6: Spielplan (15 Karten-IDs) – fehlt er, volle Hand. */ plan?: string[] }

/** Fester „zufälliger“ Spielstil je Seed und Seite (Balance-Sim: freie Matches haben beide einen Stil). */
export function seedStil(seed: number, side: Side): StilId {
  const x = Math.imul(seed ^ (side === "p" ? 0x9e3779b9 : 0x85ebca6b), 0x27d4eb2d) >>> 0;
  return STIL_IDS[(x >>> 13) % STIL_IDS.length];
}

export interface SimPick { side: Side; pos: Pos2; role: Role2; card: string }

export interface SimMatch {
  state: State2;
  /** Erreichte Lagen je Seite, Schlüssel "pos/role" aus Sicht dieser Seite. */
  slots: Record<Side, Set<string>>;
  /** Erreichte Positionen (ohne Rolle). */
  reached: Set<Pos2>;
  picks: SimPick[];
}

/** Ein Match zwischen zwei KI-Spielern. */
export function simMatch(p: SimPlayer, o: SimPlayer, seed: number, opts: { maxRounds?: number } = {}): SimMatch {
  const rng = mulberry32(seed);
  let s = newMatch({ seed, ...(opts.maxRounds ? { maxRounds: opts.maxRounds } : {}), stil: { p: p.stil, o: o.stil }, ...(p.plan || o.plan ? { plan: { p: p.plan, o: o.plan } } : {}) });
  // Mechanik 6 (B53): beide machen vor Runde 1 ihren Mulligan (nur mit Blick auf die eigenen 4 Karten).
  for (const side of ["p", "o"] as Side[]) if (s.plan?.[side]) s = mulligan(s, side, aiMulligan(s.plan[side]!.hand, cardById));
  const slots: Record<Side, Set<string>> = { p: new Set(), o: new Set() };
  const reached = new Set<Pos2>();
  const note = () => {
    reached.add(s.pos);
    for (const side of ["p", "o"] as Side[]) slots[side].add(`${s.pos}/${roleOf(s, side)}`);
  };
  note();
  const picks: SimPick[] = [];
  let guard = 0;
  while (!s.result && guard++ < 60) {
    const ids = { p: "", o: "" } as Record<Side, string>;
    for (const side of ["p", "o"] as Side[]) {
      const pl = side === "p" ? p : o;
      ids[side] = aiChoose(s, side, pl.level, rng, pl.style);
      // Mechanik 4: ein zusätzlich gelegter Konter zählt nicht als Entscheidung – gezählt wird die offen gespielte Karte.
      const played = splitPlay(ids[side]).card;
      if (played !== PASS) picks.push({ side, pos: s.pos, role: roleOf(s, side), card: played });
    }
    s = playRound(s, ids.p, ids.o).state;
    note();
  }
  return { state: s, slots, reached, picks };
}

/** Anteil der Runden, die side in einer dieser Lagen ("pos/role" aus Sicht von side) beginnt. */
export function roundShare(m: SimMatch, side: Side, keys: string[]): { n: number; rounds: number } {
  let n = 0;
  for (const r of m.state.history) {
    const role: Role2 = r.topBefore === null ? "neutral" : r.topBefore === side ? "top" : "bottom";
    if (keys.includes(`${r.posBefore}/${role}`)) n++;
  }
  return { n, rounds: m.state.history.length };
}

export { isGrundlage } from "./plan";

/** Anteil der Unten-Entscheidungen, die Grundlage-Karten sind. */
export function grundlageShare(picks: SimPick[]): { n: number; bottom: number } {
  let n = 0, bottom = 0;
  for (const pk of picks) {
    if (pk.role !== "bottom") continue;
    bottom++;
    if (isGrundlage(cardById(pk.card), pk.pos, pk.role)) n++;
  }
  return { n, bottom };
}

/** B47: Spieler für freie Matches – Stufe 2/3 mit dem A-Game-Profil ihres Stils (Abschlüsse des Stils), Stufe 1 ohne. */
export function stilPlayer(level: 1 | 2 | 3, stil: StilId): SimPlayer {
  return { level, stil, ...(level > 1 ? { style: stilAi(stil) } : {}) };
}
