// ============================================================
// Mattenkarten Kern 2 – "Körperkarte"
// Vertrag zwischen Engine (src/core2/engine), Inhalten (src/core2/data) und UI (src/core2/ui).
// Spec: docs/superpowers/specs/2026-11-05-kern2-koerperkarte-design.md
// ============================================================

export type Side = "p" | "o";
export type Pos2 = "stand" | "clinch" | "headlock" | "guard" | "half" | "turtle" | "side" | "mount" | "back";
export type Role2 = "neutral" | "top" | "bottom";
/** Front Headlock (Kopfklammer): Oben ist, wer den Kopf kontrolliert. Neutrale Gerangel-Position zwischen Stand und Boden. */
/** Die vier Zonen der Körperkarte. */
export type Zone = "kopf" | "arme" | "huefte" | "beine";
export const ZONES: Zone[] = ["kopf", "arme", "huefte", "beine"];
/** Dreieck bleibt: Angriff > Aufbauen > Rahmen > (passender) Angriff. */
export type Kind2 = "angriff" | "aufbauen" | "rahmen";

/** Zonenwerte aus Sicht des Spielers "p": +2 = p dominiert, -2 = o dominiert. */
export type Board = Record<Zone, number>;

/** Bedingung an die Zonen, aus Sicht des Kartenspielers (z. B. { huefte: 1, beine: 1 } = mind. +1). */
export type ZoneReq = Partial<Record<Zone, number>>;

/** MMA-Tauglichkeit einer Karte (B18): ok = auch mit Schlägen sinnvoll, riskant = mit Vorsicht, nein = im MMA vermeiden. */
export type MmaFlag = "ok" | "riskant" | "nein";

export interface Transition {
  pos: Pos2;
  role: Role2;            // Rolle des Kartenspielers danach
  points?: number;        // IBJJF-Punkte für den Kartenspieler
  /** Art der Befreiung (Danaher: in den Stand / Umdrehen / zurück in die Guard). */
  escape?: "neutral" | "reversal" | "guard";
}

export interface Card2 {
  id: string;
  plain: string;          // Alltagstitel (2–4 Wörter)
  term: string;           // Fachbegriff
  plainDo: string;        // ≤ 12 Wörter, was passiert
  kind: Kind2;
  zone: Zone;             // Zone, in der die Karte wirkt (und kollidiert)
  slots: { pos: Pos2; role: Role2 }[];
  /** aufbauen: Zonengewinn bei Erfolg (Default 1). rahmen: Gewinn beim erfolgreichen Konter (Default 1). */
  gain?: number;
  /** Zusätzliche Zonen, die bei Erfolg mitgewinnen (z. B. Crossface: kopf +1, arme +1). */
  alsoGain?: Partial<Record<Zone, number>>;
  /** angriff: Mindest-Zonenwerte, damit die Karte spielbar ist (Position vor Aufgabe!). */
  requires?: ZoneReq;
  /** angriff: Positionswechsel bei Erfolg. */
  to?: Transition;
  /** angriff: Aufgabegriff – Erfolg schiebt die Aufgabe-Leiste dieses Griffs um 1 (3 = Tap). */
  submission?: { id: string; name: string };
  /** Kosten in Atem (sichtbar „Atem“, internes Feld `kraft`): Abschluss-Schritte, große Befreiungen. */
  kraft?: number;
  /** Dilemma: verteidigt der Gegner in dieser Zone, öffnet sich diese andere Zone (Bonus +1 dort für dich). */
  dilemmaOpens?: Zone;
  /** Lerninhalt */
  why: string;            // ≤ 20 Wörter, warum es funktioniert
  keys: string[];
  mistakes: string[];
  safety?: string;
  /** rahmen: stoppt diese Karte einen gegnerischen Positionsangriff (Shot), wechselt die Position (Sprawl → Front Headlock). */
  onStop?: Transition;
  /** Bedingung für onStop aus Sicht des Rahmenden (z. B. Sprawl braucht Kopf ≥ 0, um seinen Kopf zu fassen). */
  onStopRequires?: ZoneReq;
  /** MMA-Hinweis (B18): Einstufung + ein Satz (≤ 12 Wörter). */
  mma?: MmaFlag;
  mmaNote?: string;
  source?: { title: string; url: string };
  check?: boolean;        // ohne Primärquelle → Trainer prüfen
  /** Mechanik 2 „Griffe bleiben liegen“ (B31): gelingt diese Aufbauen-Karte, liegt der Griff für ihren Spieler auf dem Brett
   *  (in card.zone). Wirkung immer gleich: deine Angriffe brauchen in dieser Zone 1 weniger. Er bleibt, solange die Lage zu
   *  einer Karte mit derselben Griff-ID passt (Slots aller Karten dieses Griffs), bis er gelöst wird. */
  grip?: { id: string; name: string };
  /** B32 „Griff lösen“: wird diese Karte nicht geschlagen, fallen diese gegnerischen Griffe (Griff-IDs). */
  breaks?: string[];
  /** Mechanik 3 „Kette“ (B35): folgt diese Angriffskarte direkt auf eine passende eigene Karte der Vorrunde
   *  (Karten-ID oder Tag "sub:<Aufgabe-ID>"), braucht sie in ihrer Zone 1 weniger (CHAIN_EFFECT). Egal, ob die
   *  Vorrunden-Karte klappte oder er sie abwehrte – gerade seine Abwehr öffnet die nächste Technik. */
  chain?: { after: string[]; why: string; source?: { title: string; url: string }; check?: boolean };
}

/** Ein liegender Griff (Mechanik 2). */
export interface Grip2 { id: string; name: string; owner: Side; zone: Zone; card: string }

export interface SubTrack { id: string; name: string; owner: Side; step: 0 | 1 | 2 | 3; zone: Zone }

/** Mechanik 4 „Vorbereiteter Konter“ (B38): verdeckt gelegter Rahmen. In der Sicht des Gegners (publicView) fehlen
 *  card und zone – er sieht nur, dass etwas liegt und wie lange noch. */
export interface Konter2 { card?: string; zone?: Zone; left: number }

/** kraft = Atem (sichtbar immer „Atem“: BJJ ist Hebel statt Kraft). */
export interface Fighter2 { pts: number; kraft: number; locked: string[] }

export interface State2 {
  pos: Pos2;
  top: Side | null;       // wer oben ist (null bei neutral)
  board: Board;           // Sicht von "p"
  round: number;          // 1-basiert
  maxRounds: number;      // Standard 8
  p: Fighter2;
  o: Fighter2;
  subs: SubTrack[];       // laufende Aufgabe-Leisten
  /** Liegende Griffe (Mechanik 2), älteste zuerst; höchstens GRIP_MAX je Spieler. */
  grips: Grip2[];
  /** Griffe ausgeschaltet (erste drei Lektionen): Griff-Karten wirken dann nur als Keil. */
  noGrips?: boolean;
  /** Ketten aus (erste drei Lektionen): keine Ketten-Erleichterung (Mechanik 3). */
  noChains?: boolean;
  /** Mechanik 4: verdeckt gelegte Konter (höchstens einer je Seite). */
  konter?: Partial<Record<Side, Konter2>>;
  /** Konter aus (erste drei Lektionen, Zusatz-Lektion). */
  noKonter?: boolean;
  history: Round2[];
  result: null | { type: "tap"; winner: Side; sub: string } | { type: "points"; winner: Side | null } | { type: "goal"; winner: Side };
  /** Tutorial-Ziel: Spieler gewinnt, sobald (pos, role) erreicht. */
  goal?: { pos: Pos2; role: Role2 }[];
}

export type Event2 =
  | { t: "zone"; zone: Zone; delta: number; by: Side }     // delta aus Sicht von "p"
  | { t: "move"; pos: Pos2; top: Side | null; escape?: Transition["escape"] }
  | { t: "points"; side: Side; n: number }
  | { t: "sub"; owner: Side; id: string; step: number }   // Aufgabe-Leiste ändert sich
  | { t: "tap"; winner: Side; sub: string }
  | { t: "dilemma"; side: Side; zone: Zone }
  | { t: "kraft"; side: Side; delta: number }
  /** Griff gelegt (on) oder gelöst (off); why: wodurch er fiel. */
  | { t: "grip"; owner: Side; id: string; name: string; zone: Zone; on: boolean; why?: "rahmen" | "loesen" | "verdraengt" | "position" | "alt" }
  /** Mechanik 3: eine Ketten-Karte hat getroffen (from = eigene Karte der Vorrunde, card = diese Runde). */
  | { t: "chain"; side: Side; from: string; card: string }
  /** Mechanik 4: Konter gelegt (ohne Karte – verdeckt), ausgelöst oder verfallen (dann aufgedeckt). */
  | { t: "konter"; side: Side; on: "set" | "trigger" | "gone"; card?: string; zone?: Zone; why?: "zeit" | "position"; instead?: string };

export interface Round2 {
  round: number;
  /** Gespielte Karte (bei ausgelöstem Konter die Konter-Karte). */
  pCard: string; oCard: string;
  /** Mechanik 4: wer diese Runde zusätzlich verdeckt einen Konter gelegt hat (öffentlich, ohne Karte). */
  konterSet?: Side[];
  rule: "verschiedene-zonen" | "angriff>aufbauen" | "aufbauen>rahmen" | "rahmen>angriff" | "angriff=angriff" | "aufbauen=aufbauen" | "rahmen=rahmen" | "rahmen-ins-leere";
  winner: Side | "both" | "none";
  events: Event2[];
  headline: string;       // ≤ 10 Wörter, du/er
  why: string;            // ≤ 20 Wörter
  focusZone: Zone | null; // UI lässt diese Zone aufleuchten
  posBefore: Pos2; topBefore: Side | null;
}

/** Engine-API (implementiert in src/core2/engine/index.ts):
 *  newMatch(opts: { seed: number; maxRounds?: number; start?: { pos: Pos2; top: Side | null; board?: Partial<Board> }; goal?: State2["goal"] }): State2
 *  roleOf(s: State2, side: Side): Role2
 *  boardFor(s: State2, side: Side): Board            // Zonen aus Sicht von side
 *  legalCards(s: State2, side: Side): { id: string; ok: boolean; reason?: string }[]   // alle Karten des Slots, gesperrte/zu schwache mit Grund
 *  playRound(s: State2, pCard: string, oCard: string): { state: State2; round: Round2 }
 *  aiChoose(s: State2, side: Side, level: 1 | 2 | 3, rng: () => number): string
 *  threats(s: State2, side: Side): { zone: Zone; cardIds: string[] }[]   // öffentliche Info: wo der Gegner gerade angreifen KANN
 */
