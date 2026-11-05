// Aufwärmen No-Gi (5 Minuten) – erreichbar aus dem 7-Tage-Start und aus „Mehr“.
import { useState } from "react";
import { motion } from "framer-motion";
import { Stamp } from "../components/fx";
import { DrillTimer } from "./DrillTimer";
import { HealthGate } from "./HealthGate";
import { localDate } from "./store";
import { WARMUP, WARMUP_TIMER, addWarmup, loadWarmups } from "./warmup";
import "./program.css";

export function WarmupScreen({ onBack }: { onBack: () => void }) {
  const [count, setCount] = useState(() => loadWarmups().done.length);
  const [fin, setFin] = useState(0);
  return (
    <div className="pg-screen pg-rel wu-screen">
      <div className="pg-top">
        <button className="btn small ghost" onClick={onBack}>← Zurück</button>
        {count > 0 && <span className="label muted">Aufgewärmt: <span className="num">{count}</span>×</span>}
      </div>
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <span className="label pg-kicker">No-Gi · solo · 5 Minuten</span>
        <h2 className="display pg-title">Aufwärmen</h2>
        <p className="muted pg-promise">Fünf Grundbewegungen, die du in jedem Training brauchst. 45 Sekunden je Übung, 15 Sekunden Pause.</p>
      </motion.header>
      <HealthGate>
        <ol className="wu-list">
          {WARMUP.map((m, i) => (
            <motion.li key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.06 }}>
              <span className="wu-n num">{i + 1}</span>
              <div>
                <b>{m.name}</b>
                <p className="small">{m.cue}</p>
                <p className="small wu-safe"><b>Sicher:</b> {m.safety}{m.check && <span className="pg-check-flag"> (Trainer fragen)</span>}</p>
              </div>
            </motion.li>
          ))}
        </ol>
        <DrillTimer title="Aufwärm-Timer" config={WARMUP_TIMER}
          onFinish={() => { setCount(addWarmup(localDate()).done.length); setFin((n) => n + 1); }} />
        {fin > 0 && <Stamp key={fin} text="AUFGEWÄRMT ✓" tone="good" sub="Zählt zur Mattenpraxis" hold={900} />}
        <p className="muted small">Bei Schmerz sofort stoppen. Würfe, Rollen über den Kopf und Fallen aus dem Stand gehören in die Halle.</p>
      </HealthGate>
    </div>
  );
}
