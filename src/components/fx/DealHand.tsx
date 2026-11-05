import { Children, isValidElement, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface DealHandProps {
  children: ReactNode;
  /** Wechselt pro Zug → Karten werden neu ausgeteilt. */
  turnKey: string | number;
  /** Versatz je Karte in ms (Standard 60). */
  stagger?: number;
  /** Fächer-Rotation am Rand (Grad, Standard 4). */
  fan?: number;
  className?: string;
}

/**
 * Teilt Handkarten aus: jede Karte fliegt vom Stapel (unten rechts) ein,
 * 60 ms gestaffelt, mit leichter Fächer-Rotation und Spring.
 * Ersetzt den Hand-Container nicht – jedes Kind wird in ein motion-<div> gewickelt
 * (display: contents-ähnlich: `fx-deal-item` ist `flex: none`).
 */
export function DealHand({ children, turnKey, stagger = 60, fan = 4, className }: DealHandProps) {
  const reduced = !!useReducedMotion();
  const items = Children.toArray(children).filter(isValidElement);
  const n = items.length;
  return (
    <>
      {items.map((child, i) => {
        const mid = (n - 1) / 2;
        const rot = n > 1 ? ((i - mid) / Math.max(1, mid)) * fan : 0;
        const k = `${turnKey}:${child.key ?? i}`;
        return (
          <motion.div key={k} className={className ? `fx-deal-item ${className}` : "fx-deal-item"}
            initial={reduced ? { opacity: 0 } : { x: 260 + (n - i) * 30, y: 180, rotate: 24, opacity: 0, scale: 0.7 }}
            animate={reduced ? { opacity: 1 } : { x: 0, y: 0, rotate: [24, rot, 0], opacity: 1, scale: 1 }}
            transition={reduced
              ? { duration: 0.2, delay: (i * stagger) / 2000 }
              : {
                type: "spring", stiffness: 320, damping: 26, mass: 0.9,
                delay: (i * stagger) / 1000,
                opacity: { duration: 0.12, delay: (i * stagger) / 1000 },
                rotate: { duration: 0.5, times: [0, 0.6, 1], delay: (i * stagger) / 1000, ease: "easeOut" },
              }}>
            {child}
          </motion.div>
        );
      })}
    </>
  );
}
