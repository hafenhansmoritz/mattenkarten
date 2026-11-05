// KI-Gegner: Heuristik (Kette vorantreiben, abschließen, verteidigen, Gas) + Archetyp-Vorlieben + Yomi-Reads.
import { CARD } from "../data/cards";
import { effectiveTempo } from "./resolve";
import { playableCards } from "./match";
import type { Rng } from "./rng";
import { chainStep, dilemmaActive, intersects, other, roleOf } from "./state";
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

/**
 * Kontext-Read: Was hat der Gegner zuletzt in GENAU dieser Lage (Position + Rolle) gespielt?
 * Muster sind lageabhängig (oben in der Guard angreifen, oben in der Seitkontrolle erst festmachen) –
 * ein Read über alle Lagen gemischt rät oft falsch. Ab 2 Zügen in dieser Lage gilt der Kontext, sonst predictKind.
 */
export function predictKindIn(state: MatchState, opp: Side): CardKind | null {
  const role = roleOf(state, opp);
  const same: CardKind[] = [];
  for (const r of state.history ?? []) {
    const rRole = r.top === null ? "neutral" : r.top === opp ? "top" : "bottom";
    if (r.pos !== state.pos || rRole !== role) continue;
    const id = opp === "p" ? r.pCard : r.oCard;
    const c = CARD[id];
    if (c) same.push(c.kind);
  }
  return same.length >= 2 ? predictKind(same) : predictKind(state[opp].history);
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

const SUB_TAGS: Tag[] = ["choke", "armlock", "shoulderlock", "trianglechoke"];

/** Submissions, die der Gegner HIER mit seiner aktuellen Kontrolle ansetzen könnte (öffentliches Wissen: Slot + Griff). */
function subThreatTags(state: MatchState, opp: Side): Tag[] {
  const role = roleOf(state, opp);
  const ctrl = state[opp].control;
  const tags = new Set<Tag>();
  for (const c of Object.values(CARD)) {
    if (!c.submission || c.basic) continue;
    if (!c.slots.some((s) => s.pos === state.pos && s.role === role)) continue;
    if ((c.requiresControl ?? 0) > ctrl + 0) continue;
    for (const t of c.tags ?? []) tags.add(t);
  }
  return [...tags];
}

/** Anteil der Angriffe, die `opp` hier spielen könnte (Deck-Karten + Grundtechniken), die diese Reaktion kontert. */
function coverShare(state: MatchState, opp: Side, reaction: CardDef): number {
  const role = roleOf(state, opp);
  let all = 0, hit = 0;
  for (const c of Object.values(CARD)) {
    if (c.kind !== "angriff" || !c.slots.some((s) => s.pos === state.pos && s.role === role)) continue;
    if ((c.requiresControl ?? 0) > state[opp].control || c.gas > state[opp].gas) continue;
    const w = c.basic ? 2 : 1; // Grundtechniken hat er immer
    all += w;
    if (intersects(reaction.counters, c.tags)) hit += w;
  }
  return all ? hit / all : 0;
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
    if (card.submission) v += 6 + me.control;
    else v += progressValue(state, side, card);
    if (me.opening && intersects(me.opening, card.tags)) v += 1.5;
    // Danaher-Dilemma: Partnerkarte wurde gerade gekontert → diese Karte geht durch genau diesen Konter (System-Grappler)
    if (dilemmaActive(card, me)) v += 2 + skill(arch);
    v += (4 - effectiveTempo(card, me)) * 0.3;
    if (card.drainGas) v += opp.gas <= 4 ? 1.5 : 0.6;
  } else if (card.kind === "setup") {
    const role = roleOf(state, side);
    const gain = card.controlGain ?? 1;
    const missing = state[side].hand
      .map((id) => CARD[id])
      .filter((c) => c.slots.some((sl) => sl.pos === state.pos && sl.role === role) && (c.requiresControl ?? 0) > me.control)
      .map((c) => (c.requiresControl ?? 0) - me.control);
    const enables = missing.some((m) => m <= gain);
    // Abschluss vorbereiten: Submission/Technik auf der Hand, nur der Griff fehlt → Setup klar bevorzugen (Position vor Submission).
    // Fehlen zwei Griffe, lohnt sich das Festmachen in dominanter Position trotzdem schon.
    const dominant = role === "top" && (state.pos === "side" || state.pos === "mount" || state.pos === "back");
    const nearly = dominant && missing.some((m) => m === gain + 1);
    v += enables ? 2.4 : nearly ? 1.5 : 0.6 + gain * 0.4;
    // Frame first, then escape: Öffnung für einen Angriff, den ich hier sicher habe (Grundtechnik/Hand) –
    // unten in schlechter Position bewusst erst Platz schaffen statt blind zu fliehen (Danaher: Frames vor Hüfte).
    if (card.opening && role === "bottom") {
      const have = playableCards(state, side).some((x) => x.playable && CARD[x.id].kind === "angriff" && intersects(card.opening!.tags, CARD[x.id].tags));
      if (have) v += AI_TUNING.frameFirst * (1 + skill(arch));
    }
    if (card.backPoints && !state.backPointsAwarded[side] && state.pos === "back" && state.top === side) v += 3;
  } else {
    const threats = threatTags(state, other(side));
    const covers = (card.counters ?? []).filter((t) => threats.includes(t)).length;
    v += covers > 0 ? 0.5 + covers * 0.3 : -1.5;
    // Bedrohung: Gegner kann hier und jetzt submitten → passende Verteidigung hoch bewerten
    const subs = subThreatTags(state, other(side));
    if (subs.length > 0 && intersects(card.counters, subs)) v += AI_TUNING.subDefense * (0.2 + skill(arch) * skill(arch));
    else if (opp.control >= 2 && intersects(card.counters, SUB_TAGS)) v += 0.4;
    if (card.onCounter) v += 0.8;
  }

  // Yomi: gewählte Antwort auf den vorhergesagten Typ. Ein Konter lohnt nur, wenn er die Angriffe abdeckt,
  // die der Gegner hier realistisch hat (gewichtet nach Anteil der abgedeckten Angriffe im Slot).
  if (predicted && card.kind === BEATEN_BY[predicted]) {
    if (card.kind === "reaktion") v += AI_TUNING.readReact + 2 * coverShare(state, other(side), card);
    else v += 2.5;
  }

  // Archetyp-Vorlieben (deutlich sichtbar: Stil > kleine Heuristik-Unterschiede)
  v += (arch.likes[card.kind] ?? 0) * 0.8;
  let tagLike = 0;
  for (const t of [...(card.tags ?? []), ...(card.counters ?? [])]) tagLike = Math.max(tagLike, arch.likes[t] ?? 0);
  v += tagLike * 1.2;

  // Gas-Haushalt
  if (me.gas - card.gas <= 2) v -= card.gas * 0.8;
  if (card.gas === 0) v += 0.2;
  return v;
}

/** Stellschrauben der Schwierigkeit (per scripts/simulate.ts kalibriert). Rauschen: frühe Gegner (noiseLo) → späte (noiseHi). */
export const AI_TUNING = { noiseLo: 1.9, noiseHi: 1.0, frameFirst: 0.8, subDefense: 1, readReact: 1.5 };

/** Spielstärke 0..1, aus der Yomi-Stufe abgeleitet (reads 0.1 → 0, 0.7 → 1). Steuert Rauschen und Verteidigung. */
function skill(arch: Archetype): number {
  return Math.max(0, Math.min(1, (arch.reads - 0.1) / 0.6));
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
  const predicted = rng() < arch.reads ? (state.history ? predictKindIn(state, other(side)) : predictKind(oppHistory)) : null;

  let best = options[0].id;
  let bestV = -Infinity;
  for (const o of options) {
    // Rauschen gegen Vorhersehbarkeit – frühe Gegner wählen schlampiger
    const v = score(state, side, CARD[o.id], arch, predicted) + rng() * (AI_TUNING.noiseLo - skill(arch) * (AI_TUNING.noiseLo - AI_TUNING.noiseHi));
    if (v > bestV) { bestV = v; best = o.id; }
  }
  const intent = rng() < arch.telegraph ? CARD[best].kind : null;
  return { card: best, intent };
}
