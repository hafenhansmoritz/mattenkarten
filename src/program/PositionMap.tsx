import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { mulberry32, shuffle } from "../engine/rng";
import { FightersK2 } from "../core2/ui/FightersK2";
import type { Pos2, Side } from "../core2/types";
import { Stamp } from "../components/fx";
import { sfx } from "../sound";

// Tag 1 – Positions-Landkarte (kein Match). Hierarchie nach KB 3.2 (JitsuIQ):
// Rücken > Mount > Side Control > Guard > Side Control unten > Mount unten.

export interface MapSpot { id: string; pos: Pos2; top: Side | null; name: string; you: string }

export const LADDER: MapSpot[] = [
  { id: "back-top", pos: "back", top: "p", name: "Rücken", you: "du hinter ihm" },
  { id: "mount-top", pos: "mount", top: "p", name: "Mount", you: "du sitzt oben" },
  { id: "side-top", pos: "side", top: "p", name: "Seitenkontrolle", you: "du liegst quer oben" },
  { id: "guard", pos: "guard", top: "o", name: "Guard", you: "du unten, Beine um ihn" },
  { id: "side-bottom", pos: "side", top: "o", name: "Seitenkontrolle", you: "du liegst unten" },
  { id: "mount-bottom", pos: "mount", top: "o", name: "Mount", you: "er sitzt auf dir" },
];

export interface GoalTask { spot: MapSpot; options: string[]; answer: number; why: string }

export const GOALS: GoalTask[] = [
  { spot: LADDER[5], options: ["Schützen, Platz schaffen, raus", "Halten und aufsteigen"], answer: 0,
    why: "Unten heißt: erst überleben und schützen, dann entkommen." },
  { spot: LADDER[2], options: ["Ruhig halten, aufsteigen, dann beenden", "Schnell loslassen"], answer: 0,
    why: "Oben heißt: stabil halten, Flucht verhindern, aufsteigen." },
  { spot: LADDER[3], options: ["Haltung brechen, umdrehen oder angreifen", "Flach liegen und warten"], answer: 0,
    why: "In der Guard bist du unten nicht verloren. Du kannst ihn umwerfen oder angreifen." },
  { spot: LADDER[0], options: ["Haken drin lassen, Hals angreifen", "Ihn loslassen, damit er sich umdreht"], answer: 0,
    why: "Am Rücken bist du meist am stärksten. Halte ihn fest, dann beenden." },
];

type Phase = "intro" | "sort" | "goals" | "tap" | "done";

export function PositionMap({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("intro");
  return (
    <div className="pg-map">
      <AnimatePresence mode="wait">
        <motion.div key={phase} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.22 }}>
          {phase === "intro" && (
            <div className="pg-panel">
              <span className="label">Lektion · Positions-Landkarte</span>
              <h3 className="display pg-h">Wo stehst du?</h3>
              <p>Am Boden gibt es Lagen, die gut für dich sind – und schlechte. Wer die Landkarte kennt, weiß sein Ziel.</p>
              <div className="pg-legend small"><i className="dot p" /> Du bist blau <i className="dot o" /> Er ist rot</div>
              <button className="btn primary big" onClick={() => setPhase("sort")}>Los</button>
            </div>
          )}
          {phase === "sort" && <SortLadder onDone={() => setPhase("goals")} />}
          {phase === "goals" && <GoalPick onDone={() => setPhase("tap")} />}
          {phase === "tap" && <TapDrill onDone={() => setPhase("done")} />}
          {phase === "done" && (
            <div className="pg-panel center">
              <h3 className="display pg-h">Landkarte sitzt!</h3>
              <p>Gute Lagen oben: Rücken, Mount, Seitenkontrolle. Unten ist die Guard dein Zuhause.</p>
              <button className="btn primary big" onClick={onDone}>Weiter zum Rätsel</button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Tippe die Lagen von „am besten für dich“ bis „am schlechtesten“. */
function SortLadder({ onDone }: { onDone: () => void }) {
  const pool = useMemo(() => shuffle(LADDER, mulberry32(Date.now() % 9973 || 3)), []);
  const [placed, setPlaced] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [stamp, setStamp] = useState(0);
  const nextId = LADDER[placed.length]?.id;
  const finished = placed.length === LADDER.length;

  function tap(s: MapSpot) {
    if (placed.includes(s.id) || finished) return;
    if (s.id === nextId) {
      sfx.select();
      const n = [...placed, s.id];
      setPlaced(n); setWrong(null);
      if (n.length === LADDER.length) { sfx.win(); setStamp((k) => k + 1); }
    } else {
      sfx.lose(); setWrong(s.id);
    }
  }
  const hint = wrong ? hintFor(placed.length) : null;

  return (
    <div className="pg-panel pg-rel">
      <span className="label">Schritt 1 von 3</span>
      <h3 className="display pg-h">Von gut nach schlecht</h3>
      <p className="small muted">Tippe die Lage, die für <b>dich</b> am besten ist. Dann die nächste.</p>
      <ol className="pg-ladder" aria-label="Deine Reihenfolge">
        {LADDER.map((s, i) => {
          const on = placed[i];
          return (
            <li key={s.id} className={on ? "on" : ""}>
              <span className="num pg-rank">{i + 1}</span>
              {on ? (
                <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  <b>{s.name}</b> <span className="muted small">– {s.you}</span>
                </motion.span>
              ) : <span className="muted small">{i === 0 ? "am besten für dich" : i === LADDER.length - 1 ? "am schlechtesten" : "…"}</span>}
            </li>
          );
        })}
      </ol>
      <AnimatePresence>
        {hint && <motion.p key={placed.length} className="pg-hint small" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{hint}</motion.p>}
      </AnimatePresence>
      <div className="pg-spots">
        {pool.map((s) => {
          const used = placed.includes(s.id);
          return (
            <motion.button key={s.id} type="button" className={`pg-spot ${used ? "used" : ""} ${wrong === s.id ? "bad" : ""}`}
              onClick={() => tap(s)} disabled={used}
              animate={wrong === s.id ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0, opacity: used ? 0.25 : 1, scale: used ? 0.94 : 1 }}
              whileTap={used ? undefined : { scale: 0.95 }} transition={{ duration: 0.3 }}>
              <span className="pg-spot-fig" aria-hidden="true"><FightersK2 pos={s.pos} top={s.top} /></span>
              <b>{s.name}</b>
              <span className="small muted">{s.you}</span>
            </motion.button>
          );
        })}
      </div>
      {stamp > 0 && <Stamp key={stamp} text="SORTIERT!" tone="good" />}
      {finished && <button className="btn primary big" onClick={onDone}>Weiter</button>}
    </div>
  );
}

function hintFor(i: number): string {
  switch (i) {
    case 0: return "Tipp: Am stärksten bist du hinter ihm – er sieht dich kaum.";
    case 1: return "Tipp: Danach kommt Draufsitzen (Mount).";
    case 2: return "Tipp: Danach kommt quer oben liegen: Seitenkontrolle (Side Control).";
    case 3: return "Tipp: Ausgeglichen ist die Guard. Deine Beine schützen dich.";
    case 4: return "Tipp: Unter der Seitenkontrolle ist schlecht, unter dem Mount noch schlechter.";
    default: return "Tipp: Was bleibt übrig?";
  }
}

/** Oben- oder Unten-Ziel wählen. */
function GoalPick({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const t = GOALS[i];
  const ok = picked === t.answer;
  return (
    <div className="pg-panel">
      <span className="label">Schritt 2 von 3 · {i + 1}/{GOALS.length}</span>
      <h3 className="display pg-h">Was ist dein Ziel?</h3>
      <div className="pg-qscene" aria-hidden="true"><FightersK2 pos={t.spot.pos} top={t.spot.top} /></div>
      <p><b>{t.spot.name}</b> – {t.spot.you}.</p>
      <div className="pg-opts">
        {t.options.map((o, k) => {
          const cls = picked === null ? "" : k === t.answer ? "right" : k === picked ? "wrong" : "dim";
          return <button key={k} type="button" className={`pg-opt ${cls}`} disabled={picked !== null && ok}
            onClick={() => { if (ok) return; setPicked(k); (k === t.answer ? sfx.points : sfx.lose)(); }}>{o}</button>;
        })}
      </div>
      {picked !== null && (
        <motion.div className={`pg-why ${ok ? "ok" : "no"}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <strong className="display">{ok ? "Genau!" : "Nicht ganz – probier die andere."}</strong>
          {ok && <p>{t.why}</p>}
          {ok && <button className="btn primary big pg-next" onClick={() => {
            if (i + 1 >= GOALS.length) onDone(); else { setI(i + 1); setPicked(null); }
          }}>Weiter</button>}
        </motion.div>
      )}
    </div>
  );
}

/** Abklopfen üben: deutlich und mehrmals. */
function TapDrill({ onDone }: { onDone: () => void }) {
  const [taps, setTaps] = useState(0);
  const need = 3;
  const done = taps >= need;
  return (
    <div className="pg-panel center pg-rel">
      <span className="label">Schritt 3 von 3</span>
      <h3 className="display pg-h">Abklopfen</h3>
      <p>Ein Griff sitzt. Klopf <b>deutlich und mehrmals</b> auf deinen Partner – tippe {need}×.</p>
      <motion.button type="button" className={`pg-tap ${done ? "done" : ""}`} aria-label="Abklopfen"
        onClick={() => { if (done) return; const n = taps + 1; setTaps(n); sfx.tap(); if (n >= need) sfx.win(); }}
        whileTap={{ scale: 0.88 }} animate={done ? { scale: [1, 1.08, 1] } : undefined}>
        <span className="display">{done ? "LOSGELASSEN" : "TAP"}</span>
        <span className="pg-tap-dots">{Array.from({ length: need }, (_, k) => <i key={k} className={k < taps ? "on" : ""} />)}</span>
      </motion.button>
      {done && (
        <motion.div className="pg-why ok" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p>Dein Partner lässt sofort los. Hände fest? Dann mit dem Fuß klopfen oder laut „Tap“ sagen.</p>
          <button className="btn primary big pg-next" onClick={onDone}>Weiter</button>
        </motion.div>
      )}
    </div>
  );
}
