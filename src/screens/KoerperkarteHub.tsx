import { useState } from "react";
import { motion } from "framer-motion";
import { ArenaK2 } from "../core2/ui/ArenaK2";
import { TUTORIALS_K2, TUTORIAL_GUARD_ODER_TD } from "../core2/data/tutorials";
import { Bosse, readBeaten } from "../core2/ui/Bosse";
import { BOSSES } from "../core2/data/bosses";

const KEY = "mk.k2.done";
function readDone(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
function writeDone(ids: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* egal */ }
}

type Run = { kind: "tut"; id: string } | { kind: "free"; level: 1 | 2 | 3 } | { kind: "bosses" } | null;
const ALL_TUTS = [...TUTORIALS_K2, TUTORIAL_GUARD_ODER_TD];

/** Prototyp „Körperkarte“: drei Lektionen nach Danaher-Reihenfolge, dann freies Spiel. */
export function KoerperkarteHub({ onBack }: { onBack: () => void }) {
  const [done, setDone] = useState<string[]>(readDone);
  const [run, setRun] = useState<Run>(null);
  const [seed, setSeed] = useState(() => Date.now() % 100000);

  if (run?.kind === "tut") {
    const t = ALL_TUTS.find((x) => x.id === run.id)!;
    return (
      <ArenaK2 key={t.id + seed} mode="tutorial" tutorial={t} aiLevel={t.aiLevel}
        onExit={(won) => {
          if (won && !done.includes(t.id)) { const n = [...done, t.id]; setDone(n); writeDone(n); }
          setRun(null);
        }} />
    );
  }
  if (run?.kind === "bosses") return <Bosse onBack={() => setRun(null)} />;
  if (run?.kind === "free") {
    return <ArenaK2 key={"free" + seed} mode="free" aiLevel={run.level} seed={seed} onExit={() => { setSeed(seed + 1); setRun(null); }} />;
  }

  const allDone = TUTORIALS_K2.every((t) => done.includes(t.id));
  return (
    <div className="screen more">
      <button className="btn small ghost" onClick={onBack}>← Zurück</button>
      <h2 className="display" style={{ fontSize: 30 }}>Körperkarte <span className="muted small">Prototyp</span></h2>
      <p className="muted small">
        Neuer Spielkern: Vier Körperzonen – Kopf, Arme, Hüfte, Beine. Wer Zonen gewinnt, kommt in bessere Positionen.
        Aufgaben brauchen drei Schritte. Erst lernst du dich zu befreien, dann zu passieren, dann zu beenden.
      </p>
      <div className="more-list">
        {TUTORIALS_K2.map((t, i) => {
          const locked = i > 0 && !done.includes(TUTORIALS_K2[i - 1].id);
          return (
            <motion.button key={t.id} className="more-item" disabled={locked} style={locked ? { opacity: .45 } : undefined}
              onClick={() => setRun({ kind: "tut", id: t.id })}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <strong className="display">{done.includes(t.id) ? "✓ " : `${i + 1}. `}{t.title}</strong>
              <span className="muted small">{locked ? "Erst die Lektion davor schaffen." : t.idea}</span>
            </motion.button>
          );
        })}
      </div>
      <h3 className="display" style={{ marginTop: 18 }}>Extra-Lektion</h3>
      <div className="more-list">
        <button className="more-item" onClick={() => setRun({ kind: "tut", id: TUTORIAL_GUARD_ODER_TD.id })}>
          <strong className="display">{done.includes(TUTORIAL_GUARD_ODER_TD.id) ? "✓ " : ""}{TUTORIAL_GUARD_ODER_TD.title}</strong>
          <span className="muted small">{TUTORIAL_GUARD_ODER_TD.idea}</span>
        </button>
      </div>
      <h3 className="display" style={{ marginTop: 18 }}>Freies Spiel</h3>
      {!allDone && <p className="muted small">Tipp: Erst die drei Lektionen – dann verstehst du das Brett sofort.</p>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn" onClick={() => setRun({ kind: "free", level: 1 })}>Locker</button>
        <button className="btn" onClick={() => setRun({ kind: "free", level: 2 })}>Normal</button>
        <button className="btn primary" onClick={() => setRun({ kind: "free", level: 3 })}>Hart</button>
      </div>
      <h3 className="display" style={{ marginTop: 18 }}>Bosse</h3>
      <div className="more-list">
        <button className="more-item" onClick={() => setRun({ kind: "bosses" })}>
          <strong className="display">Bosse · {readBeaten().filter((id) => BOSSES.some((b) => b.id === id)).length}/{BOSSES.length} besiegt</strong>
          <span className="muted small">Vier Gegner mit eigenem Stil: Ringer, Guard, Druck, Rücken. Lern, wie du dagegen spielst.</span>
        </button>
      </div>
    </div>
  );
}
