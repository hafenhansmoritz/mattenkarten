import { motion, type Variants } from "framer-motion";
import type { Recap } from "../../engine/types";
import { CARD } from "../../data/cards";
import { IconBulb, IconCheck } from "./icons";
import { MiniCard } from "./MiniCard";
import { plainName } from "./kinds";

export interface RecapViewProps {
  recap: Recap;
  won: boolean;
  onContinue: () => void;
  /** Optional: Fehler-Deck / entscheidenden Moment nachspielen. */
  onReplay?: () => void;
}

const seq: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } } };
const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 340, damping: 28 } },
};
const flip: Variants = {
  hidden: { rotateY: -100, opacity: 0 },
  show: { rotateY: 0, opacity: 1, transition: { type: "spring", stiffness: 220, damping: 20 } },
};

/** Abschnitt nach dem Match: "Das hast du gelernt" + "Der entscheidende Moment" + Fehler-Deck-Hinweis. */
export function RecapView({ recap, won, onContinue, onReplay }: RecapViewProps) {
  const lessons = recap.lessons.slice(0, 3);
  const d = recap.decisive;
  const better = d?.better ? CARD[d.better] : undefined;
  const n = recap.mistakes.length;

  return (
    <motion.section className={`lr-recap ${won ? "won" : "lost"}`} variants={seq} initial="hidden" animate="show" aria-label="Rückblick">
      {lessons.length > 0 && (
        <motion.div variants={rise} className="lr-recap-block">
          <h2 className="display lr-recap-h">Das hast du gelernt</h2>
          <motion.ol className="lr-lessons" variants={seq}>
            {lessons.map((l, i) => (
              <motion.li key={i} variants={flip} className="lr-lesson">
                <span className="lr-lesson-n display num">{i + 1}</span>
                <span className="lr-lesson-ico">
                  <IconBulb size={18} />
                </span>
                <p>{l}</p>
              </motion.li>
            ))}
          </motion.ol>
        </motion.div>
      )}

      {d && (
        <motion.div variants={rise} className="lr-recap-block lr-decisive">
          <h2 className="display lr-recap-h">Der entscheidende Moment</h2>
          <p className="lr-decisive-turn label">Runde {d.record.turn}</p>
          <div className="lr-duel">
            <motion.div initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.7, type: "spring", stiffness: 300, damping: 24 }}>
              <MiniCard id={d.record.pCard} caption="Du" />
            </motion.div>
            <motion.span className="display lr-vs" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.95, type: "spring", stiffness: 500, damping: 14 }}>
              vs
            </motion.span>
            <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.8, type: "spring", stiffness: 300, damping: 24 }}>
              <MiniCard id={d.record.oCard} caption="Er" />
            </motion.div>
          </div>
          <p className="lr-decisive-head">{d.record.headline}</p>

          {better ? (
            <motion.div className="lr-better" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.15, type: "spring", stiffness: 300, damping: 26 }}>
              <MiniCard id={better.id} glow showPlain={false} />
              <div className="lr-better-txt">
                <span className="label">Besser wäre gewesen</span>
                <b className="lr-better-name">{plainName(better)}</b>
                <p>{d.why}</p>
              </div>
            </motion.div>
          ) : (
            d.why && <p className="lr-decisive-why">{d.why}</p>
          )}
        </motion.div>
      )}

      {n > 0 && (
        <motion.p variants={rise} className="lr-mistake-note">
          <span className="lr-mistake-stack" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            <b>Für dein Fehler-Deck:</b> {n} {n === 1 ? "Situation" : "Situationen"}. Die üben wir später noch einmal.
          </span>
        </motion.p>
      )}
      {n === 0 && (
        <motion.p variants={rise} className="lr-mistake-note clean">
          <IconCheck size={18} />
          <span>Keine neuen Fehler. Stark gelesen.</span>
        </motion.p>
      )}

      <motion.div variants={rise} className="lr-recap-actions">
        {onReplay && n > 0 && (
          <button type="button" className="btn big" onClick={onReplay}>
            Fehler üben
          </button>
        )}
        <button type="button" className="btn primary big" onClick={onContinue}>
          Weiter
        </button>
      </motion.div>
    </motion.section>
  );
}
