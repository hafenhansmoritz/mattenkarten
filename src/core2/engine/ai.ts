// KI für Kern 2. Deterministisch bei gegebenem rng.
// Stufe 1: zufällige sinnvolle Karte. Stufe 2: Heuristik. Stufe 3: + liest Gegner-Historie und Bedrohungen.
import type { Card2, Side, State2, Zone } from "../types";
import { ZONES } from "../types";
import { boardFor, other, posValue, roleOf } from "./board";
import { cardsOfSlot, checkCard, okCards, PASS, threats } from "./legal";
import { cardById } from "./registry";
import { resolveRound } from "./resolve";

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
    // Mit Wahrscheinlichkeit verteidigen (sonst spiegeln sich zwei KIs in Rahmen=Rahmen-Patts).
    if (t) v += 1 + (rng() < 0.4 ? 3 : 0) + (b[c.zone] < 0 ? 1 : 0) + (t.cardIds.some((id) => cardById(id)?.to?.points) ? 0.5 : 0);
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
  if (level === 3) return lookahead(s, side, ok, rng);
  let best = ok[0], bestV = -Infinity;
  for (const c of ok) {
    const v = scoreCard(s, side, c, level, rng);
    if (v > bestV) { bestV = v; best = c; }
  }
  return best.id;
}

/** Bewertung eines Zustands aus Sicht von side. */
export function evaluate(s: State2, side: Side): number {
  const foe = other(side);
  if (s.result) {
    const w = s.result.winner;
    return w === side ? 1000 : w === foe ? -1000 : 0;
  }
  const b = boardFor(s, side);
  let v = (s[side].pts - s[foe].pts) * 4 + posValue(s.pos, roleOf(s, side)) * 2.5;
  for (const z of ZONES) v += b[z] * 1.2;
  for (const t of s.subs) v += (t.owner === side ? 1 : -1) * t.step * t.step * 3;
  v += (s[side].kraft - s[foe].kraft) * 0.3;
  // Offensive Optionen (eigene ok-Angriffe) zählen, gegnerische Bedrohungen kosten.
  v += okCards(s, side).filter((c) => c.kind === "angriff").length * 0.8;
  v -= okCards(s, foe).filter((c) => c.kind === "angriff").length * 0.8;
  return v;
}

/** Gegnermodell für Stufe 3: Heuristik-Werte des Gegners, verschoben durch seine Zonen-Gewohnheiten. */
function foeModel(s: State2, side: Side, rng: () => number): { card: Card2; w: number }[] {
  const foe = other(side);
  const ok = okCards(s, foe);
  const hab = foeZoneHabits(s, side);
  const sc = ok.map((c) => scoreCard(s, foe, c, 2, rng) + hab[c.zone] * 0.4);
  const max = Math.max(...sc);
  const ws = sc.map((x) => Math.exp((x - max) / 1.5));
  const sum = ws.reduce((a, b) => a + b, 0);
  return ok.map((card, i) => ({ card, w: ws[i] / sum }));
}

/** Stufe 3: eine Runde vorausrechnen gegen das Gegnermodell (liest Historie, Sperren und threats). */
function lookahead(s: State2, side: Side, ok: Card2[], rng: () => number): string {
  const model = foeModel(s, side, rng);
  let best = ok[0], bestV = -Infinity;
  for (const c of ok) {
    let ev = 0;
    if (model.length === 0) ev = evaluate(resolveRound(s, side === "p" ? c.id : PASS, side === "p" ? PASS : c.id).state, side);
    for (const { card, w } of model) {
      const [pc, oc] = side === "p" ? [c.id, card.id] : [card.id, c.id];
      ev += w * evaluate(resolveRound(s, pc, oc).state, side);
    }
    ev += rng() * 0.3;
    if (ev > bestV) { bestV = ev; best = c; }
  }
  return best.id;
}

export { checkCard };
