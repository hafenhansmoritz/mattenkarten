// Schritt 59: Trainer-Modus – Beamer/Tablet-Ansicht. Reine Logik (testbar): Tasten → Aktion, Folien aus Lektion oder Spiel.
// Präsentations-Clicker senden meist PageDown/PageUp (manche auch Pfeiltasten, „b“ oder „.“ für Schwarzbild).
import type { Pos2, Side, Zone } from "../core2/types";
import type { TutorialK2Def } from "../core2/ui/tutorialTypes";
import { POS_LABEL } from "../journey/recommend";
import { durationLabel, intensityLabel, TRAINER_LABEL, type PositionalGame } from "./games";

export type KeyAction = "next" | "prev" | "first" | "last" | "fullscreen" | "blank" | "exit";

export interface KeyLike {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  /** Tag-Name des Ziels (INPUT, TEXTAREA …) – dort keine Folien-Steuerung. */
  targetTag?: string;
  repeat?: boolean;
}

/** Taste → Aktion. `null` = nicht unsere Taste (Browser macht weiter). */
export function keyAction(e: KeyLike): KeyAction | null {
  if (e.altKey || e.ctrlKey || e.metaKey) return null;
  const tag = (e.targetTag ?? "").toUpperCase();
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return null;
  switch (e.key) {
    case "ArrowRight": case "ArrowDown": case "PageDown": case " ": case "Spacebar": case "n": case "N":
      return "next";
    case "ArrowLeft": case "ArrowUp": case "PageUp": case "p": case "P":
      return "prev";
    case "Home": return "first";
    case "End": return "last";
    case "f": case "F": case "F5": return "fullscreen";
    case "b": case "B": case ".": return "blank";
    case "Escape": return "exit";
    default: return null;
  }
}

/** Neue Folien-Nummer nach einer Aktion (bleibt in 0 … n−1). */
export function stepIndex(i: number, n: number, a: KeyAction): number {
  if (n <= 0) return 0;
  const c = Math.min(Math.max(i, 0), n - 1);
  if (a === "next") return Math.min(c + 1, n - 1);
  if (a === "prev") return Math.max(c - 1, 0);
  if (a === "first") return 0;
  if (a === "last") return n - 1;
  return c;
}

export interface Slide {
  kicker: string;
  title: string;
  text?: string;
  /** Kurze Punkte (z. B. Regeln). */
  bullets?: string[];
  pos: Pos2;
  top: Side | null;
  zone?: { side: Side; zone: Zone } | null;
  /** Gelbe Leiste unten (Sicherheit). */
  safety?: string;
  badge?: string;
}

export type TrainerSource = { kind: "lesson"; lesson: TutorialK2Def } | { kind: "game"; game: PositionalGame };

export function slidesFor(src: TrainerSource): Slide[] {
  if (src.kind === "lesson") {
    const l = src.lesson;
    const base = { pos: l.start.pos, top: l.start.top };
    const out: Slide[] = [{ ...base, kicker: `Lektion · ${POS_LABEL[l.start.pos]}`, title: l.title, text: l.idea }];
    // Schritte in Reihenfolge der Runden; Hervorhebung immer bei Blau (du).
    for (const s of l.steps) {
      out.push({
        ...base,
        kicker: s.round ? `Runde ${s.round}` : "Tipp",
        title: s.requireCard ? "Zeig das" : s.when === "after" ? "Was ist passiert?" : "Worum geht's?",
        text: s.text,
        zone: s.highlightZone ? { side: "p", zone: s.highlightZone } : null,
      });
    }
    out.push({ ...base, kicker: "Jetzt ihr", title: "Langsam üben, dann tauschen", text: l.idea, safety: "Abklopfen heißt sofort loslassen. Bei Schmerz: Stopp." });
    return out;
  }
  const g = src.game;
  const base = { pos: g.pos, top: g.top, badge: TRAINER_LABEL };
  return [
    { ...base, kicker: `Positionsspiel · ${POS_LABEL[g.pos]}`, title: g.title, text: g.idea, safety: g.safety },
    { ...base, kicker: `Blau · ${g.a.role}`, title: "Dein Ziel", text: g.a.goal, zone: null },
    { ...base, kicker: `Rot · ${g.b.role}`, title: "Dein Ziel", text: g.b.goal, zone: null },
    { ...base, kicker: "Regeln", title: "So spielen wir", bullets: g.rules, safety: g.safety },
    { ...base, kicker: `${intensityLabel(g)} · ${durationLabel(g)}`, title: "Ruhig und kontrolliert", bullets: g.cues, safety: "Abklopfen heißt sofort loslassen. Wer Stopp ruft, hat Vorrang." },
  ];
}
