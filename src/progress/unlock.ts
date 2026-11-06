// Zentrales Freischalten (UX-Review 06.11.2026): Was ein Neuling wann sieht.
// Reine Funktionen auf einem kleinen Zustand – leicht zu testen, überall gleich.
import { currentDay, loadProgress, type ProgramProgress } from "../program/store";
import { getShared, type SharedProgress } from "./store";
import { setChoice, type LadderState } from "../core2/ladder/ladder";

/** Die dritte Kern-Lektion („Erst Griff, dann beenden“) – danach ist das Brett vollständig bekannt. */
export const LESSON_3 = "k2-erst-griff-dann-beenden";
/** Die zweite Kern-Lektion („Keile bauen, vorbeigehen“) – nicht im 7-Tage-Start. */
export const LESSON_2 = "k2-keile-vorbeigehen";
/** Kern-Lektionen in Reihenfolge (wie TUTORIALS_K2) mit dem Programm-Tag, ab dem ihre Begriffe bekannt sind. */
export const CORE_LESSONS: readonly { id: string; afterDay: number }[] = [
  { id: "k2-raus-von-unten", afterDay: 1 },
  { id: LESSON_2, afterDay: 3 },     // Stufe 3: Rahmen, Arme – nach Tag 3 bekannt
  { id: LESSON_3, afterDay: 5 },     // Tag 6 im Programm
];
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
  /** Bosse unter „Spielen“: nach Lektion 3 oder Tag 7. */
  bosses: boolean;
  /** Extra-Lektion „Guard ziehen oder Takedown?“: nach Lektion 2 oder Tag 4. */
  extraLesson: boolean;
  /** Rangliste (Spielen-Tab, Start, Kopfzeile): nach Tag 7. */
  rangliste: boolean;
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
    bosses: startDone || lesson3,
    extraLesson: u.lessons.includes(LESSON_2) || u.day > 4,
    rangliste: startDone,
  };
}

/**
 * Kern-Lektion i offen? Erste immer; sonst wenn sie selbst, die davor oder eine spätere geschafft ist
 * (z. B. Lektion 3 im 7-Tage-Start gewonnen, Lektion 2 nie gespielt), oder der Programm-Tag ihre Begriffe schon brachte.
 */
export function lessonOpen(i: number, u: UnlockInput, order: readonly { id: string; afterDay: number }[] = CORE_LESSONS): boolean {
  if (i <= 0) return true;
  const done = (k: number) => !!order[k] && u.lessons.includes(order[k].id);
  if (done(i) || done(i - 1)) return true;
  if (order.slice(i + 1).some((_, k) => done(i + 1 + k))) return true;
  return u.day > order[i].afterDay;
}

/** Rangliste: welche Einstellungen gerade wählbar sind. */
export function ranglisteChoices(un: Unlocks): { plan: boolean; stil: boolean; levels: boolean } {
  return { plan: un.planDraft, stil: un.levels, levels: un.levels };
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

/** Rangliste-Stand an die Freischaltung anpassen: Spielplan-Modus erst nach Lektion 3 + 3 Siegen. */
export function allowedLadder(s: LadderState, plan: boolean): LadderState {
  return !plan && s.mode === "plan" ? setChoice(s, { mode: "stil" }) : s;
}
