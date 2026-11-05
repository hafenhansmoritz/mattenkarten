import { motion } from "framer-motion";
import type { PositionGuide, Role } from "../../engine/types";
import { PoseThumb } from "../fighters";
import { IconTarget, IconWarn } from "./icons";

export interface PositionGuideCardProps {
  guide: PositionGuide;
  role: Role;
  onClose: () => void;
}

const ROLE_WORD: Record<Role, string> = { neutral: "Ihr steht gleich", top: "Du bist oben", bottom: "Du bist unten" };

/** Steckbrief, wenn man eine Position zum ersten Mal erreicht. Inhalt einer .sheet / eines Overlays. */
export function PositionGuideCard({ guide, role, onClose }: PositionGuideCardProps) {
  const goal = guide.goal[role] ?? guide.goal.neutral ?? "";
  const danger = guide.danger?.[role] ?? guide.danger?.neutral;
  const rank = guide.rank[role] ?? guide.rank.neutral ?? 0;

  return (
    <motion.section
      className="lr-guide"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lr-guide-title"
      initial={{ scale: 0.86, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.92, opacity: 0, y: 20 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
    >
      <div className="lr-guide-top">
        <span className="label lr-guide-kicker">Neue Position</span>
        <span className="label lr-guide-role">{ROLE_WORD[role]}</span>
      </div>

      <motion.div
        className="lr-guide-pose"
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.12 }}
      >
        <PoseThumb pos={guide.pos} role={role} size={300} />
        <span className="lr-guide-you label">Du</span>
      </motion.div>

      <motion.header
        className="lr-guide-head"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.3 }}
      >
        <h2 id="lr-guide-title" className="display lr-guide-name">
          {guide.plain}
        </h2>
        <p className="lr-guide-term">
          Fachbegriff: <b>{guide.term}</b>
        </p>
        <p className="lr-guide-one">{guide.oneLiner}</p>
      </motion.header>

      <motion.div
        className="lr-goalbox"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.34, type: "spring", stiffness: 400, damping: 24 }}
      >
        <span className="lr-goalbox-ico">
          <IconTarget size={22} />
        </span>
        <div>
          <span className="label">Dein Ziel</span>
          <p className="lr-goalbox-text">{goal}</p>
        </div>
      </motion.div>

      {danger && (
        <motion.p
          className="lr-danger"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.44, duration: 0.3 }}
        >
          <IconWarn size={18} />
          <span>
            <b>Achtung:</b> {danger}
          </span>
        </motion.p>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <RankMeter rank={rank} />
      </motion.div>

      <motion.button
        type="button"
        className="btn primary big lr-guide-ok"
        onClick={onClose}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        autoFocus
      >
        Verstanden
      </motion.button>
    </motion.section>
  );
}

const RANK_MIN = -4;
const RANK_MAX = 5;

function rankWord(r: number) {
  if (r <= -3) return "Sehr schlecht";
  if (r < 0) return "Eher schlecht";
  if (r === 0) return "Gleich verteilt";
  if (r <= 2) return "Eher gut";
  return "Sehr gut";
}

/** Skala -4 … 5: Wie gut ist das für dich? */
export function RankMeter({ rank }: { rank: number }) {
  const r = Math.max(RANK_MIN, Math.min(RANK_MAX, Math.round(rank)));
  const steps = Array.from({ length: RANK_MAX - RANK_MIN + 1 }, (_, i) => RANK_MIN + i);
  const tone = r < 0 ? "bad" : r === 0 ? "even" : "good";
  return (
    <div className={`lr-rank ${tone}`} role="meter" aria-label="Wie gut ist das für dich?" aria-valuemin={RANK_MIN} aria-valuemax={RANK_MAX} aria-valuenow={r} aria-valuetext={rankWord(r)}>
      <div className="lr-rank-head">
        <span className="label">Wie gut ist das für dich?</span>
        <b className="lr-rank-word">{rankWord(r)}</b>
      </div>
      <div className="lr-rank-bar" aria-hidden="true">
        {steps.map((s, i) => {
          const on = r < 0 ? s >= r && s < 0 : r > 0 ? s <= r && s > 0 : s === 0;
          return (
            <motion.i
              key={s}
              className={`${s < 0 ? "neg" : s === 0 ? "zero" : "pos"}${on ? " on" : ""}`}
              initial={{ scaleY: 0.3, opacity: 0.3 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ delay: 0.55 + i * 0.035, type: "spring", stiffness: 500, damping: 20 }}
            />
          );
        })}
      </div>
      <div className="lr-rank-ends" aria-hidden="true">
        <span>schlecht</span>
        <span>super</span>
      </div>
    </div>
  );
}
