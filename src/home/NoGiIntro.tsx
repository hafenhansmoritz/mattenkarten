// Einmalige Karte „Was ist No-Gi-BJJ?“ (60 Sekunden). Fakten nur aus docs/knowledge-base.md
// (5.1 Abklopfen, 5.2 Intensität, 5.3 Weißgurt-Regeln, 5.5 Disclaimer, 8.11 Sparring später, 8.12 No-Gi, 8.13 Positionsspiele).
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TermText } from "../program/TermText";
import { dismiss, useShared } from "../progress/store";

export const INTRO_ID = "intro-nogi";

export function NoGiIntro() {
  const s = useShared();
  const [open, setOpen] = useState(false);
  if (s.dismissed.includes(INTRO_ID)) return null;
  return (
    <motion.section className="hm-intro" aria-labelledby="hm-intro-h" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="hm-intro-top">
        <span className="label">60 Sekunden</span>
        <button type="button" className="hm-x" aria-label="Karte ausblenden" onClick={() => dismiss(INTRO_ID)}>✕</button>
      </div>
      <h2 id="hm-intro-h" className="display">Was ist No-Gi-BJJ?</h2>
      <p className="small">
        Brazilian Jiu-Jitsu ohne Anzug: Ringen am Boden in Rashguard und Shorts, nah am MMA. Ziel ist erst <b>Kontrolle</b>,
        dann eine <b>Aufgabe</b> – ein Hebel oder Würger, bis der Partner abklopft. Keine Schläge.
      </p>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="more" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
            <h3 className="hm-intro-sub">Dein erstes Training</h3>
            <ul className="small">
              <li>Sag deinem Partner: „Ich bin neu“ – und nenn Verletzungen.</li>
              <li>Viel Technik mit Partner und Positionsspiele aus einer festen Startlage. Freies Sparring kommt in vielen Gyms erst später.</li>
              <li>Arbeite mit 60–70 % Kraft. Kontrolle vor Tempo.</li>
            </ul>
            <h3 className="hm-intro-sub">Sicherheit</h3>
            <ul className="small">
              <li>Früh und deutlich abklopfen: Hand, Fuß oder laut „Stopp“. Beim Tap sofort loslassen.</li>
              <li><TermText text="Heel Hooks, Slams und Neck Cranks sind für Weißgurte verboten." /></li>
              <li>Die App ersetzt keinen Trainer. Techniken nur auf der Matte mit Aufsicht üben.</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="hm-intro-btns">
        <button type="button" className="btn small" aria-expanded={open} onClick={() => setOpen((v) => !v)}>{open ? "Weniger" : "Weiterlesen"}</button>
        <button type="button" className="btn small ghost" onClick={() => dismiss(INTRO_ID)}>Verstanden</button>
      </div>
    </motion.section>
  );
}
