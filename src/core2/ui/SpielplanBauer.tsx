// Mechanik 7 „Spielplan-Bauer“ (Spec B57–B62): 15 Angriffe wählen, System-Prüfung mit Ketten-Karte, Kurve, speichern und teilen.
import { useMemo, useState } from "react";
import { allCards, cardById, isPlanCard, systemCheck, planCurve, suggestFix, planErrors, planCost, PLAN_SIZE, STAGES, CURVE_HINT, CURVE_HEAVY, CURVE_MAX_HEAVY } from "../engine";
import type { SystemResult } from "../engine";
import { keywordsOf } from "../data/keywords";
import {
  DEFAULT_PLANS, LEIH_MIN, MY_PLANS_MAX, PLAN_NAME_MAX, availablePlanCards, newPlanId, readMyPlans, saveMyPlan, type MyPlan,
} from "../data/plans";
import { encodePlan, planLink } from "../data/planCode";
import { STIL } from "../data/stile";
import { STIL_IDS } from "../engine/stil";
import { useCollection } from "../collection/store";
import { POS_LABEL } from "./meta";
import type { Card2, Pos2, StilId } from "../types";

const POS_ORDER: Pos2[] = ["stand", "clinch", "headlock", "guard", "half", "turtle", "side", "mount", "back"];
const POS_SHORT: Record<Pos2, string> = { stand: "Stand", clinch: "Clinch", headlock: "Kopfklammer", guard: "Guard", half: "Halbe Guard", turtle: "Turtle", side: "Side", mount: "Mount", back: "Rücken" };
type Phase = "boden" | "vorn" | "aufgabe";
const PHASE_LABEL: Record<Phase, string> = { boden: "Zum Boden", vorn: "Nach vorn", aufgabe: "Aufgabe" };
const STANDING = new Set<Pos2>(["stand", "clinch", "headlock"]);
function phaseOf(c: Card2): Phase {
  if (c.submission) return "aufgabe";
  return c.slots.some((s) => STANDING.has(s.pos)) ? "boden" : "vorn";
}
const KW_FILTER = ["takedown", "pass", "aufgabe", "kette", "atem"] as const;
const KW_LABEL: Record<(typeof KW_FILTER)[number], string> = { takedown: "Takedown", pass: "Pass", aufgabe: "Aufgabe", kette: "Kette", atem: "Atem" };

/** Ketten-Karte Stand → Clinch → Boden → Kontrolle → Aufgabe mit Lücken in Rot. */
export function SystemMap({ sys }: { sys: SystemResult }) {
  return (
    <ol className="k2-sysmap" aria-label="Deine Kette vom Stand bis zur Aufgabe">
      {STAGES.map((st, i) => {
        const v = sys.stages[st.id];
        const word = v === "ok" ? "da" : v === "skip" ? "übersprungen" : "Lücke";
        return (
          <li key={st.id} className={`k2-sysmap-step is-${v}`}>
            {i > 0 && <span className="k2-sysmap-arrow" aria-hidden>→</span>}
            <span className="k2-sysmap-node"><span aria-hidden>{v === "ok" ? "✓" : v === "skip" ? "–" : "!"}</span> {st.label}<span className="sr-only">: {word}</span></span>
          </li>
        );
      })}
    </ol>
  );
}

export function SystemPanel({ ids, sys }: { ids: string[]; sys: SystemResult }) {
  const name = (id: string) => cardById(id)?.plain ?? id;
  return (
    <div className="k2-sys">
      <SystemMap sys={sys} />
      <ul className="k2-sys-rules">
        {sys.rules.map((r) => (
          <li key={r.id} className={r.ok ? "is-ok" : "is-bad"}>
            <span aria-hidden>{r.ok ? "✓" : "✗"}</span> {r.label}: <b>{r.id === "erreichbar" ? `${r.have} von ${r.need}` : `${r.have} (mind. ${r.need})`}</b>
            {r.id === "erreichbar" && !r.ok && <> – nie erreichbar: {sys.unreachableFinishes.map(name).join(", ")}</>}
          </li>
        ))}
        {sys.gaps.map((g) => <li key={g.state} className="is-bad"><span aria-hidden>!</span> {g.text}</li>)}
        {sys.dead.length > 0 && ids.length > 0 && <li className="is-warn"><span aria-hidden>!</span> Nie spielbar in deinem Plan: {sys.dead.map(name).join(", ")}</li>}
      </ul>
    </div>
  );
}

export function CurveChart({ ids }: { ids: string[] }) {
  const cv = planCurve(ids, cardById);
  const max = Math.max(4, ...cv.bins);
  return (
    <div className="k2-curve">
      <div className="k2-curve-bars" role="img" aria-label={`Kurve: ${cv.bins.map((n, k) => `${n} Karten kosten ${k === 3 ? "3 oder mehr" : k}`).join(", ")}`}>
        {cv.bins.map((n, k) => (
          <div key={k} className={`k2-curve-col${k >= CURVE_HEAVY ? " is-heavy" : ""}`}>
            <span className="k2-curve-n">{n}</span>
            <span className="k2-curve-bar" style={{ height: `${(n / max) * 56}px` }} />
            <span className="k2-curve-k">{k === 3 ? "3+" : k}</span>
          </div>
        ))}
      </div>
      <p className="muted small">Kosten = Atem + Keile, die die Karte vorher braucht. {cv.heavy} Karten kosten 2 oder mehr (gut: höchstens {CURVE_MAX_HEAVY}).</p>
      {cv.tooHeavy && <p className="k2-curve-hint" role="status">{CURVE_HINT}</p>}
    </div>
  );
}

export interface BauerProps {
  /** Zu bearbeitender Plan (eigener Plan oder Vorlage). */
  start?: { id?: string; name: string; stil: StilId; cards: string[] };
  /** Mit Hinweis „Geteilter Plan“ (aus #plan=…). */
  imported?: { unknown: number };
  onSaved: (p: MyPlan) => void;
  onBack: () => void;
}

export function SpielplanBauer({ start, imported, onSaved, onBack }: BauerProps) {
  const col = useCollection();
  const [id] = useState(() => start?.id ?? newPlanId());
  const [name, setName] = useState(start?.name ?? "Mein Plan");
  const [stil, setStil] = useState<StilId>(start?.stil ?? "ringer");
  const [ids, setIds] = useState<string[]>(() => (start?.cards ?? []).filter((x) => { const c = cardById(x); return !!c && isPlanCard(c); }).slice(0, PLAN_SIZE));
  const [pos, setPos] = useState<Pos2 | null>(null);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [kw, setKw] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);

  const planCards = useMemo(() => allCards().filter(isPlanCard), []);
  const basics = useMemo(() => allCards().filter((c) => !isPlanCard(c)), []);
  const avail = useMemo(() => availablePlanCards(col.ids, planCards.map((c) => c.id), stil), [col.ids, planCards, stil]);
  const usable = useMemo(() => new Set([...avail.owned, ...avail.leih, ...ids]), [avail, ids]);
  const sys = useMemo(() => systemCheck(ids, cardById, basics), [ids, basics]);
  const errs = planErrors(ids, cardById);
  const valid = errs.length === 0 && sys.ok;
  const fix = useMemo(() => (ids.length >= 6 ? suggestFix(ids, [...usable], cardById, basics) : null), [ids, usable, basics]);
  const othersFull = readMyPlans().filter((p) => p.id !== id).length >= MY_PLANS_MAX;

  const shown = planCards.filter((c) => {
    if (!usable.has(c.id)) return false;
    if (pos && !c.slots.some((s) => s.pos === pos)) return false;
    if (phase && phaseOf(c) !== phase) return false;
    if (kw && !keywordsOf(c).some((k) => k.id === kw)) return false;
    const t = q.trim().toLowerCase();
    if (t && !`${c.plain} ${c.term}`.toLowerCase().includes(t)) return false;
    return true;
  }).sort((a, b) => POS_ORDER.indexOf(a.slots[0].pos) - POS_ORDER.indexOf(b.slots[0].pos));
  const locked = planCards.length - usable.size;

  const toggle = (cid: string) => {
    if (ids.includes(cid)) { setMsg(null); setIds(ids.filter((x) => x !== cid)); return; }
    if (ids.length >= PLAN_SIZE) { setMsg(`Schon ${PLAN_SIZE} Karten – nimm erst eine raus.`); return; }
    setMsg(null); setIds([...ids, cid]);
  };
  const applyFix = () => {
    if (!fix) return;
    setIds((cur) => (fix.remove ? cur.map((x) => (x === fix.remove ? fix.add : x)) : cur.length < PLAN_SIZE ? [...cur, fix.add] : cur));
  };
  const loadTemplate = (pid: string) => {
    const d = DEFAULT_PLANS.find((x) => x.id === pid);
    if (!d) return;
    setStil(d.stil); setIds([...d.cards]); setMsg(`Vorlage „${d.name}“ geladen – jetzt anpassen.`);
  };
  const save = () => {
    try {
      const p: MyPlan = { id, name, stil, cards: ids };
      saveMyPlan(p);
      onSaved({ ...p, name: name.trim().slice(0, PLAN_NAME_MAX) || "Eigener Plan" });
    } catch (e) { setMsg((e as Error).message); }
  };
  const share = async () => {
    const link = planLink(ids, stil);
    try { await navigator.clipboard.writeText(link); setMsg("Link kopiert – schick ihn deinem Trainingspartner."); } catch { setMsg("Kopieren ging nicht – nimm den Code unten."); }
    setShowCode(true);
  };
  const saveWhy = errs.length ? errs[0] : !sys.ok ? "Erst die Kette schließen (siehe Prüfung)." : othersFull ? `Höchstens ${MY_PLANS_MAX} Pläne – lösch erst einen.` : "";

  return (
    <div className="screen more k2-bauer" lang="de">
      <button className="btn small ghost" onClick={onBack}>← Zurück</button>
      <h2 className="display" style={{ fontSize: 28 }}>Spielplan-Bauer</h2>
      <p className="k2-plan-rule">Bau ein System: ein Weg vom Stand bis zur Aufgabe. Grundlagen (Keile, Rahmen, Befreiungen) kannst du sowieso.</p>
      {imported && <p className="k2-bauer-note" role="status">Geteilter Plan geladen{imported.unknown ? ` – ${imported.unknown} Karten kennt diese Version nicht` : ""}. Speichern, dann spielen.</p>}

      <div className="k2-bauer-head">
        <label className="k2-bauer-name">Name
          <input value={name} maxLength={PLAN_NAME_MAX} onChange={(e) => setName(e.target.value)} />
        </label>
        <fieldset className="k2-bauer-stil">
          <legend>Spielstil</legend>
          {STIL_IDS.map((s) => (
            <button key={s} type="button" className={`k2-chip${stil === s ? " is-on" : ""}`} aria-pressed={stil === s} onClick={() => setStil(s)}>{STIL[s].name}</button>
          ))}
        </fieldset>
      </div>

      <section aria-labelledby="k2-sys-h">
        <h3 id="k2-sys-h" className="display">System-Prüfung <span className={`k2-count${ids.length === PLAN_SIZE ? " is-full" : ""}`}>{ids.length}/{PLAN_SIZE}</span></h3>
        <SystemPanel ids={ids} sys={sys} />
        {fix && (
          <p className="k2-fix" role="status"><b>Tipp:</b> {fix.text}{" "}
            <button type="button" className="btn small" onClick={applyFix}>Übernehmen</button></p>
        )}
      </section>

      <section aria-labelledby="k2-curve-h">
        <h3 id="k2-curve-h" className="display">Kurve</h3>
        <CurveChart ids={ids} />
      </section>

      <section aria-labelledby="k2-mine-h">
        <h3 id="k2-mine-h" className="display">Dein Plan</h3>
        {ids.length === 0 ? <p className="muted small">Noch leer. Lade eine Vorlage oder tippe unten Karten an.</p> : (
          <ul className="k2-bauer-mine">
            {ids.map((cid) => { const c = cardById(cid)!; return (
              <li key={cid}><button type="button" className="k2-mine-chip" onClick={() => toggle(cid)} aria-label={`${c.plain} entfernen`}>
                {c.plain} <span aria-hidden>×</span></button></li>
            ); })}
          </ul>
        )}
        <div className="k2-bauer-tpl">
          <span className="muted small">Vorlage:</span>
          {DEFAULT_PLANS.map((d) => <button key={d.id} type="button" className="k2-chip" onClick={() => loadTemplate(d.id)}>{d.name}</button>)}
        </div>
      </section>

      <section aria-labelledby="k2-pool-h">
        <h3 id="k2-pool-h" className="display">Karten</h3>
        <p className="muted small">
          {avail.small
            ? `Deine Sammlung ist noch klein (${avail.owned.length} Angriffe). Bis ${LEIH_MIN} leihst du dir die Karten deines Stils (${STIL[stil].name}) – markiert mit „geliehen“.`
            : `Aus deiner Sammlung: ${avail.owned.length} Angriffe.`}
          {locked > 0 ? ` ${locked} weitere sammelst du im Kampf.` : ""}
        </p>
        <label className="k2-bauer-search">Suchen
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="z. B. Armbar" />
        </label>
        <div className="k2-filter" role="group" aria-label="Lage">
          {POS_ORDER.map((p) => <button key={p} type="button" className={`k2-chip${pos === p ? " is-on" : ""}`} aria-pressed={pos === p} onClick={() => setPos(pos === p ? null : p)}>{POS_SHORT[p]}</button>)}
        </div>
        <div className="k2-filter" role="group" aria-label="Phase und Schlüsselwort">
          {(Object.keys(PHASE_LABEL) as Phase[]).map((ph) => <button key={ph} type="button" className={`k2-chip${phase === ph ? " is-on" : ""}`} aria-pressed={phase === ph} onClick={() => setPhase(phase === ph ? null : ph)}>{PHASE_LABEL[ph]}</button>)}
          {KW_FILTER.map((k) => <button key={k} type="button" className={`k2-chip is-kw${kw === k ? " is-on" : ""}`} aria-pressed={kw === k} onClick={() => setKw(kw === k ? null : k)}>{KW_LABEL[k]}</button>)}
        </div>
        <ul className="k2-pool">
          {shown.map((c) => {
            const on = ids.includes(c.id);
            const leih = !avail.owned.includes(c.id);
            return (
              <li key={c.id}>
                <button type="button" className={`k2-pool-card${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => toggle(c.id)}>
                  <span className="k2-pool-top"><b>{on ? "✓ " : ""}{c.plain}</b><span className="k2-pool-cost" aria-label={`Kosten ${planCost(c)}`}>{planCost(c)}</span></span>
                  <span className="k2-pool-sub">{c.term} · {c.slots.map((s) => POS_LABEL[s.pos].replace(/ \(.*\)$/, "")).join("/")}{c.to ? ` → ${POS_SHORT[c.to.pos]}` : ""}</span>
                  <span className="k2-pool-tags">{PHASE_LABEL[phaseOf(c)]}{keywordsOf(c).filter((k) => k.id === "kette").length ? " · Kette" : ""}{leih ? " · geliehen" : ""}</span>
                </button>
              </li>
            );
          })}
          {shown.length === 0 && <li className="muted small">Keine Karte passt zu diesem Filter.</li>}
        </ul>
      </section>

      {msg && <p className="k2-bauer-msg" role="status">{msg}</p>}
      <div className="k2-bauer-actions">
        <button type="button" className="btn primary" disabled={!valid || othersFull} onClick={save}>Speichern und wählen</button>
        <button type="button" className="btn" disabled={ids.length !== PLAN_SIZE} onClick={share}>Teilen</button>
      </div>
      {saveWhy && <p className="muted small">{saveWhy}</p>}
      {showCode && ids.length === PLAN_SIZE && (
        <p className="k2-bauer-code"><span className="muted small">Code:</span> <code>{encodePlan(ids, stil)}</code></p>
      )}
    </div>
  );
}
