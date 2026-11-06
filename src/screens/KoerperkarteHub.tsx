// Tab „Spielen“ (UX-Review 06.11.2026): die Körperkarte – Lektionen, freies Spiel, Bosse, Rangliste, Karten.
// Die Liste lebt im Tab (mit Kopfzeile und Seitenrand); ein gestarteter Lauf (Arena, Bosse, Spielplan, Draft)
// übernimmt den ganzen Bildschirm (K2RunView) und kehrt danach in den Tab zurück.
import { useState } from "react";
import { motion } from "framer-motion";
import { ArenaK2 } from "../core2/ui/ArenaK2";
import { TUTORIALS_K2, TUTORIAL_GUARD_ODER_TD } from "../core2/data/tutorials";
import { LESSONS_PROGRAM } from "../program/lessons";
import { Bosse, readBeaten } from "../core2/ui/Bosse";
import { BOSSES } from "../core2/data/bosses";
import { StilWahl } from "../core2/ui/StilWahl";
import { randomStil } from "../core2/data/stile";
import type { StilId } from "../core2/types";
import { SpielplanModus } from "../core2/ui/SpielplanModus";
import { PLAN_RULE } from "../core2/data/plans";
import { DraftModus, DRAFT_RULE } from "../core2/ui/DraftModus";
import { LADDER_RULE } from "../core2/ui/Rangliste";
import { useShared } from "../progress/store";
import { currentUnlocks, lessonOpen, planDraftHint, unlockInput, unlocks } from "../progress/unlock";
import { useProgram } from "../program/store";
import { useRewards } from "../core2/rewards/store";
import { useCollection } from "../core2/collection/store";

export type K2Run = { kind: "tut"; id: string } | { kind: "stilwahl"; level: 1 | 2 | 3 } | { kind: "free"; level: 1 | 2 | 3; stil?: StilId; foe?: StilId }
  | { kind: "bosses" } | { kind: "plan" } | { kind: "draft" };
const LEVEL_NAME: Record<1 | 2 | 3, string> = { 1: "Locker", 2: "Normal", 3: "Hart" };
const ALL_TUTS = [...TUTORIALS_K2, TUTORIAL_GUARD_ODER_TD, ...LESSONS_PROGRAM];

/** Ein gestarteter Lauf als Vollbild. onDone kehrt in den Tab „Spielen“ zurück. */
export function K2RunView({ run: start, onDone }: { run: K2Run; onDone: () => void }) {
  const [run, setRun] = useState<K2Run>(start);
  const [seed, setSeed] = useState(() => Date.now() % 100000);

  if (run.kind === "tut") {
    const t = ALL_TUTS.find((x) => x.id === run.id);
    if (!t) return <div className="screen"><p>Lektion fehlt.</p><button className="btn" onClick={onDone}>Zurück</button></div>;
    // Geschafft-Marke setzt ArenaK2 selbst (gemeinsamer Fortschritt mit dem 7-Tage-Start).
    return <ArenaK2 key={t.id + seed} mode="tutorial" tutorial={t} aiLevel={t.aiLevel} onExit={onDone} />;
  }
  if (run.kind === "bosses") return currentUnlocks().bosses ? <Bosse onBack={onDone} />
    : <div className="screen"><p>Bosse schalten sich nach Lektion 3 oder Tag 7 frei.</p><button className="btn hm-back" onClick={onDone}>← Zurück</button></div>;
  if (run.kind === "plan") return <SpielplanModus onBack={onDone} />;
  if (run.kind === "draft") return <DraftModus onBack={onDone} />;
  if (run.kind === "stilwahl") {
    // Mechanik 5: vor dem freien Spiel das A-Game wählen; der Gegner bekommt einen zufälligen Stil.
    const lv = run.level;
    return <StilWahl context={`Freies Spiel · ${LEVEL_NAME[lv]}`} onBack={onDone}
      onPick={(id) => setRun({ kind: "free", level: lv, stil: id, foe: randomStil(Math.random) })} />;
  }
  return <ArenaK2 key={"free" + seed} mode="free" aiLevel={run.level} seed={seed} stil={run.stil} foeStil={run.foe}
    onExit={() => { setSeed(seed + 1); onDone(); }} />;
}

/** Inhalt des Tabs „Spielen“. */
export function SpielenHome({ onRun, onRangliste, onSammlung, onPakete }: {
  onRun: (r: K2Run) => void; onRangliste: () => void; onSammlung: () => void; onPakete: () => void;
}) {
  const shared = useShared();
  const [prog] = useProgram();
  const rw = useRewards();
  const col = useCollection();
  const ui = unlockInput(prog, shared);
  const un = unlocks(ui);
  const done = shared.lessons;
  const progDone = LESSONS_PROGRAM.filter((t) => done.includes(t.id));
  const allDone = TUTORIALS_K2.every((t) => done.includes(t.id));
  // Freies Spiel: vor dem Freischalten direkt los (ohne Spielstil), danach mit Stil-Wahl.
  const free = (level: 1 | 2 | 3) => onRun(un.levels ? { kind: "stilwahl", level } : { kind: "free", level });
  return (
    <div className="screen more">
      <h2 className="display" style={{ fontSize: 30 }}>Spielen</h2>
      <p className="muted small">
        Die Körperkarte: vier Zonen – Kopf, Arme, Hüfte, Beine. Wer Zonen gewinnt, kommt in bessere Positionen.
        Aufgaben brauchen drei Schritte. Erst befreien, dann passieren, dann beenden.
      </p>

      <h3 className="display">Lektionen</h3>
      <div className="more-list">
        {TUTORIALS_K2.map((t, i) => {
          // Lektion 3 im 7-Tage-Start geschafft → nicht gesperrt, nur weil Lektion 2 fehlt (UX-Review 2, Punkt 10).
          const locked = !lessonOpen(i, ui);
          return (
            <motion.button key={t.id} className="more-item" disabled={locked} style={locked ? { opacity: .45 } : undefined}
              onClick={() => onRun({ kind: "tut", id: t.id })}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <strong className="display">{done.includes(t.id) ? "✓ " : `${i + 1}. `}{t.title}</strong>
              <span className="muted small">{locked ? "Erst die Lektion davor schaffen." : t.idea}</span>
            </motion.button>
          );
        })}
        {un.extraLesson ? (
          <button className="more-item" onClick={() => onRun({ kind: "tut", id: TUTORIAL_GUARD_ODER_TD.id })}>
            <strong className="display">{done.includes(TUTORIAL_GUARD_ODER_TD.id) ? "✓ " : "Extra: "}{TUTORIAL_GUARD_ODER_TD.title}</strong>
            <span className="muted small">{TUTORIAL_GUARD_ODER_TD.idea}</span>
          </button>
        ) : (
          <div className="more-item hm-teaser" aria-disabled="true">
            <strong className="display">Extra: {TUTORIAL_GUARD_ODER_TD.title}</strong>
            <span className="muted small">Schaltet sich frei nach Lektion 2 oder Tag 4 im 7-Tage-Start.</span>
          </div>
        )}
      </div>
      {progDone.length > 0 && (
        <>
          <h3 className="display">Aus dem 7-Tage-Start</h3>
          <div className="more-list">
            {progDone.map((t) => (
              <button key={t.id} className="more-item" onClick={() => onRun({ kind: "tut", id: t.id })}>
                <strong className="display">✓ {t.title}</strong>
                <span className="muted small">{t.idea}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <h3 className="display">Freies Spiel</h3>
      {!allDone && !un.lesson3 && <p className="muted small">Tipp: Erst die drei Lektionen – dann verstehst du das Brett sofort.</p>}
      <button className="btn primary big" onClick={() => free(1)}>Locker spielen</button>
      {un.levels ? (
        <div className="hm-row2">
          <button className="btn" onClick={() => free(2)}>Normal</button>
          <button className="btn" onClick={() => free(3)}>Hart</button>
        </div>
      ) : (
        <p className="muted small">„Normal“, „Hart“ und Spielstile schalten sich frei nach Lektion 3 oder Tag 7 im 7-Tage-Start.</p>
      )}

      <h3 className="display">Gegner</h3>
      <div className="more-list">
        {un.bosses ? (
          <button className="more-item" onClick={() => onRun({ kind: "bosses" })}>
            <strong className="display">Bosse · {readBeaten().filter((id) => BOSSES.some((b) => b.id === id)).length}/{BOSSES.length} besiegt</strong>
            <span className="muted small">Vier Gegner mit eigenem Stil: Ringer, Guard, Druck, Rücken. Lern, wie du dagegen spielst.</span>
          </button>
        ) : (
          <div className="more-item hm-teaser" aria-disabled="true">
            <strong className="display">Bosse</strong>
            <span className="muted small">Vier Gegner mit eigenem Stil. Schalten sich frei nach Lektion 3 oder Tag 7 im 7-Tage-Start.</span>
          </div>
        )}
        {un.rangliste && (
          <button className="more-item" onClick={onRangliste}>
            <strong className="display">Rangliste</strong>
            <span className="muted small">Spielränge Weiß bis Schwarz gegen die KI. {LADDER_RULE[0]} Spielrang, kein echter Gürtel.</span>
          </button>
        )}
        {un.planDraft ? (
          <>
            <button className="more-item" onClick={() => onRun({ kind: "plan" })}>
              <strong className="display">Spielplan-Modus</strong>
              <span className="muted small">{PLAN_RULE[0]} {PLAN_RULE[1]} Eigene Pläne bauen und vor dem Boss anpassen.</span>
            </button>
            <button className="more-item" onClick={() => onRun({ kind: "draft" })}>
              <strong className="display">Draft</strong>
              <span className="muted small">{DRAFT_RULE[0]} {DRAFT_RULE[1]}</span>
            </button>
          </>
        ) : (
          <div className="more-item hm-teaser" aria-disabled="true">
            <strong className="display">Spielplan &amp; Draft</strong>
            <span className="muted small">Eigenes Deck aus 15 Angriffen bauen. {planDraftHint(ui)}</span>
          </div>
        )}
      </div>

      <h3 className="display">Karten</h3>
      <div className="more-list">
        <button className="more-item" onClick={onSammlung}>
          <strong className="display">Sammlung{col.fresh.length > 0 && <span className="hm-badge">{col.fresh.length} neu</span>}</strong>
          <span className="muted small">{col.ids.length} Karten nach Position. Umdrehen zeigt das Kurzwissen.</span>
        </button>
        <button className="more-item" onClick={onPakete}>
          <strong className="display">Pakete &amp; Staub{rw.packs > 0 && <span className="hm-badge">{rw.packs}</span>}</strong>
          <span className="muted small">{rw.packs ? `${rw.packs} ${rw.packs === 1 ? "Paket wartet" : "Pakete warten"}. ` : ""}Fürs Lernen gibt es Kartenpakete. Kein Echtgeld, Chancen offen. {rw.staub} Mattenstaub.</span>
        </button>
      </div>
    </div>
  );
}
