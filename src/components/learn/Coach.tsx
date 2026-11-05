import { AnimatePresence, motion } from "framer-motion";
import type { Hint } from "../../engine/types";
import { CoachAvatar } from "./icons";

export interface CoachButtonProps {
  /** Bisher genutzte Stufe dieser Runde: 0 = noch kein Tipp, 3 = alles verraten. */
  level: 0 | 1 | 2 | 3;
  /** Wird mit der nächsten Stufe (1..3) aufgerufen. */
  onAsk: (next: 1 | 2 | 3) => void;
  /** Aktueller Tipp – wird als Blase direkt am Button gezeigt (optional). */
  hint?: Hint | null;
  disabled?: boolean;
}

const ASK_LABEL = ["Coach fragen", "Mehr Hilfe", "Was soll ich spielen?", "Alles gesagt"] as const;

/** Coach-Button mit 3 Stufen (Hinweis → Karte markieren → Empfehlung mit Grund). */
export function CoachButton({ level, onAsk, hint, disabled = false }: CoachButtonProps) {
  const left = 3 - level;
  const done = level >= 3;
  return (
    <div className="lr-coach">
      <motion.button
        type="button"
        className="lr-coach-btn"
        onClick={() => !done && onAsk((level + 1) as 1 | 2 | 3)}
        disabled={disabled || done}
        whileTap={{ scale: 0.95 }}
        aria-label={`${ASK_LABEL[level]}. Noch ${left} von 3 Tipps.`}
      >
        <CoachAvatar size={30} />
        <span className="lr-coach-txt">
          <span className="lr-coach-k">Coach</span>
          <span className="lr-coach-ask">{ASK_LABEL[level]}</span>
        </span>
        <span className="lr-coach-dots" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <motion.i key={i} className={i < left ? "on" : undefined} animate={{ scale: i < left ? 1 : 0.7 }} transition={{ type: "spring", stiffness: 500, damping: 18 }} />
          ))}
        </span>
      </motion.button>
      <AnimatePresence mode="wait">{hint && <HintBubble key={`${hint.level}-${hint.text}`} hint={hint} />}</AnimatePresence>
    </div>
  );
}

const LEVEL_LABEL: Record<Hint["level"], string> = { 1: "Tipp", 2: "Schau hier", 3: "Empfehlung" };

/** Sprechblase mit Coach-Kopf. Stufe 3 trägt das Label "Empfehlung". */
export function HintBubble({ hint }: { hint: Hint }) {
  return (
    <motion.div
      className={`lr-hint lv${hint.level}`}
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
    >
      <CoachAvatar size={40} />
      <div className="lr-hint-bubble">
        <span className="label lr-hint-label">{LEVEL_LABEL[hint.level]}</span>
        <p>{hint.text}</p>
      </div>
    </motion.div>
  );
}
