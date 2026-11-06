// Mechanik 7 „Spielplan-Bauer“ (Spec B57–B62). Vorbild: Deckbau, Mana-Kurve und Sideboard (Hearthstone/Magic).
// BJJ: Ein Spielplan ist ein System – eine zusammenhängende Kette vom Stand bis zur Aufgabe – und du passt ihn an den Gegner an.
// Hier nur reine Regeln (ohne UI, ohne Speicher): System-Prüfung über einen Erreichbarkeits-Graphen, Kurve, Fix-Vorschlag,
// Sideboard (bis zu 3 Tausche vor dem Boss) und die Ende-Auswertung „Wege genutzt“.
import type { Card2, Pos2, Role2, Side, State2 } from "../types";
import { isBasic, isPlanCard, planErrors, PLAN_SIZE } from "./plan";

type CardOf = (id: string) => Card2 | undefined;
/** Lage aus eigener Sicht, z. B. "guard/bottom". */
export type PlanState = `${Pos2}/${Role2}`;
const key = (pos: Pos2, role: Role2) => `${pos}/${role}` as PlanState;
export const PLAN_START_STATE: PlanState = "stand/neutral";

/** Boden-Lagen (Front Headlock ist Gerangel zwischen Stand und Boden). */
const GROUND = new Set<Pos2>(["guard", "half", "turtle", "side", "mount", "back"]);
/** Wie gut eine Lage für dich ist (für „Position verbessern“): unten in Festhalte-Lagen 0, Rücken oben 7. */
const RANK: Partial<Record<PlanState, number>> = {
  "guard/bottom": 1, "half/bottom": 0.5, "turtle/bottom": 0, "side/bottom": 0, "mount/bottom": 0, "back/bottom": 0, "headlock/bottom": 0,
  "stand/neutral": 1.5, "clinch/neutral": 1.5,
  "guard/top": 2, "half/top": 3, "headlock/top": 3, "turtle/top": 4, "side/top": 5, "mount/top": 6, "back/top": 7,
};
const rank = (s: PlanState) => RANK[s] ?? 0;
/** Kontrolle: die dominanten Lagen oben. */
const CONTROL = new Set<PlanState>(["side/top", "mount/top", "back/top"]);

export interface PlanEdge { card: string; from: PlanState; to: PlanState }

/** B57 Erreichbarkeits-Graph: vom Stand aus über die Positionswechsel deiner Plan-Karten (dazu die Befreiungen, die jeder kann).
 *  Reaktive Wege (Sprawl → Kopfklammer, nur wenn er schießt) zählen nicht – der Plan muss aus eigener Kraft weiterkommen. */
export function planGraph(ids: string[], cardOf: CardOf, basics: Card2[] = []): { reach: Set<PlanState>; edges: PlanEdge[] } {
  const edges: PlanEdge[] = [];
  const add = (c: Card2) => {
    if (c.kind !== "angriff" || !c.to) return;
    for (const sl of c.slots) edges.push({ card: c.id, from: key(sl.pos, sl.role), to: key(c.to.pos, c.to.role) });
  };
  for (const id of ids) { const c = cardOf(id); if (c) add(c); }
  // Befreiungen (Grundlage) in ihren Grundlagen-Slots.
  for (const c of basics) if (c.kind === "angriff" && c.to) for (const sl of c.slots) if (isBasic(c, sl.pos, sl.role)) edges.push({ card: c.id, from: key(sl.pos, sl.role), to: key(c.to.pos, c.to.role) });
  const reach = new Set<PlanState>([PLAN_START_STATE]);
  for (let grew = true; grew;) {
    grew = false;
    for (const e of edges) if (reach.has(e.from) && !reach.has(e.to)) { reach.add(e.to); grew = true; }
  }
  return { reach, edges };
}

export type RuleId = "boden" | "besser" | "abschluss" | "erreichbar";
export type StageId = "stand" | "clinch" | "boden" | "kontrolle" | "aufgabe";
export const STAGES: { id: StageId; label: string }[] = [
  { id: "stand", label: "Stand" }, { id: "clinch", label: "Clinch" }, { id: "boden", label: "Boden" },
  { id: "kontrolle", label: "Kontrolle" }, { id: "aufgabe", label: "Aufgabe" },
];
export const SYS_NEED = { boden: 1, besser: 2, abschluss: 3 } as const;

export interface SysRule { id: RuleId; ok: boolean; have: number; need: number; label: string }
export interface SysGap { state: PlanState; stage: StageId; text: string }
export interface SystemResult {
  ok: boolean;
  rules: SysRule[];
  reach: Set<PlanState>;
  /** Karten je Rolle im System. */
  boden: string[]; besser: string[]; finishes: string[]; unreachableFinishes: string[];
  /** Plan-Karten, die du in deinem Plan nie spielen kannst (Lage unerreichbar). */
  dead: string[];
  /** Sackgassen: du kommst hin, aber dein Plan hat dort nichts. */
  gaps: SysGap[];
  stages: Record<StageId, "ok" | "gap" | "skip">;
}

const DEAD_END_TEXT: Partial<Record<PlanState, { stage: StageId; text: string }>> = {
  "guard/bottom": { stage: "kontrolle", text: "Du hast keinen Weg aus der Guard nach oben – nimm einen Sweep." },
  "guard/top": { stage: "kontrolle", text: "Du kommst in seine Guard, aber nicht vorbei – nimm einen Pass." },
  "half/top": { stage: "kontrolle", text: "Du kommst in die halbe Guard, aber nicht vorbei – nimm einen Pass." },
  "turtle/top": { stage: "kontrolle", text: "Er liegt in der Turtle, aber du hast nichts – nimm eine Rückennahme." },
  "headlock/top": { stage: "kontrolle", text: "Du hast seinen Kopf, aber keinen Weg weiter – nimm Rumgehen oder eine Guillotine." },
  "side/top": { stage: "aufgabe", text: "In der Seitenkontrolle hast du keine Aufgabe – nimm eine Aufgabe oder steig auf." },
  "mount/top": { stage: "aufgabe", text: "Im Mount hast du keine Aufgabe – nimm eine Aufgabe." },
  "back/top": { stage: "aufgabe", text: "Am Rücken hast du keine Aufgabe – nimm den Würger von hinten." },
};

/** B57 System-Prüfung: der Plan muss die Kette schließen (Boden, Position verbessern, Aufgaben – alles erreichbar). */
export function systemCheck(ids: string[], cardOf: CardOf, basics: Card2[] = []): SystemResult {
  const { reach, edges } = planGraph(ids, cardOf, basics);
  const plan = new Set(ids);
  const mine = edges.filter((e) => plan.has(e.card) && reach.has(e.from));
  const uniq = (xs: string[]) => [...new Set(xs)];
  const posOf = (s: PlanState) => s.split("/")[0] as Pos2;
  const boden = uniq(mine.filter((e) => !GROUND.has(posOf(e.from)) && GROUND.has(posOf(e.to))).map((e) => e.card));
  const besser = uniq(mine.filter((e) => GROUND.has(posOf(e.from)) && rank(e.to) > rank(e.from)).map((e) => e.card));
  const cards = ids.map(cardOf).filter((c): c is Card2 => !!c);
  const subCards = cards.filter((c) => c.submission);
  const slotReach = (c: Card2) => c.slots.some((sl) => reach.has(key(sl.pos, sl.role)));
  const finishes = subCards.filter(slotReach).map((c) => c.id);
  const unreachableFinishes = subCards.filter((c) => !slotReach(c)).map((c) => c.id);
  const dead = cards.filter((c) => !c.submission && !slotReach(c)).map((c) => c.id);
  const rules: SysRule[] = [
    { id: "boden", ok: boden.length >= SYS_NEED.boden, have: boden.length, need: SYS_NEED.boden, label: "Weg zum Boden (Takedown oder Guard ziehen)" },
    { id: "besser", ok: besser.length >= SYS_NEED.besser, have: besser.length, need: SYS_NEED.besser, label: "Wege nach vorn (Pass, Sweep, Rückennahme)" },
    { id: "abschluss", ok: finishes.length >= SYS_NEED.abschluss, have: finishes.length, need: SYS_NEED.abschluss, label: "Aufgaben, die du erreichst" },
    { id: "erreichbar", ok: unreachableFinishes.length === 0, have: subCards.length - unreachableFinishes.length, need: subCards.length, label: "Jede Aufgabe hat einen Weg" },
  ];
  // Sackgassen: erreichbare Boden-Lage (oben oder Guard unten), in der keine Plan-Karte passt.
  const gaps: SysGap[] = [];
  for (const st of reach) {
    const t = DEAD_END_TEXT[st];
    if (!t) continue;
    const here = cards.filter((c) => c.slots.some((sl) => key(sl.pos, sl.role) === st));
    const out = st === "guard/bottom" ? here.filter((c) => c.to && c.to.role === "top") : here;
    if (out.length === 0) gaps.push({ state: st, ...t });
  }
  const rule = (id: RuleId) => rules.find((r) => r.id === id)!.ok;
  const gapIn = (sg: StageId) => gaps.some((g) => g.stage === sg);
  const stages: SystemResult["stages"] = {
    stand: "ok",
    clinch: reach.has("clinch/neutral") ? "ok" : "skip",
    boden: rule("boden") ? "ok" : "gap",
    kontrolle: rule("besser") && [...reach].some((s) => CONTROL.has(s)) && !gapIn("kontrolle") ? "ok" : "gap",
    aufgabe: rule("abschluss") && rule("erreichbar") && !gapIn("aufgabe") ? "ok" : "gap",
  };
  return { ok: rules.every((r) => r.ok), rules, reach, boden, besser, finishes, unreachableFinishes, dead, gaps, stages };
}

/** Gültig = 15 verschiedene Plan-Karten + System-Prüfung bestanden. */
export function planValid(ids: string[], cardOf: CardOf, basics: Card2[] = []): boolean {
  return planErrors(ids, cardOf).length === 0 && systemCheck(ids, cardOf, basics).ok;
}

// ---------------- Kurve ----------------
/** B58 Kosten einer Karte für die Kurve: Atem plus die Keile, die du vorher brauchst (Summe ihrer Bedingungen). */
export function planCost(c: Card2): number {
  let k = c.kraft ?? 0;
  for (const v of Object.values(c.requires ?? {})) k += Math.max(0, v ?? 0);
  return k;
}
export const CURVE_HEAVY = 2;
export const CURVE_MAX_HEAVY = 6;
export const CURVE_HINT = "Zu teuer – du wirst außer Atem sein. Nimm mehr Karten mit Kosten 0 oder 1.";
/** Histogramm 0/1/2/3+ und Hinweis, wenn mehr als 6 Karten 2 oder mehr kosten. */
export function planCurve(ids: string[], cardOf: CardOf): { bins: [number, number, number, number]; heavy: number; tooHeavy: boolean } {
  const bins: [number, number, number, number] = [0, 0, 0, 0];
  let heavy = 0;
  for (const id of ids) {
    const c = cardOf(id);
    if (!c) continue;
    const k = planCost(c);
    bins[Math.min(3, k)]++;
    if (k >= CURVE_HEAVY) heavy++;
  }
  return { bins, heavy, tooHeavy: heavy > CURVE_MAX_HEAVY };
}

// ---------------- Fix-Vorschlag ----------------
/** Güte eines Plans (bestandene Regeln zuerst, dann Wege, Lücken und tote Karten). Auch für den Draft (Coach-Tipp). */
export function systemScore(r: SystemResult): number {
  return r.rules.filter((x) => x.ok).length * 100 + Math.min(r.boden.length, 2) * 3 + Math.min(r.besser.length, 4) * 3
    + Math.min(r.finishes.length, 5) * 3 - r.gaps.length * 8 - r.unreachableFinishes.length * 6 - r.dead.length * 4;
}
const PROBLEM_TEXT: Record<RuleId, string> = {
  boden: "Du kommst nicht zu Boden",
  besser: "Am Boden kommst du nicht nach vorn",
  abschluss: "Zu wenige Aufgaben, die du erreichst",
  erreichbar: "Eine Aufgabe erreichst du nie",
};

export interface FixSuggestion { add: string; remove?: string; text: string }

/** Ein-Zeilen-Vorschlag für die erste Lücke: welche Karte aus pool hinein (und bei vollem Plan welche raus). */
export function suggestFix(ids: string[], pool: string[], cardOf: CardOf, basics: Card2[] = []): FixSuggestion | null {
  const cur = systemCheck(ids, cardOf, basics);
  const firstRule = cur.rules.find((r) => !r.ok);
  const firstGap = cur.gaps[0];
  if (!firstRule && !firstGap && cur.dead.length === 0) return null;
  const base = systemScore(cur);
  const cands = pool.filter((id) => !ids.includes(id) && (() => { const c = cardOf(id); return !!c && isPlanCard(c); })());
  let best: { add: string; remove?: string; s: number } | null = null;
  const full = ids.length >= PLAN_SIZE;
  for (const add of cands) {
    const outs = full ? ids : [undefined];
    for (const remove of outs) {
      const next = remove ? ids.map((x) => (x === remove ? add : x)) : [...ids, add];
      const s = systemScore(systemCheck(next, cardOf, basics));
      if (s > base && (!best || s > best.s)) best = { add, remove, s };
    }
  }
  if (!best) return null;
  const name = (id: string) => cardOf(id)?.plain ?? id;
  let lead: string;
  if (firstRule) lead = firstRule.id === "erreichbar" && cur.unreachableFinishes[0] ? `${name(cur.unreachableFinishes[0])} erreichst du nie` : PROBLEM_TEXT[firstRule.id];
  else if (firstGap) lead = firstGap.text.split(" – ")[0];
  else lead = `${name(cur.dead[0])} kannst du nie spielen`;
  const add = cardOf(best.add)!;
  const text = `${lead} – nimm ${add.plain} (${add.term})${best.remove ? ` statt ${name(best.remove)}` : ""}.`;
  return { add: best.add, remove: best.remove, text };
}

// ---------------- Sideboard ----------------
/** B60 Vor dem Boss darfst du bis zu 3 Karten tauschen. */
export const SIDEBOARD_MAX = 3;
export interface Swap { out: string; in: string }

/** Wendet bis zu SIDEBOARD_MAX Tausche an (Fehler bei mehr, bei Karten außerhalb des Plans oder doppelten). */
export function applySideboard(ids: string[], swaps: Swap[]): string[] {
  if (swaps.length > SIDEBOARD_MAX) throw new Error(`Höchstens ${SIDEBOARD_MAX} Karten tauschen`);
  const out = ids.slice();
  for (const sw of swaps) {
    const i = out.indexOf(sw.out);
    if (i < 0) throw new Error(`${sw.out} ist nicht im Plan`);
    if (out.includes(sw.in)) throw new Error(`${sw.in} ist schon im Plan`);
    out[i] = sw.in;
  }
  return out;
}

/** Empfohlene Tausche gegen einen Boss: nimm die empfohlenen Karten (wants) hinein, raus geht, was am wenigsten fehlt –
 *  zuerst Karten, die gegen ihn wenig bringen (avoid), dann solche, ohne die das System am besten bleibt. */
export function recommendSwaps(ids: string[], wants: string[], avoid: string[], pool: string[], cardOf: CardOf, basics: Card2[] = []): Swap[] {
  const swaps: Swap[] = [];
  let cur = ids.slice();
  for (const w of wants) {
    if (swaps.length >= SIDEBOARD_MAX) break;
    if (cur.includes(w) || !pool.includes(w)) continue;
    const protectedIds = new Set([...wants, ...swaps.map((s) => s.in)]);
    const outs = cur.filter((id) => !protectedIds.has(id));
    let best: { out: string; s: number } | null = null;
    for (const o of outs) {
      const next = cur.map((x) => (x === o ? w : x));
      const r = systemCheck(next, cardOf, basics);
      // Nur Karten empfehlen, die dein Plan auch erreicht (keine tote Karte, keine unerreichbare Aufgabe).
      if (r.dead.includes(w) || r.unreachableFinishes.includes(w)) continue;
      const s = (r.ok ? 1000 : 0) + systemScore(r) + (avoid.includes(o) ? 50 : 0);
      if (!best || s > best.s) best = { out: o, s };
    }
    if (!best || best.s < 1000) continue;
    swaps.push({ out: best.out, in: w });
    cur = cur.map((x) => (x === best!.out ? w : x));
  }
  return swaps;
}

// ---------------- Ende: Wege genutzt ----------------
export interface PlanPaths {
  /** Diese Abschnitte hast du im Kampf selbst erreicht. */
  stages: { boden: boolean; kontrolle: boolean; aufgabe: boolean };
  /** Treffer mit geübten Angriffen (Plan-Karten, die nicht abgewehrt wurden). */
  hits: number;
  /** Davon verschiedene Karten. */
  hitCards: number;
}

/** B61 Ende-Auswertung: welche Wege des Systems du genutzt hast – und wie oft deine geübten Angriffe trafen. */
export function planPaths(s: State2, side: Side, plan: string[], cardOf: CardOf): PlanPaths {
  const set = new Set(plan);
  let boden = false, kontrolle = false, aufgabe = false, hits = 0;
  const hitIds = new Set<string>();
  for (const r of s.history) {
    const id = side === "p" ? r.pCard : r.oCard;
    const won = r.winner === side || r.winner === "both";
    for (const e of r.events) {
      if (e.t === "move" && GROUND.has(e.pos)) {
        boden = true;
        const iTop = e.top === side;
        if (iTop && (e.pos === "side" || e.pos === "mount" || e.pos === "back")) kontrolle = true;
      }
      if (e.t === "sub" && e.owner === side && e.step > 0) aufgabe = true;
    }
    if (won && set.has(id) && cardOf(id)?.kind === "angriff") { hits++; hitIds.add(id); }
  }
  if (GROUND.has(s.pos)) boden = true;
  return { stages: { boden, kontrolle, aufgabe }, hits, hitCards: hitIds.size };
}

/** Für Simulation und Tests: ein zufälliger gültiger Plan (15 Karten aus pool, System-Prüfung bestanden). */
export function randomValidPlan(rng: () => number, pool: string[], cardOf: CardOf, basics: Card2[] = [], tries = 5000): string[] | null {
  for (let t = 0; t < tries; t++) {
    const a = pool.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    const ids = a.slice(0, PLAN_SIZE);
    if (planValid(ids, cardOf, basics)) return ids;
  }
  return null;
}
