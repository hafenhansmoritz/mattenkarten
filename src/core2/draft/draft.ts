// Mechanik 9 „Draft“ (Spec B69–B75). Vorbild: Hearthstone Arena / Magic Draft, „Discover“ (1 aus 3).
// BJJ: Entscheiden unter Unsicherheit mit Positions-Logik – jede Wahl muss dein System verbinden, vom Stand bis zur Aufgabe.
// Hier nur reine Regeln (ohne UI, ohne Speicher): Angebote (1 aus 3), Hinweise „Passt, weil …“ / „Lücke: …“, Coach-Tipp,
// Notfall-Tausch. Alles seed-fest; Erreichbarkeit kommt aus planBuilder (planGraph, systemCheck).
import { mulberry32 } from "../../engine/rng";
import type { Card2, Pos2, Role2 } from "../types";
import { PLAN_SIZE } from "../engine/plan";
import { planGraph, systemCheck, systemScore, type PlanState } from "../engine/planBuilder";

type CardOf = (id: string) => Card2 | undefined;

/** So viele Picks hat ein Draft – genau ein Spielplan. */
export const DRAFT_PICKS = PLAN_SIZE;
/** So viele Karten stehen je Pick zur Wahl. */
export const DRAFT_OFFER = 3;

/** Phase einer Karte: Zum Boden (aus Stand, Clinch, Kopf), Nach vorn (am Boden in eine bessere Lage), Aufgabe. */
export type DraftPhase = "boden" | "vorn" | "aufgabe";
export const DRAFT_PHASES: DraftPhase[] = ["boden", "vorn", "aufgabe"];
export const PHASE_LABEL: Record<DraftPhase, string> = { boden: "Zum Boden", vorn: "Nach vorn", aufgabe: "Aufgabe" };
/** Ein Satz je Phase für die Pick-Überschrift. */
export const PHASE_DO: Record<DraftPhase, string> = {
  boden: "Wie bringst du ihn zu Boden – oder in den Clinch?",
  vorn: "Wie kommst du am Boden nach vorn?",
  aufgabe: "Wo beendest du den Kampf?",
};

const GROUND = new Set<Pos2>(["guard", "half", "turtle", "side", "mount", "back"]);
const key = (pos: Pos2, role: Role2) => `${pos}/${role}` as PlanState;

export function phaseOf(c: Card2): DraftPhase {
  if (c.submission) return "aufgabe";
  return c.slots.some((sl) => !GROUND.has(sl.pos)) ? "boden" : "vorn";
}
/** B70: Pick i (0-basiert) hat die Phase Boden → Nach vorn → Aufgabe, immer im Wechsel. */
export const slotPhase = (i: number): DraftPhase => DRAFT_PHASES[i % DRAFT_PHASES.length];

/** Wo/wohin/woher – für die Hinweise. */
const PLACE: Partial<Record<PlanState, { wo: string; wohin: string; von: string }>> = {
  "stand/neutral": { wo: "im Stand", wohin: "in den Stand", von: "aus dem Stand" },
  "clinch/neutral": { wo: "im Clinch", wohin: "in den Clinch", von: "aus dem Clinch" },
  "headlock/top": { wo: "an seinem Kopf", wohin: "an seinen Kopf", von: "von seinem Kopf" },
  "guard/top": { wo: "in seiner Guard", wohin: "in seine Guard", von: "aus seiner Guard" },
  "guard/bottom": { wo: "in deiner Guard", wohin: "in deine Guard", von: "aus deiner Guard" },
  "half/top": { wo: "in seiner Half Guard", wohin: "in seine Half Guard", von: "aus seiner Half Guard" },
  "turtle/top": { wo: "hinter ihm (Turtle)", wohin: "hinter ihn (Turtle)", von: "von hinter ihm" },
  "side/top": { wo: "in Side Control", wohin: "in Side Control", von: "aus Side Control" },
  "mount/top": { wo: "im Mount", wohin: "in den Mount", von: "aus dem Mount" },
  "back/top": { wo: "an seinem Rücken", wohin: "an seinen Rücken", von: "von seinem Rücken" },
};
export const placeWo = (s: PlanState) => PLACE[s]?.wo ?? s;
export const placeWohin = (s: PlanState) => PLACE[s]?.wohin ?? s;
export const placeVon = (s: PlanState) => PLACE[s]?.von ?? s;

const slotsOf = (c: Card2) => c.slots.map((sl) => key(sl.pos, sl.role));

/** Kann c mit diesen Picks gespielt werden (mindestens eine Lage erreichbar)? */
export function reachableWith(c: Card2, picks: string[], cardOf: CardOf, basics: Card2[] = []): boolean {
  const { reach } = planGraph(picks, cardOf, basics);
  return slotsOf(c).some((s) => reach.has(s));
}

// ---------------- Hinweise ----------------
export interface DraftHint { ok: boolean; text: string }

/**
 * B71 Hinweis unter jeder Karte – erklärt, entscheidet nicht. Aus der Erreichbarkeit (planGraph) deiner bisherigen Picks:
 * „Passt, weil …“ (du kommst hin, neue Lage, Aufgabe dort, zweiter Weg) oder „Lücke: …“ (du kommst dort noch nicht hin).
 */
export function draftHint(id: string, picks: string[], cardOf: CardOf, basics: Card2[] = [], pool: string[] = []): DraftHint {
  const c = cardOf(id);
  if (!c) return { ok: false, text: "Lücke: unbekannte Karte." };
  const { reach } = planGraph(picks, cardOf, basics);
  const from = slotsOf(c).find((s) => reach.has(s));
  const name = (x: string) => `„${cardOf(x)?.plain ?? x}“`;
  if (!from) {
    const want = slotsOf(c)[0];
    // Gibt es im Vorrat einen Weg dorthin, den du jetzt schon nehmen könntest? Dann nennen.
    const bridge = pool.find((x) => {
      if (x === id || picks.includes(x)) return false;
      const b = cardOf(x);
      return !!b?.to && key(b.to.pos, b.to.role) === want && slotsOf(b).some((s) => reach.has(s));
    });
    const what = c.submission ? "die Aufgabe bliebe tot" : "die Karte bliebe tot";
    return { ok: false, text: bridge ? `Lücke: Du kommst noch nicht ${placeWohin(want)} – z. B. mit ${name(bridge)}.` : `Lücke: Du kommst noch nicht ${placeWohin(want)} – ${what}.` };
  }
  const here = picks.map(cardOf).filter((x): x is Card2 => !!x);
  if (c.submission) {
    const twin = here.find((x) => x.submission && slotsOf(x).includes(from));
    return twin
      ? { ok: true, text: `Passt: zweite Aufgabe ${placeWo(from)} – wehrt er „${twin.plain}“ ab, hast du diese.` }
      : { ok: true, text: `Passt, weil du ${placeWohin(from)} kommst – dort beendest du.` };
  }
  if (!c.to) return { ok: true, text: `Passt ${placeWo(from)}.` };
  const to = key(c.to.pos, c.to.role);
  if (reach.has(to)) {
    const other = here.find((x) => x.to && key(x.to.pos, x.to.role) === to);
    return { ok: true, text: `Passt: zweiter Weg ${placeWohin(to)}${other ? ` neben „${other.plain}“` : ""} – blockt er einen, nimmst du den anderen.` };
  }
  const waiting = here.find((x) => slotsOf(x).includes(to));
  const tail = waiting ? ` – dort wartet schon „${waiting.plain}“.` : ".";
  return { ok: true, text: `Passt, weil du ${placeVon(from)} ${placeWohin(to)} kommst${tail}` };
}

// ---------------- Coach-Tipp (Güte einer Wahl) ----------------
/**
 * B72 Wie gut passt id zu deinen Picks? Erreichbar zuerst, dann was das System gewinnt (bestandene Regeln, neue Lagen,
 * vorher tote Karten werden spielbar, mehr Vorrat wird erreichbar). Der Coach-Tipp markiert das Maximum – entscheiden tust du.
 */
export function draftFit(id: string, picks: string[], cardOf: CardOf, basics: Card2[] = [], pool: string[] = [], stilCards: string[] = []): number {
  const c = cardOf(id);
  if (!c) return -1e9;
  const g0 = planGraph(picks, cardOf, basics);
  const next = [...picks, id];
  const g1 = planGraph(next, cardOf, basics);
  const r0 = systemCheck(picks, cardOf, basics), r1 = systemCheck(next, cardOf, basics);
  const reachable = slotsOf(c).some((s) => g0.reach.has(s));
  const rules = r1.rules.filter((r) => r.ok && r.id !== "erreichbar").length - r0.rules.filter((r) => r.ok && r.id !== "erreichbar").length;
  const newStates = [...g1.reach].filter((s) => !g0.reach.has(s)).length;
  const revived = (r0.dead.length + r0.unreachableFinishes.length) - (r1.dead.length + r1.unreachableFinishes.length) + (reachable ? 0 : 1);
  const rest = pool.filter((x) => !next.includes(x));
  const opens = rest.filter((x) => { const k = cardOf(x); return !!k && slotsOf(k).some((s) => g1.reach.has(s)) && !slotsOf(k).some((s) => g0.reach.has(s)); }).length;
  const finHere = c.submission && reachable ? 4 : 0;
  // Zweite Aufgabe in derselben Lage ist gut (Kette), die dritte bringt wenig.
  const sameSpot = c.submission ? picks.filter((x) => { const k = cardOf(x); return !!k?.submission && slotsOf(k).some((s) => slotsOf(c).includes(s)); }).length : 0;
  return (reachable ? 30 : -30) + rules * 40 + revived * 8 + newStates * 6 + Math.min(opens, 4) * 2 + finHere - Math.max(0, sameSpot - 1) * 3
    + (stilCards.includes(id) ? 2 : 0) + (systemScore(r1) - systemScore(r0)) * 0.05;
}

/** Index der Karte, die der Coach-Tipp hervorhebt. */
export function coachPick(offer: string[], picks: string[], cardOf: CardOf, basics: Card2[] = [], pool: string[] = [], stilCards: string[] = []): number {
  let best = 0, bs = -Infinity;
  offer.forEach((id, i) => { const s = draftFit(id, picks, cardOf, basics, pool, stilCards); if (s > bs) { bs = s; best = i; } });
  return best;
}

// ---------------- Angebote ----------------
export interface DraftOffer { cards: string[]; phase: DraftPhase; /** Keine Karte der Phase passte – eine Brücken-Karte aus einer anderen Phase ist dabei. */ bridge: boolean }

function hash(seed: number, i: number): number {
  let h = (seed ^ Math.imul(i + 1, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  return (h ^ (h >>> 13)) >>> 0;
}
function weighted(xs: string[], w: (id: string) => number, rng: () => number): string {
  const ws = xs.map(w);
  let t = rng() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < xs.length; i++) { t -= ws[i]; if (t < 0) return xs[i]; }
  return xs[xs.length - 1];
}

/**
 * B70 Angebot für Pick picks.length: 3 verschiedene, noch nicht gewählte Karten. Mindestens eine passt (ist mit deinen
 * Picks erreichbar) – aus der Phase des Picks, sonst als Brücke aus einer anderen Phase. Die übrigen kommen aus der Phase,
 * erreichbare 3× so oft, Karten deines Stils etwas öfter. Seed-fest: gleicher Seed + gleiche Picks = gleiches Angebot.
 */
export function makeOffer(picks: string[], seed: number, pool: string[], cardOf: CardOf, basics: Card2[] = [], stilCards: string[] = []): DraftOffer {
  const rng = mulberry32(hash(seed, picks.length));
  const phase = slotPhase(picks.length);
  const avail = pool.filter((id) => !picks.includes(id) && !!cardOf(id));
  const { reach } = planGraph(picks, cardOf, basics);
  const ok = (id: string) => slotsOf(cardOf(id)!).some((s) => reach.has(s));
  const inPhase = avail.filter((id) => phaseOf(cardOf(id)!) === phase);
  const stilW = (id: string) => (stilCards.includes(id) ? 1.5 : 1);
  let fits = inPhase.filter(ok), bridge = false;
  if (!fits.length) { fits = avail.filter(ok); bridge = fits.length > 0; }
  const out: string[] = [];
  if (fits.length) out.push(weighted(fits, stilW, rng));
  const rest = (xs: string[]) => xs.filter((id) => !out.includes(id));
  while (out.length < DRAFT_OFFER && rest(inPhase).length) out.push(weighted(rest(inPhase), (id) => (ok(id) ? 3 : 1) * stilW(id), rng));
  while (out.length < DRAFT_OFFER && rest(avail).length) out.push(weighted(rest(avail), (id) => (ok(id) ? 3 : 1) * stilW(id), rng));
  // Reihenfolge mischen, damit die passende Karte nicht immer links steht.
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return { cards: out, phase, bridge };
}

// ---------------- Notfall-Tausch ----------------
export interface NotfallSwap { out: string; in: string; text: string }
/** So viele Tausch-Vorschläge zeigt der Notfall-Tausch. */
export const NOTFALL_OPTIONS = 3;

/**
 * B73 Notfall-Tausch: Besteht der fertige Draft die System-Prüfung nicht, darfst du einmal kostenlos eine Karte tauschen –
 * zur Wahl stehen bis zu 3 Tausche aus dem Vorrat, nach denen die Prüfung besteht (beste zuerst). Reicht kein einzelner
 * Tausch, kommen die Tausche, die am meisten bringen; danach gibt es einen weiteren Notfall-Tausch (höchstens 3).
 */
export function notfallOptions(picks: string[], pool: string[], cardOf: CardOf, basics: Card2[] = []): { swaps: NotfallSwap[]; fixes: boolean } {
  const base = systemCheck(picks, cardOf, basics);
  if (base.ok) return { swaps: [], fixes: true };
  const cand: { out: string; in: string; ok: boolean; s: number }[] = [];
  for (const add of pool) {
    if (picks.includes(add) || !cardOf(add)) continue;
    for (const o of picks) {
      const r = systemCheck(picks.map((x) => (x === o ? add : x)), cardOf, basics);
      cand.push({ out: o, in: add, ok: r.ok, s: systemScore(r) });
    }
  }
  const good = cand.filter((x) => x.ok);
  const list = (good.length ? good : cand.filter((x) => x.s > systemScore(base))).sort((a, b) => b.s - a.s);
  const swaps: NotfallSwap[] = [];
  const usedIn = new Set<string>();
  for (const x of list) {
    if (swaps.length >= NOTFALL_OPTIONS) break;
    if (usedIn.has(x.in)) continue;
    usedIn.add(x.in);
    swaps.push({ out: x.out, in: x.in, text: notfallText(picks, x.in, base, cardOf) });
  }
  return { swaps, fixes: good.length > 0 };
}

const RULE_GAP: Record<string, string> = {
  boden: "Du kommst nicht zu Boden",
  besser: "Am Boden kommst du nicht nach vorn",
  abschluss: "Zu wenige Aufgaben, die du erreichst",
  erreichbar: "Eine Aufgabe erreichst du nie",
};
/** Ein Satz: welche Lücke der Tausch schließt. */
function notfallText(picks: string[], add: string, base: ReturnType<typeof systemCheck>, cardOf: CardOf): string {
  const r = base.rules.find((x) => !x.ok);
  const c = cardOf(add)!;
  const lead = r ? (r.id === "erreichbar" && base.unreachableFinishes[0] ? `${cardOf(base.unreachableFinishes[0])?.plain} erreichst du nie` : RULE_GAP[r.id]) : "Dein System hat eine Lücke";
  return `${lead} – „${c.plain}“ (${c.term}) schließt die Lücke.`;
}

/** Zeigt die erste Lücke des Drafts in einem Satz (für den Notfall-Bildschirm). */
export function draftGapText(picks: string[], cardOf: CardOf, basics: Card2[] = []): string | null {
  const r = systemCheck(picks, cardOf, basics);
  if (r.ok) return null;
  const f = r.rules.find((x) => !x.ok)!;
  if (f.id === "erreichbar") {
    const xs = r.unreachableFinishes.map((x) => cardOf(x)?.plain ?? x);
    return `${base(xs)} erreichst du nie – ${xs.length > 1 ? "die Aufgaben hängen" : "die Aufgabe hängt"} in der Luft.`;
  }
  return `${RULE_GAP[f.id]} (${f.have} von mind. ${f.need}).`;
}
const base = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} und ${xs[xs.length - 1]}` : xs[0] ?? "");

