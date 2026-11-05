// Aufwärm-Routine No-Gi, etwa 5 Minuten: fünf Solo-Übungen à 45 s, 15 s Pause.
// Übungen und Hinweise: research_notes/7 Tage Startprogramm/notes.md, Abschnitt 3 und KB 8.11
// (Grapplearts Solo Drills [Marketing], JitsuIQ Technical Stand-up, Evolve MMA Breakfalls [Marketing-nah]).
// check: true = eigene Ableitung → Trainer prüfen.
import type { TimerConfig } from "./timer";

export interface WarmupMove {
  id: string;
  name: string;
  /** Ein Satz: so geht's. */
  cue: string;
  /** Ein Satz: Sicherheit. */
  safety: string;
  src: string;
  check?: boolean;
}

export const WARMUP: WarmupMove[] = [
  {
    id: "bruecke", name: "Brücke",
    cue: "Auf dem Rücken, Füße nah am Po: Hüfte hoch, kurz halten, langsam ab.",
    safety: "Gewicht auf Schultern und Füßen, nie auf dem Nacken.",
    src: "Grapplearts Solo Drills; Recherche 3 (Inferences)",
  },
  {
    id: "shrimp", name: "Shrimp",
    cue: "Mit einem Fuß abdrücken, Hüfte zur Seite schieben, Seiten abwechseln.",
    safety: "Ruhig bleiben und beim Bewegen ausatmen.",
    src: "Grapplearts Solo Drills; KB 4.5 (Frame → Bridge → Shrimp); BJJ More (ausatmen)",
  },
  {
    id: "sprawl", name: "Sprawl",
    cue: "Aus dem Stand: Hände runter, Beine weit nach hinten, Hüfte zur Matte, aufstehen.",
    safety: "Weicher Untergrund, Knie nicht auf den Boden knallen lassen.",
    src: "Grapplearts Solo Drills; Recherche 3 (Inferences: Knie und Untergrund beachten)",
  },
  {
    id: "standup", name: "Technical Stand-up",
    cue: "Sitzend: Hand hinten stützt, Hand vorn schützt, Bein weit durchziehen, aufstehen.",
    safety: "Langsam und kontrolliert, beide Seiten – nicht hastig.",
    src: "JitsuIQ Technical Stand-up",
  },
  {
    id: "fallen", name: "Fallen aus dem Sitz",
    cue: "Im Sitz: Kinn zur Brust, nach hinten abrollen, Arme schlagen auf.",
    safety: "Nur aus dem Sitz, nie aus dem Stand. Der Kopf berührt die Matte nicht.",
    src: "Evolve MMA Breakfalls; Grapplearts (Kopf nie am Boden)",
  },
];

export const WARMUP_TIMER: TimerConfig = {
  rounds: WARMUP.length, work: 45, rest: 15, prep: 5,
  labels: WARMUP.map((m) => m.name),
};

/* ---------- Zähler (für „Mattenpraxis“, nur auf diesem Gerät) ---------- */

export const WARMUP_KEY = "mk.warmup.v1";

export interface WarmupLog { v: 1; done: string[] }

export function loadWarmups(): WarmupLog {
  try {
    const raw = localStorage.getItem(WARMUP_KEY);
    if (!raw) return { v: 1, done: [] };
    const o = JSON.parse(raw) as Partial<WarmupLog>;
    const done = Array.isArray(o.done) ? o.done.filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) : [];
    return { v: 1, done: done.slice(-365) };
  } catch {
    return { v: 1, done: [] };
  }
}

export function addWarmup(day: string): WarmupLog {
  const cur = loadWarmups();
  const next: WarmupLog = { v: 1, done: [...cur.done, day].slice(-365) };
  try { localStorage.setItem(WARMUP_KEY, JSON.stringify(next)); } catch { /* privat oder voll */ }
  return next;
}
