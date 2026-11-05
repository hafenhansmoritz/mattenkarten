// „Wissen“ und „Mattenpraxis“ – zwei getrennte Anzeigen, nie zu einem Wert verrechnet.
// Grund (KB 8.11, research_notes/7 Tage Startprogramm): Viel Video hebt die Selbsteinschätzung ohne Leistungsgewinn;
// die App zeigt deshalb Wissen im Kopf getrennt vom Können auf der Matte.

export interface KnowledgeMeter {
  /** Anteil richtiger erster Antworten (0–1) oder null, wenn noch zu wenige Antworten da sind. */
  rate: number | null;
  /** Anzahl betrachteter Antworten. */
  n: number;
}

/** Ab so vielen Antworten zeigen wir eine Quote. */
export const KNOWLEDGE_MIN = 5;

export function knowledgeMeter(acc: readonly boolean[] | undefined): KnowledgeMeter {
  const a = acc ?? [];
  if (a.length < KNOWLEDGE_MIN) return { rate: null, n: a.length };
  return { rate: a.filter(Boolean).length / a.length, n: a.length };
}

export interface MatMeter {
  drills: number;
  warmups: number;
  trainings: number;
  /** Selbst eingetragene Einheiten insgesamt (jede zählt 1). */
  units: number;
  /** Füllstand 0–1 bis zum Richtwert. */
  frac: number;
}

/** Richtwert für den Balken – eigene Setzung, keine Norm. */
export const MAT_GOAL = 20;

export function matMeter(x: { drills: number; warmups: number; trainings: number }): MatMeter {
  const clean = (n: number) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);
  const drills = clean(x.drills), warmups = clean(x.warmups), trainings = clean(x.trainings);
  const units = drills + warmups + trainings;
  return { drills, warmups, trainings, units, frac: Math.min(1, units / MAT_GOAL) };
}
