// Schritt 58: Partner-Modus „Vorleser“ – ein Handy, einer liest vor, einer übt. Danach tauscht ihr.
// Reine Logik (testbar): aus einem Drill oder Positionsspiel wird ein Ablauf aus großen Lese-Schritten.
import type { Drill } from "../program/days";
import type { TimerConfig } from "../program/timer";
import { DAYS } from "../program/days";
import { WARMUP, WARMUP_TIMER } from "../program/warmup";
import { POS_LABEL } from "../journey/recommend";
import { durationLabel, intensityLabel, type PositionalGame } from "./games";

export type ReaderSource =
  | { kind: "drill"; id: string; title: string; drill: Drill }
  | { kind: "game"; id: string; title: string; game: PositionalGame };

export type ReaderStep =
  | { kind: "read"; pass: 1 | 2; kicker: string; text: string; who?: "a" | "b" | "both" }
  | { kind: "timer"; pass: 1 | 2; kicker: string; config: TimerConfig; cues: string[] }
  | { kind: "swap"; text: string }
  | { kind: "done"; text: string };

/** Alle Drills aus dem 7-Tage-Start (ohne doppelte Titel) plus Aufwärmen. */
export function drillSources(): ReaderSource[] {
  const out: ReaderSource[] = [];
  for (const d of DAYS) {
    if (out.some((s) => s.title === d.drill.title)) continue;
    out.push({ kind: "drill", id: `day-${d.n}`, title: d.drill.title, drill: d.drill });
  }
  out.push({
    kind: "drill", id: "warmup", title: "Aufwärmen No-Gi",
    drill: {
      title: "Aufwärmen No-Gi",
      steps: WARMUP.map((w) => `${w.name}: ${w.cue}`),
      safety: "Langsam starten. Bei Schmerz sofort stoppen.",
      checks: [], mistakes: [], timer: WARMUP_TIMER,
    },
  });
  return out;
}

export function gameSource(g: PositionalGame): ReaderSource {
  return { kind: "game", id: g.id, title: g.title, game: g };
}

function startLine(g: PositionalGame, swapped: boolean): string {
  const [x, y] = swapped ? ["Rot", "Blau"] : ["Blau", "Rot"];
  if (g.top === null) return `Ihr steht euch gegenüber: ${POS_LABEL[g.pos]}. ${x} beginnt, ${y} antwortet.`;
  return `Startlage ${POS_LABEL[g.pos]}: ${x} ist ${g.a.role.toLowerCase()}, ${y} ist ${g.b.role.toLowerCase()}.`;
}

/**
 * Ablauf für den Vorleser. Durchgang 1 → Rollen tauschen → Durchgang 2 → fertig.
 * Drill: einer übt, einer liest; danach umgekehrt. Spiel: Blau und Rot tauschen die Rollen.
 */
export function buildScript(src: ReaderSource): ReaderStep[] {
  const out: ReaderStep[] = [];
  for (const pass of [1, 2] as const) {
    if (src.kind === "drill") {
      const d = src.drill;
      const who = pass === 1 ? "Partner 1 übt, Partner 2 liest vor." : "Jetzt übt Partner 2, Partner 1 liest vor.";
      out.push({ kind: "read", pass, kicker: "Wer macht was?", text: who, who: "both" });
      d.steps.forEach((s, i) => out.push({ kind: "read", pass, kicker: `Schritt ${i + 1} von ${d.steps.length}`, text: s }));
      out.push({ kind: "read", pass, kicker: "Sicherheit", text: d.safety });
      out.push({ kind: "timer", pass, kicker: d.title, config: d.timer, cues: d.checks.slice(0, 3).map((c) => c.text) });
    } else {
      const g = src.game;
      const sw = pass === 2;
      const [ra, rb] = sw ? ["Rot", "Blau"] : ["Blau", "Rot"];
      out.push({ kind: "read", pass, kicker: "Startlage", text: startLine(g, sw), who: "both" });
      out.push({ kind: "read", pass, kicker: `${ra} · ${g.a.role}`, text: g.a.goal, who: sw ? "b" : "a" });
      out.push({ kind: "read", pass, kicker: `${rb} · ${g.b.role}`, text: g.b.goal, who: sw ? "a" : "b" });
      g.rules.forEach((r, i) => out.push({ kind: "read", pass, kicker: `Regel ${i + 1} von ${g.rules.length}`, text: r, who: "both" }));
      out.push({ kind: "read", pass, kicker: `Intensität ${intensityLabel(g)} · ${durationLabel(g)}`, text: g.safety, who: "both" });
      out.push({ kind: "timer", pass, kicker: g.title, config: g.timer, cues: g.cues });
    }
    if (pass === 1) {
      out.push({
        kind: "swap",
        text: src.kind === "drill" ? "Rollen tauschen: Wer geübt hat, nimmt jetzt das Handy." : "Rollen tauschen: Rot beginnt jetzt oben, Blau unten.",
      });
    }
  }
  out.push({ kind: "done", text: "Geschafft. Sagt euch je einen Punkt, der gut geklappt hat." });
  return out;
}
