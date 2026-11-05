// Reveal-Auflösung nach Spec 2.2–2.4. Reine Funktion: gibt einen neuen MatchState zurück.
import { CARD } from "../data/cards";
import type { Rng } from "./rng";
import {
  MAX_CONTROL, MAX_GAS, clamp, dilemmaActive, intersects, other,
} from "./state";
import { LESSON, TAG_DE, explain } from "./text";
import type {
  CardDef, FighterState, MatchState, Outcome, RevealEvent, RevealOutcome, Side, Tag,
} from "./types";

/** Generische Öffnung (Setup schlägt Reaktion, Karte ohne eigene `opening`): gilt für jeden Angriff. */
const ALL_TAGS = Object.keys(TAG_DE) as Tag[];

// ------------------------------------------------------------------
// Arbeitskopie: Zustand wird nur in dieser Datei über `Ctx` mutiert,
// der Eingabe-State bleibt unverändert (strukturelle Kopie am Anfang).
// ------------------------------------------------------------------
interface Ctx {
  s: MatchState;
  ev: RevealEvent[];
  lessonExtra: string | null;
}

function cloneFighter(f: FighterState): FighterState {
  return {
    ...f, deck: [...f.deck], hand: [...f.hand], discard: [...f.discard],
    opening: f.opening ? [...f.opening] : null,
    lastCounteredBy: f.lastCounteredBy ? [...f.lastCounteredBy] : null,
    history: [...f.history],
  };
}

function cloneState(s: MatchState): MatchState {
  return {
    ...s, p: cloneFighter(s.p), o: cloneFighter(s.o), log: [...s.log],
    backPointsAwarded: { ...s.backPointsAwarded },
  };
}

function gas(c: Ctx, side: Side, delta: number) {
  const f = c.s[side];
  const next = clamp(f.gas + delta, 0, MAX_GAS);
  if (next !== f.gas) c.ev.push({ t: "gas", side, delta: next - f.gas });
  f.gas = next;
}

function control(c: Ctx, side: Side, delta: number) {
  const f = c.s[side];
  const next = clamp(f.control + delta, 0, MAX_CONTROL);
  if (next !== f.control) c.ev.push({ t: "control", side, delta: next - f.control });
  f.control = next;
}

function setControl(c: Ctx, side: Side, value: number) {
  control(c, side, value - c.s[side].control);
}

function points(c: Ctx, side: Side, n: number) {
  if (!n) return;
  c.s[side].pts += n;
  c.ev.push({ t: "points", side, n });
}

/** Wendet ein Outcome aus Sicht von `side` an (Position, Rolle, Punkte, Kontrolle). */
function applyOutcome(c: Ctx, side: Side, o: Outcome) {
  const opp = other(side);
  const top: Side | null = o.role === "top" ? side : o.role === "bottom" ? opp : null;
  const moved = o.pos !== c.s.pos || top !== c.s.top;
  if (moved) {
    // Back-Phase endet bzw. wechselt → Hooks-Punkte dürfen neu vergeben werden.
    c.s.backPointsAwarded = { p: false, o: false };
    c.s.pos = o.pos;
    c.s.top = top;
    c.s.p.opening = null;
    c.s.o.opening = null;
    c.ev.push({ t: "move", pos: o.pos, top });
  }
  points(c, side, o.points ?? 0);
  if (moved) {
    setControl(c, side, o.controlSelf ?? (o.role === "top" ? 1 : 0));
    setControl(c, opp, 0);
  } else if (o.controlSelf !== undefined) {
    setControl(c, side, o.controlSelf);
  }
}

/** Angriff wirkt. Gibt true zurück, wenn das Match per Submission endet. */
function attackSucceeds(c: Ctx, side: Side, card: CardDef): boolean {
  if (card.drainGas) gas(c, other(side), -card.drainGas);
  if (card.submission) {
    c.s.result = { type: "submission", winner: side, card: card.id };
    c.ev.push({ t: "submission", side, card: card.id });
    return true;
  }
  if (card.success) applyOutcome(c, side, card.success);
  return false;
}

/** Setup wirkt: Kontrolle, Öffnung, Gas-Druck, Hooks-Punkte. */
function setupApplies(c: Ctx, side: Side, card: CardDef, forceOpening: boolean) {
  const f = c.s[side];
  control(c, side, card.controlGain ?? 1);
  const tags = card.opening?.tags ?? (forceOpening ? ALL_TAGS : null);
  if (tags) {
    f.opening = [...tags];
    c.ev.push({ t: "opening", side });
  }
  if (card.drainGas) gas(c, other(side), -card.drainGas);
  if (card.backPoints && c.s.pos === "back" && c.s.top === side && !c.s.backPointsAwarded[side]) {
    points(c, side, card.backPoints);
    c.s.backPointsAwarded = { ...c.s.backPointsAwarded, [side]: true };
    c.lessonExtra = LESSON.hooks;
  }
}

/** Reaktion greift: Angreifer verliert Kontrolle (Submission: auf 0), Folgepositionen. */
function counterApplies(c: Ctx, reactor: Side, reaction: CardDef, attack: CardDef) {
  const attacker = other(reactor);
  if (reaction.onCounter) applyOutcome(c, reactor, reaction.onCounter);
  else if (attack.onCountered) applyOutcome(c, attacker, attack.onCountered);
  if (attack.submission) {
    // Danaher: Wer zur Submission wechselt, riskiert die Kontrolle → 0 (auch nach Positionsverlust).
    setControl(c, attacker, 0);
    c.ev.push({ t: "submissionDefended", side: reactor, card: attack.id });
  } else {
    control(c, attacker, -1);
  }
  c.s[attacker].lastCounteredBy = [...(reaction.counters ?? [])];
}

/** Effektives Tempo inkl. Öffnung (−2) und Erschöpfung (+1 bei Gas ≤ 2, vor Kosten gemessen). */
export function effectiveTempo(card: CardDef, f: FighterState): number {
  let t = card.tempo ?? 3;
  if (f.opening && intersects(f.opening, card.tags)) t -= 2;
  if (f.gas <= 2) t += 1;
  return t;
}

type Res = Omit<RevealOutcome, "pCard" | "oCard" | "events">;

// ------------------------------------------------------------------
export function resolveReveal(
  state: MatchState, pCardId: string, oCardId: string, _rng?: Rng,
): { state: MatchState; outcome: RevealOutcome } {
  const pc = CARD[pCardId];
  const oc = CARD[oCardId];
  if (!pc || !oc) throw new Error(`Unbekannte Karte: ${!pc ? pCardId : oCardId}`);
  if (state.result) throw new Error("Match ist bereits beendet");

  const before = state; // für Tempo-/Dilemma-Berechnung (Werte vor Kosten)
  const c: Ctx = { s: cloneState(state), ev: [], lessonExtra: null };
  const cards: Record<Side, CardDef> = { p: pc, o: oc };

  // Kosten
  gas(c, "p", -pc.gas);
  gas(c, "o", -oc.gas);
  // Letzter Konter verfällt; wird bei neuem Konter unten gesetzt
  c.s.p.lastCounteredBy = null;
  c.s.o.lastCounteredBy = null;

  const res = decide(c, before, cards);

  for (const side of ["p", "o"] as const) {
    // Öffnung wird vom nächsten eigenen Angriff mit passendem Tag verbraucht
    // (Positionswechsel löschen sie ohnehin in applyOutcome).
    const op = before[side].opening;
    if (cards[side].kind === "angriff" && op && intersects(op, cards[side].tags)) c.s[side].opening = null;
    c.s[side].lastPlayed = cards[side].id;
    c.s[side].history = [...c.s[side].history, cards[side].kind];
  }

  // Regeneration +1 (max 12), sofern nicht beendet
  if (!c.s.result) {
    gas(c, "p", 1);
    gas(c, "o", 1);
  }

  const lesson = c.lessonExtra && !c.s.result ? c.lessonExtra : res.lesson;
  const who: Side | "sys" = res.winner === "p" || res.winner === "o" ? res.winner : "sys";
  c.s.log = [...c.s.log, { turn: state.turn, text: res.headline, who }];

  return {
    state: c.s,
    outcome: { pCard: pCardId, oCard: oCardId, events: c.ev, ...res, lesson },
  };
}

function decide(c: Ctx, before: MatchState, cards: Record<Side, CardDef>): Res {
  const kp = cards.p.kind;
  const ko = cards.o.kind;

  if (kp === ko) {
    if (kp === "angriff") return attackVsAttack(c, before, cards);
    if (kp === "setup") {
      setupApplies(c, "p", cards.p, false);
      setupApplies(c, "o", cards.o, false);
      return { winner: "both", rule: "beide-setup", ...explain({ rule: "beide-setup", p: cards.p, o: cards.o }) };
    }
    gas(c, "p", 1);
    gas(c, "o", 1);
    return { winner: "none", rule: "patt", ...explain({ rule: "patt", p: cards.p, o: cards.o }) };
  }

  const sideOf = (k: string): Side => (kp === k ? "p" : "o");
  const has = (k: string) => kp === k || ko === k;

  if (has("angriff") && has("setup")) {
    const a = sideOf("angriff");
    const atk = cards[a];
    const set = cards[other(a)];
    const tap = attackSucceeds(c, a, atk);
    return {
      winner: a, rule: "angriff>setup",
      ...explain({ rule: "angriff>setup", side: a, atk, set, tap, ctrlBefore: before[a].control }),
    };
  }

  if (has("setup") && has("reaktion")) {
    const st = sideOf("setup");
    const set = cards[st];
    const re = cards[other(st)];
    setupApplies(c, st, set, true);
    gas(c, other(st), -1);
    return { winner: st, rule: "setup>reaktion", ...explain({ rule: "setup>reaktion", side: st, set, re }) };
  }

  // Reaktion vs. Angriff
  const a = sideOf("angriff");
  const r = other(a);
  const atk = cards[a];
  const re = cards[r];
  const tagMatch = intersects(re.counters, atk.tags);
  // Dilemma: die Tags, mit denen die Partnerkarte letzte Runde gekontert wurde, werden ignoriert.
  const ignored = dilemmaActive(atk, before[a]) ? before[a].lastCounteredBy ?? [] : [];
  const effCounters = (re.counters ?? []).filter((t) => !ignored.includes(t));
  const dilemma = tagMatch && !intersects(effCounters, atk.tags);

  if (tagMatch && !dilemma) {
    counterApplies(c, r, re, atk);
    return { winner: r, rule: "reaktion>angriff", ...explain({ rule: "reaktion>angriff", side: r, re, atk }) };
  }

  if (dilemma) c.ev.push({ t: "dilemma", side: a });
  const tap = attackSucceeds(c, a, atk);
  return { winner: a, rule: "durch", ...explain({ rule: "durch", side: a, atk, re, tap, dilemma }) };
}

function attackVsAttack(c: Ctx, before: MatchState, cards: Record<Side, CardDef>): Res {
  const tp = effectiveTempo(cards.p, before.p);
  const to = effectiveTempo(cards.o, before.o);
  if (tp === to) {
    gas(c, "p", -1);
    gas(c, "o", -1);
    return { winner: "none", rule: "scramble", ...explain({ rule: "scramble", p: cards.p, o: cards.o }) };
  }
  const w: Side = tp < to ? "p" : "o";
  const l = other(w);
  const tap = attackSucceeds(c, w, cards[w]);
  const usedOpening = !!before[w].opening && intersects(before[w].opening!, cards[w].tags);
  return {
    winner: w, rule: "tempo",
    ...explain({
      rule: "tempo", side: w, win: cards[w], lose: cards[l], tw: Math.min(tp, to), tl: Math.max(tp, to), tap,
      usedOpening, loserTired: before[l].gas <= 2,
    }),
  };
}
