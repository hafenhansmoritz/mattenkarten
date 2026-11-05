// Solo-Drill-Timer – reine Logik (testbar): Runden, Arbeit/Pause, Seitenwechsel.
// Format nach Grapplearts Solo Drills (3 Runden à 1 Minute, 1 Minute Pause; research_notes/7 Tage Startprogramm, Abschnitt 3).

export interface TimerConfig {
  rounds: number;
  /** Arbeitszeit je Runde in Sekunden. */
  work: number;
  /** Pause zwischen den Runden in Sekunden (nach der letzten Runde keine). */
  rest: number;
  /** In der Mitte jeder Arbeitsphase: „Seite wechseln“. */
  switchSides?: boolean;
  /** Optional: Name der Übung je Runde (z. B. Aufwärmen). */
  labels?: string[];
  /** Vorlauf vor der ersten Runde in Sekunden. */
  prep?: number;
}

export type PhaseKind = "prep" | "work" | "rest";

export interface Segment {
  kind: PhaseKind;
  /** Runde 1 … rounds (Vorlauf: 1, Pause: die nächste Runde). */
  round: number;
  /** Dauer in Millisekunden. */
  ms: number;
  label?: string;
}

export function buildPlan(c: TimerConfig): Segment[] {
  const out: Segment[] = [];
  const prep = c.prep ?? 5;
  if (prep > 0) out.push({ kind: "prep", round: 1, ms: prep * 1000, label: c.labels?.[0] });
  for (let r = 1; r <= c.rounds; r++) {
    out.push({ kind: "work", round: r, ms: c.work * 1000, label: c.labels?.[r - 1] });
    if (r < c.rounds && c.rest > 0) out.push({ kind: "rest", round: r + 1, ms: c.rest * 1000, label: c.labels?.[r] });
  }
  return out;
}

export const planMs = (plan: Segment[]) => plan.reduce((s, x) => s + x.ms, 0);

export interface TimerView {
  done: boolean;
  index: number;
  seg: Segment | null;
  /** Verbleibende Millisekunden im aktuellen Abschnitt. */
  left: number;
  /** 0 … 1 Fortschritt im aktuellen Abschnitt. */
  frac: number;
  /** Zweite Hälfte einer Arbeitsphase mit Seitenwechsel. */
  sideB: boolean;
}

/** Zustand nach `elapsed` Millisekunden. */
export function viewAt(plan: Segment[], elapsed: number, switchSides = false): TimerView {
  let t = Math.max(0, elapsed);
  for (let i = 0; i < plan.length; i++) {
    const seg = plan[i];
    if (t < seg.ms) {
      return {
        done: false, index: i, seg, left: seg.ms - t, frac: t / seg.ms,
        sideB: switchSides && seg.kind === "work" && t >= seg.ms / 2,
      };
    }
    t -= seg.ms;
  }
  return { done: true, index: plan.length, seg: null, left: 0, frac: 1, sideB: false };
}

export type Cue = "start" | "rest" | "switch" | "tick" | "done";

/**
 * Welche Signale zwischen zwei Zeitpunkten fällig sind (für Vibration und Ton).
 * start = Arbeitsphase beginnt, rest = Pause beginnt, switch = Seite wechseln,
 * tick = letzte 3 Sekunden vor einer Arbeitsphase, done = fertig.
 */
export function cuesBetween(plan: Segment[], from: number, to: number, switchSides = false): Cue[] {
  if (to <= from) return [];
  const out: Cue[] = [];
  let t0 = 0;
  for (let i = 0; i < plan.length; i++) {
    const seg = plan[i];
    const start = t0;
    const end = t0 + seg.ms;
    const hit = (t: number) => t > from && t <= to;
    if (i > 0 && hit(start)) out.push(seg.kind === "work" ? "start" : "rest");
    if (i === 0 && from < 0 && to >= 0 && seg.kind === "work") out.push("start");
    if (switchSides && seg.kind === "work" && hit(start + seg.ms / 2)) out.push("switch");
    // Countdown vor jeder Arbeitsphase
    if (seg.kind !== "work") for (const s of [3, 2, 1]) if (seg.ms > s * 1000 && hit(end - s * 1000)) out.push("tick");
    t0 = end;
  }
  if (from < t0 && to >= t0) out.push("done");
  return out;
}

export function fmt(ms: number): string {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
