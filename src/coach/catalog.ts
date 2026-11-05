// Kompakter Karten-Katalog als Wissensgrundlage für den KI-Coach.
// Läuft im Build-Skript (scripts/build-catalog.mjs → api/_catalog.ts) und ist im Client testbar.
// Nur Daten aus src/data – der Coach darf nichts anderes lehren.
import { BANNED_LESSONS, CARDS } from "../data/cards";
import { KIND_VERB, POSITION_GUIDE, RES } from "../data/positions";
import type { CardDef, PositionId, Role, Tag } from "../engine/types";

const ROLE_DE: Record<Role, string> = { neutral: "", top: " oben", bottom: " unten" };

const TAG_DE: Record<Tag, string> = {
  strike: "Schläge", shot: "Beinangriffe", single: "Ein-Bein-Angriffe", legs: "Beinangriffe", clinch: "Clinch-Versuche",
  snap: "Kopf-Runterziehen", drag: "Armzüge", bodylock: "Umklammern", hip: "Hüftwürfe", reap: "Sicheln",
  escape: "Fluchten", bridge: "Abwerfen", sweep: "Umdrehen", pass: "Vorbeigehen", advance: "Aufsteigen",
  choke: "Würger", armlock: "Armhebel", shoulderlock: "Schulterhebel", trianglechoke: "Beinwürger",
  behind: "Hinter-dich-Gehen",
};

function posLabel(pos: PositionId, role: Role): string {
  const g = POSITION_GUIDE[pos];
  return `${g.plain} (${g.term})${ROLE_DE[role]}`;
}

function uniq<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}

function cardLine(c: CardDef): string {
  const title = c.plain ? `${c.plain} (${c.name}${c.de ? ` / ${c.de}` : ""})` : `${c.name}${c.de ? ` (${c.de})` : ""}`;
  const parts: string[] = [
    `[${c.id}] ${title}`,
    `Typ: ${KIND_VERB[c.kind].short}${c.basic ? ", Grundtechnik" : ""}${c.submission ? ", Aufgabegriff" : ""}`,
    `Wo: ${uniq(c.slots.map((s) => posLabel(s.pos, s.role))).join("; ")}`,
  ];
  if (c.plainDo) parts.push(`Was: ${c.plainDo}`);
  parts.push(`Technik: ${c.desc}`);
  if (c.tags?.length) parts.push(`Familie: ${uniq(c.tags.map((t) => TAG_DE[t])).join(", ")}`);
  if (c.counters?.length) parts.push(`Kontert: ${uniq(c.counters.map((t) => TAG_DE[t])).join(", ")}`);
  if (c.success) parts.push(`Erfolg → ${posLabel(c.success.pos, c.success.role)}${c.success.points ? `, +${c.success.points} Pkt` : ""}`);
  if (c.keys.length) parts.push(`Merke: ${c.keys.join("; ")}`);
  if (c.mistakes.length) parts.push(`Fehler: ${c.mistakes.join("; ")}`);
  if (c.safety) parts.push(`Sicherheit: ${c.safety}`);
  if (c.lesson) parts.push(`Lernsatz: ${c.lesson}`);
  if (c.check) parts.push("(ohne Primärquelle – vom Trainer prüfen lassen)");
  return parts.join(" | ");
}

function positionLine(pos: PositionId): string {
  const g = POSITION_GUIDE[pos];
  const roles = (Object.keys(g.goal) as Role[]).map((r) => {
    const danger = g.danger?.[r] ? ` Gefahr: ${g.danger[r]}` : "";
    return `${r === "neutral" ? "beide" : r === "top" ? "oben" : "unten"}: Ziel ${g.goal[r]}${danger}`;
  });
  return `${g.plain} (${g.term}) – ${g.oneLiner} ${roles.join(" / ")}`;
}

/** Baut den kompletten Katalog-Text (Deutsch, kompakt, eine Zeile je Karte). */
export function buildCatalog(cards: CardDef[] = CARDS): string {
  const positions = (Object.keys(POSITION_GUIDE) as PositionId[]).map(positionLine);
  return [
    "## Spielregeln (Dreieck)",
    `- ${KIND_VERB.angriff.explain}`,
    `- ${KIND_VERB.setup.explain}`,
    `- ${KIND_VERB.reaktion.explain}`,
    `- ${RES.gas.name} (Ausdauer): ${RES.gas.explain}`,
    `- ${RES.control.name} (Kontrolle): ${RES.control.explain}`,
    `- ${RES.opening.name} (Öffnung): ${RES.opening.explain}`,
    "- Kampfkette: Distanz → Clinch → Takedown → Kontrolle → Aufgabegriff (Submission).",
    "",
    "## Positionen (beste zuerst: Rücken > Draufsitzen > Quer drauf > Guard)",
    ...positions.map((p) => `- ${p}`),
    "",
    "## Karten",
    ...cards.map(cardLine),
    "",
    "## Verbotene Techniken (nur als Regel erklären, NIE anleiten)",
    ...BANNED_LESSONS.map((b) => `- ${b.name}: ${b.why}`),
    "- Außerdem für Weißgurte verboten: Kneebar, Toe Hold, Handgelenkhebel (Wristlock), Fingerhebel, Wadenquetscher, Suplex.",
  ].join("\n");
}
