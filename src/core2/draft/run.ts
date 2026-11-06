// Mechanik 9 „Draft“ – der Lauf als Zustandsmaschine (Spec B69–B75). Reine Funktionen, kein Speicher, kein React.
// Ablauf: Stil → 15 Picks → (Notfall-Tausch) → Kämpfe gegen die KI bis 7 Siege oder 3 Niederlagen → Ende.
import { mulberry32 } from "../../engine/rng";
import type { Card2, Side, StilId, State2 } from "../types";
import { STIL_IDS } from "../engine/stil";
import { planPaths, randomValidPlan, systemCheck } from "../engine/planBuilder";
import { BOSS_PLANS, DEFAULT_PLAN, stilCards } from "../data/plans";
import { BOSS } from "../data/bosses";
import { STIL } from "../data/stile";
import { DRAFT_PICKS, makeOffer, notfallOptions, type NotfallSwap } from "./draft";

type CardOf = (id: string) => Card2 | undefined;
export interface DraftCtx { pool: string[]; cardOf: CardOf; basics: Card2[] }

/** B74 Lauf: Schluss bei so vielen Siegen bzw. Niederlagen. */
export const RUN_WINS = 7;
export const RUN_LOSSES = 3;
/** Der 5. Gegner (Index 4) ist ein Boss. */
export const BOSS_AT = 4;
/** Die ersten beiden Gegner sind Stufe 2, danach Stufe 3. */
export const L2_UNTIL = 2;
/** Höchstens so viele Notfall-Tausche (normal reicht einer). */
export const NOTFALL_MAX = 3;

export type MatchResult = "win" | "loss" | "draw";
export interface Foe {
  level: 2 | 3;
  stil: StilId;
  /** Name des Plans, den er spielt. */
  planName: string;
  plan: string[];
  /** Boss-ID, wenn dieser Gegner ein Boss ist. */
  boss?: StilId;
  seed: number;
}
export interface MatchLog {
  foe: Foe;
  result: MatchResult;
  /** Deine Kette in diesem Kampf: Karten, mit denen du die Lage verbessert oder eine Aufgabe weitergebracht hast. */
  chain: string[];
  tap: boolean;
  stages: { boden: boolean; kontrolle: boolean; aufgabe: boolean };
  /** Plan-Karten, die getroffen haben. */
  hit: string[];
}
export type RunPhase = "draft" | "notfall" | "run" | "done";
export interface DraftRun {
  v: 1;
  seed: number;
  stil: StilId;
  /** Stil wurde ausgelost. */
  stilRandom: boolean;
  phase: RunPhase;
  picks: string[];
  /** Aktuelles Angebot (3 Karten) im Draft. */
  offer: string[];
  /** Notfall: zur Wahl stehende Tausche, wie oft schon getauscht. */
  notfall: NotfallSwap[];
  notfallUsed: number;
  /** Coach-Tipp an (hebt die am besten passende Karte hervor). */
  coach: boolean;
  wins: number;
  losses: number;
  matches: MatchLog[];
  /** Nächster Gegner (im Lauf). */
  next: Foe | null;
  /** Belohnung am Ende schon gemeldet. */
  rewarded: boolean;
}

/** Neuer Lauf: erstes Angebot steht sofort fest. */
export function newRun(seed: number, stil: StilId, stilRandom: boolean, ctx: DraftCtx): DraftRun {
  const r: DraftRun = { v: 1, seed: seed >>> 0, stil, stilRandom, phase: "draft", picks: [], offer: [], notfall: [], notfallUsed: 0, coach: false, wins: 0, losses: 0, matches: [], next: null, rewarded: false };
  return { ...r, offer: makeOffer([], r.seed, ctx.pool, ctx.cardOf, ctx.basics, stilCards(stil)).cards };
}

/** Zufälliger Stil für „Zufall“. */
export function randomRunStil(seed: number): StilId {
  return STIL_IDS[Math.floor(mulberry32(seed ^ 0x5bd1e995)() * STIL_IDS.length)];
}

/** Ein Pick: nur Karten aus dem Angebot. Nach Pick 15: System-Prüfung → Lauf oder Notfall-Tausch. */
export function pickCard(r: DraftRun, id: string, ctx: DraftCtx): DraftRun {
  if (r.phase !== "draft") throw new Error("Kein Draft aktiv");
  if (!r.offer.includes(id)) throw new Error(`${id} ist nicht im Angebot`);
  const picks = [...r.picks, id];
  if (picks.length < DRAFT_PICKS) return { ...r, picks, offer: makeOffer(picks, r.seed, ctx.pool, ctx.cardOf, ctx.basics, stilCards(r.stil)).cards };
  return afterDraft({ ...r, picks, offer: [] }, ctx);
}

function afterDraft(r: DraftRun, ctx: DraftCtx): DraftRun {
  if (systemCheck(r.picks, ctx.cardOf, ctx.basics).ok) return startRun({ ...r, notfall: [] }, ctx);
  const { swaps } = notfallOptions(r.picks, ctx.pool, ctx.cardOf, ctx.basics);
  if (!swaps.length || r.notfallUsed >= NOTFALL_MAX) return startRun({ ...r, notfall: [] }, ctx); // kann nicht passieren (Sim/Test), dann trotzdem spielen
  return { ...r, phase: "notfall", notfall: swaps };
}

/** Notfall-Tausch i anwenden (kostenlos). Danach erneut prüfen. */
export function applyNotfall(r: DraftRun, i: number, ctx: DraftCtx): DraftRun {
  if (r.phase !== "notfall") throw new Error("Kein Notfall-Tausch offen");
  const sw = r.notfall[i];
  if (!sw) throw new Error("Unbekannter Tausch");
  return afterDraft({ ...r, picks: r.picks.map((x) => (x === sw.out ? sw.in : x)), notfallUsed: r.notfallUsed + 1, notfall: [] }, ctx);
}

function startRun(r: DraftRun, ctx: DraftCtx): DraftRun {
  return { ...r, phase: "run", next: foeFor(r, 0, ctx) };
}

/** B74 Gegner n (0-basiert): Stufe 2 für die ersten zwei, dann Stufe 3; der 5. ist ein Boss mit Signatur-Plan.
 *  Sonst zufälliger Stil, abwechselnd sein Standard-Plan oder ein zufälliger gültiger Plan. Seed-fest. */
export function foeFor(r: Pick<DraftRun, "seed">, n: number, ctx: DraftCtx): Foe {
  const rng = mulberry32((r.seed ^ Math.imul(n + 1, 0x27d4eb2d)) >>> 0);
  const seed = Math.floor(rng() * 100000);
  const stil = STIL_IDS[Math.floor(rng() * STIL_IDS.length)];
  if (n === BOSS_AT) return { level: BOSS[stil].level, stil, boss: stil, planName: BOSS_PLANS[stil].name, plan: [...BOSS_PLANS[stil].cards], seed };
  const level: 2 | 3 = n < L2_UNTIL ? 2 : 3;
  if (n % 2 === 1) {
    const p = randomValidPlan(rng, ctx.pool, ctx.cardOf, ctx.basics, 400);
    if (p) return { level, stil, planName: `Freier Plan (${STIL[stil].name})`, plan: p, seed };
  }
  return { level, stil, planName: DEFAULT_PLAN[stil].name, plan: [...DEFAULT_PLAN[stil].cards], seed };
}

/** B74 Kampf eintragen. Unentschieden zählt wie eine Niederlage – im Lauf brauchst du den Sieg. */
export function recordMatch(r: DraftRun, log: Omit<MatchLog, "foe">, ctx: DraftCtx): DraftRun {
  if (r.phase !== "run" || !r.next) throw new Error("Kein Kampf offen");
  const matches = [...r.matches, { ...log, foe: r.next }];
  const wins = r.wins + (log.result === "win" ? 1 : 0);
  const losses = r.losses + (log.result === "win" ? 0 : 1);
  const done = wins >= RUN_WINS || losses >= RUN_LOSSES;
  return { ...r, matches, wins, losses, phase: done ? "done" : "run", next: done ? null : foeFor(r, matches.length, ctx) };
}

/** Auswertung eines fertigen Kampfes aus dem Endzustand (für recordMatch). */
export function matchLog(s: State2, side: Side, plan: string[], cardOf: CardOf): Omit<MatchLog, "foe"> {
  const result: MatchResult = !s.result || s.result.winner === null ? "draw" : s.result.winner === side ? "win" : "loss";
  const pp = planPaths(s, side, plan, cardOf);
  const set = new Set(plan);
  const chain: string[] = [];
  const hit = new Set<string>();
  for (const rd of s.history) {
    const id = side === "p" ? rd.pCard : rd.oCard;
    const won = rd.winner === side || rd.winner === "both";
    if (!won || !set.has(id) || cardOf(id)?.kind !== "angriff") continue;
    hit.add(id);
    const moved = !!cardOf(id)?.to && rd.events.some((e) => e.t === "move");
    const sub = rd.events.some((e) => e.t === "sub" && e.owner === side && e.step > 0);
    if ((moved || sub) && chain[chain.length - 1] !== id) chain.push(id);
  }
  return { result, chain, tap: s.result?.type === "tap" && s.result.winner === side, stages: pp.stages, hit: [...hit] };
}

export interface RunSummary {
  wins: number; losses: number;
  /** Längste Kette eines Kampfes (Karten-IDs) und gegen wen. */
  best: { chain: string[]; tap: boolean; foe: Foe } | null;
  /** Abschnitte, die du im Lauf mindestens einmal erreicht hast. */
  stages: { boden: boolean; kontrolle: boolean; aufgabe: boolean };
  /** Verschiedene Plan-Karten, die getroffen haben. */
  hitCards: number;
  taps: number;
}

/** B75 Ende: „Deine beste Kette“ und „Wege genutzt“ über den ganzen Lauf. */
export function runSummary(r: DraftRun): RunSummary {
  let best: RunSummary["best"] = null;
  const stages = { boden: false, kontrolle: false, aufgabe: false };
  const hit = new Set<string>();
  let taps = 0;
  for (const m of r.matches) {
    const score = m.chain.length + (m.tap ? 1.5 : 0);
    if (m.chain.length && (!best || score > best.chain.length + (best.tap ? 1.5 : 0))) best = { chain: m.chain, tap: m.tap, foe: m.foe };
    stages.boden ||= m.stages.boden; stages.kontrolle ||= m.stages.kontrolle; stages.aufgabe ||= m.stages.aufgabe;
    m.hit.forEach((x) => hit.add(x));
    if (m.tap) taps++;
  }
  return { wins: r.wins, losses: r.losses, best, stages, hitCards: hit.size, taps };
}

/** Speicher bereinigen: kaputte Läufe werden verworfen (null). */
export function sanitizeRun(raw: unknown, known: (id: string) => boolean): DraftRun | null {
  const o = raw as DraftRun | null;
  if (!o || typeof o !== "object" || o.v !== 1) return null;
  if (!(STIL_IDS as string[]).includes(o.stil) || !["draft", "notfall", "run", "done"].includes(o.phase)) return null;
  const ids = (x: unknown) => Array.isArray(x) && x.every((y) => typeof y === "string" && known(y));
  if (!ids(o.picks) || !ids(o.offer) || o.picks.length > DRAFT_PICKS || new Set(o.picks).size !== o.picks.length) return null;
  if (o.phase === "draft" && o.offer.length === 0) return null;
  if (o.phase !== "draft" && o.picks.length !== DRAFT_PICKS) return null;
  const nat = (x: unknown, max: number) => typeof x === "number" && Number.isInteger(x) && x >= 0 && x <= max;
  if (!nat(o.wins, RUN_WINS) || !nat(o.losses, RUN_LOSSES) || !nat(o.seed, 0xffffffff) || !Array.isArray(o.matches)) return null;
  if (o.phase === "run" && (!o.next || !ids(o.next.plan))) return null;
  if (!Array.isArray(o.notfall) || (o.phase === "notfall" && o.notfall.length === 0)) return null;
  return { ...o, coach: !!o.coach, rewarded: !!o.rewarded, notfallUsed: nat(o.notfallUsed, NOTFALL_MAX) ? o.notfallUsed : 0 };
}
