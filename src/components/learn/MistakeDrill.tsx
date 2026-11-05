import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CARD } from "../../data/cards";
import { IconBulb, IconCheck, IconCross } from "./icons";
import { MiniCard } from "./MiniCard";
import { plainName } from "./kinds";

export interface MistakeDrillQuestion {
  q: string;
  /** Karten-Ids (meist 3). */
  options: string[];
  answer: string;
  why: string;
}

export interface MistakeDrillProps {
  question: MistakeDrillQuestion;
  /** Nach dem Feedback: ob beim ersten Versuch richtig. */
  onDone: (correct: boolean) => void;
}

/** Fehler-Deck-Frage: Situation lesen, richtige Karte antippen, Begründung sehen. */
export function MistakeDrill({ question, onDone }: MistakeDrillProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const answered = picked !== null;
  const correct = picked === question.answer;
  const ans = CARD[question.answer];

  return (
    <section className="lr-drill" aria-label="Fehler-Deck">
      <span className="label lr-drill-k">Fehler-Deck</span>
      <p className="lr-drill-q">{question.q}</p>

      <div className="lr-drill-opts">
        {question.options.map((id, i) => {
          const isAns = id === question.answer;
          const isPick = id === picked;
          const state = !answered ? "" : isAns ? "right" : isPick ? "wrong" : "off";
          return (
            <motion.div
              key={id}
              className={`lr-drill-opt ${state}`}
              initial={{ opacity: 0, y: 20 }}
              animate={state === "wrong" ? { opacity: 1, y: 0, x: [0, -8, 8, -5, 5, 0] } : { opacity: 1, y: 0, scale: state === "right" ? 1.06 : 1 }}
              transition={state === "wrong" ? { duration: 0.4 } : { delay: answered ? 0 : i * 0.08, type: "spring", stiffness: 380, damping: 22 }}
            >
              <MiniCard id={id} onClick={answered ? undefined : () => setPicked(id)} glow={state === "right"} dim={state === "off"} />
              {state === "right" && (
                <span className="lr-drill-mark ok">
                  <IconCheck size={16} />
                </span>
              )}
              {state === "wrong" && (
                <span className="lr-drill-mark bad">
                  <IconCross size={16} />
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {answered && (
          <motion.div
            className={`lr-drill-fb ${correct ? "ok" : "miss"}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 28, delay: 0.15 }}
            role="status"
          >
            <p className="lr-drill-verdict display">{correct ? "Richtig!" : `Besser: ${ans ? plainName(ans) : question.answer}`}</p>
            <p className="lr-drill-why">
              <IconBulb size={18} />
              <span>{question.why}</span>
            </p>
            <button type="button" className="btn primary" onClick={() => onDone(correct)}>
              Weiter
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
