// Balance-Simulation: Spieler-Bot (3 Stufen) gegen jeden Kampagnen-Gegner in Reihenfolge.
// Ausführen: npx vite-node scripts/simulate.ts [matchesProGegnerUndStufe=300]
// Die Funktionen sind exportiert und werden von src/engine/balance.test.ts (kleinere Stichprobe) genutzt.
import { ARCHETYPES, STARTER_DECK } from "../src/data/campaign";
import { CARD, CARDS } from "../src/data/cards";
import { EXPANSION_CARDS } from "../src/data/expansion";
import { tutorialFor } from "../src/data/tutorials";
import { BEATEN_BY, chooseCard, predictKindIn } from "../src/engine/ai";
import { coachHint } from "../src/engine/learn";
import { resolveReveal } from "../src/engine/resolve";
import { basicsFor } from "../src/data/cards";
import { createMatch, playableCards, playTurn } from "../src/engine/match";
import { type Rng, hashSeed, mulberry32 } from "../src/engine/rng";
import { cardFitsSlot, other, roleOf } from "../src/engine/state";
import type { Archetype, CardDef, CardKind, MatchOptions, MatchState, PositionId, Rarity, Role, Side } from "../src/engine/types";

export type Skill = "novice" | "intermediate" | "expert";
export const SKILLS: Skill[] = ["novice", "intermediate", "expert"];

// ------------------------------------------------------------------
// Auto-Deck: Starterdeck + kumulierte Belohnungen, beste 20 nach Phasenabdeckung
// ------------------------------------------------------------------

const RARITY_V: Record<Rarity, number> = { basis: 1, selten: 1.25, episch: 1.45, legendaer: 1.6 };

/** Wie viele Karten das Deck je Phase (Slot) haben soll – Mehr-Slot-Karten zählen überall. */
const PHASES: Record<string, number> = {
  "dist|neutral": 5, "clinch|neutral": 5, "guard|top": 2, "guard|bottom": 2, "side|top": 2,
  "side|bottom": 2, "mount|top": 2, "mount|bottom": 2, "back|top": 2, "back|bottom": 1,
  "fhl|top": 1, "fhl|bottom": 1,
};
const MAX_SUBS = 5;

const EXPANSION_IDS = new Set(EXPANSION_CARDS.map((c) => c.id));
/** Erweiterungskarten mitsimulieren? Default nein: Balance soll ohne das (parallel entstehende) Paket stimmen. */
export const simConfig = { expansion: false };

/** Sammlung nach dem Sieg über die ersten `beatenCount` Gegner. */
export function collectionAfter(beatenCount: number): string[] {
  const set = new Set(STARTER_DECK);
  for (const a of ARCHETYPES.slice(0, beatenCount)) {
    for (const id of a.reward) if (CARD[id] && (simConfig.expansion || !EXPANSION_IDS.has(id))) set.add(id);
  }
  return [...set];
}

export function autoDeck(collection: string[], size = 20): string[] {
  const cover: Record<string, number> = {};
  const count: Record<string, number> = {};
  const deck: string[] = [];
  let subs = 0;
  // Submissions nur 1× je Technik (breites Abschluss-Repertoire statt 2× derselbe Hebel)
  const maxCopies = (c: CardDef) => (c.rarity === "legendaer" || c.submission ? 1 : 2);
  while (deck.length < size) {
    let best: string | null = null;
    let bestV = -Infinity;
    for (const id of collection) {
      const c = CARD[id];
      if (!c || c.basic || (count[id] ?? 0) >= maxCopies(c)) continue;
      if (c.submission && subs >= MAX_SUBS) continue;
      let v = 0;
      for (const sl of c.slots) {
        const k = `${sl.pos}|${sl.role}`;
        const need = PHASES[k] ?? 0;
        v += Math.max(0, need - (cover[k] ?? 0)) / Math.max(need, 1) + 0.05;
      }
      v *= RARITY_V[c.rarity];
      v /= 1 + (count[id] ?? 0) * 0.8; // zweite Kopie weniger wert
      v += (hashSeed(id) % 1000) / 1e6; // stabile Tie-Breaks
      if (v > bestV) { bestV = v; best = id; }
    }
    if (!best) break;
    deck.push(best);
    if (CARD[best].submission) subs++;
    count[best] = (count[best] ?? 0) + 1;
    for (const sl of CARD[best].slots) { const k = `${sl.pos}|${sl.role}`; cover[k] = (cover[k] ?? 0) + 1; }
  }
  // Auffüllen (kleine Sammlung): Starterdeck-Karten
  for (const id of STARTER_DECK) if (deck.length < size && (count[id] ?? 0) < maxCopies(CARD[id])) { deck.push(id); count[id] = (count[id] ?? 0) + 1; }
  return deck;
}

// ------------------------------------------------------------------
// Spieler-Bot
// ------------------------------------------------------------------

function threatTagsAgainst(state: MatchState, side: Side) {
  const opp = other(side);
  const role = roleOf(state, opp);
  const tags = new Set<string>();
  for (const c of CARDS) if (c.kind === "angriff" && cardFitsSlot(c, state.pos, role)) for (const t of c.tags ?? []) tags.add(t);
  return tags;
}

/**
 * Neuling: zufällige, aber "vernünftige" legale Karte (keine Konter ohne passende Bedrohung, kein Leerlaufen).
 * `guided` (nur Tutorials): die Bubble erklärt das Dreieck gegen die angezeigte Absicht – der Neuling
 * wählt dann zufällig unter den Karten des passenden Typs (nicht unbedingt der richtigen Karte).
 */
function noviceCard(state: MatchState, side: Side, rng: Rng, guided: CardKind | null = null): string {
  const ids = playableCards(state, side).filter((x) => x.playable).map((x) => x.id);
  const threats = threatTagsAgainst(state, side);
  const me = state[side];
  let pool = ids.filter((id) => {
    const c = CARD[id];
    if (c.kind === "reaktion" && !(c.counters ?? []).some((t) => threats.has(t))) return false;
    if (!state.options?.noResources && c.gas > 0 && me.gas - c.gas < 1) return false;
    return true;
  });
  if (pool.length === 0) pool = ids;
  if (guided) {
    const want = BEATEN_BY[guided];
    const g = pool.filter((id) => CARD[id].kind === want);
    if (g.length > 0) pool = g;
  }
  // Neulinge sehen eine freie Submission meist (Karte leuchtet auf)
  const sub = pool.find((id) => CARD[id].submission);
  if (sub && rng() < 0.5) return sub;
  return pool[Math.floor(rng() * pool.length)];
}

/**
 * Was die Tutorial-Bubbles ausdrücklich raten (tutorials.ts, Schritt-Texte) – ein Neuling folgt dem meistens.
 * T2 "Auf Abstand hilft Beine weg, steht ihr eng umklammert, schnapp selbst seine Beine."
 */
function bubbleAdvice(state: MatchState): string[] {
  const t = state.options?.scriptedKind && state.options.fixedHand;
  if (!t) return [];
  if (state.options!.scriptedKind === "angriff") return state.pos === "dist" ? ["sprawl"] : state.pos === "clinch" ? ["double_leg"] : [];
  return [];
}

const RANK: Record<string, number> = {
  "back|top": 5, "mount|top": 4, "side|top": 3, "fhl|top": 2, "guard|top": 1,
  "back|bottom": -5, "mount|bottom": -4, "side|bottom": -3, "fhl|bottom": -2, "guard|bottom": 0,
};
function valueFor(st: MatchState, side: Side): number {
  if (st.result?.type === "submission") return st.result.winner === side ? 100 : -100;
  const o = other(side);
  return st[side].pts - st[o].pts + (RANK[`${st.pos}|${roleOf(st, side)}`] ?? 0) * 0.8
    + (st[side].control - st[o].control) * 0.35 + (st[side].gas - st[o].gas) * 0.08;
}

/**
 * Experte rechnet: Er kennt das Deck des Gegners (Steckbrief) und rechnet jede eigene Karte gegen alle Karten durch,
 * die der Gegner hier mit seinem sichtbaren Gas/Griff spielen könnte (echte Regeln). Gewichtung je Typ:
 * angezeigte Absicht = sicher; sonst gleichverteilt, plus erwarteter Read (die KI kontert sein eigenes Muster).
 */
function evPick(state: MatchState, side: Side, kindW: Partial<Record<CardKind, number>>, oppDeck: string[]): string | null {
  const opp = other(side);
  const oppRole = roleOf(state, opp);
  const pool = [...new Set(oppDeck)].map((id) => CARD[id]).concat(basicsFor(state.pos, oppRole))
    .filter((c) => (kindW[c.kind] ?? 0) > 0 && cardFitsSlot(c, state.pos, oppRole)
      && (state.options?.noResources || (c.gas <= state[opp].gas && (c.requiresControl ?? 0) <= state[opp].control)));
  if (pool.length === 0) return null;
  const perKind: Record<string, number> = {};
  for (const c of pool) perKind[c.kind] = (perKind[c.kind] ?? 0) + 1;
  const mine = playableCards(state, side).filter((x) => x.playable).map((x) => x.id);
  const base = valueFor(state, side);
  let best: string | null = null, bestV = -Infinity;
  for (const id of mine) {
    let v = 0;
    for (const oc of pool) {
      const [pc, occ] = side === "p" ? [id, oc.id] : [oc.id, id];
      v += ((kindW[oc.kind] ?? 0) / perKind[oc.kind]) * (valueFor(resolveReveal(state, pc, occ).state, side) - base);
    }
    if (v > bestV) { bestV = v; best = id; }
  }
  return best;
}

function counterIntent(state: MatchState, side: Side, intent: CardKind, oppDeck: string[]): string | null {
  return evPick(state, side, { [intent]: 1 }, oppDeck);
}

/** Wie oft der Experte gegen Reads spielt – als Faktor auf die (im Blurb angedeutete) Yomi-Stufe des Gegners. */
export const expertTuning = { antiRead: 0.8, useIntent: true, evRate: 0.7 };

export function playerCard(
  state: MatchState, side: Side, skill: Skill, intent: CardKind | null, rng: Rng, oppReads = 0.4, oppDeck: string[] = [],
): string {
  const ok = playableCards(state, side).filter((x) => x.playable).map((x) => x.id);
  const fromCoach = (it: CardKind | null) => {
    const h = coachHint(state, side, 3, it);
    return h.cardId && ok.includes(h.cardId) ? h.cardId : null;
  };
  const guided = state.options?.scriptedKind ? intent : null; // Tutorial-Bubbles erklären die Absicht
  const advice = bubbleAdvice(state).find((id) => ok.includes(id));
  if (advice && rng() < (skill === "novice" ? 0.75 : 0.9)) return advice;
  if (skill === "novice") return noviceCard(state, side, rng, guided);
  if (skill === "intermediate") return (rng() < 0.6 ? fromCoach(null) : null) ?? noviceCard(state, side, rng);
  if (intent && expertTuning.useIntent) return counterIntent(state, side, intent, oppDeck) ?? fromCoach(intent) ?? noviceCard(state, side, rng);
  // Experte ohne angezeigte Absicht: weiß, dass die KI sein Muster liest (gleicher Read wie die KI, predictKindIn),
  // und rechnet gegen die Mischung "zufällig + Read" (siehe evPick).
  if (expertTuning.antiRead > 0 && rng() < expertTuning.evRate) {
    const mine = predictKindIn(state, side);
    const w: Partial<Record<CardKind, number>> = { angriff: 1, setup: 1, reaktion: 1 };
    if (mine) w[BEATEN_BY[mine]] = 1 + 3 * oppReads * expertTuning.antiRead;
    const c = evPick(state, side, w, oppDeck);
    if (c) return c;
  }
  const coach = fromCoach(null);
  return coach ?? noviceCard(state, side, rng);
}

// ------------------------------------------------------------------
// Match-Lauf (spiegelt Arena.tsx: Tutorial-Optionen, Neulings-Hand 4 in den ersten 6 Kämpfen, 12 Runden)
// ------------------------------------------------------------------

export interface MatchStats {
  won: boolean; draw: boolean; sub: { winner: Side; card: string } | null; turns: number;
  positions: Set<string>; aiTags: Record<string, number>; aiKinds: Record<CardKind, number>;
  dumbSetup: number; passiveZeroGas: number; aiTurns: number;
  aiCards: Record<string, number>; liked: number;
}

export function matchSetup(arch: Archetype, idx: number): { options?: MatchOptions; maxTurns: number } {
  const tut = tutorialFor(arch.id);
  if (tut) return { options: tut.options, maxTurns: tut.maxTurns };
  return { options: idx < 6 ? { handSize: 4 } : undefined, maxTurns: 12 };
}

export function runMatch(arch: Archetype, idx: number, pDeck: string[], skill: Skill, seed: number): MatchStats {
  const { options, maxTurns } = matchSetup(arch, idx);
  const tut = tutorialFor(arch.id);
  const rng = mulberry32(seed ^ 0x2545f491);
  let s = createMatch(pDeck, arch.deck, seed, maxTurns, options);
  const st: MatchStats = {
    won: false, draw: false, sub: null, turns: 0, positions: new Set([`${s.pos}|${roleOf(s, "p")}`]),
    aiTags: {}, aiKinds: { angriff: 0, setup: 0, reaktion: 0 }, dumbSetup: 0, passiveZeroGas: 0, aiTurns: 0,
    aiCards: {}, liked: 0,
  };
  let zeroGasPassive = 0;
  while (!s.result) {
    const ai = chooseCard(s, arch, rng);
    const req = tut?.steps.find((x) => x.when === "beforePick" && x.turn === s.turn && x.requireCard)?.requireCard;
    const p = req ?? playerCard(s, "p", skill, ai.intent, rng, arch.reads, arch.deck);
    // KI-Qualität
    const oc = CARD[ai.card];
    st.aiTurns++;
    st.aiKinds[oc.kind]++;
    for (const t of [...(oc.tags ?? []), ...(oc.counters ?? [])]) st.aiTags[t] = (st.aiTags[t] ?? 0) + 1;
    if (!oc.basic) st.aiCards[oc.id] = (st.aiCards[oc.id] ?? 0) + 1;
    if ([oc.kind, ...(oc.tags ?? []), ...(oc.counters ?? [])].some((t) => (arch.likes as Record<string, number>)[t])) st.liked++;
    const aiOk = playableCards(s, "o").filter((x) => x.playable).map((x) => CARD[x.id]);
    if (!options?.scriptedKind && oc.kind === "setup" && aiOk.some((c) => c.submission)) st.dumbSetup++;
    if (s.o.gas === 0 && oc.kind !== "angriff") zeroGasPassive++; else zeroGasPassive = 0;
    if (zeroGasPassive >= 3) st.passiveZeroGas++;
    // Richtig getippt (+1 Puste) – Fortgeschrittene/Experten tippen die angezeigte Absicht
    const predicted = skill !== "novice" ? ai.intent : null;
    s = playTurn(s, p, ai.card, rng).state;
    if (predicted && predicted === oc.kind) s = { ...s, p: { ...s.p, gas: Math.min(12, s.p.gas + 1) } };
    st.positions.add(`${s.pos}|${roleOf(s, "p")}`);
    if (s.turn > 40) throw new Error("Match endet nicht");
  }
  const r = s.result!;
  st.turns = s.turn - 1;
  st.won = r.winner === "p";
  st.draw = r.type === "points" && r.winner === null;
  if (r.type === "submission") st.sub = { winner: r.winner, card: r.card };
  return st;
}

// ------------------------------------------------------------------
// Aggregation
// ------------------------------------------------------------------

export interface Row {
  id: string; name: string; belt: string; boss: boolean; tutorial?: number; skill: Skill; n: number;
  win: number; draw: number; subShare: number; avgTurns: number; dumbSetup: number; passive: number;
  topTags: string[]; topCards: string[]; likeShare: number; kinds: Record<CardKind, number>; aiSubCards: Record<string, number>; pSubCards: Record<string, number>;
}

export interface SimResult {
  rows: Row[]; subCards: Record<string, number>; subs: number; total: number; positions: Set<string>;
  nonTutorialTurns: number; nonTutorialMatches: number;
}

export function simulate(n: number, skills: Skill[] = SKILLS, only?: (a: Archetype) => boolean, salt = ""): SimResult {
  const rows: Row[] = [];
  const subCards: Record<string, number> = {};
  const positions = new Set<string>();
  let subs = 0, total = 0, ntTurns = 0, ntMatches = 0;
  ARCHETYPES.forEach((arch, idx) => {
    if (only && !only(arch)) return;
    const deck = autoDeck(collectionAfter(idx));
    for (const skill of skills) {
      let w = 0, d = 0, sb = 0, turns = 0, dumb = 0, passive = 0;
      const tags: Record<string, number> = {};
      const cards: Record<string, number> = {};
      let liked = 0, aiTurns = 0;
      const aiSubCards: Record<string, number> = {};
      const pSubCards: Record<string, number> = {};
      const kinds: Record<CardKind, number> = { angriff: 0, setup: 0, reaktion: 0 };
      for (let i = 0; i < n; i++) {
        const m = runMatch(arch, idx, deck, skill, salt ? hashSeed(arch.id, skill, i, salt) : hashSeed(arch.id, skill, i));
        if (m.won) w++;
        if (m.draw) d++;
        turns += m.turns;
        dumb += m.dumbSetup;
        passive += m.passiveZeroGas;
        for (const [t, k] of Object.entries(m.aiTags)) tags[t] = (tags[t] ?? 0) + k;
        for (const [t, k] of Object.entries(m.aiCards)) cards[t] = (cards[t] ?? 0) + k;
        liked += m.liked; aiTurns += m.aiTurns;
        for (const k of Object.keys(kinds) as CardKind[]) kinds[k] += m.aiKinds[k];
        for (const p of m.positions) positions.add(p);
        if (m.sub) { const t = m.sub.winner === "o" ? aiSubCards : pSubCards; t[m.sub.card] = (t[m.sub.card] ?? 0) + 1; }
        if (!arch.tutorial) {
          total++; ntTurns += m.turns; ntMatches++;
          if (m.sub) { subs++; sb++; subCards[m.sub.card] = (subCards[m.sub.card] ?? 0) + 1; }
        } else if (m.sub) sb++;
      }
      const sumK = kinds.angriff + kinds.setup + kinds.reaktion || 1;
      rows.push({
        id: arch.id, name: arch.name, belt: arch.belt, boss: !!arch.boss, tutorial: arch.tutorial, skill, n,
        win: w / n, draw: d / n, subShare: sb / n, avgTurns: turns / n, dumbSetup: dumb, passive,
        topTags: Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => t),
        topCards: Object.entries(cards).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => t),
        likeShare: liked / (aiTurns || 1),
        kinds: { angriff: kinds.angriff / sumK, setup: kinds.setup / sumK, reaktion: kinds.reaktion / sumK },
        aiSubCards, pSubCards,
      });
    }
  });
  return { rows, subCards, subs, total, positions, nonTutorialTurns: ntTurns, nonTutorialMatches: ntMatches };
}

/** Zielband je Gegner und Stufe (null = kein Ziel). */
export function targetBand(a: Archetype, skill: Skill): [number, number] | null {
  if (a.tutorial) return skill === "novice" ? [0.9, 1] : null;
  if (a.belt === "weiss") return skill === "intermediate" ? [0.65, 0.75] : skill === "novice" ? [0.4, 0.55] : null;
  if (a.belt === "schwarz" || a.boss) return skill === "intermediate" ? [0.35, 0.5] : skill === "expert" ? [0.55, 0.7] : null;
  if (skill !== "intermediate") return null;
  return a.belt === "blau" ? [0.55, 0.65] : a.belt === "lila" ? [0.5, 0.6] : [0.45, 0.55];
}

const pct = (x: number) => `${Math.round(x * 100)}%`.padStart(4);

function report(r: SimResult) {
  const byId = new Map<string, Row[]>();
  for (const row of r.rows) byId.set(row.id, [...(byId.get(row.id) ?? []), row]);
  console.log("\nGegner             | Novice | Interm | Expert | Ziel          | Subs(I) | Züge(I) | KI A/S/R (I)   | Likes | Top-Karten der KI (I)");
  console.log("-".repeat(150));
  let misses = 0;
  for (const [id, rs] of byId) {
    const a = ARCHETYPES.find((x) => x.id === id)!;
    const cell = (sk: Skill) => {
      const row = rs.find((x) => x.skill === sk)!;
      const band = targetBand(a, sk);
      const bad = band && (row.win < band[0] - 0.005 || row.win > band[1] + 0.005);
      if (bad) misses++;
      return `${pct(row.win)}${bad ? "!" : " "}  `;
    };
    const im = rs.find((x) => x.skill === "intermediate")!;
    const goals = SKILLS.map((sk) => { const b = targetBand(a, sk); return b ? `${sk[0].toUpperCase()}${Math.round(b[0] * 100)}-${Math.round(b[1] * 100)}` : ""; }).filter(Boolean).join(" ");
    const label = `${a.id}${a.boss ? " (Boss)" : ""}${a.tutorial ? ` (T${a.tutorial})` : ""}`;
    console.log(`${label.padEnd(19)}| ${cell("novice")} | ${cell("intermediate")} | ${cell("expert")} | ${goals.padEnd(13)} | ${pct(im.subShare)}    | ${im.avgTurns.toFixed(1).padStart(5)}   | ${pct(im.kinds.angriff)}/${pct(im.kinds.setup)}/${pct(im.kinds.reaktion)} | ${pct(im.likeShare)}  | ${im.topCards.join(", ")}`);
  }
  const subTotal = Object.values(r.subCards).reduce((a, b) => a + b, 0) || 1;
  console.log(`\nSubmission-Anteil (ohne Tutorials): ${pct(r.subs / r.total)}  (${r.subs}/${r.total})`);
  console.log("Submissions nach Karte:", Object.entries(r.subCards).sort((a, b) => b[1] - a[1]).map(([c, k]) => `${c} ${pct(k / subTotal)}`).join(", "));
  console.log(`Ø Matchlänge (ohne Tutorials): ${(r.nonTutorialTurns / r.nonTutorialMatches).toFixed(2)} Züge`);
  const allPos: PositionId[] = ["dist", "clinch", "fhl", "guard", "side", "mount", "back"];
  const missing = allPos.flatMap((p) => (["neutral", "top", "bottom"] as Role[]).map((ro) => `${p}|${ro}`))
    .filter((k) => (k.startsWith("dist") || k.startsWith("clinch")) === k.endsWith("neutral"))
    .filter((k) => !r.positions.has(k));
  console.log(`Positionen erreicht: ${r.positions.size}${missing.length ? ` – fehlt: ${missing.join(", ")}` : " (alle)"}`);
  const dumb = r.rows.reduce((n, x) => n + x.dumbSetup, 0);
  const passive = r.rows.reduce((n, x) => n + x.passive, 0);
  console.log(`KI-Fehler: Setup/Konter statt freier Submission ${dumb}×, ≥3 Züge passiv bei 0 Gas ${passive}×`);
  console.log(`Zielband verfehlt: ${misses}`);
}

export { report };
const isMain = typeof process !== "undefined" && !process.env.VITEST && !process.env.SIM_LIB && /simulate\.ts$/.test(import.meta.url);
if (isMain) {
  const n = Number(process.argv.slice(2).find((a) => /^\d+$/.test(a)) ?? 300);
  simConfig.expansion = process.argv.includes("--expansion");
  const t0 = Date.now();
  const onlyArg = process.argv.find((a) => a.startsWith("--only="))?.slice(7).split(",");
  const r = simulate(n, SKILLS, onlyArg ? (a) => onlyArg.includes(a.id) : undefined);
  report(r);
  console.log(`(${n} Matches je Gegner und Stufe, ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  if (process.argv.includes("--subs")) {
    for (const row of r.rows) if (row.skill === "intermediate") console.log(row.id.padEnd(13), "KI:", JSON.stringify(row.aiSubCards), " Spieler:", JSON.stringify(row.pSubCards));
  }
  if (process.argv.includes("--decks")) {
    ARCHETYPES.forEach((a, i) => console.log(a.id, autoDeck(collectionAfter(i)).join(" ")));
  }
}
