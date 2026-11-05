import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArenaK2 } from "../core2/ui/ArenaK2";
import { TUTORIALS_K2 } from "../core2/data/tutorials";
import type { TutorialK2Def } from "../core2/ui/tutorialTypes";
import { Confetti, Stamp } from "../components/fx";
import { sfx } from "../sound";
import { DAYS, NOT_ALONE, READY_CHECKLIST, type LessonRef, type ProgramDay } from "./days";
import { LESSONS_PROGRAM } from "./lessons";
import { PositionMap } from "./PositionMap";
import { Quiz, type QuizResult } from "./Quiz";
import { AREAS, buildExam, scoreExam } from "./exam";
import { AREA_LABEL } from "./questions";
import {
  completeDay, currentDay, drillsDone, knotState, sameDayHint, useProgram, type ProgramProgress,
} from "./store";
import "./program.css";

const ALL_LESSONS: TutorialK2Def[] = [...TUTORIALS_K2, ...LESSONS_PROGRAM];
export const lessonById = (id: string) => ALL_LESSONS.find((t) => t.id === id);

const PART_LABEL = ["Aufwärmen", "Lektion", "Rätsel", "Matten-Drill"] as const;

function lessonTitle(l: LessonRef): string {
  if (l.kind === "map") return "Positions-Landkarte";
  if (l.kind === "exam") return "Prüfung: 12 Fragen";
  return lessonById(l.id)?.title ?? l.id;
}

/* ============================================================
   Einstieg
   ============================================================ */

type View = { kind: "home" } | { kind: "day"; n: number } | { kind: "final" };

export function ProgramScreen({ onBack }: { onBack: () => void }) {
  const [p, update] = useProgram();
  const [view, setView] = useState<View>({ kind: "home" });
  const [sel, setSel] = useState(() => Math.min(currentDay(p), 7));

  if (view.kind === "day") {
    const day = DAYS[view.n - 1];
    return (
      <DayRun key={day.n} day={day} p={p} update={update}
        onExit={(finished) => {
          if (finished && day.n === 7) { setView({ kind: "final" }); return; }
          if (finished) setSel(Math.min(day.n + 1, 7));
          setView({ kind: "home" });
        }} />
    );
  }
  if (view.kind === "final") return <Final p={p} update={update} onBack={() => setView({ kind: "home" })} />;

  const cur = currentDay(p);
  const allDone = cur > 7;
  const day = DAYS[sel - 1];
  const st = knotState(p, sel);

  return (
    <div className="pg-screen">
      <div className="pg-top">
        <button className="btn small ghost" onClick={onBack}>← Zurück</button>
        <span className="label muted">Drills: <span className="num">{drillsDone(p)}</span>/7</span>
      </div>
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <span className="label pg-kicker">Neu hier?</span>
        <h2 className="display pg-title">7-Tage-Start</h2>
        <p className="muted pg-promise">
          Kein Profi nach 7 Tagen – aber du gehst <b>sicher und mit Plan</b> in dein erstes Training. Pro Tag etwa 15 Minuten.
        </p>
      </motion.header>

      <Belt p={p} sel={sel} onSelect={setSel} />

      <AnimatePresence mode="wait">
        <motion.section key={sel} className={`pg-day-card ${st}`}
          initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}>
          <div className="pg-day-head">
            <span className="label">Tag {day.n}{st === "done" ? " · geschafft ✓" : st === "locked" ? " · gesperrt" : " · heute"}</span>
            <h3 className="display">{day.title}</h3>
          </div>
          <p className="pg-goal">{day.goal}</p>
          <p className="pg-whyday small"><b>Warum heute das?</b> {day.why}</p>
          <ol className="pg-parts">
            {day.n === 7 ? (
              <>
                <li><span className="num">1</span> Prüfung: 12 gemischte Fragen</li>
                <li><span className="num">2</span> Boss-Match (freiwillig)</li>
                <li><span className="num">3</span> Matten-Drill: {day.drill.title}</li>
                <li><span className="num">4</span> Bereit fürs erste Training</li>
              </>
            ) : PART_LABEL.map((lab, i) => (
              <li key={lab}>
                <span className="num">{i + 1}</span> {lab}
                <span className="muted small">
                  {i === 0 ? (day.warmup.length ? ` · ${day.warmup.length} Fragen zu früheren Tagen` : " · heute noch nicht")
                    : i === 1 ? ` · ${day.lessons.map(lessonTitle).join(" + ")}`
                    : i === 2 ? ` · ${day.puzzle.length} Situationen`
                    : ` · ${day.drill.title}`}
                </span>
              </li>
            ))}
          </ol>
          {st === "now" && sameDayHint(p, sel) && (
            <p className="pg-hint small">Du hast heute schon einen Tag geschafft. Gern weiter – aber <b>morgen behältst du mehr</b>.</p>
          )}
          {st === "locked" && <p className="muted small">Erst Tag {sel - 1} schaffen. Kein Zeitdruck – Pausen sind okay.</p>}
          {st !== "locked" && (
            <button className={`btn big ${st === "now" ? "primary" : ""}`} onClick={() => { sfx.select(); setView({ kind: "day", n: sel }); }}>
              {st === "now" ? (sel === 1 ? "Tag 1 starten" : `Tag ${sel} starten`) : "Nochmal machen"}
            </button>
          )}
          {st === "done" && p.drills[sel] === "later" && (
            <button className="btn small" onClick={() => update((x) => ({ ...x, drills: { ...x.drills, [sel]: "done" } }))}>
              Drill nachgeholt ✓
            </button>
          )}
        </motion.section>
      </AnimatePresence>

      {allDone && (
        <button className="btn big" onClick={() => setView({ kind: "final" })}>Deine Checkliste fürs erste Training</button>
      )}
      <Badges p={p} />
      <p className="muted small center">Verpasst du einen Tag, ist das eine Pause – du verlierst nichts.</p>
    </div>
  );
}

/* ---------- Gürtel mit 7 Knoten ---------- */

function Belt({ p, sel, onSelect }: { p: ProgramProgress; sel: number; onSelect: (n: number) => void }) {
  const doneN = p.done.length;
  return (
    <div className="pg-belt" role="group" aria-label={`Gürtel: ${doneN} von 7 Knoten`}>
      <div className="pg-belt-band" aria-hidden="true">
        <motion.i initial={{ width: 0 }} animate={{ width: `${(Math.min(doneN, 6) / 6) * 100}%` }} transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }} />
      </div>
      {DAYS.map((d, i) => {
        const st = knotState(p, d.n);
        return (
          <motion.button key={d.n} type="button" className={`pg-knot ${st} ${sel === d.n ? "sel" : ""}`}
            aria-label={`Tag ${d.n}: ${d.title} (${st === "done" ? "geschafft" : st === "now" ? "heute" : "gesperrt"})`}
            aria-pressed={sel === d.n}
            onClick={() => onSelect(d.n)}
            initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.08 + i * 0.05, type: "spring", stiffness: 420, damping: 18 }}>
            {st === "now" && <motion.span className="pg-knot-glow" animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }} transition={{ duration: 1.8, repeat: Infinity }} />}
            <span className="pg-knot-in num">{st === "done" ? "✓" : st === "locked" ? <LockSvg /> : d.n}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

function LockSvg() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </svg>
  );
}

function Badges({ p }: { p: ProgramProgress }) {
  if (!p.exam) return null;
  return (
    <div className="pg-badges">
      <div className={`pg-badge ${p.exam.passed ? "on" : ""}`}>
        <span className="pg-badge-ico">{p.exam.passed ? "✓" : "…"}</span>
        <div><b>Wissen geprüft{p.exam.passed ? " ✓" : ""}</b><span className="small muted">{p.exam.passed ? "In der App bestanden." : "Noch nicht in allen Bereichen."}</span></div>
      </div>
      <div className="pg-badge mat">
        <span className="pg-badge-ico">◎</span>
        <div><b>Können: auf der Matte – mit deinem Trainer</b><span className="small muted">Das prüft keine App.</span></div>
      </div>
    </div>
  );
}

/* ============================================================
   Ein Tag: Aufwärmen → Lektion → Rätsel → Drill
   ============================================================ */

type Step = "warmup" | "lesson" | "puzzle" | "drill" | "exam" | "examResult" | "boss" | "done";

function DayRun({ day, p, update, onExit }: {
  day: ProgramDay; p: ProgramProgress;
  update: (fn: (p: ProgramProgress) => ProgramProgress) => void;
  onExit: (finished: boolean) => void;
}) {
  const isExam = day.n === 7;
  const steps: Step[] = isExam ? ["exam", "examResult", "boss", "drill", "done"] : [
    ...(day.warmup.length ? (["warmup"] as Step[]) : []), "lesson", "puzzle", "drill", "done",
  ];
  const [si, setSi] = useState(0);
  const step = steps[si];
  const go = () => setSi((i) => Math.min(i + 1, steps.length - 1));
  const [lessonIdx, setLessonIdx] = useState(0);
  const [inArena, setInArena] = useState(false);
  const [lost, setLost] = useState(false);
  const [examRes, setExamRes] = useState<QuizResult[] | null>(null);
  const [examSeed, setExamSeed] = useState(() => Date.now() % 100000);
  const [boss, setBoss] = useState(false);
  const exam = useMemo(() => (isExam ? buildExam(examSeed) : []), [isExam, examSeed]);

  // Kern-2-Lektion als Vollbild
  const lref = day.lessons[lessonIdx];
  if (step === "lesson" && inArena && lref?.kind === "k2") {
    const t = lessonById(lref.id);
    if (t) {
      return (
        <ArenaK2 key={t.id + lessonIdx} mode="tutorial" tutorial={t} aiLevel={t.aiLevel}
          onExit={(won) => {
            setInArena(false);
            if (won === null) return;
            if (won) { setLost(false); nextLesson(); } else setLost(true);
          }} />
      );
    }
  }
  if (step === "boss" && boss) {
    return (
      <ArenaK2 mode="free" aiLevel={2} seed={examSeed} onExit={(won) => {
        setBoss(false);
        update((x) => ({ ...x, boss: won ? "won" : won === false ? (x.boss === "won" ? "won" : "lost") : x.boss }));
        if (won !== null) go();
      }} />
    );
  }

  function nextLesson() {
    if (lessonIdx + 1 < day.lessons.length) setLessonIdx(lessonIdx + 1);
    else go();
  }

  const visibleParts = isExam ? ["Prüfung", "Boss", "Drill"] : PART_LABEL.filter((l) => l !== "Aufwärmen" || day.warmup.length);
  const partIndex = isExam
    ? (step === "exam" || step === "examResult" ? 0 : step === "boss" ? 1 : 2)
    : ({ warmup: 0, lesson: 1, puzzle: 2, drill: 3 } as Record<string, number>)[step] - (day.warmup.length ? 0 : 1);

  return (
    <div className="pg-screen pg-run">
      <div className="pg-top">
        <button className="btn small ghost" onClick={() => onExit(false)} aria-label="Tag verlassen">✕</button>
        <span className="label">Tag {day.n} · {day.title}</span>
      </div>
      {step !== "done" && (
        <ol className="pg-steps" aria-label="Ablauf">
          {visibleParts.map((lab, i) => (
            <li key={lab} className={i < partIndex ? "done" : i === partIndex ? "now" : ""}>
              <motion.i layout />
              <span className="label">{lab}</span>
            </li>
          ))}
        </ol>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={step + lessonIdx + (examSeed % 7)} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.22 }}>
          {step === "warmup" && (
            <>
              <p className="pg-lead">Aufwärmen: Erinnerst du dich? Abrufen hilft mehr als Nachlesen.</p>
              <Quiz ids={day.warmup} kicker="Aufwärmen" onDone={go} />
            </>
          )}

          {step === "lesson" && lref?.kind === "map" && <PositionMap onDone={go} />}

          {step === "lesson" && lref?.kind === "k2" && (
            <LessonIntro t={lessonById(lref.id)} idx={lessonIdx} count={day.lessons.length} lost={lost}
              onStart={() => { sfx.select(); setInArena(true); }}
              onSkip={() => { setLost(false); nextLesson(); }} />
          )}

          {step === "puzzle" && (
            <>
              <p className="pg-lead">Rätsel: Welche Antwort passt in dieser Lage?</p>
              <Quiz ids={day.puzzle} kicker="Rätsel" onDone={go} />
            </>
          )}

          {step === "exam" && (
            <>
              <p className="pg-lead">12 gemischte Fragen aus allen Tagen. Falsche kommen sofort noch einmal – ohne Strafe.</p>
              <Quiz key={examSeed} questions={exam} kicker="Prüfung" onDone={(r) => {
                setExamRes(r);
                const sc = scoreExam(r);
                update((x) => ({ ...x, exam: { ...sc, passed: sc.passed || !!x.exam?.passed, at: new Date().toISOString() } }));
                go();
              }} />
            </>
          )}

          {step === "examResult" && examRes && (
            <ExamResult res={examRes}
              onRetry={() => { setExamSeed((s) => s + 1); setExamRes(null); setSi(0); }}
              onNext={go} />
          )}

          {step === "boss" && (
            <div className="pg-panel center">
              <span className="label">Freiwillig</span>
              <h3 className="display pg-h">Boss-Match</h3>
              <p>Ein freies Match auf der Körperkarte, Stufe „Normal“. Alles, was du gelernt hast, auf einmal.</p>
              <button className="btn primary big" onClick={() => { sfx.select(); setBoss(true); }}>Boss-Match starten</button>
              <button className="btn ghost" onClick={() => { update((x) => ({ ...x, boss: x.boss ?? "skipped" })); go(); }}>Überspringen</button>
            </div>
          )}

          {step === "drill" && (
            <DrillCard day={day} onChoose={(d) => {
              update((x) => completeDay(x, day.n, d));
              if (d === "done") sfx.win(); else sfx.select();
              go();
            }} />
          )}

          {step === "done" && <DayDone day={day} p={p} onNext={() => onExit(true)} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function LessonIntro({ t, idx, count, lost, onStart, onSkip }: {
  t?: TutorialK2Def; idx: number; count: number; lost: boolean; onStart: () => void; onSkip: () => void;
}) {
  if (!t) return <div className="pg-panel"><p>Lektion fehlt.</p><button className="btn" onClick={onSkip}>Weiter</button></div>;
  return (
    <div className="pg-panel">
      <span className="label">Lektion{count > 1 ? ` ${idx + 1} von ${count}` : ""} · Körperkarte</span>
      <h3 className="display pg-h">{t.title}</h3>
      <p className="pg-idea">{t.idea}</p>
      <ul className="pg-howto small">
        <li>Du spielst <b style={{ color: "var(--gi-p)" }}>blau</b>. Ihr wählt gleichzeitig eine Karte.</li>
        <li>Der Coach zeigt dir die ersten Züge. Danach spielst du allein.</li>
        <li>Vier Zonen: Kopf, Arme, Hüfte, Beine. Wer Zonen gewinnt, kommt weiter.</li>
      </ul>
      {lost && <p className="pg-hint small">Diesmal nicht geschafft – kein Problem. Nochmal, oder trotzdem weiter.</p>}
      <button className="btn primary big" onClick={onStart}>{lost ? "Nochmal versuchen" : "Lektion starten"}</button>
      {lost && <button className="btn ghost" onClick={onSkip}>Trotzdem weiter</button>}
    </div>
  );
}

function DrillCard({ day, onChoose }: { day: ProgramDay; onChoose: (d: "done" | "later") => void }) {
  return (
    <div className="pg-panel pg-drill">
      <span className="label">Matten-Drill · ca. 2–4 Minuten</span>
      <h3 className="display pg-h">{day.drill.title}</h3>
      <ol className="pg-drill-steps">
        {day.drill.steps.map((s, i) => (
          <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>{s}</motion.li>
        ))}
      </ol>
      <p className="pg-safety small"><b>Sicherheit:</b> {day.drill.safety}</p>
      <div className="pg-row">
        <button className="btn primary big" onClick={() => onChoose("done")}>Gemacht</button>
        <button className="btn big" onClick={() => onChoose("later")}>Später</button>
      </div>
      <p className="muted small">„Später“ ist okay. Der Tag zählt trotzdem.</p>
    </div>
  );
}

function DayDone({ day, p, onNext }: { day: ProgramDay; p: ProgramProgress; onNext: () => void }) {
  const [boom] = useState(1);
  const next = DAYS[day.n];
  return (
    <div className="pg-panel center pg-rel pg-done">
      <Confetti run={boom} count={90} />
      <Stamp text={`TAG ${day.n} ✓`} tone="good" sub="Knoten geknüpft" hold={900} />
      <motion.div className="pg-bigknot" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.2 }}>✓</motion.div>
      <h3 className="display pg-h">Tag {day.n} geschafft</h3>
      <p className="muted">{p.done.length} von 7 Knoten am Gürtel.</p>
      {next && <p className="small">Als Nächstes: <b>Tag {next.n} – {next.title}</b>. Am besten morgen – dann behältst du mehr.</p>}
      <button className="btn primary big" onClick={onNext}>{day.n === 7 ? "Zur Checkliste" : "Zum Gürtel"}</button>
    </div>
  );
}

function ExamResult({ res, onRetry, onNext }: { res: QuizResult[]; onRetry: () => void; onNext: () => void }) {
  const sc = scoreExam(res);
  return (
    <div className="pg-panel pg-rel">
      {sc.passed && <Confetti run={1} />}
      {sc.passed && <Stamp text="WISSEN GEPRÜFT" tone="good" hold={900} />}
      <span className="label">Ergebnis · erster Versuch je Frage</span>
      <h3 className="display pg-h">{sc.passed ? "Wissen geprüft ✓" : "Fast geschafft"}</h3>
      <ul className="pg-areas">
        {AREAS.map((a, i) => {
          const [ok, tot] = sc.areas[a];
          const pass = tot > 0 && ok / tot >= 0.8;
          return (
            <motion.li key={a} className={pass ? "ok" : "no"} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.1 }}>
              <span>{AREA_LABEL[a]}</span>
              <span className="num">{ok}/{tot} {pass ? "✓" : ""}</span>
              <i style={{ ["--w" as string]: `${tot ? (ok / tot) * 100 : 0}%` }} />
            </motion.li>
          );
        })}
      </ul>
      <p className="small muted">Bestanden heißt: in jedem Bereich mindestens 80 %. Die Grenze ist ein Richtwert.</p>
      {!sc.passed && <p className="small">Kein Problem – die Fragen kommen neu gemischt. Wiederholen kostet nichts.</p>}
      <div className="pg-row">
        {!sc.passed && <button className="btn primary big" onClick={onRetry}>Nochmal prüfen</button>}
        <button className={`btn big ${sc.passed ? "primary" : ""}`} onClick={onNext}>Weiter</button>
      </div>
    </div>
  );
}

/* ============================================================
   Abschluss: Bereit fürs erste Training
   ============================================================ */

function Final({ p, update, onBack }: { p: ProgramProgress; update: (fn: (p: ProgramProgress) => ProgramProgress) => void; onBack: () => void }) {
  const ticked = new Set(p.checklist);
  const all = READY_CHECKLIST.every((c) => ticked.has(c.id));
  return (
    <div className="pg-screen pg-final pg-rel">
      <Confetti run={1} count={120} />
      <div className="pg-top"><button className="btn small ghost" onClick={onBack}>← Gürtel</button></div>
      <motion.div className="pg-final-hero" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}>
        <span className="label">7 von 7 Knoten</span>
        <h2 className="display pg-title">Bereit fürs erste Training</h2>
        <p className="muted">Du kennst die Landkarte, die Befreiungen und die Regeln. Jetzt kommt die Matte.</p>
      </motion.div>

      <div className="pg-badges">
        <motion.div className={`pg-badge ${p.exam?.passed ? "on" : ""}`} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <span className="pg-badge-ico">{p.exam?.passed ? "✓" : "…"}</span>
          <div><b>Wissen geprüft {p.exam?.passed ? "✓" : ""}</b><span className="small muted">{p.exam?.passed ? "In der App bestanden." : "Prüfung an Tag 7 wiederholen, wenn du magst."}</span></div>
        </motion.div>
        <motion.div className="pg-badge mat" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45 }}>
          <span className="pg-badge-ico">◎</span>
          <div><b>Können: auf der Matte – mit deinem Trainer</b><span className="small muted">Videos und Apps machen dich sicherer im Kopf, nicht im Körper.</span></div>
        </motion.div>
      </div>

      <section className="pg-panel">
        <h3 className="display pg-h">Checkliste</h3>
        <ul className="pg-check">
          {READY_CHECKLIST.map((c) => {
            const on = ticked.has(c.id);
            return (
              <li key={c.id}>
                <button type="button" className={on ? "on" : ""} aria-pressed={on}
                  onClick={() => { sfx.select(); update((x) => ({ ...x, checklist: on ? x.checklist.filter((i) => i !== c.id) : [...x.checklist, c.id] })); }}>
                  <span className="pg-box">{on ? "✓" : ""}</span>
                  <span>{c.text}{c.check && <span className="pg-check-flag small"> (Trainer fragen)</span>}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {all && <p className="pg-hint small">Alles abgehakt. Viel Spaß bei deinem ersten Training!</p>}
      </section>

      <section className="pg-panel">
        <h3 className="display pg-h">Nicht allein üben</h3>
        <ul className="pg-notalone small">{NOT_ALONE.map((t) => <li key={t}>{t}</li>)}</ul>
        <p className="muted small">Das gehört in die Halle – mit Matte und Trainer.</p>
      </section>
    </div>
  );
}
