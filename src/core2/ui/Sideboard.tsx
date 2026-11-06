// Mechanik 7 „Sideboard vor dem Boss“ (Spec B60): Stil und Signatur-Karten des Bosses sehen, bis zu 3 Karten tauschen.
// Die Tausche gelten nur für diesen Kampf – dein gespeicherter Plan bleibt, wie er ist.
import { useMemo, useState } from "react";
import { allCards, applySideboard, cardById, isPlanCard, recommendSwaps, systemCheck, SIDEBOARD_MAX, type Swap } from "../engine";
import type { BossDef } from "../data/bosses";
import { BOSS_PLANS, BOSS_SIDEBOARD } from "../data/plans";
import { SystemMap } from "./SpielplanBauer";

export function Sideboard({ boss, plan, pool, onStart, onBack }: {
  boss: BossDef;
  plan: { name: string; cards: string[] };
  /** Karten, die du hineinnehmen darfst (Sammlung + Leihkarten). */
  pool: string[];
  onStart: (cards: string[], swaps: number) => void;
  onBack: () => void;
}) {
  const adv = BOSS_SIDEBOARD[boss.id];
  const basics = useMemo(() => allCards().filter((c) => !isPlanCard(c)), []);
  const rec = useMemo(() => recommendSwaps(plan.cards, adv.wants, adv.avoid, pool, cardById, basics), [plan.cards, adv, pool, basics]);
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [out, setOut] = useState<string | null>(null);
  const cards = applySideboard(plan.cards, swaps);
  const sys = systemCheck(cards, cardById, basics);
  const name = (id: string) => cardById(id)?.plain ?? id;
  const full = swaps.length >= SIDEBOARD_MAX;
  const ins = pool.filter((id) => !cards.includes(id)).sort((a, b) => Number(adv.wants.includes(b)) - Number(adv.wants.includes(a)));

  const pickIn = (id: string) => {
    if (!out || full) return;
    setSwaps([...swaps, { out, in: id }]); setOut(null);
  };
  const undo = (i: number) => setSwaps(swaps.filter((_, k) => k !== i));

  return (
    <div className="screen more k2-sideboard" lang="de">
      <button className="btn small ghost" onClick={onBack}>← Zurück</button>
      <h2 className="display" style={{ fontSize: 26 }}>Vor dem Kampf: {boss.name}</h2>
      <p className="k2-plan-rule">Passe deinen Plan an – bis zu {SIDEBOARD_MAX} Karten tauschen. Nur für diesen Kampf.</p>
      <p className="muted small"><b>Im echten Grappling:</b> Du hast dein A-Game – aber gegen jeden Gegner stellst du ein paar Werkzeuge um.</p>

      <section className="k2-sb-boss" aria-labelledby="k2-sb-boss-h">
        <h3 id="k2-sb-boss-h" className="display">Sein Stil: {BOSS_PLANS[boss.id].name}</h3>
        <p>{boss.likes}</p>
        <p className="k2-sb-label">Seine Signatur-Karten</p>
        <ul className="k2-sb-chips">{adv.signature.map((id) => <li key={id} className="is-foe">{name(id)}</li>)}</ul>
        <p className="k2-sb-label">Grundlagen dagegen – kannst du immer</p>
        <ul className="k2-sb-chips">{adv.basics.map((id) => <li key={id} className="is-free">{name(id)}</li>)}</ul>
      </section>

      <section className="k2-sb-rec" aria-labelledby="k2-sb-rec-h">
        <h3 id="k2-sb-rec-h" className="display">Empfehlung</h3>
        <p>{adv.tip}</p>
        {rec.length > 0 ? (
          <>
            <ul className="k2-sb-swaps">{rec.map((sw) => <li key={sw.in}><s>{name(sw.out)}</s> → <b>{name(sw.in)}</b></li>)}</ul>
            <button type="button" className="btn small" onClick={() => { setSwaps(rec); setOut(null); }}>Empfehlung übernehmen</button>
          </>
        ) : <p className="muted small">Dein Plan hat die empfohlenen Karten schon – oder du hast sie noch nicht gesammelt.</p>}
      </section>

      <section aria-labelledby="k2-sb-plan-h">
        <h3 id="k2-sb-plan-h" className="display">Tauschen <span className={`k2-count${full ? " is-full" : ""}`}>{swaps.length}/{SIDEBOARD_MAX}</span></h3>
        {swaps.length > 0 && (
          <ul className="k2-sb-swaps">{swaps.map((sw, i) => (
            <li key={sw.in}><s>{name(sw.out)}</s> → <b>{name(sw.in)}</b>{" "}
              <button type="button" className="k2-chip" onClick={() => undo(i)} aria-label={`zurück: ${name(sw.in)} wieder raus`}>zurück</button></li>
          ))}</ul>
        )}
        <p className="muted small">{full ? "Mehr Tausche gehen nicht." : out ? `Was kommt für „${name(out)}“ hinein?` : "1. Tippe eine Karte deines Plans an, die rausgeht."}</p>
        <div className="k2-filter" role="group" aria-label="Dein Plan – Karte rausnehmen">
          {cards.map((id) => {
            const fresh = swaps.some((s) => s.in === id);
            return <button key={id} type="button" className={`k2-chip${out === id ? " is-on" : ""}${fresh ? " is-new" : ""}`} aria-pressed={out === id}
              disabled={full || fresh} onClick={() => setOut(out === id ? null : id)}>{name(id)}</button>;
          })}
        </div>
        {out && !full && (
          <div className="k2-filter" role="group" aria-label="Karte hineinnehmen">
            {ins.map((id) => <button key={id} type="button" className={`k2-chip${adv.wants.includes(id) ? " is-rec" : ""}`} onClick={() => pickIn(id)}>{adv.wants.includes(id) ? "★ " : ""}{name(id)}</button>)}
          </div>
        )}
        <SystemMap sys={sys} />
        {!sys.ok && <p className="k2-curve-hint" role="status">So hat dein Plan eine Lücke – tausch anders.</p>}
      </section>

      <div className="k2-bauer-actions">
        <button type="button" className="btn primary" disabled={!sys.ok} onClick={() => onStart(cards, swaps.length)}>
          {swaps.length ? `Kampf mit ${swaps.length} ${swaps.length === 1 ? "Tausch" : "Tauschen"}` : "Kampf ohne Tausch"}
        </button>
      </div>
    </div>
  );
}
