import { motion } from "framer-motion";
import { FightersK2 } from "../core2/ui/FightersK2";
import { DAYS } from "./days";
import { currentDay, loadProgress } from "./store";
import "./program.css";

/** Hero-Karte oben im Kampagne-Tab: „Neu hier? 7-Tage-Start“. */
export function StartHero({ onOpen }: { onOpen: () => void }) {
  const p = loadProgress();
  const cur = currentDay(p);
  const done = cur > 7;
  const started = p.done.length > 0;
  return (
    <motion.button type="button" className={`pg-hero ${done ? "finished" : ""}`} onClick={onOpen}
      initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      whileTap={{ scale: 0.98 }} transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}>
      <span className="pg-hero-fig" aria-hidden="true"><FightersK2 pos="mount" top="o" /></span>
      <span className="pg-hero-txt">
        <span className="label pg-kicker">{done ? "Geschafft" : started ? `Weiter mit Tag ${cur}` : "Neu hier?"}</span>
        <strong className="display">7-Tage-Start</strong>
        <span className="small">{done ? "Bereit fürs erste Training – Checkliste ansehen." : started ? DAYS[cur - 1].title : "15 Minuten am Tag: sicher und mit Plan ins erste Training."}</span>
        <span className="pg-hero-knots" aria-label={`${p.done.length} von 7 Tagen`}>
          {DAYS.map((d) => <i key={d.n} className={p.done.includes(d.n) ? "on" : d.n === cur ? "now" : ""} />)}
        </span>
      </span>
      <span className="pg-hero-go" aria-hidden="true">›</span>
    </motion.button>
  );
}
