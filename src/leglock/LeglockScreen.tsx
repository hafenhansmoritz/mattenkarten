// Woche 2: Beinhebel sicher – Übersicht, Lektionen, Abschluss-Check, Abzeichen.
import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { mulberry32, shuffle } from "../engine/rng";
import { Confetti } from "../components/fx/Confetti";
import { sfx } from "../sound";
import {
  AREAS, AREA_LABEL, BADGE, LESSONS, QUESTIONS, SOURCES, TRAINER_CHECK, TRAINER_REMINDER, lessonQuestions,
  type LQuestion, type Lesson, type RuleStatement, type SrcId, type Step,
} from "./content";
import { LegDiagram } from "./LegDiagram";
import {
  checkOpen, completeLesson, isLeglockUnlocked, lessonOpen, recordCheck, scoreCheck, useLeglock, loadLeglock, type LeglockCheck,
} from "./store";
import "../program/program.css";
import "./leglock.css";

type View = { kind: "home" } | { kind: "lesson"; id: Lesson["id"] } | { kind: "check" } | { kind: "result"; c: LeglockCheck };

export function LeglockScreen({ onBack }: { onBack: () => void }) {
  const [s, update] = useLeglock();
  const [view, setView] = useState<View>({ kind: "home" });
  const unlocked = isLeglockUnlocked();

  if (!unlocked) {
    return (
      <div className="pg-screen">
        <div className="pg-top"><button className="btn small ghost" onClick={onBack}>← Zurück</button></div>
        <span className="label pg-kicker">Woche 2</span>
        <h2 className="display pg-title">Beinhebel sicher</h2>
        <section className="pg-day-card locked ll-locked">
          <span className="ll-lock" aria-hidden="true">🔒</span>
          <p><b>Noch gesperrt.</b> Schaffe zuerst Tag 7 im 7-Tage-Start.</p>
          <p className="muted small">Dann lernst du Regeln, Verteidigung und frühes Abklopfen bei Beinhebeln.</p>
        </section>
      </div>
    );
  }

  if (view.kind === "lesson") {
    const lesson = LESSONS.find((l) => l.id === view.id)!;
    return (
      <LessonRun lesson={lesson} onExit={(finished) => {
        if (finished) update((x) => completeLesson(x, lesson.id));
        setView({ kind: "home" });
      }} />
    );
  }
  if (view.kind === "check") {
    return (
      <div className="pg-screen">
        <div className="pg-top"><button className="btn small ghost" onClick={() => setView({ kind: "home" })}>← Abbrechen</button></div>
        <MiniQuiz questions={QUESTIONS} seed={Date.now() % 100000} kicker="Abschluss-Check · je Bereich 80 %"
          onDone={(res) => {
            const c = scoreCheck(res, (id) => QUESTIONS.find((q) => q.id === id)?.area);
            update((x) => recordCheck(x, c));
            setView({ kind: "result", c });
          }} />
      </div>
    );
  }
  if (view.kind === "result") return <Result c={view.c} onHome={() => setView({ kind: "home" })} onRetry={() => setView({ kind: "check" })} />;

  const ready = checkOpen(s);
  return (
    <div className="pg-screen">
      <div className="pg-top">
        <button className="btn small ghost" onClick={onBack}>← Zurück</button>
        <span className="label muted">Lektionen: <span className="num">{s.done.length}</span>/{LESSONS.length}</span>
      </div>
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <span className="label pg-kicker">Woche 2</span>
        <h2 className="display pg-title">Beinhebel sicher</h2>
        <p className="muted pg-promise">Hier lernst du <b>Wissen, keine Angriffe</b>. Üben auf der Matte nur mit Trainer.</p>
      </motion.header>
      <ol className="ll-lessons">
        {LESSONS.map((l, i) => {
          const done = s.done.includes(l.id);
          const open = lessonOpen(s, l.id);
          return (
            <motion.li key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <button type="button" className={`ll-lesson ${done ? "done" : open ? "now" : "locked"}`} disabled={!open}
                onClick={() => { sfx.select(); setView({ kind: "lesson", id: l.id }); }}>
                <span className="ll-num" aria-hidden="true">{done ? "✓" : i + 1}</span>
                <span className="ll-lesson-txt">
                  <strong className="display">{l.title}</strong>
                  <span className="muted small">{open ? l.short : `Erst „${LESSONS[i - 1].title}“ schaffen.`}</span>
                </span>
              </button>
            </motion.li>
          );
        })}
      </ol>
      <button className={`btn big ${ready ? "primary" : ""}`} disabled={!ready} onClick={() => { sfx.select(); setView({ kind: "check" }); }}>
        {ready ? (s.check?.passed ? "Check wiederholen" : "Abschluss-Check starten") : "Abschluss-Check nach allen 4 Lektionen"}
      </button>
      <BadgeBox on={!!s.check?.passed} />
      <p className="muted small center">Bei Schmerz im Knie oder Fuß: sofort abklopfen und Trainer fragen.</p>
    </div>
  );
}

function BadgeBox({ on }: { on: boolean }) {
  return (
    <div className={`pg-badge ${on ? "on" : ""}`}>
      <span className="pg-badge-ico">{on ? "✓" : "…"}</span>
      <div>
        <strong>{BADGE}</strong>
        <span className="muted small">{on ? TRAINER_REMINDER : "Bestehe den Abschluss-Check: in jedem Bereich mindestens 80 %."}</span>
      </div>
    </div>
  );
}

/* ---------- Ergebnis ---------- */
function Result({ c, onHome, onRetry }: { c: LeglockCheck; onHome: () => void; onRetry: () => void }) {
  return (
    <div className="pg-screen pg-rel">
      <Confetti run={c.passed} />
      <span className="label pg-kicker">Abschluss-Check</span>
      <h2 className="display pg-title">{c.passed ? "Bestanden!" : "Fast geschafft"}</h2>
      <ul className="ll-areas">
        {AREAS.map((a) => {
          const [ok, total] = c.areas[a];
          const pass = total > 0 && ok / total >= 0.8;
          return (
            <li key={a} className={pass ? "ok" : "no"}>
              <span>{AREA_LABEL[a]}</span>
              <span className="num">{ok}/{total} {pass ? "✓" : "· nochmal"}</span>
              <i style={{ width: `${total ? (ok / total) * 100 : 0}%` }} />
            </li>
          );
        })}
      </ul>
      {c.passed ? (
        <motion.div className="pg-badge on" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}>
          <span className="pg-badge-ico">✓</span>
          <div><strong>{BADGE}</strong><span className="muted small">{TRAINER_REMINDER}</span></div>
        </motion.div>
      ) : (
        <p className="muted">Lies die Lektion zum roten Bereich noch einmal. Dann klappt der Check.</p>
      )}
      <div className="ll-row">
        {!c.passed && <button className="btn big primary" onClick={onRetry}>Nochmal versuchen</button>}
        <button className={`btn big ${c.passed ? "primary" : ""}`} onClick={onHome}>Zur Übersicht</button>
      </div>
    </div>
  );
}

/* ---------- Lektion ---------- */
function LessonRun({ lesson, onExit }: { lesson: Lesson; onExit: (finished: boolean) => void }) {
  const [i, setI] = useState(0);
  const total = lesson.steps.length + 1; // + Kurz-Quiz
  const next = () => setI((n) => n + 1);
  return (
    <div className="pg-screen">
      <div className="pg-top">
        <button className="btn small ghost" onClick={() => onExit(false)}>← Abbrechen</button>
        <span className="label muted">Schritt {lesson.plan} · <span className="num">{Math.min(i + 1, total)}</span>/{total}</span>
      </div>
      <div className="pg-quiz-bar" aria-hidden="true"><i style={{ width: `${(i / total) * 100}%` }} /></div>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.22 }}>
          {i < lesson.steps.length
            ? <StepView step={lesson.steps[i]} onNext={next} />
            : <MiniQuiz questions={lessonQuestions(lesson.area)} seed={i} kicker={`Kurz-Check · ${lesson.title}`} onDone={() => { sfx.win(); onExit(true); }} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Sources({ ids }: { ids?: SrcId[] }) {
  if (!ids?.length) return null;
  return (
    <p className="ll-src small">
      Quelle: {ids.map((id, k) => (
        <span key={id}>{k > 0 && " · "}<a href={SOURCES[id].url} target="_blank" rel="noopener noreferrer">{SOURCES[id].label}</a></span>
      ))}
    </p>
  );
}

function Rule({ r }: { r: RuleStatement }) {
  return (
    <li className={`ll-rule ${r.verified ? "ok" : "check"}`}>
      <span className="ll-rule-tag label">{r.verified ? "Regel" : "Prüfen"}</span>
      <span>{r.text}</span>
      <Sources ids={r.src} />
    </li>
  );
}

function StepView({ step, onNext }: { step: Step; onNext: () => void }) {
  switch (step.kind) {
    case "info": return (
      <section className="pg-qcard ll-step">
        <h3 className="display ll-h">{step.title}</h3>
        {step.body.map((b) => <p key={b}>{b}</p>)}
        {step.rules && <ul className="ll-rules">{step.rules.map((r) => <Rule key={r.text} r={r} />)}</ul>}
        {step.trainer && <p className="ll-trainer small">{TRAINER_CHECK}</p>}
        <Sources ids={step.src} />
        <button className="btn primary big" onClick={onNext}>Weiter</button>
      </section>
    );
    case "sort": return <SortStep step={step} onNext={onNext} />;
    case "spot": return <SpotStep step={step} onNext={onNext} />;
    case "card": return <CardStep step={step} onNext={onNext} />;
    case "tap": return <TapStep step={step} onNext={onNext} />;
  }
}

function SortStep({ step, onNext }: { step: Extract<Step, { kind: "sort" }>; onNext: () => void }) {
  const [k, setK] = useState(0);
  const [pick, setPick] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const item = step.items[k];
  if (!item) {
    return (
      <section className="pg-qcard ll-step">
        <h3 className="display ll-h">{score}/{step.items.length} richtig</h3>
        <ul className="ll-sorted">
          {step.items.map((it) => <li key={it.name} className={it.allowed ? "ok" : "no"}><span>{it.name}</span><b>{it.allowed ? "erlaubt" : "verboten"}</b></li>)}
        </ul>
        <p className="muted small">IBJJF, Weißgurt, Gi und No-Gi.</p>
        <Sources ids={["ibjjf-illegal"]} />
        <button className="btn primary big" onClick={onNext}>Weiter</button>
      </section>
    );
  }
  const answered = pick !== null;
  const right = pick === item.allowed;
  function choose(v: boolean) {
    if (answered) return;
    setPick(v);
    if (v === item.allowed) { sfx.points(); setScore((n) => n + 1); } else sfx.lose();
  }
  return (
    <section className="pg-qcard ll-step">
      <div className="pg-quiz-head"><span className="label">{step.title}</span><span className="label num">{k + 1}/{step.items.length}</span></div>
      <p className="muted small">{step.intro}</p>
      <motion.div key={item.name} className="ll-tech" initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.25 }}>
        <span className="display">{item.name}</span>
      </motion.div>
      <div className="ll-row">
        <button type="button" className={`pg-opt ll-choice ${answered ? (item.allowed ? "right" : pick ? "wrong" : "dim") : ""}`} disabled={answered} onClick={() => choose(true)}>Erlaubt</button>
        <button type="button" className={`pg-opt ll-choice ${answered ? (!item.allowed ? "right" : !pick ? "wrong" : "dim") : ""}`} disabled={answered} onClick={() => choose(false)}>Verboten</button>
      </div>
      {answered && (
        <motion.div className={`pg-why ${right ? "ok" : "no"}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <strong className="display">{right ? "Richtig!" : "So ist es:"}</strong>
          <p>{item.rule.text}</p>
          <Sources ids={item.rule.src} />
          <button className="btn primary big" onClick={() => { setPick(null); setK((n) => n + 1); }}>Weiter</button>
        </motion.div>
      )}
    </section>
  );
}

function SpotStep({ step, onNext }: { step: Extract<Step, { kind: "spot" }>; onNext: () => void }) {
  const [pick, setPick] = useState<number | null>(null);
  const answered = pick !== null;
  const right = pick === step.danger;
  return (
    <section className="pg-qcard ll-step">
      <span className="label pg-topic">{step.title}</span>
      <h3 className="pg-q">{step.q}</h3>
      <p className="muted small">Du bist <b style={{ color: "var(--gi-p)" }}>blau</b>. Tippe auf ein Bild.</p>
      <div className="ll-pics">
        {step.pics.map((d, k) => {
          const cls = !answered ? "" : k === step.danger ? "right" : k === pick ? "wrong" : "dim";
          return (
            <button key={d} type="button" className={`ll-pic ${cls}`} disabled={answered}
              onClick={() => { setPick(k); if (k === step.danger) sfx.points(); else sfx.lose(); }}>
              <LegDiagram id={d} showMark={answered && k === step.danger} label={step.captions[k]} />
              <span className="small">{k === 0 ? "A" : "B"}: {step.captions[k]}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <motion.div className={`pg-why ${right ? "ok" : "no"}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <strong className="display">{right ? "Richtig erkannt!" : `Richtig ist Bild ${step.danger === 0 ? "A" : "B"}:`}</strong>
          <p>{step.why}</p>
          {step.trainer && <p className="ll-trainer small">{TRAINER_CHECK}</p>}
          <Sources ids={step.src} />
          <button className="btn primary big" onClick={onNext}>Weiter</button>
        </motion.div>
      )}
    </section>
  );
}

function CardStep({ step, onNext }: { step: Extract<Step, { kind: "card" }>; onNext: () => void }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <section className="pg-qcard ll-step">
      <h3 className="display ll-h">{step.title}</h3>
      <p className="muted small">Tippe die Karte an, um sie umzudrehen.</p>
      <button type="button" className="ll-card-wrap" onClick={() => { sfx.flip(); setFlipped((f) => !f); }} aria-label={flipped ? "Karte zeigen" : "Karte umdrehen"}>
        <motion.div className="ll-card" animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}>
          <div className="ll-card-face front">
            <span className="label">Sicherheitskarte</span>
            <strong className="display">{step.front}</strong>
            <span className="ll-card-ico" aria-hidden="true">✋✋</span>
          </div>
          <div className="ll-card-face back">
            <span className="label">Warum?</span>
            {step.back.map((b) => <p key={b}>{b}</p>)}
          </div>
        </motion.div>
      </button>
      <button className={`btn big ${flipped ? "primary" : ""}`} onClick={onNext}>Weiter</button>
    </section>
  );
}

function TapStep({ step, onNext }: { step: Extract<Step, { kind: "tap" }>; onNext: () => void }) {
  const [taps, setTaps] = useState(0);
  const [ok, setOk] = useState(false);
  const last = useRef(0);
  function tap() {
    if (ok) return;
    const now = performance.now();
    const n = now - last.current < 1500 ? taps + 1 : 1;
    last.current = now;
    setTaps(n);
    sfx.select();
    if (n >= 2) { setOk(true); sfx.points(); }
  }
  return (
    <section className="pg-qcard ll-step">
      <h3 className="display ll-h">{step.title}</h3>
      <p>{step.text}</p>
      <motion.button type="button" className={`ll-tapcard ${ok ? "ok" : ""}`} onClick={tap} whileTap={{ scale: 0.95 }} aria-label="Abklopfen">
        <span className="display">{ok ? "Abgeklopft ✓" : taps === 1 ? "Noch einmal!" : "Klopf hier"}</span>
        <span className="ll-dots" aria-hidden="true"><i className={taps >= 1 ? "on" : ""} /><i className={taps >= 2 ? "on" : ""} /></span>
      </motion.button>
      {ok && (
        <motion.div className="pg-why ok" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p>{step.done}</p>
          <button className="btn primary big" onClick={onNext}>Weiter</button>
        </motion.div>
      )}
    </section>
  );
}

/* ---------- Kleines eigenes Quiz (der Programm-Quiz meldet an Wiederholung/Fehlerdeck) ---------- */
interface QItem { q: LQuestion; retry: boolean; key: number }

export function MiniQuiz({ questions, seed, kicker, onDone }: {
  questions: LQuestion[]; seed: number; kicker: string; onDone: (first: { id: string; ok: boolean }[]) => void;
}) {
  const initial = useMemo<QItem[]>(() => shuffle(questions, mulberry32(seed + 7)).map((q, i) => ({ q, retry: false, key: i })), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [queue, setQueue] = useState(initial);
  const [first, setFirst] = useState<{ id: string; ok: boolean }[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const item = queue[0];
  const order = useMemo(() => item ? shuffle(item.q.options.map((_, i) => i), mulberry32(seed + item.key * 31)) : [], [item?.key]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!item) return null;
  const q = item.q;
  const answered = picked !== null;
  const ok = picked === q.answer;
  function pick(i: number) {
    if (answered) return;
    setPicked(i);
    if (i === q.answer) sfx.points(); else sfx.lose();
    if (!item.retry) setFirst((f) => [...f, { id: q.id, ok: i === q.answer }]);
  }
  function next() {
    const rest = queue.slice(1);
    const nq = ok ? rest : [...rest, { q, retry: true, key: item.key + 1000 }];
    setPicked(null);
    if (!nq.length) { onDone(first); return; }
    setQueue(nq);
  }
  return (
    <div className="pg-quiz">
      <div className="pg-quiz-head"><span className="label">{kicker}</span><span className="label num">{Math.min(first.length + (answered || item.retry ? 0 : 1), initial.length)}/{initial.length}</span></div>
      <div className="pg-quiz-bar" aria-hidden="true"><i style={{ width: `${(first.length / initial.length) * 100}%` }} /></div>
      <AnimatePresence mode="wait">
        <motion.div key={item.key} className="pg-qcard" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.2 }}>
          {item.retry && <span className="pg-retry label">Noch einmal – ohne Strafe</span>}
          <span className="pg-topic label">{AREA_LABEL[q.area]}</span>
          <h3 className="pg-q">{q.q}</h3>
          <div className="pg-opts">
            {order.map((i) => {
              const cls = !answered ? "" : i === q.answer ? "right" : i === picked ? "wrong" : "dim";
              return (
                <button key={i} type="button" className={`pg-opt ${cls}`} disabled={answered} onClick={() => pick(i)}>
                  <span>{q.options[i]}</span>
                  {answered && i === q.answer && <span className="pg-opt-mark" aria-label="richtig">✓</span>}
                  {answered && i === picked && i !== q.answer && <span className="pg-opt-mark" aria-label="falsch">✗</span>}
                </button>
              );
            })}
          </div>
          {answered && (
            <motion.div className={`pg-why ${ok ? "ok" : "no"}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <strong className="display">{ok ? "Richtig!" : "Fast – so ist es:"}</strong>
              <p>{q.why}</p>
              <Sources ids={q.src} />
              {!ok && <p className="muted small">Die Frage kommt gleich noch einmal.</p>}
              <button type="button" className="btn primary big pg-next" onClick={next}>Weiter</button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ---------- Karte auf der Startseite des 7-Tage-Starts (nach Tag 7) ---------- */
export function LeglockCard({ onOpen }: { onOpen: () => void }) {
  const s = loadLeglock();
  const passed = !!s.check?.passed;
  return (
    <motion.section className="pg-day-card now ll-home-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <span className="label pg-kicker">Neu freigeschaltet · Woche 2</span>
      <h3 className="display ll-h">Beinhebel sicher</h3>
      <p className="small">Regeln, Verteidigung, Fußhebel erkennen, früh abklopfen. Ohne Angriffskarten.</p>
      <span className="muted small">{passed ? `✓ ${BADGE}` : `${s.done.length}/${LESSONS.length} Lektionen`}</span>
      <button className="btn big primary" onClick={onOpen}>{s.done.length ? "Weiter lernen" : "Woche 2 starten"}</button>
    </motion.section>
  );
}
