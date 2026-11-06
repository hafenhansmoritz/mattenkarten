// Zentrales Freischalten (UX-Review 06.11.2026): Was ein Neuling wann sieht.
// Reine Funktionen auf einem kleinen Zustand – leicht zu testen, überall gleich.
import { currentDay, loadProgress, type ProgramProgress } from "../program/store";
import { getShared, type SharedProgress } from "./store";

/** Die dritte Kern-Lektion („Erst Griff, dann beenden“) – danach ist das Brett vollständig bekannt. */
export const LESSON_3 = "k2-erst-griff-dann-beenden";
export const WINS_FOR_PLAN = 3;

export interface UnlockInput { day: number; lessons: string[]; wins: number }

export function unlockInput(p: ProgramProgress = loadProgress(), s: SharedProgress = getShared()): UnlockInput {
  return { day: currentDay(p), lessons: s.lessons, wins: s.wins };
}

export interface Unlocks {
  /** 7-Tage-Start ganz geschafft (Tag 7). */
  startDone: boolean;
  /** Lektion 3 gewonnen. */
  lesson3: boolean;
  /** Freies Spiel „Normal“/„Hart“ und Spielstil-Wahl. */
  levels: boolean;
  /** Spielplan-Modus und Draft. */
  planDraft: boolean;
  /** Startseite: Rangliste und Tages-Challenge. */
  startExtras: boolean;
  /** Woche 2: Beinhebel sicher. */
  leglock: boolean;
}

export function unlocks(u: UnlockInput): Unlocks {
  const startDone = u.day > 7;
  const lesson3 = u.lessons.includes(LESSON_3);
  return {
    startDone, lesson3,
    levels: startDone || lesson3,
    planDraft: lesson3 && u.wins >= WINS_FOR_PLAN,
    startExtras: startDone,
    leglock: startDone,
  };
}

/** Kurzer Text, was noch fehlt (für den Teaser „schaltet sich frei nach …“). */
export function planDraftHint(u: UnlockInput): string {
  const need: string[] = [];
  if (!u.lessons.includes(LESSON_3)) need.push("Lektion 3");
  const w = Math.max(0, WINS_FOR_PLAN - u.wins);
  if (w > 0) need.push(w === 1 ? "1 weiteren Sieg" : `${w} weiteren Siegen`);
  return need.length ? `Schaltet sich frei nach ${need.join(" und ")}.` : "";
}

export function currentUnlocks(): Unlocks { return unlocks(unlockInput()); }
