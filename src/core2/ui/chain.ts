// Bauplan 40: Kampfkette sichtbar – Distanz → Clinch → Takedown → Kontrolle → Aufgabe.
// Reine Ableitung aus Position, Aufgabe-Leisten und der eben aufgedeckten Runde (testbar ohne React).
import type { Pos2, Round2, SubTrack } from "../types";

export type ChainPhase = "distanz" | "clinch" | "takedown" | "kontrolle" | "aufgabe";
export const CHAIN: { id: ChainPhase; label: string }[] = [
  { id: "distanz", label: "Distanz" },
  { id: "clinch", label: "Clinch" },
  { id: "takedown", label: "Takedown" },
  { id: "kontrolle", label: "Kontrolle" },
  { id: "aufgabe", label: "Aufgabe" },
];

const STANDING = new Set<Pos2>(["stand", "clinch", "headlock"]);
const GROUND = new Set<Pos2>(["guard", "half", "side", "mount", "back", "turtle"]);

/**
 * Phase der Kette:
 * - laufende Aufgabe-Leiste (Schritt ≥ 1) → Aufgabe
 * - eben aufgedeckte Runde brachte den Kampf aus Stand/Clinch/Kopfklammer zu Boden → Takedown (Übergang)
 * - Stand → Distanz; Clinch, Front Headlock → Clinch; Guard/Half/Side/Mount/Rücken/Turtle → Kontrolle
 */
export function chainPhase(pos: Pos2, subs: Pick<SubTrack, "step">[], last?: Pick<Round2, "posBefore"> | null): ChainPhase {
  if (subs.some((t) => t.step >= 1)) return "aufgabe";
  if (last && STANDING.has(last.posBefore) && GROUND.has(pos)) return "takedown";
  if (pos === "stand") return "distanz";
  if (pos === "clinch" || pos === "headlock") return "clinch";
  return "kontrolle";
}

/** Wie oft der Kampf schon vom Boden (oder aus der Kopfklammer) zurück in den Stand ging – die Kette beginnt neu. */
export function chainRepeats(history: Pick<Round2, "posBefore">[], pos: Pos2): number {
  const seq = [...history.map((r) => r.posBefore), pos];
  let n = 0;
  for (let i = 1; i < seq.length; i++) if (seq[i] === "stand" && (GROUND.has(seq[i - 1]) || seq[i - 1] === "headlock")) n++;
  return n;
}
