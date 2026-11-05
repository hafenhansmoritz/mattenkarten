import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Archetype } from "./engine/types";
import { BELTS } from "./data/campaign";
import { currentBeltIndex, useGame } from "./store";
import { Campaign, NewCards } from "./screens/Campaign";
import { Arena } from "./screens/Arena";
import { DeckBuilder, Library } from "./screens/Deck";
import { Lesson } from "./screens/Lesson";

type Tab = "kampagne" | "deck" | "bibliothek";

export function App() {
  const g = useGame();
  const [tab, setTab] = useState<Tab>("kampagne");
  const [fight, setFight] = useState<Archetype | null>(null);
  const [unlocked, setUnlocked] = useState<string[] | null>(null);
  const [lesson, setLesson] = useState<string[] | null>(null);
  const belt = BELTS[currentBeltIndex(g.beaten)];

  function exitFight(won: boolean | null) {
    const a = fight!;
    setFight(null);
    if (won === null) return;
    if (won) {
      g.set({ wins: g.wins + 1 }); g.addXP(a.boss ? 150 : 60);
      const fresh = g.winAgainst(a.id);
      if (fresh.length) setUnlocked(fresh);
    } else { g.set({ losses: g.losses + 1 }); g.addXP(15); }
  }

  if (fight) return <Arena key={fight.id + g.wins + g.losses} arch={fight} onExit={exitFight} />;
  if (unlocked) return <NewCards ids={unlocked} onDone={() => { setLesson(unlocked); setUnlocked(null); }} />;
  if (lesson) return <Lesson ids={lesson} onDone={() => setLesson(null)} />;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand display">Matten<b>karten</b></div>
        <div className="belt-mini" title={belt.name}>
          <div className="beltbar" style={{ ["--belt-c" as any]: belt.color }}><i /></div>
          <span className="label">{belt.name} · <span className="num">{g.xp}</span> XP</span>
        </div>
        <button className="icon-btn" onClick={() => g.set({ sound: !g.sound })} aria-label={g.sound ? "Ton aus" : "Ton an"}>{g.sound ? "♪" : "–"}</button>
      </header>
      <main className="main">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .2 }}>
            {tab === "kampagne" && <Campaign onFight={setFight} />}
            {tab === "deck" && <DeckBuilder />}
            {tab === "bibliothek" && <Library />}
          </motion.div>
        </AnimatePresence>
      </main>
      <nav className="tabs" aria-label="Bereiche">
        {(["kampagne", "deck", "bibliothek"] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
            {tab === t && <motion.span layoutId="tabglow" className="tabglow" />}
            <span>{t === "kampagne" ? "Kampagne" : t === "deck" ? "Deck" : "Bibliothek"}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
