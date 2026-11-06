// Konzeptkarte „Schutzhaltung“: Tag 2 als kleiner Tipp-Schritt auf der Figur, später als kompakte Erinnerung.
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FightersK2 } from "../core2/ui/FightersK2";
import { sceneOfPos2, scenePoseAny } from "../components/fighters";
import { haptic } from "../haptics";
import { sfx } from "../sound";
import { SCHUTZHALTUNG as C, type ConceptPoint } from "./concepts";
import { Quiz } from "./Quiz";

const POS = "stand" as const;
const TOP = null;
const VIEW = { w: 400, h: 220 };
/** Beschriftungen links/rechts der Figur (viewBox-Koordinaten), Linie führt zum Gelenk. */
const ANCHOR: Record<string, { x: number; y: number }> = {
  kinn: { x: 104, y: 34 }, ruecken: { x: 118, y: 132 }, ellbogen: { x: 206, y: 28 }, haende: { x: 214, y: 104 },
};

/** Tipp-Punkte: Gelenk der blauen Figur (Stand) + Beschriftung daneben. */
function useSpots(points: ConceptPoint[]) {
  return useMemo(() => {
    const { p } = scenePoseAny(sceneOfPos2(POS), TOP);
    return points.map((pt, i) => {
      const j = pt.joint === "torso"
        ? { x: (p.neck.x + p.hip.x) / 2, y: (p.neck.y + p.hip.y) / 2 }
        : pt.joint === "head" ? { x: (p.head.x + p.neck.x) / 2 + 3, y: (p.head.y + p.neck.y) / 2 + 2 } : p[pt.joint];
      const a = ANCHOR[pt.id] ?? { x: 40 + i * 90, y: 20 };
      return { ...pt, jx: j.x, jy: j.y, ax: a.x, ay: a.y, x: (a.x / VIEW.w) * 100, y: (a.y / VIEW.h) * 100 };
    });
  }, [points]);
}

/** Interaktiver Schritt: vier Punkte antippen, danach drei Fragen. */
export function SchutzStep({ onDone }: { onDone: () => void }) {
  const spots = useSpots(C.points);
  const [found, setFound] = useState<string[]>([]);
  const [active, setActive] = useState<ConceptPoint | null>(null);
  const [quiz, setQuiz] = useState(false);
  const all = found.length === C.points.length;

  if (quiz) {
    return (
      <>
        <p className="pg-lead">Kurz geprüft: Schutzhaltung in drei Lagen.</p>
        <Quiz ids={C.questions} kicker="Schutzhaltung" onDone={() => onDone()} />
      </>
    );
  }

  function tapPoint(p: ConceptPoint) {
    setActive(p);
    if (!found.includes(p.id)) {
      const next = [...found, p.id];
      setFound(next);
      if (next.length === C.points.length) { sfx.points(); haptic.win(); } else { sfx.select(); haptic.tap(); }
    } else { sfx.tap(); haptic.tap(); }
  }

  return (
    <div className="pg-panel sh-step">
      <span className="label">Grundkonzept · gilt ab heute überall</span>
      <h3 className="display pg-h">{C.title}</h3>
      <p className="pg-idea">{C.idea}</p>
      <p className="small muted">Du bist <b style={{ color: "var(--gi-p)" }}>blau</b>. Die Schutzhaltung gilt im Stand und unten. Tipp die {C.points.length} Punkte an.</p>
      <div className="sh-figure">
        <FightersK2 pos={POS} top={TOP} part={active ? { side: "p", part: active.part } : null} />
        <svg className="sh-lines" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} aria-hidden="true">
          {spots.map((s) => {
            const on = found.includes(s.id);
            return (
              <g key={s.id} className={on ? "on" : ""}>
                <line x1={s.ax} y1={s.ay} x2={s.jx} y2={s.jy} />
                <circle cx={s.jx} cy={s.jy} r={4.5} />
              </g>
            );
          })}
        </svg>
        {spots.map((s, i) => {
          const on = found.includes(s.id);
          return (
            <motion.button key={s.id} type="button" className={`sh-spot${on ? " on" : ""}${active?.id === s.id ? " sel" : ""}`}
              style={{ left: `${s.x}%`, top: `${s.y}%`, translate: s.ax < s.jx ? "-100% -50%" : "0 -50%" }}
              aria-label={`${s.short}${on ? " (gefunden)" : ""}`} aria-pressed={on}
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 420, damping: 16 }}
              onClick={() => tapPoint(s)}>
              {!on && <motion.i aria-hidden="true" animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0, 0.7] }} transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }} />}
              <span className="num">{on ? "✓" : i + 1}</span><span className="sh-spot-txt">{s.short.split(" ")[0]}</span>
            </motion.button>
          );
        })}
      </div>
      <div className="sh-found" aria-live="polite">
        <AnimatePresence mode="wait">
          {active ? (
            <motion.p key={active.id} className="sh-tip" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <b>{active.short}.</b> {active.text}
            </motion.p>
          ) : (
            <motion.p key="none" className="small muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Noch keiner gefunden.</motion.p>
          )}
        </AnimatePresence>
        <span className="label num">{found.length}/{C.points.length}</span>
      </div>
      {all && <SchutzList />}
      <button type="button" className={`btn big ${all ? "primary" : ""}`} disabled={!all} onClick={() => { sfx.select(); setQuiz(true); }}>
        {all ? "Weiter: 3 Fragen" : `Noch ${C.points.length - found.length} ${C.points.length - found.length === 1 ? "Punkt" : "Punkte"}`}
      </button>
      <Sources />
    </div>
  );
}

function SchutzList() {
  return (
    <motion.ul className="sh-list" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      {C.points.map((p) => <li key={p.id}><b>{p.short}</b> <span className="small muted">– {p.text}</span></li>)}
    </motion.ul>
  );
}

function Sources() {
  return (
    <p className="small muted sh-src">
      Quellen:{" "}
      {C.sources.map((s, i) => (
        <span key={s.url}>{i > 0 ? " · " : ""}<a href={s.url} target="_blank" rel="noopener noreferrer" data-src-mark={s.marketing ? "Marketing" : undefined}>{s.label}</a></span>
      ))}
    </p>
  );
}

/** Kompakte, wiederverwendbare Karte (Tagesübersicht ab Tag 3). Antippen klappt die vier Punkte auf. */
export function SchutzCard() {
  const [open, setOpen] = useState(false);
  return (
    <div className={`sh-card${open ? " open" : ""}`}>
      <button type="button" className="sh-card-head" aria-expanded={open} onClick={() => { sfx.select(); setOpen((o) => !o); }}>
        <span className="sh-card-ico" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="16" height="16"><path d="M8 1.5 2.5 3.5v4c0 3.3 2.3 6 5.5 7 3.2-1 5.5-3.7 5.5-7v-4z" fill="currentColor" /></svg>
        </span>
        <span><b>Schutzhaltung</b> <span className="small muted">· {C.points.map((p) => p.short).join(" · ")}</span></span>
        <span aria-hidden="true" className="sh-card-chev">{open ? "–" : "+"}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
            <SchutzList />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
