// Deutsche Texte für Headlines und Lernsätze (Engine-intern, unabhängig von der UI).
import type { CardDef, Tag } from "./types";

export const TAG_DE: Record<Tag, string> = {
  strike: "Schläge", shot: "Beinangriffe (Shots)", single: "Single Leg", legs: "Beingriffe",
  clinch: "Clinch-Eintritte", snap: "Snap Downs", drag: "Arm Drags", bodylock: "Body Locks",
  hip: "Hüftwürfe", reap: "Sichelwürfe", escape: "Escapes", bridge: "Bridges", sweep: "Sweeps",
  pass: "Guard Passes", advance: "Aufstiege", choke: "Würger", armlock: "Armhebel",
  shoulderlock: "Schulterhebel", trianglechoke: "Triangles", behind: "Go-Behinds",
};

export function tagsDe(tags: Tag[] | undefined): string {
  const list = (tags ?? []).map((t) => TAG_DE[t]);
  if (list.length <= 1) return list.join("");
  return list.slice(0, -1).join(", ") + " und " + list[list.length - 1];
}

export const nm = (c: CardDef) => c.name;

export const LESSON = {
  angriffSetup: "Angriff schlägt Setup: Wer sich nur vorbereitet, wird erwischt.",
  setupReaktion: "Setup schlägt Reaktion: Die Finte lockt den Konter heraus – wer zu früh reagiert, verliert Gas.",
  reaktionAngriff: "Reaktion schlägt Angriff – aber nur, wenn sie zur Angriffsfamilie passt.",
  scramble: "Gleiches Tempo: Beide verlieren Gas, keiner gewinnt Position.",
  beideSetup: "Setup gegen Setup: Beide bauen Griffe und Kontrolle auf.",
  patt: "Reaktion gegen Reaktion: Wer nur wartet, erholt sich – kommt aber nicht weiter.",
  subDefended: "Wer zur Submission wechselt, riskiert die Kontrolle (Danaher): Gekontert fällt sie auf 0.",
  dilemma: "Danaher: Greif in Paaren an – wer das eine verteidigt, läuft ins andere.",
  subWin: (ctrl: number) => `Position vor Submission: Erst mit Kontrolle ${ctrl} war der Abschluss möglich.`,
  hooks: "Rückenpunkte gibt es erst, wenn Seatbelt und Hooks sitzen – Füße nie kreuzen.",
};
