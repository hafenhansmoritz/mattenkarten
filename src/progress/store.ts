// Gemeinsamer Fortschritt (UX-Review 06.11.2026, Punkt 4): Lektionen der Körperkarte zählen überall gleich –
// im 7-Tage-Start wie unter „Spielen“. Dazu die Zahl gewonnener Körperkarte-Kämpfe (fürs Freischalten)
// und einmalige Hinweise der Startseite. Ein Schlüssel: mk.progress.v1. Alt-Schlüssel mk.k2.done wird übernommen.
import { useSyncExternalStore } from "react";
import { loadProgress, type ProgramProgress } from "../program/store";
import { DAYS } from "../program/days";

export const PROGRESS_KEY = "mk.progress.v1";
const OLD_DONE_KEY = "mk.k2.done";

export interface SharedProgress {
  /** Geschaffte (gewonnene) Lektionen der Körperkarte – Hub und Programm gemeinsam. */
  lessons: string[];
  /** Gewonnene Körperkarte-Kämpfe insgesamt (Lektionen, freies Spiel, Bosse, Rangliste …). */
  wins: number;
  /** Einmalige Karten auf der Startseite, die weggeklickt wurden (z. B. „intro“). */
  dismissed: string[];
}

const empty = (): SharedProgress => ({ lessons: [], wins: 0, dismissed: [] });

/** Lektionen der abgeschlossenen Programm-Tage (für die einmalige Übernahme alter Spielstände). */
export function programLessons(p: ProgramProgress): string[] {
  const out: string[] = [];
  for (const d of DAYS) {
    if (!p.done.includes(d.n)) continue;
    for (const l of d.lessons) if (l.kind === "k2") out.push(l.id);
  }
  return out;
}

const uniq = (xs: string[]) => [...new Set(xs)];

/** Alt-Stände zusammenführen: mk.k2.done (Hub) + Lektionen bereits geschaffter Programm-Tage. */
export function migrate(oldDone: unknown, p: ProgramProgress): SharedProgress {
  const hub = Array.isArray(oldDone) ? oldDone.filter((x): x is string => typeof x === "string") : [];
  return { ...empty(), lessons: uniq([...hub, ...programLessons(p)]) };
}

function load(): SharedProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      const v = JSON.parse(raw) as Partial<SharedProgress>;
      return {
        lessons: Array.isArray(v.lessons) ? v.lessons.filter((x): x is string => typeof x === "string") : [],
        wins: typeof v.wins === "number" && v.wins >= 0 ? Math.floor(v.wins) : 0,
        dismissed: Array.isArray(v.dismissed) ? v.dismissed.filter((x): x is string => typeof x === "string") : [],
      };
    }
    let old: unknown = null;
    try { old = JSON.parse(localStorage.getItem(OLD_DONE_KEY) ?? "null"); } catch { old = null; }
    const m = migrate(old, loadProgress());
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(m));
      localStorage.removeItem(OLD_DONE_KEY);
    } catch { /* privat/voll – egal */ }
    return m;
  } catch {
    return empty();
  }
}

let data: SharedProgress | null = null;
const subs = new Set<() => void>();
const get = (): SharedProgress => (data ??= load());

function save(next: SharedProgress) {
  data = next;
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(next)); } catch { /* Spiel läuft trotzdem */ }
  subs.forEach((f) => f());
}

export function getShared(): SharedProgress { return get(); }
export function lessonsDone(): string[] { return get().lessons; }
export function isLessonDone(id: string): boolean { return get().lessons.includes(id); }

/** Lektion geschafft – egal ob im Programm oder unter „Spielen“. */
export function markLessonDone(id: string): void {
  const cur = get();
  if (cur.lessons.includes(id)) return;
  save({ ...cur, lessons: [...cur.lessons, id] });
}

/** Ein Körperkarte-Kampf ist zu Ende (aus ArenaK2). Gewonnene Lektion zählt gleich mit. */
export function recordK2Result(won: boolean, tutorialId?: string): void {
  if (!won) return;
  const cur = get();
  const lessons = tutorialId && !cur.lessons.includes(tutorialId) ? [...cur.lessons, tutorialId] : cur.lessons;
  save({ ...cur, wins: cur.wins + 1, lessons });
}

export function isDismissed(id: string): boolean { return get().dismissed.includes(id); }
export function dismiss(id: string): void {
  const cur = get();
  if (cur.dismissed.includes(id)) return;
  save({ ...cur, dismissed: [...cur.dismissed, id] });
}

/** Nur für Tests: Speicher neu einlesen. */
export function _reloadShared(): void { data = null; subs.forEach((f) => f()); }

export function useShared(): SharedProgress {
  return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, get, get);
}
