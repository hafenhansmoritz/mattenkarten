import type { ReactNode } from "react";

export interface PulseProps {
  children: ReactNode;
  active: boolean;
  /** Ringfarbe; Standard var(--points). */
  color?: string;
  /** Eckenradius des Rings (Standard: var(--radius)). */
  radius?: string;
  className?: string;
}

/**
 * Aufmerksamkeits-Puls (Coach-Hinweis): zwei versetzte Ringe laufen nach außen.
 * Wrapper ist inline-block + relative; der Ring liegt hinter/über dem Kind, pointer-events: none.
 */
export function Pulse({ children, active, color = "var(--points, #ffd166)", radius, className }: PulseProps) {
  return (
    <span className={`fx-pulse${active ? " is-active" : ""}${className ? " " + className : ""}`}
      style={{ ["--fx-c" as string]: color, ...(radius ? { ["--fx-r" as string]: radius } : {}) }}>
      {children}
      {active && <><span className="fx-pulse-ring" aria-hidden /><span className="fx-pulse-ring fx-pulse-ring-2" aria-hidden /></>}
    </span>
  );
}
