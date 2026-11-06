import { useState } from "react";
import { motion } from "framer-motion";
import { ArenaK2 } from "../core2/ui/ArenaK2";
import { TUTORIALS_K2, TUTORIAL_GUARD_ODER_TD } from "../core2/data/tutorials";
import { Bosse, readBeaten } from "../core2/ui/Bosse";
import { BOSSES } from "../core2/data/bosses";
import { Glossar } from "../core2/ui/Glossar";
import { StilWahl } from "../core2/ui/StilWahl";
import { randomStil } from "../core2/data/stile";
import type { StilId } from "../core2/types";
import { SpielplanModus } from "../core2/ui/SpielplanModus";
import { PLAN_RULE } from "../core2/data/plans";
import { DraftModus, DRAFT_RULE } from "../core2/ui/DraftModus";
import { Rangliste, LADDER_RULE } from "../core2/ui/Rangliste";

const KEY = "mk.k2.done";
function readDone(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
function writeDone(ids: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* egal */ }
}

type Run = { kind: "tut"; id: string } | { kind: "stilwahl"; level: 1 | 2 | 3 } | { kind: "free"; level: 1 | 2 | 3; stil: StilId; foe: StilId }
  | { kind: "bosses" } | { kind: "glossar" } | { kind: "plan" } | { kind: "draft" } | { kind: "rangliste" } | null;
const LEVEL_NAME: Record<1 | 2 | 3, string> = { 1: "Locker", 2: "Normal", 3: "Hart" };
const ALL_TUTS = [...TUTORIALS_K2, TUTORIAL_GUARD_ODER_TD];

/** Prototyp „Körperkarte“: drei Lektionen nach Danaher-Reihenfolge, dann freies Spiel. */
export function KoerperkarteHub({ onBack }: { onBack: () => void }) {
  const [done, setDone] = useState<string[]>(readDone);
  const [run, setRun] = useState<Run>(() => (typeof location !== "undefined" && /(?:^#|&)plan=/.test(location.hash) ? { kind: "plan" } : null));
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
  if (run?.kind === "glossar") return <Glossar onBack={() => setRun(null)} />;
  if (run?.kind === "plan") return <SpielplanModus onBack={() => setRun(null)} />;
  if (run?.kind === "draft") return <DraftModus onBack={() => setRun(null)} />;
  if (run?.kind === "rangliste") return <Rangliste onBack={() => setRun(null)} />;
  if (run?.kind === "stilwahl") {
    // Mechanik 5: vor dem freien Spiel das A-Game wählen; der Gegner bekommt einen zufälligen Stil.
    const lv = run.level;
    return <StilWahl context={`Freies Spiel · ${LEVEL_NAME[lv]}`} onBack={() => setRun(null)}
      onPick={(id) => setRun({ kind: "free", level: lv, stil: id, foe: randomStil(Math.random) })} />;
  }
  if (run?.kind === "free") {
    return <ArenaK2 key={"free" + seed} mode="free" aiLevel={run.level} seed={seed} stil={run.stil} foeStil={run.foe}
      onExit={() => { setSeed(seed + 1); setRun(null); }} />;
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
        <button className="btn" onClick={() => setRun({ kind: "stilwahl", level: 1 })}>Locker</button>
        <button className="btn" onClick={() => setRun({ kind: "stilwahl", level: 2 })}>Normal</button>
        <button className="btn primary" onClick={() => setRun({ kind: "stilwahl", level: 3 })}>Hart</button>
      </div>
      <h3 className="display" style={{ marginTop: 18 }}>Spielplan-Modus</h3>
      <div className="more-list">
        <button className="more-item" onClick={() => setRun({ kind: "plan" })}>
          <strong className="display">Spielplan-Modus (neu)</strong>
          <span className="muted small">{PLAN_RULE[0]} {PLAN_RULE[1]} Neu: eigene Pläne bauen und vor dem Boss anpassen.</span>
        </button>
      </div>
      <h3 className="display" style={{ marginTop: 18 }}>Draft</h3>
      <div className="more-list">
        <button className="more-item" onClick={() => setRun({ kind: "draft" })}>
          <strong className="display">Draft (neu)</strong>
          <span className="muted small">{DRAFT_RULE[0]} {DRAFT_RULE[1]}</span>
        </button>
      </div>
      <h3 className="display" style={{ marginTop: 18 }}>Rangliste</h3>
      <div className="more-list">
        <button className="more-item" onClick={() => setRun({ kind: "rangliste" })}>
          <strong className="display">Rangliste (neu)</strong>
          <span className="muted small">Spielränge Weiß bis Schwarz gegen die KI. {LADDER_RULE[0]} Spielrang, kein echter Gürtel.</span>
        </button>
      </div>
      <h3 className="display" style={{ marginTop: 18 }}>Bosse</h3>
      <div className="more-list">
        <button className="more-item" onClick={() => setRun({ kind: "bosses" })}>
          <strong className="display">Bosse · {readBeaten().filter((id) => BOSSES.some((b) => b.id === id)).length}/{BOSSES.length} besiegt</strong>
          <span className="muted small">Vier Gegner mit eigenem Stil: Ringer, Guard, Druck, Rücken. Lern, wie du dagegen spielst.</span>
        </button>
      </div>
      <h3 className="display" style={{ marginTop: 18 }}>Glossar</h3>
      <div className="more-list">
        <button className="more-item" onClick={() => setRun({ kind: "glossar" })}>
          <strong className="display">Schlüsselwörter</strong>
          <span className="muted small">Keil, Rahmen, Takedown, Pass, Flucht, Aufgabe, Dilemma, Atem, Spielstil, Spielplan – jedes Wort heißt immer dieselbe Regel.</span>
        </button>
      </div>
    </div>
  );
}
