// Kern 2 – Schlüsselwörter (Mechanik 1, Spec docs/superpowers/specs/2026-11-06-hs-mtg-mechaniken.md).
// Vorbild: Hearthstone/Magic-Keywords (Taunt, Rush, Flying). Ein kleines, festes Vokabular; jedes Wort bedeutet
// auf jeder Karte genau dieselbe Regel und wird einmal im Glossar erklärt.
// Wichtig: Schlüsselwörter werden NUR aus den Kartendaten abgeleitet (keywordsOf) – es gibt keine Handliste,
// damit ein Schlüsselwort nie etwas behauptet, was die Engine nicht tut. keywords.test.ts prüft das gegen die Regeln.
import type { Card2, Pos2, Zone } from "../types";
import { SRC } from "../../data/sources";

export type KeywordId = "keil" | "rahmen" | "takedown" | "pass" | "flucht" | "aufgabe" | "dilemma" | "atem";

export interface KeywordDef {
  id: KeywordId;
  /** Name auf dem Chip (fett). */
  name: string;
  /** Regel im Spiel: höchstens 3 Sätze, je ≤ 20 Wörter, du-Form. */
  rule: string;
  /** Eine Zeile beim ersten Auftauchen im Kampf (≤ 14 Wörter). */
  hint: string;
  /** „Im echten Grappling:“ – ein Satz (≤ 20 Wörter). */
  bjj: string;
  source?: { title: string; url: string };
  /** ohne Primärquelle → Trainer prüfen */
  check?: boolean;
}

const GB_GAS = { title: "Gracie Barra – Gassing Out? 3 Tips", url: "https://graciebarra.com/gb-news/gassing-out" };
const GFF = { title: "BJJ More – Danaher Pin Escapes: Go Further Faster (Review)", url: "https://bjjmore.com/john-danaher-pin-escapes-go-further-faster/" };
const RNC_STEPS = { title: "Grapplearts – Preventing & Escaping the RNC", url: "https://www.grapplearts.com/preventing-escaping-the-rnc/" };

/** Reihenfolge = Reihenfolge auf der Karte und im Glossar. */
export const KEYWORDS: KeywordDef[] = [
  {
    id: "keil", name: "Keil",
    rule: "Du gewinnst +1 in seiner Zone, und der Vorteil bleibt liegen. Greift er dort an, verlierst du. Rahmt er dort, gewinnst du +2.",
    hint: "Keil: +1 in der Zone, der Vorteil bleibt liegen.",
    bjj: "Laut Danaher pinnst du mit Keilen an Hüfte und Nacken, nicht mit Gewicht.",
    source: GFF,
  },
  {
    id: "rahmen", name: "Rahmen",
    rule: "Stoppt seinen Angriff in derselben Zone und gewinnt dort +1 – außer gegen ein Dilemma. Ohne Angriff dort verpufft er; gegen einen Keil verliert er.",
    hint: "Rahmen: stoppt einen Angriff in derselben Zone – sonst verpufft er.",
    bjj: "Unter einem Pin rahmst du mit Unterarm und Ellbogen bei etwa 90 Grad, statt zu drücken.",
    source: GFF,
  },
  {
    id: "takedown", name: "Takedown",
    rule: "Gelingt der Angriff, geht es aus Stand, Clinch oder Kopfklammer zu Boden – und du liegst oben.",
    hint: "Takedown: aus dem Stand zu Boden, du oben.",
    bjj: "Nach IBJJF gibt ein Takedown 2 Punkte, wenn du danach 3 Sekunden oben bleibst.",
    source: SRC.points,
  },
  {
    id: "pass", name: "Pass",
    rule: "Gelingt der Angriff, bist du von oben an seinen Beinen vorbei. Sein Griff hält dich dabei nicht fest.",
    hint: "Pass: von oben an seinen Beinen vorbei.",
    bjj: "Nach IBJJF zählt ein Pass 3 Punkte: beide Beine überwunden, 3 Sekunden Seitkontrolle gehalten.",
    source: SRC.points,
  },
  {
    id: "flucht", name: "Flucht",
    rule: "Bringt dich von unten raus: in den Stand, durch Umdrehen oder zurück in die Guard. Sitzt sein Griff (Schritt 2), ist sie gesperrt.",
    hint: "Flucht: von unten raus – geht nicht mehr, wenn sein Griff sitzt.",
    bjj: "Danaher nennt drei Wege aus dem Pin: in den neutralen Stand, Umdrehen oder zurück in die Guard.",
    source: GFF,
  },
  {
    id: "aufgabe", name: "Aufgabe",
    rule: "Jeder Treffer schiebt die Leiste: Isolieren, Kontrollieren, Beenden – bei 3 klopft er ab. Verteidigt er nicht genau dort, geht es zwei Schritte. Ein Rahmen dort setzt einen Schritt zurück, ein Positionswechsel löscht die Leiste.",
    hint: "Aufgabe: drei Schritte bis zum Tap – erst isolieren, dann beenden.",
    bjj: "Ein Würger ist eine Folge von Schritten; blockst du früh einen Schritt, kommt er nicht durch.",
    source: RNC_STEPS,
  },
  {
    id: "dilemma", name: "Dilemma",
    rule: "Stoppt er diesen Angriff mit einem Rahmen, gewinnst du +1 in der geöffneten Zone. Sein Rahmen gewinnt dabei nichts.",
    hint: "Dilemma: wehrt er ab, öffnet sich die andere Zone.",
    bjj: "Danaher: Greif in Paaren an – wehrt er das eine ab, läuft er ins andere.",
    source: SRC.dilemmas,
  },
  {
    id: "atem", name: "Atem",
    rule: "Die Zahl ist der Preis in Atem, du zahlst beim Aufdecken. Jede Runde bekommst du 1 zurück, höchstens 5.",
    hint: "Atem: große Aktionen kosten Atem – teil ihn dir ein.",
    bjj: "Wer mit Kraft statt Hebel arbeitet, ist schnell leer – Helio Gracie setzte auf Hebel und Position.",
    source: GB_GAS,
  },
];

export const KEYWORD: Record<KeywordId, KeywordDef> = Object.fromEntries(KEYWORDS.map((k) => [k.id, k])) as Record<KeywordId, KeywordDef>;

/** Ein Schlüsselwort auf einer bestimmten Karte, mit Zusatz (Zahl oder Zone). */
export interface KeywordHit { id: KeywordId; label: string }

const STANDING = new Set<Pos2>(["stand", "clinch", "headlock"]);
const GROUND = new Set<Pos2>(["guard", "half", "side", "mount", "back", "turtle"]);
const ZONE_NAME: Record<Zone, string> = { kopf: "Kopf", arme: "Arme", huefte: "Hüfte", beine: "Beine" };

/** Takedown: aus einer stehenden Lage (Stand, Clinch, Kopfklammer) zu Boden, Kartenspieler danach oben. */
export function isTakedown(c: Card2): boolean {
  return !!c.to && c.to.role === "top" && GROUND.has(c.to.pos) && c.slots.some((s) => STANDING.has(s.pos));
}
/** Pass: oben in Guard/Half Guard, danach oben in einer anderen Lage. */
export function isPass(c: Card2): boolean {
  return !!c.to && c.to.role === "top" && c.slots.some((s) => s.role === "top" && (s.pos === "guard" || s.pos === "half") && s.pos !== c.to!.pos);
}

/** Schlüsselwörter einer Karte – reine Ableitung aus den Daten (Reihenfolge wie KEYWORDS). */
export function keywordsOf(c: Card2): KeywordHit[] {
  const out: KeywordHit[] = [];
  if (c.kind === "aufbauen") out.push({ id: "keil", label: "Keil" });
  if (c.kind === "rahmen") out.push({ id: "rahmen", label: "Rahmen" });
  if (isTakedown(c)) out.push({ id: "takedown", label: "Takedown" });
  if (isPass(c)) out.push({ id: "pass", label: "Pass" });
  if (c.to?.escape) out.push({ id: "flucht", label: "Flucht" });
  if (c.submission) out.push({ id: "aufgabe", label: "Aufgabe" });
  if (c.dilemmaOpens) out.push({ id: "dilemma", label: `Dilemma → ${ZONE_NAME[c.dilemmaOpens]}` });
  if (c.kraft) out.push({ id: "atem", label: `Atem ${c.kraft}` });
  return out;
}

/** Schlüsselwörter, die neben Art-Label und Atem-Pille noch Platz auf der kleinen Handkarte brauchen. */
export const HAND_EXTRA: KeywordId[] = ["takedown", "pass", "flucht", "aufgabe", "dilemma"];

// ---------------- Erstes Auftauchen (localStorage) ----------------
export const KEYWORDS_SEEN_KEY = "mk.k2.keywords.v1";

export function readSeenKeywords(): KeywordId[] {
  try {
    const raw = localStorage.getItem(KEYWORDS_SEEN_KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter((x): x is KeywordId => typeof x === "string" && x in KEYWORD) : [];
  } catch { return []; }
}
export function markKeywordSeen(id: KeywordId): void {
  const cur = readSeenKeywords();
  if (cur.includes(id)) return;
  try { localStorage.setItem(KEYWORDS_SEEN_KEY, JSON.stringify([...cur, id])); } catch { /* privat oder voll – dann eben nur in dieser Sitzung */ }
}
/** Nächstes noch nicht erklärtes Schlüsselwort unter den Karten (Reihenfolge wie KEYWORDS). */
export function firstUnseen(cards: Card2[], seen: KeywordId[]): KeywordId | null {
  const have = new Set(cards.flatMap((c) => keywordsOf(c).map((k) => k.id)));
  return KEYWORDS.find((k) => have.has(k.id) && !seen.includes(k.id))?.id ?? null;
}
