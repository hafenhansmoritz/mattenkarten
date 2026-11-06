// Tab „Üben“ (UX-Review 2, Punkt 3): freies Üben mit den Fragen des 7-Tage-Starts statt der alten Klassik-Rätsel.
// Ein Thema ist offen, sobald der Tag geschafft ist, an dem es eingeführt wird. Reine Funktionen, leicht zu testen.
import { mulberry32, shuffle } from "../engine/rng";
import { ALL_QUESTIONS, TOPIC_LABEL, type Question, type Topic } from "./questions";

export const PRACTICE_MAX = 6;

export interface PracticeTopic { topic: Topic; label: string; day: number; count: number; open: boolean }

/** Tag, an dem ein Thema zuerst vorkommt. */
function firstDay(qs: Question[]): number { return Math.min(...qs.map((q) => q.day)); }

/** Themen in Reihenfolge der Tage; `doneDays` = Zahl geschaffter Programm-Tage (0–7). */
export function practiceTopics(doneDays: number, pool: Question[] = ALL_QUESTIONS): PracticeTopic[] {
  const by = new Map<Topic, Question[]>();
  for (const q of pool) by.set(q.topic, [...(by.get(q.topic) ?? []), q]);
  return [...by.entries()]
    .map(([topic, qs]) => {
      const day = firstDay(qs);
      return { topic, label: TOPIC_LABEL[topic], day, count: qs.filter((q) => q.day <= doneDays).length, open: day <= doneDays };
    })
    .sort((a, b) => a.day - b.day || a.label.localeCompare(b.label, "de"));
}

/** Bis zu 6 Fragen eines Themas (oder gemischt, topic = null) – nur aus geschafften Tagen. */
export function practiceIds(topic: Topic | null, doneDays: number, seed = 1, pool: Question[] = ALL_QUESTIONS): string[] {
  const ids = pool.filter((q) => q.day <= doneDays && (topic === null || q.topic === topic)).map((q) => q.id);
  return shuffle(ids, mulberry32(seed || 1)).slice(0, PRACTICE_MAX);
}
