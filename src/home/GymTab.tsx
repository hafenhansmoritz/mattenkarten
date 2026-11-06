// Tab „Gym“: alles rund ums echte Training.
import { motion } from "framer-motion";
import { GymWeekCard } from "../gym/GymScreen";
import { leglockMenu } from "../leglock/store";
import type { Target } from "./nav";
import "./home.css";

export function GymTab({ go }: { go: (t: Target) => void }) {
  const ll = leglockMenu();
  const items: { t: Target; title: string; text: string }[] = [
    { t: { journey: "training" }, title: "Nach dem Training", text: "Training eintragen, passende Lektion holen, Frage für den Trainer. Dazu Tagebuch." },
    { t: "gym", title: "Fürs Gym", text: "Positionsspiele für den Trainer, Partner-Modus zum Vorlesen, Beamer-Ansicht und Wochenthema per Code." },
    ...(ll.locked ? [] : [{ t: "leglock" as Target, title: ll.title, text: ll.text }]),
    { t: "hotseat", title: "Duell zu zweit", text: "Am selben Handy gegeneinander – verdeckt wählen, gleichzeitig aufdecken." },
    { t: "trainer", title: "Für Trainer", text: "Prüfliste aller Inhalte, die eine Trainer-Bestätigung brauchen." },
  ];
  return (
    <div className="screen more">
      <h2 className="display" style={{ fontSize: 30 }}>Gym</h2>
      <GymWeekCard onOpen={() => go("gymweek")} />
      <div className="more-list">
        {items.map((it, i) => (
          <motion.button key={it.title} className="more-item" onClick={() => go(it.t)}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <strong className="display">{it.title}</strong>
            <span className="muted small">{it.text}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
