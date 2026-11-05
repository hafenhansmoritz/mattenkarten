import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { at, type Coord } from "./util";

export interface FloatTextProps {
  text: string;
  /** Standard: var(--points). */
  color?: string;
  x: Coord;
  y: Coord;
  /** Verzögerung in ms (für gestaffelte "+2" / "+1 Griff"). */
  delay?: number;
  onDone?: () => void;
}

/** Schwebender Zahlen-/Text-Popup ("+2", "+1 Griff"): Pop-Scale, steigt 40 px, verblasst (~900 ms). */
export function FloatText({ text, color = "var(--points, #ffd166)", x, y, delay = 0, onDone }: FloatTextProps) {
  const reduced = !!useReducedMotion();
  const total = 900;
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), total + delay + 30);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="fx fx-float" style={{ ...at(x, y), ["--fx-c" as string]: color }} aria-hidden>
      <motion.span className="fx-float-t display"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 0, scale: 0.4 }}
        animate={reduced
          ? { opacity: [0, 1, 1, 0] }
          : { opacity: [0, 1, 1, 0], y: [0, -10, -30, -40], scale: [0.4, 1.25, 1, 0.95] }}
        transition={{ duration: total / 1000, delay: delay / 1000, times: [0, 0.18, 0.7, 1], ease: "easeOut" }}>
        {text}
      </motion.span>
    </div>
  );
}
