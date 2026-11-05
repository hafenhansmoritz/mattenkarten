// Reise nach der Startwoche – reine Logik (ohne React, ohne localStorage).
// Schritt 11 + 63: Wiederholung mit wachsendem Abstand (1, 2, 4, 7, 14, 30 Tage nach dem ersten Lernen).
// Schritt 12: Fehlerdeck – falsch beantwortete Fragen kommen gemischt zurück,
//             bis sie in 3 getrennten Runden richtig waren.
// Quellen: research_notes/7 Tage Startprogramm/notes.md (Cepeda 2008, Duolingo), KB §8.11.
import { mulberry32, shuffle } from "../engine/rng";

/** Abstände in Tagen ab dem ersten Lernen. */
export const INTERVALS = [1, 2, 4, 7, 14, 30] as const;
export const SESSION_MIN = 5;
export const SESSION_MAX = 8;
/** Höchstens so viele Fehlerkarten pro Runde – der Rest kommt in der nächsten Runde. */
export const ERRORS_PER_SESSION = 3;
/** Richtig in so vielen getrennten Runden → raus aus dem Fehlerdeck. */
export const ERROR_GRADUATE = 3;

/** Eine Frage im Wiederholungsplan. */
export interface ReviewItem {
  /** Lokales Datum (YYYY-MM-DD) des ersten Lernens. */
  learned: string;
  /** Anzahl geschaffter Wiederholungen (0 … INTERVALS.length). */
  stage: number;
  /** Nächster Termin oder null = fertig wiederholt. */
  due: string | null;
}

/** Eine Frage im Fehlerdeck. */
export interface ErrorItem {
  added: string;
  /** Richtig in getrennten Runden seit dem letzten Fehler. */
  streak: number;
  /** Runde, in der zuletzt richtig beantwortet (damit dieselbe Runde nicht doppelt zählt). */
  lastOkSession: string | null;
}

export interface ReviewState {
  items: Record<string, ReviewItem>;
  errors: Record<string, ErrorItem>;
  /** Wie viele Fragen das Fehlerdeck schon verlassen haben (nur zur Freude). */
  graduated: number;
}

export const EMPTY_REVIEW: ReviewState = { items: {}, errors: {}, graduated: 0 };

export interface Answer { id: string; ok: boolean; session: string }

/* ---------- Datum ---------- */

export function localDate(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const isDate = (s: unknown): s is string => typeof s === "string" && DATE_RE.test(s);

function parse(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12); // Mittag: keine Probleme mit Sommerzeit
}
export function addDays(s: string, n: number): string {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return localDate(d);
}
export function daysBetween(a: string, b: string): number {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000);
}
const maxDate = (a: string, b: string) => (a > b ? a : b);

/* ---------- Wiederholungsplan ---------- */

/** Nächster Termin nach `stage` geschafften Wiederholungen – nie heute oder früher. */
export function nextDue(learned: string, stage: number, today: string): string | null {
  if (stage >= INTERVALS.length) return null;
  return maxDate(addDays(learned, INTERVALS[stage]), addDays(today, 1));
}

/**
 * Frage zum ersten Mal gelernt (falls noch nicht im Plan).
 * Erster Termin: 1 Tag nach dem Lernen. Lag das Lernen früher, ist die Frage sofort fällig.
 */
export function learn(s: ReviewState, id: string, day: string): ReviewState {
  if (s.items[id]) return s;
  return { ...s, items: { ...s.items, [id]: { learned: day, stage: 0, due: addDays(day, INTERVALS[0]) } } };
}

export const isDue = (it: ReviewItem | undefined, today: string) => !!it && it.due !== null && it.due <= today;

/**
 * Eine Antwort (erster Versuch) aus irgendeinem Quiz verarbeiten:
 * - unbekannte Frage → in den Plan, erster Termin morgen
 * - fällige Frage richtig → nächste Stufe; falsch → morgen nochmal, Stufe bleibt
 * - falsch → ins Fehlerdeck (Serie auf 0)
 * - im Fehlerdeck richtig in einer neuen Runde → Serie + 1; bei 3 → raus
 */
export function applyAnswer(s: ReviewState, a: Answer, today: string): ReviewState {
  let items = s.items;
  const it = items[a.id];
  if (!it) {
    items = { ...items, [a.id]: { learned: today, stage: 0, due: nextDue(today, 0, today) } };
  } else if (isDue(it, today)) {
    const stage = a.ok ? it.stage + 1 : it.stage;
    const due = a.ok ? nextDue(it.learned, stage, today) : addDays(today, 1);
    items = { ...items, [a.id]: { ...it, stage, due } };
  }

  let errors = s.errors;
  let graduated = s.graduated;
  const e = errors[a.id];
  if (!a.ok) {
    errors = { ...errors, [a.id]: { added: e?.added ?? today, streak: 0, lastOkSession: null } };
  } else if (e && e.lastOkSession !== a.session) {
    const streak = e.streak + 1;
    errors = { ...errors };
    if (streak >= ERROR_GRADUATE) { delete errors[a.id]; graduated++; }
    else errors[a.id] = { ...e, streak, lastOkSession: a.session };
  }
  return { items, errors, graduated };
}

/** Fragen gezielt nach vorn holen (z. B. nach „Nach dem Training“): heute fällig. */
export function boost(s: ReviewState, ids: string[], today: string): ReviewState {
  const items = { ...s.items };
  for (const id of ids) {
    const it = items[id];
    items[id] = it ? { ...it, due: it.due && it.due <= today ? it.due : today } : { learned: today, stage: 0, due: today };
  }
  return { ...s, items };
}

/** Fällige Fragen (nur bekannte IDs), am längsten überfällig zuerst. */
export function dueIds(s: ReviewState, today: string, known?: (id: string) => boolean): string[] {
  return Object.entries(s.items)
    .filter(([id, it]) => isDue(it, today) && (!known || known(id)))
    .sort((a, b) => (a[1].due! < b[1].due! ? -1 : a[1].due! > b[1].due! ? 1 : a[0] < b[0] ? -1 : 1))
    .map(([id]) => id);
}

export function errorIds(s: ReviewState, known?: (id: string) => boolean): string[] {
  return Object.entries(s.errors)
    .filter(([id]) => !known || known(id))
    .sort((a, b) => (a[1].added < b[1].added ? -1 : a[1].added > b[1].added ? 1 : a[0] < b[0] ? -1 : 1))
    .map(([id]) => id);
}

/** Wie viel heute ansteht (für die Karte): fällige Fragen + Fehlerkarten, ohne Doppelte. */
export function todayCount(s: ReviewState, today: string, known?: (id: string) => boolean): { due: number; errors: number; total: number } {
  const d = dueIds(s, today, known);
  const e = errorIds(s, known);
  const set = new Set([...d, ...e]);
  return { due: d.length, errors: e.length, total: set.size };
}

/**
 * Themen mischen (Interleaving): nie zweimal dasselbe Thema hintereinander, solange es geht.
 * Greift immer aus dem größten verbleibenden Thema, das nicht gerade dran war.
 */
export function interleave(ids: string[], topicOf: (id: string) => string): string[] {
  const groups = new Map<string, string[]>();
  for (const id of ids) {
    const t = topicOf(id);
    groups.set(t, [...(groups.get(t) ?? []), id]);
  }
  const out: string[] = [];
  let last: string | null = null;
  while (out.length < ids.length) {
    const cands = [...groups.entries()].filter(([, l]) => l.length > 0);
    const pickFrom = cands.filter(([t]) => t !== last);
    const [t, list] = (pickFrom.length ? pickFrom : cands).sort((a, b) => b[1].length - a[1].length)[0];
    out.push(list.shift()!);
    last = t;
  }
  return out;
}

/**
 * Eine Wiederholungsrunde mit 5–8 Fragen:
 * bis zu 3 Fehlerkarten, dann fällige Fragen (älteste zuerst).
 * Reicht das nicht für 5, kommen weitere Fehlerkarten und die nächsten Termine dazu.
 * Danach Themen gemischt.
 */
export function buildSession(s: ReviewState, today: string, opts: {
  topicOf: (id: string) => string; known?: (id: string) => boolean; seed?: number;
}): string[] {
  const { topicOf, known, seed = 1 } = opts;
  const rng = mulberry32(seed || 1);
  const errs = shuffle(errorIds(s, known), rng);
  const due = dueIds(s, today, known);
  const picked: string[] = [];
  const add = (id: string) => { if (picked.length < SESSION_MAX && !picked.includes(id)) picked.push(id); };
  errs.slice(0, ERRORS_PER_SESSION).forEach(add);
  due.forEach(add);
  if (picked.length < SESSION_MIN) {
    errs.slice(ERRORS_PER_SESSION).forEach((id) => { if (picked.length < SESSION_MIN) add(id); });
    const upcoming = Object.entries(s.items)
      .filter(([id, it]) => it.due !== null && it.due > today && (!known || known(id)))
      .sort((a, b) => (a[1].due! < b[1].due! ? -1 : 1))
      .map(([id]) => id);
    upcoming.forEach((id) => { if (picked.length < SESSION_MIN) add(id); });
  }
  return interleave(picked, topicOf);
}

/** Nächster Termin in der Zukunft (für „Nächste Runde: …“). */
export function nextReviewDate(s: ReviewState, today: string): string | null {
  let best: string | null = null;
  for (const it of Object.values(s.items)) if (it.due && it.due > today && (!best || it.due < best)) best = it.due;
  return best;
}

/** Zustand aus beliebigem JSON reparieren – kaputte Einträge fallen weg. */
export function sanitizeReview(v: unknown): ReviewState {
  if (!v || typeof v !== "object") return { ...EMPTY_REVIEW, items: {}, errors: {} };
  const o = v as Record<string, unknown>;
  const items: Record<string, ReviewItem> = {};
  if (o.items && typeof o.items === "object") {
    for (const [id, raw] of Object.entries(o.items as Record<string, unknown>)) {
      const r = raw as Partial<ReviewItem> | null;
      if (!r || !isDate(r.learned)) continue;
      const stage = Number.isInteger(r.stage) ? Math.max(0, Math.min(INTERVALS.length, r.stage as number)) : 0;
      const due = r.due === null ? null : isDate(r.due) ? r.due : addDays(r.learned, INTERVALS[Math.min(stage, INTERVALS.length - 1)]);
      items[id] = { learned: r.learned, stage, due: stage >= INTERVALS.length ? null : due };
    }
  }
  const errors: Record<string, ErrorItem> = {};
  if (o.errors && typeof o.errors === "object") {
    for (const [id, raw] of Object.entries(o.errors as Record<string, unknown>)) {
      const r = raw as Partial<ErrorItem> | null;
      if (!r || !isDate(r.added)) continue;
      const streak = Number.isInteger(r.streak) ? Math.max(0, Math.min(ERROR_GRADUATE - 1, r.streak as number)) : 0;
      errors[id] = { added: r.added, streak, lastOkSession: typeof r.lastOkSession === "string" ? r.lastOkSession : null };
    }
  }
  const graduated = Number.isInteger(o.graduated) && (o.graduated as number) >= 0 ? (o.graduated as number) : 0;
  return { items, errors, graduated };
}
