import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CARD, CARDS } from "../data/cards";
import { CardFlip } from "../components/CardFlip";
import { CardArt } from "../components/CardArt";
import { TAG_LABEL } from "../components/cardText";
import type { CardDef } from "../engine/types";
import { useGame } from "../store";
import { sfx } from "../sound";

interface Q { q: string; opts: { t: string; ok: boolean }[] }

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/** Abruf-Frage zu einer Karte (Schlüsselpunkt vs. Fehler, Konter-Familie, Position). */
export function makeQuestion(c: CardDef): Q {
  const pool: Q[] = [];
  if (c.counters?.length) {
    const right = c.counters.map((t) => TAG_LABEL[t]).join(", ");
    const others = shuffle(CARDS.filter((o) => o.counters?.length && o.counters.join() !== c.counters!.join()))
      .map((o) => o.counters!.map((t) => TAG_LABEL[t]).join(", ")).filter((t) => t !== right);
    const wrong = [...new Set(others)].slice(0, 2);
    if (wrong.length === 2) pool.push({ q: `Was kontert „${c.name}“?`, opts: shuffle([{ t: right, ok: true }, ...wrong.map((t) => ({ t, ok: false }))]) });
  }
  if (c.keys.length && c.mistakes.length) {
    const mist = shuffle([...new Set([...c.mistakes, ...shuffle(CARDS.filter((o) => o.id !== c.id)).flatMap((o) => o.mistakes)])]).slice(0, 2);
    pool.push({ q: `Welcher Punkt gehört sauber zu „${c.name}“?`, opts: shuffle([{ t: c.keys[0], ok: true }, ...mist.map((t) => ({ t, ok: false }))]) });
    if (c.keys.length >= 2) pool.push({ q: `Was ist bei „${c.name}“ ein typischer FEHLER?`, opts: shuffle([{ t: c.mistakes[0], ok: true }, ...c.keys.slice(0, 2).map((t) => ({ t, ok: false }))]) });
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function Lesson({ ids, onDone }: { ids: string[]; onDone: () => void }) {
  const g = useGame();
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [pick, setPick] = useState<number | null>(null);
  const c = CARD[ids[i]];
  const q = useMemo(() => makeQuestion(c), [c.id]);

  function answer(k: number) {
    if (pick !== null) return;
    setPick(k);
    if (q.opts[k].ok) { sfx.points(); g.addXP(15); g.set({ mastery: { ...g.mastery, [c.id]: (g.mastery[c.id] || 0) + 1 } }); }
    else sfx.lose();
  }
  function nextCard() {
    if (i + 1 >= ids.length) return onDone();
    setI(i + 1); setFlipped(false); setPick(null);
  }

  return (
    <div className="screen lesson">
      <span className="label">Lektion {i + 1}/{ids.length}</span>
      <button className="lesson-card" onClick={() => { if (!flipped) { setFlipped(true); sfx.flip(); } }} aria-label="Karte umdrehen">
        <CardFlip card={c} revealed={flipped} size="large" art={<CardArt card={c} size={200} />} />
      </button>
      {!flipped && <p className="label center">Tippe die Karte, um sie umzudrehen</p>}
      <AnimatePresence>
        {flipped && (
          <motion.div className="lesson-body" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p>{c.desc}</p>
            <h4 className="label">Schlüsselpunkte</h4>
            <ul className="good">{c.keys.map((k) => <li key={k}>{k}</li>)}</ul>
            {c.safety && <p className="safety"><b>Sicherheit:</b> {c.safety}</p>}
            {q && (
              <div className="quiz">
                <strong>{q.q}</strong>
                {q.opts.map((o, k) => (
                  <button key={k} className={`opt ${pick !== null && o.ok ? "right" : ""} ${pick === k && !o.ok ? "wrong" : ""}`} onClick={() => answer(k)}>{o.t}</button>
                ))}
                {pick !== null && <p className={q.opts[pick].ok ? "ok" : "no"}>{q.opts[pick].ok ? "Richtig. +15 XP" : "Nicht ganz – schau dir die Schlüsselpunkte nochmal an."}</p>}
              </div>
            )}
            <button className="btn primary big" disabled={pick === null && !!q} onClick={nextCard}>{i + 1 >= ids.length ? "Fertig" : "Nächste Karte"}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
