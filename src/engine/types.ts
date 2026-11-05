// ============================================================
// Mattenkarten – zentrale Typen (Vertrag zwischen Engine, Daten und UI)
// ============================================================

/** Die sieben Positionen der Kampfkette. */
export type PositionId = "dist" | "clinch" | "fhl" | "guard" | "side" | "mount" | "back";

/** Rolle eines Kämpfers in einer Position. Neutrale Positionen (dist, clinch) haben nur "neutral". */
export type Role = "neutral" | "top" | "bottom";

/** Die fünf Glieder der Kampfkette (UI zeigt sie als Leiste). */
export type ChainStep = 1 | 2 | 3 | 4 | 5; // 1 Distanz, 2 Clinch, 3 Takedown/Landung, 4 Kontrolle, 5 Submission

export type Side = "p" | "o"; // Spieler / Gegner

/** Kartentyp im Dreieck: Angriff > Setup > Reaktion > (passender) Angriff. */
export type CardKind = "angriff" | "setup" | "reaktion";

export type Rarity = "basis" | "selten" | "episch" | "legendaer";

/**
 * Tags beschreiben Angriffsfamilien. Reaktionen kontern nur die Tags in `counters`.
 * Das ist der Lerninhalt: Sprawl kontert "shot", nicht "hip".
 */
export type Tag =
  | "strike" | "shot" | "single" | "legs" | "clinch" | "snap" | "drag"
  | "bodylock" | "hip" | "reap" | "escape" | "bridge" | "sweep" | "pass"
  | "advance" | "choke" | "armlock" | "shoulderlock" | "trianglechoke" | "behind";

/** Wo eine Karte gespielt werden darf. */
export interface Slot { pos: PositionId; role: Role }

/** Ergebnis-Position nach Erfolg, aus Sicht des Spielers der Karte. */
export interface Outcome {
  pos: PositionId;
  role: Role;        // Rolle des Kartenspielers danach
  points?: number;   // IBJJF-Punkte für den Kartenspieler
  controlSelf?: number;   // Kontrolle des Spielers danach (Default 1 bei Positionswechsel nach oben, sonst 0)
}

export interface CardDef {
  id: string;
  name: string;              // Fachbegriff (EN/JP)
  de?: string;               // deutscher Untertitel
  kind: CardKind;
  rarity: Rarity;
  basic?: boolean;           // Grundtechnik: immer verfügbar, nicht im Deck
  slots: Slot[];             // wo spielbar
  tags?: Tag[];              // Angriffsfamilie (nur angriff)
  counters?: Tag[];          // was diese Reaktion kontert (nur reaktion)
  tempo?: number;            // 1 (schnell) … 5 (langsam); entscheidet Angriff vs. Angriff
  gas: number;               // Ausdauerkosten
  requiresControl?: number;  // Mindest-Kontrolle des Spielers
  /** Angriff: Erfolg → neue Position. Fehlt bei Submissions. */
  success?: Outcome;
  /** Angriff wurde gekontert → Strafe/Folgeposition für den Angreifer (Default: bleibt, Kontrolle -1). */
  onCountered?: Outcome;
  /** Reaktion: wenn sie greift → Folgeposition aus Sicht des Reagierenden (Default: bleibt). */
  onCounter?: Outcome;
  submission?: boolean;      // Angriff gewinnt das Match bei Erfolg (Tap)
  /** Setup: Kontrollgewinn (Default 1). */
  controlGain?: number;
  /** Setup gibt "Öffnung": nächster eigener Angriff mit diesem Tag ist 2 Tempo schneller und ignoriert Reaktionen mit `opensAgainst`. */
  opening?: { tags: Tag[] };
  /** Gegner verliert Gas (Strikes, Druck). */
  drainGas?: number;
  /** Danaher-Dilemma: Partnerkarte. Wurde die Partnerkarte im letzten eigenen Zug gekontert,
   *  ignoriert diese Karte jetzt die Reaktion, mit der gekontert wurde. */
  dilemmaWith?: string;
  /** (ergänzt) Setup: IBJJF-Rückenpunkte, wenn die Hooks sitzen – nur einmal pro Back-Phase (siehe MatchState.backPointsAwarded). */
  backPoints?: number;
  /** (ergänzt) Lernsatz für die Arena, wenn diese Karte im Reveal entscheidet (v. a. Reaktionen). */
  lesson?: string;
  /** (Neulinge) Alltagstitel, groß auf der Karte, z. B. "Beine schnappen". */
  plain?: string;
  /** (Neulinge) Ein Satz, was passiert, ohne Fachbegriffe (max. ~12 Wörter). */
  plainDo?: string;
  /** Lerninhalt */
  desc: string;
  keys: string[];
  mistakes: string[];
  safety?: string;
  source?: { title: string; url: string };
  check?: boolean;           // ohne Primärquelle – Trainer prüfen lassen
}

export interface FighterState {
  pts: number;
  gas: number;
  control: number;          // 0..5
  deck: string[];           // Kartenids (Ziehstapel)
  hand: string[];
  discard: string[];
  opening: Tag[] | null;    // aktive Öffnung
  lastPlayed: string | null;
  lastCounteredBy: Tag[] | null; // Tags der Reaktion, die meine letzte Karte gekontert hat
  history: CardKind[];      // gespielte Kartentypen (für KI-Reads)
}

export interface MatchState {
  pos: PositionId;
  top: Side | null;         // wer oben ist (null = neutral)
  turn: number;             // 1-basiert
  maxTurns: number;
  p: FighterState;
  o: FighterState;
  log: LogEntry[];
  result: MatchResult | null;
  backPointsAwarded: Record<Side, boolean>; // Hooks-Punkte nur einmal pro Back-Phase
  /** (Lern-Ebene) Protokoll jedes Zugs für Rückblick, Replay und Fehler-Deck. */
  history?: TurnRecord[];
  /** (Tutorial) Optionen, mit denen das Match erstellt wurde. */
  options?: MatchOptions;
}

/** Ein gespielter Zug – Grundlage für Rückblick, Replay des entscheidenden Moments und Fehler-Deck. */
export interface TurnRecord {
  turn: number;
  pos: PositionId;          // Position VOR dem Aufdecken
  top: Side | null;
  pCard: string;
  oCard: string;
  rule: RevealOutcome["rule"];
  winner: RevealOutcome["winner"];
  headline: string;
  lesson?: string;
  pPlayable: string[];      // was der Spieler hätte spielen können
  ptsBefore: Record<Side, number>;
  ptsAfter: Record<Side, number>;
  posAfter: PositionId;
  topAfter: Side | null;
}

export interface MatchOptions {
  startPos?: PositionId;
  startTop?: Side | null;
  handSize?: number;          // Neulinge: 3
  /** Tutorial: Gegner spielt nur Karten dieses Typs (falls möglich). */
  scriptedKind?: CardKind;
  /** Tutorial: Ressourcen ausblenden/ignorieren (kein Gas-Verbrauch, keine Kontrolle nötig). */
  noResources?: boolean;
  /** Tutorial-Siegbedingung: Spieler gewinnt, sobald diese Position (aus seiner Sicht) erreicht ist. */
  winAt?: { pos: PositionId; role: Role }[];
  /** Tutorial: Spieler-Hand ist fest (wird jede Runde wiederhergestellt). */
  fixedHand?: string[];
}

/** Coach-Tipp in drei Stufen (Hinweis → Karte markieren → Zug mit Begründung). */
export interface Hint { level: 1 | 2 | 3; text: string; cardId?: string }

/** Fehler-Situation für das Fehler-Deck (Abrufübung). */
export interface Mistake {
  id: string;               // stabil: pos+role+oCard
  pos: PositionId;
  role: Role;
  oCard: string;            // was der Gegner spielte
  pCard: string;            // was du spieltest
  better: string;           // Karte, die gewonnen hätte
  why: string;              // ein Satz, Alltagssprache
}

export interface Recap {
  lessons: string[];        // max. 3 Erkenntnisse aus diesem Match
  decisive?: { record: TurnRecord; better?: string; why: string };
  mistakes: Mistake[];
}

/** Steckbrief einer Position für Neulinge. */
export interface PositionGuide {
  pos: PositionId;
  plain: string;            // Alltagsname, z. B. "Draufsitzen"
  term: string;             // Fachbegriff, z. B. "Mount"
  oneLiner: string;         // Was ist das? 1 Satz
  goal: Partial<Record<Role, string>>;   // Ziel je Rolle, kurz ("Raus hier!")
  danger?: Partial<Record<Role, string>>;
  rank: Partial<Record<Role, number>>;   // -4 (schlecht) … 5 (super)
}

export interface LogEntry { turn: number; text: string; who: Side | "sys" }

export type MatchResult =
  | { type: "submission"; winner: Side; card: string }
  | { type: "points"; winner: Side | null }; // null = Unentschieden

/** Was ein Reveal ausgelöst hat – die UI animiert daraus. */
export interface RevealOutcome {
  pCard: string;
  oCard: string;
  winner: Side | "both" | "none"; // wessen Karte hat gewirkt
  rule: "angriff>setup" | "setup>reaktion" | "reaktion>angriff" | "tempo" | "scramble" | "beide-setup" | "patt" | "durch";
  events: RevealEvent[];
  headline: string;         // kurzer Satz für die Arena, z. B. "Sprawl! Double Leg gekontert."
  lesson?: string;          // Lernsatz, z. B. "Sprawl kontert Beinangriffe – nicht Würfe."
}

export type RevealEvent =
  | { t: "move"; pos: PositionId; top: Side | null }
  | { t: "points"; side: Side; n: number }
  | { t: "control"; side: Side; delta: number }
  | { t: "gas"; side: Side; delta: number }
  | { t: "opening"; side: Side }
  | { t: "dilemma"; side: Side }
  | { t: "submission"; side: Side; card: string }
  | { t: "submissionDefended"; side: Side; card: string };

/** KI-Gegner */
export interface Archetype {
  id: string;
  name: string;
  title: string;            // z. B. "Ringer"
  belt: BeltId;
  blurb: string;
  deck: string[];           // 20 Kartenids
  /** Vorlieben je Tag/Typ, 0..2 */
  likes: Partial<Record<Tag | CardKind, number>>;
  /** 0..1 – wie oft die KI auf dein Muster reagiert (Yomi-Stufe) */
  reads: number;
  /** 0..1 – wie oft die Absicht angezeigt wird (Telegraph, sinkt mit Gürtel) */
  telegraph: number;
  reward: string[];         // freigeschaltete Karten bei Sieg
  boss?: boolean;
  /** (ergänzt) Geführter Tutorial-Kampf 1–3 in Weiß: (1) Dreieck & Takedown, (2) Reaktion & Tags, (3) Kontrolle & Submission. */
  tutorial?: 1 | 2 | 3;
}

export type BeltId = "weiss" | "blau" | "lila" | "braun" | "schwarz";
