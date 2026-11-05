// 7-Tage-Startprogramm – Fortschritt (localStorage, robust mit try/catch).
// Gürtelknoten statt Kette: kein Streak, keine Rückstufung, keine Bruch-Meldung.
import { useCallback, useState } from "react";
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
      checklist: Array.isArray(v.checklist) ? v.checklist : [],
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
  return { ...p, done, doneOn: { ...p.doneOn, [n]: p.doneOn[n] ?? today }, drills: { ...p.drills, [n]: p.drills[n] === "done" ? "done" : drill } };
}

export function drillsDone(p: ProgramProgress): number {
  return Object.values(p.drills).filter((d) => d === "done").length;
}

/** React-Hook: Zustand + Speichern. */
export function useProgram() {
  const [p, setP] = useState<ProgramProgress>(loadProgress);
  const update = useCallback((fn: (p: ProgramProgress) => ProgramProgress) => {
    setP((old) => { const n = fn(old); saveProgress(n); return n; });
  }, []);
  return [p, update] as const;
}
