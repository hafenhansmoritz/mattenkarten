import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CARD, DECK_CARD_IDS, BANNED_LESSONS } from "../data/cards";
import { Card } from "../components/Card";
import { CardArt } from "../components/CardArt";
import { useGame } from "../store";
import { Lesson } from "./Lesson";
import { MistakeTraining } from "./MistakeTraining";
import { POS_LABEL } from "../components/cardText";
import { POSITION_GUIDE } from "../data/positions";
import { DemoButton, TechniqueDemo } from "../components/demo";
import type { CardDef, PositionId, Role } from "../engine/types";

const ORDER: PositionId[] = ["dist", "clinch", "fhl", "guard", "side", "mount", "back"];
const maxCopies = (id: string) => (CARD[id].rarity === "legendaer" ? 1 : 2);
const ease = [0.2, 0.7, 0.2, 1] as const;

/* ---------- Phasen-Filter in Alltagssprache ---------- */

type PhaseId = "alle" | "abstand" | "umklammern" | "oben" | "unten";
const PHASES: { id: PhaseId; label: string; hint: string; test: (c: CardDef) => boolean }[] = [
  { id: "alle", label: "Alle", hint: "Alle Karten", test: () => true },
  { id: "abstand", label: "Abstand", hint: "Ihr steht euch gegenüber", test: (c) => has(c, ["dist"]) },
  { id: "umklammern", label: "Umklammern", hint: "Ihr haltet euch im Stand fest", test: (c) => has(c, ["clinch", "fhl"]) },
  { id: "oben", label: "Boden oben", hint: "Du liegst oben", test: (c) => has(c, ["guard", "side", "mount", "back"], "top") },
  { id: "unten", label: "Boden unten", hint: "Du liegst unten", test: (c) => has(c, ["guard", "side", "mount", "back"], "bottom") },
];
function has(c: CardDef, pos: PositionId[], role?: Role) {
  return c.slots.some((s) => pos.includes(s.pos) && (!role || s.role === role));
}

function PhaseChips({ value, onChange, counts }: { value: PhaseId; onChange: (p: PhaseId) => void; counts?: Record<PhaseId, number> }) {
  return (
    <div className="chips" role="toolbar" aria-label="Nach Phase filtern">
      {PHASES.map((p) => (
        <button key={p.id} className={`chip ${value === p.id ? "on" : ""}`} aria-pressed={value === p.id} title={p.hint} onClick={() => onChange(p.id)}>
          {value === p.id && <motion.span layoutId="chip-glow" className="chip-bg" transition={{ type: "spring", stiffness: 500, damping: 34 }} />}
          <span className="chip-t">{p.label}</span>
          {counts && <span className="chip-n num">{counts[p.id]}</span>}
        </button>
      ))}
    </div>
  );
}

/** Gestaffeltes Einblenden (Index gedeckelt, damit lange Listen nicht ewig brauchen). */
function Stagger({ i, children, className }: { i: number; children: ReactNode; className?: string }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.div className={className}
      initial={{ opacity: 0, y: 18, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: reduce ? 0 : Math.min(i, 14) * 0.035, duration: 0.3, ease }}>
      {children}
    </motion.div>
  );
}

/** Zahl, die bei Änderung kurz „aufploppt“. */
function PopNum({ value, className }: { value: string | number; className?: string }) {
  return (
    <span className={`popnum ${className ?? ""}`} aria-live="polite">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={String(value)} className="num" initial={{ scale: 1.7, opacity: 0, y: -6 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
          transition={{ type: "spring", stiffness: 520, damping: 22 }}>
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ---------- Detail-Sheet: Alltag zuerst ---------- */

export function PlainDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const c = CARD[id];
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const [demo, setDemo] = useState<string | null>(null);
  const big = c.plain ?? c.name;
  const showTerm = !!c.plain && c.plain !== c.name;
  return (
    <motion.div className="sheet-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="sheet plain-sheet" role="dialog" aria-modal="true" aria-labelledby="pd-title"
        initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }} transition={{ type: "spring", stiffness: 340, damping: 32 }}
        onClick={(e) => e.stopPropagation()}>
        <div className="pd-top">
          <motion.div className="pd-card" initial={{ rotateY: -25, opacity: 0, y: 20 }} animate={{ rotateY: 0, opacity: 1, y: 0 }} transition={{ delay: 0.08, type: "spring", stiffness: 220, damping: 18 }}>
            <Card card={c} size="large" art={<CardArt card={c} size={200} />} />
          </motion.div>
          <div className="pd-head">
            <h2 id="pd-title" className="display pd-name">{big}</h2>
            {c.plainDo && <motion.p className="pd-do" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}>{c.plainDo}</motion.p>}
            {showTerm && <p className="pd-term"><span className="label">Fachbegriff</span> {c.name}{c.de ? ` · ${c.de}` : ""}</p>}
            <p className="pd-where small muted">Wo: {[...new Set(c.slots.map((s) => POSITION_GUIDE[s.pos].plain))].join(", ")}</p>
            <DemoButton cardId={c.id} onOpen={setDemo} />
          </div>
        </div>
        {demo && <TechniqueDemo cardId={demo} onClose={() => setDemo(null)} />}
        <motion.div className="detail-text" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
          <h4 className="label">Darauf kommt es an</h4>
          <ul className="good">{c.keys.map((k) => <li key={k}>{k}</li>)}</ul>
          <p className="muted small">{c.desc}</p>
          {c.mistakes.length > 0 && <><h4 className="label">Typische Fehler</h4><ul className="bad">{c.mistakes.map((k) => <li key={k}>{k}</li>)}</ul></>}
          {c.safety && <p className="safety"><b>Sicherheit:</b> {c.safety}</p>}
          {c.check && <p className="check label">Ohne Primärquelle – vom Trainer bestätigen lassen</p>}
          {c.source && <p className="src">Quelle: <a href={c.source.url} target="_blank" rel="noopener">{c.source.title}</a></p>}
        </motion.div>
        <button ref={closeRef} className="btn" onClick={onClose}>Schließen</button>
      </motion.div>
    </motion.div>
  );
}

/* ---------- Deck bauen ---------- */

export function DeckBuilder() {
  const g = useGame();
  const [draft, setDraft] = useState<string[]>(g.deck);
  const [detail, setDetail] = useState<string | null>(null);
  const [phase, setPhase] = useState<PhaseId>("alle");
  const [savedFx, setSavedFx] = useState(0);
  const count = (id: string) => draft.filter((x) => x === id).length;
  const coll = [...g.collection].sort((a, b) => ORDER.indexOf(CARD[a].slots[0].pos) - ORDER.indexOf(CARD[b].slots[0].pos));
  const shown = coll.filter((id) => PHASES.find((p) => p.id === phase)!.test(CARD[id]));
  const add = (id: string) => { if (draft.length < 20 && count(id) < maxCopies(id)) setDraft([...draft, id]); };
  const remove = (id: string) => { const i = draft.indexOf(id); if (i >= 0) setDraft(draft.filter((_, k) => k !== i)); };
  const dirty = draft.join() !== g.deck.join();
  const curve = ORDER.map((p) => ({ p, n: draft.filter((id) => CARD[id].slots.some((s) => s.pos === p)).length }));
  const counts = Object.fromEntries(PHASES.map((p) => [p.id, draft.filter((id) => p.test(CARD[id])).length])) as Record<PhaseId, number>;
  const save = () => { g.set({ deck: draft }); setSavedFx((n) => n + 1); };

  useEffect(() => {
    if (!savedFx) return;
    const t = setTimeout(() => setSavedFx(0), 1800);
    return () => clearTimeout(t);
  }, [savedFx]);

  return (
    <div className="screen deck">
      <div className="deck-head">
        <h2 className="display">Dein Deck <span className={`deck-count ${draft.length === 20 ? "full" : ""}`}><PopNum value={draft.length} />/20</span></h2>
        <div className="save-wrap">
          <button className="btn primary" disabled={draft.length !== 20 || !dirty} onClick={save}>
            {dirty ? (draft.length === 20 ? "Speichern" : `Noch ${20 - draft.length} Karten`) : "Gespeichert"}
          </button>
          <AnimatePresence>
            {savedFx > 0 && (
              <motion.span key={savedFx} className="save-ok" role="status" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <motion.path d="M5 12.5 l4.5 4.5 l9.5 -10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.1, duration: 0.35 }} />
                </svg>
                Gespeichert!
                {[0, 1, 2, 3, 4, 5].map((k) => <i key={k} className="spark" style={{ ["--a" as string]: `${k * 60}deg` }} />)}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="curve" aria-label="Karten pro Position">
        {curve.map(({ p, n }) => (
          <div key={p} className="curve-col" title={POS_LABEL[p]}>
            <motion.i animate={{ height: `${Math.min(100, n * 12)}%` }} transition={{ type: "spring", stiffness: 300, damping: 22 }} />
            <span className="label curve-l">{POSITION_GUIDE[p].plain}</span>
            <PopNum value={n} className="small" />
          </div>
        ))}
      </div>
      <p className="muted small">Tipp: Nimm Karten für jede Lage mit – vom Stand bis zum Boden. Max. 2 gleiche Karten, legendäre nur 1×.</p>
      <PhaseChips value={phase} onChange={setPhase} counts={counts} />
      <div className="grid">
          {shown.map((id, i) => {
            const n = count(id);
            const nm = CARD[id].plain ?? CARD[id].name;
            return (
              <Stagger key={`${phase}-${id}`} i={i} className={`grid-item ${n ? "in" : ""}`}>
                <Card card={CARD[id]} size="hand" art={<CardArt card={CARD[id]} size={96} />} count={n || undefined} onClick={() => setDetail(id)} />
                <div className="grid-btns">
                  <button className="btn small" onClick={() => remove(id)} disabled={!n} aria-label={`${nm} entfernen`}>−</button>
                  <span className={`copies ${n ? "on" : ""}`}><PopNum value={n} />/{maxCopies(id)}</span>
                  <button className="btn small" onClick={() => add(id)} disabled={draft.length >= 20 || n >= maxCopies(id)} aria-label={`${nm} hinzufügen`}>+</button>
                </div>
              </Stagger>
            );
          })}
      </div>
      {shown.length === 0 && <p className="muted center">Noch keine Karten für diese Lage. Gewinne Kämpfe, um neue zu bekommen.</p>}
      <AnimatePresence>{detail && <PlainDetail id={detail} onClose={() => setDetail(null)} />}</AnimatePresence>
    </div>
  );
}

/* ---------- Bibliothek ---------- */

export function Library() {
  const g = useGame();
  const [detail, setDetail] = useState<string | null>(null);
  const [train, setTrain] = useState<string[] | null>(null);
  const [phase, setPhase] = useState<PhaseId>("alle");
  const [mistakeRun, setMistakeRun] = useState(false);
  if (train) return <Lesson ids={train} onDone={() => setTrain(null)} />;
  if (mistakeRun) return <MistakeTraining onDone={() => setMistakeRun(false)} />;
  const nMistakes = g.mistakes.length;
  const owned = DECK_CARD_IDS.filter((id) => g.collection.includes(id));
  const test = PHASES.find((p) => p.id === phase)!.test;
  let k = 0;
  return (
    <div className="screen library">
      <div className="deck-head">
        <h2 className="display">Bibliothek <span className="num">{owned.length}/{DECK_CARD_IDS.length}</span></h2>
        <motion.button className="btn primary" onClick={() => setTrain([...owned].sort(() => Math.random() - .5).slice(0, 5))} whileTap={{ scale: 0.95 }}>
          Üben: 5 Karten
        </motion.button>
      </div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "12px 14px", borderRadius: "var(--radius)",
          background: "var(--surface)", border: `1px solid ${nMistakes ? "var(--k-angriff)" : "var(--line-strong)"}` }}>
        <div style={{ flex: "1 1 200px", minWidth: 0 }}>
          <b>Fehler-Deck</b>
          <p className="muted small" style={{ margin: 0 }}>
            {nMistakes ? "Situationen, in denen er dich erwischt hat – nochmal lösen, damit es sitzt." : "Noch leer – nach Kämpfen landen hier Situationen, die du verloren hast."}
          </p>
        </div>
        <motion.button className="btn primary" disabled={!nMistakes} onClick={() => setMistakeRun(true)} whileTap={nMistakes ? { scale: 0.95 } : undefined}
          title={nMistakes ? undefined : "Kämpfe zuerst – dann gibt es hier etwas zu üben."}>
          Fehler-Deck üben (<span className="num">{nMistakes}</span>)
        </motion.button>
      </motion.div>
      <p className="muted small">Tippe eine Karte an: Du siehst, was sie im Alltag bedeutet. Beim Üben wirst du gefragt – so bleibt es hängen.</p>
      <PhaseChips value={phase} onChange={setPhase} />
      {ORDER.map((p) => {
        const ids = DECK_CARD_IDS.filter((id) => CARD[id].slots[0].pos === p && test(CARD[id]));
        if (!ids.length) return null;
        const guide = POSITION_GUIDE[p];
        return (
          <section key={`${phase}-${p}`}>
            <h3 className="section-title lib-title"><span className="lib-plain">{guide.plain}</span> <span className="label">{guide.term}</span></h3>
            <div className="grid">
              {ids.map((id) => (
                <Stagger key={id} i={k++} className="grid-item">
                  {g.collection.includes(id)
                    ? <>
                        <Card card={CARD[id]} size="hand" art={<CardArt card={CARD[id]} size={96} />} onClick={() => setDetail(id)} />
                        <span className="lib-name">{CARD[id].plain ?? CARD[id].name}</span>
                      </>
                    : <div className="locked-card"><Card card={CARD[id]} size="hand" faceDown /><span className="label">Noch gesperrt</span></div>}
                </Stagger>
              ))}
            </div>
          </section>
        );
      })}
      <section className="banned">
        <h3 className="label section-title">Für Anfänger verboten – nie als Karte</h3>
        {BANNED_LESSONS.map((b) => <p key={b.id}><b>{b.name}:</b> {b.why}</p>)}
      </section>
      <AnimatePresence>{detail && <PlainDetail id={detail} onClose={() => setDetail(null)} />}</AnimatePresence>
    </div>
  );
}
