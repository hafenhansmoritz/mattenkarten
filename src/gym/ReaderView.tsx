// Schritt 58: Partner-Modus „Vorleser“ – großer Text, Schritt für Schritt, Timer, Rollen tauschen. Läuft offline.
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DrillTimer } from "../program/DrillTimer";
import { HealthGate } from "../program/HealthGate";
import { sfx } from "../sound";
import { buildScript, type ReaderSource } from "./reader";
import { TRAINER_LABEL } from "./games";

export function ReaderView({ src, onBack }: { src: ReaderSource; onBack: () => void }) {
  const script = useMemo(() => buildScript(src), [src]);
  const [i, setI] = useState(0);
  const step = script[i];
  const go = (d: number) => { sfx.select(); setI((x) => Math.max(0, Math.min(script.length - 1, x + d))); };

  // Auch mit Tastatur bedienbar (Pfeile, Leertaste) – praktisch mit Bluetooth-Tastatur oder Clicker.
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (step.kind === "timer" && e.key === " ") return; // Leertaste gehört dann dem Timer-Knopf
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(-1); }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const pass = step.kind === "read" || step.kind === "timer" ? step.pass : null;
  return (
    <div className="pg-screen gy-reader">
      <div className="pg-top">
        <button className="btn small ghost" onClick={onBack}>← Zurück</button>
        <span className="label">Vorleser · <span className="num">{i + 1}</span>/{script.length}</span>
      </div>
      <header className="gy-reader-head">
        <span className="label muted">{src.kind === "game" ? "Positionsspiel" : "Drill"}{pass ? ` · Durchgang ${pass} von 2` : ""}</span>
        <h2 className="display gy-reader-title">{src.title}</h2>
        {src.kind === "game" && <span className="gy-badge">{TRAINER_LABEL}</span>}
      </header>
      <div className="gy-progress" aria-hidden="true">
        {script.map((s, k) => <i key={k} className={`${k < i ? "done" : k === i ? "now" : ""} ${s.kind}`} />)}
      </div>

      <HealthGate>
        <AnimatePresence mode="wait">
          <motion.section key={i} className={`gy-read-card ${step.kind}${step.kind === "read" && step.who ? " who-" + step.who : ""}`}
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}
            aria-live="polite">
            {step.kind === "read" && (
              <>
                <span className="label">{step.kicker}</span>
                <p className="gy-read-text">{step.text}</p>
              </>
            )}
            {step.kind === "timer" && (
              <>
                <span className="label">Jetzt üben · {step.kicker}</span>
                {step.cues.length > 0 && (
                  <div className="gy-cues">
                    <span className="small muted">Zurufen, wenn es passt:</span>
                    <ul>{step.cues.map((c) => <li key={c}>{c}</li>)}</ul>
                  </div>
                )}
                <DrillTimer key={`t${i}`} title={`Timer · Durchgang ${step.pass}`} config={step.config} />
              </>
            )}
            {step.kind === "swap" && (
              <>
                <span className="gy-swap-ico" aria-hidden="true">⇄</span>
                <p className="gy-read-text">{step.text}</p>
              </>
            )}
            {step.kind === "done" && (
              <>
                <span className="gy-swap-ico" aria-hidden="true">✓</span>
                <p className="gy-read-text">{step.text}</p>
              </>
            )}
          </motion.section>
        </AnimatePresence>
      </HealthGate>

      <div className="gy-reader-nav">
        <button className="btn big" onClick={() => go(-1)} disabled={i === 0}>‹ Zurück</button>
        {step.kind === "done"
          ? <button className="btn big primary" onClick={onBack}>Fertig</button>
          : <button className="btn big primary" onClick={() => go(1)}>{step.kind === "swap" ? "Getauscht – weiter" : "Weiter ›"}</button>}
      </div>
      <p className="small muted center">Wer liest, hält das Handy. Wer übt, hört nur zu. Stopp geht immer vor.</p>
    </div>
  );
}
