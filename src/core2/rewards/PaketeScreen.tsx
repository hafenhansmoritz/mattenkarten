// Mechanik 8 – „Pakete & Staub“: Inventar, Paket öffnen, offene Chancen, Belohnungs-Tabelle, Herstellen.
// Erreichbar aus der Sammlung und aus „Mehr“.
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { Card2 } from "../types";
import { cardById } from "../engine";
import { RarityGem } from "../ui/frame";
import { KIND_LABEL, POS_LABEL } from "../ui/meta";
import { RARITIES, RARITY_LABEL, type Rarity } from "../ui/rarity";
import { useCollection } from "../collection/store";
import { BigCard } from "../collection/Sammlung";
import { localDate } from "../../program/store";
import { sfx } from "../../sound";
import { craftCard, dismissAllToasts, useRewards } from "./store";
import { packPool } from "./pool";
import {
  CRAFT_COST, DUP_STAUB, PACK_SIZE, REWARDS, REWARD_ORDER, meisterPerPack, oddsPercent,
} from "./table";
import { PackOpening } from "./PackOpening";
import { PackMini, grantText } from "./RewardToasts";
import "../../styles/core2.css";
import "../../styles/sammlung.css";
import "../../styles/rewards.css";

/** Die Ethik-Regeln, sichtbar für alle (B68). */
export const ETHICS: string[] = [
  "Kein Echtgeld. Nichts zu kaufen, keine kaufbare Währung.",
  "Lernen ist nie gesperrt. Pakete geben nur Karten fürs Kartenspiel.",
  "Kein Zeitdruck, keine Strafe, wenn du mal aussetzt.",
  "Die Chancen stehen offen hier – genau so wird gezogen.",
  "Kleine Sammlung? Im Spielplan-Bauer leihst du dir Karten.",
];

const pct = (n: number) => `${String(n).replace(".", ",")} %`;

export function PaketeScreen({ onBack }: { onBack: () => void }) {
  const r = useRewards();
  const col = useCollection();
  const [opening, setOpening] = useState(false);
  const [view, setView] = useState<Card2 | null>(null);
  const [rar, setRar] = useState<Rarity>("grundlage");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const pool = useMemo(() => packPool(), []);
  useEffect(() => { dismissAllToasts(); }, [r.log.length]);
  const have = useMemo(() => new Set(col.ids), [col.ids]);
  const missing = pool.filter((c) => !have.has(c.id));
  const today = localDate();
  const counts = r.day.date === today ? r.day.counts : {};
  const list = missing.filter((c) => c.rarity === rar)
    .map((c) => ({ c, card: cardById(c.id) }))
    .filter((x): x is { c: typeof x.c; card: Card2 } => !!x.card)
    .sort((a, b) => a.card.plain.localeCompare(b.card.plain, "de"));

  function craft(id: string) {
    if (confirm !== id) { sfx.select(); setConfirm(id); return; }
    const c = pool.find((x) => x.id === id);
    const res = craftCard(c);
    setConfirm(null);
    if (res.ok) {
      sfx.win();
      setMsg(`„${cardById(id)?.plain ?? id}“ ist jetzt in deiner Sammlung (−${res.cost} Staub).`);
    } else setMsg(res.why === "staub" ? "Dafür reicht dein Mattenstaub noch nicht." : "Die Karte hast du schon.");
  }

  return (
    <div className="screen sm-wrap rw-wrap" lang="de">
      <button className="btn small ghost" onClick={onBack}>← Zurück</button>
      <header className="sm-head">
        <h2 className="display">Pakete &amp; Staub</h2>
        <p className="muted small">Du verdienst Karten mit Lernen und Training – nicht mit Glück oder Geld. Wie im Gym: Wer kommt und übt, bekommt Werkzeuge.</p>
      </header>

      <section className="rw-inv" aria-label="Dein Inventar">
        <div className="rw-tile">
          <span className="rw-tile-ico"><PackMini size={34} /></span>
          <span className="rw-tile-n num">{r.packs}</span>
          <span className="rw-tile-l">{r.packs === 1 ? "Mattenpaket" : "Mattenpakete"}</span>
          <button type="button" className="btn primary rw-open-btn" disabled={r.packs < 1}
            onClick={() => { sfx.select(); setOpening(true); }}>{r.packs ? "Paket öffnen" : "Kein Paket da"}</button>
        </div>
        <div className="rw-tile">
          <span className="rw-tile-ico rw-dust" aria-hidden="true" />
          <span className="rw-tile-n num">{r.staub}</span>
          <span className="rw-tile-l">Mattenstaub</span>
          <a className="btn rw-open-btn" href="#rw-craft-h">Herstellen</a>
        </div>
      </section>

      <section className="rw-panel rw-ethics" aria-labelledby="rw-eth-h">
        <h3 id="rw-eth-h" className="rw-h">Fair und ehrlich</h3>
        <ul>{ETHICS.map((t) => <li key={t}>{t}</li>)}</ul>
      </section>

      <section className="rw-panel" aria-labelledby="rw-src-h">
        <h3 id="rw-src-h" className="rw-h">Woher kommen Pakete?</h3>
        <p className="small muted">Echte Mattenzeit zählt am meisten. Grenzen gelten pro Kalendertag – verpassen kannst du nichts.</p>
        <table className="rw-table">
          <thead><tr><th scope="col">Du …</th><th scope="col">Belohnung</th><th scope="col">Grenze</th></tr></thead>
          <tbody>
            {REWARD_ORDER.map((t) => {
              const x = REWARDS[t];
              const used = counts[t] ?? 0;
              const full = x.perDay !== null && used >= x.perDay;
              return (
                <tr key={t} className={full ? "is-full" : ""}>
                  <td>{x.what}</td>
                  <td className="num">{grantText(x).replace(/Mattenpaket(e?)/, "Paket$1").replace("Mattenstaub", "Staub")}</td>
                  <td>{x.limit}{x.perDay !== null && <span className="rw-today">{full ? " · heute ✓" : ` · heute ${used}/${x.perDay}`}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="rw-panel" aria-labelledby="rw-odds-h">
        <h3 id="rw-odds-h" className="rw-h">So stehen die Chancen</h3>
        <p className="small">Ein Paket hat {PACK_SIZE} Karten. Jede Karte zieht für sich:</p>
        <table className="rw-table rw-odds">
          <thead><tr><th scope="col">Seltenheit</th><th scope="col">Chance je Karte</th><th scope="col">Doppelt wird</th><th scope="col">Herstellen</th></tr></thead>
          <tbody>
            {RARITIES.map((x) => (
              <tr key={x} data-rar={x}>
                <th scope="row"><RarityGem rarity={x} size={12} /> {RARITY_LABEL[x]}</th>
                <td className="num" data-odds={x}>{pct(oddsPercent(x))}</td>
                <td className="num">{DUP_STAUB[x]} Staub</td>
                <td className="num">{CRAFT_COST[x]} Staub</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="small rw-rules">
          <li><b>Garantie:</b> Solange dir Karten fehlen, ist mindestens eine neue dabei. Sie zieht mit denselben Chancen – nur unter Seltenheiten, in denen dir noch etwas fehlt.</li>
          <li>Mindestens eine Meister-Karte: etwa {meisterPerPack()} % je Paket.</li>
          <li>Doppelte Karten werden automatisch zu Mattenstaub. Eigene Einzelkarten bleiben immer.</li>
        </ul>
      </section>

      <section className="rw-panel" aria-labelledby="rw-craft-h">
        <h3 id="rw-craft-h" className="rw-h">Herstellen</h3>
        <p className="small muted">Fehlt dir eine bestimmte Karte? Stell sie mit Mattenstaub her. Du hast <b className="num">{r.staub}</b> Staub, dir fehlen {missing.length} Karten.</p>
        <div className="rw-chips" role="group" aria-label="Seltenheit wählen">
          {RARITIES.map((x) => (
            <button key={x} type="button" className={`k2-chip ${rar === x ? "is-on" : ""}`} aria-pressed={rar === x} onClick={() => { setRar(x); setConfirm(null); }}>
              <RarityGem rarity={x} size={11} /> {RARITY_LABEL[x]} · {CRAFT_COST[x]}
            </button>
          ))}
        </div>
        <p className="sr-only" role="status" aria-live="polite">{msg}</p>
        {msg && <p className="rw-msg small" aria-hidden="true">{msg}</p>}
        {list.length === 0 ? <p className="small">Alle {RARITY_LABEL[rar]}-Karten sind schon in deiner Sammlung. ✓</p> : (
          <ul className="rw-craft">
            {list.map(({ c, card }) => {
              const cost = CRAFT_COST[c.rarity];
              const can = r.staub >= cost;
              const pos = card.slots[0]?.pos;
              return (
                <li key={c.id}>
                  <button type="button" className="rw-craft-name" onClick={() => setView(card)}>
                    <b>{card.plain}</b>
                    <span className="small muted">{KIND_LABEL[card.kind]}{pos ? ` · ${(POS_LABEL as Record<string, string>)[pos] ?? pos}` : ""}</span>
                  </button>
                  <button type="button" className={`btn small ${confirm === c.id ? "primary" : ""}`} disabled={!can}
                    aria-label={can ? (confirm === c.id ? `Ja, ${card.plain} für ${cost} Staub herstellen` : `${card.plain} herstellen, ${cost} Staub`) : `${card.plain}: ${cost} Staub nötig`}
                    onClick={() => craft(c.id)}>
                    {confirm === c.id ? `Ja, ${cost}` : `${cost} Staub`}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {r.log.length > 0 && (
        <section className="rw-panel" aria-labelledby="rw-log-h">
          <h3 id="rw-log-h" className="rw-h">Zuletzt verdient</h3>
          <ul className="rw-log small">
            {[...r.log].reverse().slice(0, 6).map((e, i) => <li key={i}><span>{e.reason}</span><span className="num muted">{grantText(e)}</span></li>)}
          </ul>
        </section>
      )}

      <AnimatePresence>
        {opening && <PackOpening key="open" onClose={() => setOpening(false)} onCard={setView} />}
      </AnimatePresence>
      <AnimatePresence>
        {view && <BigCard key={view.id} card={view} owned={have.has(view.id)} onClose={() => setView(null)} />}
      </AnimatePresence>
    </div>
  );
}
