import { Suspense, lazy, useEffect, useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Archetype } from "./engine/types";
import { BELTS } from "./data/campaign";
import { currentBeltIndex, useGame } from "./store";
import { Campaign, NewCards } from "./screens/Campaign";
import { StartHero } from "./program/StartHero";
import { ReviewCard, type JourneyStart } from "./journey/ReviewCard";
import { leglockMenu } from "./leglock/store";
import { useInstallPrompt } from "./pwa";
import { unlockAudio } from "./sound";
import type { GymStart } from "./gym/GymScreen";
import { RewardToasts } from "./core2/rewards/RewardToasts";
import { useRewards } from "./core2/rewards/store";
import { LadderCard } from "./core2/ladder/LadderBelt";

// Code-Splitting (Bauplan 76): Startseite (Kampagne) lädt sofort, alles andere als eigener Chunk.
// Der Service Worker precacht alle Chunks – offline bleibt alles verfügbar.
const named = <M, K extends keyof M>(load: () => Promise<M>, key: K) =>
  lazy(() => load().then((m) => ({ default: m[key] as unknown as ComponentType<any> })));
const loadArena = () => import("./screens/Arena");
const loadDeck = () => import("./screens/Deck");
const loadPuzzles = () => import("./screens/Puzzles");
const Arena = named(loadArena, "Arena");
const DeckBuilder = named(loadDeck, "DeckBuilder");
const Library = named(loadDeck, "Library");
const Puzzles = named(loadPuzzles, "Puzzles");
const Lesson = named(() => import("./screens/Lesson"), "Lesson");
const HotSeat = named(() => import("./screens/HotSeat"), "HotSeat");
const ShareDeck = named(() => import("./screens/ShareDeck"), "ShareDeck");
const TrainerCheck = named(() => import("./screens/TrainerCheck"), "TrainerCheck");
const KoerperkarteHub = named(() => import("./screens/KoerperkarteHub"), "KoerperkarteHub");
const ProgramScreen = named(() => import("./program/ProgramScreen"), "ProgramScreen");
const WarmupScreen = named(() => import("./program/WarmupScreen"), "WarmupScreen");
const CoachChat = named(() => import("./coach"), "CoachChat");
const LegalScreen = named(() => import("./legal/LegalScreen"), "LegalScreen");
const LeglockScreen = named(() => import("./leglock/LeglockScreen"), "LeglockScreen");
const Sammlung = named(() => import("./core2/collection/Sammlung"), "Sammlung");
const PaketeScreen = named(() => import("./core2/rewards/PaketeScreen"), "PaketeScreen");
const Glossar = named(() => import("./core2/ui/Glossar"), "Glossar");
const Rangliste = named(() => import("./core2/ui/Rangliste"), "Rangliste");
const DailyScreen = named(() => import("./core2/daily/DailyScreen"), "DailyScreen");
const GymScreen = named(() => import("./gym/GymScreen"), "GymScreen");
const JourneyScreen = named(() => import("./journey/JourneyScreen"), "JourneyScreen");

/** Tabs und Kampf nach dem ersten Bild im Leerlauf vorladen, damit der Wechsel sofort geht. */
function prefetchSoon() {
  const run = () => { void loadPuzzles(); void loadDeck(); void loadArena(); };
  const ric = (window as any).requestIdleCallback as undefined | ((f: () => void, o?: object) => void);
  if (ric) ric(run, { timeout: 4000 }); else setTimeout(run, 2500);
}

/** Schlichter Platzhalter, solange ein Bildschirm-Chunk lädt (meist nur Millisekunden aus dem SW-Cache). */
export function ScreenFallback() {
  return <div className="screen-loading" role="status" aria-live="polite"><span className="sr-only">Lädt …</span></div>;
}

type Tab = "kampagne" | "raetsel" | "deck" | "mehr";
type Screen = null | "bibliothek" | "hotseat" | "coach" | "share" | "trainer" | "k2" | "start" | "impressum" | "datenschutz" | "journey" | "training" | "leglock" | "sammlung" | "glossar" | "daily" | "warmup" | "gym" | "pakete" | "rangliste";
const TAB_LABEL: Record<Tab, string> = { kampagne: "Kampagne", raetsel: "Rätsel", deck: "Deck", mehr: "Mehr" };

/** Mechanik 8: Belohnungs-Hinweise liegen über jedem Bildschirm. */
export function App() {
  const [paketeTick, setPaketeTick] = useState(0);
  return (<>
    <AppScreens openPakete={paketeTick} />
    <RewardToasts onOpen={() => setPaketeTick((n) => n + 1)} />
  </>);
}

function AppScreens({ openPakete }: { openPakete: number }) {
  const g = useGame();
  const [tab, setTab] = useState<Tab>("kampagne");
  const [screen, setScreen] = useState<Screen>(null);
  const [fight, setFight] = useState<Archetype | null>(null);
  const [unlocked, setUnlocked] = useState<string[] | null>(null);
  const [lesson, setLesson] = useState<string[] | null>(null);
  const [journeyStart, setJourneyStart] = useState<JourneyStart>("home");
  const [gymStart, setGymStart] = useState<GymStart>("home");
  const belt = BELTS[currentBeltIndex(g.beaten)];

  // Geteiltes Deck per Link (#deck=…) öffnet direkt den Teilen-Bildschirm
  useEffect(() => {
    if (/(?:^#|&)deck=/.test(location.hash)) void import("./screens/ShareDeck").then((m) => { if (m.readDeckFromHash()) setScreen("share"); });
  }, []);
  // Wochenthema per Link (#gym=…) öffnet „Fürs Gym“ mit Übernehmen-Dialog
  useEffect(() => { if (/(?:^#|&)gym=/.test(location.hash)) setScreen("gym"); }, []);
  // Geteilter Spielplan (#plan=…, Mechanik 7) öffnet die Körperkarte im Spielplan-Modus mit dem Spielplan-Bauer
  useEffect(() => { if (/(?:^#|&)plan=/.test(location.hash)) setScreen("k2"); }, []);
  useEffect(prefetchSoon, []);
  // „Ansehen“ im Belohnungs-Hinweis öffnet Pakete & Staub (Kampf vorher beenden wir nicht – im Kampf gibt es keinen Hinweis mit Paket).
  useEffect(() => { if (openPakete) setScreen("pakete"); }, [openPakete]);
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
  if (screen === "rangliste") return <Rangliste onBack={back} />;
  if (screen === "sammlung") return <div className="app"><div className="main"><Sammlung onBack={back} onPakete={() => setScreen("pakete")} /></div></div>;
  if (screen === "pakete") return <div className="app"><div className="main"><PaketeScreen onBack={back} /></div></div>;
  if (screen === "glossar") return <div className="app"><div className="main"><Glossar onBack={back} /></div></div>;
  if (screen === "impressum" || screen === "datenschutz") return <div className="app"><div className="main"><LegalScreen page={screen} onBack={back} /></div></div>;
  if (screen === "gym") return <GymScreen start={gymStart} onBack={() => { setGymStart("home"); back(); }} />;
  if (screen === "warmup") return <div className="pg-wrap"><WarmupScreen onBack={back} /></div>;
  if (screen === "start") return <div className="pg-wrap"><ProgramScreen onBack={back} onJourney={openJourney} onLeglock={() => setScreen("leglock")} onGym={() => { setGymStart("week"); setScreen("gym"); }} /></div>;
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
      <div className="main">
        <Suspense fallback={<ScreenFallback />}>
        <AnimatePresence mode="wait">
          <motion.div key={screen === "bibliothek" ? "bib" : tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .2 }}>
            {screen === "bibliothek" ? (
              <div className="screen"><button className="btn small ghost" onClick={back}>← Zurück</button><Library /></div>
            ) : (
              <>
                {tab === "kampagne" && <><StartHero onOpen={() => setScreen("start")} /><ReviewCard onOpen={openJourney} /><LadderCard onOpen={() => setScreen("rangliste")} /><Campaign onFight={setFight} /></>}
                {tab === "raetsel" && <Puzzles onBack={() => setTab("kampagne")} />}
                {tab === "deck" && <DeckBuilder />}
                {tab === "mehr" && <MoreMenu open={setScreen} />}
              </>
            )}
          </motion.div>
        </AnimatePresence>
        </Suspense>
      </div>
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
  const rw = useRewards();
  const items: { s: Screen; title: string; text: string }[] = [
    { s: "start", title: "7-Tage-Start", text: "Neu hier? In 7 Tagen à 15 Minuten sicher und mit Plan ins erste Training." },
    { s: "leglock", ...leglockMenu() },
    { s: "training", title: "Nach dem Training", text: "Training eintragen, passende Lektion holen, Frage für den Trainer. Dazu Wiederholen und Tagebuch." },
    { s: "k2", title: "Neu: Körperkarte (Prototyp)", text: "Der neue Spielkern: Zonen gewinnen, befreien, passieren, Aufgabe in drei Schritten." },
    { s: "bibliothek", title: "Bibliothek", text: "Alle Karten, „So geht's“-Animationen, Training und dein Fehler-Deck." },
    { s: "warmup", title: "Aufwärmen", text: "5 Minuten No-Gi mit Timer: Brücke, Shrimp, Sprawl, Technical Stand-up, Fallen aus dem Sitz." },
    { s: "hotseat", title: "Duell zu zweit", text: "Am selben Handy gegeneinander – verdeckt wählen, gleichzeitig aufdecken." },
    { s: "coach", title: "KI-Coach", text: "Frag nach Positionen, Techniken und Regeln – in einfachen Worten." },
    { s: "gym", title: "Fürs Gym", text: "Positionsspiele für den Trainer, Partner-Modus zum Vorlesen, Beamer-Ansicht und Wochenthema per Code." },
    { s: "share", title: "Deck teilen", text: "Dein Deck als Code oder Link verschicken – oder eins übernehmen." },
    { s: "trainer", title: "Für Trainer", text: "Prüfliste aller Inhalte, die eine Trainer-Bestätigung brauchen." },
    { s: "rangliste", title: "Rangliste", text: "Spielränge Weiß bis Schwarz gegen die KI, mit Streifen und Saison. Spielrang, kein echter Gürtel." },
    { s: "daily", title: "Tages-Challenge", text: "Jeden Tag eine neue Lage aus der Körperkarte. Ein Versuch zählt, üben darfst du immer." },
    { s: "sammlung", title: "Sammlung", text: "Alle Körperkarten-Karten nach Position. Umdrehen zeigt das Kurzwissen." },
    { s: "pakete", title: rw.packs ? `Pakete & Staub · ${rw.packs} ${rw.packs === 1 ? "Paket wartet" : "Pakete warten"}` : "Pakete & Staub",
      text: `Fürs Lernen und echtes Training gibt es Kartenpakete. Kein Echtgeld, Chancen offen. ${rw.staub} Mattenstaub.` },
    { s: "glossar", title: "Glossar", text: "Schlüsselwörter wie Keil, Rahmen, Dilemma – Regel im Spiel und im echten Grappling." },
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
