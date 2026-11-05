// Kompakte „Wiederholen“-Karte für Kampagne-Tab und Programm-Startseite.
// Eigene Datei, damit die Startseite den großen Reise-Bildschirm (Kern 2, Quiz, Lektionen) nicht mitladen muss.
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ALL_QUESTIONS, Q_BY_ID } from "../program/questions";
import { currentDay, loadProgress } from "../program/store";
import { addDays, localDate, nextReviewDate, todayCount } from "./schedule";
import { getJourney, syncLearned, useJourney, type JourneyState } from "./store";
import "./journey.css";

export const known = (id: string) => !!Q_BY_ID[id];

/** Fragen aus abgeschlossenen Programm-Tagen in den Plan übernehmen (einmalig, still). */
export function syncFromProgram(silent = false) {
  const p = loadProgress();
  const pairs: { id: string; day: string }[] = [];
  for (const q of ALL_QUESTIONS) {
    const d = p.doneOn?.[q.day];
    if (typeof d === "string") pairs.push({ id: q.id, day: d });
  }
  if (pairs.length) syncLearned(pairs, localDate(), silent);
}

export function formatDay(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  try {
    return new Date(y, m - 1, d, 12).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
  } catch { return s; }
}
export function relDay(s: string, today: string): string {
  if (s === today) return "heute";
  return s === addDays(today, 1) ? "morgen" : `am ${formatDay(s)}`;
}

/** Soll die Reise schon sichtbar sein? Nach der Startwoche – oder sobald jemand ein Training eingetragen hat. */
export function journeyVisible(j: JourneyState = getJourney()): boolean {
  return currentDay(loadProgress()) > 7 || j.log.length > 0;
}

export type JourneyStart = "home" | "review" | "training";

export function ReviewCard({ onOpen, compact }: { onOpen: (v: JourneyStart) => void; compact?: boolean }) {
  const j = useJourney();
  useEffect(() => { syncFromProgram(); }, []);
  if (!journeyVisible(j)) return null;
  const today = localDate();
  const c = todayCount(j, today, known);
  const next = nextReviewDate(j, today);
  const n = Math.min(c.total, 8);
  return (
    <motion.section className={`jr-card ${compact ? "compact" : ""}`} aria-label="Dranbleiben"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}>
      <button type="button" className="jr-card-main" onClick={() => onOpen(c.total ? "review" : "home")}>
        <span className={`jr-ring ${c.total ? "on" : ""}`} aria-hidden="true">
          {c.total > 0 && <motion.i animate={{ scale: [1, 1.35, 1], opacity: [0.55, 0, 0.55] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }} />}
          <b className="num">{c.total ? n : "✓"}</b>
        </span>
        <span className="jr-card-txt">
          <span className="label jr-kicker">Wiederholen</span>
          <strong className="display">{c.total ? `${n} ${n === 1 ? "Frage" : "Fragen"} bereit` : "Alles wiederholt"}</strong>
          <span className="small muted">
            {c.total
              ? c.errors ? `Davon ${Math.min(c.errors, 3)} aus deinem Fehlerdeck. Etwa 3 Minuten.` : "Kurze Runde, gemischte Themen. Etwa 3 Minuten."
              : next ? `Nächste Runde ${relDay(next, today)}. Heute ist frei.` : "Heute ist frei."}
          </span>
        </span>
        <span className="jr-go" aria-hidden="true">›</span>
      </button>
      <button type="button" className="jr-card-sub" onClick={() => onOpen("training")}>
        <span><b>Nach dem Training</b> <span className="small muted">· in 3 Schritten eintragen</span></span>
        <span aria-hidden="true">＋</span>
      </button>
    </motion.section>
  );
}
