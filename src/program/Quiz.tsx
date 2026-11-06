import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { mulberry32, shuffle } from "../engine/rng";
import { FightersK2 } from "../core2/ui/FightersK2";
import { sfx } from "../sound";
import { Q_BY_ID, TOPIC_LABEL, isSafetyQuestion, type Question } from "./questions";
import { emitQuizAnswer, newQuizSession } from "../journey/events";
import { FreeRecall } from "./FreeRecall";

export interface QuizResult { id: string; ok: boolean }

interface Item { q: Question; retry: boolean; key: number }

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Multiple-Choice mit sofortigem Warum-Feedback.
 * Falsche Antworten kommen am Ende sofort noch einmal (ohne Strafe). Ergebnis = erster Versuch je Frage.
 */
export function Quiz({ ids, questions, kicker, onDone, timed }: {
  ids?: string[];
  questions?: Question[];
  kicker: string;
  onDone: (first: QuizResult[]) => void;
  /** Zeitdruck: Sekunden pro Frage (z. B. 8). Zu spät = wie falsch: Frage kommt noch einmal, sonst keine Strafe. */
  timed?: number;
}) {
  const initial = useMemo<Item[]>(
    () => (questions ?? (ids ?? []).map((id) => Q_BY_ID[id]).filter(Boolean)).map((q, i) => ({ q, retry: false, key: i })),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [queue, setQueue] = useState<Item[]>(initial);
  const [first, setFirst] = useState<QuizResult[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [shake, setShake] = useState(0);
  const [late, setLate] = useState(false);
  // Ein-Satz-Fragen (kind "erklaeren"): Ergebnis aus Coach- oder Selbstbewertung.
  const [exOk, setExOk] = useState<boolean | null>(null);
  // Eine Runde = ein Quiz-Durchgang. Erste Antworten gehen an Wiederholung und Fehlerdeck (src/journey).
  const [session] = useState(newQuizSession);
  // Wiederholungsrunde: eigener Zähler „Wiederholung k/n“ statt stehendem „5/5“.
  const [retryDone, setRetryDone] = useState(0);
  const total = initial.length;
  const item = queue[0];
  const isExplain = item?.q.kind === "erklaeren";
  const isAnswered = picked !== null || late || exOk !== null;

  // Zeitdruck: nach `timed` Sekunden ohne Antwort → „Zu spät“.
  useEffect(() => {
    if (!timed || !item || isAnswered || isExplain) return; // Schreiben braucht Zeit: kein Zeitdruck
    const t = setTimeout(() => {
      setLate(true);
      sfx.lose();
      if (!item.retry) { setFirst((f) => [...f, { id: item.q.id, ok: false }]); emitQuizAnswer({ id: item.q.id, ok: false, session }); }
    }, timed * 1000);
    return () => clearTimeout(t);
  }, [item?.key, timed, isAnswered]); // eslint-disable-line react-hooks/exhaustive-deps

  const order = useMemo(() => {
    if (!item) return [];
    const idx = item.q.options.map((_, i) => i);
    return shuffle(idx, mulberry32(hash(item.q.id) + (item.retry ? 17 : 0)));
  }, [item?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) return null;
  const q = item.q;
  const answered = isAnswered;
  const ok = isExplain ? exOk === true : !late && picked === q.answer;
  const doneCount = first.length;
  const retryTotal = retryDone + queue.filter((x) => x.retry).length;
  const safety = isSafetyQuestion(q);

  function pick(i: number) {
    if (answered) return;
    setPicked(i);
    const right = i === q.answer;
    if (right) sfx.points(); else { sfx.lose(); setShake((n) => n + 1); }
    if (!item.retry) { setFirst((f) => [...f, { id: q.id, ok: right }]); emitQuizAnswer({ id: q.id, ok: right, session }); }
  }

  function next() {
    const rest = queue.slice(1);
    const nq = ok ? rest : [...rest, { q, retry: true, key: item.key + 1000 }];
    if (item.retry) setRetryDone((n) => n + 1);
    setPicked(null);
    setLate(false);
    setExOk(null);
    if (nq.length === 0) { onDone(first); return; }
    setQueue(nq);
  }

  return (
    <div className="pg-quiz">
      <div className="pg-quiz-head">
        <span className="label">{kicker}</span>
        <span className="label num">{item.retry
          ? `Wiederholung ${Math.min(retryDone + 1, retryTotal)}/${retryTotal}`
          : `${Math.min(doneCount + (answered ? 0 : 1), total)}/${total}`}</span>
      </div>
      <div className="pg-quiz-bar" aria-hidden="true"><i style={{ width: `${(doneCount / Math.max(1, total)) * 100}%` }} /></div>
      <AnimatePresence mode="wait">
        <motion.div key={item.key} className="pg-qcard"
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}>
          {item.retry && <span className="pg-retry label">Noch einmal – ohne Strafe</span>}
          <span className="pg-topic label">{TOPIC_LABEL[q.topic]}</span>
          {q.kind === "image" && q.image && (
            <div className="pg-qscene pg-qimage" aria-hidden="true">
              <FightersK2 pos={q.image.pos} top={q.image.top} part={q.image.mark ?? null} />
              <span className="pg-you small">Du bist <b style={{ color: "var(--gi-p)" }}>blau</b>{q.image.mark ? <> · <b style={{ color: "var(--points)" }}>gelb</b> = schau hier</> : null}</span>
            </div>
          )}
          {timed && !answered && !isExplain && (
            <div className="pg-timer" role="timer" aria-label={`${timed} Sekunden`}>
              <motion.i key={item.key} initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: timed, ease: "linear" }} />
            </div>
          )}
          {q.kind !== "image" && q.scene && (
            <div className="pg-qscene" aria-hidden="true">
              <FightersK2 pos={q.scene.pos} top={q.scene.top} />
              <span className="pg-you small">Du bist <b style={{ color: "var(--gi-p)" }}>blau</b></span>
            </div>
          )}
          <h3 className="pg-q">{q.q}</h3>
          {isExplain && (
            <FreeRecall key={item.key} q={q} onNext={next} onResult={(right) => {
              if (exOk !== null) return;
              setExOk(right);
              if (right) sfx.points(); else sfx.lose();
              if (!item.retry) { setFirst((f) => [...f, { id: q.id, ok: right }]); emitQuizAnswer({ id: q.id, ok: right, session }); }
            }} />
          )}
          {!isExplain && <motion.div className="pg-opts" key={shake} animate={shake && !ok && answered ? { x: [0, -8, 8, -5, 5, 0] } : undefined} transition={{ duration: 0.35 }}>
            {order.map((i) => {
              const cls = !answered ? "" : i === q.answer ? "right" : i === picked ? "wrong" : "dim";
              return (
                <motion.button key={i} type="button" className={`pg-opt ${cls}`} onClick={() => pick(i)} disabled={answered}
                  whileTap={answered ? undefined : { scale: 0.97 }}>
                  <span>{q.options[i]}</span>
                  {answered && i === q.answer && <span className="pg-opt-mark" aria-label="richtig">✓</span>}
                  {answered && i === picked && i !== q.answer && <span className="pg-opt-mark" aria-label="falsch">✗</span>}
                </motion.button>
              );
            })}
          </motion.div>}
          <AnimatePresence>
            {answered && !isExplain && (
              <motion.div className={`pg-why ${ok ? "ok" : safety ? "no safety" : "no"}`} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
                <strong className="display">{ok ? "Richtig!" : safety ? "Achtung – Sicherheitsregel:" : late ? "Zu spät – so ist es:" : "Fast – so ist es:"}</strong>
                <p>{q.why}</p>
                {!ok && <p className="muted small">Die Frage kommt gleich noch einmal.</p>}
                <button type="button" className="btn primary big pg-next" onClick={next}>Weiter</button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
