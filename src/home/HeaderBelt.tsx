// Ein Gürtelsystem (UX-Review 06.11.2026, Punkt 7): bis Tag 7 die Knoten des 7-Tage-Starts,
// danach der Spielrang der Rangliste mit Streifen. Kampagnen-XP gibt es in der Kopfzeile nicht mehr.
import { DAYS } from "../program/days";
import { currentDay, useProgram } from "../program/store";
import { readLadder } from "../core2/ladder/store";
import { LadderBelt } from "../core2/ladder/LadderBelt";
import { inGate, rankText } from "../core2/ladder/ladder";

/** Hat die Rangliste schon ein Ergebnis? Bis dahin zeigt die Kopfzeile den geschafften 7-Tage-Start. */
export function hasLadderResult(s: { games: number; history: unknown[]; belt: number } | null): boolean {
  return !!s && (s.games > 0 || s.history.length > 0 || s.belt > 0);
}

export function HeaderBelt({ onOpen }: { onOpen: (to: "program" | "rangliste") => void }) {
  const [p] = useProgram();
  const cur = currentDay(p);
  if (cur <= 7) {
    return (
      <button type="button" className="hm-belt" onClick={() => onOpen("program")} aria-label={`7-Tage-Start: ${p.done.length} von 7 Tagen geschafft`}>
        <span className="hm-belt-knots" aria-hidden="true">
          {DAYS.map((d) => <i key={d.n} className={p.done.includes(d.n) ? "on" : d.n === cur ? "now" : ""} />)}
        </span>
        <span className="label">Tag {cur} von 7</span>
      </button>
    );
  }
  const s = readLadder();
  if (!hasLadderResult(s)) {
    // UX-Review 2, Punkt 9: nach Tag 7 nicht auf „Weiß · 0 Streifen“ zurückfallen, solange noch kein Ranglisten-Kampf war.
    return (
      <button type="button" className="hm-belt" onClick={() => onOpen("program")} aria-label="7-Tage-Start: alle 7 Tage geschafft">
        <span className="hm-belt-knots" aria-hidden="true">{DAYS.map((d) => <i key={d.n} className="on" />)}</span>
        <span className="label">7/7 ✓</span>
      </button>
    );
  }
  return (
    <button type="button" className="hm-belt" onClick={() => onOpen("rangliste")} aria-label={`Rangliste: ${rankText(s!)} (Spielrang)`}>
      <LadderBelt belt={s!.belt} stripes={s!.stripes} gate={inGate(s!)} size="small" />
      <span className="label">{rankText(s!)}</span>
    </button>
  );
}
