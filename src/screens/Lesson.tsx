import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CARD, CARDS } from "../data/cards";
import { CardFlip } from "../components/CardFlip";
import { CardArt } from "../components/CardArt";
import { TAG_LABEL } from "../components/cardText";
import type { CardDef } from "../engine/types";
import { useGame } from "../store";
import { sfx } from "../sound";

interface Q { q: string; opts: { t: string; ok: boolean }[] }

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const nm = (c: CardDef) => c.plain ?? c.name;

/** Abruf-Frage zu einer Karte (Schlüsselpunkt vs. Fehler, Konter-Familie, Position). */
export function makeQuestion(c: CardDef): Q {
  const pool: Q[] = [];
  if (c.counters?.length) {
    const right = c.counters.map((t) => TAG_LABEL[t]).join(", ");
    const others = shuffle(CARDS.filter((o) => o.counters?.length && o.counters.join() !== c.counters!.join()))
      .map((o) => o.counters!.map((t) => TAG_LABEL[t]).join(", ")).filter((t) => t !== right);
    const wrong = [...new Set(others)].slice(0, 2);
    if (wrong.length === 2) pool.push({ q: `Wogegen hilft „${nm(c)}“?`, opts: shuffle([{ t: right, ok: true }, ...wrong.map((t) => ({ t, ok: false }))]) });
  }
  if (c.keys.length && c.mistakes.length) {
    const mist = shuffle([...new Set([...c.mistakes, ...shuffle(CARDS.filter((o) => o.id !== c.id)).flatMap((o) => o.mistakes)])]).slice(0, 2);
    pool.push({ q: `Was ist bei „${nm(c)}“ richtig?`, opts: shuffle([{ t: c.keys[0], ok: true }, ...mist.map((t) => ({ t, ok: false }))]) });
    if (c.keys.length >= 2) pool.push({ q: `Was ist bei „${nm(c)}“ ein typischer FEHLER?`, opts: shuffle([{ t: c.mistakes[0], ok: true }, ...c.keys.slice(0, 2).map((t) => ({ t, ok: false }))]) });
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

type DotState = "todo" | "cur" | "ok" | "no";

export function Lesson({ ids, onDone }: { ids: string[]; onDone: () => void }) {
  const g = useGame();
  const reduce = useReducedMotion() ?? false;
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [pick, setPick] = useState<number | null>(null);
  const [results, setResults] = useState<(boolean | null)[]>(() => ids.map(() => null));
  const c = CARD[ids[i]];
  const q = useMemo(() => makeQuestion(c), [c.id]);
  const showTerm = !!c.plain && c.plain !== c.name;

  function flip() {
    if (flipped) return;
    setFlipped(true);
    sfx.flip();
  }
  function answer(k: number) {
    if (pick !== null) return;
    setPick(k);
    const ok = q.opts[k].ok;
    setResults((r) => r.map((x, j) => (j === i ? ok : x)));
    if (ok) { sfx.points(); g.addXP(15); g.set({ mastery: { ...g.mastery, [c.id]: (g.mastery[c.id] || 0) + 1 } }); }
    else sfx.lose();
  }
  function nextCard() {
    if (i + 1 >= ids.length) return onDone();
    setI(i + 1); setFlipped(false); setPick(null);
  }
  const dot = (j: number): DotState => (j === i && results[j] === null ? "cur" : results[j] === true ? "ok" : results[j] === false ? "no" : "todo");

  return (
    <div className="screen lesson">
      <div className="lesson-top">
        <span className="label">Üben · Karte {i + 1} von {ids.length}</span>
        <ol className="dots" aria-label={`Fortschritt: Karte ${i + 1} von ${ids.length}`}>
          {ids.map((id, j) => (
            <li key={id + j} className={`dot ${dot(j)}`} aria-label={`Karte ${j + 1}: ${{ todo: "offen", cur: "jetzt", ok: "richtig", no: "falsch" }[dot(j)]}`}>
              {j === i && <motion.span layoutId="dot-ring" className="dot-ring" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
              <motion.i key={dot(j)} initial={{ scale: dot(j) === "ok" || dot(j) === "no" ? 1.9 : 1 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 14 }} />
            </li>
          ))}
        </ol>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={c.id + i} className={`lesson-stage ${flipped ? "revealed" : ""}`}
          initial={{ opacity: 0, x: 60, rotate: 4 }} animate={{ opacity: 1, x: 0, rotate: 0 }} exit={{ opacity: 0, x: -60, rotate: -4 }}
          transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}>
          <span className="lesson-glow" aria-hidden="true" />
          <motion.button className="lesson-card" onClick={flip} aria-label={flipped ? `Karte: ${nm(c)}` : "Karte umdrehen"} aria-disabled={flipped || undefined}
            animate={flipped && !reduce ? { y: [0, -14, -8], scale: [1, 1.08, 1.04] } : { y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            whileHover={!flipped && !reduce ? { y: -6, rotate: -1.5 } : undefined} whileTap={!flipped ? { scale: 0.96 } : undefined}>
            <motion.div className="lesson-float" animate={flipped && !reduce ? { y: [0, -5, 0] } : { y: 0 }} transition={flipped && !reduce ? { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 } : { duration: 0.2 }}>
              <CardFlip card={c} revealed={flipped} size="large" art={<CardArt card={c} size={200} />} />
            </motion.div>
          </motion.button>
          {flipped && !reduce && (
            <span className="lesson-burst" aria-hidden="true">{Array.from({ length: 10 }, (_, k) => <i key={k} style={{ ["--a" as string]: `${k * 36}deg` }} />)}</span>
          )}
        </motion.div>
      </AnimatePresence>

      {!flipped && (
        <motion.p className="tap-hint label center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          Tippe die Karte, um sie umzudrehen
        </motion.p>
      )}

      <AnimatePresence>
        {flipped && (
          <motion.div className="lesson-body" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.35 }}>
            <div className="lesson-name">
              <h2 className="display">{nm(c)}</h2>
              {showTerm && <span className="label">Fachbegriff: {c.name}</span>}
            </div>
            {c.plainDo && <p className="pd-do">{c.plainDo}</p>}
            <h4 className="label">Darauf kommt es an</h4>
            <ul className="good">{c.keys.map((k) => <li key={k}>{k}</li>)}</ul>
            {c.safety && <p className="safety"><b>Sicherheit:</b> {c.safety}</p>}
            {q && (
              <div className="quiz" role="group" aria-labelledby="quiz-q">
                <strong id="quiz-q">{q.q}</strong>
                {q.opts.map((o, k) => {
                  const right = pick !== null && o.ok;
                  const wrong = pick === k && !o.ok;
                  return (
                    <motion.button key={k} className={`opt ${right ? "right" : ""} ${wrong ? "wrong" : ""} ${pick !== null && !right && !wrong ? "dim" : ""}`}
                      onClick={() => answer(k)} disabled={pick !== null && !right && !wrong} aria-pressed={pick === k}
                      initial={{ opacity: 0, x: -12 }}
                      animate={wrong && !reduce ? { opacity: 1, x: [0, -10, 9, -7, 5, -2, 0] } : right && !reduce ? { opacity: 1, x: 0, scale: [1, 1.06, 1] } : { opacity: 1, x: 0, scale: 1 }}
                      transition={pick === null ? { delay: 0.35 + k * 0.07 } : { duration: 0.45 }}>
                      <span className="opt-mark" aria-hidden="true">{right ? "✓" : wrong ? "✗" : String.fromCharCode(65 + k)}</span>
                      <span>{o.t}</span>
                    </motion.button>
                  );
                })}
                <AnimatePresence>
                  {pick !== null && (
                    <motion.p key="fb" role="status" className={q.opts[pick].ok ? "ok" : "no"} initial={{ opacity: 0, y: 6, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
                      {q.opts[pick].ok ? <>Richtig! <motion.b className="xp" initial={{ y: 0, opacity: 1 }} animate={reduce ? {} : { y: [-2, -10, -6] }}>+15 XP</motion.b></> : "Nicht ganz – die grüne Antwort stimmt. Lies oben nochmal nach."}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            )}
            <button className="btn primary big" disabled={pick === null && !!q} onClick={nextCard}>{i + 1 >= ids.length ? "Fertig" : "Nächste Karte"}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
