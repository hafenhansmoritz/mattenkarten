// Mechanik 6 „Spielplan-Modus“ (Spec B51–B56): Plan wählen, Gegner wählen, kämpfen.
// Mechanik 7 (B57–B62): eigene Pläne (Spielplan-Bauer, bis zu 5), Teilen per #plan=…, Sideboard vor dem Boss.
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArenaK2 } from "./ArenaK2";
import { BOSSES } from "../data/bosses";
import {
  BOSS_PLANS, BOSS_SIDEBOARD, DEFAULT_PLAN, DEFAULT_PLANS, MY_PLANS_MAX, PLAN_BJJ, PLAN_RULE, PLAN_SRC, availablePlanCards, deleteMyPlan, markPlanHintSeen,
  planName, readMyPlans, readPlan, readPlanHintSeen, stilOfPlanId, writePlan, type MyPlan, type SavedPlan,
} from "../data/plans";
import { decodePlan, planLink, readPlanFromHash } from "../data/planCode";
import { STIL, randomStil, readStil } from "../data/stile";
import { allCards, cardById, isPlanCard } from "../engine";
import { useCollection } from "../collection/store";
import { emitLearning } from "../rewards/events";
import { SpielplanBauer, type BauerProps } from "./SpielplanBauer";
import { Sideboard } from "./Sideboard";
import { CoachAvatar } from "../../components/learn";
import { KIND_LABEL, POS_LABEL } from "./meta";
import type { Pos2, StilId } from "../types";
import "../../styles/core2.css";

type Fight = { seed: number; level: 1 | 2 | 3; foe: StilId; boss?: StilId; cards?: string[] };
const LEVEL_NAME: Record<1 | 2 | 3, string> = { 1: "Locker", 2: "Normal", 3: "Hart" };
const POS_ORDER: Pos2[] = ["stand", "clinch", "headlock", "guard", "half", "turtle", "side", "mount", "back"];

/** Der gewählte Plan (gespeichert) oder der Standard-Plan des zuletzt gewählten Stils. */
function initialPlan(): SavedPlan {
  const saved = readPlan();
  if (saved) return saved;
  const d = DEFAULT_PLAN[readStil() ?? "ringer"];
  return { id: d.id, cards: d.cards };
}
/** Stil, den der Plan mitbringt (eigener Plan: sein gespeicherter Stil, sonst zuletzt gewählter Stil). */
function stilOfPlan(p: SavedPlan): StilId {
  return stilOfPlanId(p.id) ?? readStil() ?? "ringer";
}
/** Beim Öffnen: geteilter Plan aus #plan=… (einmal lesen, dann aus der Adresszeile nehmen). */
function initialImport(): BauerProps["start"] & { unknown: number } | null {
  const r = readPlanFromHash();
  if (!r) return null;
  try { history.replaceState(null, "", location.pathname); } catch { /* egal */ }
  return { name: "Geteilter Plan", stil: r.stil, cards: r.cards, unknown: r.unknown };
}
/** Wo die Karten eines Plans hingehören: Lage → Anzahl (für die Kurzübersicht). */
function spread(cards: string[]): { pos: Pos2; n: number }[] {
  const m = new Map<Pos2, number>();
  for (const id of cards) { const c = cardById(id); const p = c?.slots[0]?.pos; if (p) m.set(p, (m.get(p) ?? 0) + 1); }
  return POS_ORDER.filter((p) => m.has(p)).map((pos) => ({ pos, n: m.get(pos)! }));
}

export function SpielplanModus({ onBack }: { onBack: () => void }) {
  const [plan, setPlan] = useState<SavedPlan>(initialPlan);
  const [hint, setHint] = useState(() => !readPlanHintSeen());
  const [fight, setFight] = useState<Fight | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [mine, setMine] = useState<MyPlan[]>(readMyPlans);
  const [imp] = useState(initialImport);
  const [edit, setEdit] = useState<null | { start?: BauerProps["start"]; imported?: { unknown: number } }>(() => (imp ? { start: imp, imported: { unknown: imp.unknown } } : null));
  const [side, setSide] = useState<StilId | null>(null);
  const [code, setCode] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const col = useCollection();
  const reduced = !!useReducedMotion();
  useEffect(() => { if (!fight) window.scrollTo(0, 0); }, [fight, edit, side]);
  const pool = useMemo(() => {
    const pc = allCards().filter(isPlanCard).map((c) => c.id);
    const a = availablePlanCards(col.ids, pc, stilOfPlan(plan));
    // B60: mit kleiner Sammlung leihst du dir vor dem Boss auch seine empfohlenen Karten.
    const bossLeih = a.small && side ? BOSS_SIDEBOARD[side].wants : [];
    return [...new Set([...a.owned, ...a.leih, ...bossLeih, ...plan.cards])];
  }, [col.ids, plan, side]);

  if (fight) {
    const boss = fight.boss ? BOSSES.find((b) => b.id === fight.boss) : undefined;
    const foePlan = boss ? BOSS_PLANS[boss.id] : DEFAULT_PLAN[fight.foe];
    return (
      <ArenaK2 key={`plan-${fight.seed}`} mode="free" seed={fight.seed} aiLevel={fight.level} boss={boss}
        stil={stilOfPlan(plan)} foeStil={boss ? undefined : fight.foe}
        plan={{ name: planName(plan), cards: fight.cards ?? plan.cards }} foePlan={{ name: foePlan.name, cards: foePlan.cards }}
        onExit={(won) => { if (won && boss) emitLearning({ type: "boss_first_win", boss: boss.id, name: boss.name }); setFight(null); }} />
    );
  }
  if (edit) {
    return <SpielplanBauer start={edit.start} imported={edit.imported} onBack={() => setEdit(null)}
      onSaved={(p) => { const sp = { id: p.id, cards: p.cards }; setPlan(sp); writePlan(sp); setMine(readMyPlans()); setEdit(null); setNote(`„${p.name}“ gespeichert und gewählt.`); }} />;
  }
  if (side) {
    const b = BOSSES.find((x) => x.id === side)!;
    return <Sideboard boss={b} plan={{ name: planName(plan), cards: plan.cards }} pool={pool} onBack={() => setSide(null)}
      onStart={(cards) => { setSide(null); writePlan(plan); setFight({ level: b.level, foe: b.id, boss: b.id, cards, seed: Date.now() % 100000 }); }} />;
  }

  const pick = (id: string) => {
    const d = DEFAULT_PLANS.find((x) => x.id === id)!;
    const p = { id: d.id, cards: d.cards };
    setPlan(p); writePlan(p);
  };
  const start = (f: Omit<Fight, "seed">) => {
    writePlan(plan);
    setFight({ ...f, seed: Date.now() % 100000 });
  };

  return (
    <div className="screen more k2-planmode" lang="de">
      <button className="btn small ghost" onClick={onBack}>← Zurück</button>
      <h2 className="display" style={{ fontSize: 30 }}>Spielplan-Modus <span className="k2-new-tag">neu</span></h2>
      <p className="k2-plan-rule">{PLAN_RULE[0]} {PLAN_RULE[1]}</p>
      <p className="muted small k2-plan-bjj"><b>Im echten Grappling:</b> {PLAN_BJJ}{" "}
        <a href={PLAN_SRC.url} target="_blank" rel="noreferrer">Quelle: Gracie Barra</a></p>

      {hint && (
        <motion.div className="k2-plan-hint" role="note" initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <CoachAvatar size={30} />
          <div>
            <b>So geht der Spielplan-Modus</b>
            <ol>
              <li>Wähle einen Plan: 15 Angriffe, die du kannst.</li>
              <li>Vor dem Kampf siehst du 4. Tausche bis zu 2.</li>
              <li>Jede Runde ziehst du eine Karte nach.</li>
              <li>Aufbauen, Rahmen und Befreiungen gehen immer.</li>
            </ol>
            <button type="button" className="btn small" onClick={() => { markPlanHintSeen(); setHint(false); }}>Verstanden</button>
          </div>
        </motion.div>
      )}

      <h3 className="display" style={{ marginTop: 14 }}>Dein Spielplan</h3>
      <p className="muted small">Der Plan bringt seinen Spielstil mit. Standard-Pläne gehen immer – auch ohne Sammlung.</p>
      <div className="k2-plan-list">
        {DEFAULT_PLANS.map((d) => {
          const on = plan.id === d.id;
          const isOpen = open === d.id;
          return (
            <article key={d.id} className={`k2-plan-card${on ? " is-on" : ""}`}>
              <button type="button" className="k2-plan-pick" aria-pressed={on} onClick={() => pick(d.id)}>
                <strong className="display">{on ? "✓ " : ""}{d.name}</strong>
                <span className="k2-plan-stil">Stil: {STIL[d.stil].name}</span>
                <span className="k2-plan-idea">{d.idea}</span>
                <span className="k2-plan-spread">{spread(d.cards).map((x) => `${POS_LABEL[x.pos].replace(/ \(.*\)$/, "")} ${x.n}`).join(" · ")}</span>
              </button>
              <button type="button" className="k2-plan-more" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : d.id)}>
                {isOpen ? "Karten zuklappen" : "15 Karten ansehen"}
              </button>
              {isOpen && (
                <ul className="k2-plan-cards">
                  {d.cards.map((id) => { const c = cardById(id); return c ? <li key={id} className={`kind-${c.kind}`}><b>{c.plain}</b> <span className="k2-term">{c.term}</span> <span className="muted">· {KIND_LABEL[c.kind]}</span></li> : null; })}
                </ul>
              )}
            </article>
          );
        })}
      </div>

      <h3 className="display" style={{ marginTop: 16 }}>Meine Pläne <span className="k2-count">{mine.length}/{MY_PLANS_MAX}</span></h3>
      <p className="muted small">Bau dein eigenes System: 15 Angriffe, die vom Stand bis zur Aufgabe zusammenhängen.</p>
      {note && <p className="k2-bauer-msg" role="status">{note}</p>}
      {mine.length > 0 && (
        <div className="k2-plan-list">
          {mine.map((m) => {
            const on = plan.id === m.id;
            return (
              <article key={m.id} className={`k2-plan-card${on ? " is-on" : ""}`}>
                <button type="button" className="k2-plan-pick" aria-pressed={on} onClick={() => { const sp = { id: m.id, cards: m.cards }; setPlan(sp); writePlan(sp); }}>
                  <strong className="display">{on ? "✓ " : ""}{m.name}</strong>
                  <span className="k2-plan-stil">Stil: {STIL[m.stil].name} · eigener Plan</span>
                  <span className="k2-plan-spread">{spread(m.cards).map((x) => `${POS_LABEL[x.pos].replace(/ \(.*\)$/, "")} ${x.n}`).join(" · ")}</span>
                </button>
                <div className="k2-plan-tools">
                  <button type="button" className="k2-plan-tool" onClick={() => setEdit({ start: m })}>Bearbeiten</button>
                  <button type="button" className="k2-plan-tool" onClick={async () => {
                    const link = planLink(m.cards, m.stil);
                    try { await navigator.clipboard.writeText(link); setNote(`Link zu „${m.name}“ kopiert.`); } catch { setNote(link); }
                  }}>Teilen</button>
                  <button type="button" className="k2-plan-tool" onClick={() => {
                    setMine(deleteMyPlan(m.id));
                    if (on) { const d = DEFAULT_PLAN[m.stil]; const sp = { id: d.id, cards: d.cards }; setPlan(sp); writePlan(sp); }
                  }}>Löschen</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <div className="k2-bauer-actions">
        <button type="button" className="btn primary" disabled={mine.length >= MY_PLANS_MAX}
          onClick={() => { const d = DEFAULT_PLAN[stilOfPlan(plan)]; setEdit({ start: { name: "Mein Plan", stil: d.stil, cards: [...d.cards] } }); }}>
          {mine.length >= MY_PLANS_MAX ? `Höchstens ${MY_PLANS_MAX} Pläne` : "Neuen Plan bauen"}
        </button>
      </div>
      <form className="k2-plan-import" onSubmit={(e) => {
        e.preventDefault();
        const r = decodePlan(code);
        if (!r) { setNote("Der Code passt nicht – prüf, ob er ganz kopiert ist."); return; }
        setCode(""); setEdit({ start: { name: "Geteilter Plan", stil: r.stil, cards: r.cards }, imported: { unknown: r.unknown } });
      }}>
        <label>Plan-Code oder Link
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="MP1-…" />
        </label>
        <button type="submit" className="btn small" disabled={!code.trim()}>Laden</button>
      </form>

      <h3 className="display" style={{ marginTop: 16 }}>Gegner</h3>
      <p className="muted small">Er spielt den Standard-Plan seines Stils. Du kennst seinen Plan, nicht seine Hand.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {([1, 2, 3] as const).map((lv) => (
          <button key={lv} type="button" className={`btn${lv === 3 ? " primary" : ""}`}
            onClick={() => start({ level: lv, foe: randomStil(Math.random) })}>{LEVEL_NAME[lv]}</button>
        ))}
      </div>
      <h3 className="display" style={{ marginTop: 16 }}>Gegen einen Boss</h3>
      <p className="muted small">Vorher siehst du seinen Stil und darfst bis zu 3 Karten tauschen.</p>
      <div className="more-list">
        {BOSSES.map((b) => (
          <button key={b.id} type="button" className="more-item" onClick={() => { writePlan(plan); setSide(b.id); }}>
            <strong className="display">{b.name}</strong>
            <span className="muted small">Signatur-Plan „{BOSS_PLANS[b.id].name}“: {BOSS_PLANS[b.id].idea}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
