import { AnimatePresence, motion } from "framer-motion";
import type { Role } from "../../engine/types";
import { IconTarget } from "./icons";

export interface GoalLineProps {
  text: string;
  role?: Role;
}

/** Schmale Leiste über der Hand: "Ziel: …". Wechselt animiert, wenn sich der Text ändert. */
export function GoalLine({ text, role }: GoalLineProps) {
  return (
    <div className={`lr-goalline${role ? ` role-${role}` : ""}`} role="status" aria-live="polite">
      <span className="lr-goalline-ico">
        <IconTarget size={16} />
      </span>
      <span className="label lr-goalline-k">Ziel:</span>
      <span className="lr-goalline-slot">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={text}
            className="lr-goalline-text"
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </span>
    </div>
  );
}
