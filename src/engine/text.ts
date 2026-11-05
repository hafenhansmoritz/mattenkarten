// Deutsche Texte für Headlines und Lernsätze (Engine-intern, unabhängig von der UI).
//
// Leitlinien (Feedback-Forschung, Shute 2008; research_notes/lernen_pro_runde.md):
// - Headline: WAS ist passiert – wer (du/er) hat was gemacht, ≤ 10 Wörter, Alltagssprache.
// - Lesson: WARUM – ein Prinzip, ≤ 20 Wörter, Alltagswörter zuerst, Fachbegriff höchstens einmal in Klammern.
// - Sofort nach dem Aufdecken, Prozess-Ebene (kein Personenlob).
import { CARDS } from "../data/cards";
import type { CardDef, Outcome, Side, Tag } from "./types";

/** Fachliche Tag-Namen (Schlüssel werden in resolve.ts als Liste aller Tags genutzt). */
export const TAG_DE: Record<Tag, string> = {
  strike: "Schläge", shot: "Beinangriffe (Shots)", single: "Single Leg", legs: "Beingriffe",
  clinch: "Clinch-Eintritte", snap: "Snap Downs", drag: "Arm Drags", bodylock: "Body Locks",
  hip: "Hüftwürfe", reap: "Sichelwürfe", escape: "Escapes", bridge: "Bridges", sweep: "Sweeps",
  pass: "Guard Passes", advance: "Aufstiege", choke: "Würger", armlock: "Armhebel",
  shoulderlock: "Schulterhebel", trianglechoke: "Triangles", behind: "Go-Behinds",
};

/** Alltagsnamen der Angriffsfamilien (für Lernsätze). */
export const TAG_PLAIN: Record<Tag, string> = {
  strike: "Schläge", shot: "Beinangriffe", single: "Angriffe auf ein Bein", legs: "Beinangriffe",
  clinch: "Umklammern", snap: "Kopf-Runterziehen", drag: "Arm-Ziehen", bodylock: "Umklammern mit Wurf",
  hip: "Hüftwürfe", reap: "Bein-Wegsicheln", escape: "Befreiungen", bridge: "Abwerfen per Brücke",
  sweep: "Umdrehen von unten", pass: "Vorbeigehen an den Beinen", advance: "Aufsteigen", choke: "Würger",
  armlock: "Armstrecken", shoulderlock: "Arm-Verdrehen", trianglechoke: "Beine-Würger", behind: "Rumlaufen nach hinten",
};

/** Was der Angreifer wollte – [Du-Form, Er-Form]. */
const INTENT: Record<Tag, [string, string]> = {
  strike: ["Du wolltest ihn treffen", "Er wollte dich treffen"],
  shot: ["Du wolltest seine Beine", "Er wollte deine Beine"],
  single: ["Du wolltest sein Bein", "Er wollte dein Bein"],
  legs: ["Du wolltest seine Beine", "Er wollte deine Beine"],
  clinch: ["Du wolltest ihn umklammern", "Er wollte dich umklammern"],
  snap: ["Du wolltest seinen Kopf runterziehen", "Er wollte deinen Kopf runterziehen"],
  drag: ["Du wolltest an ihm vorbei", "Er wollte an dir vorbei"],
  bodylock: ["Du wolltest ihn umwerfen", "Er wollte dich umwerfen"],
  hip: ["Du wolltest ihn werfen", "Er wollte dich werfen"],
  reap: ["Du wolltest sein Bein wegsicheln", "Er wollte dein Bein wegsicheln"],
  escape: ["Du wolltest raus", "Er wollte raus"],
  bridge: ["Du wolltest ihn abwerfen", "Er wollte dich abwerfen"],
  sweep: ["Du wolltest ihn umdrehen", "Er wollte dich umdrehen"],
  pass: ["Du wolltest an seinen Beinen vorbei", "Er wollte an deinen Beinen vorbei"],
  advance: ["Du wolltest aufsteigen", "Er wollte aufsteigen"],
  choke: ["Du wolltest seinen Hals", "Er wollte deinen Hals"],
  armlock: ["Du wolltest seinen Arm strecken", "Er wollte deinen Arm strecken"],
  shoulderlock: ["Du wolltest seinen Arm verdrehen", "Er wollte deinen Arm verdrehen"],
  trianglechoke: ["Du wolltest ihn mit Beinen würgen", "Er wollte dich mit Beinen würgen"],
  behind: ["Du wolltest hinter ihn", "Er wollte hinter dich"],
};

/** Was der Angreifer geschafft hat – [Du-Form, Er-Form]. */
const DONE: Record<Tag, [string, string]> = {
  strike: ["Du triffst ihn", "Er trifft dich"],
  shot: ["Du hast seine Beine", "Er hat deine Beine"],
  single: ["Du hast sein Bein", "Er hat dein Bein"],
  legs: ["Du hast seine Beine", "Er hat deine Beine"],
  clinch: ["Du umklammerst ihn", "Er umklammert dich"],
  snap: ["Du ziehst seinen Kopf runter", "Er zieht deinen Kopf runter"],
  drag: ["Du bist hinter ihm", "Er ist hinter dir"],
  bodylock: ["Du wirfst ihn um", "Er wirft dich um"],
  hip: ["Du wirfst ihn", "Er wirft dich"],
  reap: ["Du sichelst sein Bein weg", "Er sichelt dein Bein weg"],
  escape: ["Du bist raus", "Er ist raus"],
  bridge: ["Du wirfst ihn ab", "Er wirft dich ab"],
  sweep: ["Du drehst ihn um", "Er dreht dich um"],
  pass: ["Du bist an seinen Beinen vorbei", "Er ist an deinen Beinen vorbei"],
  advance: ["Du steigst auf", "Er steigt auf"],
  choke: ["Du würgst ihn", "Er würgt dich"],
  armlock: ["Du streckst seinen Arm", "Er streckt deinen Arm"],
  shoulderlock: ["Du verdrehst seinen Arm", "Er verdreht deinen Arm"],
  trianglechoke: ["Du würgst ihn mit den Beinen", "Er würgt dich mit den Beinen"],
  behind: ["Du bist hinter ihm", "Er ist hinter dir"],
};

export const MAX_HEADLINE_WORDS = 10;
export const MAX_LESSON_WORDS = 20;

/** Wörter zählen (Gedankenstriche u. Ä. zählen nicht). */
export function wordCount(s: string): number {
  return s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Erste Variante, die ins Wortlimit passt (sonst die letzte = kürzeste). */
function fit(max: number, ...variants: string[]): string {
  return variants.find((v) => wordCount(v) <= max) ?? variants[variants.length - 1];
}

/** Hängt einen Zusatzsatz an, wenn er noch ins Limit passt. */
function addIfFits(base: string, extra: string | null, max = MAX_LESSON_WORDS): string {
  if (!extra) return base;
  const joined = `${base} ${extra}`;
  return wordCount(joined) <= max ? joined : base;
}

export function tagsDe(tags: Tag[] | undefined): string {
  return joinList((tags ?? []).map((t) => TAG_DE[t]));
}

function joinList(items: string[]): string {
  const list = [...new Set(items)];
  if (list.length <= 1) return list.join("");
  return list.slice(0, -1).join(", ") + " und " + list[list.length - 1];
}

/** Alltagsname der Tags, ohne Doppelungen. */
export function tagsPlain(tags: Tag[] | undefined): string {
  return joinList((tags ?? []).map((t) => TAG_PLAIN[t]));
}

/** Großer Name einer Karte: Alltagstitel, sonst Fachbegriff. */
export const nm = (c: CardDef) => c.plain ?? c.name;
/** Alltagsname in Anführungszeichen (für Fließtext). */
const q = (c: CardDef) => `„${nm(c)}“`;
/** Fachbegriff in Klammern – nur, wenn er sich vom Alltagsnamen unterscheidet. */
const term = (c: CardDef) => (c.plain && c.plain !== c.name ? ` (${c.name})` : "");

/** Hauptfamilie eines Angriffs (Single Leg ist präziser als "shot"). */
function mainTag(c: CardDef): Tag | null {
  const tags = c.tags ?? [];
  if (tags.includes("single")) return "single";
  return tags[0] ?? null;
}

const du = (side: Side, duForm: string, erForm: string) => (side === "p" ? duForm : erForm);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function intent(atk: CardDef, side: Side): string {
  const t = mainTag(atk);
  if (!t) return du(side, "Du hast angegriffen", "Er hat angegriffen");
  return INTENT[t][side === "p" ? 0 : 1];
}

function done(atk: CardDef, side: Side): string {
  const t = mainTag(atk);
  if (!t) return du(side, "Du kommst durch", "Er kommt durch");
  return DONE[t][side === "p" ? 0 : 1];
}

function tapsOut(loser: Side): string {
  return du(loser, "du klopfst ab (Tap)", "er klopft ab (Tap)");
}

/** Warum gab es Punkte? (Alltagssprache, ohne Klammer-Begriff.) */
export function pointsWhy(atk: CardDef): string | null {
  const o: Outcome | undefined = atk.success;
  const n = o?.points ?? 0;
  if (!o || !n) return null;
  const tags = atk.tags ?? [];
  if (n === 3 || tags.includes("pass")) return `An den Beinen vorbei: ${n} Punkte.`;
  if (o.pos === "mount" && n >= 4) return `Draufsitzen: ${n} Punkte.`;
  if (o.pos === "back") return `Hinten mit Füßen drin: ${n} Punkte.`;
  if (tags.includes("sweep")) return `Von unten nach oben gedreht: ${n} Punkte.`;
  if (o.pos === "mount") return `Draufgestiegen: ${n} Punkte.`;
  return `Zu Boden gebracht: ${n} Punkte.`;
}

/** Reaktion, die gegen diesen Angriff geholfen hätte – in derselben Lage wie `re`, Grundtechniken zuerst. */
export function fixFor(atk: CardDef, re?: CardDef): CardDef | null {
  const tags = atk.tags ?? [];
  const fits = CARDS.filter((c) => c.kind === "reaktion" && c.id !== re?.id && (c.counters ?? []).some((t) => tags.includes(t)));
  const sameSlot = (c: CardDef) => !re || c.slots.some((s) => re.slots.some((r) => r.pos === s.pos && r.role === s.role));
  const ranked = [
    ...fits.filter((c) => sameSlot(c) && c.basic),
    ...fits.filter((c) => sameSlot(c) && !c.basic),
  ];
  return ranked[0] ?? null;
}

// ------------------------------------------------------------------
// Feste Lernsätze (≤ 20 Wörter, Alltagswörter zuerst, Begriff in Klammern)
// ------------------------------------------------------------------
export const LESSON = {
  angriffSetup: "Wer nur vorbereitet (Setup), steht still – ein direkter Angriff trifft genau dann.",
  setupReaktion: "Die Finte lockt die Abwehr ins Leere (Setup) – wer zu früh reagiert, verliert Kraft und öffnet eine Lücke.",
  reaktionAngriff: "Abwehr stoppt nur den passenden Angriff (Reaktion) – du musst erkennen, was kommt.",
  scramble: "Gleich schnell angegriffen: Beide verlieren Kraft, keiner kommt weiter (Scramble).",
  beideSetup: "Beide bereiten vor: Jeder sammelt Kontrolle, aber erst ein Angriff bringt Position (Setup).",
  patt: "Nur abwehren bringt Puste zurück, aber keine Position – einer muss etwas wagen (Patt).",
  subDefended: "Wer zum Aufgabegriff greift, lockert seinen Halt: Abgewehrt ist die Kontrolle weg (Submission).",
  dilemma: "Wer das eine abwehrt, öffnet das andere – greif in Paaren an (Dilemma).",
  subWin: (ctrl: number) => ctrl > 0
    ? `Erst festhalten, dann beenden: Mit Kontrolle ${ctrl} saß der Aufgabegriff (Submission).`
    : "Nichts stand im Weg: Ohne passende Abwehr sitzt der Aufgabegriff sofort (Submission).",
  hooks: "Rücken-Punkte gibt es erst, wenn beide Füße innen sitzen (Hooks) – nie die Füße kreuzen.",
  opening: (tw: number, tl: number) => `Die Lücke von vorhin (Öffnung) machte den Angriff 2 schneller – Tempo ${tw} gegen ${tl}.`,
  tired: (tw: number, tl: number) => `Ohne Puste wird man langsam (wenig Gas = Tempo +1) – ${tw} gegen ${tl}.`,
  tempo: (tw: number, tl: number) => `Zwei Angriffe gleichzeitig: Der schnellere trifft zuerst – kleine Zahl gewinnt (Tempo ${tw} gegen ${tl}).`,
};

export interface RoundText { headline: string; lesson: string }
const H = MAX_HEADLINE_WORDS;

// ------------------------------------------------------------------
// Texte je Regel. `a`/`st`/`r`/`w` = Seite der entscheidenden Karte.
// ------------------------------------------------------------------

/** Angriff schlägt Setup (inkl. Submission-Tap). */
export function textAngriffSetup(a: Side, atk: CardDef, _set: CardDef, tap: boolean, ctrlBefore: number): RoundText {
  const b: Side = a === "p" ? "o" : "p";
  if (tap) {
    return {
      headline: fit(H, `${done(atk, a)} – ${tapsOut(b)}!`, `${done(atk, a)} – Tap!`, `${cap(tapsOut(b))}!`),
      lesson: LESSON.subWin(ctrlBefore),
    };
  }
  return {
    headline: fit(H,
      `${done(atk, a)} – ${du(b, "du hast", "er hat")} nur vorbereitet!`,
      `${du(a, "Du triffst", "Er trifft")} mitten ins Vorbereiten!`),
    lesson: addIfFits(LESSON.angriffSetup, pointsWhy(atk)),
  };
}

/** Setup schlägt Reaktion → Öffnung. */
export function textSetupReaktion(st: Side, set: CardDef, re: CardDef): RoundText {
  const r: Side = st === "p" ? "o" : "p";
  return {
    headline: fit(H,
      `${du(r, "Du reagierst", "Er reagiert")} zu früh auf ${du(st, "deine", "seine")} Finte – Lücke!`,
      `${du(r, "Du reagierst", "Er reagiert")} zu früh – Lücke!`),
    lesson: set.lesson ?? fit(MAX_LESSON_WORDS,
      `Die Finte lockt ${q(re)} ins Leere (Setup) – der nächste passende Angriff kommt schneller.`,
      "Die Finte lockt die Abwehr ins Leere (Setup) – der nächste passende Angriff kommt schneller."),
  };
}

/** Reaktion stoppt passenden Angriff (keine Submission). */
export function textKonter(r: Side, re: CardDef, atk: CardDef): RoundText {
  const a: Side = r === "p" ? "o" : "p";
  const fallback = atk.lesson
    ?? `${q(re)} stoppt ${tagsPlain(re.counters)}${term(re)} – darum kam ${q(atk)} nicht durch.`;
  return {
    headline: fit(H,
      `${intent(atk, a)} – ${q(re)} stoppt ${du(r, "ihn", "dich")}!`,
      `${intent(atk, a)} – ${du(r, "du stoppst ihn", "er stoppt dich")}!`),
    lesson: re.lesson ?? fallback,
  };
}

/** Reaktion wehrt Submission ab → Angreifer verliert Kontrolle (ggf. Position). */
export function textSubAbgewehrt(r: Side, re: CardDef, atk: CardDef): RoundText {
  const a: Side = r === "p" ? "o" : "p";
  const lostPos = !!(re.onCounter || atk.onCountered);
  const consequence = lostPos
    ? du(a, "Du verlierst die Position.", "Er verliert die Position.")
    : du(a, "Deine Kontrolle ist weg.", "Seine Kontrolle ist weg.");
  return {
    headline: fit(H, `${intent(atk, a)} – abgewehrt! ${consequence}`, `Abgewehrt! ${consequence}`),
    lesson: re.lesson ?? LESSON.subDefended,
  };
}

/** Reaktion passt nicht → Angriff geht durch (inkl. Tap). */
export function textDurch(a: Side, atk: CardDef, re: CardDef, tap: boolean): RoundText {
  const r: Side = a === "p" ? "o" : "p";
  const t = mainTag(atk);
  const atkFam = t ? TAG_PLAIN[t] : "diesen Angriff";
  const stops = tagsPlain(re.counters) || "anderes";
  const fix = fixFor(atk, re);
  const why = fix
    ? fit(MAX_LESSON_WORDS,
      `${q(re)} stoppt ${stops}, nicht ${atkFam}. Dagegen hilft ${q(fix)}${term(fix)}.`,
      `${q(re)} stoppt nicht ${atkFam}. Dagegen hilft ${q(fix)}${term(fix)}.`,
      `Gegen ${atkFam} hilft ${q(fix)}${term(fix)} – nicht ${q(re)}.`)
    : fit(MAX_LESSON_WORDS,
      `${q(re)} stoppt ${stops}, nicht ${atkFam} – dagegen braucht es eine andere Abwehr.`,
      `Abwehr hilft nur gegen den passenden Angriff – nicht gegen ${atkFam}.`);
  const headline = tap
    ? fit(H, `${done(atk, a)} – falsche Abwehr, ${tapsOut(r)}!`, `${done(atk, a)} – falsche Abwehr, Tap!`, `Falsche Abwehr – ${tapsOut(r)}!`)
    : fit(H, `${done(atk, a)} – ${du(r, "deine", "seine")} Abwehr passte nicht!`, `${du(r, "Deine", "Seine")} Abwehr passte nicht – durch!`);
  return { headline, lesson: tap ? why : addIfFits(why, pointsWhy(atk)) };
}

/** Danaher-Dilemma: Partnerkarte wurde gekontert → diese Karte umgeht die Abwehr. */
export function textDilemma(a: Side, atk: CardDef, _re: CardDef, tap: boolean): RoundText {
  const r: Side = a === "p" ? "o" : "p";
  const partner = atk.dilemmaWith ? CARDS.find((c) => c.id === atk.dilemmaWith) : undefined;
  const headline = tap
    ? fit(H, `Doppelangriff! ${done(atk, a)} – ${tapsOut(r)}!`, `Doppelangriff! ${done(atk, a)} – Tap!`, `Doppelangriff! ${cap(tapsOut(r))}!`)
    : fit(H, `Doppelangriff! ${done(atk, a)} – ${du(r, "deine", "seine")} Abwehr ging ins Leere.`, `Doppelangriff! ${du(r, "Deine", "Seine")} Abwehr ging ins Leere.`);
  const lesson = partner
    ? fit(MAX_LESSON_WORDS,
      `Wer ${q(partner)} abwehrt, öffnet sich für ${q(atk)} – greif in Paaren an (Dilemma).`,
      LESSON.dilemma)
    : LESSON.dilemma;
  return { headline, lesson };
}

/** Angriff gegen Angriff, ungleiches Tempo. */
export function textTempo(
  w: Side, win: CardDef, _lose: CardDef, tw: number, tl: number, tap: boolean,
  usedOpening: boolean, loserTired: boolean,
): RoundText {
  const l: Side = w === "p" ? "o" : "p";
  const headline = tap
    ? fit(H, `${done(win, w)}, schneller – ${tapsOut(l)}!`, `${done(win, w)}, schneller – Tap!`, `Schneller! ${cap(tapsOut(l))}!`)
    : fit(H, `${done(win, w)} – ${du(w, "du warst", "er war")} schneller!`, `${du(w, "Du warst", "Er war")} schneller!`);
  const base = usedOpening ? LESSON.opening(tw, tl) : loserTired ? LESSON.tired(tw, tl) : LESSON.tempo(tw, tl);
  return { headline, lesson: tap ? base : addIfFits(base, pointsWhy(win)) };
}

/** Angriff gegen Angriff, gleiches Tempo. */
export function textScramble(_p: CardDef, _o: CardDef): RoundText {
  return { headline: "Beide greifen gleich schnell an – Gerangel, nichts passiert.", lesson: LESSON.scramble };
}

/** Setup gegen Setup. */
export function textBeideSetup(_p: CardDef, _o: CardDef): RoundText {
  return { headline: "Beide bauen Griffe auf – keiner greift an.", lesson: LESSON.beideSetup };
}

/** Reaktion gegen Reaktion. */
export function textPatt(_p: CardDef, _o: CardDef): RoundText {
  return { headline: "Beide warten nur ab – keiner kommt weiter.", lesson: LESSON.patt };
}

// ------------------------------------------------------------------
// Ein Einstiegspunkt für resolve.ts: alle Regel-Fälle → Headline + Lernsatz.
// ------------------------------------------------------------------
export type ExplainInput =
  | { rule: "angriff>setup"; side: Side; atk: CardDef; set: CardDef; tap: boolean; ctrlBefore: number }
  | { rule: "setup>reaktion"; side: Side; set: CardDef; re: CardDef }
  | { rule: "reaktion>angriff"; side: Side; re: CardDef; atk: CardDef }
  | { rule: "durch"; side: Side; atk: CardDef; re: CardDef; tap: boolean; dilemma: boolean }
  | { rule: "tempo"; side: Side; win: CardDef; lose: CardDef; tw: number; tl: number; tap: boolean; usedOpening: boolean; loserTired: boolean }
  | { rule: "scramble" | "beide-setup" | "patt"; p: CardDef; o: CardDef };

/** `side` = Seite der Karte, die gewirkt hat (Angreifer, Setup-Spieler, Reagierender, Schnellerer). */
export function explain(x: ExplainInput): RoundText {
  switch (x.rule) {
    case "angriff>setup": return textAngriffSetup(x.side, x.atk, x.set, x.tap, x.ctrlBefore);
    case "setup>reaktion": return textSetupReaktion(x.side, x.set, x.re);
    case "reaktion>angriff": return x.atk.submission ? textSubAbgewehrt(x.side, x.re, x.atk) : textKonter(x.side, x.re, x.atk);
    case "durch": return x.dilemma ? textDilemma(x.side, x.atk, x.re, x.tap) : textDurch(x.side, x.atk, x.re, x.tap);
    case "tempo": return textTempo(x.side, x.win, x.lose, x.tw, x.tl, x.tap, x.usedOpening, x.loserTired);
    case "scramble": return textScramble(x.p, x.o);
    case "beide-setup": return textBeideSetup(x.p, x.o);
    case "patt": return textPatt(x.p, x.o);
  }
}
