import { motion, useReducedMotion } from "framer-motion";
import { ARCHETYPES, BELTS, type Belt } from "../data/campaign";
import { CARD } from "../data/cards";
import type { Archetype } from "../engine/types";
import { isUnlocked, useGame } from "../store";
import { PoseThumb } from "../components/fighters";
import { Card } from "../components/Card";
import { CardArt } from "../components/CardArt";

const ease = [0.2, 0.7, 0.2, 1] as const;

/** Alltagsname einer Karte (Fachbegriff nur, wenn noch kein Alltagstitel existiert). */
const plainName = (id: string) => CARD[id]?.plain ?? CARD[id]?.name;

/** Ein Satz: Was lernt man in diesem Kampf? */
export function learnLine(a: Archetype): string {
  if (a.tutorial === 1) return "Du lernst: Angreifen schlägt Vorbereiten";
  if (a.tutorial === 2) return "Du lernst: Kontern";
  if (a.tutorial === 3) return "Du lernst: Erst Griff, dann beenden";
  const rewards = a.reward.map(plainName).filter(Boolean).join(", ");
  const who = a.boss ? "die Gürtelprüfung" : a.title;
  return `Du lernst: gegen ${who}${rewards ? ` – ${rewards}` : ""}`;
}

export function Campaign({ onFight }: { onFight: (a: Archetype) => void }) {
  const g = useGame();
  const nextId = ARCHETYPES.find((a) => !g.beaten.includes(a.id))?.id;
  let globalIndex = 0;
  return (
    <div className="screen campaign">
      {!g.introSeen && <Intro onDone={() => g.set({ introSeen: true })} />}

      <div className="pfad">
        {BELTS.map((b, bi) => {
          const opps = ARCHETYPES.filter((a) => a.belt === b.id);
          const beatenN = opps.filter((a) => g.beaten.includes(a.id)).length;
          const done = beatenN === opps.length;
          const startIdx = globalIndex;
          globalIndex += opps.length;
          return (
            <section key={b.id} className={`pfad-belt ${done ? "done" : ""}`} aria-label={`${b.name}: ${beatenN} von ${opps.length} geschafft`}>
              <BeltHead belt={b} done={done} count={`${beatenN}/${opps.length}`} delay={bi * 0.08} />
              <ol className="pfad-nodes">
                {opps.map((a, i) => (
                  <PathNode
                    key={a.id}
                    a={a}
                    n={startIdx + i + 1}
                    open={isUnlocked(a.id, g.beaten)}
                    beaten={g.beaten.includes(a.id)}
                    isNext={a.id === nextId}
                    last={i === opps.length - 1}
                    delay={0.12 + i * 0.07}
                    onFight={onFight}
                  />
                ))}
              </ol>
            </section>
          );
        })}
      </div>
      <p className="muted small center">App-Gürtel sind kein echter Rang. Gürtel vergibt dein Trainer.</p>
    </div>
  );
}

/* ---------- Intro: 3 große Schritte ---------- */

const STEPS = [
  { n: 1, t: "Karte wählen", d: "Was willst du tun?", icon: <IconPick /> },
  { n: 2, t: "Gleichzeitig aufdecken", d: "Du und dein Gegner – zur selben Zeit.", icon: <IconReveal /> },
  { n: 3, t: "Lernen, warum", d: "Jede Runde erklärt dir, was gewirkt hat.", icon: <IconLearn /> },
];

function Intro({ onDone }: { onDone: () => void }) {
  return (
    <motion.section className="intro intro-steps" aria-labelledby="intro-h" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
      <span className="label">Willkommen auf der Matte</span>
      <h2 id="intro-h" className="display">So geht’s</h2>
      <ol className="steps">
        {STEPS.map((s, i) => (
          <motion.li key={s.n} className="step" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.12, duration: 0.35, ease }}>
            <span className="step-icon" aria-hidden="true">{s.icon}<b className="num">{s.n}</b></span>
            <span className="step-text"><strong>{s.t}</strong><span className="muted small">{s.d}</span></span>
          </motion.li>
        ))}
      </ol>
      <p className="muted small">Kein Vorwissen nötig. Echte Technik lernst du im Gym – mit Trainer und Partner.</p>
      <motion.button className="btn primary big" onClick={onDone} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.55 }}>
        Los geht’s
      </motion.button>
    </motion.section>
  );
}

function IconPick() {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40">
      <rect x="6" y="10" width="16" height="22" rx="3" fill="none" stroke="currentColor" strokeWidth="2" opacity=".45" transform="rotate(-12 14 21)" />
      <rect x="16" y="7" width="16" height="22" rx="3" fill="currentColor" opacity=".9" />
    </svg>
  );
}
function IconReveal() {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40">
      <rect x="3" y="9" width="15" height="22" rx="3" fill="var(--gi-p)" />
      <rect x="22" y="9" width="15" height="22" rx="3" fill="var(--gi-o)" />
      <path d="M20 4 v4 M20 32 v4 M14 6 l2 3 M26 6 l-2 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconLearn() {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40">
      <path d="M20 6 a10 10 0 0 1 6 18 v4 h-12 v-4 a10 10 0 0 1 6 -18 z" fill="var(--points)" />
      <rect x="15" y="30" width="10" height="3" rx="1.5" fill="currentColor" />
      <rect x="16.5" y="34" width="7" height="2.5" rx="1.25" fill="currentColor" opacity=".7" />
    </svg>
  );
}

/* ---------- Gürtel-Kopf mit animiertem Gürtel ---------- */

function BeltHead({ belt, done, count, delay }: { belt: Belt; done: boolean; count: string; delay: number }) {
  const reduce = useReducedMotion() ?? false;
  const d = reduce ? 0 : delay;
  return (
    <div className="pfad-belt-head" style={{ ["--belt-c" as string]: belt.color, ["--belt-a" as string]: belt.accent }}>
      <svg className="belt-svg" viewBox="0 0 120 40" width="120" height="40" aria-hidden="true">
        {/* Gürtelband fegt von links rein */}
        <motion.g style={{ transformOrigin: "0px 14px" }} initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ delay: d, duration: 0.55, ease }}>
          <rect x="2" y="9" width="116" height="10" rx="2" fill="var(--belt-c)" stroke="rgba(255,255,255,.18)" />
          <rect x="88" y="9" width="18" height="10" fill={belt.id === "schwarz" ? "var(--belt-a)" : "#111"} />
        </motion.g>
        {/* Enden fallen und schwingen aus */}
        <motion.rect x="50" y="16" width="8" height="20" rx="2" fill="var(--belt-c)" stroke="rgba(255,255,255,.18)" style={{ transformOrigin: "54px 16px" }}
          initial={{ rotate: -80, opacity: 0 }} whileInView={{ rotate: 14, opacity: 1 }} viewport={{ once: true }} transition={{ delay: d + 0.45, type: "spring", stiffness: 180, damping: 9 }} />
        <motion.rect x="62" y="16" width="8" height="20" rx="2" fill="var(--belt-c)" stroke="rgba(255,255,255,.18)" style={{ transformOrigin: "66px 16px" }}
          initial={{ rotate: 80, opacity: 0 }} whileInView={{ rotate: -10, opacity: 1 }} viewport={{ once: true }} transition={{ delay: d + 0.5, type: "spring", stiffness: 180, damping: 9 }} />
        {/* Knoten zieht sich zu */}
        <motion.rect x="51" y="5" width="18" height="18" rx="3" fill="var(--belt-c)" stroke="rgba(0,0,0,.35)" strokeWidth="1.5" style={{ transformOrigin: "60px 14px" }}
          initial={{ scale: 1.8, opacity: 0, rotate: -20 }} whileInView={{ scale: 1, opacity: 1, rotate: 0 }} viewport={{ once: true }} transition={{ delay: d + 0.35, type: "spring", stiffness: 420, damping: 16 }} />
      </svg>
      <div className="pfad-belt-title">
        <h2 className="display">{belt.name}</h2>
        <span className="label">{count}{done ? " · geschafft" : ""}</span>
      </div>
    </div>
  );
}

/* ---------- Knoten auf dem Pfad ---------- */

interface NodeProps { a: Archetype; n: number; open: boolean; beaten: boolean; isNext: boolean; last: boolean; delay: number; onFight: (a: Archetype) => void }

function PathNode({ a, n, open, beaten, isNext, last, delay, onFight }: NodeProps) {
  const reduce = useReducedMotion() ?? false;
  const state = beaten ? "beaten" : isNext ? "next" : open ? "open" : "locked";
  const rewards = a.reward.map(plainName).filter(Boolean) as string[];
  const learn = learnLine(a);
  const kicker = a.boss ? "Gürtelprüfung" : a.tutorial ? `Probetraining ${a.tutorial}` : a.title;
  const pose = a.boss ? "back" : a.tutorial === 3 ? "guard" : a.likes.shot ? "fhl" : "clinch";

  return (
    <motion.li className={`pfad-node ${state} ${a.boss ? "boss" : ""}`}
      initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-20px" }}
      transition={{ delay: reduce ? 0 : delay, duration: 0.4, ease }}>
      <div className="pfad-rail" aria-hidden="true">
        <motion.span className="pfad-dot"
          initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
          transition={{ delay: reduce ? 0 : delay + 0.1, type: "spring", stiffness: 420, damping: 18 }}>
          {beaten ? <Check /> : !open ? <Lock /> : a.boss ? <Crown /> : <span className="num">{n}</span>}
        </motion.span>
        {isNext && <span className="pfad-pulse" />}
        {!last && (
          <span className="pfad-seg">
            <motion.i initial={{ scaleY: 0 }} whileInView={{ scaleY: beaten ? 1 : 0 }} viewport={{ once: true }}
              transition={{ delay: reduce ? 0 : delay + 0.3, duration: 0.6, ease }} />
          </span>
        )}
      </div>

      <motion.button className="pfad-card" disabled={!open} onClick={() => onFight(a)}
        whileHover={open && !reduce ? { y: -3 } : undefined} whileTap={open ? { scale: 0.98 } : undefined}>
        {isNext && <span className="pfad-next-pill label">Nächster Kampf</span>}
        <div className="pfad-art" aria-hidden="true"><PoseThumb pos={pose} role="bottom" size={a.boss ? 96 : 78} /></div>
        <div className="pfad-info">
          <span className="label pfad-kicker">{kicker}</span>
          <strong className="display">{a.name}</strong>
          <span className="pfad-learn">{open ? learn : "Gesperrt – gewinne erst den Kampf davor."}</span>
          {open && !beaten && a.tutorial && rewards.length > 0 && (
            <span className="pfad-reward small"><span className="label">Neue Karten</span> {rewards.join(", ")}</span>
          )}
          {beaten && <span className="badge">Besiegt</span>}
        </div>
      </motion.button>
    </motion.li>
  );
}

const Check = () => (
  <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M4 10.5 l4 4 l8 -9" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const Lock = () => (
  <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><rect x="4" y="9" width="12" height="9" rx="2" fill="currentColor" /><path d="M7 9 V6.5 a3 3 0 0 1 6 0 V9" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
);
const Crown = () => (
  <svg viewBox="0 0 24 20" width="22" height="18" aria-hidden="true"><path d="M2 16 L4 5 L9 10 L12 3 L15 10 L20 5 L22 16 Z" fill="currentColor" /></svg>
);

export function NewCards({ ids, onDone }: { ids: string[]; onDone: () => void }) {
  return (
    <div className="screen unlock">
      <span className="label">Neue Karten freigeschaltet</span>
      <div className="unlock-row">{ids.map((id, i) => (
        <motion.div key={id} initial={{ y: 80, opacity: 0, rotate: -8 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ delay: .15 * i, type: "spring", stiffness: 220, damping: 18 }}>
          <Card card={CARD[id]} size="large" art={<CardArt card={CARD[id]} size={200} />} />
        </motion.div>
      ))}</div>
      <button className="btn primary big" onClick={onDone}>Zur Lektion</button>
    </div>
  );
}
