// Tab „Üben“: Rätsel (ohne Serie/Freeze-Druck), Aufwärmen 5′, Glossar, Wiederholen & Fehlerdeck, KI-Coach (nur wenn aktiv).
import { lazy } from "react";
import { useJourney } from "../journey/store";
import { known, journeyVisible } from "../journey/ReviewCard";
import { localDate, todayCount } from "../journey/schedule";
import { loadProgress } from "../program/store";
import { useCoachAvailable } from "./useCoach";
import type { Target } from "./nav";
import "./home.css";

const Puzzles = lazy(() => import("../screens/Puzzles").then((m) => ({ default: m.Puzzles })));

export function UebenTab({ go }: { go: (t: Target) => void }) {
  const j = useJourney();
  const coach = useCoachAvailable();
  const due = todayCount(j, localDate(), known).total;
  const review = loadProgress().done.length > 0 || journeyVisible(j);
  const top = (
    <div className="hm-grid">
      <button type="button" className="hm-tile" onClick={() => go("warmup")}>
        <span className="hm-tile-ico num" aria-hidden="true">5′</span>
        <b>Aufwärmen</b><span className="small muted">No-Gi, 5 Minuten mit Timer</span>
      </button>
      <button type="button" className="hm-tile" onClick={() => go("glossar")}>
        <span className="hm-tile-ico" aria-hidden="true">Aa</span>
        <b>Glossar</b><span className="small muted">Keil, Rahmen, Dilemma …</span>
      </button>
      {review && (
        <button type="button" className="hm-tile" onClick={() => go({ journey: due ? "review" : "home" })}>
          <span className={`hm-tile-ico num ${due ? "on" : ""}`} aria-hidden="true">{due ? Math.min(due, 8) : "✓"}</span>
          <b>Wiederholen</b><span className="small muted">{due ? "Fällige Fragen und Fehlerdeck" : "Fehlerdeck – heute frei"}</span>
        </button>
      )}
      {coach && (
        <button type="button" className="hm-tile" onClick={() => go("coach")}>
          <span className="hm-tile-ico" aria-hidden="true">?</span>
          <b>KI-Coach</b><span className="small muted">Fragen in einfachen Worten</span>
        </button>
      )}
    </div>
  );
  return <Puzzles top={top} />;
}
