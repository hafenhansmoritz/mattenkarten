// Tag 7: Prüfung – 12 gemischte Fragen, je Bereich 3. Bestehen: ≥ 80 % je Bereich (Schwelle = Hypothese, Recherche 2).
import { mulberry32, shuffle } from "../engine/rng";
import { ALL_QUESTIONS as QUESTIONS, AREA_LABEL, TOPIC_AREA, type Area, type Question } from "./questions";

export const AREAS = Object.keys(AREA_LABEL) as Area[];
export const EXAM_PER_AREA = 3;
export const PASS_RATE = 0.8;

/** 12 Fragen: je Bereich 3 aus verschiedenen Themen, dann gemischt (Interleaving). */
export function buildExam(seed: number): Question[] {
  const rng = mulberry32(seed || 1);
  const picked: Question[] = [];
  for (const area of AREAS) {
    const pool = shuffle(QUESTIONS.filter((q) => TOPIC_AREA[q.topic] === area), rng);
    // Erst je Thema eine, dann auffüllen – so kommen beide Themen eines Bereichs dran.
    const byTopic = new Map<string, Question>();
    for (const q of pool) if (!byTopic.has(q.topic)) byTopic.set(q.topic, q);
    const first = [...byTopic.values()];
    const rest = pool.filter((q) => !first.includes(q));
    picked.push(...[...first, ...rest].slice(0, EXAM_PER_AREA));
  }
  return shuffle(picked, rng);
}

/** Ergebnis je Bereich aus dem ersten Versuch jeder Frage. */
export function scoreExam(first: { id: string; ok: boolean }[]): { areas: Record<Area, [number, number]>; passed: boolean } {
  const areas = Object.fromEntries(AREAS.map((a) => [a, [0, 0]])) as Record<Area, [number, number]>;
  for (const r of first) {
    const q = QUESTIONS.find((x) => x.id === r.id);
    if (!q) continue;
    const a = areas[TOPIC_AREA[q.topic]];
    a[1]++;
    if (r.ok) a[0]++;
  }
  const passed = AREAS.every((a) => areas[a][1] > 0 && areas[a][0] / areas[a][1] >= PASS_RATE);
  return { areas, passed };
}
