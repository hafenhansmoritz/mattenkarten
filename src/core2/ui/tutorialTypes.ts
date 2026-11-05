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
}
