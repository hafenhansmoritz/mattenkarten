// Vertrag zwischen Client (src/coach) und Server (api/coach.ts).
// Bewusst ohne Imports, damit api/ diese Datei als reinen Typ-Import nutzen kann.

export type CoachMode = "chat" | "analysis";

export interface CoachMessage {
  role: "user" | "assistant";
  content: string;
}

/** Kompakte Match-Zusammenfassung für die Analyse (alles schon in Alltagssprache). */
export interface CoachMatchSummary {
  /** "sieg" | "niederlage" | "unentschieden" */
  outcome: "sieg" | "niederlage" | "unentschieden";
  /** z. B. "Aufgabegriff: Armhebel (Armbar)" oder "Punkte 4:2" */
  how: string;
  opponent?: string;
  turns: number;
  points: { me: number; them: number };
  /** Ein Satz pro Zug, max. ~12 Züge: "Zug 3, Auf Abstand: Du Beine schnappen, er Beine zurückwerfen – er gewinnt." */
  moments: string[];
  /** Erkenntnisse aus recap().lessons */
  lessons: string[];
  /** Entscheidender Moment aus recap().decisive */
  decisive?: string;
  /** Karten-ids, die der Spieler üben sollte (z. B. recap().mistakes[].better) */
  practice: string[];
}

export interface CoachRequest {
  mode: CoachMode;
  messages?: CoachMessage[];
  match?: CoachMatchSummary;
}

/** Fehlercodes des Servers ({ error: code }). */
export type CoachErrorCode =
  | "no_key" | "bad_request" | "too_many_messages" | "message_too_long" | "forbidden_origin"
  | "rate_limited" | "upstream" | "method_not_allowed";

export interface CoachStatus {
  ok: boolean;
  hasKey: boolean;
}

/** Limits (Server prüft, Client kürzt vorab). */
export const COACH_LIMITS = { maxMessages: 12, maxChars: 4000 } as const;
