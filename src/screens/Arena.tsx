import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Archetype, CardKind, MatchState, RevealOutcome, Side } from "../engine/types";
import { CARD } from "../data/cards";
import { createMatch, playableCards, playTurn, roleOf, chainStep } from "../engine/match";
import { chooseCard } from "../engine/ai";
import { mulberry32, hashSeed, type Rng } from "../engine/rng";
import { Card } from "../components/Card";
import { CardFlip } from "../components/CardFlip";
import { CardArt } from "../components/CardArt";
import { Fighters } from "../components/fighters";
import { POS_LABEL, ROLE_LABEL } from "../components/cardText";
import { useGame } from "../store";
import { sfx } from "../sound";

const CHAIN = ["Distanz", "Clinch", "Takedown", "Kontrolle", "Submission"];
const INTENT: Record<CardKind, string> = {
  angriff: "Er lädt nach – ein Angriff kommt.",
  setup: "Er sucht Griffe und baut auf.",
  reaktion: "Er lauert auf deinen Angriff.",
};
const TUTORIAL: Record<number, { title: string; points: string[] }> = {
  1: { title: "Das Dreieck", points: [
    "Beide wählen verdeckt eine Karte, dann wird gleichzeitig aufgedeckt.",
    "Angriff schlägt Setup. Setup schlägt Reaktion. Reaktion schlägt den passenden Angriff.",
    "Tim baut fast nur Griffe auf (Setup). Bring ihn mit einem Angriff zu Boden!",
  ]},
  2: { title: "Reaktionen lesen", points: [
    "Reaktionen kontern nur ihre Familie: Sprawl stoppt Beinangriffe, aber keine Würfe.",
    "Rico schießt ständig. Lies ihn – und konter mit der passenden Karte.",
    "Ein Sprawl bringt dich oben in den Front Headlock: von dort geht es zum Rücken.",
  ]},
  3: { title: "Position vor Submission", points: [
    "Submissions brauchen Kontrolle. Baue sie mit Setups auf, bevor du abschließt.",
    "Scheitert eine Submission, verlierst du die Kontrolle – oft auch die Position.",
    "Danaher: Greif in Paaren an. Wird der eine Angriff gekontert, öffnet sich der andere.",
  ]},
};

interface Reveal { pCard: string; oCard: string; outcome: RevealOutcome; next: MatchState; flipped: boolean; shown: boolean }

export function Arena({ arch, onExit }: { arch: Archetype; onExit: (won: boolean | null) => void }) {
  const game = useGame();
  const seed = useMemo(() => hashSeed(arch.id, Date.now()), [arch.id]);
  const rngRef = useRef<Rng>(mulberry32(seed));
  const [match, setMatch] = useState<MatchState>(() => createMatch(game.deck, arch.deck, seed, 12));
  const [ai, setAi] = useState(() => chooseCard(match, arch, rngRef.current));
  const [sel, setSel] = useState<string | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [scene, setScene] = useState({ pos: match.pos, top: match.top });
  const [shake, setShake] = useState<"x" | "y" | null>(null);
  const [flash, setFlash] = useState<Side | null>(null);
  const [end, setEnd] = useState<null | "tap" | "release" | "done">(null);
  const [tapState, setTapState] = useState<{ ok: boolean } | null>(null);
  const [tut, setTut] = useState<boolean>(!!arch.tutorial);
  const [detail, setDetail] = useState<string | null>(null);

  const plays = [...playableCards(match, "p")].sort((a, b) => Number(b.playable) - Number(a.playable) || Number(!!a.basic) - Number(!!b.basic));
  const pRole = roleOf(match, "p");
  const oRole = roleOf(match, "o");

  function doReveal() {
    if (!sel) return;
    const { state: next, outcome } = playTurn(match, sel, ai.card, rngRef.current);
    setReveal({ pCard: sel, oCard: ai.card, outcome, next, flipped: false, shown: false });
    sfx.flip();
  }

  // Ablauf der Reveal-Sequenz: Flip → Hitstop → Auflösung
  useEffect(() => {
    if (!reveal || reveal.shown) return;
    if (!reveal.flipped) {
      const t = setTimeout(() => setReveal((r) => r && { ...r, flipped: true }), 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      const o = reveal.outcome;
      const moved = o.events.find((e) => e.t === "move");
      const wasStanding = match.pos === "dist" || match.pos === "clinch";
      if (moved && moved.t === "move") {
        setScene({ pos: moved.pos, top: moved.top });
        setShake(wasStanding && moved.pos !== "dist" && moved.pos !== "clinch" ? "y" : "x");
        sfx.hit();
      } else if (o.rule === "reaktion>angriff") {
        setShake("x"); sfx.counter();
      }
      if (o.events.some((e) => e.t === "points")) setTimeout(() => sfx.points(), 220);
      const winner = o.winner === "p" || o.winner === "o" ? o.winner : null;
      setFlash(winner);
      setReveal((r) => r && { ...r, shown: true });
      setTimeout(() => { setShake(null); setFlash(null); }, 450);
    }, 520);
    return () => clearTimeout(t);
  }, [reveal]);

  function next() {
    if (!reveal) return;
    const n = reveal.next;
    setMatch(n);
    setScene({ pos: n.pos, top: n.top });
    setReveal(null);
    setSel(null);
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
    const t = setTimeout(() => { setTapState({ ok: false }); setEnd("done"); }, end === "tap" ? 3500 : 3000);
    return () => clearTimeout(t);
  }, [end]);
  function hitTap() {
    sfx.tap(); setTapState({ ok: true }); setEnd("done");
    if (end === "tap") game.set({ taps: game.taps + 1 }); else game.set({ releases: game.releases + 1 });
  }

  const res = match.result;
  const won = res ? res.winner === "p" : null;

  return (
    <div className="arena">
      {/* HUD */}
      <header className="hud">
        <button className="icon-btn" onClick={() => onExit(null)} aria-label="Kampf verlassen">✕</button>
        <FighterHud side="p" name="Du" st={match} />
        <div className="clock"><span className="label">Zug</span><span className="num">{Math.min(match.turn, match.maxTurns)}/{match.maxTurns}</span></div>
        <FighterHud side="o" name={arch.name} st={match} />
      </header>

      <ChainBar pStep={chainStep(match.pos, pRole)} oStep={chainStep(match.pos, oRole)} />

      <div className="stage">
        <Fighters pos={scene.pos} top={scene.top} shake={shake} flash={flash} className="stage-fighters" />
        <div className="stage-pos">
          <span className="display">{POS_LABEL[scene.pos]}</span>
          <span className="label">{(() => { const r = roleOf({ ...match, pos: scene.pos, top: scene.top }, "p"); return r === "neutral" ? "Neutral – beide stehen" : `Du: ${ROLE_LABEL[r]}`; })()}</span>
        </div>

        <AnimatePresence>
          {reveal && (
            <motion.div className="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="reveal-cards">
                <motion.div initial={{ y: 160, rotate: -6 }} animate={{ y: 0, rotate: -3 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className={reveal.shown && (reveal.outcome.winner === "p" || reveal.outcome.winner === "both") ? "rc win" : reveal.shown ? "rc lose" : "rc"}>
                  <CardFlip card={CARD[reveal.pCard]} revealed={reveal.flipped} art={<CardArt card={CARD[reveal.pCard]} />} />
                  <span className="label rc-tag">Du</span>
                </motion.div>
                <motion.div className="vs display" initial={{ scale: 0 }} animate={{ scale: 1 }}>VS</motion.div>
                <motion.div initial={{ y: -160, rotate: 6 }} animate={{ y: 0, rotate: 3 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className={reveal.shown && (reveal.outcome.winner === "o" || reveal.outcome.winner === "both") ? "rc win o" : reveal.shown ? "rc lose" : "rc"}>
                  <CardFlip card={CARD[reveal.oCard]} revealed={reveal.flipped} delay={0.05} art={<CardArt card={CARD[reveal.oCard]} />} />
                  <span className="label rc-tag">{arch.name}</span>
                </motion.div>
              </div>
              <AnimatePresence>
                {reveal.shown && (
                  <motion.div className="verdict" initial={{ y: 30, opacity: 0, scale: .9 }} animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 24 }}>
                    <span className="label">{RULE_LABEL[reveal.outcome.rule]}</span>
                    <strong className="display">{reveal.outcome.headline}</strong>
                    {reveal.outcome.lesson && <p className="verdict-lesson">{reveal.outcome.lesson}</p>}
                    <button className="btn primary" onClick={next} autoFocus>Weiter</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hand */}
      {!reveal && !end && (
        <section className="handzone">
          <div className="hand-info">
            {ai.intent ? <span className="intent"><b className="label">Absicht</b> {INTENT[ai.intent]}</span>
              : <span className="intent muted"><b className="label">Absicht</b> {arch.name} gibt nichts preis.</span>}
            <Triangle />
          </div>
          <div className="hand" role="listbox" aria-label="Deine Karten">
            {plays.map((p, i) => {
              const c = CARD[p.id];
              const prev = plays[i - 1];
              const showDivider = (p.basic && p.playable && (!prev || !prev.basic)) || (!p.playable && (!prev || prev.playable));
              return (
                <div key={p.id + i} className="hand-slot">
                  {showDivider && <span className="divider label">{p.playable ? "Grundtechniken" : "Passt gerade nicht"}</span>}
                  <Card card={c} size="hand" art={<CardArt card={c} size={96} />} selected={sel === p.id}
                    disabled={!p.playable} reason={p.reason}
                    onClick={() => { if (p.playable) { setSel(sel === p.id ? null : p.id); sfx.select(); } }} />
                </div>
              );
            })}
          </div>
          <div className="playbar">
            <button className="btn ghost" disabled={!sel} onClick={() => sel && setDetail(sel)}>Karte lesen</button>
            <button className="btn primary big" disabled={!sel} onClick={doReveal}>{sel ? `Aufdecken: ${CARD[sel].name}` : "Wähle eine Karte"}</button>
          </div>
        </section>
      )}

      {/* Kartendetail */}
      <AnimatePresence>
        {detail && (
          <motion.div className="sheet-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetail(null)}>
            <motion.div className="sheet" initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} onClick={(e) => e.stopPropagation()}>
              <CardDetail id={detail} />
              <button className="btn" onClick={() => setDetail(null)}>Schließen</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial */}
      <AnimatePresence>
        {tut && arch.tutorial && (
          <motion.div className="sheet-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="sheet tutorial" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <span className="label">Tutorial {arch.tutorial}/3</span>
              <h2 className="display">{TUTORIAL[arch.tutorial].title}</h2>
              <ol>{TUTORIAL[arch.tutorial].points.map((t) => <li key={t}>{t}</li>)}</ol>
              <Triangle big />
              <button className="btn primary big" onClick={() => setTut(false)}>Los geht's</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap / Loslassen */}
      <AnimatePresence>
        {(end === "tap" || end === "release") && res?.type === "submission" && (
          <motion.div className="tap-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <span className="label">{CARD[res.card].name} sitzt</span>
            <h2 className="display">{end === "tap" ? "Klopf ab!" : "Er klopft ab!"}</h2>
            <p>{end === "tap" ? "Früh und deutlich abklopfen – Verlieren gehört dazu, verletzt sein nicht." : "Sofort loslassen. Dein Partner vertraut dir."}</p>
            <motion.button className={`tap-btn ${end}`} onClick={hitTap} autoFocus
              animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: .7 }}>
              {end === "tap" ? "TAP" : "LOSLASSEN"}
            </motion.button>
            <motion.div className="tap-timer" initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: end === "tap" ? 3.5 : 3, ease: "linear" }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ergebnis */}
      {end === "done" && res && (
        <EndScreen arch={arch} match={match} won={won} tap={tapState} onExit={onExit} />
      )}
    </div>
  );
}

const RULE_LABEL: Record<RevealOutcome["rule"], string> = {
  "angriff>setup": "Angriff schlägt Setup",
  "setup>reaktion": "Setup schlägt Reaktion",
  "reaktion>angriff": "Reaktion kontert Angriff",
  tempo: "Schneller gewinnt",
  scramble: "Scramble",
  "beide-setup": "Beide bauen auf",
  patt: "Patt",
  durch: "Reaktion passt nicht",
};

function FighterHud({ side, name, st }: { side: Side; name: string; st: MatchState }) {
  const f = st[side];
  return (
    <div className={`fhud ${side}`}>
      <div className="fhud-top">
        <span className="fname">{name}</span>
        <motion.span key={f.pts} className="fpts display num" initial={{ scale: 1.6 }} animate={{ scale: 1 }}>{f.pts}</motion.span>
      </div>
      <div className="bar gas" title={`Gas ${f.gas}/12`} aria-label={`Gas ${f.gas} von 12`}>
        <motion.i animate={{ width: `${(f.gas / 12) * 100}%` }} />
      </div>
      <div className="pips" aria-label={`Kontrolle ${f.control} von 5`} title={`Kontrolle ${f.control}/5`}>
        {[1, 2, 3, 4, 5].map((n) => <i key={n} className={n <= f.control ? "on" : ""} />)}
        {f.opening && <span className="opening label">Öffnung</span>}
      </div>
    </div>
  );
}

function ChainBar({ pStep, oStep }: { pStep: number; oStep: number }) {
  return (
    <div className="chain" aria-label={`Kampfkette: du bei ${CHAIN[pStep - 1]}`}>
      {CHAIN.map((name, i) => {
        const n = i + 1;
        return (
          <div key={name} className={`link ${n <= pStep ? "p" : ""} ${n === pStep ? "cur" : ""}`}>
            <span className="label">{n}</span><span className="lname">{name}</span>
            {n === oStep && <motion.span layoutId="omark" className="omark" />}
            {n === pStep && <motion.span layoutId="pmark" className="pmark" />}
          </div>
        );
      })}
    </div>
  );
}

export function Triangle({ big }: { big?: boolean }) {
  return (
    <div className={`triangle ${big ? "big" : ""}`} aria-label="Angriff schlägt Setup, Setup schlägt Reaktion, Reaktion schlägt Angriff">
      <span className="k angriff">Angriff</span><i>›</i><span className="k setup">Setup</span><i>›</i><span className="k reaktion">Reaktion</span><i>›</i><span className="k angriff">Angriff</span>
    </div>
  );
}

export function CardDetail({ id }: { id: string }) {
  const c = CARD[id];
  return (
    <div className="detail">
      <Card card={c} size="large" art={<CardArt card={c} size={200} />} />
      <div className="detail-text">
        <p>{c.desc}</p>
        <h4 className="label">Schlüsselpunkte</h4>
        <ul className="good">{c.keys.map((k) => <li key={k}>{k}</li>)}</ul>
        <h4 className="label">Typische Fehler</h4>
        <ul className="bad">{c.mistakes.map((k) => <li key={k}>{k}</li>)}</ul>
        {c.safety && <p className="safety"><b>Sicherheit:</b> {c.safety}</p>}
        {c.check && <p className="check label">Ohne Primärquelle – vom Trainer bestätigen lassen</p>}
        {c.source && <p className="src">Quelle: <a href={c.source.url} target="_blank" rel="noopener">{c.source.title}</a></p>}
      </div>
    </div>
  );
}

function EndScreen({ arch, match, won, tap, onExit }: { arch: Archetype; match: MatchState; won: boolean | null; tap: { ok: boolean } | null; onExit: (won: boolean | null) => void }) {
  const res = match.result!;
  const sub = res.type === "submission";
  let title: string; let text: string;
  if (sub && won) { title = "Sieg per Submission"; text = tap?.ok ? `${CARD[res.card].name} sitzt – und du hast sofort losgelassen. Genau so.` : "Gewonnen, aber zu spät losgelassen. Auf der Matte heißt das: Verletzungsgefahr für deinen Partner."; }
  else if (sub) { title = "Abgeklopft"; text = tap?.ok ? `Rechtzeitig abgeklopft gegen ${CARD[res.card].name}. Daraus lernst du – unverletzt.` : "Zu spät abgeklopft. Im echten Training droht hier eine Verletzung: früh und deutlich klopfen."; }
  else if (won) { title = `Sieg nach Punkten ${match.p.pts}:${match.o.pts}`; text = "Mehr Kontrolle, mehr Punkte. Jetzt noch die Submission – Position vor Submission."; }
  else if (won === false) { title = `Niederlage ${match.p.pts}:${match.o.pts}`; text = `${arch.name} hatte die besseren Positionen. Schau, wo deine Kette gerissen ist.`; }
  else { title = `Unentschieden ${match.p.pts}:${match.o.pts}`; text = "Gleich viele Punkte. Ein Angriff mehr hätte gereicht."; }
  return (
    <motion.div className="endscreen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className={`end-card ${won ? "won" : "lost"}`} initial={{ scale: .8, y: 40 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
        <span className="label">{arch.name} · {arch.title}</span>
        <h2 className="display">{title}</h2>
        <p>{text}</p>
        <div className="end-actions">
          <button className="btn primary big" onClick={() => onExit(won)}>{won ? "Belohnung abholen" : "Zurück"}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
