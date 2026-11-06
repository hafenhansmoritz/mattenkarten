// „Klassik“ (UX-Review 06.11.2026, Zurückziehen): das alte Kartenspiel – Kampagne, Deck, Deck teilen, Bibliothek.
// Nicht gelöscht, nur aus der Hauptnavigation genommen. Erreichbar über das Zahnrad. Dazu die alten Rätsel.
import { Suspense, lazy, useState, type ComponentType } from "react";
import type { Archetype } from "../engine/types";
import { BELTS } from "../data/campaign";
import { currentBeltIndex, useGame } from "../store";
import { Campaign } from "../screens/Campaign";
import "./home.css";

const named = <M, K extends keyof M>(load: () => Promise<M>, key: K) =>
  lazy(() => load().then((m) => ({ default: m[key] as unknown as ComponentType<any> })));
const DeckBuilder = named(() => import("../screens/Deck"), "DeckBuilder");
const Library = named(() => import("../screens/Deck"), "Library");
const ShareDeck = named(() => import("../screens/ShareDeck"), "ShareDeck");
// Die alten Rätsel (Vorbereiten/Angreifen/Kontern) gehören zum Klassik-Spiel (UX-Review 2, Punkt 3).
const Puzzles = named(() => import("../screens/Puzzles"), "Puzzles");

type Part = "kampagne" | "raetsel" | "deck" | "bibliothek" | "teilen";
const PART_LABEL: Record<Part, string> = { kampagne: "Kampagne", raetsel: "Rätsel", deck: "Deck", bibliothek: "Bibliothek", teilen: "Teilen" };

export function KlassikScreen({ onBack, onFight, start = "kampagne" }: { onBack: () => void; onFight: (a: Archetype) => void; start?: Part }) {
  const g = useGame();
  const [part, setPart] = useState<Part>(start);
  const belt = BELTS[currentBeltIndex(g.beaten)];
  return (
    <div className="screen hm-klassik-screen">
      <div className="hm-klassik-top">
        <button className="btn small ghost" onClick={onBack}>← Zurück</button>
        <span className="label muted">Klassik · {belt.name} · <span className="num">{g.xp}</span> XP</span>
      </div>
      <p className="muted small">Das erste Kartenspiel von Mattenkarten. Es wird nicht weiterentwickelt – der Kern ist jetzt die Körperkarte unter „Spielen“.</p>
      <div className="hm-seg" role="tablist" aria-label="Klassik">
        {(Object.keys(PART_LABEL) as Part[]).map((p) => (
          <button key={p} type="button" role="tab" aria-selected={part === p} className={part === p ? "on" : ""} onClick={() => setPart(p)}>{PART_LABEL[p]}</button>
        ))}
      </div>
      <Suspense fallback={<div className="screen-loading" />}>
        {part === "kampagne" && <Campaign onFight={onFight} />}
        {part === "raetsel" && <Puzzles />}
        {part === "deck" && <DeckBuilder />}
        {part === "bibliothek" && <Library />}
        {part === "teilen" && <ShareDeck onBack={() => { if (location.hash.startsWith("#deck=")) history.replaceState(null, "", location.pathname); setPart("deck"); }} />}
      </Suspense>
    </div>
  );
}
