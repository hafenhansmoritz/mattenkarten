// Schritt 54 + 55: Nach dem Training – Lage → passende Lektion, Themen für die Wiederholung,
// und eine konkrete Frage für den Trainer.
// Lektions-IDs können sich ändern (No-Gi-Umbau). Darum: erst Lektion, sonst Programm-Tag, sonst Landkarte.
import type { Pos2 } from "../core2/types";

export type StuckRole = "top" | "bottom";

export const POSITIONS: Pos2[] = ["stand", "clinch", "headlock", "guard", "half", "turtle", "side", "mount", "back"];
export const ROLES: StuckRole[] = ["top", "bottom"];

export const POS_LABEL: Record<Pos2, string> = {
  stand: "Stand", clinch: "Clinch", headlock: "Kopfklammer", guard: "Guard", half: "Halbe Guard",
  turtle: "Turtle", side: "Seitenkontrolle", mount: "Mount", back: "Rücken",
};

/** Im Stand und Clinch gibt es kein Oben/Unten – dort heißt es angreifen oder verteidigen. */
export function roleLabel(pos: Pos2, role: StuckRole): string {
  if (pos === "stand" || pos === "clinch") return role === "top" ? "Ich greife an" : "Ich verteidige";
  if (pos === "back") return role === "top" ? "Ich bin hinten" : "Er ist hinten";
  return role === "top" ? "Ich oben" : "Ich unten";
}

export interface Recommendation {
  /** Bevorzugte Lektion (Kern 2 oder Programm). */
  lessonId?: string;
  /** Fallback: Tag im 7-Tage-Start (1 = Positions-Landkarte). */
  day: number;
  /** Fragen-Themen für die Wiederholung (Topic-IDs aus questions.ts). */
  topics: string[];
  /** Ein Satz, warum genau das. */
  why: string;
}

/** Jede Lage, jede Rolle → Empfehlung. Inhalte nach KB 3.2, 4.5, Tag-Plan (days.ts). */
export const RECOMMEND: Record<Pos2, Record<StuckRole, Recommendation>> = {
  stand: {
    top: { lessonId: "p-shot-sprawl", day: 5, topics: ["stand"], why: "Erst Distanz und Auslage, dann der Schuss." },
    bottom: { lessonId: "p-shot-sprawl", day: 5, topics: ["stand"], why: "Hüfte zurück, Gewicht drauf: Sprawl gegen den Schuss." },
  },
  clinch: {
    top: { lessonId: "p-shot-sprawl", day: 5, topics: ["stand", "positionen"], why: "Haltung und Hüfte entscheiden auch im Clinch." },
    bottom: { lessonId: "p-shot-sprawl", day: 5, topics: ["stand", "positionen"], why: "Hüfte weg, Haltung halten: so fällst du nicht." },
  },
  headlock: {
    top: { lessonId: "p-shot-sprawl", day: 6, topics: ["stand", "ruecken"], why: "Kinn fassen, Hüfte schwer, dann hinter ihn oder Würger." },
    bottom: { lessonId: "p-shot-sprawl", day: 6, topics: ["stand", "ruecken"], why: "Kopf hoch, Handgelenk kontrollieren, dann raus und aufstehen." },
  },
  guard: {
    top: { lessonId: "p-guard-posture", day: 4, topics: ["guard", "keile"], why: "Erst Haltung, dann Keile bauen und vorbeigehen." },
    bottom: { lessonId: "p-guard-posture", day: 4, topics: ["guard"], why: "Zieh ihn runter, dann greifst du an." },
  },
  half: {
    top: { lessonId: "k2-keile-vorbeigehen", day: 6, topics: ["keile", "side"], why: "Keile bauen, dann das Bein befreien und vorbei." },
    bottom: { lessonId: "p-side-escape", day: 3, topics: ["side", "guard"], why: "Rahmen, Hüfte raus, ganze Guard zurück." },
  },
  turtle: {
    top: { lessonId: "k2-erst-griff-dann-beenden", day: 6, topics: ["positionen", "aufgabe"], why: "Erst Kontrolle, dann der Rücken, dann beenden." },
    bottom: { lessonId: "p-side-escape", day: 3, topics: ["side", "positionen"], why: "Ellbogen eng, Hüfte bewegen, zurück in die Guard." },
  },
  side: {
    top: { lessonId: "k2-erst-griff-dann-beenden", day: 6, topics: ["keile", "aufgabe"], why: "Ruhig halten, aufsteigen, erst dann beenden." },
    bottom: { lessonId: "p-side-escape", day: 3, topics: ["side"], why: "Rahmen zuerst, dann Brücke und Hüfte raus." },
  },
  mount: {
    top: { lessonId: "k2-erst-griff-dann-beenden", day: 6, topics: ["aufgabe", "positionen"], why: "Position vor Aufgabe: erst Griff, dann beenden." },
    bottom: { lessonId: "k2-raus-von-unten", day: 2, topics: ["mount"], why: "Ellbogen an die Knie, dann Brücke und raus." },
  },
  back: {
    top: { lessonId: "k2-erst-griff-dann-beenden", day: 6, topics: ["aufgabe", "positionen"], why: "Erst sichern, dann den Griff aufbauen." },
    bottom: { lessonId: "p-back-protect", day: 6, topics: ["ruecken", "abklopfen"], why: "Hände an den Hals, Hände kämpfen, dann zur Seite raus." },
  },
};

export type LessonTarget = { kind: "k2"; id: string } | { kind: "map" };

/**
 * Empfehlung → tatsächlich vorhandene Lektion.
 * `hasLesson(id)` prüft, ob es die Lektion gibt; `dayLessons(n)` liefert die Lektionen eines Programm-Tags.
 * Fehlt beides, landet man auf der Positions-Landkarte – es gibt also immer ein Ziel.
 */
export function resolveLesson(
  rec: Recommendation,
  hasLesson: (id: string) => boolean,
  dayLessons: (n: number) => { kind: string; id?: string }[] | undefined,
): LessonTarget {
  if (rec.lessonId && hasLesson(rec.lessonId)) return { kind: "k2", id: rec.lessonId };
  const fromDay = (dayLessons(rec.day) ?? []).find((l) => l.kind === "k2" && l.id && hasLesson(l.id));
  if (fromDay?.id) return { kind: "k2", id: fromDay.id };
  return { kind: "map" };
}

/* ---------- Schritt 55: Frage für die nächste Stunde ---------- */
// Kuratiert, du-Form, ≤ 20 Wörter. Ziel: eine konkrete Frage, die der Trainer in 1 Minute zeigen kann.

export const COACH_QUESTIONS: Record<Pos2, Record<StuckRole, string[]>> = {
  stand: {
    top: [
      "Wie weit muss ich weg sein, bevor ich zum Bein schieße?",
      "Wie senke ich die Hüfte, ohne den Kopf zu senken?",
    ],
    bottom: [
      "Wann muss ich sprawlen, und wohin geht mein Gewicht?",
      "Wie halte ich Abstand, ohne dass er meine Beine bekommt?",
    ],
  },
  clinch: {
    top: [
      "Wie bekomme ich den Underhook, ohne dass er mich wegdrückt?",
      "Wie halte ich meine Hüfte nah, ohne nach vorn zu kippen?",
    ],
    bottom: [
      "Wie löse ich seinen Griff am Nacken, ohne mich zu verkrampfen?",
      "Was mache ich, wenn er meinen Rücken im Clinch umklammert?",
    ],
  },
  headlock: {
    top: [
      "Wo liegt meine Brust, damit er seinen Kopf nicht rauszieht?",
      "Wie komme ich hinter ihn, ohne den Kopf loszulassen?",
    ],
    bottom: [
      "Wie bekomme ich meinen Kopf raus, ohne in die Guillotine zu laufen?",
      "Wann stehe ich auf, und wohin zeigt dabei mein Kopf?",
    ],
  },
  guard: {
    top: [
      "Wie halte ich meine Haltung, wenn er mich runterzieht?",
      "Wo setze ich meine Hände, damit er mich nicht kippt?",
      "Wie öffne ich seine geschlossene Guard sicher?",
    ],
    bottom: [
      "Wie ziehe ich ihn runter, wenn er ganz aufrecht sitzt?",
      "Was mache ich, wenn er aufsteht und meine Beine aufdrückt?",
    ],
  },
  half: {
    top: [
      "Wie befreie ich mein Bein, ohne dass er die Guard zurückholt?",
      "Wohin gehört mein Gewicht, wenn ich in der halben Guard oben bin?",
    ],
    bottom: [
      "Wie hole ich den Underhook, bevor er mich flach drückt?",
      "Wie komme ich von hier zurück in die ganze Guard?",
    ],
  },
  turtle: {
    top: [
      "Wie halte ich ihn im Turtle, ohne dass er rausrollt?",
      "Wie setze ich die Haken sicher, ohne ihm den Arm zu geben?",
    ],
    bottom: [
      "Wie schütze ich im Turtle meinen Hals und meine Ellbogen?",
      "Wie komme ich aus dem Turtle zurück in die Guard?",
    ],
  },
  side: {
    top: [
      "Wie halte ich ihn flach, wenn er brückt und shrimpt?",
      "Wann darf ich in den Mount steigen, ohne ihn zu verlieren?",
    ],
    bottom: [
      "Wo genau setze ich meine Unterarme als Rahmen an?",
      "Wie schaffe ich Platz für die Hüfte, wenn er schwer liegt?",
      "Wann brücke ich, und wann shrimpe ich?",
    ],
  },
  mount: {
    top: [
      "Wie bleibe ich oben, wenn er brückt?",
      "Wie isoliere ich einen Arm, ohne meine Position zu verlieren?",
    ],
    bottom: [
      "Wie halte ich die Ellbogen eng, wenn er im Mount hoch rutscht?",
      "Wann brücke ich, und zu welcher Seite?",
      "Wie bekomme ich mein Knie zwischen uns zurück?",
    ],
  },
  back: {
    top: [
      "Wie halte ich den Seatbelt, wenn er sich wegdreht?",
      "Wie verhindere ich, dass er meine Haken abstreift?",
    ],
    bottom: [
      "Wie schütze ich meinen Hals, wenn er hinter mir ist?",
      "Zu welcher Seite drehe ich mich, um rauszukommen?",
    ],
  },
};

/** Eine Frage vorschlagen – rotiert über die Liste, damit nicht immer dieselbe kommt. */
export function suggestQuestion(pos: Pos2, role: StuckRole, n = 0): string {
  const list = COACH_QUESTIONS[pos][role];
  return list[((n % list.length) + list.length) % list.length];
}

export const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
