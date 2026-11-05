// Tagesrätsel: jeden Tag 3 Situationen (leicht → schwer), plus freies Üben nach Konzept.
// Die Auflösung kommt aus der echten Engine (playPuzzle → resolveReveal).
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { CardKind, RevealOutcome } from "../engine/types";
import { CARD } from "../data/cards";
import { POSITION_GUIDE } from "../data/positions";
import {
  CONCEPT_INFO, PUZZLES, PUZZLE_CONCEPTS, dateKey, playPuzzle, practiceSet, puzzleOfDay, puzzleRole,
  type Puzzle, type PuzzleConcept, type PuzzleResult,
} from "../data/puzzles";
import { usePuzzles, liveStreak, MAX_FREEZES, type advanceStreak } from "../puzzleStore";
import { Card } from "../components/Card";
import { CardArt } from "../components/CardArt";
import { CardFlip } from "../components/CardFlip";
import { Fighters } from "../components/fighters";
import { Confetti, Stamp } from "../components/fx";
import { CoachAvatar, IconBulb, IconCheck, IconCross, RevealExplain } from "../components/learn";

const INTENT: Record<CardKind, string> = {
  angriff: "Gleich greift er an.",
  setup: "Er bereitet etwas vor.",
  reaktion: "Er lauert auf deinen Angriff.",
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
  tempo: null, scramble: null, "beide-setup": null, patt: null, durch: null,
};
const DIFF_LABEL = ["", "Leicht", "Mittel", "Schwer"];

type View =
  | { v: "home" }
  | { v: "play"; mode: "daily" | "practice"; list: Puzzle[]; idx: number; concept?: PuzzleConcept | null; right: number }
  | { v: "summary"; right: number; total: number; streak: ReturnType<typeof advanceStreak> | null; mode: "daily" | "practice" };

export function Puzzles({ onBack }: { onBack: () => void }) {
  const today = dateKey(new Date());
  const daily = useMemo(() => puzzleOfDay(today), [today]);
  const st = usePuzzles();
  const streakNow = liveStreak(st, today);
  const answersToday = st.today?.date === today ? st.today.answers : {};
  const dailyDone = st.lastPlayed === today;
  const [view, setView] = useState<View>({ v: "home" });

  const startDaily = () => {
    const first = daily.findIndex((p) => !(p.id in answersToday));
    const right = daily.filter((p) => answersToday[p.id]).length;
    setView({ v: "play", mode: "daily", list: daily, idx: first < 0 ? 0 : first, right });
  };
  const startPractice = (concept: PuzzleConcept | null) =>
    setView({ v: "play", mode: "practice", list: practiceSet(concept, st.solved), idx: 0, concept, right: 0 });

  const header = (
    <header className="pz-head">
      <button className="btn ghost small" onClick={view.v === "home" ? onBack : () => setView({ v: "home" })}>
        {view.v === "home" ? "Zurück" : "Übersicht"}
      </button>
      <h2 className="display pz-title">
        {view.v === "play"
          ? view.mode === "daily" ? <>Tagesrätsel <span className="num">{view.idx + 1}/{view.list.length}</span></>
            : <>Üben <span className="num">{view.idx + 1}/{view.list.length}</span></>
          : "Tagesrätsel"}
      </h2>
      <StreakFlame n={streakNow} freezes={st.freezes} lit={dailyDone} />
    </header>
  );

  if (view.v === "play") {
    const p = view.list[view.idx];
    const onAnswered = (correct: boolean) => {
      usePuzzles.getState().record(p.id, correct, view.mode === "daily" ? { day: today } : undefined);
    };
    const onNext = (correct: boolean) => {
      const right = view.right + (correct ? 1 : 0);
      if (view.idx + 1 < view.list.length) { setView({ ...view, idx: view.idx + 1, right }); return; }
      if (view.mode === "daily") {
        const ans = usePuzzles.getState().today?.answers ?? {};
        const dayRight = daily.filter((d) => ans[d.id]).length;
        const r = usePuzzles.getState().completeDay(today, dayRight);
        setView({ v: "summary", right: dayRight, total: daily.length, streak: r, mode: "daily" });
      } else {
        setView({ v: "summary", right, total: view.list.length, streak: null, mode: "practice" });
      }
    };
    return (
      <div className="screen pz">
        {header}
        <ProgressDots list={view.list} idx={view.idx} answers={view.mode === "daily" ? answersToday : null} />
        <PuzzlePlay key={`${view.mode}-${p.id}-${view.idx}`} puzzle={p} onAnswered={onAnswered} onNext={onNext}
          last={view.idx + 1 >= view.list.length} />
      </div>
    );
  }

  if (view.v === "summary") {
    return (
      <div className="screen pz">
        {header}
        <Summary right={view.right} total={view.total} streak={view.streak} mode={view.mode}
          onHome={() => setView({ v: "home" })} onBack={onBack} />
      </div>
    );
  }

  // ---------------- Übersicht ----------------
  const dailyRight = daily.filter((p) => answersToday[p.id]).length;
  return (
    <div className="screen pz">
      {header}
      <section className="pz-daily">
        <div className="pz-daily-top">
          <CoachAvatar size={44} />
          <div>
            <span className="label">Heute · {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}</span>
            <p className="pz-daily-lead">
              {dailyDone ? `Geschafft: ${dailyRight} von 3 richtig. Morgen gibt es neue.` : "Drei Situationen – finde jeweils die beste Karte."}
            </p>
          </div>
        </div>
        <ol className="pz-daily-list">
          {daily.map((p) => {
            const a = answersToday[p.id];
            return (
              <li key={p.id} className={a === true ? "ok" : a === false ? "miss" : ""}>
                <span className="pz-dot" aria-hidden>{a === true ? <IconCheck size={14} /> : a === false ? <IconCross size={14} /> : p.difficulty}</span>
                <span className="pz-daily-name">{p.title}</span>
                <Stars n={p.difficulty} />
              </li>
            );
          })}
        </ol>
        <button className="btn primary big" onClick={startDaily}>
          {dailyDone ? "Nochmal ansehen" : Object.keys(answersToday).length > 0 ? "Weiterspielen" : "Los geht's"}
        </button>
      </section>

      <section className="pz-stats" aria-label="Statistik">
        <Stat k="Serie" v={streakNow} />
        <Stat k="Beste" v={st.bestStreak} />
        <Stat k="Gelöst" v={`${st.solved.length}/${PUZZLES.length}`} />
        <Stat k="Treffer" v={st.stats.attempts ? `${Math.round((st.stats.correct / st.stats.attempts) * 100)}%` : "–"} />
      </section>

      <section className="pz-practice">
        <h3 className="display pz-sub">Frei üben</h3>
        <ul className="pz-concepts">
          {PUZZLE_CONCEPTS.map((c) => {
            const all = PUZZLES.filter((p) => p.concept === c);
            const done = all.filter((p) => st.solved.includes(p.id)).length;
            return (
              <li key={c}>
                <button className="pz-concept" onClick={() => startPractice(c)}>
                  <span className="pz-concept-name">{c}</span>
                  <span className="pz-concept-info muted small">{CONCEPT_INFO[c]}</span>
                  <span className="pz-concept-bar" aria-label={`${done} von ${all.length} gelöst`}>
                    <i style={{ width: `${(done / all.length) * 100}%` }} />
                  </span>
                  <span className="label num">{done}/{all.length}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <button className="btn" onClick={() => startPractice(null)}>Alle mischen</button>
      </section>
    </div>
  );
}

// ------------------------------------------------------------------
// Ein Rätsel spielen
// ------------------------------------------------------------------

function PuzzlePlay({ puzzle: p, onAnswered, onNext, last }: {
  puzzle: Puzzle; onAnswered: (correct: boolean) => void; onNext: (correct: boolean) => void; last: boolean;
}) {
  const reduce = useReducedMotion() ?? false;
  const [pick, setPick] = useState<string | null>(null);
  const [res, setRes] = useState<PuzzleResult | null>(null);
  const [stampDone, setStampDone] = useState(false);
  const opp = CARD[p.oppCard];
  const role = puzzleRole(p);
  const guide = POSITION_GUIDE[p.pos];
  const correct = pick === p.answer;
  const answerRes = useMemo(() => (pick && !correct ? playPuzzle(p, p.answer) : null), [p, pick, correct]);

  const choose = (id: string) => {
    if (pick) return;
    setPick(id);
    setRes(playPuzzle(p, id));
    onAnswered(id === p.answer);
  };

  // Szene folgt der echten Auflösung (kurz nach dem Aufdecken)
  const [scene, setScene] = useState({ pos: p.pos, top: p.top });
  useEffect(() => {
    if (!res) return;
    const t = setTimeout(() => setScene({ pos: res.after.pos, top: res.after.top }), reduce ? 0 : 450);
    return () => clearTimeout(t);
  }, [res, reduce]);

  const tapped = res?.tap;
  return (
    <div className="pz-play">
      <section className="pz-stage stage" aria-label={`${guide.plain}${role === "top" ? " (oben)" : role === "bottom" ? " (unten)" : ""}`}>
        <div className="pz-stage-pos">
          <span className="display">{POSITION_GUIDE[scene.pos].plain}</span>
          <span className="label muted">{POSITION_GUIDE[scene.pos].term}{scene.top ? (scene.top === "p" ? " · du oben" : " · du unten") : ""}</span>
        </div>
        <Fighters pos={scene.pos} top={scene.top} className="stage-fighters"
          flash={res ? (res.outcome.winner === "p" ? "p" : res.outcome.winner === "o" ? "o" : null) : null}
          shake={res && !reduce && (res.outcome.winner === "p" || res.outcome.winner === "o") ? "x" : null} />
        <motion.div className="pz-bubble" initial={{ opacity: 0, y: reduce ? 0 : -8 }} animate={{ opacity: 1, y: 0 }}>
          <b className="label">Er</b> {INTENT[opp.kind]}
        </motion.div>
        <div className="pz-oppcard" aria-label={pick ? `Er spielte ${opp.plain ?? opp.name}` : "Seine Karte ist verdeckt"}>
          <CardFlip card={opp} revealed={!!pick} size="mini" />
        </div>
        {pick && !stampDone && (
          <Stamp text={correct ? "RICHTIG!" : "FAST"} tone={correct ? "good" : "bad"}
            sub={tapped === "p" ? "Er klopft ab!" : undefined} hold={650} onDone={() => setStampDone(true)} />
        )}
      </section>

      <div className="pz-meta">
        <span className={`pz-chip d${p.difficulty}`}>{DIFF_LABEL[p.difficulty]}</span>
        <span className="pz-chip concept">{p.concept}</span>
        <Stars n={p.difficulty} />
      </div>
      <h3 className="display pz-ptitle">{p.title}</h3>
      <p className="pz-situation">{p.situation}</p>

      <div className="pz-options" role="group" aria-label="Wähle deine Karte">
        {p.options.map((id, i) => {
          const c = CARD[id];
          const state = !pick ? "" : id === p.answer ? "is-answer" : id === pick ? "is-wrong" : "is-dim";
          return (
            <motion.div key={id} className={`pz-opt ${state}`}
              initial={{ opacity: 0, y: reduce ? 0 : 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : i * 0.07, type: "spring", stiffness: 380, damping: 28 }}>
              <Card card={c} size="hand" art={<CardArt card={c} size={84} />} selected={pick === id}
                disabled={!!pick && id !== pick && id !== p.answer} onClick={pick ? undefined : () => choose(id)} />
              {pick && id === p.answer && <span className="pz-opt-badge ok"><IconCheck size={16} /> Beste Karte</span>}
              {pick && id === pick && id !== p.answer && <span className="pz-opt-badge miss"><IconCross size={16} /> Deine Wahl</span>}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {res && (
          <motion.section className="pz-explain" initial={{ opacity: 0, y: reduce ? 0 : 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.35, type: "spring", stiffness: 320, damping: 26 }}>
            <div className={`pz-verdict ${correct ? "ok" : "miss"}`}>
              {correct ? <IconCheck size={22} /> : <IconBulb size={22} />}
              <p>
                {correct
                  ? <>Genau! <b>{CARD[p.answer].plain ?? CARD[p.answer].name}</b> war die beste Karte.</>
                  : <>Fast. Besser war <b>{CARD[p.answer].plain ?? CARD[p.answer].name}</b>.</>}
              </p>
            </div>
            <p className="pz-why">{p.why}</p>
            <RevealExplain ruleLabel={RULE_LABEL[res.outcome.rule]} highlightKind={RULE_KIND[res.outcome.rule]}
              headline={res.outcome.headline} lesson={res.outcome.lesson} />
            {answerRes && (
              <p className="pz-alt muted small">
                Mit {CARD[p.answer].plain ?? CARD[p.answer].name}: {answerRes.outcome.headline}
              </p>
            )}
            <button className="btn primary big" onClick={() => onNext(correct)} autoFocus>
              {last ? "Fertig" : "Nächstes Rätsel"}
            </button>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

// ------------------------------------------------------------------
// Ende des Tages / der Übungsrunde
// ------------------------------------------------------------------

function Summary({ right, total, streak, mode, onHome, onBack }: {
  right: number; total: number; streak: ReturnType<typeof advanceStreak> | null; mode: "daily" | "practice";
  onHome: () => void; onBack: () => void;
}) {
  const reduce = useReducedMotion() ?? false;
  const [boom, setBoom] = useState(0);
  useEffect(() => { setBoom(1); }, []);
  const perfect = right === total;
  const extended = !!streak?.extended;
  return (
    <motion.section className="pz-summary" role="status"
      initial={{ opacity: 0, scale: reduce ? 1 : 0.92 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}>
      <Confetti run={boom} count={perfect ? 110 : 60} />
      <span className="label">{mode === "daily" ? "Tagesrätsel geschafft" : "Übungsrunde vorbei"}</span>
      <p className="display pz-score"><span className="num">{right}</span> von <span className="num">{total}</span> richtig</p>
      {mode === "daily" && streak && (
        <div className="pz-streak-big">
          <motion.div initial={{ scale: reduce ? 1 : 0.4, rotate: reduce ? 0 : -12 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: reduce ? 0 : 0.25, type: "spring", stiffness: 260, damping: 12 }}>
            <FlameIcon size={64} lit />
          </motion.div>
          <div>
            <p className="display pz-streak-n">
              <span className="num">{streak.streak}</span> {streak.streak === 1 ? "Tag" : "Tage"} in Folge
            </p>
            <p className="muted small">
              {extended ? (streak.usedFreezes > 0
                ? `${streak.usedFreezes} Freeze${streak.usedFreezes > 1 ? "s" : ""} hat deine Serie gerettet.`
                : streak.streak === 1 ? "Der erste Tag deiner Serie. Komm morgen wieder!" : "Serie verlängert – stark!")
                : "Heute schon gezählt."}
              {" "}Freezes: {streak.freezes}/{MAX_FREEZES}
            </p>
          </div>
        </div>
      )}
      <p className="muted small">
        {perfect ? "Alles richtig – du liest die Situationen wie ein Profi." : "Die Erklärungen helfen – unter „Frei üben“ kannst du jedes Konzept vertiefen."}
      </p>
      <div className="pz-summary-btns">
        <button className="btn primary big" onClick={onHome}>Weiter üben</button>
        <button className="btn" onClick={onBack}>Zurück zum Menü</button>
      </div>
    </motion.section>
  );
}

// ------------------------------------------------------------------
// Kleinteile
// ------------------------------------------------------------------

function ProgressDots({ list, idx, answers }: { list: Puzzle[]; idx: number; answers: Record<string, boolean> | null }) {
  if (list.length > 12) {
    return (
      <div className="pz-progress" aria-label={`Rätsel ${idx + 1} von ${list.length}`}>
        <div className="pz-progress-bar"><i style={{ width: `${(idx / list.length) * 100}%` }} /></div>
      </div>
    );
  }
  return (
    <ol className="pz-dots" aria-label={`Rätsel ${idx + 1} von ${list.length}`}>
      {list.map((p, i) => {
        const a = answers?.[p.id];
        return <li key={p.id} className={`${i === idx ? "now" : ""} ${a === true ? "ok" : a === false ? "miss" : i < idx ? "past" : ""}`} />;
      })}
    </ol>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="pz-stars" aria-label={`Schwierigkeit ${n} von 3`}>
      {[1, 2, 3].map((i) => <i key={i} className={i <= n ? "on" : ""} aria-hidden>★</i>)}
    </span>
  );
}

function Stat({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="pz-stat">
      <span className="display num">{v}</span>
      <span className="label muted">{k}</span>
    </div>
  );
}

function StreakFlame({ n, freezes, lit }: { n: number; freezes: number; lit: boolean }) {
  return (
    <div className={`pz-flame ${lit ? "lit" : ""}`} aria-label={`Serie: ${n} Tage, ${freezes} Freezes`}>
      <FlameIcon size={26} lit={lit || n > 0} />
      <span className="num">{n}</span>
      <span className="pz-freezes" aria-hidden>
        {Array.from({ length: MAX_FREEZES }, (_, i) => <i key={i} className={i < freezes ? "on" : ""}>❄</i>)}
      </span>
    </div>
  );
}

function FlameIcon({ size = 24, lit = true }: { size?: number; lit?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={`pz-flame-ico ${lit ? "on" : ""}`} aria-hidden focusable="false">
      <path d="M12 2c1 3.5 5 5.6 5 10.6A5 5 0 0 1 7 12.6c0-2 1-3.4 2-4.4.2 1.6 1 2.6 2 3 0-3.2-.4-6 1-9.2z" fill="var(--pz-flame-a)" />
      <path d="M12 12c.6 1.6 2.4 2.4 2.4 4.6a2.4 2.4 0 0 1-4.8 0c0-1.2.6-2 1.2-2.6.1.8.4 1.2.9 1.4-.1-1.4-.2-2.4.3-3.4z" fill="var(--pz-flame-b)" />
    </svg>
  );
}
