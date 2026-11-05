// Reise nach der Startwoche: Wiederholen, Fehlerdeck, Nach dem Training, Frage für den Trainer, Tagebuch.
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Pos2 } from "../core2/types";
import { ArenaK2 } from "../core2/ui/ArenaK2";
import { TUTORIALS_K2 } from "../core2/data/tutorials";
import type { TutorialK2Def } from "../core2/ui/tutorialTypes";
import { DAYS } from "../program/days";
import { LESSONS_PROGRAM } from "../program/lessons";
import { PositionMap } from "../program/PositionMap";
import { Quiz, type QuizResult } from "../program/Quiz";
import { ALL_QUESTIONS, Q_BY_ID, TOPIC_LABEL } from "../program/questions";
import { currentDay, drillsDone, loadProgress } from "../program/store";
import { loadWarmups } from "../program/warmup";
import { MAT_GOAL, knowledgeMeter, matMeter } from "./meters";
import { sfx } from "../sound";
import {
  POSITIONS, POS_LABEL, RECOMMEND, ROLES, resolveLesson, roleLabel, suggestQuestion,
  type LessonTarget, type StuckRole,
} from "./recommend";
import { pickRelated } from "./related";
import {
  ERROR_GRADUATE, INTERVALS, addDays, buildSession, errorIds, localDate, nextReviewDate, todayCount,
} from "./schedule";
import {
  addTraining, getJourney, patchTraining, syncLearned, useJourney, type JourneyState, type TrainingEntry,
} from "./store";
import "../program/program.css";
import "./journey.css";
import { formatDay, known, relDay, syncFromProgram, type JourneyStart } from "./ReviewCard";
export { ReviewCard, journeyVisible, formatDay, type JourneyStart } from "./ReviewCard";

/* ---------- Helfer ---------- */

const topicOf = (id: string) => Q_BY_ID[id]?.topic ?? "?";
const topicLabel = (t: string) => (TOPIC_LABEL as Record<string, string>)[t] ?? t;

function allLessons(): TutorialK2Def[] {
  return [...TUTORIALS_K2, ...LESSONS_PROGRAM];
}
const lessonById = (id: string) => allLessons().find((t) => t.id === id);
const hasLesson = (id: string) => !!lessonById(id);
const dayLessons = (n: number) => DAYS.find((d) => d.n === n)?.lessons as { kind: string; id?: string }[] | undefined;

export function targetFor(pos: Pos2, role: StuckRole): LessonTarget {
  return resolveLesson(RECOMMEND[pos][role], hasLesson, dayLessons);
}
function targetTitle(t: LessonTarget): string {
  return t.kind === "map" ? "Positions-Landkarte" : lessonById(t.id)?.title ?? "Lektion";
}




const FEEL = ["Zäh", "Mühsam", "Okay", "Gut", "Stark"] as const;

/* ============================================================
   Kompakte Karte (Kampagne-Tab und Programm-Startseite)
   ============================================================ */



/* ============================================================
   Hauptbildschirm
   ============================================================ */

type View =
  | { kind: "home" }
  | { kind: "review"; ids: string[] }
  | { kind: "reviewDone"; res: QuizResult[] }
  | { kind: "training" }
  | { kind: "trained"; entry: TrainingEntry; added: string[] }
  | { kind: "lesson"; target: LessonTarget; back: View };

export function JourneyScreen({ start = "home", onBack }: { start?: JourneyStart; onBack: () => void }) {
  const j = useJourney();
  const today = localDate();
  const [view, setView] = useState<View>(() => {
    syncFromProgram(true);
    if (start === "training") return { kind: "training" };
    if (start === "review") {
      const ids = buildSession(getJourney(), today, { topicOf, known, seed: Date.now() % 100000 });
      if (ids.length) return { kind: "review", ids };
    }
    return { kind: "home" };
  });
  const home = () => setView({ kind: "home" });
  const leave = () => (start === "home" ? home() : onBack());

  if (view.kind === "lesson") {
    const back = view.back;
    if (view.target.kind === "k2") {
      const t = lessonById(view.target.id);
      if (t) return <ArenaK2 key={t.id} mode="tutorial" tutorial={t} aiLevel={t.aiLevel} onExit={() => setView(back)} />;
    }
    return (
      <div className="pg-screen">
        <div className="pg-top"><button className="btn small ghost" onClick={() => setView(back)}>← Zurück</button></div>
        <PositionMap onDone={() => setView(back)} />
      </div>
    );
  }

  return (
    <div className="pg-screen jr-screen">
      <AnimatePresence mode="wait">
        <motion.div key={view.kind} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.24, ease: [0.2, 0.7, 0.2, 1] }} className="jr-view">
          {view.kind === "home" && (
            <Home j={j} today={today} onBack={onBack}
              onReview={(ids) => { sfx.select(); setView({ kind: "review", ids }); }}
              onTraining={() => { sfx.select(); setView({ kind: "training" }); }} />
          )}
          {view.kind === "review" && (
            <>
              <div className="pg-top">
                <button className="btn small ghost" onClick={leave} aria-label="Runde verlassen">✕</button>
                <span className="label">Wiederholen · gemischt</span>
              </div>
              <Quiz ids={view.ids} kicker="Wiederholen" onDone={(res) => setView({ kind: "reviewDone", res })} />
            </>
          )}
          {view.kind === "reviewDone" && <ReviewDone res={view.res} j={j} today={today} onDone={home} />}
          {view.kind === "training" && (
            <TrainingLog onCancel={leave} onSaved={(entry, added) => setView({ kind: "trained", entry, added })} />
          )}
          {view.kind === "trained" && (
            <TrainingResult entry={j.log.find((e) => e.id === view.entry.id) ?? view.entry} added={view.added}
              onLesson={(target) => setView({ kind: "lesson", target, back: view })}
              onReview={() => {
                const ids = buildSession(getJourney(), today, { topicOf, known, seed: Date.now() % 100000 });
                if (ids.length) setView({ kind: "review", ids });
              }}
              onDone={home} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ---------- Startseite der Reise ---------- */

function Home({ j, today, onBack, onReview, onTraining }: {
  j: JourneyState; today: string; onBack: () => void; onReview: (ids: string[]) => void; onTraining: () => void;
}) {
  const c = todayCount(j, today, known);
  const next = nextReviewDate(j, today);
  const errs = errorIds(j, known);
  const open = [...j.log].reverse().filter((e) => e.ask && !e.ask.asked);
  const session = () => buildSession(j, today, { topicOf, known, seed: Date.now() % 100000 });
  const canPractice = Object.keys(j.items).some(known);
  const n = Math.min(c.total, 8);

  return (
    <div className="jr-home">
      <div className="pg-top"><button className="btn small ghost" onClick={onBack}>← Zurück</button></div>
      <header>
        <span className="label pg-kicker">Nach der Startwoche</span>
        <h2 className="display pg-title">Dranbleiben</h2>
        <p className="muted pg-promise">Kurz wiederholen, Fehler ausbügeln, Training festhalten. Kein Druck, keine Erinnerungen.</p>
      </header>

      <Meters j={j} />

      <section className="pg-panel jr-review">
        <div className="jr-row">
          <div>
            <span className="label">Wiederholen</span>
            <h3 className="display pg-h">{c.total ? `Heute ${n} ${n === 1 ? "Frage" : "Fragen"}` : "Heute ist frei"}</h3>
          </div>
          <span className={`jr-ring big ${c.total ? "on" : ""}`} aria-hidden="true"><b className="num">{c.total ? n : "✓"}</b></span>
        </div>
        <p className="small muted">
          {c.total > 8 ? `Eine Runde, Themen gemischt. ${c.total - 8} weitere warten – ganz ohne Eile.`
            : c.total ? "Eine Runde, Themen gemischt. Falsche kommen gleich noch einmal."
            : next ? `Nächste Runde ${relDay(next, today)}.` : "Sobald du Fragen gelernt hast, kommen sie hier wieder."}
        </p>
        <Intervals />
        {c.total > 0 && <button className="btn primary big" onClick={() => onReview(session())}>Runde starten</button>}
        {c.total === 0 && canPractice && <button className="btn" onClick={() => onReview(session())}>Trotzdem eine Runde</button>}
      </section>

      <section className="pg-panel jr-errors">
        <div className="jr-row">
          <div>
            <span className="label">Fehlerdeck</span>
            <h3 className="display pg-h">{errs.length ? `${errs.length} ${errs.length === 1 ? "Karte" : "Karten"}` : "Leer"}</h3>
          </div>
          {j.graduated > 0 && <span className="jr-pill small">{j.graduated} geschafft</span>}
        </div>
        <p className="small muted">Jede falsche Antwort landet hier. Dreimal richtig in getrennten Runden, dann ist sie raus.</p>
        <ul className="jr-err-list">
          <AnimatePresence initial={false}>
            {errs.slice(0, 6).map((id, i) => (
              <motion.li key={id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.04 }}>
                <span className="jr-err-q small">{Q_BY_ID[id].q}</span>
                <span className="jr-dots" aria-label={`${j.errors[id].streak} von ${ERROR_GRADUATE} richtig`}>
                  {Array.from({ length: ERROR_GRADUATE }, (_, k) => <i key={k} className={k < j.errors[id].streak ? "on" : ""} />)}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {errs.length > 6 && <p className="small muted">… und {errs.length - 6} weitere.</p>}
      </section>

      <section className="pg-panel jr-after">
        <span className="label">Nach dem Training</span>
        <h3 className="display pg-h">Was war heute dran?</h3>
        <p className="small muted">Drei Schritte: was ihr gemacht habt, wo du hängen geblieben bist, wie es war.</p>
        <button className="btn primary big" onClick={onTraining}>Training eintragen</button>
        {open.length > 0 && (
          <div className="jr-asks">
            <span className="label">Für die nächste Stunde</span>
            {open.slice(0, 3).map((e) => <AskRow key={e.id} e={e} />)}
          </div>
        )}
      </section>

      <Diary log={j.log} />
    </div>
  );
}

/* ---------- Wissen vs. Mattenpraxis: zwei Anzeigen, nie ein gemeinsamer Wert ---------- */

function Meters({ j }: { j: JourneyState }) {
  const k = knowledgeMeter(j.acc);
  const m = matMeter({ drills: drillsDone(loadProgress()), warmups: loadWarmups().done.length, trainings: j.log.length });
  const pct = k.rate === null ? null : Math.round(k.rate * 100);
  return (
    <section className="jr-meters" aria-label="Wissen und Mattenpraxis – getrennt">
      <div className="jr-meter know">
        <div className="jr-meter-head"><span className="label">Wissen</span><b className="num">{pct === null ? "–" : `${pct} %`}</b></div>
        <div className="jr-bar" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? 0} aria-label="Wissen">
          <motion.i initial={{ width: 0 }} animate={{ width: `${pct ?? 0}%` }} transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }} />
        </div>
        <p className="small muted">{pct === null ? `Ab 5 Antworten (bisher ${k.n}).` : `Richtig beim ersten Versuch, letzte ${k.n} Antworten aus Rätseln und Wiederholung.`}</p>
      </div>
      <div className="jr-meter mat">
        <div className="jr-meter-head"><span className="label">Mattenpraxis</span><b className="num">{m.units}</b></div>
        <div className="jr-bar" role="meter" aria-valuemin={0} aria-valuemax={MAT_GOAL} aria-valuenow={Math.min(m.units, MAT_GOAL)} aria-label="Mattenpraxis">
          <motion.i initial={{ width: 0 }} animate={{ width: `${m.frac * 100}%` }} transition={{ duration: 0.8, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }} />
        </div>
        <p className="small muted">Selbst eingetragen: <span className="num">{m.trainings}</span> Trainings · <span className="num">{m.drills}</span> Drills · <span className="num">{m.warmups}</span>× Aufwärmen. Balken bis {MAT_GOAL} (Richtwert).</p>
      </div>
      <p className="small jr-meters-why"><b>Warum getrennt?</b> Wissen im Kopf ist nicht Können im Körper. Das zweite wächst nur auf der Matte.</p>
    </section>
  );
}

function Intervals() {
  return (
    <div className="jr-intervals" aria-label="Abstände: 1, 2, 4, 7, 14 und 30 Tage nach dem Lernen">
      {INTERVALS.map((d, i) => (
        <motion.span key={d} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
          <i style={{ ["--s" as string]: `${0.5 + i * 0.12}` }} /><span className="num small">{d}</span>
        </motion.span>
      ))}
      <span className="small muted jr-int-lab">Tage nach dem Lernen</span>
    </div>
  );
}

function AskRow({ e }: { e: TrainingEntry }) {
  const asked = !!e.ask?.asked;
  return (
    <motion.div className={`jr-ask ${asked ? "done" : ""}`} layout>
      <p className="small">„{e.ask?.text}“</p>
      <button type="button" className={`btn small ${asked ? "" : "primary"}`} aria-pressed={asked}
        onClick={() => { sfx.select(); patchTraining(e.id, { ask: { text: e.ask?.text ?? "", asked: !asked } }); }}>
        {asked ? "Gefragt ✓" : "Gefragt"}
      </button>
    </motion.div>
  );
}

/* ---------- Tagebuch ---------- */

function Diary({ log }: { log: TrainingEntry[] }) {
  if (!log.length) return null;
  const list = [...log].reverse();
  return (
    <section className="pg-panel jr-diary">
      <span className="label">Trainingstagebuch</span>
      <h3 className="display pg-h">{log.length} {log.length === 1 ? "Training" : "Trainings"}</h3>
      <ol className="jr-diary-list">
        {list.slice(0, 20).map((e, i) => (
          <motion.li key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 6) * 0.04 }}>
            <div className="jr-diary-head">
              <b>{formatDay(e.at)}</b>
              <span className={`jr-feel f${e.feel}`}>{e.feel} · {FEEL[e.feel - 1]}</span>
            </div>
            {e.trained.length > 0 && <div className="jr-tags">{e.trained.map((p) => <span key={p}>{POS_LABEL[p]}</span>)}</div>}
            {e.stuck && <p className="small">Hängen geblieben: <b>{POS_LABEL[e.stuck.pos]}</b> · {roleLabel(e.stuck.pos, e.stuck.role)}</p>}
            {e.note && <p className="small muted">{e.note}</p>}
            {e.ask && <p className="small muted">Frage: „{e.ask.text}“ {e.ask.asked ? "· gefragt ✓" : ""}</p>}
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

/* ---------- Ergebnis einer Wiederholungsrunde ---------- */

function ReviewDone({ res, j, today, onDone }: { res: QuizResult[]; j: JourneyState; today: string; onDone: () => void }) {
  const ok = res.filter((r) => r.ok).length;
  const errs = errorIds(j, known).length;
  const next = nextReviewDate(j, today);
  return (
    <div className="pg-panel center jr-done">
      <motion.div className="jr-check" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }}>✓</motion.div>
      <span className="label">Runde geschafft</span>
      <h3 className="display pg-h">{ok} von {res.length} gleich richtig</h3>
      <p className="small">Abrufen stärkt dein Gedächtnis – auch wenn es mal hakt.</p>
      <p className="small muted">
        Fehlerdeck: {errs} {errs === 1 ? "Karte" : "Karten"}.{next ? ` Nächste Runde ${relDay(next, today)}.` : ""}
      </p>
      <button className="btn primary big" onClick={onDone}>Fertig</button>
    </div>
  );
}

/* ============================================================
   Nach dem Training: 3 Schritte
   ============================================================ */

function TrainingLog({ onCancel, onSaved }: { onCancel: () => void; onSaved: (e: TrainingEntry, added: string[]) => void }) {
  const [step, setStep] = useState(0);
  const [trained, setTrained] = useState<Pos2[]>([]);
  const [stuckPos, setStuckPos] = useState<Pos2 | null>(null);
  const [stuck, setStuck] = useState<{ pos: Pos2; role: StuckRole } | null>(null);
  const [note, setNote] = useState("");

  function save(feel: number) {
    const j = getJourney();
    const topics = stuck ? RECOMMEND[stuck.pos][stuck.role].topics
      : [...new Set(trained.flatMap((p) => [...RECOMMEND[p].bottom.topics, ...RECOMMEND[p].top.topics]))];
    const added = pickRelated(ALL_QUESTIONS, topics, j, 4, Date.now() % 100000);
    const ask = stuck ? { text: suggestQuestion(stuck.pos, stuck.role, j.log.length), asked: false } : undefined;
    const entry = addTraining({ at: localDate(), trained, stuck, feel, note: note.trim() || undefined, ask }, added);
    sfx.win();
    onSaved(entry, added);
  }

  const titles = ["Was habt ihr trainiert?", "Wo bist du hängen geblieben?", "Wie hat es sich angefühlt?"];
  return (
    <div className="jr-log">
      <div className="pg-top">
        <button className="btn small ghost" onClick={step ? () => setStep(step - 1) : onCancel} aria-label={step ? "Zurück" : "Abbrechen"}>{step ? "←" : "✕"}</button>
        <span className="label">Nach dem Training · {step + 1}/3</span>
      </div>
      <div className="jr-progress" aria-hidden="true">{[0, 1, 2].map((i) => <i key={i} className={i <= step ? "on" : ""} />)}</div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
          transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }} className="pg-panel">
          <h2 className="display pg-h">{titles[step]}</h2>

          {step === 0 && (
            <>
              <p className="small muted">Tippe alles an, was dran war.</p>
              <div className="jr-chips">
                {POSITIONS.map((p) => {
                  const on = trained.includes(p);
                  return (
                    <motion.button key={p} type="button" className={`jr-chip ${on ? "on" : ""}`} aria-pressed={on} whileTap={{ scale: 0.94 }}
                      onClick={() => { sfx.select(); setTrained((t) => (on ? t.filter((x) => x !== p) : [...t, p])); }}>
                      {POS_LABEL[p]}
                    </motion.button>
                  );
                })}
              </div>
              <button className="btn primary big" disabled={!trained.length} onClick={() => setStep(1)}>Weiter</button>
            </>
          )}

          {step === 1 && (
            <>
              <p className="small muted">Eine Lage reicht. Dann: oben oder unten?</p>
              <div className="jr-chips">
                {POSITIONS.map((p) => (
                  <motion.button key={p} type="button" className={`jr-chip ${stuckPos === p ? "on" : ""} ${trained.includes(p) ? "hot" : ""}`}
                    aria-pressed={stuckPos === p} whileTap={{ scale: 0.94 }}
                    onClick={() => { sfx.select(); setStuckPos(p); }}>
                    {POS_LABEL[p]}
                  </motion.button>
                ))}
              </div>
              <AnimatePresence>
                {stuckPos && (
                  <motion.div className="jr-roles" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    {ROLES.map((r) => (
                      <button key={r} type="button" className="btn big" onClick={() => { sfx.select(); setStuck({ pos: stuckPos, role: r }); setStep(2); }}>
                        {roleLabel(stuckPos, r)}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <button className="btn ghost" onClick={() => { setStuck(null); setStuckPos(null); setStep(2); }}>Nirgends – lief gut</button>
            </>
          )}

          {step === 2 && (
            <>
              {stuck && <p className="small muted">Hängen geblieben: <b>{POS_LABEL[stuck.pos]}</b> · {roleLabel(stuck.pos, stuck.role)}</p>}
              <label className="jr-note">
                <span className="small muted">Notiz (freiwillig, eine Zeile)</span>
                <input type="text" maxLength={120} value={note} placeholder="z. B. Brücke klappt, Shrimp noch zu klein"
                  onChange={(e) => setNote(e.target.value)} />
              </label>
              <p className="small muted">Tippe an, wie es war. Das speichert gleich.</p>
              <div className="jr-feels">
                {FEEL.map((f, i) => (
                  <motion.button key={f} type="button" className={`jr-feel-btn f${i + 1}`} whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    onClick={() => save(i + 1)}>
                    <b className="num">{i + 1}</b><span className="small">{f}</span>
                  </motion.button>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ---------- Ergebnis: Empfehlung + Frage für den Trainer ---------- */

function TrainingResult({ entry, added, onLesson, onReview, onDone }: {
  entry: TrainingEntry; added: string[]; onLesson: (t: LessonTarget) => void; onReview: () => void; onDone: () => void;
}) {
  const s = entry.stuck;
  const rec = s ? RECOMMEND[s.pos][s.role] : null;
  const target = s ? targetFor(s.pos, s.role) : null;
  const topics = [...new Set(added.map(topicOf))].map(topicLabel);
  return (
    <div className="jr-result">
      <motion.div className="pg-panel center jr-done" initial={{ scale: 0.96 }} animate={{ scale: 1 }}>
        <motion.div className="jr-check" initial={{ scale: 0.4, rotate: -40, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 15 }}>✓</motion.div>
        <span className="label">Eingetragen · {formatDay(entry.at)}</span>
        <h3 className="display pg-h">{s ? "Gut, dass du es festhältst" : "Lief gut – stark!"}</h3>
        {added.length > 0 && (
          <p className="small muted">{added.length} passende Fragen liegen jetzt in deiner Wiederholung{topics.length ? ` (${topics.join(", ")})` : ""}.</p>
        )}
      </motion.div>

      {s && rec && target && (
        <motion.section className="pg-panel jr-rec" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <span className="label">Passt zu deinem Hängepunkt</span>
          <h3 className="display pg-h">{targetTitle(target)}</h3>
          <p className="small"><b>{POS_LABEL[s.pos]} · {roleLabel(s.pos, s.role)}.</b> {rec.why}</p>
          <button className="btn primary big" onClick={() => { sfx.select(); onLesson(target); }}>Lektion starten</button>
        </motion.section>
      )}

      {s && entry.ask && <AskEditor entry={entry} />}

      <motion.div className="pg-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
        {added.length > 0 && <button className="btn big" onClick={onReview}>Jetzt wiederholen</button>}
        <button className="btn big" onClick={onDone}>Fertig</button>
      </motion.div>
    </div>
  );
}

function AskEditor({ entry }: { entry: TrainingEntry }) {
  const s = entry.stuck!;
  const [n, setN] = useState(0);
  const [text, setText] = useState(entry.ask?.text ?? "");
  const asked = !!entry.ask?.asked;
  const commit = (t: string, a = asked) => patchTraining(entry.id, { ask: { text: t.trim() || suggestQuestion(s.pos, s.role, 0), asked: a } });
  return (
    <motion.section className="pg-panel jr-askbox" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
      <span className="label">Frage für die nächste Stunde</span>
      <p className="small muted">Frag deinen Trainer vor oder nach der Stunde. Du darfst sie ändern.</p>
      <textarea rows={2} maxLength={200} value={text} aria-label="Frage für den Trainer"
        onChange={(e) => setText(e.target.value)} onBlur={() => commit(text)} />
      <div className="pg-row">
        <button type="button" className="btn small" onClick={() => {
          const k = n + 1; setN(k);
          const t = suggestQuestion(s.pos, s.role, getJourney().log.length - 1 + k);
          setText(t); commit(t);
        }}>Andere Frage</button>
        <button type="button" className={`btn small ${asked ? "" : "primary"}`} aria-pressed={asked}
          onClick={() => { sfx.select(); commit(text, !asked); }}>{asked ? "Gefragt ✓" : "Gefragt"}</button>
      </div>
    </motion.section>
  );
}
