// Kompakter Katalog als Wissensgrundlage für den KI-Coach (No-Gi, Kern 2, 7-Tage-Startprogramm).
// Läuft im Build-Skript (scripts/build-catalog.mjs → api/_catalog.ts) und ist im Client testbar.
// Nur Daten aus dem Spiel – der Coach darf nichts anderes lehren.
// Quellen der Regeln: docs/knowledge-base.md §8.12 (No-Gi, Beinhebel, IBJJF Weißgurt).
import { CARDS2 } from "../core2/data/cards";
import type { Card2, Kind2, Pos2, Role2, Zone } from "../core2/types";
import { CARDS, GI_ONLY } from "../data/cards";
import type { CardDef } from "../engine/types";
import { DAYS, NOT_ALONE, READY_CHECKLIST, type ProgramDay } from "../program/days";
import { LESSONS_PROGRAM } from "../program/lessons";
import { TUTORIALS_K2 } from "../core2/data/tutorials";
import { EXPLAIN_QUESTIONS, Q_BY_ID, TOPIC_LABEL } from "../program/questions";

// Bewusst lokal statt aus core2/ui/meta.tsx (das ist eine React-Datei mit Icons).
const POS_DE: Record<Pos2, string> = {
  stand: "Stand", clinch: "Clinch", guard: "Guard", half: "Halbe Guard (Half Guard)", turtle: "Turtle",
  side: "Seitenkontrolle (Side Control)", mount: "Mount", back: "Rücken (Back)",
};
const ROLE_DE: Record<Role2, string> = { neutral: "", top: " oben", bottom: " unten" };
const ZONE_DE: Record<Zone, string> = { kopf: "Kopf/Nacken", arme: "Arme", huefte: "Hüfte", beine: "Beine" };
const KIND_DE: Record<Kind2, string> = { angriff: "Angreifen", aufbauen: "Aufbauen", rahmen: "Rahmen" };

const uniq = <T,>(xs: T[]): T[] => [...new Set(xs)];
const slotLabel = (pos: Pos2, role: Role2) => `${POS_DE[pos]}${ROLE_DE[role]}`;

/** Eine Zeile je Kern-2-Karte: Alltagsname, Fachbegriff, Position, Was, Warum, Merke, Fehler, Sicherheit. */
export function card2Line(c: Card2): string {
  const parts: string[] = [
    `[${c.id}] ${c.plain} (${c.term})`,
    `Typ: ${KIND_DE[c.kind]}, Zone ${ZONE_DE[c.zone]}${c.submission ? ", Aufgabegriff" : ""}`,
    `Wo: ${uniq(c.slots.map((s) => slotLabel(s.pos, s.role))).join("; ")}`,
    `Was: ${c.plainDo}`,
    `Warum: ${c.why}`,
  ];
  if (c.to) parts.push(`Erfolg → ${slotLabel(c.to.pos, c.to.role)}${c.to.points ? `, +${c.to.points} Pkt` : ""}`);
  if (c.keys.length) parts.push(`Merke: ${c.keys.join("; ")}`);
  if (c.mistakes.length) parts.push(`Fehler: ${c.mistakes.join("; ")}`);
  if (c.safety) parts.push(`Sicherheit: ${c.safety}`);
  if (c.check) parts.push("(ohne Primärquelle – vom Trainer prüfen lassen)");
  return parts.join(" | ");
}

function dayLines(d: ProgramDay): string[] {
  const lessons = d.lessons.map((l) => {
    if (l.kind === "map") return "Positions-Landkarte";
    if (l.kind === "exam") return "Prüfung (12 Fragen)";
    const t = [...TUTORIALS_K2, ...LESSONS_PROGRAM].find((x) => x.id === l.id);
    return t ? `${t.title} – ${t.idea}` : l.id;
  });
  const topics = uniq([...d.puzzle, ...(d.pics ?? [])].map((id) => Q_BY_ID[id]?.topic).filter(Boolean).map((t) => TOPIC_LABEL[t!]));
  return [
    `### Tag ${d.n}: ${d.title}`,
    `- Ziel: ${d.goal}`,
    `- Warum: ${d.why}`,
    `- Lektion: ${lessons.join("; ")}`,
    ...(topics.length ? [`- Themen: ${topics.join(", ")}`] : []),
    `- Drill (solo): ${d.drill.title} – ${d.drill.steps.join(" ")} Sicherheit: ${d.drill.safety}`,
  ];
}

/** Alte Kampagne: nur Namen, damit Match-Analysen Karten-ids in Alltagsnamen übersetzen können. */
function oldCardIndex(cards: CardDef[]): string {
  return cards
    .filter((c) => !GI_ONLY.has(c.id))
    .map((c) => `[${c.id}] ${c.plain && c.plain !== c.name ? `${c.plain} (${c.name})` : c.name}`)
    .join("; ");
}

/** Regeln, die IMMER gelten (No-Gi, IBJJF Weißgurt als Standard). KB §8.12. */
export const RULES_NOGI = [
  "No-Gi (ohne Anzug): Griffe an Körperteilen – Handgelenk, 2-gegen-1, Underhook, Overhook/Whizzer, Collar Tie (Nacken), Body Lock, Gurtgriff (Seatbelt). Keine Kragen-, Ärmel-, Hosen- oder Gürtelgriffe.",
  "Standard-Regelwerk: IBJJF Weißgurt (die strengste Regel).",
  "Für Weißgurte verboten: Heel Hook, Kneebar, Toe Hold, Wadenquetscher (Calf Slicer), Reaping (Knie-Sicheln), Slam/Suplex, Neck Crank, Wirbelsäulenhebel, Kani Basami, Handgelenk- und Fingerhebel.",
  "Gerader Fußhebel (Straight Ankle Lock) ist der einzige Anfänger-Beinhebel – nur mit Trainer, nicht in Woche 1.",
  "Beinhebel: früh abklopfen, nie rausdrehen. Der Schaden kommt oft vor dem Schmerz (ca. 2 cm Fersenbewegung reichen für eine Verletzung).",
  "Abklopfen (Tap): früh, mit Hand, Fuß oder Wort. Beim Tap sofort loslassen. Schwindel oder Sternchen beim Würger = sofort abklopfen.",
  "Position vor Aufgabe: erst Kontrolle, dann beenden. Erst befreien, dann angreifen.",
  "IBJJF-Punkte: Takedown 2, Sweep 2, Passieren 3, Mount 4, Rücken mit beiden Haken 4.",
];

/** Baut den kompletten Katalog-Text (Deutsch, kompakt, eine Zeile je Karte). */
export function buildCatalog(cards: Card2[] = CARDS2, days: ProgramDay[] = DAYS): string {
  return [
    "## Regeln (gelten immer)",
    ...RULES_NOGI.map((r) => `- ${r}`),
    "",
    "## Spielprinzip (Kern 2: Körperkarte)",
    `- Jede Lage hat vier Zonen: ${Object.values(ZONE_DE).join(", ")}. Wer eine Zone gewinnt, kontrolliert sie.`,
    `- Kartenarten: ${KIND_DE.aufbauen} (Zone gewinnen), ${KIND_DE.angriff} (Position wechseln oder Aufgabegriff, braucht gewonnene Zonen), ${KIND_DE.rahmen} (abwehren, kontern).`,
    "- Aufgabegriffe laufen in 3 Schritten bis zum Tap – Position vor Aufgabe.",
    `- Positionen: ${Object.values(POS_DE).join(", ")}. Beste oben zuerst: Rücken > Mount > Seitenkontrolle > Halbe Guard > Guard.`,
    "",
    "## 7-Tage-Startprogramm",
    ...days.flatMap(dayLines),
    `- Bereit fürs erste Training: ${READY_CHECKLIST.map((c) => c.text).join("; ")}.`,
    `- Nicht allein üben: ${NOT_ALONE.join("; ")}.`,
    "",
    "## Karten (Kern 2, No-Gi)",
    ...cards.map(card2Line),
    "",
    "## Ein-Satz-Erklärungen (Musterantworten)",
    ...EXPLAIN_QUESTIONS.map((q) => `- ${q.q} → ${q.why} (Kernpunkte: ${q.explain!.points.join("; ")})`),
    "",
    "## Klassische Kampagne (nur Namen, für Match-Analysen)",
    oldCardIndex(CARDS),
  ].join("\n");
}

export interface GradeItem { q: string; model: string; points: string[] }

/** Bewertbare Ein-Satz-Fragen: Der Server nimmt nur diese ids an (kein freier Prompt vom Client). */
export function buildGradeItems(): Record<string, GradeItem> {
  return Object.fromEntries(EXPLAIN_QUESTIONS.map((q) => [q.id, { q: q.q, model: q.why, points: q.explain!.points }]));
}
