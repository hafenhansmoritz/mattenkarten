import { useMemo, useRef, useState } from "react";
import { CARD } from "../data/cards";
import { POSITION_GUIDE } from "../data/positions";
import { Card } from "../components/Card";
import { plainTitle } from "../components/cardText";
import { useGame } from "../store";
import { adoptDeck, decodeDeck, encodeDeck } from "../deckCode";
import type { PositionId } from "../engine/types";
import "../styles/trainer.css";

const ORDER: PositionId[] = ["dist", "clinch", "fhl", "guard", "side", "mount", "back"];

/**
 * Text in die Zwischenablage. Fallback: verstecktes Textfeld + execCommand,
 * sonst wird `fallbackEl` markiert, damit der Spieler selbst kopieren kann.
 */
export async function copyText(text: string, fallbackEl?: HTMLInputElement | HTMLTextAreaElement | null): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* weiter zum Fallback */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    if (ok) return true;
  } catch { /* weiter */ }
  if (fallbackEl) { fallbackEl.focus(); fallbackEl.select(); }
  return false;
}

/** Liest `#deck=<code>` aus der Adresszeile. `null`, wenn keiner da oder kaputt. */
export function readDeckFromHash(): string[] | null {
  try {
    const m = /(?:^#|&)deck=([^&]+)/.exec(window.location.hash);
    if (!m) return null;
    const r = decodeDeck(m[1]);
    return r ? r.ids : null;
  } catch {
    return null;
  }
}

/** Deck-Link für den aktuellen Ursprung. */
export function deckLink(code: string): string {
  return `${window.location.origin}/#deck=${code}`;
}

function counted(ids: string[]): { id: string; n: number }[] {
  const m = new Map<string, number>();
  for (const id of ids) if (CARD[id]) m.set(id, (m.get(id) ?? 0) + 1);
  return [...m.entries()]
    .map(([id, n]) => ({ id, n }))
    .sort((a, b) => ORDER.indexOf(CARD[a.id].slots[0].pos) - ORDER.indexOf(CARD[b.id].slots[0].pos));
}

function Coverage({ ids }: { ids: string[] }) {
  const cov = ORDER.map((p) => ({ p, n: ids.filter((id) => CARD[id]?.slots.some((s) => s.pos === p)).length }));
  const gaps = cov.filter((c) => c.n === 0);
  return (
    <div className="tr-cov">
      <ul className="tr-cov-list" aria-label="Karten pro Lage">
        {cov.map(({ p, n }) => (
          <li key={p} className={n ? "on" : "gap"}>
            <span className="tr-cov-bar"><i style={{ height: `${Math.min(100, n * 14)}%` }} /></span>
            <span className="tr-cov-n num">{n}</span>
            <span className="tr-cov-l">{POSITION_GUIDE[p].plain}</span>
          </li>
        ))}
      </ul>
      {gaps.length > 0 ? (
        <p className="small tr-warn">Lücke: keine Karte für {gaps.map((g) => POSITION_GUIDE[g.p].plain).join(", ")}.</p>
      ) : (
        <p className="small tr-ok">Jede Lage ist abgedeckt – vom Stand bis zum Boden.</p>
      )}
    </div>
  );
}

function MiniDeck({ ids, owned }: { ids: string[]; owned?: Set<string> }) {
  return (
    <div className="tr-minis">
      {counted(ids).map(({ id, n }) => (
        <div key={id} className={`tr-mini ${owned && !owned.has(id) ? "locked" : ""}`}>
          <Card card={CARD[id]} size="mini" count={n} />
          {owned && !owned.has(id) && <span className="tr-lock" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M7 11V8a5 5 0 0 1 10 0v3" fill="none" stroke="currentColor" strokeWidth="2.4"/><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/></svg></span>}
        </div>
      ))}
    </div>
  );
}

export function ShareDeck({ onBack }: { onBack: () => void }) {
  const deck = useGame((s) => s.deck);
  const collection = useGame((s) => s.collection);
  const setStore = useGame((s) => s.set);
  const code = useMemo(() => encodeDeck(deck), [deck]);
  const link = deckLink(code);
  const codeRef = useRef<HTMLInputElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [adopted, setAdopted] = useState<string | null>(null);

  const owned = useMemo(() => new Set(collection), [collection]);
  const parsed = input.trim() ? decodeDeck(input) : null;
  const preview = parsed ? adoptDeck(parsed.ids, collection, deck) : null;

  const copy = async (text: string, el: HTMLInputElement | null, what: string) => {
    const ok = await copyText(text, el);
    setMsg(ok ? `${what} kopiert!` : `Kopieren ging nicht – ${what} ist markiert, kopiere ihn selbst.`);
  };

  const adopt = () => {
    if (!preview || preview.deck.length !== 20) return;
    setStore({ deck: preview.deck });
    setAdopted(`Übernommen: ${preview.taken.length} Karten aus dem Code${preview.filled ? `, ${preview.filled} aus deinem alten Deck aufgefüllt` : ""}.`);
    setInput("");
  };

  return (
    <div className="screen tr-screen">
      <header className="tr-head">
        <button className="btn ghost small" onClick={onBack} aria-label="Zurück">← Zurück</button>
        <h2 className="display">Deck teilen</h2>
      </header>

      <section className="tr-panel">
        <h3 className="tr-h">Dein Deck <span className="num muted">{deck.length}/20</span></h3>
        <MiniDeck ids={deck} />
        <Coverage ids={deck} />
      </section>

      <section className="tr-panel">
        <h3 className="tr-h">Weitergeben</h3>
        <label className="tr-field">
          <span className="label">Deck-Code</span>
          <input ref={codeRef} className="tr-input num" readOnly value={code} onFocus={(e) => e.currentTarget.select()} />
        </label>
        <label className="tr-field">
          <span className="label">Link</span>
          <input ref={linkRef} className="tr-input" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
        </label>
        <div className="tr-row">
          <button className="btn primary" onClick={() => copy(code, codeRef.current, "Deck-Code")}>Deck-Code kopieren</button>
          <button className="btn" onClick={() => copy(link, linkRef.current, "Link")}>Link kopieren</button>
        </div>
        {msg && <p className="small tr-status" role="status">{msg}</p>}
      </section>

      <section className="tr-panel">
        <h3 className="tr-h">Deck übernehmen</h3>
        <p className="small muted">Code oder Link von deinem Trainingspartner einfügen. Du bekommst nur Karten, die du schon freigeschaltet hast.</p>
        <label className="tr-field">
          <span className="label">Code einfügen</span>
          <input className="tr-input num" value={input} placeholder="MK1-…" autoComplete="off" spellCheck={false}
            onChange={(e) => { setInput(e.target.value); setAdopted(null); }} />
        </label>
        {input.trim() && !parsed && <p className="small tr-warn" role="alert">Der Code stimmt nicht. Prüfe, ob er vollständig kopiert wurde.</p>}
        {parsed && preview && (
          <div className="tr-preview">
            <MiniDeck ids={parsed.ids} owned={owned} />
            <Coverage ids={preview.deck} />
            {parsed.unknown > 0 && (
              <p className="small tr-warn">{parsed.unknown} Karte{parsed.unknown > 1 ? "n" : ""} kennt diese Spielversion nicht.</p>
            )}
            {preview.locked.length > 0 && (
              <div className="tr-locked">
                <p className="small"><strong>Noch nicht freigeschaltet</strong> – gewinne Kämpfe, um sie zu bekommen:</p>
                <ul>{preview.locked.map((id) => <li key={id}>{plainTitle(CARD[id])} <span className="muted">({CARD[id].name})</span></li>)}</ul>
              </div>
            )}
            <p className="small muted">
              {preview.taken.length} Karten werden übernommen
              {preview.filled > 0 && `, ${preview.filled} Plätze mit deinem bisherigen Deck aufgefüllt`}
              {preview.skipped > 0 && `, ${preview.skipped} über dem Kopien-Limit ausgelassen`}.
            </p>
            <button className="btn primary" disabled={preview.deck.length !== 20} onClick={adopt}>
              {preview.deck.length === 20 ? "Übernehmen" : `Zu wenige eigene Karten (${preview.deck.length}/20)`}
            </button>
          </div>
        )}
        {adopted && <p className="small tr-ok" role="status">{adopted}</p>}
      </section>
    </div>
  );
}
