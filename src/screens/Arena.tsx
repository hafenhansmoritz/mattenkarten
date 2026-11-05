import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Archetype, CardDef, CardKind, Hint, MatchState, RevealOutcome, Role, Side, Tag } from "../engine/types";
import { CARD } from "../data/cards";
import { createMatch, playableCards, playTurn, roleOf, chainStep } from "../engine/match";
import { chooseCard } from "../engine/ai";
import { coachHint, recap as makeRecap } from "../engine/learn";
import { mulberry32, hashSeed, type Rng } from "../engine/rng";
import { POSITION_GUIDE, goalLine } from "../data/positions";
import { tutorialFor, type TutorialStep } from "../data/tutorials";
import { Card } from "../components/Card";
import { CardFlip } from "../components/CardFlip";
import { CardArt } from "../components/CardArt";
import { Fighters, contactPoint } from "../components/fighters";
import type { FighterHighlight } from "../components/fighters/Fighters";
import { ImpactBurst, FloatText, Stamp, useHitStop, DealHand, Confetti, Pulse, ChainSweep, CountUp, svgToContainer } from "../components/fx";
import {
  PositionGuideCard, GoalLine, CoachButton, PredictPicker, RevealExplain, RecapView, ResourceBadge, TriangleExplainer, CoachAvatar,
} from "../components/learn";
import { useGame } from "../store";
import { sfx } from "../sound";

const CHAIN = ["Abstand", "Umklammern", "Zu Boden", "Kontrolle", "Aufgabe"];
const INTENT: Record<CardKind, string> = {
  angriff: "Er spannt sich an – gleich greift er an.",
  setup: "Er sucht Griffe und bereitet vor.",
  reaktion: "Er wartet ab und lauert auf deinen Angriff.",
};
const RULE_LABEL: Record<RevealOutcome["rule"], string> = {
  "angriff>setup": "Angreifen schlägt Vorbereiten",
  "setup>reaktion": "Vorbereiten lockt Kontern ins Leere",
  "reaktion>angriff": "Kontern schlägt den passenden Angriff",
  tempo: "Beide greifen an – der Schnellere gewinnt",
  scramble: "Gleich schnell – Gerangel",
  "beide-setup": "Beide bereiten vor",
  patt: "Beide warten ab",
  durch: "Konter passte nicht",
};
const RULE_KIND: Record<RevealOutcome["rule"], CardKind | null> = {
  "angriff>setup": "angriff", "setup>reaktion": "setup", "reaktion>angriff": "reaktion",
  tempo: null, scramble: null, "beide-setup": null, patt: null, durch: "angriff",
};

/** Welches Körperteil ein Angriff anvisiert (für das Highlight). */
function partFor(tags: Tag[] | undefined): FighterHighlight["part"] | null {
  const t = tags?.[0];
  if (!t) return null;
  if (["shot", "single", "legs", "sweep", "pass"].includes(t)) return "legs";
  if (["hip", "bodylock", "bridge", "escape", "reap"].includes(t)) return "hips";
  if (["armlock", "shoulderlock", "drag"].includes(t)) return "arms";
  if (["choke", "trianglechoke", "snap"].includes(t)) return "neck";
  if (t === "strike") return "head";
  return "torso";
}

interface Reveal {
  pCard: string; oCard: string; outcome: RevealOutcome; next: MatchState;
  flipped: boolean; shown: boolean; predicted: CardKind | null;
}
interface Fx { id: number; burst?: { x: number; y: number; color: string }; stamp?: { text: string; tone: "good" | "bad" | "neutral"; sub?: string }; floats: { text: string; color: string; x: number; y: number }[] }

export function Arena({ arch, onExit }: { arch: Archetype; onExit: (won: boolean | null) => void }) {
  const game = useGame();
  const tut = tutorialFor(arch.id);
  const novice = game.beaten.length < 6; // Weiß/Anfang: weniger Karten, mehr Hilfe
  const options = useMemo(() => tut?.options ?? (novice ? { handSize: 4 } : undefined), [tut, novice]);
  const maxTurns = tut?.maxTurns ?? 12;
  const seed = useMemo(() => hashSeed(arch.id, Date.now()), [arch.id]);
  const rngRef = useRef<Rng>(mulberry32(seed));
  const [match, setMatch] = useState<MatchState>(() => createMatch(game.deck, arch.deck, seed, maxTurns, options));
  const [ai, setAi] = useState(() => chooseCard(match, arch, rngRef.current));
  const [sel, setSel] = useState<string | null>(null);
  const [predict, setPredict] = useState<CardKind | null>(null);
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3>(0);
  const [hint, setHint] = useState<Hint | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [scene, setScene] = useState({ pos: match.pos, top: match.top });
  const [shake, setShake] = useState<"x" | "y" | null>(null);
  const [flash, setFlash] = useState<Side | null>(null);
  const [zoom, setZoom] = useState(false);
  const [slowmo, setSlowmo] = useState(false);
  const [windup, setWindup] = useState<Side | null>(null);
  const [highlight, setHighlight] = useState<FighterHighlight | null>(null);
  const [fx, setFx] = useState<Fx | null>(null);
  const [frozen, hitStop] = useHitStop();
  const [end, setEnd] = useState<null | "tap" | "release" | "done">(null);
  const [tapOk, setTapOk] = useState<boolean | null>(null);
  const [guide, setGuide] = useState<{ pos: MatchState["pos"]; role: Role } | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [bubbleDone, setBubbleDone] = useState<string[]>([]);
  const [chainKey, setChainKey] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);

  const pRole = roleOf(match, "p");
  const oRole = roleOf(match, "o");
  const pStep = chainStep(match.pos, pRole);
  const prevStep = useRef(pStep);
  useEffect(() => { if (pStep > prevStep.current) setChainKey((k) => k + 1); prevStep.current = pStep; }, [pStep]);
  const showRes = !match.options?.noResources;

  // Tutorial-Schritte für diesen Moment
  const steps: TutorialStep[] = tut?.steps ?? [];
  const pickStep = steps.find((s) => !bubbleDone.includes(s.id) && (s.when === "start" ? match.turn === 1 : s.when === "beforePick" && s.turn === match.turn));
  const required = steps.find((s) => s.when === "beforePick" && s.turn === match.turn && s.requireCard)?.requireCard;
  const afterStep = reveal ? steps.find((s) => s.when === "afterReveal" && s.turn === match.turn) : undefined;

  // Steckbrief beim ersten Besuch einer Position
  useEffect(() => {
    if (reveal || end) return;
    const key = `${match.pos}|${pRole}`;
    if (!game.seen.includes(key)) setGuide({ pos: match.pos, role: pRole });
  }, [match.pos, pRole, reveal, end]);

  const plays = playableCards(match, "p");
  const usable = plays.filter((p) => p.playable);
  const blocked = plays.filter((p) => !p.playable);

  function askCoach(level: 1 | 2 | 3) {
    const h = coachHint(match, "p", level, ai.intent);
    setHintLevel(level); setHint(h);
    if (h.cardId && level >= 2) setSel(h.cardId);
    sfx.select();
  }

  function doReveal() {
    if (!sel) return;
    const { state: next, outcome } = playTurn(match, sel, ai.card, rngRef.current);
    // Richtig getippt: +1 Puste
    let n = next;
    if (predict && predict === CARD[ai.card].kind) n = { ...n, p: { ...n.p, gas: Math.min(12, n.p.gas + 1) } };
    setReveal({ pCard: sel, oCard: ai.card, outcome, next: n, flipped: false, shown: false, predicted: predict });
    sfx.flip();
  }

  // Reveal-Choreografie: Flip → Ausholen → Kontakt (Hitstop, Burst, Stempel) → Highlight → Punkte → Erklärung
  useEffect(() => {
    if (!reveal || reveal.shown) return;
    if (!reveal.flipped) {
      const t = setTimeout(() => setReveal((r) => r && { ...r, flipped: true }), 320);
      return () => clearTimeout(t);
    }
    const o = reveal.outcome;
    const winner: Side | null = o.winner === "p" || o.winner === "o" ? o.winner : null;
    setWindup(winner);
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => {
      setWindup(null);
      const moved = o.events.find((e) => e.t === "move");
      const wasStanding = match.pos === "dist" || match.pos === "clinch";
      const takedown = !!(moved && moved.t === "move" && wasStanding && moved.pos !== "dist" && moved.pos !== "clinch");
      const sub = o.events.find((e) => e.t === "submission");
      let pos = scene.pos, top = scene.top;
      if (moved && moved.t === "move") { pos = moved.pos; top = moved.top; setScene({ pos, top }); }
      if (takedown) { setSlowmo(true); setZoom(true); }
      setShake(takedown ? "y" : moved || o.rule === "reaktion>angriff" ? "x" : null);
      setFlash(winner === "p" ? "o" : winner === "o" ? "p" : null);
      hitStop(sub ? 160 : 80);
      // Kontaktpunkt in px
      const svg = stageRef.current?.querySelector("svg") ?? null;
      const pt = svgToContainer(svg as SVGSVGElement | null, contactPoint(pos, top), stageRef.current);
      const stampText = sub ? "TAP!" : o.rule === "reaktion>angriff" ? "KONTER!" : takedown ? "ZU BODEN!" : o.rule === "setup>reaktion" ? "LÜCKE!" : o.rule === "tempo" ? "SCHNELLER!" : o.rule === "durch" ? "DURCH!" : moved ? "POSITION!" : null;
      const floats: Fx["floats"] = [];
      for (const e of o.events) {
        if (e.t === "points") floats.push({ text: `+${e.n} Punkte`, color: e.side === "p" ? "var(--gi-p)" : "var(--gi-o)", x: pt.x + (e.side === "p" ? -40 : 40), y: pt.y - 30 });
        if (e.t === "control" && e.delta > 0 && e.side === "p") floats.push({ text: `+${e.delta} Griff`, color: "var(--k-setup)", x: pt.x - 30, y: pt.y - 60 });
      }
      if (predict && reveal.predicted === CARD[reveal.oCard].kind) floats.push({ text: "Gut gelesen! +1 Puste", color: "#59d39a", x: pt.x, y: pt.y - 90 });
      setFx({
        id: Date.now(),
        burst: winner || moved ? { x: pt.x, y: pt.y, color: winner === "o" ? "var(--gi-o)" : winner === "p" ? "var(--gi-p)" : "#fff" } : undefined,
        stamp: stampText ? { text: stampText, tone: winner === "p" ? "good" : winner === "o" ? "bad" : "neutral" } : undefined,
        floats,
      });
      if (winner || moved) sfx.hit(); else sfx.counter();
      if (floats.length) setTimeout(() => sfx.points(), 220);
      // Highlight: Körperteil, auf das der Angriff zielte
      const pc = CARD[reveal.pCard], oc = CARD[reveal.oCard];
      const attack: { c: CardDef; target: Side } | null = pc.kind === "angriff" ? { c: pc, target: "o" } : oc.kind === "angriff" ? { c: oc, target: "p" } : null;
      const part = attack ? partFor(attack.c.tags) : null;
      timers.push(setTimeout(() => setHighlight(part && attack ? { side: attack.target, part } : null), 150));
    }, 260));
    timers.push(setTimeout(() => {
      setShake(null); setFlash(null); setZoom(false); setSlowmo(false);
      setReveal((r) => r && { ...r, shown: true });
    }, 1150));
    return () => timers.forEach(clearTimeout);
  }, [reveal?.flipped, reveal?.shown]);

  function next() {
    if (!reveal) return;
    const n = reveal.next;
    setMatch(n); setScene({ pos: n.pos, top: n.top });
    setReveal(null); setSel(null); setPredict(null); setHint(null); setHintLevel(0); setHighlight(null); setFx(null); setShowMore(false);
    if (afterStep) setBubbleDone((b) => [...b, afterStep.id]);
    if (n.result) {
      if (n.result.type === "submission") { setEnd(n.result.winner === "o" ? "tap" : "release"); return; }
      setEnd("done");
      if (n.result.winner === "p") sfx.win(); else sfx.lose();
      return;
    }
    setAi(chooseCard(n, arch, rngRef.current));
  }

  // Tap-/Loslassen-Moment
  useEffect(() => {
    if (end !== "tap" && end !== "release") return;
    const t = setTimeout(() => { setTapOk(false); setEnd("done"); }, end === "tap" ? 3500 : 3000);
    return () => clearTimeout(t);
  }, [end]);
  function hitTap() {
    sfx.tap(); setTapOk(true);
    if (end === "tap") game.set({ taps: game.taps + 1 }); else game.set({ releases: game.releases + 1 });
    setEnd("done");
  }

  // Rückblick + Fehler-Deck
  const rec = useMemo(() => (end === "done" ? makeRecap(match) : null), [end]);
  useEffect(() => { if (rec && rec.mistakes.length) game.addMistakes(rec.mistakes); }, [rec]);

  const res = match.result;
  const won = res ? res.winner === "p" : null;
  const bubble: TutorialStep | undefined = !reveal ? pickStep : afterStep;

  return (
    <div className="arena arena2">
      <header className="hud">
        <button className="icon-btn" onClick={() => onExit(null)} aria-label="Kampf verlassen">✕</button>
        <FighterHud side="p" name="Du" st={match} showRes={showRes} />
        <div className="clock"><span className="label">Runde</span><span className="num">{Math.min(match.turn, match.maxTurns)}/{match.maxTurns}</span></div>
        <FighterHud side="o" name={arch.name} st={match} showRes={showRes} />
      </header>

      <div className="chain" aria-label={`Kampfkette: du bei ${CHAIN[pStep - 1]}`}>
        <ChainSweep key={chainKey} active={chainKey > 0} />
        {CHAIN.map((name, i) => {
          const n = i + 1;
          return (
            <div key={name} className={`link ${n <= pStep ? "p" : ""} ${n === pStep ? "cur" : ""}`}>
              <span className="label">{n}</span><span className="lname">{name}</span>
              {n === chainStep(match.pos, oRole) && <motion.span layoutId="omark" className="omark" />}
              {n === pStep && <motion.span layoutId="pmark" className="pmark" />}
            </div>
          );
        })}
      </div>

      <div className={`stage ${frozen ? "fx-frozen" : ""}`} ref={stageRef}>
        <Fighters pos={scene.pos} top={scene.top} shake={shake} flash={flash} zoom={zoom} slowmo={slowmo} windup={windup} highlight={highlight} className="stage-fighters" />
        <div className="stage-pos" style={{ opacity: reveal ? 0 : 1 }}>
          <span className="display">{POSITION_GUIDE[scene.pos].plain}</span>
          <span className="label">{POSITION_GUIDE[scene.pos].term}</span>
        </div>
        {fx && (
          <div className="fx-layer" key={fx.id}>
            {fx.burst && <ImpactBurst x={fx.burst.x} y={fx.burst.y} color={fx.burst.color} />}
            {fx.floats.map((f, i) => <FloatText key={i} text={f.text} color={f.color} x={f.x} y={f.y} delay={i * 120} />)}
            {fx.stamp && <Stamp text={fx.stamp.text} tone={fx.stamp.tone} />}
          </div>
        )}

        <AnimatePresence>
          {reveal && (
            <motion.div className={`reveal ${reveal.shown ? "settled" : ""}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="reveal-cards">
                <motion.div layoutId={`card-${reveal.pCard}`} initial={{ y: 160, rotate: -8, scale: .8 }} animate={{ y: 0, rotate: -3, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className={`rc ${reveal.shown ? (reveal.outcome.winner === "p" || reveal.outcome.winner === "both" ? "win" : "lose") : ""}`}>
                  <CardFlip card={CARD[reveal.pCard]} revealed={reveal.flipped} art={<CardArt card={CARD[reveal.pCard]} />} />
                  <span className="label rc-tag">Du</span>
                </motion.div>
                <motion.div className="vs display" initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 14 }}>VS</motion.div>
                <motion.div initial={{ y: -160, rotate: 8, scale: .8 }} animate={{ y: 0, rotate: 3, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20, delay: .05 }}
                  className={`rc ${reveal.shown ? (reveal.outcome.winner === "o" || reveal.outcome.winner === "both" ? "win o" : "lose") : ""}`}>
                  <CardFlip card={CARD[reveal.oCard]} revealed={reveal.flipped} delay={0.06} art={<CardArt card={CARD[reveal.oCard]} />} />
                  <span className="label rc-tag">{arch.name}</span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Erklärung nach dem Aufdecken */}
      <AnimatePresence>
        {reveal?.shown && (
          <motion.section className="explain-zone" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 26 }}>
            <RevealExplain ruleLabel={RULE_LABEL[reveal.outcome.rule]} highlightKind={RULE_KIND[reveal.outcome.rule]}
              headline={reveal.outcome.headline} lesson={reveal.outcome.lesson}
              predicted={reveal.predicted ? { kind: reveal.predicted, correct: reveal.predicted === CARD[reveal.oCard].kind, actual: CARD[reveal.oCard].kind } : undefined} />
            {afterStep && <CoachBubble text={afterStep.text} />}
            <button className="btn primary big" onClick={next} autoFocus>Weiter</button>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Kartenwahl */}
      {!reveal && !end && (
        <section className="handzone">
          <GoalLine text={goalLine(match.pos, pRole)} role={pRole} />
          {bubble && <CoachBubble text={bubble.text} onOk={!bubble.requireCard ? () => setBubbleDone((b) => [...b, bubble.id]) : undefined} />}
          <div className="hand-info">
            <span className="intent">{ai.intent ? <><b className="label">Er</b> {INTENT[ai.intent]}</> : <><b className="label">Er</b> {arch.name} verrät nichts.</>}</span>
            {tut?.n !== 1 && <PredictPicker value={predict} onChange={setPredict} />}
          </div>
          <div className="hand"><DealHand turnKey={match.turn}>
            {usable.map((p, i) => {
              const c = CARD[p.id];
              const lockedByTut = !!required && p.id !== required;
              const recommended = (hint?.cardId === p.id && hintLevel >= 2) || required === p.id;
              return (
                <div key={p.id + i} className={`hand-slot ${p.basic ? "basic" : ""}`}>
                  <Pulse active={recommended}>
                    <Card card={c} size="hand" layoutId={sel === p.id ? `card-${p.id}` : undefined} art={<CardArt card={c} size={96} />} selected={sel === p.id}
                      disabled={lockedByTut} reason={lockedByTut ? "Erst die markierte Karte" : undefined}
                      onClick={() => { if (!lockedByTut) { setSel(sel === p.id ? null : p.id); sfx.select(); } }} />
                  </Pulse>
                </div>
              );
            })}
          </DealHand></div>
          {blocked.length > 0 && (
            <button className="more-btn label" onClick={() => setShowMore(!showMore)}>
              {showMore ? "Ausblenden" : `${blocked.length} Karte${blocked.length > 1 ? "n" : ""} passen hier gerade nicht`}
            </button>
          )}
          <AnimatePresence>
            {showMore && (
              <motion.div className="hand blocked" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                {blocked.map((p, i) => <Card key={p.id + i} card={CARD[p.id]} size="mini" disabled reason={p.reason} />)}
              </motion.div>
            )}
          </AnimatePresence>
          {sel && <SelectedInfo card={CARD[sel]} />}
          <div className="playbar">
            <CoachButton level={hintLevel} onAsk={askCoach} hint={hint} disabled={!!required} />
            <button className="btn primary big" disabled={!sel} onClick={doReveal}>{sel ? "Aufdecken!" : "Wähle eine Karte"}</button>
          </div>
        </section>
      )}

      {/* Steckbrief */}
      <AnimatePresence>
        {guide && !end && !reveal && (
          <motion.div className="sheet-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PositionGuideCard guide={POSITION_GUIDE[guide.pos]} role={guide.role} onClose={() => { game.markSeen(`${guide.pos}|${guide.role}`); setGuide(null); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap / Loslassen */}
      <AnimatePresence>
        {(end === "tap" || end === "release") && res?.type === "submission" && (
          <motion.div className="tap-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <span className="label">{(CARD[res.card].plain ?? CARD[res.card].name)} sitzt</span>
            <h2 className="display">{end === "tap" ? "Klopf ab!" : "Er klopft ab!"}</h2>
            <p>{end === "tap" ? "Früh und deutlich abklopfen. Verlieren gehört dazu – verletzt sein nicht." : "Sofort loslassen. Dein Partner vertraut dir."}</p>
            <motion.button className={`tap-btn ${end}`} onClick={hitTap} autoFocus animate={{ scale: [1, 1.07, 1] }} transition={{ repeat: Infinity, duration: .6 }}>
              {end === "tap" ? "TAP" : "LOSLASSEN"}
            </motion.button>
            <motion.div className="tap-timer" initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: end === "tap" ? 3.5 : 3, ease: "linear" }} />
          </motion.div>
        )}
      </AnimatePresence>

      {end === "done" && res && rec && (
        <motion.div className="endscreen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Confetti run={!!won} />
          <motion.div className={`end-card ${won ? "won" : "lost"}`} initial={{ scale: .85, y: 40 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 240, damping: 20 }}>
            <span className="label">{arch.name} · {arch.title}</span>
            <h2 className="display">{endTitle(match, won, tapOk)}</h2>
            <p>{tut && won ? tut.winText : endText(match, won, tapOk)}</p>
            <RecapView recap={rec} won={!!won} onContinue={() => onExit(won)} />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function CoachBubble({ text, onOk }: { text: string; onOk?: () => void }) {
  return (
    <motion.div className="coach-bubble" initial={{ y: 10, opacity: 0, scale: .96 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 380, damping: 24 }}>
      <CoachAvatar />
      <p>{text}</p>
      {onOk && <button className="btn small" onClick={onOk}>OK</button>}
    </motion.div>
  );
}

function SelectedInfo({ card }: { card: CardDef }) {
  return (
    <motion.div key={card.id} className="sel-info" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <b>{card.plain ?? card.name}</b>{card.plain && <span className="label"> {card.name}</span>}
      {card.plainDo && <p>{card.plainDo}</p>}
    </motion.div>
  );
}

function FighterHud({ side, name, st, showRes }: { side: Side; name: string; st: MatchState; showRes: boolean }) {
  const f = st[side];
  return (
    <div className={`fhud ${side}`}>
      <div className="fhud-top">
        <span className="fname">{name}</span>
        <span className="fpts display num"><CountUp value={f.pts} /></span>
      </div>
      {showRes && (
        <div className="fres">
          <ResourceBadge type="gas" value={f.gas} max={12} mirror={side === "o"} hideWord={side === "o"} />
          <ResourceBadge type="control" value={f.control} max={5} mirror={side === "o"} hideWord={side === "o"} />
          {f.opening && side === "p" && <ResourceBadge type="opening" value={1} max={1} />}
        </div>
      )}
    </div>
  );
}

function endTitle(match: MatchState, won: boolean | null, tapOk: boolean | null): string {
  const r = match.result!;
  if (r.type === "submission") return won ? "Sieg durch Aufgabe" : "Abgeklopft";
  if (won) return `Gewonnen ${match.p.pts}:${match.o.pts}`;
  if (won === false) return `Verloren ${match.p.pts}:${match.o.pts}`;
  return `Unentschieden ${match.p.pts}:${match.o.pts}`;
}
function endText(match: MatchState, won: boolean | null, tapOk: boolean | null): string {
  const r = match.result!;
  if (r.type === "submission") {
    if (won) return tapOk ? "Er klopft ab – und du hast sofort losgelassen. Genau so." : "Gewonnen, aber zu spät losgelassen. Auf der Matte heißt das: Verletzungsgefahr.";
    return tapOk ? "Rechtzeitig abgeklopft. Du lernst daraus – unverletzt." : "Zu spät abgeklopft. Im echten Training: früh und deutlich klopfen.";
  }
  if (won) return "Mehr Kontrolle, mehr Punkte. Als Nächstes: aus der Kontrolle beenden.";
  if (won === false) return "Er hatte die besseren Positionen. Schau unten, was dir gefehlt hat.";
  return "Gleichstand. Ein Angriff mehr hätte gereicht.";
}

export { TriangleExplainer };
