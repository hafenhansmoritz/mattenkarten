// Kern 2 – schrittweises Aufdecken des Bretts (Progressive Disclosure, KB 8.1/8.3).
// Reiner UI-Filter: Die Engine kennt weiter alle Zonen und Karten.
import type { Card2, Kind2, Zone } from "../types";
import type { LessonFoe } from "../engine";
import type { KeywordId } from "../data/keywords";
import type { TutorialK2Def, UiLevel } from "./tutorialTypes";
import { ZONES } from "../types";

/** Zonen, die in dieser Lektion grau bleiben ("kommt später"). Leer = alle aktiv. */
export function hiddenZones(zones?: Zone[] | null): Zone[] {
  if (!zones || zones.length === 0) return [];
  return ZONES.filter((z) => !zones.includes(z));
}

/**
 * Hand für die Lektion: nur Karten aktiver Zonen.
 * Ausnahmen: die geforderte Tutorial-Karte bleibt immer sichtbar.
 * Ist keine sichtbare Karte spielbar, kommen die spielbaren aus versteckten Zonen dazu –
 * so steckt der Spieler nie fest.
 */
export function filterHandByZones(
  cards: Card2[],
  legal: { id: string; ok: boolean }[],
  zones?: Zone[] | null,
  requireCard?: string,
): Card2[] {
  const hidden = new Set(hiddenZones(zones));
  if (hidden.size === 0) return cards;
  const lmap = new Map(legal.map((l) => [l.id, l.ok]));
  const ok = (c: Card2) => lmap.get(c.id) ?? true;
  const shown = cards.filter((c) => !hidden.has(c.zone) || c.id === requireCard);
  if (shown.some(ok)) return shown;
  return cards.filter((c) => !hidden.has(c.zone) || c.id === requireCard || ok(c));
}

// ---------------- Freischalten nach Tagen (UX-Review 06.11.) ----------------

export interface UiFeatures {
  level: UiLevel;
  /** Aktive Zonen (die übrigen werden ausgeblendet, nicht nur grau). */
  zones: Zone[];
  /** Sichtbare Kartenarten. Rahmen auf Stufe 2 nur, wenn sonst nichts geht (oder gefordert). */
  kinds: Kind2[];
  atem: boolean;
  phaseBar: boolean;
  /** Vorhersage „Was passiert jetzt?“ erlaubt (abschaltbar). */
  predict: boolean;
  /** Schlüsselwörter, die auf dieser Stufe nicht gezeigt werden. */
  hideKeywords: KeywordId[];
}

const LEVEL_ZONES: Record<UiLevel, Zone[]> = {
  2: ["huefte", "beine"],
  3: ["kopf", "huefte", "beine"],
  4: [...ZONES], 5: [...ZONES], 6: [...ZONES], 7: [...ZONES],
};
// Mechaniken jenseits der ersten Woche (Griff, Kette, Konter, Stil, Plan) bleiben unberührt – sie hängen an eigenen Schaltern.
const LEVEL_HIDE_KW: Record<UiLevel, KeywordId[]> = {
  2: ["rahmen", "keil", "dilemma", "flucht", "atem"],
  3: ["keil", "dilemma", "flucht", "atem"],
  4: ["keil", "dilemma", "atem"],
  5: ["keil", "dilemma"],
  6: [], 7: [],
};

/** Merkmale je Stufe. tut.zones (falls gesetzt) gehen vor der Stufen-Vorgabe. */
export function uiFeatures(tut?: TutorialK2Def | null, override?: UiLevel): UiFeatures {
  const level: UiLevel = override ?? tut?.ui ?? 7;
  const zones = tut?.zones?.length ? ZONES.filter((z) => tut.zones!.includes(z)) : LEVEL_ZONES[level];
  return {
    level,
    zones,
    kinds: level <= 2 ? ["aufbauen", "angriff"] : ["aufbauen", "angriff", "rahmen"],
    atem: level >= 5,
    phaseBar: level >= 5,
    predict: level >= 6,
    hideKeywords: LEVEL_HIDE_KW[level],
  };
}

/** Regeln für den Lektions-Gegner aus Stufe und Lektion (nur Tutorials). */
export function foeRules(tut: TutorialK2Def, f: UiFeatures = uiFeatures(tut)): LessonFoe {
  const subs = tut.foe?.subs ?? (f.level <= 2 ? [] : undefined);
  return {
    zones: f.zones.length < ZONES.length ? f.zones : undefined,
    subs,
    script: tut.foe?.script,
    prefer: tut.foe?.prefer,
  };
}

/**
 * Hand nach Stufe: Zonen wie filterHandByZones, dazu ausgeblendete Kartenarten (Stufe 2: kein Rahmen).
 * Ein Rahmen erscheint trotzdem, wenn er gefordert ist oder sonst keine sichtbare Karte spielbar ist.
 */
export function filterHandByLevel(
  cards: Card2[],
  legal: { id: string; ok: boolean }[],
  f: UiFeatures,
  requireCard?: string,
): Card2[] {
  const byZone = filterHandByZones(cards, legal, f.zones.length < ZONES.length ? f.zones : null, requireCard);
  if (f.kinds.length === 3) return byZone;
  const lmap = new Map(legal.map((l) => [l.id, l.ok]));
  const ok = (c: Card2) => lmap.get(c.id) ?? true;
  const shown = byZone.filter((c) => f.kinds.includes(c.kind) || c.id === requireCard);
  return shown.some(ok) ? shown : byZone;
}

// ---------------- Erklärungen nach Stufe (UX-Review 2, Punkt 5) ----------------

/** Begriffe, die erst ab einer Stufe in Erklärungen vorkommen dürfen (vorher: Satzteil umschreiben oder weglassen). */
const CONCEPTS: { re: RegExp; from: UiLevel }[] = [
  { re: /Dilemma/i, from: 6 },
  { re: /\bKeil(e|en|s)?\b|gekeilt|\bWedges?\b/i, from: 6 },
  { re: /\bPunkt(e|en)?\b|Punktgleich|Punktestand/i, from: 5 },
  { re: /\bVorteil\b/i, from: 5 },
];

const hiddenAt = (level: UiLevel) => CONCEPTS.filter((c) => level < c.from).map((c) => c.re);

/** true: Text nennt ein Konzept, das auf dieser Stufe noch verborgen ist. */
export function mentionsHidden(text: string, level: UiLevel): boolean {
  return hiddenAt(level).some((re) => re.test(text));
}

/**
 * Erklärung für die Stufe: Klammer-Teile mit verborgenen Begriffen fallen weg („(Mount, 4 Punkte)“ → „(Mount)“),
 * das Etikett „Dilemma:“ wird gestrichen, übrige Satzteile (getrennt durch „.“, „;“ oder „ – “) mit verborgenen
 * Begriffen fallen weg. Bleibt nichts übrig: "".
 */
export function explainForLevel(text: string, level: UiLevel): string {
  const hidden = hiddenAt(level);
  if (!text || !hidden.some((re) => re.test(text))) return text;
  const bad = (t: string) => hidden.some((re) => re.test(t));
  let t = text.replace(/\s*\(([^()]*)\)/g, (_m, inner: string) => {
    const keep = inner.split(/,\s*/).filter((p) => !bad(p));
    return keep.length ? ` (${keep.join(", ")})` : "";
  });
  t = t.replace(/\bDilemma:\s*/g, "");
  // In Satzteile zerlegen, Trenner behalten.
  const parts = t.split(/(\.\s+|;\s+|\s+–\s+)/);
  const out: string[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const seg = parts[i], sep = parts[i + 1] ?? "";
    if (!seg.trim() || bad(seg)) continue;
    out.push(seg, sep);
  }
  if (!out.length) return "";
  out[out.length - 1] = "";                      // letzter Trenner weg
  let res = out.join("").trim().replace(/[,;:–\s]+$/, "");
  if (!/[.!?]$/.test(res)) res += ".";
  return res[0].toUpperCase() + res.slice(1);
}

/** Satz über die sichtbaren Zonen einer Lektion („Heute zwei Zonen: Hüfte und Beine.“). */
export function zonesIntro(zones: Zone[]): string {
  const NAME: Record<Zone, string> = { kopf: "Kopf/Nacken", arme: "Arme", huefte: "Hüfte", beine: "Beine" };
  const list = ZONES.filter((z) => zones.includes(z)).map((z) => NAME[z]);
  const n = ["", "eine Zone", "zwei Zonen", "drei Zonen", "vier Zonen"][list.length] ?? `${list.length} Zonen`;
  const names = list.length > 1 ? `${list.slice(0, -1).join(", ")} und ${list[list.length - 1]}` : list[0];
  return list.length === ZONES.length
    ? `Alle vier Zonen: ${names}. Wer Zonen gewinnt, kommt weiter.`
    : `Heute ${n}: ${names}. Wer Zonen gewinnt, kommt weiter.`;
}
