import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Archetype } from "./engine/types";
import { BELTS } from "./data/campaign";
import { currentBeltIndex, useGame } from "./store";
import { Campaign, NewCards } from "./screens/Campaign";
import { Arena } from "./screens/Arena";
import { DeckBuilder, Library } from "./screens/Deck";
import { Lesson } from "./screens/Lesson";
import { Puzzles } from "./screens/Puzzles";
import { HotSeat } from "./screens/HotSeat";
import { ShareDeck, readDeckFromHash } from "./screens/ShareDeck";
import { TrainerCheck } from "./screens/TrainerCheck";
import { KoerperkarteHub } from "./screens/KoerperkarteHub";
import { ProgramScreen } from "./program/ProgramScreen";
import { StartHero } from "./program/StartHero";
import { JourneyScreen, ReviewCard, type JourneyStart } from "./journey/JourneyScreen";
import { CoachChat } from "./coach";
import { LegalScreen } from "./legal/LegalScreen";
import { LeglockScreen } from "./leglock/LeglockScreen";
import { leglockMenu } from "./leglock/store";
import { useInstallPrompt } from "./pwa";
import { unlockAudio } from "./sound";
import { Sammlung } from "./core2/collection/Sammlung";
import { DailyScreen } from "./core2/daily/DailyScreen";

type Tab = "kampagne" | "raetsel" | "deck" | "mehr";
type Screen = null | "bibliothek" | "hotseat" | "coach" | "share" | "trainer" | "k2" | "start" | "impressum" | "datenschutz" | "journey" | "training" | "leglock" | "sammlung" | "daily";
const TAB_LABEL: Record<Tab, string> = { kampagne: "Kampagne", raetsel: "Rätsel", deck: "Deck", mehr: "Mehr" };

export function App() {
  const g = useGame();
  const [tab, setTab] = useState<Tab>("kampagne");
  const [screen, setScreen] = useState<Screen>(null);
  const [fight, setFight] = useState<Archetype | null>(null);
  const [unlocked, setUnlocked] = useState<string[] | null>(null);
  const [lesson, setLesson] = useState<string[] | null>(null);
  const [journeyStart, setJourneyStart] = useState<JourneyStart>("home");
  const belt = BELTS[currentBeltIndex(g.beaten)];

  // Geteiltes Deck per Link (#deck=…) öffnet direkt den Teilen-Bildschirm
  useEffect(() => { if (readDeckFromHash()) setScreen("share"); }, []);
  // iOS: Audio beim ersten Tippen entsperren
  useEffect(() => {
    const once = () => { unlockAudio(); window.removeEventListener("pointerdown", once); };
    window.addEventListener("pointerdown", once);
    return () => window.removeEventListener("pointerdown", once);
  }, []);

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
  const back = () => setScreen(null);
  function openJourney(v: JourneyStart) { setJourneyStart(v); setScreen("journey"); }
  if (screen === "hotseat") return <HotSeat onBack={back} />;
  if (screen === "coach") return <CoachChat onBack={back} />;
  if (screen === "share") return <ShareDeck onBack={() => { if (location.hash.startsWith("#deck=")) history.replaceState(null, "", location.pathname); back(); }} />;
  if (screen === "trainer") return <TrainerCheck onBack={back} />;
  if (screen === "k2") return <KoerperkarteHub onBack={back} />;
  if (screen === "daily") return <DailyScreen onBack={back} />;
  if (screen === "sammlung") return <div className="app"><main className="main"><Sammlung onBack={back} /></main></div>;
  if (screen === "impressum" || screen === "datenschutz") return <div className="app"><main className="main"><LegalScreen page={screen} onBack={back} /></main></div>;
  if (screen === "start") return <div className="pg-wrap"><ProgramScreen onBack={back} onJourney={openJourney} onLeglock={() => setScreen("leglock")} /></div>;
  if (screen === "leglock") return <div className="pg-wrap"><LeglockScreen onBack={back} /></div>;
  if (screen === "journey" || screen === "training") return <div className="pg-wrap"><JourneyScreen start={screen === "training" ? "training" : journeyStart} onBack={back} /></div>;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand display">Matten<b>karten</b></div>
        <div className="belt-mini" title={belt.name}>
          <div className="beltbar" style={{ ["--belt-c" as any]: belt.color }}><i /></div>
          <span className="label">{belt.name} · <span className="num">{g.xp}</span> XP</span>
        </div>
        <button className="icon-btn" onClick={() => g.set({ sound: !g.sound })} aria-label={g.sound ? "Ton und Vibration aus" : "Ton und Vibration an"}>{g.sound ? "♪" : "–"}</button>
      </header>
      <main className="main">
        <AnimatePresence mode="wait">
          <motion.div key={screen === "bibliothek" ? "bib" : tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .2 }}>
            {screen === "bibliothek" ? (
              <div className="screen"><button className="btn small ghost" onClick={back}>← Zurück</button><Library /></div>
            ) : (
              <>
                {tab === "kampagne" && <><StartHero onOpen={() => setScreen("start")} /><ReviewCard onOpen={openJourney} /><Campaign onFight={setFight} /></>}
                {tab === "raetsel" && <Puzzles onBack={() => setTab("kampagne")} />}
                {tab === "deck" && <DeckBuilder />}
                {tab === "mehr" && <MoreMenu open={setScreen} />}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <nav className="tabs tabs4" aria-label="Bereiche">
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <button key={t} className={tab === t && !screen ? "on" : ""} onClick={() => { setScreen(null); setTab(t); }}>
            {tab === t && !screen && <motion.span layoutId="tabglow" className="tabglow" />}
            <span>{TAB_LABEL[t]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function MoreMenu({ open }: { open: (s: Screen) => void }) {
  const { canInstall, iosHint, promptInstall } = useInstallPrompt();
  const items: { s: Screen; title: string; text: string }[] = [
    { s: "start", title: "7-Tage-Start", text: "Neu hier? In 7 Tagen à 15 Minuten sicher und mit Plan ins erste Training." },
    { s: "leglock", ...leglockMenu() },
    { s: "training", title: "Nach dem Training", text: "Training eintragen, passende Lektion holen, Frage für den Trainer. Dazu Wiederholen und Tagebuch." },
    { s: "k2", title: "Neu: Körperkarte (Prototyp)", text: "Der neue Spielkern: Zonen gewinnen, befreien, passieren, Aufgabe in drei Schritten." },
    { s: "bibliothek", title: "Bibliothek", text: "Alle Karten, „So geht's“-Animationen, Training und dein Fehler-Deck." },
    { s: "hotseat", title: "Duell zu zweit", text: "Am selben Handy gegeneinander – verdeckt wählen, gleichzeitig aufdecken." },
    { s: "coach", title: "KI-Coach", text: "Frag nach Positionen, Techniken und Regeln – in einfachen Worten." },
    { s: "share", title: "Deck teilen", text: "Dein Deck als Code oder Link verschicken – oder eins übernehmen." },
    { s: "trainer", title: "Für Trainer", text: "Prüfliste aller Inhalte, die eine Trainer-Bestätigung brauchen." },
    { s: "daily", title: "Tages-Challenge", text: "Jeden Tag eine neue Lage aus der Körperkarte. Ein Versuch zählt, üben darfst du immer." },
    { s: "sammlung", title: "Sammlung", text: "Alle Körperkarten-Karten nach Position. Umdrehen zeigt das Kurzwissen." },
  ];
  return (
    <div className="screen more">
      <h2 className="display" style={{ fontSize: 32 }}>Mehr</h2>
      <div className="more-list">
        {items.map((it, i) => (
          <motion.button key={it.s} className="more-item" onClick={() => open(it.s)}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <strong className="display">{it.title}</strong>
            <span className="muted small">{it.text}</span>
          </motion.button>
        ))}
      </div>
      <SoundSwitch />
      {canInstall && <button className="btn primary big" onClick={() => promptInstall()}>App installieren</button>}
      {iosHint && <p className="muted small">Als App installieren: Teilen → „Zum Home-Bildschirm“.</p>}
      <p className="muted small">Mattenkarten ersetzt kein Training mit Trainer. Bei Schmerzen: stoppen und Trainer oder Arzt fragen. <a href="/landing/" target="_blank" rel="noopener">Über Mattenkarten</a></p>
      <nav className="more-legal" aria-label="Rechtliches">
        <button type="button" onClick={() => open("impressum")}>Impressum</button>
        <button type="button" onClick={() => open("datenschutz")}>Datenschutz</button>
      </nav>
    </div>
  );
}

/** Master-Schalter für Ton und Vibration (Standard: an, leise). */
function SoundSwitch() {
  const g = useGame();
  return (
    <div className="mk-switch-row">
      <span><strong>Ton und Vibration</strong><span className="muted small">Matte, Atem, Abklopfen, Gong – leise synthetisiert.</span></span>
      <button type="button" role="switch" className="mk-switch" aria-checked={g.sound} aria-label="Ton und Vibration"
        onClick={() => g.set({ sound: !g.sound })} />
    </div>
  );
}
