import type { CardDef, CardKind } from "../../engine/types";

/** Kartentypen als Verben (Neulinge). */
export const KIND_VERB: Record<CardKind, string> = {
  angriff: "Angreifen",
  setup: "Aufbauen",
  reaktion: "Rahmen",
};

export const KIND_ORDER: CardKind[] = ["angriff", "setup", "reaktion"];

/** Das Dreieck in Alltagssprache: Regel, die vom jeweiligen Typ ausgeht. */
export const KIND_RULE: Record<CardKind, { verb: string; short: string; long: string; beats: CardKind }> = {
  angriff: { verb: "schlägt", short: "Angreifen schlägt Aufbauen", long: "Wer angreift, erwischt den, der noch aufbaut.", beats: "setup" },
  setup: { verb: "lockt ins Leere", short: "Aufbauen lockt den Rahmen ins Leere", long: "Wer nur abwehren will, wartet umsonst. Du baust in Ruhe auf.", beats: "reaktion" },
  reaktion: { verb: "schlägt", short: "Rahmen stoppt den passenden Angriff", long: "Der richtige Rahmen stoppt genau diesen Angriff.", beats: "angriff" },
};

/** Alltagsname einer Karte: plain → Fachbegriff. */
export function plainName(card: CardDef): string {
  return card.plain ?? card.name;
}

/** Fachbegriff nur zeigen, wenn er vom Alltagsnamen abweicht. */
export function termOf(card: CardDef): string | null {
  const p = plainName(card);
  return p === card.name ? null : card.name;
}
