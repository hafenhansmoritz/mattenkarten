// Kern 2 – Tages-Challenge: gewertete Versuche pro Datum (lokal). Übungsrunden werden nicht gespeichert.
import { useSyncExternalStore } from "react";

const DAILY_KEY = "mk.k2.daily.v1";
/** Höchstens so viele Tage aufheben. */
const KEEP = 90;

export interface DailyEntry { id: string; won: boolean; rounds: number; pts: [number, number] }
export type DailyLog = Record<string, DailyEntry>;

let log: DailyLog | null = null;
const subs = new Set<() => void>();

function load(): DailyLog {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    const d = raw ? JSON.parse(raw) : {};
    return d && typeof d === "object" && !Array.isArray(d) ? (d as DailyLog) : {};
  } catch {
    return {};
  }
}
const get = (): DailyLog => (log ??= load());

/** Ersten Versuch des Tages speichern. Ein zweiter Aufruf für denselben Tag ändert nichts (ein Versuch pro Tag). */
export function recordDaily(key: string, e: DailyEntry): boolean {
  const cur = get();
  if (cur[key]) return false;
  const keys = [...Object.keys(cur), key].sort().slice(-KEEP);
  const next: DailyLog = Object.fromEntries(keys.map((k) => [k, k === key ? e : cur[k]]));
  log = next;
  try { localStorage.setItem(DAILY_KEY, JSON.stringify(next)); } catch { /* Speichern nicht möglich */ }
  subs.forEach((f) => f());
  return true;
}

export function getDailyLog(): DailyLog { return get(); }
/** Nur für Tests. */
export function _reloadDaily(): void { log = null; }

export function useDailyLog(): DailyLog {
  return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, get, get);
}
