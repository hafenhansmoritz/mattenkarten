// Bauplan 73: Bosse mit Spielstil – Auswahl mit Freischalt-Reihenfolge, Kartenbild (Fighters), Intro und Kampf.
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BOSSES, type BossDef } from "../data/bosses";
import { ArenaK2 } from "./ArenaK2";
import { FightersK2 } from "./FightersK2";
import { POS_LABEL } from "./meta";
import "../../styles/core2.css";

const KEY = "mk.k2.bosses";
export function readBeaten(): string[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
}
function writeBeaten(ids: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* egal */ }
}
/** Boss i ist offen, wenn alle davor besiegt sind. */
export function bossUnlocked(i: number, beaten: string[]): boolean {
  return BOSSES.slice(0, i).every((b) => beaten.includes(b.id));
}

const PRONOUN: Record<BossDef["id"], "er" | "sie"> = { ringer: "er", guard: "sie", druecker: "er", ruecken: "sie" };

export function Bosse({ onBack }: { onBack: () => void }) {
  const [beaten, setBeaten] = useState<string[]>(readBeaten);
  const [open, setOpen] = useState<BossDef["id"] | null>(() => BOSSES.find((b, i) => bossUnlocked(i, readBeaten()) && !readBeaten().includes(b.id))?.id ?? null);
  const [fight, setFight] = useState<{ id: BossDef["id"]; seed: number } | null>(null);
  const reduced = !!useReducedMotion();

  if (fight) {
    const b = BOSSES.find((x) => x.id === fight.id)!;
    return (
      <ArenaK2 key={b.id + fight.seed} mode="free" boss={b} seed={fight.seed}
        onExit={(won) => {
          if (won && !beaten.includes(b.id)) { const n = [...beaten, b.id]; setBeaten(n); writeBeaten(n); }
          setFight(null);
        }} />
    );
  }

  return (
    <div className="screen more k2-bosses">
      <button className="btn small ghost" onClick={onBack}>← Zurück</button>
      <h2 className="display" style={{ fontSize: 30 }}>Bosse</h2>
      <p className="muted small">Jeder Boss hat einen eigenen Stil. Lies, was er gern macht – und spiel genau dagegen. Besiege einen, dann kommt der nächste.</p>
      <div className="k2-boss-list">
        {BOSSES.map((b, i) => {
          const unlocked = bossUnlocked(i, beaten);
          const done = beaten.includes(b.id);
          const isOpen = open === b.id && unlocked;
          const pr = PRONOUN[b.id];
          return (
            <motion.article key={b.id} className={`k2-boss${unlocked ? "" : " locked"}${done ? " beaten" : ""}${isOpen ? " open" : ""}`}
              initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduced ? 0 : i * 0.06 }}>
              <button type="button" className="k2-boss-head" disabled={!unlocked} aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : b.id)}>
                <span className="k2-boss-art" aria-hidden>
                  <FightersK2 pos={b.scene.pos} top={b.scene.top} />
                  <span className="k2-boss-n">{i + 1}</span>
                </span>
                <span className="k2-boss-meta">
                  <strong className="display">{done ? "✓ " : ""}{b.name}</strong>
                  <span className="muted small">{unlocked ? b.tagline : `Erst ${BOSSES[i - 1].name} besiegen.`}</span>
                  <span className="k2-boss-chips">
                    <span className="k2-boss-chip">Stufe {b.level}</span>
                    <span className="k2-boss-chip">Liebt: {POS_LABEL[b.scene.pos]}</span>
                  </span>
                </span>
              </button>
              {isOpen && (
                <motion.div className="k2-boss-body" initial={reduced ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                  <h4>Was {pr} gern macht</h4>
                  <p>{b.likes}</p>
                  <h4>Wie du dagegen spielst</h4>
                  <p>{b.howTo}</p>
                  {b.mma && <p className="k2-boss-mma">{b.mma}</p>}
                  <button type="button" className="btn primary" onClick={() => setFight({ id: b.id, seed: Date.now() % 100000 })}>
                    {done ? "Nochmal kämpfen" : "Kämpfen!"}
                  </button>
                </motion.div>
              )}
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
