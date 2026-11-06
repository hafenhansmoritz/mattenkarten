// Mechanik 4 „Vorbereiteter Konter“ (Spec B38–B43). Vorbild: Secrets (Hearthstone) und Instants (Magic).
// BJJ: Antizipation – der Rahmen steht, bevor er angreift (Sprawl bereit für den Shot, Ellbogen eng vor der Armbar).
// Variante „zusätzlich“: Du spielst deine Karte wie immer und legst zusätzlich einen Rahmen verdeckt (2 Atem). Ab der
// nächsten Runde springt er ein, sobald der Gegner in dieser Zone angreift – statt deiner dann gewählten Karte.
// Der Gegner sieht nur „Er hat etwas vorbereitet“ (ohne Zone).
import { planPublic } from "./plan";
import type { Card2, Konter2, Role2, Side, State2, Zone } from "../types";
import { ZONES } from "../types";
import { other, roleOf } from "./board";
import { allCards, cardById, slotCards } from "./registry";

/** Zug mit Konter: "<karte>&konter:<rahmen>" (playRound/aiChoose). Die Karte darf PASS sein. */
export const KONTER_PREFIX = "konter:";
const SEP = "&";
/** Preis fürs Legen in Atem (zusätzlich zur gespielten Karte und zum Atem-Preis des Rahmens). */
export const KONTER_COST = 3;
/** Legen nur mit genug Luft: mindestens so viel Atem zu Rundenbeginn (B38). */
export const KONTER_MIN_ATEM = 3;
/** Höchstens so viele Konter je Spieler und Kampf (B38). */
export const KONTER_PER_MATCH = 1;
/** B40: ein ausgelöster Konter stoppt den Angriff (alle Rahmen-Regeln), gewinnt aber selbst keine Zone. */
export const KONTER_NO_GAIN = true;
/** Wie viele Konter hat side in diesem Kampf schon gelegt? (öffentlich: Round2.konterSet) */
export function konterUsed(s: Pick<State2, "history">, side: Side): number {
  return s.history.filter((r) => r.konterSet?.includes(side)).length;
}
/** So viele Runden nach dem Legen liegt der Konter bereit; danach verfällt er (Karte 1 Runde gesperrt). */
export const KONTER_ROUNDS = 2;
/** Zug „Karte spielen und zusätzlich Rahmen verdeckt legen“. */
export const withKonter = (cardId: string, frameId: string): string => `${cardId}${SEP}${KONTER_PREFIX}${frameId}`;
/** Mechanik 5: Zusatz „Stil-Fähigkeit einsetzen“ ("<karte>[&konter:<rahmen>]&stil"). */
export const STIL_TAG = "stil";
/** Zug um die Stil-Fähigkeit ergänzen (Karte und ggf. Konter bleiben). */
export const withStil = (play: string): string => `${play}${SEP}${STIL_TAG}`;
/** Zerlegt einen Zug in gespielte Karte, (optional) verdeckt gelegten Rahmen und (optional) die Stil-Fähigkeit. */
export function splitPlay(id: string): { card: string; konter: string | null; stil: boolean } {
  const [card, ...rest] = id.split(SEP);
  const k = rest.find((x) => x.startsWith(KONTER_PREFIX));
  return { card, konter: k ? k.slice(KONTER_PREFIX.length) : null, stil: rest.includes(STIL_TAG) };
}

const FOE_ROLE: Record<Role2, Role2> = { neutral: "neutral", top: "bottom", bottom: "top" };

/** Angriffe des Gegners, auf die dieser Rahmen lauern kann: gleiche Zone, gegenüberliegender Slot (reine Ableitung). */
export function konterTargets(c: Card2): Card2[] {
  if (c.kind !== "rahmen") return [];
  const out = new Map<string, Card2>();
  for (const sl of c.slots) for (const a of slotCards(sl.pos, FOE_ROLE[sl.role])) if (a.kind === "angriff" && a.zone === c.zone) out.set(a.id, a);
  return [...out.values()];
}

/** Schlüsselwort „Konter“: ein Rahmen, gegen den der Gegner in derselben Zone angreifen kann. */
export function canKonter(c: Card2): boolean {
  return konterTargets(c).length > 0;
}

/** Alle Karten, die als Konter gelegt werden können (Glossar/Tests). */
export function konterCards(): Card2[] {
  return allCards().filter(canKonter);
}

export function konterOf(s: Pick<State2, "konter">, side: Side): Konter2 | undefined {
  return s.konter?.[side];
}

export interface KonterLegal { id: string; ok: boolean; reason?: string }

/** Darf side Rahmen c jetzt zusätzlich verdeckt legen, während er `playing` spielt? */
export function checkKonter(s: State2, side: Side, c: Card2, playing?: Card2 | null): KonterLegal {
  const id = c.id;
  if (s.noKonter) return { id, ok: false, reason: "Konter sind hier aus" };
  if (!canKonter(c)) return { id, ok: false, reason: "Nur ein Rahmen kann Konter sein" };
  if (s.konter?.[side]) return { id, ok: false, reason: "Dein Konter liegt schon" };
  if (konterUsed(s, side) >= KONTER_PER_MATCH) return { id, ok: false, reason: KONTER_PER_MATCH === 1 ? "Nur ein Konter pro Kampf" : `Nur ${KONTER_PER_MATCH} Konter pro Kampf` };
  if (s[side].locked.includes(c.id)) return { id, ok: false, reason: "Gesperrt (gerade gespielt)" };
  // B38: Vorbereiten geht nur, bevor er angreift – läuft seine Aufgabe schon, musst du offen rahmen.
  if (s.subs.some((t) => t.owner !== side && t.step > 0)) return { id, ok: false, reason: "Zu spät: seine Aufgabe läuft schon" };
  if (playing?.id === c.id) return { id, ok: false, reason: "Diese Karte spielst du schon" };
  if (s[side].kraft < KONTER_MIN_ATEM) return { id, ok: false, reason: `Braucht mindestens ${KONTER_MIN_ATEM} Atem` };
  const k = KONTER_COST + (c.kraft ?? 0) + (playing?.kraft ?? 0);
  if (k > s[side].kraft) return { id, ok: false, reason: `Braucht ${k} Atem` };
  if (!c.slots.some((sl) => sl.pos === s.pos && sl.role === roleOf(s, side))) return { id, ok: false, reason: "Passt nicht in diese Lage" };
  return { id, ok: true };
}

/** Rahmen, die side jetzt zusätzlich zu `playing` verdeckt legen kann. */
export function konterOptions(s: State2, side: Side, playing?: Card2 | null): Card2[] {
  if (s.noKonter || s.konter?.[side] || s.result) return [];
  return slotCards(s.pos, roleOf(s, side)).filter((c) => checkKonter(s, side, c, playing).ok);
}

/** Passt der Konter noch zur Lage? (Nach Positionswechsel fällt er, wenn sein Rahmen dort keinen Slot hat.) */
export function konterFits(s: Pick<State2, "pos" | "top">, side: Side, k: Konter2): boolean {
  if (!k.card) return true; // verdeckt: nur der Besitzer weiß es – die Engine der echten Partie entscheidet
  const c = cardById(k.card);
  const role = roleOf(s as State2, side);
  return !!c && c.slots.some((sl) => sl.pos === s.pos && sl.role === role);
}

/**
 * Sicht von `viewer` auf den Zustand (B39 Informationsstufe): sein eigener Konter bleibt sichtbar; vom gegnerischen
 * bleibt nur „liegt, noch n Runden“ – ohne Karte, ohne Zone. Die KI rechnet ausschließlich mit dieser Sicht.
 */
export function publicView(s: State2, viewer: Side): State2 {
  const foe = other(viewer);
  const k = s.konter?.[foe];
  // Mechanik 6 (B55): eigener Stapel unbekannt, vom Gegner nur sein Spielplan (nicht seine Hand).
  const plan = s.plan ? { plan: planPublic(s.plan, viewer) } : {};
  if (!k?.card) return s.plan ? { ...s, ...plan } : s;
  return { ...s, ...plan, konter: { ...s.konter, [foe]: { left: k.left } } };
}

/** Seine Rahmen, die gerade verdeckt liegen könnten: Konter-Rahmen seines Slots, nicht öffentlich gesperrt und seit
 *  dem Legen nicht offen gespielt (öffentliche Historie). */
function suspectFrames(s: State2, viewer: Side): Card2[] {
  const foe = other(viewer);
  const h = s.history;
  let i = h.length - 1;
  while (i >= 0 && !h[i].konterSet?.includes(foe)) i--;
  // Die Karte, die er beim Legen offen spielte, und alles danach liegt nicht verdeckt.
  const since = new Set(h.slice(Math.max(0, i)).map((r) => (foe === "p" ? r.pCard : r.oCard)));
  return slotCards(s.pos, roleOf(s, foe)).filter((c) => canKonter(c) && !s[foe].locked.includes(c.id) && !since.has(c.id));
}

/**
 * B42 Lesen: Wo liegt sein verdeckter Konter vermutlich? Nur aus öffentlicher Info (suspectFrames); Zonen, in denen ich
 * (viewer) angreifen kann, zählen dreifach – dort hätte er Grund zu rahmen. Leer, wenn er keinen Konter liegen hat.
 */
export function konterBelief(s: State2, viewer: Side): Partial<Record<Zone, number>> {
  const foe = other(viewer);
  if (!s.konter?.[foe]) return {};
  const frames = suspectFrames(s, viewer);
  if (!frames.length) return {};
  const mine = new Set(slotCards(s.pos, roleOf(s, viewer)).filter((c) => c.kind === "angriff").map((c) => c.zone));
  const w: Partial<Record<Zone, number>> = {};
  for (const z of ZONES) if (frames.some((c) => c.zone === z)) w[z] = mine.has(z) ? 3 : 1;
  const sum = Object.values(w).reduce((a, b) => a + (b ?? 0), 0);
  for (const z of ZONES) if (w[z]) w[z] = w[z]! / sum;
  return w;
}

/** Ein Rahmen des Gegners in Zone z, der verdeckt liegen könnte (Vorausschau: „was, wenn sein Konter dort liegt“). */
export function foeFrameIn(s: State2, viewer: Side, z: Zone): Card2 | undefined {
  return suspectFrames(s, viewer).find((c) => c.zone === z);
}
