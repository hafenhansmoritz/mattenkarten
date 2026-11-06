// Tab „Start“ (UX-Review 06.11.2026, Punkte 2, 3, 15): ein großer Knopf „Heute: Tag N“, darunter das Nötigste.
// Rangliste und Tages-Challenge erst nach Tag 7.
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FightersK2 } from "../core2/ui/FightersK2";
import { DAYS } from "../program/days";
import { RESUME_LABEL, currentDay, resumeFor, useProgram } from "../program/store";
import { LegDiagram } from "../leglock/LegDiagram";
import { useBackLayer } from "./backstack";
import { GYM_TIPS, GYM_TIPS_SRC } from "./finish";
import { ReadyChecklist, checklistCount } from "../program/ReadyChecklist";
import { known, syncFromProgram, journeyVisible } from "../journey/ReviewCard";
import { useJourney } from "../journey/store";
import { localDate, todayCount } from "../journey/schedule";
import { loadLeglock } from "../leglock/store";
import { useRewards } from "../core2/rewards/store";
import { LadderCard } from "../core2/ladder/LadderBelt";
import { dailyFor } from "../core2/daily/daily";
import { useDailyLog } from "../core2/daily/store";
import { unlocks, unlockInput } from "../progress/unlock";
import { useShared } from "../progress/store";
import { NoGiIntro } from "./NoGiIntro";
import type { Target } from "./nav";
import "./home.css";

export function StartTab({ go }: { go: (t: Target) => void }) {
  const [p, update] = useProgram();
  const shared = useShared();
  const j = useJourney();
  const rw = useRewards();
  const daily = useDailyLog();
  const [listOpen, setListOpen] = useState(false);
  // Android-Zurück schließt die aufgeklappte Checkliste.
  useBackLayer(listOpen, () => setListOpen(false));
  useEffect(() => { syncFromProgram(true); }, []);
  const cur = currentDay(p);
  const un = unlocks(unlockInput(p, shared));
  const today = localDate();
  const due = todayCount(j, today, known).total;
  const showReview = p.done.length > 0 || journeyVisible(j);
  const cl = checklistCount(p);

  // Großer Knopf: Tag N – oder nach Tag 7 der nächste sinnvolle Schritt.
  let hero: { kicker: string; title: string; text: string; target: Target; fig?: "leg" };
  if (cur <= 7) {
    const d = DAYS[cur - 1];
    const r = resumeFor(p, cur);
    hero = { kicker: p.done.length ? "7-Tage-Start" : "15 Minuten am Tag", title: `Heute: Tag ${cur}`, text: r ? `${d.title} · weiter bei: ${RESUME_LABEL[r.step]}` : d.title, target: "program" };
  } else if (!loadLeglock().check?.passed) {
    hero = { kicker: "7-Tage-Start geschafft", title: "Weiter: Beinhebel-Woche", text: "4 kurze Lektionen: Regeln, Verteidigung, früh abklopfen.", target: "leglock", fig: "leg" };
  } else if (due > 0) {
    hero = { kicker: "Dranbleiben", title: "Weiter: Wiederholen", text: `${Math.min(due, 8)} ${due === 1 ? "Frage" : "Fragen"} bereit. Etwa 3 Minuten.`, target: { journey: "review" } };
  } else {
    hero = { kicker: "Dranbleiben", title: "Weiter: Deine Reise", text: "Training eintragen, Wissen auffrischen, Frage für den Trainer.", target: { journey: "home" } };
  }

  const dk = dailyFor();
  const dailyDone = !!daily[dk.key];

  return (
    <div className="screen hm-start">
      <motion.button type="button" className="hm-hero" onClick={() => go(hero.target)}
        initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}>
        {/* Beinhebel-Woche: neutrale Bein-Skizze statt Mount-Bild (UX-Review 2, Punkt 10). */}
        <span className={`hm-hero-fig${hero.fig === "leg" ? " is-leg" : ""}`} aria-hidden="true">
          {hero.fig === "leg" ? <LegDiagram id="knee-safe" /> : <FightersK2 pos="mount" top="o" />}
        </span>
        {/* Die Tagespunkte stehen schon in der Kopfzeile – hier nicht doppelt. */}
        <span className="hm-hero-txt">
          <span className="label hm-kicker">{hero.kicker}</span>
          <strong className="display">{hero.title}</strong>
          <span className="small">{hero.text}</span>
        </span>
        <span className="hm-go" aria-hidden="true">›</span>
      </motion.button>

      {cur > 7 && (
        <section className="hm-finish" aria-labelledby="hm-finish-h">
          <span className="label hm-kicker">7 von 7 Tagen ✓</span>
          <h2 id="hm-finish-h" className="display">Bereit fürs Probetraining</h2>
          <div className="hm-finish-bar" role="progressbar" aria-label="Checkliste" aria-valuemin={0} aria-valuemax={cl.total} aria-valuenow={cl.done}>
            <i style={{ width: `${(cl.done / cl.total) * 100}%` }} />
          </div>
          <button type="button" className="hm-check-head" aria-expanded={listOpen} onClick={() => setListOpen((v) => !v)}>
            <span><span className="label">Checkliste · {cl.done}/{cl.total}</span><strong className="display">{cl.done === cl.total ? "Alles abgehakt" : "Abhaken, was du schon hast"}</strong></span>
            <span aria-hidden="true" className={`hm-chev ${listOpen ? "open" : ""}`}>›</span>
          </button>
          {listOpen && <div className="hm-check-body"><ReadyChecklist p={p} update={update} /></div>}
          <h3 className="display hm-finish-sub">So findest du ein Gym</h3>
          <ul className="hm-finish-tips">{GYM_TIPS.map((t) => <li key={t}>{t}</li>)}</ul>
          <p className="small muted">{GYM_TIPS_SRC}</p>
          <button type="button" className="btn" onClick={() => go("program")}>Startwoche wiederholen (Tag 1–7)</button>
        </section>
      )}

      <NoGiIntro />

      <div className="hm-list">
        <button type="button" className="hm-row" onClick={() => go({ journey: "training" })}>
          <span className="hm-ico" aria-hidden="true">＋</span>
          <span><b>Nach dem Training</b><span className="small muted">In 3 Schritten eintragen, passende Lektion holen.</span></span>
        </button>
        {showReview && (
          <button type="button" className="hm-row" onClick={() => go({ journey: due ? "review" : "home" })}>
            <span className={`hm-ico num ${due ? "on" : ""}`} aria-hidden="true">{due ? Math.min(due, 8) : "✓"}</span>
            <span><b>Wiederholen</b><span className="small muted">{due ? `${Math.min(due, 8)} ${due === 1 ? "Frage fällig" : "Fragen fällig"} · etwa 3 Minuten` : "Heute ist nichts fällig."}</span></span>
          </button>
        )}
        {rw.packs > 0 && (
          <button type="button" className="hm-row" onClick={() => go("pakete")}>
            <span className="hm-ico num on" aria-hidden="true">{rw.packs}</span>
            <span><b>{rw.packs === 1 ? "1 Paket wartet" : `${rw.packs} Pakete warten`}</b><span className="small muted">Fürs Lernen verdient. Öffnen zeigt neue Karten.</span></span>
          </button>
        )}
      </div>

      {cur <= 7 && <section className="hm-check" aria-labelledby="hm-check-h">
        <button type="button" className="hm-check-head" aria-expanded={listOpen} onClick={() => setListOpen((v) => !v)}>
          <span>
            <span className="label">Checkliste · {cl.done}/{cl.total}</span>
            <strong id="hm-check-h" className="display">Vor deinem ersten Training</strong>
          </span>
          <span aria-hidden="true" className={`hm-chev ${listOpen ? "open" : ""}`}>›</span>
        </button>
        {listOpen && <div className="hm-check-body"><ReadyChecklist p={p} update={update} /></div>}
      </section>}

      {un.startExtras && (
        <>
          <LadderCard onOpen={() => go("rangliste")} />
          <button type="button" className="hm-row" onClick={() => go("daily")}>
            <span className="hm-ico" aria-hidden="true">{dailyDone ? "✓" : "◎"}</span>
            <span><b>Tages-Challenge · {dk.def.title}</b><span className="small muted">{dailyDone ? "Heute gespielt. Üben darfst du immer." : "Eine neue Lage aus der Körperkarte. Ein Versuch zählt."}</span></span>
          </button>
        </>
      )}
      <p className="muted small center">Verpasst du einen Tag, ist das eine Pause – du verlierst nichts.</p>
    </div>
  );
}
