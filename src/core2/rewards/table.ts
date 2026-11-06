// Mechanik 8 – Belohnungen fürs Lernen (B63–B68): Belohnungs-Tabelle, Chancen, Staub, Herstellen.
// Reine Logik ohne Speicher und ohne React – darum gut testbar.
// Ethik (fest): kein Echtgeld, keine kaufbare Währung, keine bezahlten Pakete, keine Druck-Timer,
// keine Strafe fürs Aussetzen, Chancen offen sichtbar, Lerninhalte nie hinter Belohnungen.
import type { Rarity } from "../ui/rarity";
import type { LearningEvent, LearningEventType } from "./events";

/* ---------- B63: Belohnungs-Tabelle ---------- */

export interface RewardRule {
  /** Mattenpakete pro Ereignis. */
  packs: number;
  /** Mattenstaub pro Ereignis. */
  staub: number;
  /** Höchstens so oft pro Kalendertag (null = keine Tagesgrenze). */
  perDay: number | null;
  /** Einmal für immer je Schlüssel (z. B. je Programm-Tag, je Boss). null = wiederholbar. */
  onceKey: ((e: LearningEvent) => string) | null;
  /** Was du tust (für die Tabelle im Inventar). */
  what: string;
  /** Grenze in Worten. */
  limit: string;
  /** Optional: Menge hängt vom Ereignis ab (packs/staub oben = Anzeige für den Grundfall). */
  amount?: (e: LearningEvent) => { packs: number; staub: number };
}

/** B74 Draft-Lauf: ab 3 Siegen 1 Paket, mit 7 Siegen dazu 5 Staub – höchstens ein belohnter Lauf am Tag.
 *  Bewusst kleiner als echtes Training (1 Paket + 10 Staub): Mattenzeit zählt am meisten (B63). */
export const DRAFT_REWARD_MIN_WINS = 3;
export function draftAmount(wins: number): { packs: number; staub: number } {
  if (wins < DRAFT_REWARD_MIN_WINS) return { packs: 0, staub: 0 };
  return wins >= 7 ? { packs: 1, staub: 5 } : { packs: 1, staub: 0 };
}

export const REWARDS: Record<LearningEventType, RewardRule> = {
  program_day: { packs: 1, staub: 0, perDay: null, onceKey: (e) => `day:${(e as { day: number }).day}`, what: "Einen Tag im 7-Tage-Start abschließen", limit: "je Tag einmal" },
  exam_passed: { packs: 2, staub: 0, perDay: null, onceKey: () => "exam", what: "Prüfung an Tag 7 bestehen", limit: "einmal" },
  review_done: { packs: 1, staub: 0, perDay: 1, onceKey: null, what: "Eine Wiederholungsrunde schaffen", limit: "1 pro Tag" },
  error_cleared: { packs: 0, staub: 5, perDay: 3, onceKey: null, what: "Eine Fehlerkarte 3/3 ausbügeln", limit: "3 pro Tag" },
  training_logged: { packs: 1, staub: 10, perDay: 1, onceKey: null, what: "Echtes Training eintragen („Nach dem Training“)", limit: "1 pro Tag" },
  daily_won: { packs: 1, staub: 0, perDay: 1, onceKey: (e) => `daily:${(e as { date: string }).date}`, what: "Tages-Challenge schaffen", limit: "1 pro Tag" },
  boss_first_win: { packs: 1, staub: 0, perDay: null, onceKey: (e) => `boss:${(e as { boss: string }).boss}`, what: "Einen Boss zum ersten Mal besiegen", limit: "einmal je Boss" },
  leglock_badge: { packs: 2, staub: 0, perDay: null, onceKey: () => "leglock", what: "Abzeichen „Beinhebel sicher“ holen", limit: "einmal" },
  draft_run: {
    packs: 1, staub: 0, perDay: 1, onceKey: null, what: "Draft-Lauf mit 3+ Siegen (7 Siege: +5 Staub)", limit: "1 Lauf pro Tag",
    amount: (e) => draftAmount((e as { wins: number }).wins),
  },
  // B82: Beförderung in der Rangliste – ein Paket je Gürtel und Saison. Da der Gürtel nie sinkt, sind das höchstens 4 Pakete insgesamt.
  ladder_belt: {
    packs: 1, staub: 0, perDay: null, onceKey: (e) => { const x = e as { belt: string; season: string }; return `ladder:${x.season}:${x.belt}`; },
    what: "Neuen Gürtel in der Rangliste erreichen (Spielrang)", limit: "je Gürtel einmal pro Saison",
  },
};

/** Reihenfolge in der Tabelle: echtes Training zuerst – Mattenzeit zählt am meisten. */
export const REWARD_ORDER: LearningEventType[] = [
  "training_logged", "program_day", "exam_passed", "review_done", "error_cleared", "daily_won", "draft_run", "ladder_belt", "boss_first_win", "leglock_badge",
];

/** Grund im Hinweis („Für deine Wiederholung“). */
export function rewardReason(e: LearningEvent): string {
  switch (e.type) {
    case "program_day": return `Für Tag ${e.day} im 7-Tage-Start`;
    case "exam_passed": return "Für deine bestandene Prüfung";
    case "review_done": return "Für deine Wiederholung";
    case "error_cleared": return "Für deine ausgebügelte Fehlerkarte";
    case "training_logged": return "Für dein echtes Training";
    case "daily_won": return "Für die Tages-Challenge";
    case "boss_first_win": return `Für deinen ersten Sieg gegen ${e.name ?? "den Boss"}`;
    case "leglock_badge": return "Für dein Abzeichen „Beinhebel sicher“";
    case "draft_run": return `Für deinen Draft-Lauf mit ${e.wins} Siegen`;
    case "ladder_belt": return `Für deinen neuen Gürtel in der Rangliste${e.name ? ` (${e.name}, Spielrang)` : ""}`;
  }
}

/* ---------- Zustand ---------- */

export interface RewardLogEntry { at: string; reason: string; packs: number; staub: number }

export interface RewardState {
  v: 1;
  /** Ungeöffnete Mattenpakete. */
  packs: number;
  /** Mattenstaub. */
  staub: number;
  /** Einmal-Schlüssel, die schon belohnt wurden. */
  claimed: string[];
  /** Zähler des aktuellen Tages (lokales Datum). */
  day: { date: string; counts: Partial<Record<LearningEventType, number>> };
  /** Geöffnete Pakete insgesamt (nur Anzeige). */
  opened: number;
  /** Letzte Belohnungen (höchstens 30). */
  log: RewardLogEntry[];
}

export const emptyRewards = (date = ""): RewardState => ({ v: 1, packs: 0, staub: 0, claimed: [], day: { date, counts: {} }, opened: 0, log: [] });

const nat = (x: unknown, max = 1e6): number => (typeof x === "number" && Number.isFinite(x) ? Math.max(0, Math.min(max, Math.floor(x))) : 0);
const TYPES = Object.keys(REWARDS) as LearningEventType[];

/** Kaputten oder alten Speicher in einen gültigen Zustand bringen. */
export function sanitizeRewards(raw: unknown): RewardState {
  const o = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>;
  const d = (o.day && typeof o.day === "object" ? o.day : {}) as Record<string, unknown>;
  const c = (d.counts && typeof d.counts === "object" ? d.counts : {}) as Record<string, unknown>;
  const counts: Partial<Record<LearningEventType, number>> = {};
  for (const t of TYPES) if (nat(c[t], 99)) counts[t] = nat(c[t], 99);
  const log = Array.isArray(o.log)
    ? o.log.filter((e): e is RewardLogEntry => !!e && typeof e === "object" && typeof (e as RewardLogEntry).reason === "string")
        .map((e) => ({ at: String(e.at ?? ""), reason: e.reason.slice(0, 80), packs: nat(e.packs, 99), staub: nat(e.staub, 9999) })).slice(-30)
    : [];
  return {
    v: 1,
    packs: nat(o.packs, 999),
    staub: nat(o.staub, 99999),
    claimed: Array.isArray(o.claimed) ? [...new Set(o.claimed.filter((x): x is string => typeof x === "string"))].slice(0, 500) : [],
    day: { date: typeof d.date === "string" ? d.date : "", counts },
    opened: nat(o.opened),
    log,
  };
}

export interface Grant { packs: number; staub: number; reason: string }

/**
 * Ereignis anwenden: Tagesgrenze und Einmal-Schlüssel prüfen, dann gutschreiben.
 * Gibt den neuen Zustand und die Gutschrift zurück (null, wenn die Grenze erreicht ist).
 */
export function applyEvent(s: RewardState, e: LearningEvent, today: string): { state: RewardState; grant: Grant | null } {
  const rule = REWARDS[e.type];
  if (!rule) return { state: s, grant: null };
  const day = s.day.date === today ? s.day : { date: today, counts: {} };
  const used = day.counts[e.type] ?? 0;
  if (rule.perDay !== null && used >= rule.perDay) return { state: s, grant: null };
  const key = rule.onceKey ? rule.onceKey(e) : null;
  if (key && s.claimed.includes(key)) return { state: s, grant: null };
  const amt = rule.amount ? rule.amount(e) : { packs: rule.packs, staub: rule.staub };
  if (amt.packs === 0 && amt.staub === 0) return { state: s, grant: null };
  const grant: Grant = { packs: amt.packs, staub: amt.staub, reason: rewardReason(e) };
  const state: RewardState = {
    ...s,
    packs: s.packs + grant.packs,
    staub: s.staub + grant.staub,
    claimed: key ? [...s.claimed, key] : s.claimed,
    day: { date: today, counts: { ...day.counts, [e.type]: used + 1 } },
    log: [...s.log, { at: today, reason: grant.reason, packs: grant.packs, staub: grant.staub }].slice(-30),
  };
  return { state, grant };
}

/** Höchstens so viele Pakete an einem Tag aus wiederholbaren Quellen (ohne Einmal-Meilensteine). */
export function maxDailyRepeatablePacks(): number {
  return TYPES.filter((t) => REWARDS[t].perDay !== null)
    .reduce((n, t) => n + REWARDS[t].packs * (REWARDS[t].perDay ?? 0), 0);
}

/* ---------- B64: Mattenpaket und Chancen ---------- */

export const PACK_SIZE = 3;
/** Chance je Karte im Paket. Summe = 1. Genau diese Werte stehen im Inventar. */
export const ODDS: Record<Rarity, number> = { grundlage: 0.62, technik: 0.3, meister: 0.08 };
const RAR: Rarity[] = ["grundlage", "technik", "meister"];

/** Prozent für die Anzeige, aus denselben Werten wie die Ziehung. */
export const oddsPercent = (r: Rarity): number => Math.round(ODDS[r] * 1000) / 10;
/** Chance auf mindestens eine Meister-Karte pro Paket (ohne Garantie-Effekt). */
export const meisterPerPack = (): number => Math.round((1 - Math.pow(1 - ODDS.meister, PACK_SIZE)) * 100);

export type Rng = () => number;

function rollRarity(rng: Rng, allowed: Rarity[] = RAR): Rarity {
  const total = allowed.reduce((n, r) => n + ODDS[r], 0);
  let x = rng() * total;
  for (const r of allowed) { x -= ODDS[r]; if (x < 0) return r; }
  return allowed[allowed.length - 1];
}
const pick = <T,>(arr: T[], rng: Rng): T => arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];

export interface PoolCard { id: string; rarity: Rarity }
export interface PackCard { id: string; rarity: Rarity; isNew: boolean; staub: number; guaranteed?: boolean }

/** B65: Doppelte Karten werden automatisch zu Staub. */
export const DUP_STAUB: Record<Rarity, number> = { grundlage: 5, technik: 10, meister: 30 };

/**
 * Paket ziehen: 3 Karten, jede mit den Chancen aus ODDS, gleichverteilt innerhalb der Seltenheit.
 * Garantie: Fehlt dir noch mindestens eine Karte und ist keine der drei neu, wird die letzte Karte ersetzt –
 * Seltenheit wieder nach ODDS, aber nur unter Seltenheiten, in denen dir noch etwas fehlt.
 */
export function rollPack(pool: PoolCard[], owned: Iterable<string>, rng: Rng): PackCard[] {
  const have = new Set(owned);
  const byRar = (r: Rarity, list = pool) => list.filter((c) => c.rarity === r);
  const avail = RAR.filter((r) => byRar(r).length > 0);
  if (!avail.length) return [];
  const raw: { c: PoolCard; guaranteed?: boolean }[] = [];
  for (let i = 0; i < PACK_SIZE; i++) raw.push({ c: pick(byRar(rollRarity(rng, avail)), rng) });
  const missing = pool.filter((c) => !have.has(c.id));
  if (missing.length && !raw.some((x) => !have.has(x.c.id))) {
    const mr = RAR.filter((r) => byRar(r, missing).length > 0);
    raw[PACK_SIZE - 1] = { c: pick(byRar(rollRarity(rng, mr), missing), rng), guaranteed: true };
  }
  const seen = new Set<string>();
  return raw.map(({ c, guaranteed }) => {
    const isNew = !have.has(c.id) && !seen.has(c.id);
    seen.add(c.id);
    return { id: c.id, rarity: c.rarity, isNew, staub: isNew ? 0 : DUP_STAUB[c.rarity], ...(guaranteed ? { guaranteed } : {}) };
  });
}

/* ---------- B66: Herstellen ---------- */

export const CRAFT_COST: Record<Rarity, number> = { grundlage: 20, technik: 50, meister: 120 };

export type CraftCheck = { ok: true; cost: number } | { ok: false; why: "owned" | "staub" | "unknown"; cost: number };

/** Nur fehlende Karten lassen sich herstellen. Eigene Einzelkarten werden nie zu Staub gemacht. */
export function canCraft(card: PoolCard | undefined, owned: Iterable<string>, staub: number): CraftCheck {
  if (!card) return { ok: false, why: "unknown", cost: 0 };
  const cost = CRAFT_COST[card.rarity];
  if (new Set(owned).has(card.id)) return { ok: false, why: "owned", cost };
  if (staub < cost) return { ok: false, why: "staub", cost };
  return { ok: true, cost };
}

/** Deterministischer Zufall für Tests (mulberry32). */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
