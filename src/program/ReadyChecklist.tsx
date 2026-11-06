// „Bereit fürs erste Training“ – Checkliste zum Abhaken. Im Abschluss des 7-Tage-Starts und schon ab Tag 1
// auf der Startseite („Vor deinem ersten Training“). Haken liegen im Programm-Fortschritt (mk.program.v1).
import { sfx } from "../sound";
import { CHECK_GROUP_LABEL, READY_CHECKLIST } from "./days";
import type { ProgramProgress } from "./store";
import "./program.css";

export function ReadyChecklist({ p, update }: { p: ProgramProgress; update: (fn: (p: ProgramProgress) => ProgramProgress) => void }) {
  const ticked = new Set(p.checklist);
  const all = READY_CHECKLIST.every((c) => ticked.has(c.id));
  return (
    <>
      {(Object.keys(CHECK_GROUP_LABEL) as (keyof typeof CHECK_GROUP_LABEL)[]).map((g) => (
        <div key={g} className="pg-check-group">
          <h4 className="label">{CHECK_GROUP_LABEL[g]}</h4>
          <ul className="pg-check">
            {READY_CHECKLIST.filter((c) => c.group === g).map((c) => {
              const on = ticked.has(c.id);
              return (
                <li key={c.id}>
                  <button type="button" className={on ? "on" : ""} aria-pressed={on}
                    onClick={() => { sfx.select(); update((x) => ({ ...x, checklist: on ? x.checklist.filter((i) => i !== c.id) : [...x.checklist, c.id] })); }}>
                    <span className="pg-box">{on ? "✓" : ""}</span>
                    <span>{c.text}{c.check && <span className="pg-check-flag small"> (noch unsicher – frag später deinen Trainer)</span>}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <p className="small muted">Hygiene-Quellen: BJJ More, CDC (MRSA bei Sportlern), USA Wrestling, IBJJF-Kleiderordnung.</p>
      {all && <p className="pg-hint small">Alles abgehakt. Viel Spaß bei deinem ersten Training!</p>}
    </>
  );
}

/** Anzahl abgehakter Punkte (für die Startseite). */
export const checklistCount = (p: ProgramProgress) => ({ done: READY_CHECKLIST.filter((c) => p.checklist.includes(c.id)).length, total: READY_CHECKLIST.length });
