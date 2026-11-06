// Mechanik 10 „Gürtel-Rangliste“ (Spec B76–B82): Spielränge Weiß → Schwarz mit je 4 Streifen gegen die KI.
// Sieg = Streifen, Niederlage = ein Streifen weg, nie unter deinen Gürtel. Bei 4 Streifen: Gürtelprüfung gegen Bosse.
// Saison = Monat (nur der Name, kein Countdown). Ehrlich: Spielrang, kein echter Gürtel.
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArenaK2 } from "./ArenaK2";
import { cardById } from "../engine";
import { BOSS, type BossDef } from "../data/bosses";
import { STIL, STILE, readStil, writeStil } from "../data/stile";
import { BOSS_PLANS, DEFAULT_PLAN, planName, readPlan, stilOfPlanId, type SavedPlan } from "../data/plans";
import { emitLearning } from "../rewards/events";
import {
  BELT_COLOR, BELT_IDS, GATE_LEN, HONESTY, STRIPES, STREAK_FROM, TIERS, TOP, beltName, foeStyle, framesOwned, inGate, rankText,
  recordResult, seasonName, setChoice, type LadderEntry, type LadderFoe, type LadderState, type MatchResult,
} from "../ladder/ladder";
import { loadLadder, writeLadder } from "../ladder/store";
import { LadderBelt } from "../ladder/LadderBelt";
import type { State2, StilId } from "../types";
import { allowedLadder, currentUnlocks, planDraftHint, ranglisteChoices, unlockInput } from "../../progress/unlock";
import "../../styles/core2.css";
import "../../styles/rangliste.css";

export const LADDER_BJJ = "Im echten BJJ entscheidet dein Trainer über Streifen und Gürtel – Blau bleibst du meist mindestens zwei Jahre.";
export const LADDER_SRC = { title: "Wikipedia – Brazilian jiu-jitsu ranking system (IBJJF-Mindestzeiten)", url: "https://en.wikipedia.org/wiki/Brazilian_jiu-jitsu_ranking_system" };
export const LADDER_RULE = [
  "Sieg: ein Streifen. Niederlage: ein Streifen weg – deinen Gürtel verlierst du nie.",
  "Bei 4 Streifen kommt die Gürtelprüfung gegen Bosse.",
];

/** Dein Plan im Spielplan-Modus: der gewählte aus dem Spielplan-Modus, sonst der Standard-Plan deines Stils. */
function myPlan(stil: StilId): SavedPlan {
  const p = readPlan();
  if (p && p.cards.every((id) => !!cardById(id))) return p;
  const d = DEFAULT_PLAN[stil];
  return { id: d.id, cards: d.cards };
}

export function foeName(f: LadderFoe): string {
  if (f.boss) return `Boss · ${BOSS[f.boss].name}${f.level === 2 ? " (Stufe 2)" : ""}`;
  return `${TIERS[f.tier as keyof typeof TIERS].label} · ${STIL[f.stil].name}`;
}

export function Rangliste({ onBack }: { onBack: () => void }) {
  const un = currentUnlocks();
  if (!un.rangliste) {
    return (
      <div className="screen more lad" lang="de">
        <button type="button" className="btn small ghost hm-back" onClick={onBack}>← Zurück</button>
        <h2 className="display" style={{ fontSize: 30, margin: "2px 0 0" }}>Rangliste</h2>
        <p className="muted">Die Rangliste schaltet sich nach Tag 7 im 7-Tage-Start frei.</p>
      </div>
    );
  }
  return <RanglisteOpen onBack={onBack} plan={ranglisteChoices(un).plan} />;
}

function RanglisteOpen({ onBack, plan }: { onBack: () => void; plan: boolean }) {
  const [s, setS] = useState<LadderState>(() => allowedLadder(loadLadder(readStil() ?? "ringer"), plan));
  const [fight, setFight] = useState(false);
  const save = (n: LadderState) => { setS(n); writeLadder(n); };
  useEffect(() => { writeLadder(s); }, []); // eslint-disable-line react-hooks/exhaustive-deps -- Saisonwechsel gleich festhalten
  useEffect(() => { if (!fight) window.scrollTo(0, 0); }, [fight]);

  if (fight) return <LadderFight s={s} onDone={(n) => { if (n) save(n); setFight(false); }} />;
  return <LadderHub s={s} planOk={plan} onBack={onBack} onFight={() => setFight(true)} onChange={save} />;
}

/* ---------------- Übersicht ---------------- */
function LadderHub({ s, planOk, onBack, onFight, onChange }: { s: LadderState; planOk: boolean; onBack: () => void; onFight: () => void; onChange: (s: LadderState) => void }) {
  const f = s.next;
  const gate = inGate(s);
  const plan = myPlan(s.stil);
  const owned = framesOwned(s);
  const hist = [...s.history].reverse().slice(0, 10);
  return (
    <div className="screen more lad" lang="de">
      <button type="button" className="btn small ghost hm-back" onClick={onBack}>← Zurück</button>
      <span className="label">{seasonName(s.season)}</span>
      <h2 className="display" style={{ fontSize: 30, margin: "2px 0 0" }}>Rangliste <span className="k2-new-tag">neu</span></h2>
      <p className="lad-honest" role="note"><b>Ehrlich gesagt:</b> {HONESTY}</p>

      {s.seasonNote && (
        <div className="lad-season" role="status">
          <p><b>Neue Saison: {seasonName(s.season)}.</b> Dein Gürtel bleibt {beltName(s.belt)}, die Streifen starten bei 0.
            {" "}Für die {seasonName(s.seasonNote.from)} hast du den {beltName(s.seasonNote.belt)}-Rahmen.</p>
          <button type="button" className="btn small" onClick={() => onChange({ ...s, seasonNote: null })}>Verstanden</button>
        </div>
      )}

      <section className="lad-rank" aria-labelledby="lad-rank-h">
        <h3 id="lad-rank-h" className="display">{rankText(s)}</h3>
        <LadderBelt belt={s.belt} stripes={s.stripes} gate={gate} />
        <p className="small muted">
          {gate ? `Gürtelprüfung: Schlag ${GATE_LEN[s.belt]} ${GATE_LEN[s.belt] === 1 ? "Boss" : "Bosse nacheinander"} – dann bist du ${beltName(s.belt + 1)}. Gewonnen: ${s.gate} von ${GATE_LEN[s.belt]}.`
            : s.belt === TOP ? "Höchster Spielrang. Jeder Kampf zählt für deine Bilanz."
            : `Noch ${STRIPES - s.stripes} Streifen bis zur Gürtelprüfung.`}
          {s.streak >= 2 && !gate ? ` Serie: ${s.streak} Siege.` : ""}
        </p>
      </section>

      <section className="lad-mode" aria-labelledby="lad-mode-h">
        <h3 id="lad-mode-h" className="display">So kämpfst du</h3>
        <div className="lad-seg" role="group" aria-label="Modus wählen">
          <button type="button" aria-pressed={s.mode === "stil"} className={s.mode === "stil" ? "on" : ""} onClick={() => onChange(setChoice(s, { mode: "stil" }))}>
            <strong>Freies Spiel</strong><span>alle Karten + Spielstil</span>
          </button>
          <button type="button" aria-pressed={s.mode === "plan"} className={s.mode === "plan" ? "on" : ""} disabled={!planOk}
            onClick={() => onChange(setChoice(s, { mode: "plan" }))}>
            <strong>Spielplan</strong><span>{planOk ? "15 Angriffe, ziehen" : "noch gesperrt"}</span>
          </button>
        </div>
        {!planOk && <p className="small muted">Spielplan: {planDraftHint(unlockInput())}</p>}
        {s.mode === "stil" ? (
          <div className="lad-stile" role="group" aria-label="Spielstil wählen">
            {STILE.map((x) => (
              <button key={x.id} type="button" aria-pressed={s.stil === x.id} className={s.stil === x.id ? "on" : ""}
                onClick={() => { writeStil(x.id); onChange(setChoice(s, { stil: x.id })); }}>{x.name}</button>
            ))}
          </div>
        ) : (
          <p className="small">Dein Plan: <b>{planName(plan)}</b> ({STIL[stilOfPlanId(plan.id) ?? s.stil].name}). Ändern kannst du ihn im Spielplan-Modus.</p>
        )}
      </section>

      <section className={`lad-next${f.boss ? " is-boss" : ""}`} aria-labelledby="lad-next-h">
        <span className="label">{f.gate ? `Gürtelprüfung · Kampf ${f.gate.n} von ${f.gate.of}` : `Nächster Gegner · Kampf ${s.games + 1}`}</span>
        <h3 id="lad-next-h" className="display">{foeName(f)}</h3>
        <p className="small">{f.boss ? BOSS[f.boss].likes : TIERS[f.tier as keyof typeof TIERS].info}
          {s.mode === "plan" ? ` Er spielt „${f.boss ? BOSS_PLANS[f.boss].name : DEFAULT_PLAN[f.stil].name}“.` : ""}</p>
        {f.boss && <p className="small"><b>Wie du dagegen spielst:</b> {BOSS[f.boss].howTo}</p>}
        <button type="button" className="btn primary big" onClick={onFight}>{f.gate ? "Prüfung starten" : "Kampf starten"}</button>
      </section>

      <details className="lad-rules">
        <summary>So funktioniert die Rangliste</summary>
        <ul>
          <li>Jeder Sieg gibt einen Streifen, jede Niederlage nimmt einen. Unentschieden ändert nichts.</li>
          <li>Unter deinen Gürtel fällst du nie – die Streifen enden bei 0.</li>
          <li>Auf Weiß kostet eine Niederlage keinen Streifen. So kommst du sicher rein.</li>
          <li>Ab dem {STREAK_FROM}. Sieg in Folge gibt es auf Weiß und Blau einen Bonus-Streifen.</li>
          <li>Bei 4 Streifen kommt die Gürtelprüfung: Boss schlagen, dann nächster Gürtel. Höher heißt mehr Bosse.</li>
          <li>Die Gegner passen sich deiner Spielstärke an und werden mit jedem Streifen etwas stärker.</li>
          <li>Jeden Monat beginnt eine neue Saison: Gürtel bleibt, Streifen starten bei 0.</li>
        </ul>
        <p className="small"><b>Im echten Grappling:</b> {LADDER_BJJ}{" "}
          <a href={LADDER_SRC.url} target="_blank" rel="noreferrer">Quelle: Wikipedia</a></p>
      </details>

      <section aria-labelledby="lad-rw-h">
        <h3 id="lad-rw-h" className="display">Belohnung</h3>
        <p className="small">Neuer Gürtel: 1 Mattenpaket – je Gürtel einmal pro Saison. Echtes Training eintragen bringt jeden Tag mehr.</p>
        <p className="small muted">Saison-Rahmen: Für deinen höchsten Gürtel der Saison bekommst du einen Rahmen für deine Kartenrücken. Reine Optik.</p>
        <div className="lad-frames" role="group" aria-label="Kartenrücken-Rahmen wählen">
          <button type="button" aria-pressed={s.frame === null} className={`lad-frame${s.frame === null ? " on" : ""}`} onClick={() => onChange(setChoice(s, { frame: null }))}>
            <span className="lad-frame-card" aria-hidden /> <span>Standard</span>
          </button>
          {BELT_IDS.map((id, i) => {
            const have = owned.includes(i);
            return (
              <button key={id} type="button" disabled={!have} aria-pressed={s.frame === i} className={`lad-frame${s.frame === i ? " on" : ""}`}
                onClick={() => onChange(setChoice(s, { frame: i }))}>
                <span className="lad-frame-card" aria-hidden style={{ ["--fr" as string]: BELT_COLOR[id].c, ["--fr-a" as string]: BELT_COLOR[id].a }} />
                <span>{BELT_NAME_SHORT[i]}{have ? "" : " · noch nicht"}</span>
              </button>
            );
          })}
        </div>
        {s.frames.length > 0 && (
          <p className="small muted">Vergangene Saisons: {s.frames.map((x) => `${seasonName(x.season).replace("Saison ", "")}: ${beltName(x.belt)}`).join(" · ")}</p>
        )}
      </section>

      {hist.length > 0 && (
        <section aria-labelledby="lad-h-h">
          <h3 id="lad-h-h" className="display">Bisher</h3>
          <ol className="lad-hist">{hist.map((h, i) => <HistItem key={i} h={h} />)}</ol>
        </section>
      )}
      {s.promo !== null && <Promotion belt={s.promo} season={s.season} onDone={() => onChange({ ...s, promo: null })} />}
    </div>
  );
}

const BELT_NAME_SHORT = BELT_IDS.map((_, i) => beltName(i));
const RES: Record<MatchResult, string> = { win: "Sieg", loss: "Niederlage", draw: "Unentschieden" };

function HistItem({ h }: { h: LadderEntry }) {
  const d = h.promoted ? `Befördert: ${beltName(h.to[0])}` : h.to[1] > h.from[1] ? `+${h.to[1] - h.from[1]} Streifen${h.bonus ? " (Serie)" : ""}`
    : h.to[1] < h.from[1] ? "−1 Streifen" : h.foe.gate && h.result === "win" ? "Prüfung: weiter" : "Stand bleibt";
  return (
    <li className={`is-${h.result}`}>
      <b>{RES[h.result]}</b> gegen {foeName(h.foe)}{h.mode === "plan" ? " · Spielplan" : ""}
      <span className="lad-hist-d">{d}</span>
    </li>
  );
}

/* ---------------- Beförderung ---------------- */
function Promotion({ belt, season, onDone }: { belt: number; season: string; onDone: () => void }) {
  const reduced = !!useReducedMotion();
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => { btn.current?.focus(); }, []);
  return (
    <div className="lad-promo-bg">
      <motion.div className="lad-promo" role="dialog" aria-modal="true" aria-labelledby="lad-promo-h"
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 20 }} animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
        transition={reduced ? { duration: 0.2 } : { type: "spring", stiffness: 240, damping: 20 }}>
        <span className="label">{seasonName(season)}</span>
        <h2 id="lad-promo-h" className="display">Neuer Spielrang: {beltName(belt)}</h2>
        <motion.div initial={reduced ? false : { x: -260 }} animate={{ x: 0 }} transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1], delay: 0.15 }}>
          <LadderBelt belt={belt} stripes={0} />
        </motion.div>
        <p>Stark gekämpft! Die Streifen starten wieder bei 0.</p>
        <p className="lad-honest small"><b>Ehrlich gesagt:</b> {HONESTY}</p>
        <p className="small muted">Belohnung: 1 Mattenpaket (je Gürtel einmal pro Saison).</p>
        <button ref={btn} type="button" className="btn primary big" onClick={onDone}>Weiter</button>
      </motion.div>
    </div>
  );
}

/* ---------------- Kampf ---------------- */
function bossFor(f: LadderFoe): BossDef | undefined {
  if (!f.boss) return undefined;
  const b = BOSS[f.boss];
  return f.level === b.level ? b : { ...b, level: f.level as 2 | 3 };
}

export function resultOf(s: State2): MatchResult {
  return !s.result || s.result.winner === null ? "draw" : s.result.winner === "p" ? "win" : "loss";
}

function LadderFight({ s, onDone }: { s: LadderState; onDone: (s: LadderState | null) => void }) {
  const f = s.next;
  const rec = useRef<LadderState | null>(null);
  const boss = bossFor(f);
  const plan = s.mode === "plan" ? myPlan(s.stil) : null;
  const stil = plan ? stilOfPlanId(plan.id) ?? s.stil : s.stil;
  const foePlan = s.mode === "plan" ? (f.boss ? { name: BOSS_PLANS[f.boss].name, cards: BOSS_PLANS[f.boss].cards } : { name: DEFAULT_PLAN[f.stil].name, cards: DEFAULT_PLAN[f.stil].cards }) : undefined;
  return (
    <ArenaK2 key={`lad-${s.seed}-${s.games}`} mode="free" seed={f.seed} aiLevel={f.level} boss={boss}
      stil={stil} foeStil={boss ? undefined : f.stil} foeStyle={foeStyle(f, stil, (x) => BOSS[x].counter)}
      {...(plan ? { plan: { name: planName(plan), cards: plan.cards }, foePlan } : {})}
      noRematch exitLabel="Zur Rangliste"
      onResult={(end) => {
        // Sofort speichern – auch wer jetzt die App schließt, behält das Ergebnis.
        const { state, info } = recordResult(s, resultOf(end));
        rec.current = state; writeLadder(state);
        if (info.promoted !== null) emitLearning({ type: "ladder_belt", belt: BELT_IDS[info.promoted], season: s.season, name: `${beltName(info.promoted)}gurt` });
        if (boss && end.result?.winner === "p") emitLearning({ type: "boss_first_win", boss: boss.id, name: boss.name });
      }}
      onExit={() => onDone(rec.current)} />
  );
}
