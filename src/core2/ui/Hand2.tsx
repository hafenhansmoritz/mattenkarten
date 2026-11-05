import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Board, Card2, Zone } from "../types";
import { ZONES } from "../types";
import { KIND_LABEL, KraftIcon, LockIcon, ZONE_LABEL, ZONE_SHORT, ZoneIcon, fmtSigned, reqList } from "./meta";
import { Pulse } from "../../components/fx";

export interface Hand2Props {
  /** Alle Karten des Slots (cardsFor(pos, role)). */
  cards: Card2[];
  /** Ergebnis von legalCards(s, side). Fehlt ein Eintrag, gilt die Karte als spielbar. */
  legal: { id: string; ok: boolean; reason?: string }[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  /** Brett aus Sicht des Spielers (boardFor(s, "p")) – färbt Bedingungs-Chips erfüllt/offen. */
  myBoard?: Board;
  /** Gesperrte Karten (State2.p.locked) – bekommen das Schloss. */
  locked?: string[];
  /** Atem des Spielers (State2.kraft) – Karten, die mehr kosten, werden markiert. */
  kraft?: number;
  /** Tutorial: nur diese Karte darf gewählt werden; sie pulsiert. */
  requireCard?: string;
  /** Tutorial: diese Zone hervorheben. */
  highlightZone?: Zone | null;
  /** Zonen, die in dieser Lektion noch nicht aktiv sind (Spalte grau, "später"). */
  hiddenZones?: Zone[];
  /** Max. sichtbare Karten (Standard 8), Rest hinter "+N". */
  max?: number;
  className?: string;
}

/** Hand für Kern 2: Karten nach Zone gruppiert (vier Spalten), Farbe = Art. */
export function Hand2({ cards, legal, selected, onSelect, myBoard, locked = [], kraft, requireCard, highlightZone = null, hiddenZones = [], max = 8, className }: Hand2Props) {
  const reduced = !!useReducedMotion();
  const [showAll, setShowAll] = useState(false);
  const lmap = useMemo(() => new Map(legal.map((l) => [l.id, l])), [legal]);
  const isOk = (c: Card2) => lmap.get(c.id)?.ok ?? true;

  // Spielbare zuerst; danach gesperrte/zu schwache. Max sichtbar begrenzen.
  const sorted = useMemo(() => {
    const ok = cards.filter(isOk), no = cards.filter((c) => !isOk(c));
    return [...ok, ...no];
  }, [cards, lmap]); // eslint-disable-line react-hooks/exhaustive-deps
  const visible = showAll ? sorted : sorted.slice(0, max);
  const hidden = sorted.length - visible.length;
  const visibleSet = new Set(visible.map((c) => c.id));
  const sel = selected ? cards.find((c) => c.id === selected) ?? null : null;

  return (
    <div lang="de" className={["k2-hand", className].filter(Boolean).join(" ")}>
      <div className="k2-hand-cols">
        {ZONES.map((z) => {
          const col = cards.filter((c) => c.zone === z && visibleSet.has(c.id));
          const later = hiddenZones.includes(z) && col.length === 0;
          return (
            <div key={z} className={`k2-hcol${highlightZone === z ? " is-hl" : ""}${later ? " is-later" : ""}`}>
              <div className="k2-hcol-head" title={ZONE_LABEL[z]}><ZoneIcon zone={z} size={13} /><span>{ZONE_SHORT[z]}</span></div>
              {later && <div className="k2-hcol-empty k2-hcol-later">später</div>}
              {col.length === 0 && !later && <div className="k2-hcol-empty" aria-hidden>–</div>}
              {col.map((c, i) => {
                const l = lmap.get(c.id);
                const ok = l?.ok ?? true;
                const isLocked = locked.includes(c.id) || (!ok && /gesperrt/i.test(l?.reason ?? ""));
                const blockedByTut = !!requireCard && c.id !== requireCard;
                const disabled = !ok || blockedByTut;
                const isSel = selected === c.id;
                const tooExpensive = c.kraft != null && kraft != null && c.kraft > kraft;
                const reqs = reqList(c);
                return (
                  <Pulse key={c.id} active={requireCard === c.id && !isSel} radius="8px" className="k2-hcard-pulse">
                    <motion.button type="button"
                      className={`k2-hcard kind-${c.kind}${isSel ? " is-sel" : ""}${disabled ? " is-off" : ""}${isLocked ? " is-locked" : ""}`}
                      disabled={disabled}
                      data-card={c.id}
                      aria-pressed={isSel}
                      aria-label={`${c.plain}, ${KIND_LABEL[c.kind]}, ${ZONE_LABEL[c.zone]}${!ok && l?.reason ? `. ${l.reason}` : ""}`}
                      title={!ok ? l?.reason : blockedByTut ? "Erst die markierte Karte" : c.plainDo}
                      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.9 }}
                      animate={{ opacity: 1, y: isSel && !reduced ? -4 : 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 380, damping: 26, delay: reduced ? 0 : i * 0.04 }}
                      whileTap={disabled || reduced ? undefined : { scale: 0.95 }}
                      onClick={() => onSelect(isSel ? null : c.id)}>
                      <span className="k2-hcard-kind">{KIND_LABEL[c.kind]}</span>
                      <span className="k2-hcard-t">{c.plain}</span>
                      {(reqs.length > 0 || c.kraft) && (
                        <span className="k2-hcard-reqs">
                          {reqs.map((r) => {
                            const met = myBoard ? myBoard[r.zone] >= r.n : null;
                            return <span key={r.zone} className={`k2-req${met === true ? " met" : met === false ? " miss" : ""}`}>{ZONE_SHORT[r.zone]} {fmtSigned(r.n)}</span>;
                          })}
                          {c.kraft ? <span className={`k2-req kraft${tooExpensive ? " miss" : ""}`}><KraftIcon size={9} />{c.kraft}</span> : null}
                        </span>
                      )}
                      {isLocked && <span className="k2-lock" aria-hidden><LockIcon size={11} /></span>}
                    </motion.button>
                  </Pulse>
                );
              })}
            </div>
          );
        })}
      </div>
      {(hidden > 0 || showAll) && sorted.length > max && (
        <button type="button" className="k2-hand-more" onClick={() => setShowAll(!showAll)}>
          {showAll ? "Weniger zeigen" : `+${hidden} gesperrt / passt gerade nicht`}
        </button>
      )}
      <AnimatePresence mode="wait">
        {sel ? (
          <motion.div key={sel.id} className={`k2-hand-info kind-${sel.kind}`}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }}>
            <b>{sel.plain}</b> <span className="k2-term">{sel.term}</span>
            <p>{sel.plainDo}</p>
          </motion.div>
        ) : (
          <motion.div key="none" className="k2-hand-info is-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            Wähle eine Karte. Farbe: <i className="kc-a">Angreifen</i> · <i className="kc-b">Aufbauen</i> · <i className="kc-r">Rahmen</i>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
