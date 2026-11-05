// Brett, Rollen, Hilfsfunktionen.
import { ZONES, type Board, type Pos2, type Role2, type Side, type State2, type Zone } from "../types";

export const other = (s: Side): Side => (s === "p" ? "o" : "p");
/** Vorzeichen: Brettwerte sind aus Sicht von "p". */
export const sign = (s: Side): 1 | -1 => (s === "p" ? 1 : -1);
export const clampZone = (v: number): number => Math.max(-2, Math.min(2, v));

export function roleOf(s: State2, side: Side): Role2 {
  if (s.top === null) return "neutral";
  return s.top === side ? "top" : "bottom";
}

export function boardFor(s: State2, side: Side): Board {
  const k = sign(side);
  const b = {} as Board;
  for (const z of ZONES) b[z] = s.board[z] * k + 0; // +0: kein -0
  return b;
}

export function emptyBoard(): Board {
  return { kopf: 0, arme: 0, huefte: 0, beine: 0 };
}

export const ZONE_LABEL: Record<Zone, string> = { kopf: "Kopf", arme: "Arme", huefte: "Hüfte", beine: "Beine" };
export const POS_LABEL: Record<Pos2, string> = {
  stand: "Stand", clinch: "Clinch", headlock: "Front Headlock", guard: "Guard", half: "Half Guard", turtle: "Turtle",
  side: "Side Control", mount: "Mount", back: "Rücken",
};

/** Positionswert für Heuristik/Statistik (oben positiv, unten negativ). */
const POS_VALUE: Record<Pos2, number> = { stand: 0, clinch: 0, headlock: 2, guard: 1, half: 2, turtle: 4, side: 4, mount: 6, back: 7 };
export function posValue(pos: Pos2, role: Role2): number {
  if (role === "neutral") return 0;
  return role === "top" ? POS_VALUE[pos] : -POS_VALUE[pos];
}

/** Rolle → wer oben ist, aus Sicht des Handelnden. */
export function topFor(actor: Side, role: Role2): Side | null {
  if (role === "neutral") return null;
  return role === "top" ? actor : other(actor);
}

export function fmtSigned(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${-n}`;
  return "0";
}
