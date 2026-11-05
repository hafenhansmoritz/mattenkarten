import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { mulberry32, shuffle } from "../engine/rng";
import { FightersK2 } from "../core2/ui/FightersK2";
import { sfx } from "../sound";
import { Q_BY_ID, TOPIC_LABEL, type Question } from "./questions";

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
export function Quiz({ ids, questions, kicker, onDone }: {
  ids?: string[];
  questions?: Question[];
  kicker: string;
  onDone: (first: QuizResult[]) => void;
}) {
  const initial = useMemo<Item[]>(
    () => (questions ?? (ids ?? []).map((id) => Q_BY_ID[id]).filter(Boolean)).map((q, i) => ({ q, retry: false, key: i })),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [queue, setQueue] = useState<Item[]>(initial);
  const [first, setFirst] = useState<QuizResult[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [shake, setShake] = useState(0);
  const total = initial.length;
  const item = queue[0];

  const order = useMemo(() => {
    if (!item) return [];
    const idx = item.q.options.map((_, i) => i);
    return shuffle(idx, mulberry32(hash(item.q.id) + (item.retry ? 17 : 0)));
  }, [item?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) return null;
  const q = item.q;
  const answered = picked !== null;
  const ok = picked === q.answer;
  const doneCount = first.length;

  function pick(i: number) {
    if (answered) return;
    setPicked(i);
    const right = i === q.answer;
    if (right) sfx.points(); else { sfx.lose(); setShake((n) => n + 1); }
    if (!item.retry) setFirst((f) => [...f, { id: q.id, ok: right }]);
  }

  function next() {
    const rest = queue.slice(1);
    const nq = ok ? rest : [...rest, { q, retry: true, key: item.key + 1000 }];
    setPicked(null);
    if (nq.length === 0) { onDone(first); return; }
    setQueue(nq);
  }

  return (
    <div className="pg-quiz">
      <div className="pg-quiz-head">
        <span className="label">{kicker}</span>
        <span className="label num">{Math.min(doneCount + (answered || item.retry ? 0 : 1), total)}/{total}</span>
      </div>
      <div className="pg-quiz-bar" aria-hidden="true"><i style={{ width: `${(doneCount / Math.max(1, total)) * 100}%` }} /></div>
      <AnimatePresence mode="wait">
        <motion.div key={item.key} className="pg-qcard"
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}>
          {item.retry && <span className="pg-retry label">Noch einmal – ohne Strafe</span>}
          <span className="pg-topic label">{TOPIC_LABEL[q.topic]}</span>
          {q.scene && (
            <div className="pg-qscene" aria-hidden="true">
              <FightersK2 pos={q.scene.pos} top={q.scene.top} />
              <span className="pg-you small">Du bist <b style={{ color: "var(--gi-p)" }}>blau</b></span>
            </div>
          )}
          <h3 className="pg-q">{q.q}</h3>
          <motion.div className="pg-opts" key={shake} animate={shake && !ok && answered ? { x: [0, -8, 8, -5, 5, 0] } : undefined} transition={{ duration: 0.35 }}>
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
          </motion.div>
          <AnimatePresence>
            {answered && (
              <motion.div className={`pg-why ${ok ? "ok" : "no"}`} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
                <strong className="display">{ok ? "Richtig!" : "Fast – so ist es:"}</strong>
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
