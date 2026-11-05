import { useEffect, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type StampTone = "good" | "bad" | "neutral";
export interface StampProps {
  /** z. B. "KONTER!", "TAKEDOWN!", "GEKONTERT", "TAP!" */
  text: string;
  tone?: StampTone;
  /** Optionale Unterzeile in normaler Schrift, z. B. "Sprawl schlägt Double Leg". */
  sub?: string;
  /** Haltezeit in ms (Standard 700). */
  hold?: number;
  onDone?: () => void;
}

/**
 * Großer, schräger Stempel, der auf die Bühne knallt: scale 2.2 → 1 mit Overshoot,
 * kurzer Hitstop-Freeze (~120 ms) nach dem Aufprall, hält 700 ms, blendet aus.
 * Füllt den (relativ positionierten) Container und zentriert sich.
 */
export function Stamp({ text, tone = "neutral", sub, hold = 700, onDone }: StampProps) {
  const reduced = !!useReducedMotion();
  const rot = useMemo(() => (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 4), []);
  // Phasen (s): slam 0.18 → freeze 0.12 → hold → fade 0.22
  const slam = 0.18, freeze = 0.12, fade = 0.22, h = hold / 1000;
  const total = slam + freeze + h + fade;
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), total * 1000 + 30);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const t1 = slam / total, t2 = (slam + freeze) / total, t3 = (slam + freeze + h) / total;
  return (
    <div className={`fx fx-stamp-wrap fx-tone-${tone}`} aria-live="polite">
      {!reduced && (
        <motion.span className="fx-stamp-shock" initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: [0.4, 0.4, 1.6], opacity: [0, 0.7, 0] }}
          transition={{ duration: slam + 0.3, times: [0, slam / (slam + 0.3), 1], ease: "easeOut" }} />
      )}
      <motion.div className="fx-stamp"
        initial={reduced ? { opacity: 0, rotate: rot } : { scale: 2.2, opacity: 0, rotate: rot * 2.2 }}
        animate={reduced
          ? { opacity: [0, 1, 1, 0], rotate: rot }
          : {
            scale: [2.2, 0.92, 1.04, 1, 1],
            opacity: [0, 1, 1, 1, 0],
            rotate: [rot * 2.2, rot, rot, rot, rot],
          }}
        transition={reduced
          ? { duration: total, times: [0, 0.1, t3, 1] }
          : { duration: total, times: [0, t1, t2, t3, 1], ease: ["easeIn", "easeOut", "easeOut", "easeIn"] }}>
        <span className="fx-stamp-word display">{text}</span>
        {sub && <span className="fx-stamp-sub">{sub}</span>}
      </motion.div>
    </div>
  );
}
