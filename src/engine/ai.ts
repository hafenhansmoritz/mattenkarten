// KI-Gegner: Heuristik (Kette vorantreiben, abschließen, verteidigen, Gas) + Archetyp-Vorlieben + Yomi-Reads.
import { CARD } from "../data/cards";
import { effectiveTempo } from "./resolve";
import { playableCards } from "./match";
import type { Rng } from "./rng";
import { chainStep, intersects, other, roleOf } from "./state";
import type { Archetype, CardDef, CardKind, MatchState, Side, Tag } from "./types";

/** Welcher Typ schlägt welchen (Dreieck). */
export const BEATS: Record<CardKind, CardKind> = { angriff: "setup", setup: "reaktion", reaktion: "angriff" };
export const BEATEN_BY: Record<CardKind, CardKind> = { setup: "angriff", reaktion: "setup", angriff: "reaktion" };

/** Vorhersage des nächsten Typs aus den letzten 3 Zügen (häufigster, bei Gleichstand der jüngste). */
export function predictKind(history: CardKind[]): CardKind | null {
  const last = history.slice(-3);
  if (last.length === 0) return null;
  const count: Record<string, number> = {};
  for (const k of last) count[k] = (count[k] ?? 0) + 1;
  let best: CardKind = last[last.length - 1];
  for (const k of last) if (count[k] > count[best]) best = k;
  return best;
}

/** Tags, die der Gegner aus dieser Position realistisch angreifen kann (für Reaktionswert). */
function threatTags(state: MatchState, opp: Side): Tag[] {
  const pos = state.pos;
  const role = roleOf(state, opp);
  const tags = new Set<Tag>();
  for (const c of Object.values(CARD)) {
    if (c.kind !== "angriff") continue;
    if (!c.slots.some((s) => s.pos === pos && s.role === role)) continue;
    for (const t of c.tags ?? []) tags.add(t);
  }
  return [...tags];
}

function progressValue(state: MatchState, side: Side, card: CardDef): number {
  const o = card.success;
  if (!o) return 0;
  const before = chainStep(state.pos, roleOf(state, side));
  const after = chainStep(o.pos, o.role);
  return (after - before) * 1.5 + (o.points ?? 0) * 0.6 + (o.role === "top" ? 0.8 : 0);
}

function score(state: MatchState, side: Side, card: CardDef, arch: Archetype, predicted: CardKind | null): number {
  const me = state[side];
  const opp = state[other(side)];
  let v = 1;

  if (card.kind === "angriff") {
    if (card.submission) v += 5 + me.control;
    else v += progressValue(state, side, card);
    if (me.opening && intersects(me.opening, card.tags)) v += 1.5;
    v += (4 - effectiveTempo(card, me)) * 0.3;
    if (card.drainGas) v += opp.gas <= 4 ? 1.5 : 0.6;
  } else if (card.kind === "setup") {
    const role = roleOf(state, side);
    const enables = state[side].hand.some((id) => {
      const c = CARD[id];
      const req = c.requiresControl ?? 0;
      return c.slots.some((sl) => sl.pos === state.pos && sl.role === role)
        && req > me.control && req <= me.control + (card.controlGain ?? 1);
    });
    v += enables ? 2 : 0.6 + (card.controlGain ?? 1) * 0.4;
    if (card.backPoints && !state.backPointsAwarded[side] && state.pos === "back" && state.top === side) v += 3;
  } else {
    const threats = threatTags(state, other(side));
    const covers = (card.counters ?? []).filter((t) => threats.includes(t)).length;
    v += covers > 0 ? 0.5 + covers * 0.3 : -1.5;
    // Bedrohung: Gegner kann submitten
    if (opp.control >= 2 && intersects(card.counters, ["choke", "armlock", "shoulderlock", "trianglechoke"])) v += 0.8;
    if (card.onCounter) v += 0.8;
  }

  // Yomi: gewählte Antwort auf den vorhergesagten Typ
  if (predicted && card.kind === BEATEN_BY[predicted]) v += 2.5;

  // Archetyp-Vorlieben
  v += (arch.likes[card.kind] ?? 0) * 0.6;
  for (const t of [...(card.tags ?? []), ...(card.counters ?? [])]) v += (arch.likes[t] ?? 0) * 0.5;

  // Gas-Haushalt
  if (me.gas - card.gas <= 2) v -= card.gas * 0.8;
  if (card.gas === 0) v += 0.2;
  return v;
}

export function chooseCard(state: MatchState, arch: Archetype, rng: Rng, side: Side = "o"): { card: string; intent: CardKind | null } {
  let options = playableCards(state, side).filter((x) => x.playable);
  // Tutorial: Gegner spielt nur Karten eines Typs (falls möglich)
  const scripted = side === "o" ? state.options?.scriptedKind : undefined;
  if (scripted) {
    const only = options.filter((x) => CARD[x.id].kind === scripted);
    if (only.length > 0) options = only;
  }
  if (options.length === 0) throw new Error("Keine spielbare Karte – Grundtechniken fehlen für diesen Slot");

  const oppHistory = state[other(side)].history;
  const predicted = rng() < arch.reads ? predictKind(oppHistory) : null;

  let best = options[0].id;
  let bestV = -Infinity;
  for (const o of options) {
    const v = score(state, side, CARD[o.id], arch, predicted) + rng() * 1.2; // etwas Rauschen gegen Vorhersehbarkeit
    if (v > bestV) { bestV = v; best = o.id; }
  }
  const intent = rng() < arch.telegraph ? CARD[best].kind : null;
  return { card: best, intent };
}
