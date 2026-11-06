// Tab „Start“ (UX-Review 06.11.2026, Punkte 2, 3, 15): ein großer Knopf „Heute: Tag N“, darunter das Nötigste.
// Rangliste und Tages-Challenge erst nach Tag 7.
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FightersK2 } from "../core2/ui/FightersK2";
import { DAYS } from "../program/days";
import { currentDay, useProgram } from "../program/store";
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
  useEffect(() => { syncFromProgram(true); }, []);
  const cur = currentDay(p);
  const un = unlocks(unlockInput(p, shared));
  const today = localDate();
  const due = todayCount(j, today, known).total;
  const showReview = p.done.length > 0 || journeyVisible(j);
  const cl = checklistCount(p);

  // Großer Knopf: Tag N – oder nach Tag 7 der nächste sinnvolle Schritt.
  let hero: { kicker: string; title: string; text: string; target: Target };
  if (cur <= 7) {
    const d = DAYS[cur - 1];
    hero = { kicker: p.done.length ? "7-Tage-Start" : "15 Minuten am Tag", title: `Heute: Tag ${cur}`, text: d.title, target: "program" };
  } else if (!loadLeglock().check?.passed) {
    hero = { kicker: "7-Tage-Start geschafft", title: "Weiter: Beinhebel-Woche", text: "4 kurze Lektionen: Regeln, Verteidigung, früh abklopfen.", target: "leglock" };
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
        <span className="hm-hero-fig" aria-hidden="true"><FightersK2 pos="mount" top="o" /></span>
        <span className="hm-hero-txt">
          <span className="label hm-kicker">{hero.kicker}</span>
          <strong className="display">{hero.title}</strong>
          <span className="small">{hero.text}</span>
          {cur <= 7 && (
            <span className="hm-knots" aria-label={`${p.done.length} von 7 Tagen geschafft`}>
              {DAYS.map((d) => <i key={d.n} className={p.done.includes(d.n) ? "on" : d.n === cur ? "now" : ""} />)}
            </span>
          )}
        </span>
        <span className="hm-go" aria-hidden="true">›</span>
      </motion.button>

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

      <section className="hm-check" aria-labelledby="hm-check-h">
        <button type="button" className="hm-check-head" aria-expanded={listOpen} onClick={() => setListOpen((v) => !v)}>
          <span>
            <span className="label">Checkliste · {cl.done}/{cl.total}</span>
            <strong id="hm-check-h" className="display">{cur > 7 ? "Bereit fürs erste Training" : "Vor deinem ersten Training"}</strong>
          </span>
          <span aria-hidden="true" className={`hm-chev ${listOpen ? "open" : ""}`}>›</span>
        </button>
        {listOpen && <div className="hm-check-body"><ReadyChecklist p={p} update={update} /></div>}
      </section>

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
