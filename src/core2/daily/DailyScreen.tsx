// Kern 2 – Tages-Challenge (Schritt 74): Karte des Tages, ein gewerteter Versuch, danach üben.
// Bewusst ohne Serie: Wer einen Tag auslässt, verliert nichts.
import { useState } from "react";
import { motion } from "framer-motion";
import type { State2 } from "../types";
import { ArenaK2 } from "../ui/ArenaK2";
import { posLabel } from "../collection/Sammlung";
import { dailyFor, dailySuccess, dateKey, toTutorial } from "./daily";
import { recordDaily, useDailyLog, type DailyEntry } from "./store";
import "../../styles/core2.css";
import "../../styles/sammlung.css";

const fmtDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
};

export function DailyScreen({ onBack }: { onBack: () => void }) {
  const [key] = useState(() => dateKey());
  const { def, seed } = dailyFor(key);
  const log = useDailyLog();
  const today: DailyEntry | undefined = log[key];
  const [run, setRun] = useState<null | { practice: boolean; n: number }>(null);
  const [practiceN, setPracticeN] = useState(0);
  const [lastPractice, setLastPractice] = useState<boolean | null>(null);

  if (run) {
    const t = toTutorial(def, run.practice ? seed + run.n * 131 : seed);
    return (
      <ArenaK2 key={`${key}-${run.practice}-${run.n}`} mode="tutorial" tutorial={t} aiLevel={def.aiLevel}
        onResult={(s: State2) => {
          const won = dailySuccess(def, s.result);
          if (!run.practice && !log[key]) recordDaily(key, { id: def.id, won, rounds: s.history.length, pts: [s.p.pts, s.o.pts] });
          if (run.practice) setLastPractice(won);
        }}
        verdict={(s: State2) => {
          const ok = dailySuccess(def, s.result);
          const tag = run.practice ? "Übung" : "Tages-Challenge";
          return { ok, text: ok ? `✓ ${tag} geschafft!` : `${tag} nicht geschafft – ${def.goal ? "Ziel-Lage nicht erreicht" : "nicht beendet"}. Punkte zählen hier nicht.` };
        }}
        onExit={() => setRun(null)} />
    );
  }

  const roleTxt = def.start.top === null ? "neutral" : def.start.top === "p" ? "du oben" : "du unten";
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const [y, m, d] = key.split("-").map(Number);
    return dateKey(new Date(y, m - 1, d - 13 + i));
  });
  const totalWon = Object.values(log).filter((e) => e.won).length;

  return (
    <div className="screen dc-wrap" lang="de">
      <button className="btn small ghost" onClick={onBack}>← Zurück</button>
      <h2 className="display" style={{ fontSize: 32, margin: 0 }}>Tages-Challenge</h2>
      <motion.article className="dc-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <span className="dc-date">{fmtDate(key)}</span>
        <h3 className="display">{def.title}</h3>
        <p className="dc-task">{def.task}</p>
        <div className="dc-meta">
          <span className="dc-chip">{posLabel(def.start.pos)} · {roleTxt}</span>
          <span className="dc-chip">{def.rounds} Runden</span>
          <span className="dc-chip">{def.goal ? "Ziel: Lage erreichen" : "Ziel: beenden"}</span>
        </div>
        <p className="muted small">Tipp: {def.idea}</p>

        {today ? (
          <div className={`dc-result ${today.won ? "won" : "lost"}`} aria-live="polite">
            <span className="display">{today.won ? "Geschafft!" : "Heute nicht geschafft"}</span>
            <span className="muted small">Gewerteter Versuch: {today.rounds} Runden · {today.pts[0]}:{today.pts[1]} Punkte</span>
            <span className="small">{today.won ? "Stark. Morgen wartet eine neue Lage." : "Kein Problem – genau so lernt man. Üb sie noch einmal oder komm morgen wieder."}</span>
          </div>
        ) : (
          <p className="small">Ein gewerteter Versuch pro Tag. Danach kannst du so oft üben, wie du willst.</p>
        )}
        {lastPractice !== null && <p className="small muted">Letzte Übung: {lastPractice ? "geschafft ✓" : "nicht geschafft – weiter so"}</p>}

        <div className="dc-btns">
          {!today && <button className="btn primary big" onClick={() => setRun({ practice: false, n: 0 })}>Los geht's</button>}
          {today && <button className="btn primary" onClick={() => { const n = practiceN + 1; setPracticeN(n); setRun({ practice: true, n }); }}>Üben</button>}
        </div>
      </motion.article>

      <section aria-label="Letzte 14 Tage">
        <h3 className="display" style={{ margin: "0 0 6px" }}>Letzte 14 Tage</h3>
        <div className="dc-hist">
          {last14.map((k) => {
            const e = log[k];
            return <span key={k} className={`dc-dot ${e ? (e.won ? "won" : "lost") : ""}`} title={`${k}: ${e ? (e.won ? "geschafft" : "versucht") : "–"}`}>{e ? (e.won ? "✓" : "·") : ""}</span>;
          })}
        </div>
        <p className="muted small" style={{ marginTop: 6 }}>{totalWon} Challenges geschafft. Keine Serie, kein Druck: Jeder Tag zählt für sich.</p>
      </section>
    </div>
  );
}
