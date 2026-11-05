// Spielbarkeit von Karten und öffentliche Bedrohungen.
import type { Card2, Side, State2, Zone } from "../types";
import { ZONES } from "../types";
import { boardFor, fmtSigned, other, roleOf, ZONE_LABEL } from "./board";
import { slotCards } from "./registry";

/** Platzhalter, wenn eine Seite keine spielbare Karte hat (Slot leer oder alles gesperrt). */
export const PASS = "pass";

export interface Legal { id: string; ok: boolean; reason?: string }

export function cardsOfSlot(s: State2, side: Side): Card2[] {
  return slotCards(s.pos, roleOf(s, side));
}

export function unmetRequires(s: State2, side: Side, c: Card2): string[] {
  if (!c.requires) return [];
  const b = boardFor(s, side);
  const out: string[] = [];
  for (const z of ZONES) {
    const need = c.requires[z];
    if (need !== undefined && b[z] < need) out.push(`${ZONE_LABEL[z]} ${fmtSigned(need)}`);
  }
  return out;
}

/** Aufgabe-Karte bleibt spielbar, solange ihre eigene Leiste läuft (Griff fortsetzen). */
export function continuesHold(s: State2, side: Side, c: Card2): boolean {
  return !!c.submission && s.subs.some((t) => t.owner === side && t.id === c.submission!.id && t.step > 0);
}

export function checkCard(s: State2, side: Side, c: Card2): Legal {
  if (s[side].locked.includes(c.id) && !continuesHold(s, side, c)) return { id: c.id, ok: false, reason: "Gesperrt (gerade gespielt)" };
  const unmet = unmetRequires(s, side, c);
  if (unmet.length) return { id: c.id, ok: false, reason: `Braucht ${unmet.join(", ")}` };
  const k = c.kraft ?? 0;
  if (k > s[side].kraft) return { id: c.id, ok: false, reason: `Braucht ${k} Kraft` };
  return { id: c.id, ok: true };
}

export function legalCards(s: State2, side: Side): Legal[] {
  return cardsOfSlot(s, side).map((c) => checkCard(s, side, c));
}

export function okCards(s: State2, side: Side): Card2[] {
  return cardsOfSlot(s, side).filter((c) => checkCard(s, side, c).ok);
}

/** Öffentliche Info: Zonen, in denen der GEGNER von `side` gerade angreifen kann. */
export function threats(s: State2, side: Side): { zone: Zone; cardIds: string[] }[] {
  const foe = other(side);
  const by = new Map<Zone, string[]>();
  for (const c of okCards(s, foe)) {
    if (c.kind !== "angriff") continue;
    by.set(c.zone, [...(by.get(c.zone) ?? []), c.id]);
  }
  return ZONES.filter((z) => by.has(z)).map((z) => ({ zone: z, cardIds: by.get(z)! }));
}
