import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Card2, Event2, Grip2, Konter2, Round2, Side, State2, SubTrack, Zone } from "../types";
import { ZONES } from "../types";
import {
  newMatch, roleOf, boardFor, legalCards, playRound, aiChoose, threats as threatsOf,
  slotCards, cardById, PASS, KRAFT_MAX, gripsOf, chainFrom, finishThreats,
  checkKonter, withKonter, splitPlay, KONTER_COST,
} from "../engine";
import { FightersK2 } from "./FightersK2";
import type { TapState } from "../../components/fighters/choreo";
import { Board, deltasOf } from "./Board";
import { SubTracks } from "./SubTracks";
import { Hand2 } from "./Hand2";
import type { TutorialK2Def, TutorialK2Step } from "./tutorialTypes";
import { filterHandByZones, hiddenZones } from "./disclosure";
import { PREDICTIONS, PREDICTION_LABEL, outcomeOf, predictionFeedback, shouldPredict, type Prediction } from "./predict";
import { ATEM_LABEL, GripIcon, KIND_LABEL, KonterIcon, KraftIcon, LockIcon, POS_LABEL, ZONE_DAT, ZONE_LABEL, ZoneIcon, listDe } from "./meta";
import { Stamp, FloatText, useHitStop, Confetti, ImpactBurst, type StampTone } from "../../components/fx";
import { CoachAvatar } from "../../components/learn";
import { sfx } from "../../sound";
import { useGame } from "../../store";
import { collectRound } from "../collection/store";
import { Sammlung } from "../collection/Sammlung";
import { RarityGem } from "./frame";
import { rarityOf } from "./rarity";
import { ChainStrip } from "./ChainStrip";
import { firstUnseen, markKeywordSeen, readSeenKeywords, type KeywordId } from "../data/keywords";
import { KeywordPopover, KeywordToast } from "./Keywords";
import type { BossDef } from "../data/bosses";
import "../../styles/core2.css";

export interface ArenaK2Props {
  mode: "free" | "tutorial";
  tutorial?: TutorialK2Def;
  aiLevel?: 1 | 2 | 3;
  /** won: true/false bei Ende, null bei Abbruch. */
  onExit: (won: boolean | null) => void;
  /** Optional: Startzustand (Tests/Demos). Überschreibt tutorial.start. */
  initialState?: State2;
  seed?: number;
  /** Optional: Endzustand melden, sobald das Match vorbei ist (z. B. Tages-Challenge). */
  onResult?: (s: State2) => void;
  /** Optional: eigenes Urteil fürs Ende (z. B. „Challenge geschafft“). */
  verdict?: (s: State2) => { ok: boolean; text: string } | null;
  /** Optional (Bauplan 73): Boss mit Spielstil – KI-Stufe und Gewichte kommen vom Boss, am Ende steht sein Lehrsatz. */
  boss?: BossDef;
}

type Phase = "pick" | "predict" | "flip" | "impact" | "result" | "tap" | "release" | "end";

interface StampInfo { text: string; tone: StampTone; sub?: string; key: number }
interface FloatInfo { text: string; color: string; key: number; x: string }

function mulberry(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stempel für Schlüsselmomente aus Sicht des Spielers. */
export function stampFor(r: Round2): Omit<StampInfo, "key"> | null {
  const ev = r.events;
  const tap = ev.find((e): e is Extract<Event2, { t: "tap" }> => e.t === "tap");
  if (tap) return { text: "TAP!", tone: tap.winner === "p" ? "good" : "bad", sub: tap.sub };
  const mv = ev.find((e): e is Extract<Event2, { t: "move" }> => e.t === "move");
  if (mv) {
    // Wer hat bewegt? Befreiung: der vorher Untere. Sonst: wer danach oben ist (oder Rundensieger).
    const wasBottom: Side | null = r.topBefore ? (r.topBefore === "p" ? "o" : "p") : null;
    const mover: Side = mv.escape && wasBottom ? wasBottom
      : r.winner === "p" || r.winner === "o" ? r.winner
      : (mv.top ?? "p");
    const tone: StampTone = mover === "p" ? "good" : "bad";
    if (mv.escape) return { text: "BEFREIT!", tone, sub: `${mover === "p" ? "Du" : "Er"}: ${POS_LABEL[mv.pos]}` };
    const guardish = r.posBefore === "guard" || r.posBefore === "half" || r.posBefore === "turtle";
    if (guardish && r.topBefore === mover && mv.top === mover) return { text: "PASSIERT!", tone, sub: POS_LABEL[mv.pos] };
    // B16: Snap Down oder Sprawl in den Front Headlock ist kein Takedown – du hast seinen Kopf.
    if ((r.posBefore === "stand" || r.posBefore === "clinch") && mv.pos === "headlock") return { text: "KOPF GEFASST!", tone, sub: POS_LABEL[mv.pos] };
    if ((r.posBefore === "stand" || r.posBefore === "clinch") && mv.top) return { text: "TAKEDOWN!", tone, sub: POS_LABEL[mv.pos] };
    return { text: mv.top === mover ? "POSITION!" : "UMGEDREHT!", tone, sub: POS_LABEL[mv.pos] };
  }
  // Mechanik 4: „KONTER!“ heißt jetzt nur der vorbereitete, verdeckte Rahmen; ein offen gespielter Rahmen wehrt ab.
  const kt = ev.find((e): e is Extract<Event2, { t: "konter" }> => e.t === "konter" && e.on === "trigger");
  if (kt && r.rule === "rahmen>angriff") return { text: "KONTER!", tone: kt.side === "p" ? "good" : "bad", sub: "vorbereitet" };
  if (kt && r.rule === "aufbauen>rahmen") return { text: "FINTE!", tone: kt.side === "p" ? "bad" : "good", sub: "Konter verbraucht" };
  if (r.rule === "rahmen>angriff" && (r.winner === "p" || r.winner === "o")) {
    return r.winner === "p" ? { text: "ABGEWEHRT!", tone: "good" } : { text: "ABGEWEHRT", tone: "bad" };
  }
  const dl = ev.find((e) => e.t === "dilemma") as Extract<Event2, { t: "dilemma" }> | undefined;
  if (dl) return { text: "DILEMMA!", tone: dl.side === "p" ? "good" : "bad", sub: `${ZONE_LABEL[dl.zone]} offen` };
  return null;
}

/** Wichtigkeit einer Runde für die End-Analyse. */
function weight(r: Round2): number {
  let w = 0;
  for (const e of r.events) {
    if (e.t === "tap") w += 100;
    else if (e.t === "move") w += 40;
    else if (e.t === "points") w += 10 * e.n;
    else if (e.t === "dilemma") w += 15;
    else if (e.t === "sub") w += 12;
    else if (e.t === "zone") w += 3 * Math.abs(e.delta);
  }
  if (r.rule === "rahmen>angriff") w += 18;
  return w;
}

export function topWhys(history: Round2[], n = 3): { round: number; headline: string; why: string }[] {
  const seen = new Set<string>();
  const out: { round: number; headline: string; why: string }[] = [];
  for (const r of history.slice().sort((a, b) => weight(b) - weight(a) || b.round - a.round)) {
    if (!r.why || seen.has(r.why)) continue;
    seen.add(r.why);
    out.push({ round: r.round, headline: r.headline, why: r.why });
    if (out.length >= n) break;
  }
  return out.sort((a, b) => a.round - b.round);
}

function startState(props: ArenaK2Props, seed: number): State2 {
  if (props.initialState) return props.initialState;
  const t = props.mode === "tutorial" ? props.tutorial : undefined;
  return newMatch({
    seed,
    maxRounds: t?.maxRounds,
    start: t ? { pos: t.start.pos, top: t.start.top, board: t.start.board } : undefined,
    goal: t?.goal,
    grips: t?.grips,
    chains: t?.chains,
    konter: t?.konter,
  });
}

/** Kern-2-Arena: Szene, Körperkarte, Aufgabe-Leisten, Hand, Aufdeck-Choreografie, Tap-Moment, Ende. */
export function ArenaK2(props: ArenaK2Props) {
  const { mode, tutorial, onExit } = props;
  const tut = mode === "tutorial" ? tutorial : undefined;
  const boss = tut ? undefined : props.boss;
  const aiLevel = tut?.aiLevel ?? boss?.level ?? props.aiLevel ?? 2;
  const reduced = !!useReducedMotion();
  const game = useGame();

  const [matchNo, setMatchNo] = useState(0);
  const seed = (tut?.seed ?? props.seed ?? Date.now() % 100000) + matchNo * 7919;
  const rng = useMemo(() => mulberry(seed), [seed]);
  const [s, setS] = useState<State2>(() => startState(props, seed));
  const [shown, setShown] = useState<State2>(s);      // was die Bühne gerade zeigt (verzögert zur Choreografie)
  const [phase, setPhase] = useState<Phase>("pick");
  const [sel, setSel] = useState<string | null>(null);
  const [round, setRound] = useState<Round2 | null>(null);
  const [cards, setCards] = useState<{ p: Card2 | null; o: Card2 | null }>({ p: null, o: null });
  const [stamp, setStamp] = useState<StampInfo | null>(null);
  const [floats, setFloats] = useState<FloatInfo[]>([]);
  const [burst, setBurst] = useState<number | null>(null);
  /** Mechanik 3: kurzer „KETTE!“-Effekt nach einem Ketten-Treffer (beide Kartennamen). */
  const [chainFx, setChainFx] = useState<{ side: Side; from: string; card: string; key: number } | null>(null);
  /** Mechanik 4: „KONTER!“-Effekt beim Auslösen (Kartenname; feint = er/du hast ihn mit einer Finte rausgelockt). */
  const [konterFx, setKonterFx] = useState<{ side: Side; card: string; feint: boolean; key: number } | null>(null);
  /** Mechanik 4: zum verdeckten Legen markierter Rahmen (zusätzlich zur gewählten Karte). */
  const [konterSel, setKonterSel] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [bubbleDone, setBubbleDone] = useState<number[]>([]);
  const [tapOk, setTapOk] = useState<boolean | null>(null);
  /** Körper-Animation im Tap-Moment: hold → tapping (Verteidiger klopft) → release (Angreifer lässt los). */
  const [tapAnim, setTapAnim] = useState<TapState>(null);
  // Vorhersage: Runde ist schon berechnet, wird aber erst nach dem Tipp aufgedeckt.
  const [pending, setPending] = useState<{ pId: string; oId: string; next: State2; r: Round2 } | null>(null);
  const [guess, setGuess] = useState<Prediction | null>(null);
  const [predStats, setPredStats] = useState({ n: 0, ok: 0 });
  const [frozen, hitStop] = useHitStop();
  const [fx, setFx] = useState<{ shake: "x" | "y" | null; flash: Side | null; zoom: boolean; slowmo: boolean; windup: Side | null }>({ shake: null, flash: null, zoom: false, slowmo: false, windup: null });
  /** In diesem Match neu gesammelte Karten (Sammlung, Schritt 71). */
  const [newCards, setNewCards] = useState<string[]>([]);
  const [showSammlung, setShowSammlung] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (ms: number, f: () => void) => { timers.current.push(setTimeout(f, reduced ? Math.min(ms, 120) : ms)); };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  // Gong zu Beginn jedes Matches (auch Revanche) und am Ende.
  useEffect(() => { sfx.gong(); }, [matchNo]);
  const resultSent = useRef(false);
  useEffect(() => {
    if (phase !== "end") return;
    sfx.gong();
    if (!resultSent.current) { resultSent.current = true; props.onResult?.(s); }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- abgeleitete Infos ----------
  const myRole = roleOf(s, "p");
  const hand = useMemo(() => slotCards(s.pos, myRole), [s.pos, myRole]);
  const legal = useMemo(() => legalCards(s, "p"), [s]);
  const anyLegal = legal.some((l) => l.ok);
  const myBoard = useMemo(() => boardFor(s, "p"), [s]);
  const thr = useMemo(() => threatsOf(s, "p"), [s]);
  const hisLocked = s.o.locked.map((id) => cardById(id)).filter(Boolean) as Card2[];
  // Mechanik 4: Konter (eigener sichtbar, seiner nur „liegt“), Prüfung fürs Hand-Angebot und für die gewählte Kombination.
  const myKonter = s.konter?.p, hisKonter = s.konter?.o;
  const konterProp = useMemo(() => (s.noKonter ? undefined : {
    sel: konterSel, mine: myKonter?.card ?? null, cost: KONTER_COST,
    check: (id: string) => { const c = cardById(id); return c ? checkKonter(s, "p", c, null) : { ok: false }; },
    onToggle: (id: string | null) => { setKonterSel(id); if (id) { setSel((x) => (x === id ? null : x)); sfx.click(); } },
  }), [s, konterSel, myKonter?.card]);
  const konterCombo = konterSel ? checkKonter(s, "p", cardById(konterSel)!, sel ? cardById(sel) ?? null : null) : null;
  // Mechanik 3: bereite Ketten (deine spielbaren Ketten-Karten → Vorrunden-Karte) und „Abschluss möglich“ für beide Seiten.
  const chainReady = useMemo(() => {
    const out: Record<string, string> = {};
    for (const l of legal) { const c = l.ok ? cardById(l.id) : undefined; const f = c && chainFrom(s, "p", c); if (f) out[c!.id] = f.term; }
    return out;
  }, [s, legal]);
  // Erste drei Lektionen: unverändert (Ketten aus, keine neue Anzeige).
  const showFinish = phase === "pick" && tut?.chains !== false;
  const finishOn = useMemo(() => (showFinish ? [...finishThreats(s, "p"), ...finishThreats(s, "o")] : []), [s, showFinish]);
  const hisFinish = finishOn.find((f) => f.side === "o");
  const shownThreats = phase === "pick" ? thr : [];

  // Tutorial-Schritte dieser Runde
  const stepsNow = (when: TutorialK2Step["when"]) =>
    (tut?.steps ?? []).map((st, i) => ({ ...st, i })).filter((st) => st.when === when && (st.round == null || st.round === s.round));
  const startBubble = phase === "pick" ? stepsNow("start").find((st) => !bubbleDone.includes(st.i)) : undefined;
  const pickStep = phase === "pick" ? stepsNow("pick")[0] : undefined;
  const afterStep = phase === "result" && round ? (tut?.steps ?? []).find((st) => st.when === "after" && (st.round == null || st.round === round.round)) : undefined;
  const requireCard = pickStep?.requireCard ?? startBubble?.requireCard;
  const hlZone = (startBubble ? startBubble.highlightZone : pickStep?.highlightZone) ?? null;

  // Schrittweises Aufdecken: nur Zonen der Lektion aktiv (reiner UI-Filter).
  const hidZones = useMemo(() => hiddenZones(tut?.zones), [tut]);
  const handShown = useMemo(() => filterHandByZones(hand, legal, tut?.zones, requireCard), [hand, legal, tut, requireCard]);

  // Schlüsselwörter: beim ersten Auftauchen eine Zeile (höchstens eine pro Runde; nicht in Lektionen – die erklären selbst).
  const [kwSeen, setKwSeen] = useState<KeywordId[]>(readSeenKeywords);
  const [kwToast, setKwToast] = useState<KeywordId | null>(null);
  const [kwPop, setKwPop] = useState<KeywordId | null>(null);
  const kwRound = useRef(0);
  const liveGrips = useMemo(() => gripsOf(s), [s]);
  useEffect(() => {
    if (phase !== "pick" || kwToast || kwRound.current === s.round + matchNo * 100) return;
    // Mechanik 2: liegt der erste Griff auf dem Brett (auch seiner), einmal „Griff“ erklären – auch in späteren Lektionen.
    const gripNew = liveGrips.length > 0 && !kwSeen.includes("griff");
    // Mechanik 4: hat er zum ersten Mal einen Konter vorbereitet, einmal „Konter“ erklären.
    const konterNew = !!s.konter?.o && !kwSeen.includes("konter");
    if (tut && !gripNew && !konterNew) return;
    const id = gripNew ? "griff" : konterNew ? "konter" : firstUnseen(handShown, kwSeen);
    if (!id) return;
    kwRound.current = s.round + matchNo * 100;
    markKeywordSeen(id);
    setKwSeen((k) => [...k, id]);
    setKwToast(id);
  }, [tut, phase, handShown, kwSeen, kwToast, s.round, matchNo, liveGrips, s.konter?.o]);
  useEffect(() => { if (phase !== "pick") setKwToast(null); }, [phase]);
  const closeKwToast = useCallback(() => setKwToast(null), []);

  // ---------- Aufdecken ----------
  const reveal = () => {
    if (phase !== "pick") return;
    const pCard = sel ?? (anyLegal ? null : PASS);
    if (!pCard) return;
    // Mechanik 4: zusätzlich verdeckter Konter (nur, wenn die Kombination legal ist – sonst ohne).
    const pId = konterSel && konterCombo?.ok ? withKonter(pCard, konterSel) : pCard;
    // Erst die KI-Karte, dann das Ergebnis auf dem (unveränderten) Zustand berechnen.
    const oId = aiChoose(s, "o", aiLevel, rng, boss?.style);
    const { state: next, round: r } = playRound(s, pId, oId);
    if (shouldPredict(tut, s.round)) {
      setPending({ pId, oId, next, r });
      setGuess(null);
      setPhase("predict");
      sfx.select();
      return;
    }
    runReveal(pId, oId, next, r);
  };

  const makeGuess = (g: Prediction) => {
    if (!pending || guess) return;
    setGuess(g);
    const ok = outcomeOf(pending.r) === g;
    setPredStats((st) => ({ n: st.n + 1, ok: st.ok + (ok ? 1 : 0) }));
    if (ok) sfx.points(); else sfx.counter();
  };

  const revealPending = () => {
    if (!pending) return;
    const { pId, oId, next, r } = pending;
    setPending(null);
    setGuess(null);
    runReveal(pId, oId, next, r);
  };

  function runReveal(_pId: string, _oId: string, next: State2, r: Round2) {
    // Gezeigt wird, was wirklich wirkte (bei ausgelöstem Konter der Konter-Rahmen).
    setCards({ p: cardById(r.pCard) ?? null, o: cardById(r.oCard) ?? null });
    setRound(r);
    setMore(false);
    setPhase("flip");
    sfx.flip();
    if (r.events.some((e) => e.t === "kraft" && e.side === "p" && e.delta < 0)) later(180, () => sfx.breath());
    setFx((f) => ({ ...f, windup: "p" }));
    later(260, () => setFx((f) => ({ ...f, windup: "o" })));

    const st = stampFor(r);
    const moved = r.events.some((e) => e.t === "move");
    const tapped = r.events.some((e) => e.t === "tap");
    const flipMs = 900;
    later(flipMs, () => {
      // Aufprall
      setPhase("impact");
      setS(next);
      setShown(next);
      const strong = moved || tapped || r.rule === "rahmen>angriff";
      setFx({
        windup: null,
        shake: strong ? (moved ? "y" : "x") : null,
        flash: r.winner === "p" || r.winner === "o" ? (r.winner === "p" ? "o" : "p") : null,
        zoom: tapped || moved, slowmo: moved, });
      if (strong) { hitStop(tapped ? 160 : 90); setBurst(Date.now()); }
      const got = collectRound(r);
      if (got.length) setNewCards((n) => [...n, ...got.filter((id) => !n.includes(id))]);
      if (tapped || moved) sfx.mat(); else if (r.rule === "rahmen>angriff") sfx.counter(); else sfx.select();
      if (st) setStamp({ ...st, key: Date.now() });
      const kt = r.events.find((e): e is Extract<Event2, { t: "konter" }> => e.t === "konter" && e.on === "trigger");
      const kc = kt?.card ? cardById(kt.card) : undefined;
      // Auch bei reduzierter Bewegung lange genug stehen lassen (nur ohne Animation) – later() würde auf 120 ms kürzen.
      if (kt && kc) { setKonterFx({ side: kt.side, card: kc.plain, feint: r.rule === "aufbauen>rahmen", key: Date.now() }); timers.current.push(setTimeout(() => setKonterFx(null), 1700)); }
      const ch = r.events.find((e): e is Extract<Event2, { t: "chain" }> => e.t === "chain");
      if (ch) {
        const a = cardById(ch.from), b = cardById(ch.card);
        if (a && b) { setChainFx({ side: ch.side, from: a.term, card: b.term, key: Date.now() }); later(1500, () => setChainFx(null)); }
      }
      const pts = r.events.filter((e): e is Extract<Event2, { t: "points" }> => e.t === "points");
      if (pts.length) {
        sfx.points();
        setFloats(pts.map((e, i) => ({ text: `+${e.n}`, color: e.side === "p" ? "var(--gi-p)" : "var(--gi-o)", key: Date.now() + i, x: e.side === "p" ? "32%" : "68%" })));
      }
      later(420, () => setFx((f) => ({ ...f, shake: null, flash: null })));
      later(900, () => setFx((f) => ({ ...f, zoom: false, slowmo: false })));
      later(st ? 1150 : 650, () => {
        if (next.result?.type === "tap") {
          setPhase(next.result.winner === "o" ? "tap" : "release");
          // Spieler verteidigt: Griff sitzt, bis er tappt. Spieler greift an: er klopft sofort ab.
          setTapAnim(next.result.winner === "o" ? "hold" : "tapping");
          if (next.result.winner === "p") sfx.tap(); // er klopft dreimal ab
        } else setPhase("result");
      });
    });
  }

  // Weiter nach Tippen irgendwo
  const advance = useCallback(() => {
    if (phase !== "result") return;
    setRound(null); setCards({ p: null, o: null }); setSel(null); setKonterSel(null); setMore(false);
    if (s.result) { finish(); return; }
    setPhase("pick");
  }, [phase, s]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = () => {
    setPhase("end");
    const w = s.result?.winner === "p";
    later(200, () => (w ? sfx.win() : sfx.lose()));
  };

  // Tap-/Loslass-Moment: 3,5 s
  useEffect(() => {
    if (phase !== "tap" && phase !== "release") return;
    if (tapOk) return;
    const t = setTimeout(() => { setTapOk(false); setPhase("end"); (s.result?.winner === "p" ? sfx.win : sfx.lose)(); }, 3500);
    return () => clearTimeout(t);
  }, [phase, tapOk]); // eslint-disable-line react-hooks/exhaustive-deps
  const hitTap = () => {
    if (tapOk) return;
    if (phase === "tap") { game.set({ taps: game.taps + 1 }); sfx.tap(); } else game.set({ releases: game.releases + 1 });
    setTapOk(true);
    // Sicherheit als Belohnung: erst sieht man das Abklopfen bzw. das sofortige Loslassen, dann das Ende.
    if (phase === "tap") { setTapAnim("tapping"); later(950, () => setTapAnim("release")); }
    else setTapAnim("release");
    later(phase === "tap" ? 1800 : 1000, () => {
      setPhase("end");
      (s.result?.winner === "p" ? sfx.win : sfx.lose)();
    });
  };

  const rematch = () => {
    const n = matchNo + 1;
    setMatchNo(n);
    const ns = props.initialState ?? startState({ ...props, initialState: undefined }, (tut?.seed ?? props.seed ?? Date.now() % 100000) + n * 7919);
    setS(ns); setShown(ns); setPhase("pick"); setSel(null); setKonterSel(null); setRound(null); setTapOk(null); setTapAnim(null); setBubbleDone([]);
    setPending(null); setGuess(null); setPredStats({ n: 0, ok: 0 });
    setNewCards([]); resultSent.current = false;
    setCards({ p: null, o: null });
  };

  // ---------- Darstellung ----------
  const focus: Zone | null = phase === "pick" ? hlZone : round?.focusZone ?? null;
  const deltas = useMemo(() => (round && phase !== "flip" ? deltasOf(round.events) : null), [round, phase]);
  const zoneHL = round && round.focusZone && phase !== "pick" && phase !== "flip"
    ? { side: (round.winner === "o" ? "o" : "p") as Side, zone: round.focusZone } : null;
  const sameZone = !!(cards.p && cards.o && cards.p.zone === cards.o.zone);
  // Am weitesten fortgeschrittene Aufgabe-Leiste → Körperanimation (Schritt 1–3)
  const liveSub = useMemo(() => shown.subs.reduce<SubTrack | null>((b, t) => (t.step > 0 && (!b || t.step > b.step) ? t : b), null), [shown.subs]);
  const showCards = (phase === "flip" || phase === "impact") && (cards.p || cards.o);

  const threatLine = useMemo(() => {
    if (!thr.length) return "Er kann gerade nirgends angreifen.";
    return `Er kann gerade an ${listDe(thr.map((t) => ZONE_DAT[t.zone]))} angreifen.`;
  }, [thr]);

  const won = s.result?.winner === "p";
  const resultTitle = !s.result ? "" :
    s.result.type === "tap" ? (won ? "Du gewinnst per Aufgabe" : "Er gewinnt per Aufgabe") :
    s.result.type === "goal" ? "Ziel erreicht!" :
    s.result.winner === null ? "Unentschieden" : won ? "Sieg nach Punkten" : "Niederlage nach Punkten";

  // Kurze Ansage für Screenreader (eine dauerhafte Live-Region, damit sie zuverlässig vorliest).
  const announce = phase === "end" && s.result ? resultTitle
    : phase === "tap" ? "Klopf ab!" : phase === "release" ? "Er klopft ab – loslassen!"
    : phase === "result" && round ? `Runde ${round.round}: ${round.headline}` : "";

  return (
    <div className={`k2-arena${frozen ? " fx-frozen" : ""}${phase === "result" ? " is-result" : ""}`}
      onClick={phase === "result" ? advance : undefined}>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announce}</p>
      {/* Kopfzeile */}
      <header className="k2-head">
        <button type="button" className="k2-exit" aria-label="Zurück" onClick={(e) => { e.stopPropagation(); onExit(null); }}>‹</button>
        <div className="k2-hud p">
          <b className="k2-pts">{s.p.pts}</b>
          <Pips n={s.p.kraft} />
        </div>
        <div className="k2-round">
          <span className="k2-round-n">Runde {Math.min(s.round, s.maxRounds)}/{s.maxRounds}{shown.top && <> · <span className={shown.top}>{shown.top === "p" ? "du oben" : "er oben"}</span></>}</span>
          <span className="k2-pos">{POS_LABEL[shown.pos]}</span>
        </div>
        <div className="k2-hud o">
          <Pips n={s.o.kraft} />
          <b className="k2-pts">{s.o.pts}</b>
        </div>
      </header>
      <ChainStrip pos={shown.pos} subs={shown.subs} history={shown.history} reduced={reduced}
        last={phase === "impact" || phase === "result" ? round : null} />
      {tut && <div className="k2-tut-idea"><b>{tut.title}</b> · {tut.idea}</div>}

      {/* Szene */}
      <section className="k2-stage">
        <FightersK2 pos={shown.pos} top={shown.top} zone={zoneHL} sub={liveSub} tap={tapAnim} held={gripsOf(shown)} {...fx} className="k2-fighters" />
        {burst && <ImpactBurst key={burst} x="50%" y="58%" onDone={() => setBurst(null)} />}
        {floats.map((f) => (
          <FloatText key={f.key} text={f.text} color={f.color} x={f.x} y="40%" onDone={() => setFloats((fs) => fs.filter((x) => x.key !== f.key))} />
        ))}
        <AnimatePresence>{stamp && <Stamp key={stamp.key} text={stamp.text} tone={stamp.tone} sub={stamp.sub} onDone={() => setStamp(null)} />}</AnimatePresence>
        <AnimatePresence>
          {chainFx && (
            <motion.div key={chainFx.key} className={`k2-chainfx ${chainFx.side}`} role="status"
              aria-label={`${chainFx.side === "p" ? "Deine" : "Seine"} Kette: ${chainFx.from}, dann ${chainFx.card}`}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7, y: 8 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={reduced ? { duration: 0.1 } : { type: "spring", stiffness: 420, damping: 22 }}>
              <b>KETTE!</b>
              <span>{chainFx.from} <i aria-hidden>→</i> {chainFx.card}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {konterFx && (
            <motion.div key={konterFx.key} className={`k2-konterfx ${konterFx.side}${konterFx.feint ? " is-feint" : ""}`} role="status"
              aria-label={konterFx.feint
                ? `Finte: ${konterFx.side === "p" ? "dein" : "sein"} Konter ${konterFx.card} ist verbraucht`
                : `Konter: ${konterFx.side === "p" ? "dein" : "sein"} vorbereiteter Rahmen ${konterFx.card} springt ein`}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.25, rotateX: 70 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0 }} transition={reduced ? { duration: 0.1 } : { type: "spring", stiffness: 380, damping: 20 }}>
              <b><KonterIcon size={18} /> {konterFx.feint ? "FINTE!" : "KONTER!"}</b>
              <span>{konterFx.feint ? `${konterFx.side === "p" ? "Dein" : "Sein"} Konter verbraucht: ${konterFx.card}` : `${konterFx.side === "p" ? "Dein" : "Sein"} vorbereiteter Rahmen: ${konterFx.card}`}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Brett + Aufdeck-Ebene */}
      <section className="k2-board-wrap">
        <Board board={s.board} focus={focus} lastDeltas={deltas} threats={shownThreats} hidden={hidZones} grips={liveGrips}
          finish={finishOn.map((f) => ({ side: f.side, zone: f.zone }))} konterZone={myKonter?.zone ?? null} />
        <AnimatePresence>
          {showCards && (
            <RevealLayer key={`rv-${round?.round}`} p={cards.p} o={cards.o} same={sameZone} impact={phase === "impact"} reduced={reduced}
              set={round?.konterSet ?? []} trig={(round?.events ?? []).filter((e) => e.t === "konter" && e.on === "trigger").map((e) => (e as Extract<Event2, { t: "konter" }>).side)} />
          )}
        </AnimatePresence>
      </section>

      <SubTracks subs={s.subs} finish={finishOn.map((f) => ({ side: f.side, id: f.sub }))} />
      <GripStrip grips={liveGrips} onOpen={() => setKwPop("griff")} />
      <KonterStrip mine={myKonter} his={hisKonter} pending={phase === "pick" && konterSel ? cardById(konterSel) ?? null : null} onOpen={() => setKwPop("konter")} />

      {/* Ergebnis: eine schlanke Zeile */}
      <AnimatePresence>
        {phase === "result" && round && (
          <motion.section className="k2-why" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="k2-why-line">
              <span className="k2-why-txt"><b>{round.headline}</b> {round.why}</span>
              <button type="button" className="k2-more" onClick={(e) => { e.stopPropagation(); setMore(!more); }} aria-expanded={more}>{more ? "Weniger" : "Mehr"}</button>
            </div>
            <AnimatePresence>
              {more && (
                <motion.div className="k2-why-more" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}>
                  <PlayedRow label="Du" c={cards.p} />
                  <PlayedRow label="Er" c={cards.o} />
                  {cards.p && cards.p.keys.length > 0 && <p className="k2-keys"><b>Darauf kommt es an:</b> {cards.p.keys.slice(0, 2).join(" · ")}</p>}
                  {cards.p && cards.p.mistakes.length > 0 && <p className="k2-mist"><b>Typischer Fehler:</b> {cards.p.mistakes[0]}</p>}
                  {cards.p?.safety && <p className="k2-safety"><b>Sicherheit:</b> {cards.p.safety}</p>}
                </motion.div>
              )}
            </AnimatePresence>
            {afterStep && <div className="k2-coach-line"><CoachAvatar size={22} /><span>{afterStep.text}</span></div>}
            <button type="button" className="k2-tapnext" onClick={(e) => { e.stopPropagation(); advance(); }}>Tippen für weiter</button>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Wahl */}
      {phase === "pick" && (
        <section className="k2-pick">
          {pickStep && !startBubble ? (
            <div className="k2-coach-line"><CoachAvatar size={22} /><span>{pickStep.text}</span></div>
          ) : (
            <div className={`k2-threatline${thr.length ? " has" : ""}${hisFinish ? " is-finish" : ""}`}>
              <span>{hisFinish ? `Er kann beenden – Rahmen an ${ZONE_DAT[hisFinish.zone]}!` : threatLine}{hisKonter ? " Er hat etwas vorbereitet." : ""}</span>
              {hisLocked.length > 0 && <span className="k2-hislock"><LockIcon size={10} /> {hisLocked.map((c) => c.plain).join(", ")}</span>}
            </div>
          )}
          <Hand2 cards={handShown} legal={legal} hiddenZones={hidZones} selected={sel} onSelect={(id) => { setSel(id); if (id) sfx.click(); }}
            myBoard={myBoard} locked={s.p.locked} kraft={s.p.kraft} requireCard={requireCard} highlightZone={hlZone}
            gripZones={liveGrips.filter((g) => g.owner === "p").map((g) => g.zone)} chainReady={chainReady} konter={konterProp} />
          <button type="button" className="btn primary big k2-go" disabled={anyLegal ? !sel || (!!requireCard && sel !== requireCard) || (!!konterCombo && !konterCombo.ok) : false} onClick={reveal}>
            {!anyLegal ? "Passen" : konterCombo && !konterCombo.ok && sel ? (konterCombo.reason ?? "Konter passt nicht") : sel ? (konterSel ? "Aufdecken + Konter" : "Aufdecken!") : konterSel ? "Wähle deine offene Karte" : "Wähle eine Karte"}
          </button>
        </section>
      )}

      {/* Vorhersage: „Was passiert jetzt?“ */}
      {phase === "predict" && pending && (
        <PredictPanel pending={pending} guess={guess} onGuess={makeGuess} onReveal={revealPending} />
      )}

      {/* Coach-Blase (Tutorial-Start) */}
      <AnimatePresence>
        {startBubble && (
          <motion.div className="k2-bubble" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}>
            <CoachAvatar size={34} />
            <p>{startBubble.text}</p>
            <button type="button" className="btn small" onClick={() => setBubbleDone((b) => [...b, startBubble.i])}>OK</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap / Loslassen */}
      <AnimatePresence>
        {(phase === "tap" || phase === "release") && s.result?.type === "tap" && (
          <motion.div className="tap-overlay k2-tap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="k2-tap-fig" aria-hidden="true">
              <FightersK2 pos={shown.pos} top={shown.top} sub={liveSub} tap={tapAnim} />
            </div>
            <span className="label">{s.result.sub} sitzt</span>
            <h2 className="display">{phase === "tap" ? "Klopf ab!" : "Er klopft ab!"}</h2>
            <p>{phase === "tap" ? "Früh und deutlich abklopfen. Verlieren gehört dazu – verletzt sein nicht." : "Sofort loslassen. Dein Partner vertraut dir."}</p>
            <motion.button type="button" className={`tap-btn ${phase}`} onClick={hitTap} autoFocus disabled={!!tapOk}
              animate={reduced ? undefined : { scale: [1, 1.07, 1] }} transition={{ repeat: Infinity, duration: 0.6 }}>
              {phase === "tap" ? "TAP" : "LOSLASSEN"}
            </motion.button>
            <motion.div className="tap-timer" initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: 3.5, ease: "linear" }} />
          </motion.div>
        )}
      </AnimatePresence>

      <KeywordToast id={kwToast} onOpen={(id) => { setKwPop(id); setKwToast(null); }} onDone={closeKwToast} />
      <KeywordPopover ids={kwPop ? [kwPop] : null} onClose={() => setKwPop(null)} />

      {showSammlung && (
        <div className="k2-sm-layer"><Sammlung onBack={() => setShowSammlung(false)} /></div>
      )}

      {/* Ende */}
      {phase === "end" && s.result && (
        <motion.div className="k2-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Confetti run={won} />
          <motion.div className={`k2-end-card ${won ? "won" : s.result.winner === null ? "draw" : "lost"}`}
            initial={{ scale: 0.88, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 240, damping: 20 }}>
            <span className="label">{tut ? tut.title : boss ? `Boss · ${boss.name}` : `Körperkarte · KI Stufe ${aiLevel}`}</span>
            <h2 className="display">{resultTitle}</h2>
            <div className="k2-end-score"><span className="p">{s.p.pts}</span><span className="sep">:</span><span className="o">{s.o.pts}</span></div>
            {tapOk !== null && (
              <p className={`k2-end-safety ${tapOk ? "ok" : "late"}`}>
                {tapOk ? (s.result.winner === "p" ? "Sauber losgelassen. So trainiert man sicher." : "Rechtzeitig abgeklopft. Genau richtig.")
                  : (s.result.winner === "p" ? "Zu spät losgelassen – im Training sofort lösen!" : "Zu spät geklopft – früh tappen schützt dich.")}
              </p>
            )}
            {predStats.n > 0 && (
              <p className="k2-end-pred">Vorhersagen: <b className="num">{predStats.ok} von {predStats.n}</b> richtig.
                {predStats.ok === predStats.n ? " Du liest die Lage schon gut." : " Falsche Tipps sind okay – genau daraus lernst du."}</p>
            )}
            <ol className="k2-end-why">
              {topWhys(s.history).map((w) => (
                <li key={w.round}><span className="k2-end-r">R{w.round}</span><span><b>{w.headline}</b> {w.why}</span></li>
              ))}
            </ol>
            {boss && <p className="k2-end-lesson"><b>Lehre:</b> {boss.lesson}</p>}
            {(() => { const v = props.verdict?.(s); return v ? <p className={`k2-end-verdict ${v.ok ? "ok" : "no"}`}>{v.text}</p> : null; })()}
            {newCards.length > 0 && (
              <button type="button" className="k2-end-collect" onClick={() => setShowSammlung(true)}>
                <span className="gems">{newCards.slice(0, 5).map((id) => { const c = cardById(id); return c ? <RarityGem key={id} rarity={rarityOf(c)} size={12} /> : null; })}</span>
                <b>{newCards.length === 1 ? "1 neue Karte gesammelt" : `${newCards.length} neue Karten gesammelt`}</b>
                <span>Ansehen ›</span>
              </button>
            )}
            <div className="k2-end-btns">
              <button type="button" className="btn ghost" onClick={() => onExit(won)}>Zurück</button>
              <button type="button" className="btn primary" onClick={rematch}>Revanche</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function PredictPanel({ pending, guess, onGuess, onReveal }: {
  pending: { pId: string; r: Round2 };
  guess: Prediction | null;
  onGuess: (g: Prediction) => void;
  onReveal: () => void;
}) {
  const truth = outcomeOf(pending.r);
  const mine = cardById(splitPlay(pending.pId).card);
  const fb = guess ? predictionFeedback(guess, pending.r) : null;
  return (
    <motion.section className="k2-pick k2-predict" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} aria-live="polite">
      <div className="k2-predict-q"><CoachAvatar size={26} /><span>Was passiert jetzt?</span></div>
      <p className="k2-predict-sub">Du spielst <b>{mine?.plain ?? "nichts"}</b>. Seine Karte liegt verdeckt.</p>
      <div className="k2-predict-opts">
        {PREDICTIONS.map((g) => {
          const cls = !guess ? "" : g === truth ? "right" : g === guess ? "wrong" : "dim";
          return (
            <button key={g} type="button" className={`k2-predict-opt ${cls}`} disabled={!!guess} onClick={() => onGuess(g)}>
              <span>{PREDICTION_LABEL[g]}</span>
              {guess && g === truth && <span aria-label="richtig">✓</span>}
              {guess && g === guess && g !== truth && <span aria-label="falsch">✗</span>}
            </button>
          );
        })}
      </div>
      {fb && (
        <motion.p className={`k2-predict-fb ${fb.ok ? "ok" : "no"}`} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          <b>{fb.ok ? "✓ " : "✗ "}{fb.title}</b> {pending.r.why}
        </motion.p>
      )}
      {guess && <button type="button" className="btn primary big k2-go" onClick={onReveal} autoFocus>Aufdecken!</button>}
    </motion.section>
  );
}

/** Mechanik 4: vorbereitete Konter. Deiner mit Karte und Zone, seiner nur als Kartenrücken („Er hat etwas vorbereitet“). */
function KonterStrip({ mine, his, pending, onOpen }: { mine?: Konter2; his?: Konter2; pending: Card2 | null; onOpen: () => void }) {
  if (!mine && !his && !pending) return null;
  const rest = (k: Konter2) => (k.left <= 1 ? "nur noch diese Runde" : `noch ${k.left} Runden`);
  const mc = mine?.card ? cardById(mine.card) : undefined;
  return (
    <div className="k2-konters" role="group" aria-label="Vorbereitete Konter">
      {pending && (
        <button type="button" className="k2-konter-chip p is-pending" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
          <span className="k2-konter-back" aria-hidden><KonterIcon size={11} /></span>
          <span><b>Du legst verdeckt:</b> {pending.plain} · {ZONE_LABEL[pending.zone]}<span className="sr-only">. Tippen für Erklärung.</span></span>
        </button>
      )}
      {mine && mc && (
        <button type="button" className="k2-konter-chip p" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
          <span className="k2-konter-back" aria-hidden><KonterIcon size={11} /></span>
          <span><b>Dein Konter:</b> {mc.plain} · {ZONE_LABEL[mc.zone]} · {rest(mine)}<span className="sr-only">. Liegt verdeckt. Tippen für Erklärung.</span></span>
        </button>
      )}
      {his && (
        <button type="button" className="k2-konter-chip o" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
          <span className="k2-konter-back" aria-hidden>?</span>
          <span><b>Er hat etwas vorbereitet</b> · {rest(his)}<span className="sr-only">. Ein verdeckter Konter – wo würde er rahmen? Tippen für Erklärung.</span></span>
        </button>
      )}
    </div>
  );
}

/** Mechanik 2: liegende Griffe als Marken unter dem Brett – Tippen erklärt „Griff“. */
function GripStrip({ grips, onOpen }: { grips: Grip2[]; onOpen: () => void }) {
  if (!grips.length) return null;
  return (
    <div className="k2-grips" role="group" aria-label="Liegende Griffe">
      {grips.map((g) => (
        <button key={`${g.owner}-${g.id}`} type="button" className={`k2-grip-chip ${g.owner}`} onClick={(e) => { e.stopPropagation(); onOpen(); }}
          aria-label={`${g.owner === "p" ? "Du" : "Er"}: ${g.name} · ${ZONE_LABEL[g.zone]}. ${g.owner === "p" ? "Deine" : "Seine"} Angriffe dort brauchen 1 weniger. Tippen für Erklärung.`}>
          <GripIcon size={12} />
          <span><b>{g.owner === "p" ? "Du" : "Er"}:</b> {g.name} · {ZONE_LABEL[g.zone]}</span>
        </button>
      ))}
    </div>
  );
}

function Pips({ n }: { n: number }) {
  return (
    <span className="k2-pips" role="img" aria-label={`${ATEM_LABEL} ${n} von ${KRAFT_MAX}`} title={ATEM_LABEL}>
      <KraftIcon size={11} />
      {Array.from({ length: KRAFT_MAX }, (_, i) => <i key={i} className={i < n ? "on" : ""} />)}
    </span>
  );
}

function PlayedRow({ label, c }: { label: string; c: Card2 | null }) {
  if (!c) return <p className="k2-played"><b>{label}:</b> passt</p>;
  return (
    <p className={`k2-played kind-${c.kind}`}>
      <b>{label}:</b> {c.plain} <span className="k2-term">{c.term}</span> · {KIND_LABEL[c.kind]} an {ZONE_LABEL[c.zone]}
    </p>
  );
}

// Geometrie muss zu core2.css passen (.k2-board: padding-top + Zeilenhöhe).
const BOARD_HEAD = 16;
const BOARD_ROW = 30;
const rowY = (z: Zone) => BOARD_HEAD + ZONES.indexOf(z) * BOARD_ROW + BOARD_ROW / 2;

/** Beide Karten drehen sich um; gleiche Zone → sie knallen über dieser Leiste zusammen. */
function RevealLayer({ p, o, same, impact, reduced, set = [], trig = [] }: { p: Card2 | null; o: Card2 | null; same: boolean; impact: boolean; reduced: boolean; set?: Side[]; trig?: Side[] }) {
  return (
    <motion.div className="k2-reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.25 } }}>
      {(["p", "o"] as Side[]).map((side) => {
        const c = side === "p" ? p : o;
        const y = c ? rowY(c.zone) : rowY("huefte");
        // Gleiche Zone: Karten fliegen zur Mitte und knallen zusammen. Sonst bleiben sie an ihrer Seite.
        const restX = side === "p" ? "-62%" : "62%";
        const slamX = side === "p" ? "-52%" : "52%";
        return (
          <motion.div key={side} className={`k2-rcard-pos ${side}`} style={{ top: y }}
            initial={{ x: side === "p" ? "-140%" : "140%" }}
            animate={{
              x: same && impact && !reduced ? [restX, slamX, side === "p" ? "-56%" : "56%"] : restX,
              // Nach dem Aufprall verblassen, damit der Puck sichtbar wird.
              opacity: impact ? [1, 1, 0.18] : 1,
              scale: impact && !reduced ? [1, 1, 0.9] : 1,
            }}
            transition={impact
              ? { x: { duration: 0.32, times: [0, 0.45, 1], ease: "easeOut" }, opacity: { duration: 0.9, times: [0, 0.5, 1] }, scale: { duration: 0.9, times: [0, 0.5, 1] } }
              : { type: "spring", stiffness: 320, damping: 28 }}>
            <motion.div className="k2-rcard-flip"
              initial={reduced ? { opacity: 0 } : { rotateY: 180 }}
              animate={reduced ? { opacity: 1 } : { rotateY: 0 }}
              transition={{ duration: 0.45, delay: side === "o" ? 0.18 : 0.05, ease: [0.2, 0.7, 0.2, 1] }}>
              <div className="k2-rcard-back" aria-hidden />
              <div className={`k2-rcard kind-${c?.kind ?? "none"} side-${side}`}>
                {c ? (<>
                  <span className="k2-rcard-kind"><ZoneIcon zone={c.zone} size={11} /> {trig.includes(side) ? "Konter" : KIND_LABEL[c.kind]}</span>
                  <span className="k2-rcard-t">{c.plain}</span>
                </>) : <span className="k2-rcard-t">passt</span>}
                {set.includes(side) && !trig.includes(side) && <span className="k2-rcard-konter"><KonterIcon size={9} /> + verdeckt</span>}
              </div>
            </motion.div>
          </motion.div>
        );
      })}
      {same && impact && p && <motion.span className="k2-clash" style={{ top: rowY(p.zone) }}
        initial={{ scale: 0.2, opacity: 1 }} animate={{ scale: 1.8, opacity: 0 }} transition={{ duration: 0.45, delay: 0.12 }} aria-hidden />}
    </motion.div>
  );
}
