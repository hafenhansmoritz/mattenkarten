// Mechanik 10 „Gürtel-Rangliste“ (Spec B76–B82). Reine Funktionen, kein Speicher, kein React.
// Spielränge Weiß → Blau → Lila → Braun → Schwarz mit je 4 Streifen. Sieg = Streifen, Niederlage = ein Streifen weg,
// nie unter den aktuellen Gürtel. Bei 4 Streifen kommt die Gürtelprüfung gegen Bosse.
// Ehrlich: Das ist ein Spielrang, kein echter Gürtel – den vergibt nur dein Trainer.
import { mulberry32 } from "../../engine/rng";
import type { AiStyle } from "../engine/ai";
import { STIL_IDS } from "../engine/stil";
import type { StilId } from "../types";

export const HONESTY = "Das ist ein Spielrang, kein echter Gürtel – den vergibt nur dein Trainer.";

/* ---------- B76 Gürtel und Streifen ---------- */
export const BELT_IDS = ["weiss", "blau", "lila", "braun", "schwarz"] as const;
export type BeltId = (typeof BELT_IDS)[number];
export const BELT_NAME: Record<BeltId, string> = { weiss: "Weiß", blau: "Blau", lila: "Lila", braun: "Braun", schwarz: "Schwarz" };
/** Farben wie die Kampagnen-Gürtel (data/campaign.ts). */
export const BELT_COLOR: Record<BeltId, { c: string; a: string }> = {
  weiss: { c: "#f4f1ea", a: "#c9c4b8" }, blau: { c: "#1f5fbf", a: "#5d8fe0" }, lila: { c: "#6b3fa0", a: "#9b72cf" },
  braun: { c: "#6e4524", a: "#9c6b42" }, schwarz: { c: "#141414", a: "#c8102e" },
};
export const TOP = BELT_IDS.length - 1;
export const STRIPES = 4;
/** B77 Siegesserie: ab dem 3. Sieg in Folge ein Bonus-Streifen – nur auf Weiß und Blau (dort sollst du schnell hinkommen, wo du hingehörst). */
export const STREAK_FROM = 3;
export const STREAK_MAX_BELT = 1;
/** B77 Weiß-Schutz: auf Weiß kostet eine Niederlage keinen Streifen (wie die untersten Ränge in Hearthstone) – zum Reinkommen. */
export const SAFE_BELT = 0;
/** B79 Gürtelprüfung: so viele Bosse in Folge musst du schlagen, um den nächsten Gürtel zu bekommen (Index = aktueller Gürtel). */
export const GATE_LEN = [1, 2, 3, 4] as const;
/** Boss-Stufe in der Prüfung: von Weiß nach Blau Stufe 2, danach Stufe 3. */
export const GATE_LEVEL = [2, 3, 3, 3] as const;
export const beltName = (i: number) => BELT_NAME[BELT_IDS[Math.max(0, Math.min(TOP, i))]];

/* ---------- B80 Gegner und versteckte Wertung ---------- */
export type TierId = "l1" | "l2" | "l3" | "konter";
export interface Tier { id: TierId; level: 1 | 2 | 3; rating: number; label: string; info: string }
/** Wertungen aus der Sim (Elo, Stufe 1 = 800): L2 schlägt L1 62 %, L3 schlägt L2 87 %, Konter ≈ L3. */
export const TIERS: Record<TierId, Tier> = {
  l1: { id: "l1", level: 1, rating: 800, label: "KI Locker", info: "Stufe 1: probiert vieles aus." },
  l2: { id: "l2", level: 2, rating: 900, label: "KI Normal", info: "Stufe 2: macht noch Fehler." },
  l3: { id: "l3", level: 3, rating: 1200, label: "KI Hart", info: "Stufe 3: liest dich und plant voraus." },
  konter: { id: "konter", level: 3, rating: 1210, label: "KI Hart · kennt deinen Stil", info: "Stufe 3 und spielt gezielt gegen deinen Stil." },
};
export const BOSS_RATING: Record<2 | 3, number> = { 2: 900, 3: 1210 };
/** Welche Gegner es auf welchem Gürtel gibt (Schwarz wie Braun). */
export const BELT_TIERS: Record<BeltId, TierId[]> = {
  weiss: ["l1", "l2"], blau: ["l2", "l3"], lila: ["l3", "konter"], braun: ["l3", "konter"], schwarz: ["l3", "konter"],
};
/** Ziel-Wertung = deine Wertung + STRIPE_STEP je Streifen: mit jedem Streifen wird der Gegner etwas stärker. */
export const STRIPE_STEP = 75;
/** Streuung der Wahl: Gegner nahe an der Ziel-Wertung kommen öfter (Gewicht exp(−Abstand / SPREAD)). */
export const SPREAD = 75;
export const MMR_START = 900;
export const K_NEW = 48, K = 24, K_NEW_GAMES = 10;

export type LadderMode = "stil" | "plan";
export type MatchResult = "win" | "loss" | "draw";

export interface LadderFoe {
  tier: TierId | "boss";
  level: 1 | 2 | 3;
  stil: StilId;
  /** Boss-ID bei der Gürtelprüfung. */
  boss?: StilId;
  rating: number;
  seed: number;
  /** Gürtelprüfung: Kampf n von of. */
  gate?: { n: number; of: number };
}

export interface LadderEntry {
  season: string;
  result: MatchResult;
  foe: LadderFoe;
  mode: LadderMode;
  /** Vorher/nachher als Gürtel-Index und Streifen. */
  from: [number, number];
  to: [number, number];
  bonus?: boolean;
  promoted?: boolean;
}

export interface LadderState {
  v: 1;
  seed: number;
  /** Saison-ID "JJJJ-MM". */
  season: string;
  belt: number;
  stripes: number;
  /** Gewonnene Prüfungs-Kämpfe in der laufenden Gürtelprüfung. */
  gate: number;
  streak: number;
  /** Versteckte Wertung (Elo gegen die KI-Stufen) und gezählte Kämpfe. */
  mmr: number;
  games: number;
  /** Höchster Gürtel dieser Saison. */
  best: number;
  /** Rahmen vergangener Saisons (höchster Gürtel je Saison). */
  frames: { season: string; belt: number }[];
  /** Gewählter Kartenrücken-Rahmen (Gürtel-Index) oder null. */
  frame: number | null;
  mode: LadderMode;
  stil: StilId;
  next: LadderFoe;
  history: LadderEntry[];
  /** Beförderung, die noch gezeigt werden soll (Gürtel-Index). */
  promo: number | null;
  /** Hinweis zur neuen Saison (einmal zeigen). */
  seasonNote: { from: string; belt: number } | null;
}

export const HISTORY_MAX = 20;

/* ---------- Saison ---------- */
const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
/** Saison = Kalendermonat (lokales Datum "JJJJ-MM-TT" → "JJJJ-MM"). */
export const seasonOf = (date: string): string => date.slice(0, 7);
/** „Saison November 2026“ – nur der Name, kein Countdown. */
export function seasonName(id: string): string {
  const [y, m] = id.split("-").map(Number);
  return MONTHS[m - 1] ? `Saison ${MONTHS[m - 1]} ${y}` : `Saison ${id}`;
}
export const localDate = (d = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/* ---------- Elo ---------- */
export const expected = (me: number, foe: number): number => 1 / (1 + Math.pow(10, (foe - me) / 400));
export function eloUpdate(mmr: number, foe: number, result: MatchResult, games: number): number {
  const sc = result === "win" ? 1 : result === "draw" ? 0.5 : 0;
  const k = games < K_NEW_GAMES ? K_NEW : K;
  return Math.round(mmr + k * (sc - expected(mmr, foe)));
}

/* ---------- Gegnerwahl ---------- */
export const inGate = (s: Pick<LadderState, "belt" | "stripes">): boolean => s.belt < TOP && s.stripes >= STRIPES;
/** Ziel-Wertung für den nächsten Gegner (für Anzeige und Tests). */
export const targetRating = (s: Pick<LadderState, "mmr" | "stripes">): number => s.mmr + STRIPE_STEP * s.stripes;

/** Gewichte der Gegner-Stufen auf diesem Gürtel (Summe 1). */
export function tierWeights(s: Pick<LadderState, "belt" | "mmr" | "stripes">): { tier: TierId; w: number }[] {
  const t = targetRating(s);
  const ws = BELT_TIERS[BELT_IDS[s.belt]].map((id) => ({ tier: id, w: Math.exp(-Math.abs(TIERS[id].rating - t) / SPREAD) }));
  const sum = ws.reduce((n, x) => n + x.w, 0);
  return ws.map((x) => ({ tier: x.tier, w: x.w / sum }));
}

/** Nächster Gegner – seed-fest aus Lauf-Seed und Zahl der Kämpfe. */
export function pickFoe(s: Pick<LadderState, "seed" | "games" | "belt" | "stripes" | "mmr" | "gate" | "stil" | "history">): LadderFoe {
  const rng = mulberry32((s.seed ^ Math.imul(s.games + 1, 0x27d4eb2d)) >>> 0);
  const seed = Math.floor(rng() * 100000);
  if (inGate(s)) {
    const of = GATE_LEN[s.belt];
    const level = GATE_LEVEL[s.belt];
    // Bosse der laufenden Prüfung nicht wiederholen; erster Boss zufällig.
    const done = (s.gate > 0 ? s.history.slice(-s.gate) : []).filter((h) => h.foe.boss).map((h) => h.foe.boss!);
    const left = STIL_IDS.filter((id) => !done.includes(id));
    const boss = left[Math.floor(rng() * left.length) % left.length];
    return { tier: "boss", level, stil: boss, boss, rating: BOSS_RATING[level], seed, gate: { n: s.gate + 1, of } };
  }
  const ws = tierWeights(s);
  let x = rng(), tier = ws[ws.length - 1].tier;
  for (const t of ws) { x -= t.w; if (x < 0) { tier = t.tier; break; } }
  const others = STIL_IDS.filter((id) => id !== s.stil);
  const stil = rng() < 0.25 ? s.stil : others[Math.floor(rng() * others.length) % others.length];
  return { tier, level: TIERS[tier].level, stil, rating: TIERS[tier].rating, seed };
}

/** KI-Gewichte für den Gegner: Konter-Stufe spielt das Konter-Profil gegen deinen Stil (aus data/bosses.ts). */
export function foeStyle(f: LadderFoe, myStil: StilId, counterOf: (id: StilId) => AiStyle): AiStyle | undefined {
  return f.tier === "konter" ? counterOf(myStil) : undefined;
}

/* ---------- Zustand ---------- */
export function newLadder(seed: number, today: string, stil: StilId = "ringer"): LadderState {
  const base = {
    v: 1 as const, seed: seed >>> 0, season: seasonOf(today), belt: 0, stripes: 0, gate: 0, streak: 0, mmr: MMR_START, games: 0, best: 0,
    frames: [], frame: null, mode: "stil" as LadderMode, stil, history: [], promo: null, seasonNote: null,
  };
  return { ...base, next: pickFoe(base) };
}

export interface ResultInfo {
  /** Streifen dazu (inkl. Bonus) bzw. weg. */
  gained: number;
  lost: number;
  bonus: boolean;
  /** Neuer Gürtel-Index bei Beförderung. */
  promoted: number | null;
  /** Prüfungs-Kampf gewonnen, aber Prüfung noch nicht fertig. */
  gateStep: boolean;
}

/** B77/B79 Ergebnis eintragen: Streifen, Untergrenze, Serie, Prüfung, Wertung, nächster Gegner. */
export function recordResult(s: LadderState, result: MatchResult): { state: LadderState; info: ResultInfo } {
  const f = s.next;
  const from: [number, number] = [s.belt, s.stripes];
  const info: ResultInfo = { gained: 0, lost: 0, bonus: false, promoted: null, gateStep: false };
  let { belt, stripes, gate, streak } = s;
  if (result === "draw" && !f.gate) {
    // Unentschieden ändert nichts (auch nicht die Serie).
  } else if (f.gate) {
    // In der Prüfung brauchst du den Sieg: Unentschieden zählt wie eine Niederlage (wie im Draft-Lauf).
    if (result === "win") {
      streak++;
      gate++;
      if (gate >= f.gate.of) { belt++; stripes = 0; gate = 0; info.promoted = belt; }
      else info.gateStep = true;
    } else {
      // Prüfung verloren: ein Streifen weg wie sonst auch – nie unter den Gürtel (auf Weiß: Prüfung einfach nochmal).
      streak = 0; gate = 0;
      if (belt > SAFE_BELT) { stripes = STRIPES - 1; info.lost = 1; }
    }
  } else if (result === "win") {
    streak++;
    const bonus = belt <= STREAK_MAX_BELT && streak >= STREAK_FROM && stripes + 1 < STRIPES ? 1 : 0;
    const add = Math.min(STRIPES - stripes, 1 + bonus);
    stripes += add; info.gained = add; info.bonus = bonus > 0 && add > 1;
  } else {
    streak = 0;
    if (stripes > 0 && belt > SAFE_BELT) { stripes--; info.lost = 1; }
  }
  const mmr = eloUpdate(s.mmr, f.rating, result, s.games);
  const games = s.games + 1;
  const entry: LadderEntry = {
    season: s.season, result, foe: f, mode: s.mode, from, to: [belt, stripes],
    ...(info.bonus ? { bonus: true } : {}), ...(info.promoted !== null ? { promoted: true } : {}),
  };
  const history = [...s.history, entry].slice(-HISTORY_MAX);
  const st: LadderState = {
    ...s, belt, stripes, gate, streak, mmr, games, history, best: Math.max(s.best, belt),
    promo: info.promoted ?? s.promo,
  };
  return { state: { ...st, next: pickFoe(st) }, info };
}

/** B81 Saisonwechsel (weicher Reset): Gürtel bleibt, Streifen auf 0, Rahmen für den höchsten Gürtel der alten Saison. */
export function rollSeason(s: LadderState, today: string): LadderState {
  const season = seasonOf(today);
  if (season <= s.season) return s; // gleiche (oder ältere, Uhr verstellt) Saison: nichts tun
  const frames = [...s.frames.filter((x) => x.season !== s.season), { season: s.season, belt: s.best }].slice(-24);
  const st: LadderState = { ...s, season, stripes: 0, gate: 0, streak: 0, best: s.belt, frames, seasonNote: { from: s.season, belt: s.best } };
  return { ...st, next: pickFoe(st) };
}

/** Rahmen, die du schon hast: jeder Gürtel bis zum höchsten je erreichten (vergangene Saisons und diese). */
export function framesOwned(s: Pick<LadderState, "frames" | "best">): number[] {
  const top = Math.max(s.best, ...s.frames.map((f) => f.belt));
  return Array.from({ length: top + 1 }, (_, i) => i);
}

/** Wechsel von Modus, Stil oder Rahmen: Stand und nächster Gegner bleiben (die Konter-KI spielt dann gegen den neuen Stil). */
export function setChoice(s: LadderState, c: Partial<Pick<LadderState, "mode" | "stil" | "frame">>): LadderState {
  return { ...s, ...c };
}

/** Kurzer Text zum Stand: „Blau · 2 Streifen“ bzw. „Blau · Gürtelprüfung 1/1“. */
export function rankText(s: Pick<LadderState, "belt" | "stripes" | "gate">): string {
  if (inGate(s)) return `${beltName(s.belt)} · Gürtelprüfung`;
  return `${beltName(s.belt)} · ${s.stripes} Streifen`;
}

/** Speicher bereinigen: kaputte Werte verwerfen (null) oder begrenzen. */
export function sanitizeLadder(raw: unknown, today: string): LadderState | null {
  const o = raw as LadderState | null;
  if (!o || typeof o !== "object" || o.v !== 1) return null;
  const nat = (x: unknown, max: number) => typeof x === "number" && Number.isInteger(x) && x >= 0 && x <= max;
  if (!nat(o.belt, TOP) || !nat(o.stripes, STRIPES) || !nat(o.seed, 0xffffffff) || !nat(o.games, 1e7)) return null;
  if (typeof o.season !== "string" || !/^\d{4}-\d{2}$/.test(o.season)) return null;
  if (typeof o.mmr !== "number" || !Number.isFinite(o.mmr)) return null;
  const stil: StilId = (STIL_IDS as string[]).includes(o.stil) ? o.stil : "ringer";
  const frames = Array.isArray(o.frames)
    ? o.frames.filter((f) => f && typeof f.season === "string" && nat(f.belt, TOP)).map((f) => ({ season: f.season, belt: f.belt })).slice(-24) : [];
  const history = Array.isArray(o.history)
    ? o.history.filter((h) => h && ["win", "loss", "draw"].includes(h.result) && h.foe && typeof h.foe.rating === "number").slice(-HISTORY_MAX) : [];
  const belt = o.belt, stripes = o.stripes;
  const base: LadderState = {
    v: 1, seed: o.seed, season: o.season, belt, stripes,
    gate: nat(o.gate, 2) && inGate({ belt, stripes }) ? Math.min(o.gate, GATE_LEN[belt] - 1) : 0,
    streak: nat(o.streak, 1e6) ? o.streak : 0,
    mmr: Math.max(400, Math.min(2000, Math.round(o.mmr))), games: o.games,
    best: nat(o.best, TOP) ? Math.max(o.best, belt) : belt,
    frames, frame: nat(o.frame, TOP) ? o.frame : null,
    mode: o.mode === "plan" ? "plan" : "stil", stil, history,
    promo: nat(o.promo, TOP) ? o.promo : null,
    seasonNote: o.seasonNote && typeof o.seasonNote.from === "string" && nat(o.seasonNote.belt, TOP) ? { from: o.seasonNote.from, belt: o.seasonNote.belt } : null,
    next: o.next as LadderFoe,
  };
  // Gegner neu bestimmen (seed-fest, also derselbe wie vorher, wenn nichts kaputt war).
  const st = { ...base, next: pickFoe(base) };
  return rollSeason(st, today);
}
