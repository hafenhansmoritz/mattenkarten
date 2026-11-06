import { motion } from "framer-motion";
import type { CardKind } from "../../engine/types";
import { IconPuste, KindIcon } from "./icons";
import { KIND_ORDER, KIND_VERB } from "./kinds";

export interface PredictPickerProps {
  value: CardKind | null;
  onChange: (v: CardKind | null) => void;
  disabled?: boolean;
}

/** Optionaler Tipp vor dem Aufdecken: Was spielt der Gegner? */
export function PredictPicker({ value, onChange, disabled = false }: PredictPickerProps) {
  const opts: (CardKind | null)[] = [...KIND_ORDER, null];
  return (
    <div className="lr-predict" role="radiogroup" aria-label="Was spielt er? Tipp ab">
      <div className="lr-predict-head">
        <span className="lr-predict-q">Was spielt er? Tipp ab:</span>
        <span className="lr-predict-note">
          Richtig getippt = +1 <IconPuste size={13} /> Atem
        </span>
      </div>
      <div className="lr-predict-chips">
        {opts.map((k) => {
          const on = value === k;
          return (
            <button
              key={k ?? "none"}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={disabled}
              className={`lr-chip ${k ? `k-${k}` : "k-none"}${on ? " on" : ""}`}
              onClick={() => onChange(k)}
            >
              {on && <motion.span layoutId="lr-predict-sel" className="lr-chip-sel" transition={{ type: "spring", stiffness: 520, damping: 34 }} />}
              <span className="lr-chip-in">
                {k && <KindIcon kind={k} size={15} />}
                {k ? KIND_VERB[k] : "Kein Tipp"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
