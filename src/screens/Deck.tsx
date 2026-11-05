import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CARD, DECK_CARD_IDS, BANNED_LESSONS } from "../data/cards";
import { Card } from "../components/Card";
import { CardArt } from "../components/CardArt";
import { useGame } from "../store";
import { CardDetail } from "./Arena";
import { Lesson } from "./Lesson";
import { POS_LABEL } from "../components/cardText";
import type { PositionId } from "../engine/types";

const ORDER: PositionId[] = ["dist", "clinch", "fhl", "guard", "side", "mount", "back"];
const maxCopies = (id: string) => (CARD[id].rarity === "legendaer" ? 1 : 2);

export function DeckBuilder() {
  const g = useGame();
  const [draft, setDraft] = useState<string[]>(g.deck);
  const [detail, setDetail] = useState<string | null>(null);
  const count = (id: string) => draft.filter((x) => x === id).length;
  const coll = [...g.collection].sort((a, b) => ORDER.indexOf(CARD[a].slots[0].pos) - ORDER.indexOf(CARD[b].slots[0].pos));
  const add = (id: string) => { if (draft.length < 20 && count(id) < maxCopies(id)) setDraft([...draft, id]); };
  const remove = (id: string) => { const i = draft.indexOf(id); if (i >= 0) setDraft(draft.filter((_, k) => k !== i)); };
  const dirty = draft.join() !== g.deck.join();
  const phases = ORDER.map((p) => ({ p, n: draft.filter((id) => CARD[id].slots.some((s) => s.pos === p)).length }));

  return (
    <div className="screen deck">
      <div className="deck-head">
        <h2 className="display">Dein Deck <span className="num">{draft.length}/20</span></h2>
        <button className="btn primary" disabled={draft.length !== 20 || !dirty} onClick={() => g.set({ deck: draft })}>{dirty ? "Speichern" : "Gespeichert"}</button>
      </div>
      <div className="curve" aria-label="Karten pro Phase">
        {phases.map(({ p, n }) => (
          <div key={p} className="curve-col"><motion.i animate={{ height: `${Math.min(100, n * 12)}%` }} /><span className="label">{POS_LABEL[p].split(" ")[0]}</span><span className="num small">{n}</span></div>
        ))}
      </div>
      <p className="muted small">Ein Deck braucht Karten für jedes Glied der Kette. Fehlt eine Phase, bleiben dir dort nur Grundtechniken. Max. 2 Kopien, legendäre Karten 1×.</p>
      <div className="grid">
        {coll.map((id) => {
          const n = count(id);
          return (
            <div key={id} className={`grid-item ${n ? "in" : ""}`}>
              <Card card={CARD[id]} size="hand" art={<CardArt card={CARD[id]} size={96} />} count={n || undefined} onClick={() => setDetail(id)} />
              <div className="grid-btns">
                <button className="btn small" onClick={() => remove(id)} disabled={!n} aria-label={`${CARD[id].name} entfernen`}>−</button>
                <span className="num">{n}/{maxCopies(id)}</span>
                <button className="btn small" onClick={() => add(id)} disabled={draft.length >= 20 || n >= maxCopies(id)} aria-label={`${CARD[id].name} hinzufügen`}>+</button>
              </div>
            </div>
          );
        })}
      </div>
      <AnimatePresence>
        {detail && (
          <motion.div className="sheet-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetail(null)}>
            <motion.div className="sheet" initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} onClick={(e) => e.stopPropagation()}>
              <CardDetail id={detail} />
              <button className="btn" onClick={() => setDetail(null)}>Schließen</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Library() {
  const g = useGame();
  const [detail, setDetail] = useState<string | null>(null);
  const [train, setTrain] = useState<string[] | null>(null);
  if (train) return <Lesson ids={train} onDone={() => setTrain(null)} />;
  const owned = DECK_CARD_IDS.filter((id) => g.collection.includes(id));
  return (
    <div className="screen library">
      <div className="deck-head">
        <h2 className="display">Bibliothek <span className="num">{owned.length}/{DECK_CARD_IDS.length}</span></h2>
        <button className="btn primary" onClick={() => setTrain([...owned].sort(() => Math.random() - .5).slice(0, 5))}>Training: 5 Karten</button>
      </div>
      <p className="muted small">Abrufen schlägt Wiederlesen: Das Training fragt dich, statt dir nur zu zeigen.</p>
      {ORDER.map((p) => {
        const ids = DECK_CARD_IDS.filter((id) => CARD[id].slots[0].pos === p);
        if (!ids.length) return null;
        return (
          <section key={p}>
            <h3 className="label section-title">{POS_LABEL[p]}</h3>
            <div className="grid">
              {ids.map((id) => g.collection.includes(id)
                ? <Card key={id} card={CARD[id]} size="hand" art={<CardArt card={CARD[id]} size={96} />} onClick={() => setDetail(id)} />
                : <div key={id} className="locked-card"><Card card={CARD[id]} size="hand" faceDown /><span className="label">Noch nicht freigeschaltet</span></div>)}
            </div>
          </section>
        );
      })}
      <section className="banned">
        <h3 className="label section-title">Für Anfänger verboten – nie als Karte</h3>
        {BANNED_LESSONS.map((b) => <p key={b.id}><b>{b.name}:</b> {b.why}</p>)}
      </section>
      <AnimatePresence>
        {detail && (
          <motion.div className="sheet-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetail(null)}>
            <motion.div className="sheet" initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} onClick={(e) => e.stopPropagation()}>
              <CardDetail id={detail} />
              <button className="btn" onClick={() => setDetail(null)}>Schließen</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
