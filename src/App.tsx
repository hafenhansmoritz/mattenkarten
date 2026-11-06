import { Suspense, lazy, useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Archetype } from "./engine/types";
import { useGame } from "./store";
import { NewCards } from "./screens/Campaign";
import type { JourneyStart } from "./journey/ReviewCard";
import { unlockAudio } from "./sound";
import type { GymStart } from "./gym/GymScreen";
import { RewardToasts } from "./core2/rewards/RewardToasts";
import { useRewards } from "./core2/rewards/store";
import { useCollection } from "./core2/collection/store";
import { StartTab } from "./home/StartTab";
import { HeaderBelt } from "./home/HeaderBelt";
import { TAB_LABEL, type Tab, type Target } from "./home/nav";
import type { K2Run } from "./screens/KoerperkarteHub";
import { useBackLayer } from "./home/backstack";
import { dismissAllToasts } from "./core2/rewards/store";
import "./home/home.css";

// Code-Splitting (Bauplan 76): Startseite lädt sofort, alles andere als eigener Chunk.
// Der Service Worker precacht alle Chunks – offline bleibt alles verfügbar.
const named = <M, K extends keyof M>(load: () => Promise<M>, key: K) =>
  lazy(() => load().then((m) => ({ default: m[key] as unknown as ComponentType<any> })));
const loadArena = () => import("./screens/Arena");
const loadHub = () => import("./screens/KoerperkarteHub");
const loadUeben = () => import("./home/UebenTab");
const Arena = named(loadArena, "Arena");
const Lesson = named(() => import("./screens/Lesson"), "Lesson");
const HotSeat = named(() => import("./screens/HotSeat"), "HotSeat");
const TrainerCheck = named(() => import("./screens/TrainerCheck"), "TrainerCheck");
const SpielenHome = named(loadHub, "SpielenHome");
const K2RunView = named(loadHub, "K2RunView");
const UebenTab = named(loadUeben, "UebenTab");
const GymTab = named(() => import("./home/GymTab"), "GymTab");
const SettingsScreen = named(() => import("./home/SettingsScreen"), "SettingsScreen");
const KlassikScreen = named(() => import("./home/KlassikScreen"), "KlassikScreen");
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
  const run = () => { void loadHub(); void loadUeben(); void import("./core2/ui/ArenaK2"); };
  const ric = (window as any).requestIdleCallback as undefined | ((f: () => void, o?: object) => void);
  if (ric) ric(run, { timeout: 4000 }); else setTimeout(run, 2500);
}

/** Schlichter Platzhalter, solange ein Bildschirm-Chunk lädt (meist nur Millisekunden aus dem SW-Cache). */
export function ScreenFallback() {
  return <div className="screen-loading" role="status" aria-live="polite"><span className="sr-only">Lädt …</span></div>;
}

type Screen = null | "program" | "journey" | "leglock" | "warmup" | "glossar" | "gym" | "hotseat" | "trainer" | "coach"
  | "sammlung" | "pakete" | "rangliste" | "daily" | "settings" | "klassik" | "impressum" | "datenschutz" | "k2";

/** Mechanik 8: Belohnungs-Hinweise liegen über jedem Bildschirm. */
export function App() {
  const [paketeTick, setPaketeTick] = useState(0);
  return (<>
    <AppScreens openPakete={paketeTick} />
    <RewardToasts onOpen={() => setPaketeTick((n) => n + 1)} />
  </>);
}

/** Unterbildschirm mit Seitenrand (wie .app .main), aber ohne Tab-Leiste. */
function Sub({ children }: { children: ReactNode }) {
  return <div className="sub-wrap"><Suspense fallback={<ScreenFallback />}>{children}</Suspense></div>;
}

function AppScreens({ openPakete }: { openPakete: number }) {
  const g = useGame();
  const rw = useRewards();
  const col = useCollection();
  const [tab, setTab] = useState<Tab>("start");
  const [screen, setScreen] = useState<Screen>(null);
  const [k2run, setK2run] = useState<K2Run | null>(null);
  const [fight, setFight] = useState<Archetype | null>(null);
  const [unlocked, setUnlocked] = useState<string[] | null>(null);
  const [lesson, setLesson] = useState<string[] | null>(null);
  const [journeyStart, setJourneyStart] = useState<JourneyStart>("home");
  const [gymStart, setGymStart] = useState<GymStart>("home");
  const [klassikStart, setKlassikStart] = useState<"kampagne" | "teilen">("kampagne");

  // Geteiltes Deck per Link (#deck=…) öffnet „Klassik“ beim Teilen-Bildschirm
  useEffect(() => {
    if (/(?:^#|&)deck=/.test(location.hash)) void import("./screens/ShareDeck").then((m) => { if (m.readDeckFromHash()) { setKlassikStart("teilen"); setScreen("klassik"); } });
  }, []);
  // Wochenthema per Link (#gym=…) öffnet „Fürs Gym“ mit Übernehmen-Dialog
  useEffect(() => { if (/(?:^#|&)gym=/.test(location.hash)) setScreen("gym"); }, []);
  // Geteilter Spielplan (#plan=…, Mechanik 7) öffnet den Spielplan-Modus mit dem Spielplan-Bauer
  useEffect(() => { if (/(?:^#|&)plan=/.test(location.hash)) { setK2run({ kind: "plan" }); setScreen("k2"); } }, []);
  useEffect(prefetchSoon, []);
  // „Ansehen“ im Belohnungs-Hinweis öffnet Pakete & Staub.
  useEffect(() => { if (openPakete) setScreen("pakete"); }, [openPakete]);
  // iOS: Audio beim ersten Tippen entsperren
  useEffect(() => {
    const once = () => { unlockAudio(); window.removeEventListener("pointerdown", once); };
    window.addEventListener("pointerdown", once);
    return () => window.removeEventListener("pointerdown", once);
  }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [tab, screen]);
  // Android-/Browser-Zurück (UX-Review 2, Punkt 8): Unterbildschirm → Tab → Start, erst dann raus aus der App.
  const backTo = (s: Screen): Screen => (s === "klassik" || s === "impressum" || s === "datenschutz" ? "settings" : null);
  useBackLayer(tab !== "start", () => setTab("start"));
  useBackLayer(screen !== null, () => { if (screen === "k2") setK2run(null); setScreen(backTo(screen)); }, screen ?? "");
  useBackLayer(!!fight, () => setFight(null));
  // Belohnungs-Hinweise gehören zu dem Bildschirm, auf dem sie entstanden – beim Wechsel ausblenden
  // (sie verdecken sonst z. B. die Rangliste-Karte; die Pakete bleiben ja liegen).
  const firstNav = useRef(true);
  useEffect(() => { if (firstNav.current) { firstNav.current = false; return; } dismissAllToasts(); }, [tab, screen]);

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

  function go(t: Target) {
    if (typeof t === "object") { setJourneyStart(t.journey); setScreen("journey"); return; }
    if (t === "gymweek") { setGymStart("week"); setScreen("gym"); return; }
    if (t === "klassik") setKlassikStart("kampagne");
    setScreen(t);
  }
  const back = () => setScreen(null);

  // Klassik: altes Kartenspiel (Kampf, neue Karten, Lektion) als Vollbild
  if (fight) return <Suspense fallback={<ScreenFallback />}><Arena key={fight.id + g.wins + g.losses} arch={fight} onExit={exitFight} /></Suspense>;
  if (unlocked) return <NewCards ids={unlocked} onDone={() => { setLesson(unlocked); setUnlocked(null); }} />;
  if (lesson) return <Suspense fallback={<ScreenFallback />}><Lesson ids={lesson} onDone={() => setLesson(null)} /></Suspense>;

  if (screen === "k2" && k2run) return <Sub><K2RunView run={k2run} onDone={() => { setK2run(null); back(); }} /></Sub>;
  if (screen === "hotseat") return <Sub><HotSeat onBack={back} /></Sub>;
  if (screen === "coach") return <Sub><CoachChat onBack={back} /></Sub>;
  if (screen === "trainer") return <Sub><TrainerCheck onBack={back} /></Sub>;
  if (screen === "daily") return <Sub><DailyScreen onBack={back} /></Sub>;
  if (screen === "rangliste") return <Sub><Rangliste onBack={back} /></Sub>;
  if (screen === "sammlung") return <Sub><Sammlung onBack={back} onPakete={() => setScreen("pakete")} /></Sub>;
  if (screen === "pakete") return <Sub><PaketeScreen onBack={back} /></Sub>;
  if (screen === "glossar") return <Sub><Glossar onBack={back} /></Sub>;
  if (screen === "settings") return <Sub><SettingsScreen onBack={back} onLegal={(p: "impressum" | "datenschutz") => setScreen(p)} onKlassik={() => go("klassik")} /></Sub>;
  if (screen === "klassik") return <Sub><KlassikScreen start={klassikStart} onBack={() => setScreen("settings")} onFight={setFight} /></Sub>;
  if (screen === "impressum" || screen === "datenschutz") return <Sub><LegalScreen page={screen} onBack={() => setScreen("settings")} /></Sub>;
  if (screen === "gym") return <Suspense fallback={<ScreenFallback />}><GymScreen start={gymStart} onBack={() => { setGymStart("home"); back(); }} /></Suspense>;
  if (screen === "warmup") return <div className="pg-wrap"><Suspense fallback={<ScreenFallback />}><WarmupScreen onBack={back} /></Suspense></div>;
  if (screen === "program") return <div className="pg-wrap"><Suspense fallback={<ScreenFallback />}><ProgramScreen onBack={back} onJourney={(v: JourneyStart) => go({ journey: v })} onLeglock={() => setScreen("leglock")} onGym={() => go("gymweek")} onDayLeft={dismissAllToasts} /></Suspense></div>;
  if (screen === "leglock") return <div className="pg-wrap"><Suspense fallback={<ScreenFallback />}><LeglockScreen onBack={back} /></Suspense></div>;
  if (screen === "journey") return <div className="pg-wrap"><Suspense fallback={<ScreenFallback />}><JourneyScreen start={journeyStart} onBack={back} /></Suspense></div>;

  // Karten werden still gesammelt; der Tab „Spielen“ zeigt wartende Pakete (sonst neue Karten) als Zahl.
  const badge: Partial<Record<Tab, number>> = { spielen: rw.packs || col.fresh.length };
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand display">Matten<b>karten</b></div>
        <HeaderBelt onOpen={(to) => go(to)} />
        <button className="hm-gear" onClick={() => go("settings")} aria-label="Einstellungen">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </button>
      </header>
      <div className="main">
        <Suspense fallback={<ScreenFallback />}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .2 }}>
            {tab === "start" && <StartTab go={go} />}
            {tab === "spielen" && <SpielenHome onRun={(r: K2Run) => { setK2run(r); setScreen("k2"); }}
              onRangliste={() => go("rangliste")} onSammlung={() => go("sammlung")} onPakete={() => go("pakete")} />}
            {tab === "ueben" && <UebenTab go={go} />}
            {tab === "gym" && <GymTab go={go} />}
          </motion.div>
        </AnimatePresence>
        </Suspense>
      </div>
      <nav className="tabs tabs4" aria-label="Bereiche">
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <button key={t} className={tab === t ? "on" : ""} aria-current={tab === t ? "page" : undefined} onClick={() => { setScreen(null); setTab(t); }}>
            {tab === t && <motion.span layoutId="tabglow" className="tabglow" />}
            <span>{TAB_LABEL[t]}{badge[t] ? <span className="tab-badge" aria-label={`, ${badge[t]} neu`}>{badge[t]}</span> : null}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
