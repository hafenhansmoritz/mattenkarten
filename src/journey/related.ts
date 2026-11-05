// Passende Fragen zu einem Hängepunkt auswählen (für die Wiederholung).
import { mulberry32, shuffle } from "../engine/rng";
import type { ReviewState } from "./schedule";

export interface QLike { id: string; topic: string }

/**
 * Bis zu `n` Fragen aus den Themen, abwechselnd je Thema.
 * Bevorzugt: Fragen im Fehlerdeck, dann noch nie gesehene, dann solche mit wenig Wiederholungen.
 */
export function pickRelated(questions: QLike[], topics: string[], s: ReviewState, n = 4, seed = 1): string[] {
  const rng = mulberry32(seed || 1);
  const score = (id: string) => (s.errors[id] ? 0 : !s.items[id] ? 1 : 2 + s.items[id].stage);
  const byTopic = topics.map((t) =>
    shuffle(questions.filter((q) => q.topic === t), rng).sort((a, b) => score(a.id) - score(b.id)).map((q) => q.id));
  const out: string[] = [];
  for (let round = 0; out.length < n && byTopic.some((l) => l.length > round); round++) {
    for (const l of byTopic) if (l[round] && !out.includes(l[round]) && out.length < n) out.push(l[round]);
  }
  return out;
}
