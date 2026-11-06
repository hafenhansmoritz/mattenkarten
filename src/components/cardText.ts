import type { CardDef, CardKind, Outcome, PositionId, Rarity, Role, Tag } from "../engine/types";
import { POSITION_GUIDE } from "../data/positions";

/** Kartentyp als Verb (Neulinge): Wirkung statt Kategorie. */
export const KIND_LABEL: Record<CardKind, string> = {
  angriff: "ANGREIFEN",
  setup: "VORBEREITEN",
  reaktion: "KONTERN",
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
  side: "Seitenkontrolle",
  mount: "Mount",
  back: "Rücken",
};

/** Alltagsnamen der Positionen (groß zeigen, Fachbegriff POS_LABEL klein darunter). */
export const POS_PLAIN: Record<PositionId, string> = {
  dist: POSITION_GUIDE.dist.plain,
  clinch: POSITION_GUIDE.clinch.plain,
  fhl: POSITION_GUIDE.fhl.plain,
  guard: POSITION_GUIDE.guard.plain,
  side: POSITION_GUIDE.side.plain,
  mount: POSITION_GUIDE.mount.plain,
  back: POSITION_GUIDE.back.plain,
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

/** Alltagstitel der Karte (groß), Fachbegriff bleibt card.name. */
export function plainTitle(card: CardDef): string {
  return card.plain ?? card.name;
}

const STANDING: PositionId[] = ["dist", "clinch"];

function outcomeText(o: Outcome, from?: PositionId[]): string {
  const target = POS_PLAIN[o.pos];
  if (o.role === "neutral") return `→ ${target}`;
  const standing = (from ?? []).some((p) => STANDING.includes(p));
  if (standing && o.role === "top" && (o.pos === "guard" || o.pos === "side" || o.pos === "mount")) {
    return "Wirft ihn um → du oben";
  }
  return `→ ${target}, du ${ROLE_LABEL[o.role]}`;
}

/**
 * Ein-Zeilen-Effekt in Alltagssprache, aus den Kartendaten abgeleitet.
 * Bewusst kurz (max. ~2 Zeilen Kartentext), ohne Fachbegriffe.
 */
export function effectText(card: CardDef): string {
  const parts: string[] = [];
  const from = card.slots.map((s) => s.pos);

  if (card.kind === "angriff") {
    if (card.submission) parts.push("Beendet den Kampf: er klopft ab");
    else if (card.success) parts.push(outcomeText(card.success, from));
  } else if (card.kind === "setup") {
    const gain = card.controlGain ?? 1;
    if (gain > 0) parts.push(`+${gain} Griff`);
    if (card.opening?.tags.length) parts.push(`Lücke für: ${tagList(card.opening.tags)}`);
  } else {
    parts.push(card.counters?.length ? `Stoppt: ${tagList(card.counters)}` : "Stoppt den Angriff");
    if (card.onCounter) {
      const pts = card.onCounter.points ? ` (+${card.onCounter.points})` : "";
      parts.push(`${outcomeText(card.onCounter)}${pts}`);
    }
  }

  if (card.drainGas) parts.push("Er verliert Atem");
  return parts.join(" · ");
}
