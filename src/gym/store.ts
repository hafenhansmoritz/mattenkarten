// Schritt 60: Wochenthema deines Gyms – lokal gespeichert (mk.gym.v1, siehe Datenschutzerklärung).
// Gespeichert werden nur Positionen, Spiel-IDs, Datum des Themas und wann du es übernommen hast.
import { useEffect, useState } from "react";
import type { Pos2 } from "../core2/types";
import { TUTORIALS_K2 } from "../core2/data/tutorials";
import { LESSONS_PROGRAM } from "../program/lessons";
import { ALL_QUESTIONS } from "../program/questions";
import { POS_LABEL, RECOMMEND } from "../journey/recommend";
import { GAME_BY_ID, GAMES, type PositionalGame } from "./games";
import { GYM_POS_ORDER, type GymTheme } from "./gymCode";

export const GYM_KEY = "mk.gym.v1";
const EVENT = "mk-gym-change";

export interface StoredGym extends GymTheme {
  v: 1;
  code: string;
  /** Wann du das Thema übernommen hast (YYYY-MM-DD). */
  savedOn: string;
}

function valid(x: unknown): x is StoredGym {
  if (!x || typeof x !== "object") return false;
  const o = x as Partial<StoredGym>;
  return o.v === 1 && typeof o.code === "string" && typeof o.date === "string" && Array.isArray(o.positions)
    && o.positions.length > 0 && o.positions.every((p) => GYM_POS_ORDER.includes(p as Pos2)) && Array.isArray(o.games);
}

export function loadGym(): StoredGym | null {
  try {
    const raw = localStorage.getItem(GYM_KEY);
    if (!raw) return null;
    const x = JSON.parse(raw);
    if (!valid(x)) return null;
    return { ...x, games: x.games.filter((id) => !!GAME_BY_ID[id]) };
  } catch {
    return null;
  }
}

export function saveGym(t: GymTheme, code: string, today: string): StoredGym {
  const s: StoredGym = { v: 1, code, positions: t.positions, games: t.games, date: t.date, savedOn: today };
  try { localStorage.setItem(GYM_KEY, JSON.stringify(s)); } catch { /* privater Modus: nur für diese Sitzung */ }
  try { window.dispatchEvent(new Event(EVENT)); } catch { /* ohne Fenster (Test) */ }
  return s;
}

export function clearGym() {
  try { localStorage.removeItem(GYM_KEY); } catch { /* egal */ }
  try { window.dispatchEvent(new Event(EVENT)); } catch { /* egal */ }
}

export function useGym(): StoredGym | null {
  const [g, setG] = useState(loadGym);
  useEffect(() => {
    const on = () => setG(loadGym());
    window.addEventListener(EVENT, on);
    window.addEventListener("storage", on);
    return () => { window.removeEventListener(EVENT, on); window.removeEventListener("storage", on); };
  }, []);
  return g;
}

/* ---------- Was empfiehlt die App zum Wochenthema? ---------- */

export function themeTitle(positions: Pos2[]): string {
  const names = positions.map((p) => POS_LABEL[p]);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} und ${names[names.length - 1]}`;
}

/** Älter als 13 Tage → „Frag nach dem neuen Thema“. */
export function isStale(date: string, today: string): boolean {
  const a = Date.parse(date + "T12:00:00Z");
  const b = Date.parse(today + "T12:00:00Z");
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return b - a > 13 * 86_400_000;
}

const LESSONS = [...TUTORIALS_K2, ...LESSONS_PROGRAM];
export const lessonDef = (id: string) => LESSONS.find((l) => l.id === id);

export interface WeekPlan {
  title: string;
  lessons: string[];
  questions: string[];
  games: PositionalGame[];
}

/**
 * Wochenthema → passende Lektionen (unten zuerst: Befreien vor Angreifen, KB 2.4),
 * Wiederholungsfragen zu den Themen und Positionsspiele.
 */
export function weekPlan(t: Pick<GymTheme, "positions" | "games">, maxQuestions = 8): WeekPlan {
  const lessons: string[] = [];
  const topics: string[] = [];
  for (const p of t.positions) {
    for (const role of ["bottom", "top"] as const) {
      const r = RECOMMEND[p]?.[role];
      if (!r) continue;
      if (r.lessonId && lessonDef(r.lessonId) && !lessons.includes(r.lessonId)) lessons.push(r.lessonId);
      for (const tp of r.topics) if (!topics.includes(tp)) topics.push(tp);
    }
  }
  // Fragen: reihum je Thema, damit jedes Thema vorkommt.
  const pools = topics.map((tp) => ALL_QUESTIONS.filter((q) => q.topic === tp && q.kind !== "erklaeren").map((q) => q.id));
  const questions: string[] = [];
  for (let i = 0; questions.length < maxQuestions && pools.some((pl) => pl.length > i); i++) {
    for (const pl of pools) {
      const id = pl[i];
      if (id && !questions.includes(id) && questions.length < maxQuestions) questions.push(id);
    }
  }
  const chosen = t.games.map((id) => GAME_BY_ID[id]).filter(Boolean);
  const games = chosen.length ? chosen : GAMES.filter((g) => t.positions.includes(g.pos));
  return { title: themeTitle(t.positions), lessons, questions, games };
}
