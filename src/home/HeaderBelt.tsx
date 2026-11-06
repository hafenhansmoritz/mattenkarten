// Ein Gürtelsystem (UX-Review 06.11.2026, Punkt 7): bis Tag 7 die Knoten des 7-Tage-Starts,
// danach der Spielrang der Rangliste mit Streifen. Kampagnen-XP gibt es in der Kopfzeile nicht mehr.
import { DAYS } from "../program/days";
import { currentDay, loadProgress } from "../program/store";
import { readLadder } from "../core2/ladder/store";
import { LadderBelt } from "../core2/ladder/LadderBelt";
import { beltName, inGate, rankText } from "../core2/ladder/ladder";

export function HeaderBelt({ onOpen }: { onOpen: (to: "program" | "rangliste") => void }) {
  const p = loadProgress();
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
  return (
    <button type="button" className="hm-belt" onClick={() => onOpen("rangliste")} aria-label={`Rangliste: ${s ? rankText(s) : "Weißgurt, 0 Streifen"} (Spielrang)`}>
      <LadderBelt belt={s?.belt ?? 0} stripes={s?.stripes ?? 0} gate={s ? inGate(s) : false} size="small" />
      <span className="label">{s ? rankText(s) : `${beltName(0)} · 0 Streifen`}</span>
    </button>
  );
}
