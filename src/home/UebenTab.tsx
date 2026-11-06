// Tab „Üben“: Aufwärmen 5′, Glossar, Wiederholen & Fehlerdeck, KI-Coach (nur wenn aktiv) und freies Üben
// mit den Fragen des 7-Tage-Starts (UX-Review 2, Punkt 3). Die alten Klassik-Rätsel (Vorbereiten/Kontern)
// liegen unter Einstellungen → Klassik. Themen schalten sich mit den geschafften Tagen frei.
import { useState } from "react";
import { motion } from "framer-motion";
import { useJourney } from "../journey/store";
import { known, journeyVisible } from "../journey/ReviewCard";
import { localDate, todayCount } from "../journey/schedule";
import { currentDay, useProgram } from "../program/store";
import { practiceIds, practiceTopics } from "../program/practice";
import { Quiz, type QuizResult } from "../program/Quiz";
import type { Topic } from "../program/questions";
import { sfx } from "../sound";
import { useCoachAvailable } from "./useCoach";
import { useBackLayer } from "./backstack";
import type { Target } from "./nav";
import "./home.css";

type Run = { topic: Topic | null; label: string; ids: string[]; seed: number };

export function UebenTab({ go }: { go: (t: Target) => void }) {
  const j = useJourney();
  const [p] = useProgram();
  const coach = useCoachAvailable();
  const [run, setRun] = useState<Run | null>(null);
  const [res, setRes] = useState<QuizResult[] | null>(null);
  useBackLayer(run !== null, () => { setRun(null); setRes(null); });
  const due = todayCount(j, localDate(), known).total;
  const doneDays = currentDay(p) - 1;
  const review = p.done.length > 0 || journeyVisible(j);
  const topics = practiceTopics(doneDays);
  const anyOpen = topics.some((t) => t.open);

  const start = (topic: Topic | null, label: string) => {
    sfx.select();
    const seed = (Date.now() % 100000) + 1;
    setRes(null);
    setRun({ topic, label, ids: practiceIds(topic, doneDays, seed), seed });
  };

  if (run) {
    const right = res?.filter((r) => r.ok).length ?? 0;
    return (
      <div className="screen hm-ueben">
        <button type="button" className="btn small ghost hm-back" onClick={() => { setRun(null); setRes(null); }}>← Üben</button>
        <h2 className="display hm-ueben-h">{run.label}</h2>
        {!res ? (
          <Quiz key={run.seed} ids={run.ids} kicker="Frei üben" onDone={(r) => setRes(r)} />
        ) : (
          <motion.section className="pg-panel center" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <span className="label">Erster Versuch</span>
            <h3 className="display pg-h"><span className="num">{right}</span> von <span className="num">{res.length}</span> richtig</h3>
            <p className="small muted">Falsche Antworten landen im Fehlerdeck unter „Wiederholen“.</p>
            <button type="button" className="btn primary big" onClick={() => start(run.topic, run.label)}>Nochmal mischen</button>
            <button type="button" className="btn" onClick={() => { setRun(null); setRes(null); }}>Zur Übersicht</button>
          </motion.section>
        )}
      </div>
    );
  }

  return (
    <div className="screen hm-ueben">
      <h2 className="display hm-ueben-h">Üben</h2>
      <div className="hm-grid">
        {review && (
          <button type="button" className="hm-tile" onClick={() => go({ journey: due ? "review" : "home" })}>
            <span className={`hm-tile-ico num ${due ? "on" : ""}`} aria-hidden="true">{due ? Math.min(due, 8) : "✓"}</span>
            <b>Wiederholen</b><span className="small muted">{due ? "Fällige Fragen und Fehlerdeck" : "Fehlerdeck – heute frei"}</span>
          </button>
        )}
        <button type="button" className="hm-tile" onClick={() => go("warmup")}>
          <span className="hm-tile-ico num" aria-hidden="true">5′</span>
          <b>Aufwärmen</b><span className="small muted">No-Gi, 5 Minuten mit Timer</span>
        </button>
        <button type="button" className="hm-tile" onClick={() => go("glossar")}>
          <span className="hm-tile-ico" aria-hidden="true">Aa</span>
          <b>Glossar</b><span className="small muted">Begriffe in einfachen Worten</span>
        </button>
        {coach && (
          <button type="button" className="hm-tile" onClick={() => go("coach")}>
            <span className="hm-tile-ico" aria-hidden="true">?</span>
            <b>KI-Coach</b><span className="small muted">Fragen in einfachen Worten</span>
          </button>
        )}
      </div>

      <section aria-labelledby="hm-free-h">
        <h3 id="hm-free-h" className="display hm-ueben-sub">Frei üben</h3>
        <p className="small muted">Fragen aus dem 7-Tage-Start. Ein Thema öffnet sich, wenn du seinen Tag geschafft hast.</p>
        <div className="hm-grid">
          {topics.map((t) => (
            <button key={t.topic} type="button" className={`hm-tile${t.open ? "" : " hm-locked"}`} disabled={!t.open}
              aria-label={t.open ? `${t.label}: ${t.count} Fragen` : `${t.label}: ab Tag ${t.day}`}
              onClick={() => start(t.topic, t.label)}>
              <span className="hm-tile-ico num" aria-hidden="true">{t.open ? t.count : <Lock />}</span>
              <b>{t.label}</b>
              <span className="small muted">{t.open ? `${t.count} Fragen` : `Nach Tag ${t.day}`}</span>
            </button>
          ))}
        </div>
        {anyOpen
          ? <button type="button" className="btn hm-mix" onClick={() => start(null, "Alles gemischt")}>Alle offenen Themen mischen</button>
          : <p className="small muted">Schaff Tag 1 im 7-Tage-Start – dann geht es hier los.</p>}
      </section>
    </div>
  );
}

function Lock() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </svg>
  );
}
