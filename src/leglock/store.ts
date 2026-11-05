// Woche 2: Beinhebel sicher – Freischaltung und Fortschritt.
// Liest den 7-Tage-Start nur lesend (loadProgress); eigener Schlüssel mk.leglock.v1.
import { useCallback, useState } from "react";
import { loadProgress, type ProgramProgress } from "../program/store";
import { AREAS, LESSONS, type Area, type LessonId } from "./content";

export interface LeglockCheck { areas: Record<Area, [ok: number, total: number]>; passed: boolean; at: string }
export interface LeglockProgress { done: LessonId[]; check?: LeglockCheck }

const KEY = "mk.leglock.v1";
export const PASS_RATE = 0.8;

const IDS = new Set<string>(LESSONS.map((l) => l.id));

export function loadLeglock(): LeglockProgress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { done: [] };
    const v = JSON.parse(raw) as Partial<LeglockProgress>;
    return {
      done: Array.isArray(v.done) ? (v.done.filter((x) => IDS.has(x)) as LessonId[]) : [],
      check: v.check && typeof v.check.passed === "boolean" ? v.check : undefined,
    };
  } catch {
    return { done: [] };
  }
}

export function saveLeglock(p: LeglockProgress) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* privat/voll – egal */ }
}

/** Woche 2 ist frei, sobald Tag 7 des 7-Tage-Starts geschafft ist. */
export function isLeglockUnlocked(p: ProgramProgress = loadProgress()): boolean {
  return p.done.includes(7);
}

/** Lektionen der Reihe nach: erst Regeln, dann Verteidigung, dann Fußhebel, dann Abklopfen. */
export function lessonOpen(s: LeglockProgress, id: LessonId): boolean {
  const i = LESSONS.findIndex((l) => l.id === id);
  return i === 0 || s.done.includes(LESSONS[i - 1].id);
}

export function checkOpen(s: LeglockProgress): boolean {
  return LESSONS.every((l) => s.done.includes(l.id));
}

export function completeLesson(s: LeglockProgress, id: LessonId): LeglockProgress {
  return s.done.includes(id) ? s : { ...s, done: [...s.done, id] };
}

/** Bewertung der Abschlussprüfung: jeder Bereich ≥ 80 % (erster Versuch je Frage). */
export function scoreCheck(results: { id: string; ok: boolean }[], areaOf: (id: string) => Area | undefined, at = new Date().toISOString()): LeglockCheck {
  const areas = Object.fromEntries(AREAS.map((a) => [a, [0, 0]])) as Record<Area, [number, number]>;
  for (const r of results) {
    const a = areaOf(r.id);
    if (!a) continue;
    areas[a][1]++;
    if (r.ok) areas[a][0]++;
  }
  const passed = AREAS.every((a) => areas[a][1] > 0 && areas[a][0] / areas[a][1] >= PASS_RATE);
  return { areas, passed, at };
}

/** Bestes Ergebnis behalten: ein bestandener Check wird nicht überschrieben. */
export function recordCheck(s: LeglockProgress, c: LeglockCheck): LeglockProgress {
  if (s.check?.passed && !c.passed) return s;
  return { ...s, check: c };
}

export function useLeglock() {
  const [s, setS] = useState<LeglockProgress>(loadLeglock);
  const update = useCallback((fn: (s: LeglockProgress) => LeglockProgress) => {
    setS((old) => { const n = fn(old); saveLeglock(n); return n; });
  }, []);
  return [s, update] as const;
}

/** Eintrag im Menü „Mehr“. */
export function leglockMenu(p: ProgramProgress = loadProgress()): { title: string; text: string; locked: boolean } {
  const locked = !isLeglockUnlocked(p);
  return {
    title: locked ? "Woche 2: Beinhebel sicher · gesperrt" : "Woche 2: Beinhebel sicher",
    text: locked
      ? "Schalte erst Tag 7 im 7-Tage-Start frei. Dann: Regeln, Verteidigung, früh abklopfen."
      : "4 kurze Lektionen: Regeln, Verteidigung, Fußhebel erkennen, früh abklopfen. Ohne Angriffskarten.",
    locked,
  };
}
