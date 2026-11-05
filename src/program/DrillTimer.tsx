// Solo-Drill-Timer: Runden, Arbeit/Pause, Seitenwechsel, Signale ohne Stimme (Vibration + kurzer Ton),
// Bildschirm bleibt an (Wake Lock API, wenn vorhanden – sonst nur Hinweis).
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { haptic } from "../haptics";
import { sfx } from "../sound";
import { buildPlan, cuesBetween, fmt, planMs, viewAt, type Cue, type TimerConfig } from "./timer";

/* ---------- Wake Lock ---------- */

type Sentinel = { released: boolean; release: () => Promise<void> };
type WakeNav = Navigator & { wakeLock?: { request: (t: "screen") => Promise<Sentinel> } };

export function wakeLockSupported(): boolean {
  return typeof navigator !== "undefined" && !!(navigator as WakeNav).wakeLock;
}

/** Hält den Bildschirm an, solange `active` ist. Gibt zurück, ob die Sperre gerade gehalten wird. */
export function useWakeLock(active: boolean): boolean {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (!active || !wakeLockSupported()) return;
    let lock: Sentinel | null = null;
    let off = false;
    const req = async () => {
      try {
        const l = await (navigator as WakeNav).wakeLock!.request("screen");
        if (off) { void l.release().catch(() => {}); return; }
        lock = l;
        setHeld(true);
      } catch {
        setHeld(false); // z. B. Energiesparmodus oder ohne Nutzer-Geste – Timer läuft trotzdem
      }
    };
    void req();
    const onVis = () => { if (document.visibilityState === "visible" && (!lock || lock.released)) void req(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      off = true;
      document.removeEventListener("visibilitychange", onVis);
      if (lock && !lock.released) void lock.release().catch(() => {});
      setHeld(false);
    };
  }, [active]);
  return held;
}

/* ---------- Signale ---------- */

function play(cues: Cue[]) {
  const set = new Set(cues);
  if (set.has("done")) { sfx.win(); haptic.win(); return; }
  if (set.has("start")) { sfx.hit(); haptic.hit(); return; }
  if (set.has("switch")) { sfx.counter(); haptic.hit(); return; }
  if (set.has("rest")) { sfx.flip(); haptic.select(); return; }
  if (set.has("tick")) { sfx.tap(); haptic.tap(); }
}

/* ---------- Timer ---------- */

const PHASE_LABEL = { prep: "Bereit", work: "Los!", rest: "Pause" } as const;

export function DrillTimer({ config, onFinish, title = "Timer" }: {
  config: TimerConfig;
  onFinish?: () => void;
  title?: string;
}) {
  const plan = useMemo(() => buildPlan(config), [config]);
  const total = planMs(plan);
  const [base, setBase] = useState(0);            // abgelaufene ms bis zur letzten Pause
  const [since, setSince] = useState<number | null>(null); // Startzeitpunkt der laufenden Strecke
  const [, tick] = useState(0);
  const lastRef = useRef(0);
  const finished = useRef(false);
  const doneCb = useRef(onFinish);
  doneCb.current = onFinish;
  const running = since !== null;
  const elapsed = base + (since !== null ? Date.now() - since : 0);
  const v = viewAt(plan, elapsed, config.switchSides);
  const held = useWakeLock(running);
  const canLock = wakeLockSupported();

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const now = base + (Date.now() - (since ?? Date.now()));
      const cues = cuesBetween(plan, lastRef.current, now, config.switchSides);
      lastRef.current = now;
      if (cues.length) play(cues);
      if (now >= total && !finished.current) {
        finished.current = true;
        setBase(total);
        setSince(null);
        doneCb.current?.();
      }
      tick((n) => n + 1);
    }, 200);
    return () => clearInterval(id);
  }, [running, base, since, plan, total, config.switchSides]);

  function toggle() {
    if (running) {
      setBase(elapsed);
      setSince(null);
      sfx.select(); haptic.select();
      return;
    }
    if (v.done) reset(true);
    else { setSince(Date.now()); sfx.select(); haptic.tap(); }
  }
  function reset(start = false) {
    finished.current = false;
    lastRef.current = 0;
    setBase(0);
    setSince(start ? Date.now() : null);
  }

  const seg = v.seg;
  const kind = v.done ? "done" : seg?.kind ?? "prep";
  const R = 52;
  const C = 2 * Math.PI * R;
  const workRounds = config.rounds;
  const label = seg?.label;
  const started = elapsed > 0;

  return (
    <section className={`dt dt-${kind}${running ? " run" : ""}`} aria-label={title}>
      <div className="dt-head">
        <span className="label">{title}</span>
        <span className="label num">
          {v.done ? `${workRounds}/${workRounds}` : `Runde ${seg?.round ?? 1}/${workRounds}`}
        </span>
      </div>
      <div className="dt-body">
        <div className="dt-ring" role="timer" aria-live="off" aria-label={v.done ? "Fertig" : `${PHASE_LABEL[seg!.kind]} – noch ${fmt(v.left)}`}>
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r={R} className="dt-track" />
            <circle cx="60" cy="60" r={R} className="dt-arc" strokeDasharray={C} strokeDashoffset={C * (v.done ? 0 : v.frac)} />
          </svg>
          <div className="dt-center">
            <b className="num dt-time">{v.done ? "✓" : fmt(v.left)}</b>
            <span className="dt-phase">{v.done ? "Fertig" : PHASE_LABEL[seg!.kind]}</span>
          </div>
        </div>
        <div className="dt-info">
          {label && <p className="dt-label"><span className="small muted">{kind === "work" ? "Jetzt" : "Als Nächstes"}</span><b>{label}</b></p>}
          {config.switchSides && kind === "work" && (
            <p className="dt-side small">Seite <b className="num">{v.sideB ? 2 : 1}</b> von 2</p>
          )}
          <p className="small muted dt-meta">
            {config.rounds} × {config.work} s{config.rest ? ` · ${config.rest} s Pause` : ""}{config.switchSides ? " · Seitenwechsel" : ""} · {fmt(total)} gesamt
          </p>
        </div>
      </div>
      <AnimatePresence>
        {running && config.switchSides && kind === "work" && v.sideB && seg && v.left > seg.ms / 2 - 2500 && (
          <motion.div className="dt-switch display" role="status"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}>
            Seite wechseln
          </motion.div>
        )}
      </AnimatePresence>
      <div className="dt-ctrl">
        <button type="button" className={`btn big dt-main ${running ? "" : "primary"}`} onClick={toggle} aria-pressed={running}>
          {running ? "Pause" : v.done ? "Nochmal" : started ? "Weiter" : "Start"}
        </button>
        {started && !v.done && <button type="button" className="btn ghost" onClick={() => reset(false)}>Neu</button>}
      </div>
      <p className="small muted dt-note">
        Signale ohne Stimme: Vibration und kurzer Ton bei Start, Pause{config.switchSides ? ", Seitenwechsel" : ""} und in den letzten 3 Sekunden.
        {" "}{canLock ? (held ? "Bildschirm bleibt an." : "Bildschirm bleibt an, solange der Timer läuft.") : "Tipp: Stell die automatische Sperre kurz länger – dein Gerät hält den Bildschirm nicht selbst an."}
      </p>
    </section>
  );
}
