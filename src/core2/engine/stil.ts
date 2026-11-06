// Mechanik 5 „Spielstil-Fähigkeit“ (Spec B44–B50). Vorbild: Hero Power und Klassen (Hearthstone).
// BJJ: Jeder baut sich ein A-Game – Ringer, Guard-Spieler, Drücker, Rückenjäger –, die Grundlagen bleiben dieselben.
// Variante „zusätzlich“: Du spielst deine Karte wie immer und setzt zusätzlich deine Fähigkeit ein (2 Atem, höchstens
// einmal pro Runde, nur in den Lagen deines Stils, danach eine Runde Pause). Sie ist ein kleiner Keil (+1 in ihrer Zone),
// der NACH den Karten wirkt – das Dreieck entscheidet zuerst, die Fähigkeit macht nie eine Karte dieser Runde spielbar.
// Spielt er in derselben Runde eine Karte in ihrer Zone, hält er dagegen: sie verpufft (B45). Liegst du oben, hält nur sein
// Angriff dort dagegen – dein Gewicht drückt seinen Keil und seinen Rahmen weg (wie B3: am Boden setzt sich der Obere durch).
import type { Card2, Pos2, Role2, Side, StilId, State2, Zone } from "../types";
import { boardFor, roleOf } from "./board";
import { KONTER_COST } from "./konter";

/** Preis der Fähigkeit in Atem (zusätzlich zur Karte und zu einem Konter). */
export const STIL_COST = 2;
/** Wirkung: so viel gewinnst du in der Zone deines Stils. */
export const STIL_GAIN = 1;
/** Nach dem Einsatz so viele Runden Pause (wie die Sperre einer Karte). */
export const STIL_COOLDOWN = 1;

export interface StilPower {
  id: StilId;
  /** Name der Fähigkeit (Fachwort, wie auf der Matte). */
  power: string;
  zone: Zone;
  /** Lagen, in denen die Fähigkeit geht (aus Sicht des Stil-Spielers). */
  slots: { pos: Pos2; role: Role2 }[];
  /** Kurz: wo sie geht (für Gründe und Knopf). */
  where: string;
  /** Die Karte mit derselben Idee in derselben Zone – die Fähigkeit ist „dein Lieblings-Keil, zusätzlich“. */
  like: string;
}

/** Reihenfolge = Reihenfolge der Bosse (data/bosses.ts) und in der Stil-Wahl. */
export const STIL_POWERS: StilPower[] = [
  { id: "ringer", power: "Level Change", zone: "beine", where: "im Stand und Clinch", like: "nd_level_change",
    slots: [{ pos: "stand", role: "neutral" }, { pos: "clinch", role: "neutral" }] },
  { id: "guard", power: "Hüfte raus", zone: "huefte", where: "unten in Guard und halber Guard", like: "bot_elbow_knee",
    slots: [{ pos: "guard", role: "bottom" }, { pos: "half", role: "bottom" }] },
  // B46: auch oben in der Half Guard – Druck-Passen gehört zum A-Game des Drückers (Grapplearts, Pressure Passing System).
  { id: "druecker", power: "Schwer machen", zone: "huefte", where: "oben in der halben Guard, Seitenkontrolle und Mount", like: "mt_heavy_hips",
    slots: [{ pos: "half", role: "top" }, { pos: "side", role: "top" }, { pos: "mount", role: "top" }] },
  // B46: der Seatbelt hält ihn am Rücken – Arme +1 (JitsuIQ, Back Control: „Hooks, seatbelt grip, and chest-to-back connection“).
  { id: "ruecken", power: "Seatbelt zu", zone: "arme", where: "oben in Turtle und Rücken", like: "tt_seatbelt",
    slots: [{ pos: "turtle", role: "top" }, { pos: "back", role: "top" }] },
];
export const STIL_POWER: Record<StilId, StilPower> = Object.fromEntries(STIL_POWERS.map((p) => [p.id, p])) as Record<StilId, StilPower>;
export const STIL_IDS: StilId[] = STIL_POWERS.map((p) => p.id);

export function stilOf(s: Pick<State2, "stil">, side: Side): StilId | undefined {
  return s.stil?.[side];
}

/** Passt die Lage zur Fähigkeit von side? */
export function stilFits(s: State2, side: Side, id: StilId): boolean {
  const role = roleOf(s, side);
  return STIL_POWER[id].slots.some((sl) => sl.pos === s.pos && sl.role === role);
}

/** Runde, ab der side die Fähigkeit wieder einsetzen darf (öffentlich: Round2.stilUsed). */
export function stilReadyRound(s: Pick<State2, "history">, side: Side): number {
  for (let i = s.history.length - 1; i >= 0; i--) if (s.history[i].stilUsed?.includes(side)) return s.history[i].round + 1 + STIL_COOLDOWN;
  return 1;
}

export interface StilLegal { ok: boolean; reason?: string }

/** Darf side jetzt zusätzlich zu `playing` (und einem Konter `konter`) seine Fähigkeit einsetzen? */
export function checkStil(s: State2, side: Side, playing?: Card2 | null, konter?: Card2 | null): StilLegal {
  const id = stilOf(s, side);
  if (!id) return { ok: false, reason: "Kein Spielstil" };
  if (s.result) return { ok: false, reason: "Kampf vorbei" };
  const p = STIL_POWER[id];
  if (!stilFits(s, side, id)) return { ok: false, reason: `Nur ${p.where}` };
  const ready = stilReadyRound(s, side);
  if (s.round < ready) return { ok: false, reason: `Wieder ab Runde ${ready}` };
  if (boardFor(s, side)[p.zone] >= 2) return { ok: false, reason: "Zone schon voll (+2)" };
  const k = STIL_COST + (playing?.kraft ?? 0) + (konter ? KONTER_COST + (konter.kraft ?? 0) : 0);
  if (k > s[side].kraft) return { ok: false, reason: `Braucht ${k} Atem` };
  return { ok: true };
}

/** B45: Verpufft die Fähigkeit, weil er in ihrer Zone eine Karte spielt (`foeCard` = was bei ihm wirkte, auch ein ausgelöster
 *  Konter)? Liegt der Stil-Spieler oben (`top`), hält nur sein Angriff dagegen. */
export function stilBlockedBy(id: StilId, foeCard: Pick<Card2, "zone" | "kind"> | null | undefined, top = false): boolean {
  if (!foeCard || foeCard.zone !== STIL_POWER[id].zone) return false;
  return !top || foeCard.kind === "angriff";
}

/** Wie oft hat side in diesem Kampf seine Fähigkeit eingesetzt, und wie oft hat sie gewirkt (Zone +1)? */
export function stilStats(s: Pick<State2, "history">, side: Side): { used: number; hit: number } {
  let used = 0, hit = 0;
  for (const r of s.history) {
    if (r.stilUsed?.includes(side)) used++;
    if (r.events.some((e) => e.t === "stil" && e.side === side && e.on === "hit")) hit++;
  }
  return { used, hit };
}
