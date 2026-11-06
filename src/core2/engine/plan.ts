// Mechanik 6 „Spielplan-Modus“ (Spec B51–B56). Vorbild: Deck, Nachziehen, Handlimit und Mulligan (Hearthstone/Magic).
// BJJ: Niemand kann alles. Du hast einen kleinen Spielplan – ein System – und spielst ihn (Danaher: Systeme, „A-Game“).
// Regel in zwei Sätzen: Dein Spielplan sind 15 Angriffe – du startest mit 4, tauschst einmal bis zu 2 und ziehst jede Runde 1.
// Gezogene Angriffe sind geübt und brauchen in ihrer Zone 1 weniger; Aufbauen und Verteidigen kann jeder, immer.
import { mulberry32, shuffle } from "../../engine/rng";
import type { Card2, Plan2, Pos2, Role2, Side, State2 } from "../types";
import { roleOf } from "./board";

/** Karten im Spielplan. */
export const PLAN_SIZE = 15;
/** So viele Karten hast du vor Runde 1 gezogen. */
export const PLAN_START = 4;
/** So viele ziehst du nach jeder Runde nach. */
export const PLAN_DRAW = 1;
/** Mulligan: so viele der Startkarten darfst du einmal tauschen. */
export const MULLIGAN_MAX = 2;
/** B52 „Geübt“: gezogene Spielplan-Angriffe brauchen in ihrer Zone so viel weniger (wie ein Griff, stapelt mit Griff und Kette). */
export const PLAN_SHARP = 1;

/** Lagen, in denen man festgehalten wird (Unten-Kontrolle) – hier sind Rahmen und Befreiungen die Grundlage. */
const PINNED = new Set<Pos2>(["side", "mount", "back", "turtle", "headlock", "half"]);

/** Aufbauen-Karten, die selbst ein Rahmen bzw. Handkampf sind (Ellbogen-Knie, Unterarm-Stütze, Knie innen, Hände gegen Hände). */
const FRAME_BUILDS = new Set(["bot_elbow_knee", "scb_frame", "mb_knee_inside", "bb_hand_fight", "hlb_hands", "tb_hands"]);

/**
 * B29 Didaktik-Metrik „Grundlage“: Karten, die ein Anfänger zuerst können muss, wenn er unten liegt –
 * Rahmen (jede Verteidigung), Befreiungen (Weg raus aus einer Festhalte-Lage; aus der Guard nur Aufstehen/Guard halten)
 * und Aufbauen, das selbst ein Rahmen ist (FRAME_BUILDS). Angriffe von unten (Sweep, Aufgabe aus der Guard) zählen nicht.
 */
export function isGrundlage(c: Card2 | undefined, pos: Pos2, role: Role2): boolean {
  if (!c || role !== "bottom") return false;
  if (c.kind === "rahmen") return true;
  // Angriff: jeder Weg raus aus einer Festhalte-Lage; aus der Guard nur Aufstehen/Guard halten (kein Sweep).
  if (c.kind === "angriff") return !!c.to && (PINNED.has(pos) || (!!c.to.escape && c.to.escape !== "reversal"));
  return FRAME_BUILDS.has(c.id);
}

/** B52 „Grundlagen kann jeder“: im Spielplan-Modus immer spielbar (ohne Ziehen) – jedes Aufbauen (Keil), jeder Rahmen und
 *  unten jede Befreiung (B29). Nur Angriffe (Takedown, Pass, Sweep, Aufgabe, Rückennahme) kommen aus dem Spielplan.
 *  So steckst du nie fest: Halten, Rahmen und Rauskommen geht in jeder Lage. */
export function isBasic(c: Card2 | undefined, pos: Pos2, role: Role2): boolean {
  if (!c) return false;
  return c.kind !== "angriff" || isGrundlage(c, pos, role);
}

/** Ist c irgendwo eine Spielplan-Karte (in mindestens einer ihrer Lagen keine Grundlage)? Nur solche gehören in einen Plan. */
export function isPlanCard(c: Card2): boolean {
  return c.slots.some((sl) => !isBasic(c, sl.pos, sl.role));
}

const SIDE_SALT: Record<Side, number> = { p: 0x51ed27, o: 0x2b9a3f };

/** Neuer Plan-Zustand: Karten gemischt (seed-fest), die ersten PLAN_START gezogen. */
export function initPlan(cards: string[], seed: number, side: Side): Plan2 {
  const deck = shuffle([...new Set(cards)], mulberry32((seed ^ SIDE_SALT[side]) >>> 0));
  return { hand: deck.slice(0, PLAN_START), deck: deck.slice(PLAN_START), mulligan: false };
}

export function planOf(s: Pick<State2, "plan">, side: Side): Plan2 | undefined {
  return s.plan?.[side];
}

/** Grund, warum c für side im Spielplan-Modus gerade nicht geht – oder null. */
export function planBlock(s: State2, side: Side, c: Card2): string | null {
  const pl = s.plan?.[side];
  if (!pl) return null;
  if (isBasic(c, s.pos, roleOf(s, side))) return null;
  if (pl.hand.includes(c.id)) return null;
  return pl.deck.includes(c.id) ? "Noch nicht gezogen" : "Nicht in deinem Spielplan";
}

/** B52: senkt sich die Bedingung dieser Karte, weil sie ein gezogener Angriff deines Spielplans ist? */
export function planSharp(s: Pick<State2, "plan">, side: Side, c: { id?: string; kind?: Card2["kind"] }): number {
  const pl = s.plan?.[side];
  return pl && c.id && c.kind === "angriff" && pl.hand.includes(c.id) ? PLAN_SHARP : 0;
}

/** Darf side jetzt einen Mulligan machen? (vor Runde 1, einmal) */
export function canMulligan(s: State2, side: Side): boolean {
  const pl = s.plan?.[side];
  return !!pl && !pl.mulligan && s.round === 1 && s.history.length === 0;
}

/** B53 Mulligan: bis zu MULLIGAN_MAX Startkarten tauschen – sie kommen unter den Stapel, du ziehst gleich viele neu.
 *  Auch mit leerer Liste („Behalten“) ist der Mulligan danach verbraucht. */
export function mulligan(s: State2, side: Side, swap: string[]): State2 {
  const pl = s.plan?.[side];
  if (!pl) throw new Error("Kein Spielplan");
  if (!canMulligan(s, side)) throw new Error("Mulligan nur einmal vor Runde 1");
  const out = [...new Set(swap)];
  if (out.length > MULLIGAN_MAX) throw new Error(`Höchstens ${MULLIGAN_MAX} Karten tauschen`);
  for (const id of out) if (!pl.hand.includes(id)) throw new Error(`${id} ist nicht in der Hand`);
  const deck = pl.deck.slice();
  const fresh = deck.splice(0, out.length);
  const hand = pl.hand.map((id) => (out.includes(id) ? fresh.shift()! : id));
  return { ...s, plan: { ...s.plan, [side]: { hand, deck: [...deck, ...out], mulligan: true } } };
}

/** B54 Nachziehen nach jeder Runde (mutiert den geklonten Zustand aus resolveRound). */
export function drawPlans(s: State2): void {
  if (!s.plan) return;
  const next: State2["plan"] = {};
  for (const side of ["p", "o"] as Side[]) {
    const pl = s.plan[side];
    if (!pl) continue;
    const take = pl.deck.slice(0, PLAN_DRAW);
    next[side] = { hand: [...pl.hand, ...take], deck: pl.deck.slice(take.length), mulligan: true };
  }
  s.plan = next;
}

export function clonePlan(p: State2["plan"]): State2["plan"] {
  if (!p) return undefined;
  const out: State2["plan"] = {};
  for (const side of ["p", "o"] as Side[]) { const x = p[side]; if (x) out[side] = { hand: [...x.hand], deck: [...x.deck], mulligan: x.mulligan }; }
  return out;
}

/** B55 Keine Spickerei: in der Sicht von viewer kennt man seinen eigenen Stapel nicht (die Vorausschau zieht nichts),
 *  und vom Gegner nur seinen Spielplan (alle 15), nicht, was er schon gezogen hat. */
export function planPublic(p: State2["plan"], viewer: Side): State2["plan"] {
  if (!p) return undefined;
  const out: State2["plan"] = {};
  for (const side of ["p", "o"] as Side[]) {
    const x = p[side];
    if (!x) continue;
    out[side] = side === viewer ? { hand: [...x.hand], deck: [], mulligan: x.mulligan } : { hand: [...x.hand, ...x.deck], deck: [], mulligan: true };
  }
  return out;
}

/** Ende: wie viele verschiedene Karten deines Spielplans du gespielt hast (Grundlagen zählen nicht). */
export function planPlayed(s: State2, side: Side, plan: string[]): { played: number; total: number } {
  const set = new Set(plan);
  const seen = new Set<string>();
  for (const r of s.history) { const id = side === "p" ? r.pCard : r.oCard; if (set.has(id)) seen.add(id); }
  return { played: seen.size, total: set.size };
}

/** KI-Mulligan (alle Stufen gleich, ohne Blick in den Stapel): Kampf beginnt im Stand – tausche Startkarten, die erst
 *  spät passen (kein Stand/Clinch/Kopfklammer, kein Boden-Start), höchstens MULLIGAN_MAX; mit 2+ Stand-Karten behalten. */
export function aiMulligan(hand: string[], cardOf: (id: string) => Card2 | undefined): string[] {
  const early = (id: string) => {
    const c = cardOf(id);
    if (!c) return 0;
    if (c.slots.some((sl) => sl.pos === "stand" || sl.pos === "clinch")) return 2;
    if (c.slots.some((sl) => sl.pos === "guard" || sl.pos === "headlock" || sl.pos === "half")) return 1;
    return 0;
  };
  if (hand.filter((id) => early(id) === 2).length >= 2) return hand.filter((id) => early(id) === 0).slice(0, 1);
  return hand.map((id) => ({ id, v: early(id) })).filter((x) => x.v < 2).sort((a, b) => a.v - b.v).slice(0, MULLIGAN_MAX).map((x) => x.id);
}

/** Prüft einen Spielplan: genau PLAN_SIZE verschiedene, bekannte Spielplan-Karten. Liefert Fehler (leer = gültig). */
export function planErrors(ids: string[], cardOf: (id: string) => Card2 | undefined): string[] {
  const err: string[] = [];
  if (ids.length !== PLAN_SIZE) err.push(`Genau ${PLAN_SIZE} Karten (jetzt ${ids.length})`);
  if (new Set(ids).size !== ids.length) err.push("Jede Karte nur einmal");
  for (const id of ids) {
    const c = cardOf(id);
    if (!c) err.push(`Unbekannte Karte: ${id}`);
    else if (!isPlanCard(c)) err.push(`${c.plain} ist eine Grundlage – die kannst du sowieso`);
  }
  return err;
}
