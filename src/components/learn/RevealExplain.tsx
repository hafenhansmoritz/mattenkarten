import { motion, type Variants } from "framer-motion";
import type { CardKind } from "../../engine/types";
import { IconBulb, IconCheck, IconEye, IconPuste } from "./icons";
import { KIND_VERB } from "./kinds";
import { TriangleExplainer } from "./TriangleExplainer";

export interface RevealExplainProps {
  /** Kurzlabel der Regel, z. B. "Rahmen schlägt Angriff" oder "Schneller gewinnt". */
  ruleLabel: string;
  /** Welcher Dreieckspfeil hat gegriffen (null bei Tempo/Patt/Scramble). */
  highlightKind: CardKind | null;
  headline: string;
  lesson?: string;
  /** Tipp des Spielers. `actual` = was der Gegner wirklich spielte (für den Fehlversuch-Satz). */
  predicted?: { kind: CardKind; correct: boolean; actual?: CardKind };
}

const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 420, damping: 30 } },
};

/** Inhalt des Urteil-Panels nach dem Aufdecken: Regel, Schlagzeile, Warum, Mini-Dreieck, Tipp-Ergebnis. */
export function RevealExplain({ ruleLabel, highlightKind, headline, lesson, predicted }: RevealExplainProps) {
  const chipKind = highlightKind ?? "none";
  return (
    <motion.div className="lr-reveal" variants={list} initial="hidden" animate="show">
      <motion.span variants={item} className={`lr-rule k-${chipKind}`}>
        {ruleLabel}
      </motion.span>

      <motion.h3 variants={item} className="display lr-reveal-head">
        {headline}
      </motion.h3>

      {lesson && (
        <motion.div variants={item} className="lr-why">
          <span className="lr-why-ico">
            <IconBulb size={20} />
          </span>
          <div>
            <span className="label lr-why-k">Warum?</span>
            <p>{lesson}</p>
          </div>
        </motion.div>
      )}

      {highlightKind && (
        <motion.div variants={item}>
          <TriangleExplainer compact highlight={highlightKind} />
        </motion.div>
      )}

      {predicted && (
        <motion.p variants={item} className={`lr-pred-res ${predicted.correct ? "ok" : "miss"}`}>
          {predicted.correct ? (
            <>
              <IconCheck size={18} />
              <span>
                <b>Gut gelesen!</b> +1 <IconPuste size={14} /> Atem
              </span>
            </>
          ) : (
            <>
              <IconEye size={18} />
              <span>
                Du hast <b>{KIND_VERB[predicted.kind]}</b> getippt.
                {predicted.actual ? (
                  <>
                    {" "}
                    Er spielte <b>{KIND_VERB[predicted.actual]}</b> – das nächste Mal: Schau, was er zuletzt gemacht hat.
                  </>
                ) : (
                  <> Das nächste Mal: Schau, was er zuletzt gemacht hat.</>
                )}
              </span>
            </>
          )}
        </motion.p>
      )}
    </motion.div>
  );
}
