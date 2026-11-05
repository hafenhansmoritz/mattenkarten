// Fehler-Deck üben: Situationen, in denen der Gegner dich erwischt hat, nochmal lösen (verteilter Abruf).
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useGame } from "../store";
import { mistakeQuestion } from "../engine/learn";
import { MistakeDrill } from "../components/learn";
import type { Mistake } from "../engine/types";

const ROUND = 5;
const XP_PER_SOLVE = 20;

export function MistakeTraining({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion() ?? false;
  // Snapshot der ältesten Fehler beim Start – die Runde bleibt stabil, auch wenn der Store sich ändert.
  const [round] = useState<Mistake[]>(() => useGame.getState().mistakes.slice(0, ROUND));
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState(0);
  const [cheer, setCheer] = useState(0);
  const remaining = useGame((s) => s.mistakes.length);

  const questions = useMemo(() => round.map((m) => mistakeQuestion(m)), [round]);
  const done = idx >= round.length;

  const answer = (correct: boolean) => {
    const m = round[idx];
    const g = useGame.getState();
    if (correct) {
      g.removeMistake(m.id);
      g.addXP(XP_PER_SOLVE);
      setSolved((n) => n + 1);
      setCheer((n) => n + 1);
    } else {
      // Behalten, aber ans Ende schieben – so kommt zuerst Neues dran.
      const rest = g.mistakes.filter((x) => x.id !== m.id);
      const cur = g.mistakes.find((x) => x.id === m.id);
      if (cur) g.set({ mistakes: [...rest, cur] });
    }
    setIdx((i) => i + 1);
  };

  const header = (
    <div className="deck-head">
      <h2 className="display">Dein Fehler-Deck <span className="num">{remaining}</span></h2>
      <button className="btn" onClick={onDone}>Zurück</button>
    </div>
  );
  const intro = <p className="muted small">Situationen, in denen er dich erwischt hat. Wer sie nochmal löst, behält sie.</p>;

  if (round.length === 0) {
    return (
      <div className="screen">
        {header}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: 20, borderRadius: "var(--radius)", border: "1px dashed var(--line-strong)", textAlign: "center", display: "grid", gap: 12 }}>
          <p>Noch keine Fehler gesammelt – kämpfe, dann landet hier, was du üben solltest.</p>
          <button className="btn primary" style={{ justifySelf: "center" }} onClick={onDone}>Okay</button>
        </motion.div>
      </div>
    );
  }

  if (done) {
    const left = round.length - solved;
    const all = left === 0;
    return (
      <div className="screen">
        {header}
        <motion.div role="status" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          style={{ padding: 20, borderRadius: "var(--radius)", background: "var(--surface)", border: `1px solid ${all ? "rgba(95,227,180,.5)" : "var(--line-strong)"}`, display: "grid", gap: 10, textAlign: "center" }}>
          <span className="label">Runde vorbei</span>
          <p className="display" style={{ fontSize: 28, color: all ? "var(--gas)" : "var(--text)" }}>
            {solved} von {round.length} gelöst{left > 0 ? ` – ${left} ${left === 1 ? "bleibt" : "bleiben"} im Deck` : "!"}
          </p>
          {solved > 0 && <p className="num" style={{ color: "var(--points)", fontWeight: 700 }}>+{solved * XP_PER_SOLVE} XP</p>}
          <p className="muted small">
            {all ? "Stark – diese Situationen hast du drauf." : "Die offenen kommen später nochmal. Wiederholen mit Pause wirkt am besten."}
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn primary" onClick={onDone}>Fertig</button>
          </div>
        </motion.div>
      </div>
    );
  }

  const progress = idx / round.length;
  return (
    <div className="screen" style={{ position: "relative" }}>
      {header}
      {intro}
      <div aria-label={`Frage ${idx + 1} von ${round.length}`} style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, height: 8, borderRadius: 99, background: "var(--surface-3, rgba(255,255,255,.08))", overflow: "hidden" }}>
          <motion.div animate={{ width: `${progress * 100}%` }} transition={{ type: "spring", stiffness: 260, damping: 28 }}
            style={{ height: "100%", borderRadius: 99, background: "var(--gas)" }} />
        </div>
        <span className="label num">{idx + 1}/{round.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, x: reduce ? 0 : 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduce ? 0 : -30 }} transition={{ duration: 0.22 }}>
          <MistakeDrill question={questions[idx]} onDone={answer} />
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {cheer > 0 && (
          <motion.div key={cheer} aria-hidden="true"
            initial={{ opacity: 0, y: 10, scale: 0.6 }} animate={{ opacity: [0, 1, 1, 0], y: -40, scale: 1 }} transition={{ duration: 1.1, times: [0, 0.15, 0.7, 1] }}
            onAnimationComplete={() => setCheer(0)}
            style={{ position: "absolute", top: 12, right: 16, pointerEvents: "none", fontWeight: 800, fontSize: 20, color: "var(--points)", textShadow: "0 2px 10px rgba(0,0,0,.4)" }}>
            +{XP_PER_SOLVE} XP
            {!reduce && [0, 1, 2, 3, 4, 5].map((k) => (
              <motion.i key={k} initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{ x: Math.cos((k * Math.PI) / 3) * 34, y: Math.sin((k * Math.PI) / 3) * 34, opacity: 0 }} transition={{ duration: 0.7 }}
                style={{ position: "absolute", left: "50%", top: "50%", width: 6, height: 6, borderRadius: 99, background: "var(--gas)" }} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
