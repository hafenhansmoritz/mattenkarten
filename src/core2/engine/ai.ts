// KI für Kern 2. Deterministisch bei gegebenem rng.
// Stufe 1: zufällige sinnvolle Karte. Stufe 2: Heuristik. Stufe 3: + liest Gegner-Historie und Bedrohungen.
import type { Card2, Side, State2, Zone } from "../types";
import { ZONES } from "../types";
import { boardFor, other, posValue, roleOf } from "./board";
import { cardsOfSlot, checkCard, okCards, PASS, threats } from "./legal";
import { cardById } from "./registry";

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

/** Zonen, die für meine (noch gesperrten/zu schwachen) Angriffe fehlen: Zone → fehlende Punkte. */
function neededZones(s: State2, side: Side): Partial<Record<Zone, number>> {
  const b = boardFor(s, side);
  const need: Partial<Record<Zone, number>> = {};
  for (const c of cardsOfSlot(s, side)) {
    if (c.kind !== "angriff" || !c.requires) continue;
    for (const z of ZONES) {
      const r = c.requires[z];
      if (r !== undefined && b[z] < r) need[z] = Math.max(need[z] ?? 0, r - b[z]);
    }
  }
  return need;
}

/** Wie oft der Gegner zuletzt in welcher Zone gespielt hat (gewichtet, neuere stärker). */
function foeZoneHabits(s: State2, side: Side): Record<Zone, number> {
  const out: Record<Zone, number> = { kopf: 0, arme: 0, huefte: 0, beine: 0 };
  const foe = other(side);
  const h = s.history.slice(-4);
  h.forEach((r, i) => {
    const id = foe === "p" ? r.pCard : r.oCard;
    const c = cardById(id);
    if (c) out[c.zone] += 1 + i * 0.5;
  });
  return out;
}

function scoreCard(s: State2, side: Side, c: Card2, level: 2 | 3, rng: () => number): number {
  const b = boardFor(s, side);
  const role = roleOf(s, side);
  const thr = threats(s, side);
  const thrZones = new Set(thr.map((t) => t.zone));
  const mySubs = s.subs.filter((t) => t.owner === side);
  const foeSubs = s.subs.filter((t) => t.owner !== side);
  const need = neededZones(s, side);
  const habits = level === 3 ? foeZoneHabits(s, side) : null;
  let v = 0;

  if (c.kind === "angriff") {
    v += 3;
    if (c.submission) {
      const t = mySubs.find((x) => x.id === c.submission!.id);
      v += 2 + (t ? t.step * 2.5 : 0);
      if (t && t.step === 2) v += 6; // Abschluss
    }
    if (c.to) {
      const gain = posValue(c.to.pos, c.to.role) - posValue(s.pos, role);
      v += gain * 1.2 + (c.to.points ?? 0) * 0.6;
      if (role === "bottom" && c.to.role !== "bottom") v += 3; // Befreiung
      if (mySubs.some((t) => t.step >= 1) && gain <= 2) v -= 3; // laufende Aufgabe nicht wegwerfen
    }
    // Läuft der Gegner bei mir in dieselbe Zone mit Rahmen? Stufe 2: pauschales Risiko.
    v -= 0.8;
  } else if (c.kind === "aufbauen") {
    const n = need[c.zone] ?? 0;
    v += 1.5 + n * 1.5;
    if (b[c.zone] >= 2) v -= 3; // bereits voll
    if (c.alsoGain) for (const z of ZONES) if (c.alsoGain[z] && b[z] < 2) v += 0.6 + (need[z] ?? 0) * 0.8;
    if (thrZones.has(c.zone)) v -= 1.5; // dort droht ein Angriff (Angriff > Aufbauen)
  } else {
    // Rahmen: nur sinnvoll gegen Angriffe oder laufende Leisten in der Zone.
    const t = thr.find((x) => x.zone === c.zone);
    const sub = foeSubs.find((x) => x.zone === c.zone);
    if (sub) v += 3 + sub.step * 3;
    if (t) v += 2.5 + (rng() < 0.5 ? 2 : 0) + (b[c.zone] < 0 ? 1 : 0);
    if (!t && !sub) v -= 4; // Rahmen ins Leere
    v += (c.gain ?? 1) * 0.3;
  }

  if (habits) {
    const h = habits[c.zone];
    // Gegner spielte zuletzt oft in dieser Zone: Rahmen dort aufwerten, Aufbauen dort abwerten.
    if (c.kind === "rahmen" && thrZones.has(c.zone)) v += h * 0.9;
    if (c.kind === "aufbauen") v -= h * 0.3;
    if (c.kind === "angriff") {
      // Weicht in Zonen aus, in denen er selten rahmt; nutzt eigene Zonenführung (Angriff=Angriff).
      v -= h * 0.25;
      if (b[c.zone] > 0) v += 0.8;
      if (c.dilemmaOpens) v += 0.8;
    }
    // Kraft-Haushalt: teure Karten nur, wenn es sich lohnt.
    if ((c.kraft ?? 0) > 0 && !(c.submission && mySubs.some((x) => x.id === c.submission!.id && x.step === 2))) v -= (c.kraft ?? 0) * 0.3;
  }
  return v + rng() * 0.6; // leichte Streuung, deterministisch
}

export function aiChoose(s: State2, side: Side, level: 1 | 2 | 3, rng: () => number): string {
  const ok = okCards(s, side);
  if (ok.length === 0) return PASS;
  if (level === 1) {
    // Zufällig, aber sinnvoll: Rahmen ins Leere vermeiden, wenn es Alternativen gibt.
    const thrZones = new Set(threats(s, side).map((t) => t.zone));
    const subZones = new Set(s.subs.filter((t) => t.owner !== side).map((t) => t.zone));
    const sensible = ok.filter((c) => c.kind !== "rahmen" || thrZones.has(c.zone) || subZones.has(c.zone));
    return pick(sensible.length ? sensible : ok, rng).id;
  }
  let best = ok[0], bestV = -Infinity;
  for (const c of ok) {
    const v = scoreCard(s, side, c, level, rng);
    if (v > bestV) { bestV = v; best = c; }
  }
  return best.id;
}

export { checkCard };
