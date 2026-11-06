// Mechanik 8 – Paket öffnen: Paket antippen → aufreißen → drei verdeckte Karten, die Rückseite leuchtet schon
// in der Farbe der Seltenheit → antippen zum Umdrehen. „Neu!“ oder „+10 Staub“ bei doppelten Karten.
// Mit „Bewegung reduzieren“: kein Schütteln, kein Drehen – nur Überblenden.
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Card2 } from "../types";
import { cardById } from "../engine";
import { Foil, KindIcon, RarityGem } from "../ui/frame";
import { KIND_LABEL } from "../ui/meta";
import { RARITY_LABEL } from "../ui/rarity";
import { sfx } from "../../sound";
import { openPack, useRewards, type OpenResult } from "./store";
import { packPool } from "./pool";
import type { PackCard } from "./table";
import { activeFrame } from "../ladder/store";
import { BELT_COLOR, BELT_IDS } from "../ladder/ladder";
import "../../styles/core2.css";
import "../../styles/sammlung.css";
import "../../styles/rewards.css";

type Phase = "pack" | "tear" | "cards";

export function PackOpening({ onClose, onCard }: { onClose: () => void; onCard?: (c: Card2) => void }) {
  const reduced = !!useReducedMotion();
  const r = useRewards();
  const [phase, setPhase] = useState<Phase>("pack");
  const [res, setRes] = useState<OpenResult | null>(null);
  const [shown, setShown] = useState<boolean[]>([]);
  const [say, setSay] = useState("");
  const packBtn = useRef<HTMLButtonElement>(null);
  const doneBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  useEffect(() => { if (phase === "pack") packBtn.current?.focus(); }, [phase]);

  function tear() {
    if (phase !== "pack") return;
    const out = openPack(packPool());
    if (!out) { onClose(); return; }
    sfx.hit();
    setRes(out);
    setShown(out.cards.map(() => false));
    setPhase("tear");
    setSay("Paket offen. Drei Karten liegen verdeckt.");
    window.setTimeout(() => setPhase("cards"), reduced ? 150 : 820);
  }

  function reveal(i: number) {
    if (!res || shown[i]) return;
    const c = res.cards[i];
    if (c.rarity === "meister") sfx.gong(); else sfx.flip();
    const next = shown.map((v, k) => v || k === i);
    setShown(next);
    const name = cardById(c.id)?.plain ?? c.id;
    setSay(`${RARITY_LABEL[c.rarity]}: ${name}${c.isNew ? " – neu!" : ` – doppelt, plus ${c.staub} Mattenstaub`}`);
    if (next.every(Boolean)) window.setTimeout(() => doneBtn.current?.focus(), 50);
  }
  function revealAll() {
    if (!res) return;
    sfx.flip();
    setShown(res.cards.map(() => true));
    setSay(res.cards.map((c) => `${RARITY_LABEL[c.rarity]}: ${cardById(c.id)?.plain ?? c.id}${c.isNew ? ", neu" : ", doppelt"}`).join(". "));
    window.setTimeout(() => doneBtn.current?.focus(), 50);
  }
  function again() {
    setRes(null); setShown([]); setPhase("pack"); setSay("");
  }

  const all = shown.length > 0 && shown.every(Boolean);
  const nNew = res?.cards.filter((c) => c.isNew).length ?? 0;

  return (
    <motion.div className="rw-open" role="dialog" aria-modal="true" aria-labelledby="rw-open-h"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 id="rw-open-h" className="sr-only">Mattenpaket öffnen</h2>
      <p className="sr-only" role="status" aria-live="polite">{say}</p>
      <div className="rw-open-top">
        <span className="rw-open-count num" aria-label={`${r.packs} Pakete übrig`}>{r.packs} übrig</span>
        <button type="button" className="btn small ghost rw-open-x" onClick={onClose}>Schließen</button>
      </div>

      <div className="rw-stage">
        <AnimatePresence mode="wait">
          {phase !== "cards" && (
            <motion.button key="pack" ref={packBtn} type="button" className={`rw-pack ${phase === "tear" ? "is-tear" : ""}`}
              onClick={tear} disabled={phase === "tear"}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7, y: 40 }}
              animate={reduced ? { opacity: 1 } : phase === "tear"
                ? { scale: [1, 1.06, 0.98, 1.12], rotate: [0, -3, 3, 0], y: 0, opacity: 1 }
                : { opacity: 1, scale: 1, y: [0, -6, 0], transition: { y: { repeat: Infinity, duration: 2.4, ease: "easeInOut" } } }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.25, filter: "brightness(2)", transition: { duration: 0.25 } }}
              transition={{ duration: 0.6 }}>
              <PackArt tearing={phase === "tear" && !reduced} />
            </motion.button>
          )}
          {phase === "cards" && res && (
            <motion.div key="cards" className="rw-cards" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {res.cards.map((c, i) => (
                <PackSlot key={i} i={i} c={c} shown={shown[i]} reduced={reduced} onReveal={() => reveal(i)} onCard={onCard} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="rw-open-foot">
        {phase === "pack" && <p className="rw-open-hint">Tippe auf das Paket. Drei Karten aus der Körperkarte.</p>}
        {phase === "cards" && !all && (<>
          <p className="rw-open-hint">Die Farbe verrät die Seltenheit. Tippe zum Umdrehen.</p>
          <button type="button" className="btn" onClick={revealAll}>Alle aufdecken</button>
        </>)}
        {all && res && (
          <motion.div className="rw-sum" initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p><b>{nNew ? `${nNew} neue ${nNew === 1 ? "Karte" : "Karten"} in deiner Sammlung` : "Keine neue Karte"}</b>
              {res.staub > 0 && <span> · +{res.staub} Mattenstaub</span>}</p>
            <div className="rw-sum-btns">
              {r.packs > 0 && <button type="button" className="btn primary" onClick={again}>Nächstes Paket ({r.packs})</button>}
              <button type="button" ref={doneBtn} className={`btn ${r.packs > 0 ? "" : "primary"}`} onClick={onClose}>Fertig</button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/** Mechanik 10 (B81): Saison-Rahmen aus der Rangliste färbt den Kartenrücken – reine Optik. */
function frameStyle(): Record<string, string> | undefined {
  const f = activeFrame();
  return f === null ? undefined : { "--fr": BELT_COLOR[BELT_IDS[f]].c, "--fr-a": BELT_COLOR[BELT_IDS[f]].a };
}

function PackSlot({ i, c, shown, reduced, onReveal, onCard }: {
  i: number; c: PackCard; shown: boolean; reduced: boolean; onReveal: () => void; onCard?: (c: Card2) => void;
}) {
  const [fr] = useState(frameStyle);
  const card = cardById(c.id);
  if (!card) return null;
  return (
    <motion.div className={`rw-slot rar-${c.rarity} ${shown ? "is-shown" : ""}`}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: -120, rotate: (i - 1) * -8, scale: 0.6 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, rotate: 0, scale: 1 }}
      transition={reduced ? { duration: 0.2 } : { type: "spring", stiffness: 220, damping: 20, delay: i * 0.12 }}>
      <motion.div className="rw-flip" animate={reduced ? undefined : { rotateY: shown ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}>
        <button type="button" className={`rw-back rar-${c.rarity}${fr ? " has-frame" : ""}`} onClick={onReveal} aria-hidden={shown} tabIndex={shown ? -1 : 0}
          style={{ ...fr, ...(reduced ? { opacity: shown ? 0 : 1, transition: "opacity .25s", pointerEvents: shown ? "none" : undefined } : {}) }}>
          <span className="rw-back-glow" aria-hidden="true" />
          <span className="sr-only">Karte {i + 1} aufdecken, Seltenheit</span>
          <span className="rw-back-logo display" aria-hidden="true">M<b>K</b></span>
          <RarityGem rarity={c.rarity} size={18} className="rw-back-gem" />
        </button>
        <button type="button" className={`rw-face sm-card k2-hcard kind-${card.kind} rar-${c.rarity}`} aria-hidden={!shown} tabIndex={shown ? 0 : -1}
          onClick={() => onCard?.(card)}
          style={reduced ? { opacity: shown ? 1 : 0, transition: "opacity .25s", transform: "none", pointerEvents: shown ? undefined : "none" } : undefined}>
          <Foil />
          <span className="k2-hcard-kind"><KindIcon kind={card.kind} size={10} />{KIND_LABEL[card.kind]}</span>
          <RarityGem rarity={c.rarity} size={12} className="k2-hcard-gem" />
          <span className="k2-hcard-t rw-face-t">{card.plain}<span className="sr-only">{c.isNew ? ", neu" : `, doppelt, plus ${c.staub} Mattenstaub`}</span></span>
          <span className="rw-face-term">{card.term}</span>
          <span className="rw-face-art" aria-hidden="true"><KindIcon kind={card.kind} size={44} /></span>
          <span className="rw-face-rar">{RARITY_LABEL[c.rarity]}</span>
        </button>
      </motion.div>
      <AnimatePresence>
        {shown && (
          <motion.span className={c.isNew ? "rw-new" : "rw-dup"} aria-hidden="true"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.4, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.35, type: "spring", stiffness: 400, damping: 16 }}>
            {c.isNew ? "Neu!" : `+${c.staub} Staub`}
          </motion.span>
        )}
      </AnimatePresence>
      {shown && c.rarity !== "grundlage" && !reduced && <span className="rw-burst" aria-hidden="true" />}
    </motion.div>
  );
}

/** Paket-Grafik: Folienbeutel mit Zackenrand, Logo und drei Edelsteinen. */
function PackArt({ tearing }: { tearing: boolean }) {
  return (
    <span className="rw-pack-art">
      <span className={`rw-pack-flap ${tearing ? "go" : ""}`} aria-hidden="true" />
      <span className="rw-pack-body">
        <span className="rw-pack-shine" aria-hidden="true" />
        <span className="rw-pack-kicker">Mattenkarten</span>
        <span className="rw-pack-title display">Matten<b>paket</b></span>
        <span className="rw-pack-gems" aria-hidden="true">
          <RarityGem rarity="grundlage" size={16} /><RarityGem rarity="technik" size={16} /><RarityGem rarity="meister" size={16} />
        </span>
        <span className="rw-pack-n">3 Karten · Körperkarte</span>
        <span className="sr-only"> – antippen zum Aufreißen</span>
      </span>
    </span>
  );
}
