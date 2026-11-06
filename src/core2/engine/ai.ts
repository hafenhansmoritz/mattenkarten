// KI für Kern 2. Deterministisch bei gegebenem rng.
// Stufe 1: zufällige sinnvolle Karte. Stufe 2: Heuristik. Stufe 3: + liest Gegner-Historie und Bedrohungen.
import type { Card2, Side, State2, Zone } from "../types";
import { ZONES } from "../types";
import { boardFor, other, posValue, roleOf } from "./board";
import { cardsOfSlot, checkCard, okCards, PASS, threats, unmetRequires } from "./legal";
import { cardById } from "./registry";
import { breakable, gripsOf } from "./grips";
import { resolveRound } from "./resolve";
import { chainFrom } from "./chains";

/** B28 Boss-Spielstil: Gewichte, die auf Stufe 2/3 aufgeschlagen werden (siehe data/bosses.ts). */
export interface AiStyle {
  /** Bonus für die Lage nach der Runde, Schlüssel "pos/role" aus Sicht des Bosses (z. B. "headlock/top", "guard/bottom"). */
  pos?: Partial<Record<string, number>>;
  /** Bonus für das Spielen einer Karte (Karten-ID). */
  cards?: Partial<Record<string, number>>;
  /** Bonus je Schritt einer eigenen Aufgabe-Leiste (Aufgabe-ID, z. B. "rnc"). */
  subs?: Partial<Record<string, number>>;
  /** Mechanik 2: Bonus für einen liegenden eigenen Griff (Griff-ID, z. B. "seatbelt") – Signatur-Griffe der Bosse. */
  grips?: Partial<Record<string, number>>;
  /** Mechanik 3: Bonus für eine bereite Signatur-Kette (Karten-ID der Ketten-Karte, z. B. "gb_triangle"). */
  chains?: Partial<Record<string, number>>;
}

/** Stilwert einer Lage aus Sicht von side: Positionsvorliebe + eigene Aufgaben-Schritte. */
export function styleValue(s: State2, side: Side, st: AiStyle): number {
  let v = st.pos?.[`${s.pos}/${roleOf(s, side)}`] ?? 0;
  for (const t of s.subs) if (t.owner === side) v += (st.subs?.[t.id] ?? 0) * t.step;
  for (const g of gripsOf(s, side)) v += st.grips?.[g.id] ?? 0;
  return v;
}

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

/** B15 Stufe 2 „Offene Tür“: Bonus für einen Positionsangriff, wenn der Gegner in dieser Zone gerade keinen Rahmen hat. */
const OPEN_DOOR = 3;
/** B15 Stufe 2 „Position halten“: Rahmen gegen eine drohende Flucht aus Side Control, Mount, Rücken oder Turtle (oben). */
const HOLD_BONUS = 1.5;
/** B15 Stufe 2 „Keile“: Aufbauen, das einem gegnerischen Positionsangriff die Voraussetzung nimmt. */
const WEDGE_BONUS = 2;
/** B16 Stufe 2 „Konter-Wechsel“: Rahmen mit onStop (Sprawl) gegen drohende Shots aufwerten, Shots in einen solchen Rahmen abwerten. */
const COUNTER_BONUS = 3;
const COUNTER_RISK = 1;
/** Mechanik 2 (B31–B34): Griff legen, Griff lösen (alle Stufen ab 2, auch im Gegnermodell von Stufe 3). */
const GRIP_PLACE = 1.2;
const GRIP_PUMMEL = 0.8;
const GRIP_BREAK = 2;
const GRIP_BREAK_KEY = 1.5;
/** Rahmen, der einen Griff löst, geht nicht ins Leere: hebt den Leere-Abzug (−4) auf. */
const GRIP_BREAK_FRAME = 4;
const GRIP_FRAME_HIT = 1;
/** Mechanik 3 (B37): bereite Kette spielen (Stufe 2 und Gegnermodell von Stufe 3). */
const CHAIN_READY = 3;
/** Stufe 3: Wert eines liegenden Griffs in der Bewertung. */
const GRIP_EVAL = 1.5;

/** progress: Stufe-2-Regeln für Positionsfortschritt (B15). Das Gegnermodell von Stufe 3 bleibt bei der alten Heuristik. */
function scoreCard(s: State2, side: Side, c: Card2, level: 2 | 3, rng: () => number, progress = level === 2): number {
  const b = boardFor(s, side);
  const role = roleOf(s, side);
  const thr = threats(s, side);
  const thrZones = new Set(thr.map((t) => t.zone));
  const mySubs = s.subs.filter((t) => t.owner === side);
  const foeSubs = s.subs.filter((t) => t.owner !== side);
  const need = neededZones(s, side);
  const habits = level === 3 ? foeZoneHabits(s, side) : null;
  const foeOk = okCards(s, other(side));
  let v = 0;

  if (c.kind === "angriff") {
    v += 3;
    if (c.submission) {
      const t = mySubs.find((x) => x.id === c.submission!.id);
      v += 2 + (t ? t.step * 2.5 : 0);
      // Offene Zone: er hat dort gerade keinen Rahmen (gesperrt oder keiner im Slot).
      if (!okCards(s, other(side)).some((x) => x.kind === "rahmen" && x.zone === c.zone)) v += 3;
      if (t && t.step === 2) v += 6; // Abschluss
    }
    if (c.to) {
      const gain = posValue(c.to.pos, c.to.role) - posValue(s.pos, role);
      v += gain * 1.2 + (c.to.points ?? 0) * 0.6;
      if (role === "bottom" && c.to.role !== "bottom") v += 3; // Befreiung
      if (mySubs.some((t) => t.step >= 1) && gain <= 2) v -= 3; // laufende Aufgabe nicht wegwerfen
      // Offene Tür: sein Rahmen in dieser Zone ist gerade gesperrt (eben gespielt) – jetzt vorbei.
      if (progress && gain > 0 && !foeOk.some((x) => x.kind === "rahmen" && x.zone === c.zone)) v += OPEN_DOOR;
    }
    // Läuft der Gegner bei mir in dieselbe Zone mit Rahmen? Stufe 2: pauschales Risiko.
    v -= 0.8;
    // B16 Konter-Wechsel: hat er dort einen Rahmen mit Positionswechsel (Sprawl → Front Headlock), kostet ein gestoppter Shot die Position.
    if (progress && c.to && foeOk.some((x) => x.kind === "rahmen" && x.zone === c.zone && x.onStop && !unmetRequires(s, other(side), { ...x, requires: x.onStopRequires }).length)) v -= COUNTER_RISK;
    // Gerangel droht: er kann in derselben Zone angreifen und keiner liegt vorne.
    if (thrZones.has(c.zone) && b[c.zone] === 0) v -= 2;
  } else if (c.kind === "aufbauen") {
    const n = need[c.zone] ?? 0;
    v += 1.5 + n * 1.5;
    if (b[c.zone] >= 2) v -= 3; // bereits voll
    if (c.alsoGain) for (const z of ZONES) if (c.alsoGain[z] && b[z] < 2) v += 0.6 + (need[z] ?? 0) * 0.8;
    if (thrZones.has(c.zone)) v -= 1.5; // dort droht ein Angriff (Angriff > Aufbauen)
    // B15 Keile: ein Gewinn hier nimmt seinem Positionsangriff die Voraussetzung (requires) – Flucht/Pass zu.
    const g = c.gain ?? 1;
    const denied = foeOk.filter((x) => x.kind === "angriff" && x.to && (Object.keys(x.requires ?? {}) as Zone[])
      .some((z) => -b[z] - (z === c.zone ? g : c.alsoGain?.[z] ?? 0) < x.requires![z]!));
    // B24: Keile nur am Boden – im Stand wirft er dich um, während du nur aufbaust.
    if (progress && denied.length && role !== "neutral") v += WEDGE_BONUS;
    // Zone vor dem Gerangel gewinnen: beide können hier angreifen, Gleichstand.
    if (thrZones.has(c.zone) && b[c.zone] === 0 && cardsOfSlot(s, side).some((x) => x.kind === "angriff" && x.zone === c.zone)) v += 2;
    // Finte: läuft meine Aufgabe in dieser Zone, erwartet er dort einen Rahmen.
    const run = mySubs.find((x) => x.zone === c.zone && x.step >= 1);
    if (run) v += 1.5 + run.step;
  } else {
    // Rahmen: nur sinnvoll gegen Angriffe oder laufende Leisten in der Zone.
    const t = thr.find((x) => x.zone === c.zone);
    const sub = foeSubs.find((x) => x.zone === c.zone);
    if (sub && t) v += 2 + sub.step * 3; // Rahmen wirkt nur gegen den Fortsetzungs-Angriff dieser Runde
    // Mit Wahrscheinlichkeit verteidigen (sonst spiegeln sich zwei KIs in Rahmen=Rahmen-Patts).
    if (t) v += 1 + (rng() < 0.4 ? 3 : 0) + (b[c.zone] < 0 ? 1 : 0) + (t.cardIds.some((id) => cardById(id)?.to?.points) ? 0.5 : 0);
    // B15 Position halten: oben in einer Kontrollposition wiegt eine drohende Flucht schwerer.
    if (progress && t && role === "top" && posValue(s.pos, role) >= 4 && t.cardIds.some((id) => cardById(id)?.to)) v += HOLD_BONUS;
    // B16 Konter-Wechsel: ein Sprawl gegen einen drohenden Shot bringt zusätzlich die Position.
    if (progress && t && c.onStop && !unmetRequires(s, side, { ...c, requires: c.onStopRequires }).length && t.cardIds.some((id) => cardById(id)?.to)) v += COUNTER_BONUS;
    if (!t) v -= 4; // Rahmen ins Leere
    v += (c.gain ?? 1) * 0.3;
  }

  // Mechanik 2: Griff legen (neu oder verdrängend) und Griff lösen.
  if (c.grip && !s.noGrips) {
    const mine = gripsOf(s, side);
    if (!mine.some((g) => g.id === c.grip!.id)) v += GRIP_PLACE + (gripsOf(s, other(side)).some((g) => g.zone === c.zone) ? GRIP_PUMMEL : 0);
    else v -= 0.5;
  }
  const br = breakable(s, side, c);
  if (br.length) {
    v += GRIP_BREAK + (c.kind === "rahmen" && !thrZones.has(c.zone) ? GRIP_BREAK_FRAME : 0);
    // Der Griff trägt einen seiner Angriffe (Angriff in der Griff-Zone mit Bedingung dort) – dann erst recht lösen.
    if (cardsOfSlot(s, other(side)).some((x) => x.kind === "angriff" && br.some((g) => x.zone === g.zone && x.requires?.[g.zone] !== undefined))) v += GRIP_BREAK_KEY;
  }
  // Mechanik 3: Kette – eine bereite Ketten-Karte aufwerten (seine Abwehr hat die nächste Technik geöffnet).
  if (chainFrom(s, side, c)) v += CHAIN_READY;
  // Rahmen, der seinen Angriff in der Zone seines Griffs stoppt, löst auch den Griff.
  if (c.kind === "rahmen" && thrZones.has(c.zone) && gripsOf(s, other(side)).some((g) => g.zone === c.zone)) v += GRIP_FRAME_HIT;

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
    // Atem-Haushalt: teure Karten nur, wenn es sich lohnt.
    if ((c.kraft ?? 0) > 0 && !(c.submission && mySubs.some((x) => x.id === c.submission!.id && x.step === 2))) v -= (c.kraft ?? 0) * 0.3;
  }
  return v + rng() * 0.6; // leichte Streuung, deterministisch
}

/** Kartenbonus des Stils. Rahmen-Vorlieben gelten nur, wenn in ihrer Zone ein Angriff droht (kein Rahmen ins Leere). */
function styleCardBonus(s: State2, side: Side, c: Card2, st: AiStyle): number {
  const v = st.cards?.[c.id] ?? 0;
  if (v > 0 && c.kind === "rahmen" && !threats(s, side).some((t) => t.zone === c.zone)) return 0;
  // Mechanik 3: Signatur-Ketten der Bosse, nur wenn die Kette bereit ist.
  return v + (st.chains?.[c.id] && chainFrom(s, side, c) ? st.chains[c.id]! : 0);
}

/** Stufe 2 mit Stil: Kartenbonus, Positionsvorliebe des Ziels (statt der aktuellen Lage) und Aufgaben-Vorliebe. */
function styleCard(s: State2, side: Side, c: Card2, st: AiStyle): number {
  let v = styleCardBonus(s, side, c, st);
  if (c.to && st.pos) v += (st.pos[`${c.to.pos}/${c.to.role}`] ?? 0) - (st.pos[`${s.pos}/${roleOf(s, side)}`] ?? 0);
  if (c.submission) v += st.subs?.[c.submission.id] ?? 0;
  if (c.grip && !gripsOf(s, side).some((g) => g.id === c.grip!.id)) v += st.grips?.[c.grip.id] ?? 0;
  return v;
}

/** style (optional, B28): Boss-Spielstil oder Konter-Heuristik. Stufe 1 ignoriert ihn. */
export function aiChoose(s: State2, side: Side, level: 1 | 2 | 3, rng: () => number, style?: AiStyle): string {
  const ok = okCards(s, side);
  if (ok.length === 0) return PASS;
  if (level === 1) {
    // Zufällig, aber sinnvoll: Rahmen ins Leere vermeiden, wenn es Alternativen gibt.
    const thrZones = new Set(threats(s, side).map((t) => t.zone));
    const sensible = ok.filter((c) => c.kind !== "rahmen" || thrZones.has(c.zone) || breakable(s, side, c).length > 0);
    return pick(sensible.length ? sensible : ok, rng).id;
  }
  if (level === 3) return lookahead(s, side, ok, rng, style);
  let best = ok[0], bestV = -Infinity;
  for (const c of ok) {
    const v = scoreCard(s, side, c, level, rng) + (style ? styleCard(s, side, c, style) : 0);
    if (v > bestV) { bestV = v; best = c; }
  }
  return best.id;
}

/** Bewertung eines Zustands aus Sicht von side. */
export function evaluate(s: State2, side: Side): number {
  const foe = other(side);
  if (s.result) {
    const w = s.result.winner;
    // Ein Tap ist der klarste Sieg: lieber beenden als auf Punkte warten.
    const k = s.result.type === "tap" ? 1200 : 1000;
    return w === side ? k : w === foe ? -k : 0;
  }
  const b = boardFor(s, side);
  let v = (s[side].pts - s[foe].pts) * 4 + posValue(s.pos, roleOf(s, side)) * 2.5;
  for (const z of ZONES) v += b[z] * 1.2;
  for (const t of s.subs) {
    const own = t.owner === side ? 1 : -1;
    v += own * t.step * t.step * 4;
    // Offene Leiste: der Verteidiger hat nächste Runde keinen Rahmen in dieser Zone (gesperrt).
    const def = t.owner === side ? foe : side;
    if (!okCards(s, def).some((c) => c.kind === "rahmen" && c.zone === t.zone)) v += own * t.step * 4;
  }
  v += (s[side].kraft - s[foe].kraft) * 0.3;
  // Mechanik 2: liegende Griffe sind Kontrolle (Zustand, kein Moment).
  v += GRIP_EVAL * (gripsOf(s, side).length - gripsOf(s, foe).length);
  // Offensive Optionen (eigene ok-Angriffe) zählen, gegnerische Bedrohungen kosten.
  v += okCards(s, side).filter((c) => c.kind === "angriff").length * 0.8;
  v -= okCards(s, foe).filter((c) => c.kind === "angriff").length * 0.8;
  // B26 Offene Tür (Stufe 3): ein Positionsangriff, gegen den er in dieser Zone gerade keinen Rahmen hat (gesperrt), droht wirklich.
  v += OPEN_DOOR_EVAL * (openDoor(s, side) - openDoor(s, foe));
  return v;
}

/** Größter Positionsgewinn (Positionswert + halbe Punkte, gekappt) meiner spielbaren Positionsangriffe,
 *  gegen die er in ihrer Zone gerade keinen spielbaren Rahmen hat. */
function openDoor(s: State2, side: Side): number {
  const foeFrames = new Set(okCards(s, other(side)).filter((c) => c.kind === "rahmen").map((c) => c.zone));
  let best = 0;
  for (const c of okCards(s, side)) {
    if (c.kind !== "angriff" || !c.to || foeFrames.has(c.zone)) continue;
    const g = posValue(c.to.pos, c.to.role) - posValue(s.pos, roleOf(s, side)) + (c.to.points ?? 0) * 0.5;
    if (g > best) best = g;
  }
  return Math.min(best, OPEN_DOOR_CAP);
}

/** B25: Anteil, den Stufe 3 im Gegnermodell gleichmäßig auf alle spielbaren Karten verteilt (Überraschung). */
const FOE_SURPRISE = 0.3;
/** B26: Gewicht und Kappung der „offenen Tür“ in der Stufe-3-Bewertung. */
const OPEN_DOOR_EVAL = 4;
const OPEN_DOOR_CAP = 3;

/** Gegnermodell für Stufe 3: Heuristik-Werte des Gegners, verschoben durch seine Zonen-Gewohnheiten. */
function foeModel(s: State2, side: Side, rng: () => number): { card: Card2; w: number }[] {
  const foe = other(side);
  const ok = okCards(s, foe);
  const hab = foeZoneHabits(s, side);
  // Er sieht meine Bedrohungen (öffentlich) und rahmt dort eher – darauf antworte ich mit Finten.
  const myThr = new Set(threats(s, foe).map((t) => t.zone));
  const sc = ok.map((c) => scoreCard(s, foe, c, 2, rng, false) + hab[c.zone] * 0.4 + (c.kind === "rahmen" && myThr.has(c.zone) ? 2.5 : 0));
  const max = Math.max(...sc);
  const ws = sc.map((x) => Math.exp((x - max) / 1.5));
  const sum = ws.reduce((a, b) => a + b, 0);
  // B25: Er kann auch etwas Unerwartetes spielen – ein Teil der Wahrscheinlichkeit verteilt sich gleichmäßig.
  return ok.map((card, i) => ({ card, w: (1 - FOE_SURPRISE) * ws[i] / sum + FOE_SURPRISE / ok.length }));
}

/** Stufe 3 mischt zwischen Karten, die höchstens MIX_WINDOW schlechter sind als die beste. */
const MIX_WINDOW = 4;
const MIX_TEMP = 1.5;

/** Stufe 3: eine Runde vorausrechnen gegen das Gegnermodell (liest Historie, Sperren und threats). */
function lookahead(s: State2, side: Side, ok: Card2[], rng: () => number, style?: AiStyle): string {
  const model = foeModel(s, side, rng);
  // B28: Stil wirkt nur auf offene Lagen – ein sicherer Sieg/Tap bleibt unberührt.
  const val = (n: State2) => evaluate(n, side) + (style && !n.result ? styleValue(n, side, style) : 0);
  const evs = ok.map((c) => {
    let ev = style ? styleCardBonus(s, side, c, style) : 0;
    if (model.length === 0) ev += val(resolveRound(s, side === "p" ? c.id : PASS, side === "p" ? PASS : c.id).state);
    for (const { card, w } of model) {
      const [pc, oc] = side === "p" ? [c.id, card.id] : [card.id, c.id];
      ev += w * val(resolveRound(s, pc, oc).state);
    }
    return ev;
  });
  // Balance: kein perfekter Konter. Unter den Karten nahe am Besten wird gemischt (Softmax),
  // sonst spiegeln sich zwei KIs endlos (Rahmen gegen Angriff, Runde für Runde). Sichere Gewinne bleiben sicher.
  const max = Math.max(...evs);
  if (max >= 900) return ok[evs.indexOf(max)].id;
  const ws = evs.map((x) => (x >= max - MIX_WINDOW ? Math.exp((x - max) / MIX_TEMP) : 0));
  const sum = ws.reduce((a, b) => a + b, 0);
  let r = rng() * sum;
  for (let i = 0; i < ok.length; i++) { r -= ws[i]; if (r <= 0 && ws[i] > 0) return ok[i].id; }
  return ok[evs.indexOf(max)].id;
}

export { checkCard };
