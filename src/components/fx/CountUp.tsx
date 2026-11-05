import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

export interface CountUpProps {
  value: number;
  /** Dauer in ms (Standard 600). */
  duration?: number;
  /** Formatierung (Standard: ganze Zahl, de-DE). */
  format?: (n: number) => string;
  className?: string;
}

const fmt = (n: number) => Math.round(n).toLocaleString("de-DE");

/** Zählt animiert vom vorherigen Wert zum neuen; kurzer Pop beim Steigen. */
export function CountUp({ value, duration = 600, format = fmt, className }: CountUpProps) {
  const reduced = !!useReducedMotion();
  const [shown, setShown] = useState(value);
  const [bump, setBump] = useState(0);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (from === value) return;
    if (reduced) { setShown(value); return; }
    if (value > from) setBump((b) => b + 1);
    const c = animate(from, value, { duration: duration / 1000, ease: [0.2, 0.7, 0.2, 1], onUpdate: setShown });
    return () => c.stop();
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span key={bump} className={`fx-count${bump ? " is-bump" : ""}${className ? " " + className : ""}`}>
      {format(shown)}
    </span>
  );
}
