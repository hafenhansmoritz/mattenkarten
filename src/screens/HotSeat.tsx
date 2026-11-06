// Duell zu zweit (Pass-and-Play): zwei Menschen, ein Gerät, geheime Kartenwahl, gemeinsames Aufdecken.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { CardDef, CardKind, MatchState, RevealOutcome, Side, Tag } from "../engine/types";
import { CARD } from "../data/cards";
import { createMatch, playableCards, playTurn, roleOf, chainStep } from "../engine/match";
import { mulberry32, hashSeed, type Rng } from "../engine/rng";
import { ARCHETYPES, BELTS, STARTER_DECK } from "../data/campaign";
import { POSITION_GUIDE, goalLine } from "../data/positions";
import { Card } from "../components/Card";
import { CardFlip } from "../components/CardFlip";
import { CardArt } from "../components/CardArt";
import { Fighters, contactPoint } from "../components/fighters";
import type { FighterHighlight } from "../components/fighters/Fighters";
import { ImpactBurst, FloatText, Stamp, useHitStop, DealHand, Confetti, ChainSweep, CountUp, svgToContainer } from "../components/fx";
import { GoalLine, PredictPicker, RevealExplain, ResourceBadge, KIND_VERB } from "../components/learn";
import { sfx } from "../sound";
import "../styles/hotseat.css";

// ------------------------------------------------------------
// Konfiguration
// ------------------------------------------------------------
const ROUNDS = 12;
const SIDES: Side[] = ["p", "o"];
const other = (s: Side): Side => (s === "p" ? "o" : "p");

interface DeckOption { id: string; title: string; sub: string; blurb: string; deck: string[]; group: string }

const DECKS: DeckOption[] = [
  { id: "starter", title: "Starterdeck", sub: "Alles ein bisschen", blurb: "Deckt die ganze Kette ab: Abstand, zu Boden, Kontrolle, Aufgabe.", deck: STARTER_DECK, group: "Grundlage" },
  ...ARCHETYPES.map((a) => ({
    id: a.id,
    title: a.title,
    sub: a.name,
    blurb: a.blurb,
    deck: a.deck,
    group: BELTS.find((b) => b.id === a.belt)?.name ?? a.belt,
  })),
];
const DECK_BY_ID: Record<string, DeckOption> = Object.fromEntries(DECKS.map((d) => [d.id, d]));
const DECK_GROUPS = Array.from(new Set(DECKS.map((d) => d.group)));

interface Config { names: Record<Side, string>; decks: Record<Side, string> }

const CHAIN = ["Abstand", "Umklammern", "Zu Boden", "Kontrolle", "Aufgabe"];
const RULE_LABEL: Record<RevealOutcome["rule"], string> = {
  "angriff>setup": "Angreifen schlägt Aufbauen",
  "setup>reaktion": "Aufbauen lockt den Rahmen ins Leere",
  "reaktion>angriff": "Rahmen stoppt den passenden Angriff",
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
const ROLE_WORD = { neutral: "Ihr steht euch gegenüber", top: "Du bist oben", bottom: "Du bist unten" } as const;

const plain = (c: CardDef) => c.plain ?? c.name;

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

/** Engine-Headlines sind aus Sicht von "p" (Du/Er). Für das Duell: neutral, mit Namen. */
function neutralHeadline(o: RevealOutcome, names: Record<Side, string>): string {
  const sub = o.events.find((e) => e.t === "submission");
  if (sub && sub.t === "submission") return `${names[other(sub.side)]} klopft ab – ${plain(CARD[sub.card])} sitzt!`;
  const def = o.events.find((e) => e.t === "submissionDefended");
  if (def && def.t === "submissionDefended") return `${names[def.side]} wehrt den Aufgabegriff ab!`;
  if (o.winner === "p" || o.winner === "o") {
    const W = names[o.winner], L = names[other(o.winner)];
    switch (o.rule) {
      case "angriff>setup": return `${W} greift an – ${L} hat nur aufgebaut!`;
      case "setup>reaktion": return `${L} kontert zu früh – Lücke für ${W}!`;
      case "reaktion>angriff": return `${W} stoppt den Angriff von ${L}!`;
      case "durch": return `Konter von ${L} passte nicht – ${W} kommt durch!`;
      case "tempo": return `${W} war schneller!`;
      default: return o.headline;
    }
  }
  return o.headline; // Patt, Gerangel, beide bereiten vor: schon neutral
}

// ------------------------------------------------------------
// Einstieg
// ------------------------------------------------------------
export function HotSeat({ onBack }: { onBack: () => void }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [draft, setDraft] = useState<Config>({ names: { p: "Blau", o: "Rot" }, decks: { p: "starter", o: "starter" } });
  const [round, setRound] = useState(0);

  if (!config) {
    return <Setup value={draft} onChange={setDraft} onBack={onBack}
      onStart={(c) => { setConfig(c); setDraft(c); setRound((r) => r + 1); sfx.select(); }} />;
  }
  return <Duel key={round} config={config} onBack={onBack}
    onRematch={() => setRound((r) => r + 1)} onSetup={() => setConfig(null)} />;
}

// ------------------------------------------------------------
// Setup
// ------------------------------------------------------------
function Setup({ value, onChange, onStart, onBack }: {
  value: Config; onChange: (c: Config) => void; onStart: (c: Config) => void; onBack: () => void;
}) {
  const id = useId();
  function start() {
    const nm = (s: Side) => value.names[s].trim().slice(0, 14) || (s === "p" ? "Blau" : "Rot");
    let names = { p: nm("p"), o: nm("o") };
    if (names.p.toLowerCase() === names.o.toLowerCase()) names = { p: `${names.p} 1`, o: `${names.o} 2` };
    onStart({ ...value, names });
  }
  return (
    <div className="hs-setup">
      <header className="hs-setup-head">
        <button className="icon-btn" onClick={onBack} aria-label="Zurück">✕</button>
        <div>
          <span className="label">Ein Gerät · zwei Kämpfer</span>
          <h1 className="display">Duell zu zweit</h1>
        </div>
      </header>
      <p className="hs-setup-intro">
        Ihr wählt abwechselnd geheim eine Karte, dann deckt ihr gleichzeitig auf. Wer dran ist, hält das Handy –
        der andere schaut weg. <b>{ROUNDS} Runden</b>, mehr Punkte gewinnt – oder einer klopft vorher ab.
      </p>
      <div className="hs-setup-grid">
        {SIDES.map((s) => {
          const d = DECK_BY_ID[value.decks[s]];
          return (
            <section key={s} className={`hs-player-card ${s}`} aria-labelledby={`${id}-${s}-h`}>
              <h2 id={`${id}-${s}-h`} className="label">{s === "p" ? "Kämpfer Blau" : "Kämpfer Rot"}</h2>
              <label className="hs-field">
                <span className="label">Name</span>
                <input type="text" value={value.names[s]} maxLength={14} autoComplete="off" enterKeyHint="done"
                  onChange={(e) => onChange({ ...value, names: { ...value.names, [s]: e.target.value } })} />
              </label>
              <label className="hs-field">
                <span className="label">Deck</span>
                <select value={value.decks[s]} onChange={(e) => onChange({ ...value, decks: { ...value.decks, [s]: e.target.value } })}>
                  {DECK_GROUPS.map((g) => (
                    <optgroup key={g} label={g}>
                      {DECKS.filter((x) => x.group === g).map((x) => (
                        <option key={x.id} value={x.id}>{x.id === "starter" ? x.title : `${x.title} (${x.sub})`}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <p className="hs-deck-blurb">{d.blurb}</p>
            </section>
          );
        })}
      </div>
      <button className="btn primary big hs-start" onClick={start}>Duell starten</button>
    </div>
  );
}

// ------------------------------------------------------------
// Duell
// ------------------------------------------------------------
type Phase =
  | { k: "pass"; who: Side; next: "pick" | "tap" | "release" }
  | { k: "pick"; who: Side }
  | { k: "ready" }
  | { k: "reveal" }
  | { k: "tap"; who: Side }
  | { k: "release"; who: Side }
  | { k: "end" };

interface Reveal {
  pCard: string; oCard: string; outcome: RevealOutcome; next: MatchState;
  flipped: boolean; shown: boolean; read: Record<Side, boolean | null>;
}
interface Fx { id: number; burst?: { x: number; y: number; color: string }; stamp?: { text: string; sub?: string }; floats: { text: string; color: string; x: number; y: number }[] }

function Duel({ config, onBack, onRematch, onSetup }: {
  config: Config; onBack: () => void; onRematch: () => void; onSetup: () => void;
}) {
  const names = config.names;
  const seed = useMemo(() => hashSeed("hotseat", config.decks.p, config.decks.o, Date.now()), []); // eslint-disable-line react-hooks/exhaustive-deps
  const rngRef = useRef<Rng>(mulberry32(seed));
  const [match, setMatch] = useState<MatchState>(() => createMatch(DECK_BY_ID[config.decks.p].deck, DECK_BY_ID[config.decks.o].deck, seed, ROUNDS));
  const [phase, setPhase] = useState<Phase>({ k: "pass", who: "p", next: "pick" });
  const [picks, setPicks] = useState<Record<Side, string | null>>({ p: null, o: null });
  const [preds, setPreds] = useState<Record<Side, CardKind | null>>({ p: null, o: null });
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
  const [safety, setSafety] = useState<{ tap: boolean | null; release: boolean | null }>({ tap: null, release: null });
  const [confirmExit, setConfirmExit] = useState(false);
  const [chainKey, setChainKey] = useState<Record<Side, number>>({ p: 0, o: 0 });
  const stageRef = useRef<HTMLDivElement>(null);

  const steps: Record<Side, number> = {
    p: chainStep(match.pos, roleOf(match, "p")),
    o: chainStep(match.pos, roleOf(match, "o")),
  };
  const prevSteps = useRef(steps);
  useEffect(() => {
    const up = SIDES.filter((s) => steps[s] > prevSteps.current[s]);
    if (up.length) setChainKey((k) => ({ p: k.p + (up.includes("p") ? 1 : 0), o: k.o + (up.includes("o") ? 1 : 0) }));
    prevSteps.current = steps;
  }, [steps.p, steps.o]); // eslint-disable-line react-hooks/exhaustive-deps

  function confirmPick(who: Side, card: string, pred: CardKind | null) {
    setPicks((p) => ({ ...p, [who]: card }));
    setPreds((p) => ({ ...p, [who]: pred }));
    sfx.select();
    setPhase(who === "p" ? { k: "pass", who: "o", next: "pick" } : { k: "ready" });
  }

  function doReveal() {
    const pCard = picks.p!, oCard = picks.o!;
    const { state, outcome } = playTurn(match, pCard, oCard, rngRef.current);
    let n = state;
    const read: Record<Side, boolean | null> = { p: null, o: null };
    for (const s of SIDES) {
      const guess = preds[s];
      if (!guess) continue;
      const actual = CARD[s === "p" ? oCard : pCard].kind;
      read[s] = guess === actual;
      if (read[s] && !n.result) n = { ...n, [s]: { ...n[s], gas: Math.min(12, n[s].gas + 1) } };
    }
    setReveal({ pCard, oCard, outcome, next: n, flipped: false, shown: false, read });
    setPhase({ k: "reveal" });
    sfx.flip();
  }

  // Reveal-Choreografie wie in der Arena: Flip → Ausholen → Kontakt → Highlight → Erklärung
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
      setFlash(winner ? other(winner) : null);
      hitStop(sub ? 160 : 80);
      const svg = stageRef.current?.querySelector("svg") ?? null;
      const pt = svgToContainer(svg as SVGSVGElement | null, contactPoint(pos, top), stageRef.current);
      const stampText = sub ? "TAP!" : o.rule === "reaktion>angriff" ? "KONTER!" : takedown ? "ZU BODEN!" : o.rule === "setup>reaktion" ? "LÜCKE!" : o.rule === "tempo" ? "SCHNELLER!" : o.rule === "durch" ? "DURCH!" : moved ? "POSITION!" : null;
      const floats: Fx["floats"] = [];
      const col = (s: Side) => (s === "p" ? "var(--gi-p)" : "var(--gi-o)");
      for (const e of o.events) {
        if (e.t === "points") floats.push({ text: `+${e.n} ${names[e.side]}`, color: col(e.side), x: pt.x + (e.side === "p" ? -46 : 46), y: pt.y - 30 });
        if (e.t === "control" && e.delta > 0) floats.push({ text: `+${e.delta} Griff`, color: "var(--k-setup)", x: pt.x + (e.side === "p" ? -36 : 36), y: pt.y - 60 });
      }
      for (const s of SIDES) if (reveal.read[s]) floats.push({ text: `${names[s]}: gut gelesen!`, color: "#59d39a", x: pt.x + (s === "p" ? -30 : 30), y: pt.y - 90 });
      setFx({
        id: Date.now(),
        burst: winner || moved ? { x: pt.x, y: pt.y, color: winner ? col(winner) : "#fff" } : undefined,
        stamp: stampText ? { text: stampText, sub: winner ? names[winner] : undefined } : undefined,
        floats,
      });
      if (winner || moved) sfx.hit(); else sfx.counter();
      if (floats.length) setTimeout(() => sfx.points(), 220);
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
  }, [reveal?.flipped, reveal?.shown]); // eslint-disable-line react-hooks/exhaustive-deps

  function nextRound() {
    if (!reveal) return;
    const n = reveal.next;
    setMatch(n); setScene({ pos: n.pos, top: n.top });
    setReveal(null); setPicks({ p: null, o: null }); setPreds({ p: null, o: null }); setHighlight(null); setFx(null);
    if (n.result) {
      if (n.result.type === "submission") { setPhase({ k: "pass", who: other(n.result.winner), next: "tap" }); return; }
      setPhase({ k: "end" });
      if (n.result.winner) sfx.win(); else sfx.lose();
      return;
    }
    setPhase({ k: "pass", who: "p", next: "pick" });
  }

  function safetyDone(kind: "tap" | "release", ok: boolean) {
    if (ok) sfx.tap();
    setSafety((s) => ({ ...s, [kind]: ok }));
    const res = match.result;
    if (kind === "tap" && res?.type === "submission") setPhase({ k: "pass", who: res.winner, next: "release" });
    else { setPhase({ k: "end" }); sfx.win(); }
  }

  const res = match.result;
  const shownTurn = Math.min(match.turn, match.maxTurns);
  const scoreLine = `${names.p} ${match.p.pts} : ${match.o.pts} ${names.o}`;

  return (
    <div className="arena arena2 hotseat">
      <header className="hud">
        <button className="icon-btn" onClick={() => setConfirmExit(true)} aria-label="Duell verlassen">✕</button>
        <FighterHud side="p" name={names.p} st={match} />
        <div className="clock"><span className="label">Runde</span><span className="num">{shownTurn}/{match.maxTurns}</span></div>
        <FighterHud side="o" name={names.o} st={match} />
      </header>

      <ChainBars names={names} steps={steps} chainKey={chainKey} />

      <div className={`stage ${frozen ? "fx-frozen" : ""}`} ref={stageRef}>
        <Fighters pos={scene.pos} top={scene.top} shake={shake} flash={flash} zoom={zoom} slowmo={slowmo} windup={windup} highlight={highlight} className="stage-fighters" />
        <div className="stage-pos" style={{ opacity: reveal ? 0 : 1 }}>
          <span className="display">{POSITION_GUIDE[scene.pos].plain}</span>
          <span className="label">{POSITION_GUIDE[scene.pos].term}{scene.top ? ` · ${names[scene.top]} oben` : ""}</span>
        </div>
        {fx && (
          <div className="fx-layer" key={fx.id}>
            {fx.burst && <ImpactBurst x={fx.burst.x} y={fx.burst.y} color={fx.burst.color} />}
            {fx.floats.map((f, i) => <FloatText key={i} text={f.text} color={f.color} x={f.x} y={f.y} delay={i * 120} />)}
            {fx.stamp && <Stamp text={fx.stamp.text} tone="neutral" sub={fx.stamp.sub} />}
          </div>
        )}
        <AnimatePresence>
          {reveal && (
            <motion.div className={`reveal ${reveal.shown ? "settled" : ""}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="reveal-cards">
                <motion.div initial={{ y: 160, rotate: -8, scale: .8 }} animate={{ y: 0, rotate: -3, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className={`rc ${reveal.shown ? (reveal.outcome.winner === "p" || reveal.outcome.winner === "both" ? "win" : "lose") : ""}`}>
                  <CardFlip card={CARD[reveal.pCard]} revealed={reveal.flipped} art={<CardArt card={CARD[reveal.pCard]} />} />
                  <span className="label rc-tag hs-tag-p">{names.p}</span>
                </motion.div>
                <motion.div className="vs display" initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 14 }}>VS</motion.div>
                <motion.div initial={{ y: -160, rotate: 8, scale: .8 }} animate={{ y: 0, rotate: 3, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20, delay: .05 }}
                  className={`rc ${reveal.shown ? (reveal.outcome.winner === "o" || reveal.outcome.winner === "both" ? "win o" : "lose") : ""}`}>
                  <CardFlip card={CARD[reveal.oCard]} revealed={reveal.flipped} delay={0.06} art={<CardArt card={CARD[reveal.oCard]} />} />
                  <span className="label rc-tag hs-tag-o">{names.o}</span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Erklärung */}
      <AnimatePresence>
        {reveal?.shown && (
          <motion.section className="explain-zone" aria-live="polite" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 26 }}>
            <div className="hs-played">
              {SIDES.map((s) => {
                const c = CARD[s === "p" ? reveal.pCard : reveal.oCard];
                return (
                  <span key={s} className={`hs-played-item ${s}`}>
                    <b>{names[s]}</b> {plain(c)} <span className="label">{KIND_VERB[c.kind]}</span>
                  </span>
                );
              })}
            </div>
            <RevealExplain ruleLabel={RULE_LABEL[reveal.outcome.rule]} highlightKind={RULE_KIND[reveal.outcome.rule]}
              headline={neutralHeadline(reveal.outcome, names)} lesson={reveal.outcome.lesson} />
            {SIDES.some((s) => reveal.read[s] !== null) && (
              <ul className="hs-reads">
                {SIDES.filter((s) => reveal.read[s] !== null).map((s) => (
                  <li key={s} className={reveal.read[s] ? "ok" : "miss"}>
                    <b>{names[s]}</b> {reveal.read[s] ? "hat richtig getippt: +1 Atem." : `lag daneben – ${names[other(s)]} spielte ${KIND_VERB[CARD[s === "p" ? reveal.oCard : reveal.pCard].kind]}.`}
                  </li>
                ))}
              </ul>
            )}
            <button className="btn primary big" onClick={nextRound} autoFocus>
              {reveal.next.result ? (reveal.next.result.type === "submission" ? "Weiter zum Abklopfen" : "Zum Ergebnis") : "Nächste Runde"}
            </button>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Geheime Kartenwahl */}
      {phase.k === "pick" && (
        <PickZone key={`${match.turn}-${phase.who}`} state={match} who={phase.who} names={names}
          onConfirm={(card, pred) => confirmPick(phase.who, card, pred)} />
      )}

      {/* Sichtschutz / Übergabe */}
      <AnimatePresence>
        {phase.k === "pass" && (
          <Handoff key={`pass-${phase.who}-${phase.next}-${match.turn}`} who={phase.who} names={names}
            kicker={phase.next === "pick" ? `Runde ${shownTurn} von ${match.maxTurns} · ${scoreLine}` : "Aufgabegriff!"}
            title={phase.next === "pick" ? `${names[phase.who]} ist dran` : phase.next === "tap" ? `${names[phase.who]}, du steckst im Griff` : `${names[phase.who]}, dein Griff sitzt`}
            sub={phase.next === "pick" ? `${names[other(phase.who)]} schaut weg` : "Nimm das Handy – gleich musst du schnell sein."}
            onGo={() => setPhase(phase.next === "pick" ? { k: "pick", who: phase.who } : { k: phase.next, who: phase.who } as Phase)} />
        )}
        {phase.k === "ready" && (
          <Handoff key={`ready-${match.turn}`} who={null} names={names}
            kicker={`Runde ${shownTurn} von ${match.maxTurns}`} title="Beide haben gewählt"
            sub="Legt das Handy zwischen euch. Jetzt wird gleichzeitig aufgedeckt."
            button="Aufdecken!" onGo={doReveal} />
        )}
      </AnimatePresence>

      {/* Tap / Loslassen – jeder auf seinem eigenen Bildschirm */}
      <AnimatePresence>
        {(phase.k === "tap" || phase.k === "release") && res?.type === "submission" && (
          <SafetyMoment key={phase.k} kind={phase.k} name={names[phase.who]} partner={names[other(phase.who)]} card={CARD[res.card]}
            onDone={(ok) => safetyDone(phase.k as "tap" | "release", ok)} />
        )}
      </AnimatePresence>

      {phase.k === "end" && res && (
        <EndScreen match={match} names={names} safety={safety} onRematch={onRematch} onSetup={onSetup} onBack={onBack} />
      )}

      {/* Verlassen bestätigen */}
      <AnimatePresence>
        {confirmExit && (
          <motion.div className="sheet-bg hs-confirm-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="hs-confirm" role="alertdialog" aria-modal="true" aria-labelledby="hs-confirm-t">
              <h2 id="hs-confirm-t" className="display">Duell abbrechen?</h2>
              <p>Der Spielstand geht verloren.</p>
              <div className="hs-row">
                <button className="btn big" onClick={() => setConfirmExit(false)} autoFocus>Weiterkämpfen</button>
                <button className="btn primary big" onClick={onBack}>Abbrechen</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ------------------------------------------------------------
// Teile
// ------------------------------------------------------------
function FighterHud({ side, name, st }: { side: Side; name: string; st: MatchState }) {
  const f = st[side];
  return (
    <div className={`fhud ${side}`}>
      <div className="fhud-top">
        <span className="fname">{name}</span>
        <span className="fpts display num" aria-label={`${name}: ${f.pts} Punkte`}><CountUp value={f.pts} /></span>
      </div>
      <div className="fres">
        <ResourceBadge type="gas" value={f.gas} max={12} mirror={side === "o"} hideWord />
        <ResourceBadge type="control" value={f.control} max={5} mirror={side === "o"} hideWord />
      </div>
    </div>
  );
}

function ChainBars({ names, steps, chainKey }: { names: Record<Side, string>; steps: Record<Side, number>; chainKey: Record<Side, number> }) {
  return (
    <div className="hs-chain" role="group" aria-label="Kampfkette">
      {SIDES.map((s) => (
        <div key={s} className={`hs-chain-row ${s}`} aria-label={`${names[s]} bei ${CHAIN[steps[s] - 1]}`}>
          <ChainSweep key={chainKey[s]} active={chainKey[s] > 0} color={s === "p" ? "var(--gi-p)" : "var(--gi-o)"} />
          <span className="hs-chain-name">{names[s]}</span>
          <div className="hs-chain-links">
            {CHAIN.map((label, i) => {
              const n = i + 1;
              return (
                <span key={label} className={`hs-link ${n <= steps[s] ? "on" : ""} ${n === steps[s] ? "cur" : ""}`}>
                  <span className="hs-link-n num">{n}</span><span className="hs-link-l">{label}</span>
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Handoff({ who, names, kicker, title, sub, button, onGo }: {
  who: Side | null; names: Record<Side, string>; kicker: string; title: string; sub: string; button?: string; onGo: () => void;
}) {
  const id = useId();
  return (
    <motion.div className={`hs-handoff ${who ?? "both"}`} role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} aria-describedby={`${id}-d`}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .18 }}>
      <motion.div className="hs-handoff-inner" initial={{ y: 24, scale: .96 }} animate={{ y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 320, damping: 24 }}>
        <span className="label hs-handoff-kicker">{kicker}</span>
        <div className="hs-handoff-icon" aria-hidden>{who ? <span className={`hs-dot ${who}`} /> : <><span className="hs-dot p" /><span className="hs-dot o" /></>}</div>
        <h2 id={`${id}-t`} className="display">{title}</h2>
        <p id={`${id}-d`}>{who ? <><b>{sub}</b></> : sub}</p>
        <button className={`btn big hs-handoff-btn ${who ?? "both"}`} onClick={() => { sfx.select(); onGo(); }} autoFocus>
          {button ?? (who ? `Ich bin ${names[who]}` : "Los")}
        </button>
      </motion.div>
    </motion.div>
  );
}

function PickZone({ state, who, names, onConfirm }: {
  state: MatchState; who: Side; names: Record<Side, string>; onConfirm: (card: string, pred: CardKind | null) => void;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const [pred, setPred] = useState<CardKind | null>(null);
  const [showMore, setShowMore] = useState(false);
  const role = roleOf(state, who);
  const plays = playableCards(state, who);
  const usable = plays.filter((p) => p.playable);
  const blocked = plays.filter((p) => !p.playable);
  return (
    <section className={`handzone hs-pick ${who}`} aria-label={`Kartenwahl ${names[who]}`}>
      <div className="hs-pick-head">
        <span className={`hs-whose ${who}`}><span className={`hs-dot ${who}`} aria-hidden />{names[who]} wählt geheim</span>
        <span className="label">{ROLE_WORD[role]}</span>
      </div>
      <GoalLine text={goalLine(state.pos, role)} role={role} />
      <div className="hand-info">
        <PredictPicker value={pred} onChange={setPred} />
      </div>
      <div className="hand"><DealHand turnKey={`${state.turn}-${who}`}>
        {usable.map((p, i) => {
          const c = CARD[p.id];
          return (
            <div key={p.id + i} className={`hand-slot ${p.basic ? "basic" : ""}`}>
              <Card card={c} size="hand" art={<CardArt card={c} size={96} />} selected={sel === p.id}
                onClick={() => { setSel(sel === p.id ? null : p.id); sfx.select(); }} />
            </div>
          );
        })}
      </DealHand></div>
      {blocked.length > 0 && (
        <button className="more-btn label" onClick={() => setShowMore(!showMore)} aria-expanded={showMore}>
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
      {sel && (
        <motion.div key={sel} className="sel-info" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <b>{plain(CARD[sel])}</b>{CARD[sel].plain && <span className="label"> {CARD[sel].name}</span>}
          {CARD[sel].plainDo && <p>{CARD[sel].plainDo}</p>}
        </motion.div>
      )}
      <div className="playbar">
        <button className={`btn primary big hs-confirm-btn ${who}`} disabled={!sel} onClick={() => sel && onConfirm(sel, pred)}>
          {sel ? (who === "p" ? `Festlegen – weiter an ${names.o}` : "Festlegen") : "Wähle eine Karte"}
        </button>
      </div>
    </section>
  );
}

function SafetyMoment({ kind, name, partner, card, onDone }: {
  kind: "tap" | "release"; name: string; partner: string; card: CardDef; onDone: (ok: boolean) => void;
}) {
  const reduced = !!useReducedMotion();
  const dur = kind === "tap" ? 3500 : 3000;
  const done = useRef(false);
  const finish = (ok: boolean) => { if (done.current) return; done.current = true; onDone(ok); };
  useEffect(() => {
    const t = setTimeout(() => finish(false), dur);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <motion.div className={`tap-overlay hs-safety ${kind}`} role="alertdialog" aria-modal="true" aria-labelledby="hs-safety-t"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <span className="label">{plain(card)} sitzt · {name}</span>
      <h2 id="hs-safety-t" className="display">{kind === "tap" ? "Klopf ab!" : `${partner} klopft ab!`}</h2>
      <p>{kind === "tap" ? "Früh und deutlich abklopfen. Verlieren gehört dazu – verletzt sein nicht." : "Sofort loslassen. Dein Partner vertraut dir."}</p>
      <motion.button className={`tap-btn ${kind}`} onClick={() => finish(true)} autoFocus
        animate={reduced ? undefined : { scale: [1, 1.07, 1] }} transition={reduced ? undefined : { repeat: Infinity, duration: .6 }}>
        {kind === "tap" ? "TAP" : "LOSLASSEN"}
      </motion.button>
      <motion.div className="tap-timer" initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: dur / 1000, ease: "linear" }} aria-hidden />
    </motion.div>
  );
}

function EndScreen({ match, names, safety, onRematch, onSetup, onBack }: {
  match: MatchState; names: Record<Side, string>; safety: { tap: boolean | null; release: boolean | null };
  onRematch: () => void; onSetup: () => void; onBack: () => void;
}) {
  const r = match.result!;
  const w = r.winner;
  const roundsWon: Record<Side, number> = { p: 0, o: 0 };
  for (const h of match.history ?? []) if (h.winner === "p" || h.winner === "o") roundsWon[h.winner]++;
  const title = w ? `${names[w]} gewinnt!` : "Unentschieden!";
  const how = r.type === "submission"
    ? `Sieg durch Aufgabe: ${plain(CARD[r.card])}.`
    : w ? `Sieg nach Punkten ${match[w].pts}:${match[other(w)].pts}.` : `Gleichstand ${match.p.pts}:${match.o.pts}.`;
  return (
    <motion.div className="endscreen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Confetti run={!!w} colors={w ? [w === "p" ? "#3e8bff" : "#e5484d", "#ffd166", "#ffffff"] : undefined} />
      <motion.div className={`end-card hs-end ${w ?? "draw"}`} initial={{ scale: .85, y: 40 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 240, damping: 20 }}>
        <span className="label">Duell zu zweit</span>
        <h2 className="display">{title}</h2>
        <p>{how}</p>
        <div className="hs-score" aria-label={`${names.p} ${match.p.pts} Punkte, ${names.o} ${match.o.pts} Punkte`}>
          {SIDES.map((s) => (
            <div key={s} className={`hs-score-col ${s} ${w === s ? "win" : ""}`}>
              <span className="hs-score-name">{names[s]}</span>
              <span className="display num hs-score-pts">{match[s].pts}</span>
              <span className="label">{roundsWon[s]} Runden gewonnen</span>
            </div>
          ))}
        </div>
        {r.type === "submission" && (
          <ul className="hs-safety-res">
            <li className={safety.tap ? "ok" : "miss"}><b>{names[other(r.winner)]}</b> {safety.tap ? "hat rechtzeitig abgeklopft." : "hat zu spät abgeklopft – im Training: früh und deutlich."}</li>
            <li className={safety.release ? "ok" : "miss"}><b>{names[r.winner]}</b> {safety.release ? "hat sofort losgelassen." : "hat zu spät losgelassen – Verletzungsgefahr!"}</li>
          </ul>
        )}
        <div className="hs-end-actions">
          <button className="btn primary big" onClick={onRematch} autoFocus>Revanche</button>
          <button className="btn big" onClick={onSetup}>Andere Decks</button>
          <button className="btn ghost" onClick={onBack}>Zurück</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
