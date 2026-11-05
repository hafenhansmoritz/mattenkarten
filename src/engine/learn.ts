// Lern-Ebene für Neulinge: Dreieck-Helfer, beste Antwort, Coach-Tipps, Rückblick und Fehler-Deck.
// Reine Funktionen – nutzen die echte Auflösung (resolveReveal), damit Lernsätze nie von den Regeln abweichen.
import { CARD, CARDS } from "../data/cards";
import { BEATEN_BY, BEATS } from "./ai";
import { POS_IN, playableCards } from "./match";
import { resolveReveal } from "./resolve";
import { type Rng, mulberry32, shuffle } from "./rng";
import { MAX_GAS, cardFitsSlot, intersects, newFighter, other, roleOf } from "./state";
import type {
  CardDef, CardKind, Hint, MatchState, Mistake, PositionId, Recap, RevealOutcome, Role, Side, Tag, TurnRecord,
} from "./types";

// ------------------------------------------------------------------
// Grundlagen
// ------------------------------------------------------------------

/** Dreieck: Angriff > Setup > Reaktion > Angriff. */
export function beats(a: CardKind, b: CardKind): boolean {
  return BEATS[a] === b;
}

/** Greift diese Reaktion gegen diesen Angriff? (Tag-Abgleich, ohne Dilemma) */
export function counterWorks(reaction: CardDef, attack: CardDef): boolean {
  return reaction.kind === "reaktion" && attack.kind === "angriff" && intersects(reaction.counters, attack.tags);
}

/** Anzeigename für Neulinge: Alltagstitel, sonst Fachbegriff. */
export function plainName(id: string): string {
  const c = CARD[id];
  return c ? c.plain ?? c.name : id;
}

/** Typ-Namen in Alltagssprache. */
export const KIND_DE: Record<CardKind, string> = { angriff: "Angriff", setup: "Vorbereiten", reaktion: "Kontern" };

/** Was der Gegner mit einem Angriff dieser Familie tut – aus Sicht des Spielers ("Er …"). */
const ATTACK_PHRASE: Record<Tag, string> = {
  strike: "Er schlug zu", shot: "Er griff deine Beine an", single: "Er griff ein Bein an",
  legs: "Er griff deine Beine an", clinch: "Er wollte in den Clinch", snap: "Er zog deinen Kopf runter",
  drag: "Er zog deinen Arm vorbei", bodylock: "Er umklammerte deinen Körper", hip: "Er warf über die Hüfte",
  reap: "Er sichelte dein Bein", escape: "Er wollte entkommen", bridge: "Er wollte dich abwerfen",
  sweep: "Er wollte dich umdrehen", pass: "Er wollte an deinen Beinen vorbei", advance: "Er wollte aufsteigen",
  choke: "Er wollte dich würgen", armlock: "Er griff deinen Arm an", shoulderlock: "Er griff deine Schulter an",
  trianglechoke: "Er wollte dich mit den Beinen würgen", behind: "Er wollte hinter dich",
};

/** Was eine Reaktion abwehrt – kurze Alltagsfamilie. */
const TAG_PLAIN: Record<Tag, string> = {
  strike: "Schläge", shot: "Beinangriffe", single: "Beinangriffe", legs: "Beinangriffe", clinch: "Clinch-Versuche",
  snap: "Kopf-Runterziehen", drag: "Armzüge", bodylock: "Umklammern", hip: "Hüftwürfe", reap: "Sicheln",
  escape: "Fluchten", bridge: "Abwerfen", sweep: "Umdrehen", pass: "Vorbeigehen", advance: "Aufsteigen",
  choke: "Würger", armlock: "Armhebel", shoulderlock: "Schulterhebel", trianglechoke: "Beinwürger",
  behind: "Hinter-dich-Gehen",
};

function attackPhrase(c: CardDef): string {
  const t = c.tags?.[0];
  return t ? ATTACK_PHRASE[t] : "Er griff an";
}

function familyPlain(tags: Tag[] | undefined): string {
  const list = [...new Set((tags ?? []).map((t) => TAG_PLAIN[t]))];
  if (list.length <= 1) return list.join("");
  return list.slice(0, -1).join(", ") + " und " + list[list.length - 1];
}

/** Positions-Rang aus Sicht einer Rolle (Gracie-Barra-Hierarchie, grob). */
function rank(pos: PositionId, role: Role): number {
  const top: Partial<Record<PositionId, number>> = { back: 5, mount: 4, side: 3, fhl: 2, guard: 1 };
  const bottom: Partial<Record<PositionId, number>> = { back: -5, mount: -4, side: -3, fhl: -2, guard: 0 };
  if (role === "top") return top[pos] ?? 0;
  if (role === "bottom") return bottom[pos] ?? 0;
  return 0;
}

function roleFor(top: Side | null, side: Side): Role {
  return top === null ? "neutral" : top === side ? "top" : "bottom";
}

// ------------------------------------------------------------------
// Beste Antwort
// ------------------------------------------------------------------

const RULE_ORDER: Partial<Record<RevealOutcome["rule"], number>> = {
  "reaktion>angriff": 0, "setup>reaktion": 1, "angriff>setup": 2, tempo: 3, durch: 4,
};

/** Simuliert den Reveal aus Sicht von `side` (echte Regeln). */
function simulate(state: MatchState, side: Side, mine: string, theirs: string) {
  const [pc, oc] = side === "p" ? [mine, theirs] : [theirs, mine];
  const { state: after, outcome } = resolveReveal(state, pc, oc);
  return { after, outcome };
}

function whySentence(rule: RevealOutcome["rule"], mine: CardDef, theirs: CardDef): string {
  const me = plainName(mine.id);
  switch (rule) {
    case "reaktion>angriff":
      return `${attackPhrase(theirs)} – Kontern mit ${me} hätte ihn gestoppt.`;
    case "setup>reaktion":
      return `Er wartete auf deinen Angriff – mit ${me} hättest du ihn ausgetrickst.`;
    case "angriff>setup":
      return `Er bereitete nur vor – ${me} hätte ihn sofort erwischt.`;
    case "tempo":
      return `Beide griffen an – ${me} ist schneller und wäre zuerst durchgekommen.`;
    default:
      return `Sein Konter passte nicht – ${me} wäre durchgegangen.`;
  }
}

function answerAmong(
  state: MatchState, side: Side, candidates: string[], oppCardId: string,
): { cardId: string | null; why: string } {
  const theirs = CARD[oppCardId];
  if (!theirs || state.result) return { cardId: null, why: "" };
  const roleBefore = roleOf(state, side);
  let best: { id: string; key: number[]; rule: RevealOutcome["rule"] } | null = null;
  for (const id of candidates) {
    if (!CARD[id]) continue;
    const { after, outcome } = simulate(state, side, id, oppCardId);
    if (outcome.winner !== side) continue;
    const tap = after.result?.type === "submission" && after.result.winner === side;
    const gain = (after[side].pts - state[side].pts) + rank(after.pos, roleOf(after, side)) - rank(state.pos, roleBefore);
    // Sortierschlüssel (aufsteigend besser): Tap zuerst, dann Regel-Vorrang, dann Gewinn, dann Deck- vor Grundkarte
    const key = [tap ? -1 : RULE_ORDER[outcome.rule] ?? 9, -gain, CARD[id].basic ? 1 : 0];
    if (!best || lexLess(key, best.key)) best = { id, key, rule: outcome.rule };
  }
  if (!best) return { cardId: null, why: "" };
  return { cardId: best.id, why: whySentence(best.rule, CARD[best.id], theirs) };
}

function lexLess(a: number[], b: number[]): boolean {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i];
  return false;
}

/**
 * Welche spielbare Karte von `side` hätte gegen `oppCardId` gewonnen?
 * Vorrang: passender Konter > Setup gegen Reaktion > Angriff gegen Setup > schnelleres Tempo.
 */
export function bestAnswer(state: MatchState, side: Side, oppCardId: string): { cardId: string | null; why: string } {
  const ids = playableCards(state, side).filter((x) => x.playable).map((x) => x.id);
  return answerAmong(state, side, ids, oppCardId);
}

// ------------------------------------------------------------------
// Coach-Tipp (3 Stufen)
// ------------------------------------------------------------------

const BAD_BOTTOM: PositionId[] = ["fhl", "side", "mount", "back"];
const ESCAPE_TAGS: Tag[] = ["escape", "bridge", "sweep"];

interface Pick { id: string; q: string; why: string }

function progressGain(state: MatchState, side: Side, c: CardDef): number {
  const o = c.success;
  if (!o) return -1;
  return rank(o.pos, o.role) - rank(state.pos, roleOf(state, side)) + (o.points ?? 0) * 0.5 + (o.role === "top" ? 0.5 : 0);
}

function recommend(state: MatchState, side: Side, intent: CardKind | null): Pick | null {
  const ids = playableCards(state, side).filter((x) => x.playable).map((x) => x.id);
  if (ids.length === 0) return null;
  const cards = ids.map((id) => CARD[id]);
  const role = roleOf(state, side);
  const prefDeck = (a: CardDef, b: CardDef) => (a.basic ? 1 : 0) - (b.basic ? 1 : 0);

  // 1) Absicht bekannt → Typ, der sie schlägt
  if (intent) {
    const want = BEATEN_BY[intent];
    let pool = cards.filter((c) => c.kind === want);
    if (pool.length > 0) {
      if (want === "reaktion") {
        // Nur öffentliches Wissen: alle Angriffe, die der Gegner in diesem Slot überhaupt spielen könnte,
        // gewichtet nach Gefahr (Punkte, Positionsgewinn, Submission) und seiner sichtbaren Öffnung.
        const opp = other(side);
        const oppRole = roleOf(state, opp);
        const attacks = CARDS.filter((c) => c.kind === "angriff" && cardFitsSlot(c, state.pos, oppRole));
        const danger = (a: CardDef) => 1 + (a.success?.points ?? 0) + (a.submission ? 4 : 0)
          + Math.max(0, progressGain(state, opp, a)) + (intersects(state[opp].opening ?? undefined, a.tags) ? 2 : 0);
        const covered = (r: CardDef) => attacks.filter((a) => counterWorks(r, a)).reduce((n, a) => n + danger(a), 0);
        pool = [...pool].sort((a, b) => covered(b) - covered(a) || (b.onCounter ? 1 : 0) - (a.onCounter ? 1 : 0) || prefDeck(a, b));
        const c = pool[0];
        return {
          id: c.id,
          q: "Er will angreifen – welche Karte stoppt einen Angriff?",
          why: c.counters?.length ? `Er will angreifen, und das wehrt ${familyPlain(c.counters)} ab.` : "Er will angreifen – Kontern schlägt Angriff.",
        };
      }
      if (want === "setup") {
        pool = [...pool].sort((a, b) => (b.controlGain ?? 1) - (a.controlGain ?? 1) || (b.opening ? 1 : 0) - (a.opening ? 1 : 0) || prefDeck(a, b));
        return {
          id: pool[0].id,
          q: "Er wartet auf deinen Angriff – wie lockst du ihn heraus?",
          why: "Er wartet auf einen Angriff – Vorbereiten trickst ihn aus und bringt Griff.",
        };
      }
      pool = [...pool].sort((a, b) => (b.submission ? 1 : 0) - (a.submission ? 1 : 0) || progressGain(state, side, b) - progressGain(state, side, a) || prefDeck(a, b));
      return {
        id: pool[0].id,
        q: "Er bereitet vor – was schlägt Vorbereiten?",
        why: "Er bereitet nur vor – ein Angriff erwischt ihn dabei.",
      };
    }
  }

  // 2) Abschluss, wenn möglich (Kontrolle reicht, sonst wäre die Karte nicht spielbar)
  const sub = cards.filter((c) => c.submission).sort(prefDeck)[0];
  if (sub) {
    return { id: sub.id, q: "Du hast genug Kontrolle – kannst du den Kampf beenden?", why: "Deine Kontrolle reicht – jetzt abschließen." };
  }

  // 3) Schlecht unten → raus
  if (role === "bottom" && BAD_BOTTOM.includes(state.pos)) {
    const esc = cards.filter((c) => c.kind === "angriff" && intersects(c.tags, ESCAPE_TAGS))
      .sort((a, b) => progressGain(state, side, b) - progressGain(state, side, a) || prefDeck(a, b))[0];
    const prep = cards.filter((c) => c.kind === "setup" && intersects(c.opening?.tags, ESCAPE_TAGS)).sort(prefDeck)[0];
    const c = esc ?? prep;
    if (c) {
      return {
        id: c.id,
        q: `Du liegst unten ${POS_IN[state.pos]} – erst mal raus.`,
        why: c === esc ? "Unten ist gefährlich – erst entkommen, dann weiter." : "Erst Platz schaffen – dann gelingt die Flucht.",
      };
    }
  }

  // 4) Submission auf der Hand, aber Kontrolle fehlt → Kontrolle aufbauen
  const hand = state[side].hand.map((id) => CARD[id]).filter(Boolean);
  const blockedSub = hand.some((c) => c.submission && cardFitsSlot(c, state.pos, role));
  const builder = cards.filter((c) => c.kind === "setup" && (c.controlGain ?? 1) > 0)
    .sort((a, b) => (b.controlGain ?? 1) - (a.controlGain ?? 1) || prefDeck(a, b))[0];
  if (blockedSub && builder) {
    return { id: builder.id, q: "Für den Abschluss fehlt dir noch Griff – was baut Kontrolle auf?", why: "Erst Position und Griff, dann die Submission." };
  }

  // 5) Kette vorantreiben
  const adv = cards.filter((c) => c.kind === "angriff" && progressGain(state, side, c) > 0)
    .sort((a, b) => progressGain(state, side, b) - progressGain(state, side, a) || prefDeck(a, b))[0];
  if (adv) {
    return { id: adv.id, q: "Wie kommst du einen Schritt weiter in der Kette?", why: "Das bringt dich eine bessere Position weiter." };
  }
  if (builder) {
    return { id: builder.id, q: "Kein guter Angriff da – wie bereitest du den nächsten vor?", why: "Vorbereiten baut Kontrolle für den nächsten Angriff." };
  }
  const any = [...cards].sort(prefDeck)[0];
  return { id: any.id, q: "Was ist hier dein Ziel?", why: "Das ist hier die sicherste Wahl." };
}

/**
 * Coach-Tipp für `side`. Stufe 1: Leitfrage ohne Karte. Stufe 2: + markierte Karte.
 * Stufe 3: Karte + Zug mit Begründung. Nutzt nur sichtbare Infos (Position, Hand, angezeigte Absicht).
 */
export function coachHint(state: MatchState, side: Side, level: 1 | 2 | 3, intentKind: CardKind | null): Hint {
  const pick = recommend(state, side, intentKind);
  if (!pick) return { level, text: "Gerade ist nichts spielbar." };
  if (level === 1) return { level, text: pick.q };
  if (level === 2) return { level, text: pick.q, cardId: pick.id };
  return { level, cardId: pick.id, text: `Spiel ${plainName(pick.id)}: ${pick.why}` };
}

// ------------------------------------------------------------------
// Rückblick & Fehler-Deck
// ------------------------------------------------------------------

/** Minimaler Zustand zum Nachstellen eines Zugs aus dem Protokoll (volles Gas, keine Öffnungen). */
function stateFromRecord(rec: TurnRecord): MatchState {
  const f = (s: Side) => ({ ...newFighter([]), pts: rec.ptsBefore[s], gas: MAX_GAS, control: 5 });
  return {
    pos: rec.pos, top: rec.top, turn: rec.turn, maxTurns: rec.turn + 1,
    p: f("p"), o: f("o"), log: [], result: null, backPointsAwarded: { p: true, o: true },
  };
}

/** Beste Antwort des Spielers in einem protokollierten Zug (nur Karten aus pPlayable). */
export function bestAnswerFor(rec: TurnRecord): { cardId: string | null; why: string } {
  return answerAmong(stateFromRecord(rec), "p", rec.pPlayable, rec.oCard);
}

function swing(rec: TurnRecord, tappedHere: boolean): number {
  const ptsLost = (rec.ptsAfter.o - rec.ptsBefore.o) - (rec.ptsAfter.p - rec.ptsBefore.p);
  const posLost = rank(rec.pos, roleFor(rec.top, "p")) - rank(rec.posAfter, roleFor(rec.topAfter, "p"));
  return (tappedHere ? 100 : 0) + ptsLost + posLost;
}

export function recap(state: MatchState): Recap {
  const hist = state.history ?? [];
  const res = state.result;
  const tapped = (i: number) =>
    i === hist.length - 1 && res?.type === "submission" && res.winner === "o" && hist[i].oCard === res.card;
  const scored = hist.map((rec, i) => ({ rec, s: swing(rec, tapped(i)), lost: rec.winner === "o" }));

  // Lernsätze: verlorene Züge zuerst, dann nach Schwere
  const lessons: string[] = [];
  for (const x of [...scored].sort((a, b) => Number(b.lost) - Number(a.lost) || b.s - a.s)) {
    if (x.rec.lesson && !lessons.includes(x.rec.lesson)) lessons.push(x.rec.lesson);
    if (lessons.length >= 3) break;
  }

  // Entscheidender Moment: größter Rückschlag
  let decisive: Recap["decisive"];
  const worst = scored.filter((x) => x.s > 0 || x.lost).sort((a, b) => b.s - a.s || Number(b.lost) - Number(a.lost))[0];
  if (worst) {
    const ans = bestAnswerFor(worst.rec);
    decisive = {
      record: worst.rec,
      ...(ans.cardId && ans.cardId !== worst.rec.pCard ? { better: ans.cardId } : {}),
      why: ans.cardId && ans.cardId !== worst.rec.pCard ? ans.why : worst.rec.lesson ?? worst.rec.headline,
    };
  }

  // Fehler: Gegner gewann, es gab eine bessere Karte
  const mistakes: Mistake[] = [];
  const seen = new Set<string>();
  for (const rec of hist) {
    if (rec.winner !== "o") continue;
    const ans = bestAnswerFor(rec);
    if (!ans.cardId || ans.cardId === rec.pCard) continue;
    const role = roleFor(rec.top, "p");
    const id = `${rec.pos}|${role}|${rec.oCard}`;
    if (seen.has(id)) continue;
    seen.add(id);
    mistakes.push({ id, pos: rec.pos, role, oCard: rec.oCard, pCard: rec.pCard, better: ans.cardId, why: ans.why });
  }
  return { lessons, ...(decisive ? { decisive } : {}), mistakes };
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Abruffrage fürs Fehler-Deck: richtige Karte + 2 plausible falsche aus demselben Slot. */
export function mistakeQuestion(m: Mistake, rng?: Rng): { q: string; options: string[]; answer: string; why: string } {
  const r = rng ?? mulberry32(hashStr(m.id));
  const opp = CARD[m.oCard];
  const top: Side | null = m.role === "neutral" ? null : m.role === "top" ? "p" : "o";
  const st = stateFromRecord({
    turn: 1, pos: m.pos, top, pCard: m.pCard, oCard: m.oCard, rule: "patt", winner: "none", headline: "",
    pPlayable: [], ptsBefore: { p: 0, o: 0 }, ptsAfter: { p: 0, o: 0 }, posAfter: m.pos, topAfter: top,
  });
  const inSlot = CARDS.filter((c) => cardFitsSlot(c, m.pos, m.role) && c.id !== m.better);
  const loses = (c: CardDef) => simulate(st, "p", c.id, m.oCard).outcome.winner !== "p";
  const wrongPool = inSlot.filter(loses);
  const better = CARD[m.better];
  // Plausibel: was du gespielt hast, dann gleicher Typ wie die Lösung, dann der Rest
  const ordered = [
    ...wrongPool.filter((c) => c.id === m.pCard),
    ...shuffle(wrongPool.filter((c) => c.id !== m.pCard && c.kind === better?.kind), r),
    ...shuffle(wrongPool.filter((c) => c.id !== m.pCard && c.kind !== better?.kind), r),
    ...shuffle(inSlot.filter((c) => !loses(c)), r), // Notnagel, falls zu wenige Falsche
  ];
  const wrong: string[] = [];
  for (const c of ordered) {
    if (!wrong.includes(c.id)) wrong.push(c.id);
    if (wrong.length >= 2) break;
  }
  const options = shuffle([m.better, ...wrong], r);
  const term = opp?.name ?? m.oCard;
  const plain = opp?.plain;
  const shown = plain && plain !== term ? `${plain} (${term})` : term;
  const ask = opp?.kind === "setup" ? "Was bestraft das?" : opp?.kind === "reaktion" ? "Wie trickst du das aus?" : "Was stoppt das?";
  return { q: `Er spielt ${shown} gegen dich ${POS_IN[m.pos]}. ${ask}`, options, answer: m.better, why: m.why };
}

