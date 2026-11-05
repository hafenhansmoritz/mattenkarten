export interface ChainSweepProps {
  /** Bei jedem Kettenfortschritt neu auslösen: `key` ändern oder active kurz auf true setzen. */
  active: boolean;
  color?: string;
}

/**
 * Lichtstreifen, der einmal über die Kampfketten-Leiste fegt (~650 ms).
 * In einen `position: relative`-Container (die Kette) legen; mit `key={step}` neu mounten.
 */
export function ChainSweep({ active, color = "var(--gas, #5fe3b4)" }: ChainSweepProps) {
  if (!active) return null;
  return <span className="fx fx-sweep" style={{ ["--fx-c" as string]: color }} aria-hidden />;
}
