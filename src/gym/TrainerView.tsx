// Schritt 59: Trainer-Modus – Beamer/Tablet quer. Große Schrift, Kämpfer-Szene (nur Anzeige), Folie für Folie.
// Steuerung: Pfeiltasten, Leertaste, PageUp/PageDown (Clicker), Pos1/Ende, F = Vollbild, B = Schwarzbild, Esc = Ende.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FightersK2 } from "../core2/ui/FightersK2";
import { keyAction, slidesFor, stepIndex, type KeyAction, type TrainerSource } from "./trainerMode";

type FsDoc = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> };
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };

export function fullscreenSupported(): boolean {
  if (typeof document === "undefined") return false;
  const el = document.documentElement as FsEl;
  return !!(el.requestFullscreen || el.webkitRequestFullscreen);
}

export function TrainerView({ src, onBack }: { src: TrainerSource; onBack: () => void }) {
  const slides = useMemo(() => slidesFor(src), [src]);
  const [i, setI] = useState(0);
  const [blank, setBlank] = useState(false);
  const [fs, setFs] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const s = slides[i];

  const toggleFs = useCallback(async () => {
    const d = document as FsDoc;
    try {
      if (d.fullscreenElement || d.webkitFullscreenElement) await (d.exitFullscreen?.() ?? d.webkitExitFullscreen?.());
      else {
        const el = (root.current ?? document.documentElement) as FsEl;
        await (el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.());
      }
    } catch { /* z. B. iPhone: kein Vollbild – Ansicht funktioniert trotzdem */ }
  }, []);

  const exit = useCallback(() => {
    const d = document as FsDoc;
    if (d.fullscreenElement) void d.exitFullscreen?.().catch(() => {});
    onBack();
  }, [onBack]);

  const act = useCallback((a: KeyAction) => {
    if (a === "fullscreen") { void toggleFs(); return; }
    if (a === "blank") { setBlank((b) => !b); return; }
    if (a === "exit") {
      // Esc im Vollbild beendet zuerst nur das Vollbild (macht der Browser selbst).
      if (!(document as FsDoc).fullscreenElement) exit();
      return;
    }
    setBlank(false);
    setI((x) => stepIndex(x, slides.length, a));
  }, [slides.length, toggleFs, exit]);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const a = keyAction({ key: e.key, altKey: e.altKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey, targetTag: (e.target as HTMLElement | null)?.tagName });
      if (!a) return;
      e.preventDefault();
      act(a);
    };
    const onFs = () => setFs(!!((document as FsDoc).fullscreenElement || (document as FsDoc).webkitFullscreenElement));
    window.addEventListener("keydown", on);
    document.addEventListener("fullscreenchange", onFs);
    return () => { window.removeEventListener("keydown", on); document.removeEventListener("fullscreenchange", onFs); };
  }, [act]);

  return (
    <div ref={root} className={`gy-trainer${blank ? " blank" : ""}`} role="region" aria-roledescription="Präsentation" aria-label="Trainer-Modus">
      <div className="gy-tr-bar">
        <button className="btn small ghost" onClick={exit} aria-label="Trainer-Modus beenden">✕ Ende</button>
        <span className="label num">{i + 1} / {slides.length}</span>
        <span className="label muted gy-tr-keys">← → Leertaste · F Vollbild · B Schwarz</span>
        {fullscreenSupported() && <button className="btn small" onClick={() => void toggleFs()}>{fs ? "Vollbild aus" : "Vollbild"}</button>}
      </div>
      {blank ? (
        <button className="gy-tr-blankbtn" onClick={() => setBlank(false)} aria-label="Bild wieder zeigen" />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={i} className="gy-tr-slide" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <div className="gy-tr-scene" aria-hidden="true">
              <FightersK2 pos={s.pos} top={s.top} zone={s.zone ?? null} />
              {s.badge && <span className="gy-badge big">{s.badge}</span>}
            </div>
            <div className="gy-tr-text">
              <span className="label gy-tr-kicker">{s.kicker}</span>
              <h2 className="display gy-tr-title">{s.title}</h2>
              {s.text && <p className="gy-tr-p">{s.text}</p>}
              {s.bullets && <ul className="gy-tr-list">{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
              {s.safety && <p className="gy-tr-safety"><b>Sicherheit:</b> {s.safety}</p>}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
      <div className="gy-tr-nav">
        <button className="btn big" onClick={() => act("prev")} disabled={i === 0} aria-label="Vorige Folie">‹</button>
        <div className="gy-tr-dots" aria-hidden="true">{slides.map((_, k) => <i key={k} className={k === i ? "on" : ""} />)}</div>
        <button className="btn big primary" onClick={() => act("next")} disabled={i === slides.length - 1} aria-label="Nächste Folie">›</button>
      </div>
      <p className="gy-tr-rotate small">Tipp: Gerät quer halten.</p>
    </div>
  );
}
