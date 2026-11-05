// Tagesrätsel-Fortschritt (lokal im Browser, eigener Schlüssel).
import { create } from "zustand";
import { PUZZLE, dateKey, dayNumber } from "./data/puzzles";

export const PUZZLE_KEY = "mattenkarten-puzzles-v1";
export const MAX_FREEZES = 2;
/** Alle so viele Streak-Tage gibt es einen Freeze zurück (bis MAX_FREEZES). */
export const FREEZE_EVERY = 7;

export interface PuzzleProgress {
  solved: string[];            // Rätsel-IDs, die mindestens einmal richtig gelöst wurden
  streak: number;              // aktuelle Tagesserie
  bestStreak: number;
  freezes: number;             // 0..MAX_FREEZES – überbrücken je einen verpassten Tag
  lastPlayed: string | null;   // "YYYY-MM-DD" des letzten abgeschlossenen Tagesrätsels
  /** Antworten des laufenden Tages: Datum + Rätsel-ID → richtig? */
  today: { date: string; answers: Record<string, boolean> } | null;
  stats: {
    attempts: number;          // alle beantworteten Rätsel (Tag + Üben)
    correct: number;
    daysCompleted: number;
    perfectDays: number;       // 3/3 richtig
    byConcept: Record<string, { attempts: number; correct: number }>;
  };
}

const fresh = (): PuzzleProgress => ({
  solved: [], streak: 0, bestStreak: 0, freezes: MAX_FREEZES, lastPlayed: null, today: null,
  stats: { attempts: 0, correct: 0, daysCompleted: 0, perfectDays: 0, byConcept: {} },
});

function load(): PuzzleProgress {
  try {
    const raw = localStorage.getItem(PUZZLE_KEY);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw) as Partial<PuzzleProgress>;
    const base = fresh();
    const p: PuzzleProgress = { ...base, ...parsed, stats: { ...base.stats, ...(parsed.stats ?? {}) } };
    p.solved = (p.solved ?? []).filter((id) => PUZZLE[id]);
    p.freezes = Math.max(0, Math.min(MAX_FREEZES, p.freezes | 0));
    return p;
  } catch {
    return fresh();
  }
}

function save(p: PuzzleProgress) {
  try {
    localStorage.setItem(PUZZLE_KEY, JSON.stringify(p));
  } catch { /* Speichern nicht möglich – Rätsel laufen trotzdem */ }
}

/** Reiner Streak-Schritt (testbar): was passiert, wenn am Tag `day` das Tagesrätsel fertig ist. */
export function advanceStreak(
  p: Pick<PuzzleProgress, "streak" | "bestStreak" | "freezes" | "lastPlayed">, day: string,
): { streak: number; bestStreak: number; freezes: number; lastPlayed: string; usedFreezes: number; extended: boolean } {
  if (p.lastPlayed === day) return { ...p, lastPlayed: day, usedFreezes: 0, extended: false };
  let streak = p.streak;
  let freezes = p.freezes;
  let usedFreezes = 0;
  if (p.lastPlayed === null) streak = 0;
  else {
    const gap = dayNumber(day) - dayNumber(p.lastPlayed); // 1 = gestern gespielt
    const missed = gap - 1;
    if (gap <= 0) streak = p.streak;                  // Uhr zurückgedreht – nichts kaputt machen
    else if (missed > 0 && missed <= freezes) { freezes -= missed; usedFreezes = missed; }
    else if (missed > 0) streak = 0;
  }
  streak += 1;
  if (streak % FREEZE_EVERY === 0 && freezes < MAX_FREEZES) freezes += 1;
  return { streak, bestStreak: Math.max(p.bestStreak, streak), freezes, lastPlayed: day, usedFreezes, extended: true };
}

/** Gilt die Serie (aus Sicht von heute) noch? Sonst zeigt die UI 0. */
export function liveStreak(p: Pick<PuzzleProgress, "streak" | "freezes" | "lastPlayed">, day: string): number {
  if (!p.lastPlayed) return 0;
  const missed = dayNumber(day) - dayNumber(p.lastPlayed) - 1;
  return missed <= p.freezes ? p.streak : 0;
}

interface PuzzleStore extends PuzzleProgress {
  /** Eine Antwort verbuchen. `daily` = gehört zum Tagesrätsel von `day`. */
  record: (puzzleId: string, correct: boolean, daily?: { day: string }) => void;
  /** Tagesrätsel abschließen → Streak. Gibt das Ergebnis zurück (idempotent pro Tag). */
  completeDay: (day: string, correctCount: number) => ReturnType<typeof advanceStreak>;
  reset: () => void;
}

export const usePuzzles = create<PuzzleStore>((set, get) => {
  const commit = (patch: Partial<PuzzleProgress>) => {
    set(patch);
    const { record: _r, completeDay: _c, reset: _x, ...data } = get();
    save(data);
  };
  return {
    ...load(),
    record: (puzzleId, correct, daily) => {
      const s = get();
      const concept = PUZZLE[puzzleId]?.concept ?? "?";
      const prevAnswers = daily && s.today?.date === daily.day ? s.today.answers : {};
      if (daily && puzzleId in prevAnswers) return; // Tagesrätsel zählt nur der erste Versuch
      const bc = s.stats.byConcept[concept] ?? { attempts: 0, correct: 0 };
      commit({
        solved: correct && !s.solved.includes(puzzleId) ? [...s.solved, puzzleId] : s.solved,
        today: daily ? { date: daily.day, answers: { ...prevAnswers, [puzzleId]: correct } } : s.today,
        stats: {
          ...s.stats,
          attempts: s.stats.attempts + 1,
          correct: s.stats.correct + (correct ? 1 : 0),
          byConcept: { ...s.stats.byConcept, [concept]: { attempts: bc.attempts + 1, correct: bc.correct + (correct ? 1 : 0) } },
        },
      });
    },
    completeDay: (day, correctCount) => {
      const s = get();
      const r = advanceStreak(s, day);
      if (!r.extended) return r;
      commit({
        streak: r.streak, bestStreak: r.bestStreak, freezes: r.freezes, lastPlayed: r.lastPlayed,
        stats: {
          ...s.stats,
          daysCompleted: s.stats.daysCompleted + 1,
          perfectDays: s.stats.perfectDays + (correctCount >= 3 ? 1 : 0),
        },
      });
      return r;
    },
    reset: () => commit(fresh()),
  };
});

export { dateKey };
