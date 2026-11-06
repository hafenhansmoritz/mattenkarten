// Kern 2 – Tutorial-Form, die ArenaK2 versteht. Tutorial-Daten werden gegen diesen Typ geschrieben.
import type { Board, Pos2, Role2, Side, Zone } from "../types";

export interface TutorialK2Step {
  /** Runde (1-basiert), in der der Schritt gilt. Fehlt sie: jede Runde (z. B. ein allgemeiner Tipp). */
  round?: number;
  /**
   * "start": einmal vor der Runde als Coach-Blase (Tippen auf OK schließt).
   * "pick":  während der Kartenwahl (bleibt stehen, bis aufgedeckt wird).
   * "after": nach dem Aufdecken unter dem Ergebnis.
   */
  when: "start" | "pick" | "after";
  /** ≤ 25 Wörter, du-Form. */
  text: string;
  /** Nur diese Karte darf gewählt werden (pulsiert in der Hand). */
  requireCard?: string;
  /** Diese Zone leuchtet auf dem Brett und in der Hand. */
  highlightZone?: Zone;
  /** Vor dem Aufdecken fragen: „Was passiert jetzt?“ (gilt für diese Runde). */
  predict?: boolean;
}

/**
 * Freischalt-Stufe der Arena (UX-Review 06.11., „Freischalten nach Tagen“) = Tag im 7-Tage-Start.
 * 2: Hüfte + Beine, nur Aufbauen/Angreifen, kein Atem, keine Phasenleiste, keine Vorhersage.
 * 3: + Rahmen, Kopf/Nacken, genau eine gegnerische Aufgabe. 4: + Arme, „Flucht“.
 * 5: + Atem („Atem 3/5“), Phasenleiste. 6: + Keil, Dilemma, Vorhersage (abschaltbar). 7 (oder fehlt): alles.
 * Versteckt heißt versteckt (nicht grau). Siehe disclosure.ts → uiFeatures.
 */
export type UiLevel = 2 | 3 | 4 | 5 | 6 | 7;

/** Gegner in der Lektion (deterministisch): Skript je Runde, Vorliebe, erlaubte Aufgaben. Zonen kommen aus der Stufe. */
export interface TutorialFoe {
  /** Karte je Runde (1-basiert), wenn spielbar und erlaubt. */
  script?: Record<number, string>;
  /** Vorliebe in Reihenfolge – die erste spielbare, erlaubte Karte wird gespielt. */
  prefer?: string[];
  /** Erlaubte gegnerische Aufgaben (IDs). Fehlt: Stufe 2 keine, sonst alle in den aktiven Zonen. Stufe 3: genau eine (Test). */
  subs?: string[];
}

export interface TutorialK2Def {
  id: string;
  title: string;
  /** Die eine Idee der Lektion (≤ 15 Wörter), z. B. "Unten im Mount: erst Ellbogen rein, dann brücken." */
  idea: string;
  /** Startlage. pos/top wie State2; board aus Sicht des Spielers "p". */
  start: { pos: Pos2; top: Side | null; board?: Partial<Board> };
  /** Ziel (wie State2.goal): Spieler gewinnt, sobald er eine dieser Lagen erreicht. */
  goal?: { pos: Pos2; role: Role2 }[];
  aiLevel: 1 | 2 | 3;
  /** Optional: Rundenzahl (Standard 8). */
  maxRounds?: number;
  /** Optional: fester Seed, damit die Lektion reproduzierbar ist. */
  seed?: number;
  steps: TutorialK2Step[];
  /**
   * Schrittweises Aufdecken des Bretts: nur diese Zonen sind in der Lektion aktiv.
   * Andere Zonen erscheinen grau mit „kommt später“, ihre Karten fehlen in der Hand (nur UI).
   * Fehlt das Feld: alle Zonen.
   */
  zones?: Zone[];
  /** In jeder Runde vor dem Aufdecken eine Vorhersage abfragen. */
  predictAll?: boolean;
  /** false: Griffe (Mechanik 2) aus – die ersten drei Lektionen führen sie noch nicht ein. */
  grips?: boolean;
  /** false: Ketten (Mechanik 3) aus – die ersten drei Lektionen erklären sie höchstens als Text. */
  chains?: boolean;
  /** false: verdeckte Konter (Mechanik 4) aus – die ersten drei Lektionen und die Zusatz-Lektion führen sie nicht ein. */
  konter?: boolean;
  /** false: Spielstil-Fähigkeit (Mechanik 5) aus – die ersten drei Lektionen und die Zusatz-Lektion; Lektionen bekommen ohnehin
   *  nur dann einen Stil, wenn der Aufrufer ihn mitgibt (Tages-Challenge nach der Stil-Wahl). */
  stil?: boolean;
  /** Freischalt-Stufe (Tag). Fehlt: 7 (alles sichtbar, wie bisher). */
  ui?: UiLevel;
  /** Deterministischer Lektions-Gegner (zusätzlich zum festen Seed). */
  foe?: TutorialFoe;
}
