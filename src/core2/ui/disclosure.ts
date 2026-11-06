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
