// 7-Tage-Startprogramm – Fortschritt (localStorage, robust mit try/catch).
// Gürtelknoten statt Kette: kein Streak, keine Rückstufung, keine Bruch-Meldung.
import { useSyncExternalStore } from "react";
import type { Area } from "./questions";

export interface ExamResult { areas: Record<Area, [ok: number, total: number]>; passed: boolean; at: string }

export interface ProgramProgress {
  /** Abgeschlossene Tage (1–7). */
  done: number[];
  /** Lokales Datum (YYYY-MM-DD), an dem ein Tag abgeschlossen wurde. */
  doneOn: Record<number, string>;
  /** Matten-Drill: gemacht oder später. */
  drills: Record<number, "done" | "later">;
  exam?: ExamResult;
  boss?: "won" | "lost" | "skipped";
  checklist: string[];
  /**
   * Angefangener Tag (UX-Review 2, Punkt 8): Schritt-Name und Lektion im Tag, damit ein Neuladen dort weitermacht.
   * Fehlt in alten Ständen – dann beginnt der Tag vorn. Wird beim Abschluss des Tages gelöscht.
   */
  resume?: DayResume;
}

export type ResumeStep = "warmup" | "concept" | "lesson" | "puzzle" | "drill" | "exam" | "boss";
export interface DayResume { day: number; step: ResumeStep; lesson: number }
/** Name eines gemerkten Schritts für „Weiter bei …“ (Schritt 1 heißt „Erinnern“ – Abruf früherer Tage). */
export const RESUME_LABEL: Record<ResumeStep, string> = {
  warmup: "Erinnern", concept: "Lektion", lesson: "Lektion", puzzle: "Rätsel", drill: "Matten-Drill", exam: "Prüfung", boss: "Boss-Match",
};
const RESUME_STEPS: readonly ResumeStep[] = ["warmup", "concept", "lesson", "puzzle", "drill", "exam", "boss"];

/** Gespeicherten Wiederaufnahme-Punkt prüfen (kaputte oder fremde Werte → keiner). */
export function sanitizeResume(v: unknown): DayResume | undefined {
  if (!v || typeof v !== "object") return undefined;
  const r = v as Partial<DayResume>;
  if (!Number.isInteger(r.day) || r.day! < 1 || r.day! > 7) return undefined;
  if (!RESUME_STEPS.includes(r.step as ResumeStep)) return undefined;
  const lesson = Number.isInteger(r.lesson) && r.lesson! >= 0 && r.lesson! < 10 ? r.lesson! : 0;
  return { day: r.day!, step: r.step as ResumeStep, lesson };
}

const KEY = "mk.program.v1";

export const EMPTY: ProgramProgress = { done: [], doneOn: {}, drills: {}, checklist: [] };

export function localDate(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function loadProgress(): ProgramProgress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const v = JSON.parse(raw) as Partial<ProgramProgress>;
    return {
      done: Array.isArray(v.done) ? v.done.filter((n) => Number.isInteger(n) && n >= 1 && n <= 7) : [],
      doneOn: v.doneOn ?? {},
      drills: v.drills ?? {},
      exam: v.exam,
      boss: v.boss,
      checklist: Array.isArray(v.checklist) ? v.checklist.filter((x): x is string => typeof x === "string") : [],
      ...(sanitizeResume(v.resume) ? { resume: sanitizeResume(v.resume) } : {}),
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveProgress(p: ProgramProgress) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* privat/voll – egal */ }
}

/** Nächster offener Tag (1–7), oder 8 wenn alles geschafft. Tage schalten der Reihe nach frei. */
export function currentDay(p: ProgramProgress): number {
  for (let n = 1; n <= 7; n++) if (!p.done.includes(n)) return n;
  return 8;
}

export type KnotState = "done" | "now" | "locked";
export function knotState(p: ProgramProgress, n: number): KnotState {
  if (p.done.includes(n)) return "done";
  return n === currentDay(p) ? "now" : "locked";
}

/** Hinweis „Morgen behältst du mehr“: Der Vortag wurde heute abgeschlossen. */
export function sameDayHint(p: ProgramProgress, n: number, today = localDate()): boolean {
  return n > 1 && p.doneOn[n - 1] === today;
}

export function completeDay(p: ProgramProgress, n: number, drill: "done" | "later", today = localDate()): ProgramProgress {
  const done = p.done.includes(n) ? p.done : [...p.done, n].sort((a, b) => a - b);
  const rest: ProgramProgress = { ...p };
  if (rest.resume?.day === n) delete rest.resume;
  return { ...rest, done, doneOn: { ...p.doneOn, [n]: p.doneOn[n] ?? today }, drills: { ...p.drills, [n]: p.drills[n] === "done" ? "done" : drill } };
}

/** Schritt im angefangenen Tag merken (null = Tag verlassen ohne Fortschritt → vergessen). */
export function setResume(p: ProgramProgress, r: DayResume | null): ProgramProgress {
  const rest: ProgramProgress = { ...p };
  delete rest.resume;
  return r ? { ...rest, resume: r } : rest;
}

/** Wiederaufnahme-Punkt für Tag n (nur, wenn er zu diesem Tag gehört). */
export function resumeFor(p: ProgramProgress, n: number): DayResume | null {
  return p.resume && p.resume.day === n ? p.resume : null;
}

export function drillsDone(p: ProgramProgress): number {
  return Object.values(p.drills).filter((d) => d === "done").length;
}

/* ---------- Ein gemeinsamer Zustand für alle Bildschirme ----------
 * Früher hielt jeder Bildschirm eine eigene Kopie (useState) – eine ältere Kopie konnte neuere Haken
 * (Checkliste) überschreiben. Jetzt lesen Start, Programm und Kopfzeile denselben Stand. */
let cache: ProgramProgress | null = null;
const subs = new Set<() => void>();
const getP = (): ProgramProgress => (cache ??= loadProgress());

/** Zustand ändern und sofort speichern. */
export function updateProgram(fn: (p: ProgramProgress) => ProgramProgress): void {
  const n = fn(getP());
  if (n === cache) return;
  cache = n;
  saveProgress(n);
  subs.forEach((f) => f());
}

/** Nur für Tests: Speicher neu einlesen. */
export function _reloadProgram(): void { cache = null; subs.forEach((f) => f()); }

/** React-Hook: Zustand + Speichern (alle Aufrufer teilen sich einen Stand). */
export function useProgram() {
  const p = useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, getP, getP);
  return [p, updateProgram] as const;
}

/** Aktueller Stand ohne React (z. B. Kopfzeile). */
export function getProgram(): ProgramProgress { return getP(); }
