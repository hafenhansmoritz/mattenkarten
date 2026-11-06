// Mechanik 9 „Draft“ (Spec B69–B75): Stil wählen, 15× eine von 3 Karten nehmen, dann Lauf bis 7 Siege oder 3 Niederlagen.
// Unter jeder Karte steht, warum sie passt oder wo die Lücke ist – der Coach-Tipp markiert auf Wunsch die beste.
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArenaK2 } from "./ArenaK2";
import { SystemMap, SystemPanel } from "./SpielplanBauer";
import { CoachAvatar } from "../../components/learn";
import { allCards, cardById, isPlanCard, systemCheck } from "../engine";
import type { PlanState } from "../engine/planBuilder";
import { BOSS } from "../data/bosses";
import { STIL, STILE } from "../data/stile";
import { stilCards } from "../data/plans";
import { emitLearning } from "../rewards/events";
import { DRAFT_REWARD_MIN_WINS, draftAmount } from "../rewards/table";
import {
  DRAFT_PICKS, DRAFT_PHASES, PHASE_DO, PHASE_LABEL, coachPick, draftGapText, draftHint, phaseOf, placeWo, placeWohin, slotPhase,
} from "../draft/draft";
import {
  RUN_LOSSES, RUN_WINS, BOSS_AT, applyNotfall, matchLog, newRun, pickCard, randomRunStil, recordMatch, runSummary, type DraftCtx, type DraftRun, type Foe,
} from "../draft/run";
import { readRun, writeRun } from "../draft/store";
import type { Card2, StilId } from "../types";
import { ZONE_LABEL } from "./meta";
import "../../styles/core2.css";
import "../../styles/draft.css";

export const DRAFT_BJJ = "Erst die Position sichern, dann angreifen – jede Technik bringt dich eine Stufe weiter.";
export const DRAFT_SRC = { title: "JitsuIQ – Positional Hierarchy", url: "https://jitsuiq.com/concepts/positional-hierarchy.html" };
export const DRAFT_RULE = [
  "Du wählst 15-mal eine von 3 Karten – Zum Boden, Nach vorn, Aufgabe im Wechsel.",
  "Dann kämpfst du mit diesem Plan, bis du 7 Siege oder 3 Niederlagen hast.",
];

const st = (c: Card2): PlanState => `${c.slots[0].pos}/${c.slots[0].role}` as PlanState;
const LEVEL_NAME: Record<2 | 3, string> = { 2: "Normal", 3: "Hart" };
const wl = (w: number, l: number, sep = " · ") => `${w} ${w === 1 ? "Sieg" : "Siege"}${sep}${l} ${l === 1 ? "Niederlage" : "Niederlagen"}`;

function useCtx(): DraftCtx {
  return useMemo(() => ({ pool: allCards().filter(isPlanCard).map((c) => c.id), cardOf: cardById, basics: allCards().filter((c) => !isPlanCard(c)) }), []);
}

export function DraftModus({ onBack }: { onBack: () => void }) {
  const ctx = useCtx();
  const [run, setRunState] = useState<DraftRun | null>(() => readRun((id) => !!cardById(id)));
  const [fight, setFight] = useState(false);
  const setRun = (r: DraftRun | null) => { setRunState(r); writeRun(r); };
  useEffect(() => { if (!fight) window.scrollTo(0, 0); }, [fight, run?.phase, run?.picks.length]);

  // B74: Belohnung genau einmal melden, sobald der Lauf fertig ist (Tagesgrenze prüft die Belohnungs-Tabelle).
  useEffect(() => {
    if (run?.phase === "done" && !run.rewarded) {
      if (run.wins >= DRAFT_REWARD_MIN_WINS) emitLearning({ type: "draft_run", wins: run.wins });
      setRun({ ...run, rewarded: true });
    }
  }, [run]); // eslint-disable-line react-hooks/exhaustive-deps

  if (fight && run?.phase === "run" && run.next) {
    return <DraftFight run={run} ctx={ctx} onDone={(r) => { if (r) setRun(r); setFight(false); }} />;
  }
  if (!run) return <DraftStart onBack={onBack} onStart={(stil, random) => setRun(newRun(Date.now() >>> 0, stil, random, ctx))} />;
  if (run.phase === "draft") return <DraftPick run={run} ctx={ctx} onBack={onBack} onRun={setRun} />;
  if (run.phase === "notfall") return <DraftNotfall run={run} ctx={ctx} onBack={onBack} onRun={setRun} />;
  if (run.phase === "run") return <DraftHub run={run} ctx={ctx} onBack={onBack} onFight={() => setFight(true)} onQuit={() => setRun(null)} />;
  return <DraftEnd run={run} onBack={onBack} onNew={() => setRun(null)} />;
}

/* ---------------- Start ---------------- */
function DraftStart({ onBack, onStart }: { onBack: () => void; onStart: (stil: StilId, random: boolean) => void }) {
  const [sel, setSel] = useState<StilId | "zufall">("zufall");
  return (
    <div className="screen more k2-draft" lang="de">
      <button type="button" className="btn small ghost" onClick={onBack}>← Zurück</button>
      <h2 className="display" style={{ fontSize: 30 }}>Draft <span className="k2-new-tag">neu</span></h2>
      <p className="k2-plan-rule">{DRAFT_RULE[0]} {DRAFT_RULE[1]}</p>
      <p className="muted small"><b>Im echten Grappling:</b> {DRAFT_BJJ}{" "}
        <a href={DRAFT_SRC.url} target="_blank" rel="noreferrer">Quelle: JitsuIQ</a></p>
      <div className="k2-plan-hint" role="note">
        <CoachAvatar size={30} />
        <div>
          <b>So geht der Draft</b>
          <ol>
            <li>Wähl einen Spielstil – oder lass ihn auslosen.</li>
            <li>Nimm 15-mal eine von 3 Karten. Unter jeder steht, ob sie passt.</li>
            <li>Dein Plan muss eine Kette sein: runter, nach vorn, beenden.</li>
            <li>Kämpf, bis du 7 Siege oder 3 Niederlagen hast.</li>
          </ol>
          <p className="small" style={{ margin: 0 }}>Kostet nichts. Ab {DRAFT_REWARD_MIN_WINS} Siegen gibt es ein Mattenpaket – höchstens ein Lauf pro Tag.</p>
        </div>
      </div>
      <h3 className="display" style={{ marginTop: 14 }}>Dein Spielstil</h3>
      <div className="k2-draft-stile" role="group" aria-label="Spielstil wählen">
        {STILE.map((x) => (
          <button key={x.id} type="button" className={`k2-draft-stil${sel === x.id ? " on" : ""}`} aria-pressed={sel === x.id} onClick={() => setSel(x.id)}>
            <strong>{x.name}</strong><span>{x.tagline}</span>
          </button>
        ))}
        <button type="button" className={`k2-draft-stil${sel === "zufall" ? " on" : ""}`} aria-pressed={sel === "zufall"} onClick={() => setSel("zufall")}>
          <strong>Zufall</strong><span>Lass dich überraschen</span>
        </button>
      </div>
      <p className="muted small">Der Stil bringt seine Fähigkeit mit. Karten deines Stils tauchen etwas öfter auf.</p>
      <button type="button" className="btn primary big" onClick={() => {
        const seed = Date.now() >>> 0;
        if (sel === "zufall") onStart(randomRunStil(seed), true); else onStart(sel, false);
      }}>Draft starten</button>
    </div>
  );
}

/* ---------------- Picks ---------------- */
function DraftPick({ run, ctx, onBack, onRun }: { run: DraftRun; ctx: DraftCtx; onBack: () => void; onRun: (r: DraftRun) => void }) {
  const reduced = !!useReducedMotion();
  const sys = systemCheck(run.picks, cardById, ctx.basics);
  const phase = slotPhase(run.picks.length);
  const hints = run.offer.map((id) => draftHint(id, run.picks, cardById, ctx.basics, ctx.pool));
  const best = coachPick(run.offer, run.picks, cardById, ctx.basics, ctx.pool, stilCards(run.stil));
  const n = run.picks.length + 1;
  return (
    <div className="screen more k2-draft" lang="de">
      <button type="button" className="btn small ghost" onClick={onBack}>← Zurück</button>
      <div className="k2-draft-top">
        <span className="label">Draft · {STIL[run.stil].name}{run.stilRandom ? " (ausgelost)" : ""}</span>
        <h2 className="display" style={{ fontSize: 26, margin: "2px 0" }}>Pick {n} von {DRAFT_PICKS}</h2>
        <div className="k2-draft-bar" role="progressbar" aria-label="Picks" aria-valuemin={0} aria-valuemax={DRAFT_PICKS} aria-valuenow={run.picks.length}>
          {Array.from({ length: DRAFT_PICKS }, (_, i) => <span key={i} className={`ph-${slotPhase(i)}${i < run.picks.length ? " done" : i === run.picks.length ? " now" : ""}`} />)}
        </div>
      </div>
      <p className="k2-draft-phase"><span className={`k2-draft-chip ph-${phase}`}>{PHASE_LABEL[phase]}</span> {PHASE_DO[phase]}</p>
      <SystemMap sys={sys} />
      <div className="k2-draft-coach">
        <button type="button" className="k2-draft-toggle" aria-pressed={run.coach} onClick={() => onRun({ ...run, coach: !run.coach })}>
          <span className="k2-draft-switch" aria-hidden><span /></span> Coach-Tipp
        </button>
        <span className="muted small">{run.coach ? "Markiert die Karte, die am besten passt." : "Lies die Hinweise – du entscheidest."}</span>
      </div>
      <h3 className="sr-only">Wähle eine Karte</h3>
      <ul className="k2-draft-offer">
        {run.offer.map((id, i) => {
          const c = cardById(id)!;
          const h = hints[i];
          const tip = run.coach && i === best;
          return (
            <motion.li key={`${run.picks.length}-${id}`} initial={reduced ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduced ? 0 : i * 0.06 }}>
              <button type="button" className={`k2-draft-card kind-${c.kind}${tip ? " is-tip" : ""}${h.ok ? " is-ok" : " is-gap"}`}
                onClick={() => onRun(pickCard(run, id, ctx))} aria-describedby={`k2-dh-${i}`}>
                {tip && <span className="k2-draft-tipbadge">Coach-Tipp</span>}
                <span className={`k2-draft-chip ph-${phaseOf(c)}`}>{PHASE_LABEL[phaseOf(c)]}</span>
                <strong className="display">{c.plain}</strong>
                <span className="k2-term">{c.term}</span>
                <span className="k2-draft-where">{c.submission ? `Aufgabe ${placeWo(st(c))}` : c.to ? `${placeWo(st(c))} → ${placeWohin(`${c.to.pos}/${c.to.role}` as PlanState)}` : placeWo(st(c))} · {ZONE_LABEL[c.zone]}</span>
                <span className="k2-draft-do">{c.plainDo}</span>
                <span id={`k2-dh-${i}`} className={`k2-draft-hint ${h.ok ? "ok" : "gap"}`}><span aria-hidden>{h.ok ? "✓" : "!"}</span> {h.text}</span>
              </button>
            </motion.li>
          );
        })}
      </ul>
      {run.picks.length > 0 && <PickList picks={run.picks} />}
    </div>
  );
}

function PickList({ picks }: { picks: string[] }) {
  return (
    <section className="k2-draft-picks" aria-labelledby="k2-dp-h">
      <h3 id="k2-dp-h" className="display">Dein Plan bisher ({picks.length})</h3>
      {DRAFT_PHASES.map((ph) => {
        const xs = picks.filter((id) => { const c = cardById(id); return c && phaseOf(c) === ph; });
        return xs.length ? (
          <div key={ph} className="k2-draft-group">
            <span className={`k2-draft-chip ph-${ph}`}>{PHASE_LABEL[ph]} {xs.length}</span>
            <ul>{xs.map((id) => <li key={id}>{cardById(id)?.plain}</li>)}</ul>
          </div>
        ) : null;
      })}
    </section>
  );
}

/* ---------------- Notfall-Tausch ---------------- */
function DraftNotfall({ run, ctx, onBack, onRun }: { run: DraftRun; ctx: DraftCtx; onBack: () => void; onRun: (r: DraftRun) => void }) {
  const sys = systemCheck(run.picks, cardById, ctx.basics);
  const gap = draftGapText(run.picks, cardById, ctx.basics);
  const name = (id: string) => cardById(id)?.plain ?? id;
  return (
    <div className="screen more k2-draft" lang="de">
      <button type="button" className="btn small ghost" onClick={onBack}>← Zurück</button>
      <span className="label">Draft · System-Prüfung</span>
      <h2 className="display" style={{ fontSize: 26 }}>Notfall-Tausch</h2>
      <p className="k2-plan-rule">Deine Kette hat noch eine Lücke: {gap} Tausch eine Karte – kostenlos.</p>
      <SystemPanel ids={run.picks} sys={sys} />
      <ul className="k2-draft-offer">
        {run.notfall.map((sw, i) => (
          <li key={sw.in}>
            <button type="button" className="k2-draft-card is-ok k2-draft-swap" onClick={() => onRun(applyNotfall(run, i, ctx))}>
              <span className="k2-draft-swapline"><s>{name(sw.out)}</s> <span aria-hidden>→</span><span className="sr-only">tauschen gegen</span> <strong>{name(sw.in)}</strong></span>
              <span className="k2-draft-hint ok"><span aria-hidden>✓</span> {sw.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Lauf ---------------- */
function Belt({ wins, losses }: { wins: number; losses: number }) {
  return (
    <div className="k2-draft-belt" role="img" aria-label={`${wins} von ${RUN_WINS} Siegen, ${losses} von ${RUN_LOSSES} Niederlagen`}>
      <div className="k2-belt">
        <span className="k2-belt-body" />
        <span className="k2-belt-bar">
          {Array.from({ length: RUN_WINS }, (_, i) => <span key={i} className={`k2-belt-stripe${i < wins ? " on" : ""}`} />)}
        </span>
      </div>
      <div className="k2-draft-losses" aria-hidden>
        {Array.from({ length: RUN_LOSSES }, (_, i) => <span key={i} className={i < losses ? "on" : ""}>✕</span>)}
      </div>
    </div>
  );
}

function foeLabel(f: Foe): string {
  return f.boss ? `Boss · ${BOSS[f.boss].name}` : `KI ${LEVEL_NAME[f.level]} · ${STIL[f.stil].name}`;
}

function DraftHub({ run, ctx, onBack, onFight, onQuit }: { run: DraftRun; ctx: DraftCtx; onBack: () => void; onFight: () => void; onQuit: () => void }) {
  const [sure, setSure] = useState(false);
  const f = run.next!;
  const sys = systemCheck(run.picks, cardById, ctx.basics);
  const n = run.matches.length + 1;
  return (
    <div className="screen more k2-draft" lang="de">
      <button type="button" className="btn small ghost" onClick={onBack}>← Zurück</button>
      <span className="label">Draft-Lauf · {STIL[run.stil].name}</span>
      <h2 className="display" style={{ fontSize: 26 }}>{wl(run.wins, run.losses)}</h2>
      <Belt wins={run.wins} losses={run.losses} />
      <p className="muted small">Jeder Sieg ist ein Streifen auf deinem Gürtel. Bei {RUN_WINS} Streifen oder {RUN_LOSSES} ✕ ist der Lauf vorbei.</p>
      <section className={`k2-draft-next${f.boss ? " is-boss" : ""}`} aria-labelledby="k2-dn-h">
        <span className="label">Kampf {n}{n - 1 === BOSS_AT ? " · Boss" : ""}</span>
        <h3 id="k2-dn-h" className="display">{foeLabel(f)}</h3>
        <p className="small">Er spielt „{f.planName}“. {f.boss ? BOSS[f.boss].likes : `Stufe ${f.level === 2 ? "2: macht Fehler" : "3: spielt stark"}.`}</p>
        <button type="button" className="btn primary big" onClick={onFight}>Kampf starten</button>
      </section>
      {run.matches.length > 0 && (
        <section aria-labelledby="k2-dm-h">
          <h3 id="k2-dm-h" className="display">Bisher</h3>
          <ol className="k2-draft-log">
            {run.matches.map((m, i) => (
              <li key={i} className={`is-${m.result}`}>
                <b>{m.result === "win" ? "Sieg" : m.result === "loss" ? "Niederlage" : "Unentschieden (zählt als Niederlage)"}</b> gegen {foeLabel(m.foe)}{m.tap ? " · per Aufgabe" : ""}
              </li>
            ))}
          </ol>
        </section>
      )}
      <section aria-labelledby="k2-dpl-h">
        <h3 id="k2-dpl-h" className="display">Dein Draft-Plan</h3>
        <SystemPanel ids={run.picks} sys={sys} />
        <PickList picks={run.picks} />
      </section>
      <div className="k2-bauer-actions">
        {!sure ? <button type="button" className="btn small ghost" onClick={() => setSure(true)}>Lauf aufgeben</button>
          : <><span className="small">Wirklich? Der Lauf endet ohne Belohnung.</span>
            <button type="button" className="btn small" onClick={onQuit}>Ja, aufgeben</button>
            <button type="button" className="btn small ghost" onClick={() => setSure(false)}>Nein</button></>}
      </div>
    </div>
  );
}

function DraftFight({ run, ctx, onDone }: { run: DraftRun; ctx: DraftCtx; onDone: (r: DraftRun | null) => void }) {
  const f = run.next!;
  const rec = useRef<DraftRun | null>(null);
  const boss = f.boss ? BOSS[f.boss] : undefined;
  return (
    <ArenaK2 key={`draft-${run.seed}-${run.matches.length}`} mode="free" seed={f.seed} aiLevel={f.level} boss={boss}
      stil={run.stil} foeStil={boss ? undefined : f.stil}
      plan={{ name: "Dein Draft", cards: run.picks }} foePlan={{ name: f.planName, cards: f.plan }}
      noRematch exitLabel="Weiter im Lauf"
      onResult={(s) => {
        // Sofort speichern – auch wer jetzt die App schließt, verliert den Kampf nicht.
        const next = recordMatch(run, matchLog(s, "p", run.picks, cardById), ctx);
        rec.current = next; writeRun(next);
        if (boss && s.result?.winner === "p") emitLearning({ type: "boss_first_win", boss: boss.id, name: boss.name });
      }}
      onExit={() => onDone(rec.current)} />
  );
}

/* ---------------- Ende ---------------- */
function DraftEnd({ run, onBack, onNew }: { run: DraftRun; onBack: () => void; onNew: () => void }) {
  const sum = runSummary(run);
  const steps: [string, boolean][] = [["Stand", true], ["Boden", sum.stages.boden], ["Kontrolle", sum.stages.kontrolle], ["Aufgabe", sum.stages.aufgabe]];
  const amt = draftAmount(run.wins);
  const name = (id: string) => cardById(id)?.plain ?? id;
  const title = run.wins >= RUN_WINS ? "Sieben Streifen – stark!" : run.wins >= DRAFT_REWARD_MIN_WINS ? "Guter Lauf" : "Lauf vorbei";
  return (
    <div className="screen more k2-draft" lang="de">
      <button type="button" className="btn small ghost" onClick={onBack}>← Zurück</button>
      <span className="label">Draft-Lauf · Ende</span>
      <h2 className="display" style={{ fontSize: 30 }}>{title}</h2>
      <Belt wins={run.wins} losses={run.losses} />
      <p className="k2-plan-rule">{wl(run.wins, run.losses, ", ")}{sum.taps ? `, ${sum.taps}× per Aufgabe` : ""}.</p>
      <section className="k2-draft-sum" aria-labelledby="k2-ds-h">
        <h3 id="k2-ds-h" className="display">Deine beste Kette</h3>
        {sum.best ? (
          <>
            <p className="k2-draft-chain">{sum.best.chain.map((id, i) => <span key={i}>{i > 0 && <span aria-hidden> → </span>}<b>{name(id)}</b></span>)}{sum.best.tap ? <span> → <b>Tap!</b></span> : null}</p>
            <p className="muted small">gegen {foeLabel(sum.best.foe)}</p>
          </>
        ) : <p className="muted small">Noch keine Kette – nächstes Mal: runter, dann eine Lage weiter.</p>}
        <h3 className="display">Wege genutzt</h3>
        <p className="k2-end-path" aria-label={`Erreicht: ${steps.filter((x) => x[1]).map((x) => x[0]).join(", ")}`}>
          {steps.map(([l, ok], i) => <span key={l} className={ok ? "is-on" : "is-off"}>{i > 0 ? " → " : ""}{ok ? "✓ " : ""}{l}</span>)}
        </p>
        <p className="small">{sum.hitCards} von {DRAFT_PICKS} Karten deines Drafts haben getroffen.</p>
      </section>
      <p className="k2-draft-reward small">
        {amt.packs > 0 ? `Belohnung: ${amt.packs} Mattenpaket${amt.staub ? ` + ${amt.staub} Staub` : ""} – wenn heute noch kein Lauf belohnt wurde.`
          : `Ab ${DRAFT_REWARD_MIN_WINS} Siegen gibt es ein Mattenpaket. Ein neuer Lauf kostet nichts.`}
      </p>
      <button type="button" className="btn primary big" onClick={onNew}>Neuer Draft</button>
    </div>
  );
}
