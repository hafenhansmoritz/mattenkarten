import { useEffect, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { at, rng, EASE_OUT, type Coord } from "./util";

export interface ImpactBurstProps {
  x: Coord;
  y: Coord;
  /** Partikel-/Ringfarbe. Standard: var(--k-angriff). */
  color?: string;
  /** Anzahl Partikel (10–14). */
  count?: number;
  /** Radius, den die Partikel erreichen (px). */
  size?: number;
  onDone?: () => void;
}

const DUR = 0.45;

/**
 * Radialer Treffer-Burst: weißer Blitz + sich ausdehnender Ring + 10–14 Partikel, ~450 ms.
 * Mit `key` neu mounten, um ihn erneut abzuspielen; ruft danach `onDone`.
 */
export function ImpactBurst({ x, y, color = "var(--k-angriff, #f0573f)", count = 12, size = 64, onDone }: ImpactBurstProps) {
  const reduced = !!useReducedMotion();
  const parts = useMemo(() => {
    const r = rng(Math.floor(Math.random() * 1e9));
    const n = Math.max(10, Math.min(14, count));
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.5;
      const d = size * (0.65 + r() * 0.45);
      return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, s: 4 + r() * 5, rot: (a * 180) / Math.PI, long: r() > 0.45 };
    });
  }, [count, size]);

  useEffect(() => {
    const t = setTimeout(() => onDone?.(), (reduced ? 0.25 : DUR) * 1000 + 30);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (reduced) {
    return (
      <div className="fx fx-burst" style={{ ...at(x, y), ["--fx-c" as string]: color }} aria-hidden>
        <motion.span className="fx-burst-ring" initial={{ opacity: 0.8, scale: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.25 }}
          style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }} />
      </div>
    );
  }

  return (
    <div className="fx fx-burst" style={{ ...at(x, y), ["--fx-c" as string]: color }} aria-hidden>
      <motion.span className="fx-burst-flash"
        style={{ width: size * 1.1, height: size * 1.1, marginLeft: -size * 0.55, marginTop: -size * 0.55 }}
        initial={{ scale: 0.3, opacity: 1 }} animate={{ scale: 1.15, opacity: 0 }}
        transition={{ duration: 0.16, ease: "easeOut" }} />
      <motion.span className="fx-burst-ring"
        style={{ width: size * 2, height: size * 2, marginLeft: -size, marginTop: -size }}
        initial={{ scale: 0.15, opacity: 1, borderWidth: 8 }} animate={{ scale: 1, opacity: 0, borderWidth: 1 }}
        transition={{ duration: DUR, ease: EASE_OUT as unknown as number[] }} />
      {parts.map((p, i) => (
        <motion.span key={i} className={p.long ? "fx-burst-p fx-burst-streak" : "fx-burst-p"}
          style={{ width: p.long ? p.s * 2.6 : p.s, height: p.s * (p.long ? 0.6 : 1), marginLeft: -p.s / 2, marginTop: -p.s / 2, rotate: p.rot }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.dx, y: p.dy, opacity: 0, scale: 0.4 }}
          transition={{ duration: DUR * (0.8 + (i % 3) * 0.1), ease: EASE_OUT as unknown as number[] }} />
      ))}
    </div>
  );
}
