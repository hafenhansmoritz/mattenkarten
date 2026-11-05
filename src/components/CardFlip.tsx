import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { CardDef } from "../engine/types";
import { Card, CardBack, type CardSize } from "./Card";

export interface CardFlipProps {
  card: CardDef;
  revealed: boolean;
  size?: CardSize;
  art?: ReactNode;
  /** Verzögerung in Sekunden (für versetztes Aufdecken). */
  delay?: number;
}

/**
 * Rückseite → Vorderseite mit 3D-Y-Rotation (350 ms, ease-out mit leichtem Overshoot).
 * Unter prefers-reduced-motion: harter Wechsel per kurzem Crossfade.
 */
export function CardFlip({ card, revealed, size = "hand", art, delay = 0 }: CardFlipProps) {
  const reduce = useReducedMotion() ?? false;

  if (reduce) {
    return (
      <div className={`mk-flip mk-size-${size}`}>
        <motion.div
          key={revealed ? "front" : "back"}
          className="mk-flip-inner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.12, delay }}
        >
          {revealed ? <Card card={card} size={size} art={art} /> : <Card card={card} size={size} faceDown />}
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`mk-flip mk-size-${size}`}>
      <motion.div
        className="mk-flip-inner"
        initial={false}
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.35, delay, ease: [0.34, 1.4, 0.64, 1] }}
      >
        <div className="mk-flip-side mk-flip-back">
          <div className={`mk-card mk-size-${size} mk-facedown`} aria-hidden={revealed}>
            <div className="mk-tilt">
              <div className="mk-edge">
                <CardBack />
              </div>
            </div>
          </div>
        </div>
        <div className="mk-flip-side mk-flip-front" aria-hidden={!revealed}>
          <Card card={card} size={size} art={art} />
        </div>
      </motion.div>
    </div>
  );
}
