// Kern 2 – Spielstile (Mechanik 5, Spec B44–B50): Texte, Kartenbild, Quellen und das A-Game-Profil der KI.
// Die Regeln der Fähigkeit stehen in engine/stil.ts (STIL_POWERS) – hier nur, was Anfänger lesen.
// Quellen (per WebFetch geprüft, 2026-11-06):
//  - Evolve MMA, Guard Passers vs Guard Players: „Making a conscious decision about whether you want to focus on passing the
//    guard or playing guard“ – „it is important for every player to learn the basics“.
//  - JitsuIQ, Level Changes: „Level changes are essential for executing takedowns“.
//  - Evolve MMA, How To Use Shrimping In BJJ: Shrimping is „often used to create angles for guard attacks“.
//  - Grapplearts, The Pressure Passing System: „It's not about the amount of weight that you have, it's how you use it.“
//  - JitsuIQ, Back Control: „Use your Hooks, seatbelt grip, and chest-to-back connection to keep the opponent from escaping.“
import type { AiStyle } from "../engine/ai";
import { STIL_IDS, STIL_POWER } from "../engine/stil";
import type { Pos2, Side, StilId } from "../types";
import { BOSS } from "./bosses";

type Src = { title: string; url: string };

export const STIL_SRC = {
  agame: { title: "Evolve MMA – Guard Passers vs Guard Players: A Guide To Picking Your BJJ Style", url: "https://evolve-mma.com/blog/guard-passers-vs-guard-players-a-guide-to-picking-your-bjj-style/" },
  level: { title: "JitsuIQ – Level Changes", url: "https://jitsuiq.com/movement-mechanics/level-changes.html" },
  shrimp: { title: "Evolve MMA – How To Use Shrimping In BJJ To Create Space And Escape", url: "https://evolve-mma.com/blog/how-to-use-shrimping-in-bjj-to-create-space-and-escape/" },
  pressure: { title: "Grapplearts – The Pressure Passing System", url: "https://www.grapplearts.com/the-pressure-passing-system/" },
  hooks: { title: "JitsuIQ – Back Control", url: "https://jitsuiq.com/positions/back/back-control.html" },
} satisfies Record<string, Src>;

export interface StilDef {
  id: StilId;
  /** Name des Stils (wie der Boss, ohne Artikel). */
  name: string;
  /** Untertitel (≤ 5 Wörter). */
  tagline: string;
  /** „Dein A-Game“: was du in diesem Stil gern machst (≤ 20 Wörter, du-Form). */
  agame: string;
  /** Was die Fähigkeit tut (≤ 12 Wörter). */
  powerDo: string;
  /** „Warum das im echten Grappling so ist“ (≤ 20 Wörter). */
  bjj: string;
  source?: Src;
  check?: boolean;
  /** Kartenbild: Lieblingslage (Spieler = "p"). */
  scene: { pos: Pos2; top: Side | null };
}

export const STILE: StilDef[] = [
  {
    id: "ringer", name: "Ringer", tagline: "Kampf im Stand",
    agame: "Du kämpfst im Stand: tief gehen, schießen, oben landen.",
    powerDo: "Beine +1 im Stand und im Clinch.",
    bjj: "Tief gehen ist die Grundlage jedes Takedowns: erst die Hüfte runter, dann der Schritt rein.",
    source: STIL_SRC.level, scene: { pos: "stand", top: null },
  },
  {
    id: "guard", name: "Guard-Spieler", tagline: "Gefährlich von unten",
    agame: "Du kämpfst gern von unten: Hüfte bewegen, Winkel holen, dann sweepen oder beenden.",
    powerDo: "Hüfte +1 unten in Guard und Half Guard.",
    bjj: "Rutschst du mit der Hüfte raus, bekommst du den Winkel für Sweeps und Aufgaben aus der Guard.",
    source: STIL_SRC.shrimp, scene: { pos: "guard", top: "o" },
  },
  {
    id: "druecker", name: "Drücker", tagline: "Schwer von oben",
    agame: "Du kommst nach oben und drückst: Gewicht auf seine Hüfte, vorbei, dann beenden.",
    powerDo: "Hüfte +1 oben in Half Guard, Side Control und Mount.",
    bjj: "Druck kommt nicht von Masse: Wer sein Gewicht genau auf die Hüfte legt, wird schwer.",
    source: STIL_SRC.pressure, scene: { pos: "side", top: "p" },
  },
  {
    id: "ruecken", name: "Rückenjäger", tagline: "Immer hinter ihm",
    agame: "Du willst hinter ihn: Turtle, Seatbelt, Haken rein – dann der Würger von hinten.",
    powerDo: "Arme +1 oben in Turtle und Rücken.",
    bjj: "Mit Seatbelt, Haken und Brust an seinem Rücken kommt er nicht weg – dann erst der Würger.",
    source: STIL_SRC.hooks, scene: { pos: "back", top: "p" },
  },
];
export const STIL: Record<StilId, StilDef> = Object.fromEntries(STILE.map((x) => [x.id, x])) as Record<StilId, StilDef>;

/** Name der Fähigkeit (aus der Engine). */
export const powerName = (id: StilId): string => STIL_POWER[id].power;

/** B47: so stark gewichtet die Stil-KI die Abschlüsse ihres Stils (× Aufgaben-Gewicht des passenden Bosses). */
export const STIL_AI_SUBS = 2;
/** B47: A-Game der KI in freien Matches – sie bevorzugt die Abschlüsse ihres Stils (Aufgaben-Gewichte des passenden Bosses).
 *  Bosse selbst spielen mit ihrem vollen Profil (data/bosses.ts). */
export function stilAi(id: StilId): AiStyle {
  return { subs: Object.fromEntries(Object.entries(BOSS[id].style.subs ?? {}).map(([k, v]) => [k, (v ?? 0) * STIL_AI_SUBS])) };
}

/** Freies Match: der Gegner bekommt einen zufälligen Stil (rng in [0, 1)). */
export function randomStil(rng: () => number): StilId {
  return STIL_IDS[Math.floor(rng() * STIL_IDS.length) % STIL_IDS.length];
}

/** Stile für ein Match: in Lektionen mit `stil: false` keine; ein Boss spielt immer seinen eigenen Stil (B48). */
export function matchStil(o: { tutorial?: { stil?: boolean }; stil?: StilId; foeStil?: StilId; bossId?: StilId }): Partial<Record<Side, StilId>> | undefined {
  if (o.tutorial?.stil === false) return undefined;
  const foe = o.bossId ?? (o.tutorial ? undefined : o.foeStil);
  return o.stil || foe ? { p: o.stil, o: foe } : undefined;
}

// ---------------- Gewählter Stil (localStorage) ----------------
export const STIL_KEY = "mk.k2.stil";

export function readStil(): StilId | null {
  try {
    const v = localStorage.getItem(STIL_KEY);
    return v && (STIL_IDS as string[]).includes(v) ? (v as StilId) : null;
  } catch { return null; }
}
export function writeStil(id: StilId): void {
  try { localStorage.setItem(STIL_KEY, id); } catch { /* privat oder voll – dann eben nur in dieser Sitzung */ }
}
