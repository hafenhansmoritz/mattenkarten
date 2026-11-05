import type { CardDef, CardKind, Outcome, PositionId, Rarity, Role, Tag } from "../engine/types";

export const KIND_LABEL: Record<CardKind, string> = {
  angriff: "Angriff",
  setup: "Setup",
  reaktion: "Reaktion",
};

export const TAG_LABEL: Record<Tag, string> = {
  strike: "Schläge",
  shot: "Beinangriffe",
  single: "Single Leg",
  legs: "Beingriffe",
  clinch: "Clinch-Eintritt",
  snap: "Snap Down",
  drag: "Arm Drag",
  bodylock: "Body Lock",
  hip: "Hüftwürfe",
  reap: "Sichelwürfe",
  escape: "Escapes",
  bridge: "Bridge",
  sweep: "Sweeps",
  pass: "Passes",
  advance: "Aufstieg",
  choke: "Würger",
  armlock: "Armhebel",
  shoulderlock: "Schulterhebel",
  trianglechoke: "Triangle",
  behind: "Go-Behind",
};

export const POS_LABEL: Record<PositionId, string> = {
  dist: "Distanz",
  clinch: "Clinch",
  fhl: "Front Headlock",
  guard: "Guard",
  side: "Side Control",
  mount: "Mount",
  back: "Rücken",
};

export const ROLE_LABEL: Record<Role, string> = {
  neutral: "",
  top: "oben",
  bottom: "unten",
};

export const RARITY_LABEL: Record<Rarity, string> = {
  basis: "Basis",
  selten: "Selten",
  episch: "Episch",
  legendaer: "Legendär",
};

export function tagList(tags: Tag[] | undefined): string {
  return (tags ?? []).map((t) => TAG_LABEL[t]).join(", ");
}

/** "Kontert: Beinangriffe, Single Leg" – leer, wenn keine Reaktion. */
export function countersText(card: CardDef): string {
  if (card.kind !== "reaktion" || !card.counters?.length) return "";
  return `Kontert: ${tagList(card.counters)}`;
}

function outcomeText(o: Outcome): string {
  const role = ROLE_LABEL[o.role];
  return role ? `${POS_LABEL[o.pos]} (${role})` : POS_LABEL[o.pos];
}

/**
 * Ein-Zeilen-Effekt auf Deutsch, aus den Kartendaten abgeleitet.
 * Bewusst kurz (Brode: Spieler lesen ~8 Wörter pro Screen).
 */
export function effectText(card: CardDef): string {
  const parts: string[] = [];

  if (card.kind === "angriff") {
    if (card.submission) parts.push("Finish: Tap bei Erfolg");
    else if (card.success) parts.push(`Erfolg → ${outcomeText(card.success)}`);
  } else if (card.kind === "setup") {
    const gain = card.controlGain ?? 1;
    if (gain > 0) parts.push(`+${gain} Kontrolle`);
    if (card.opening?.tags.length) parts.push(`öffnet ${tagList(card.opening.tags)}`);
  } else {
    if (card.onCounter) {
      const pts = card.onCounter.points ? ` +${card.onCounter.points}` : "";
      parts.push(`Konter → ${outcomeText(card.onCounter)}${pts}`);
    } else {
      parts.push("Stoppt den Angriff");
    }
  }

  if (card.drainGas) parts.push(`Gegner −${card.drainGas} Gas`);
  return parts.join(" · ");
}
