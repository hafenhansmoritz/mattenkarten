import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Board as BoardT, Side, Zone } from "../types";
import { ZONES } from "../types";
import { GripIcon, KonterIcon, ThreatChevron, ZONE_LABEL, ZONE_QUESTION, ZoneIcon, fmtSigned } from "./meta";

export interface BoardProps {
  /** Brett aus Sicht von "p" (wie in State2). */
  board: BoardT;
  /** Zone, die gerade aufleuchtet (Round2.focusZone, Tutorial-Highlight). */
  focus?: Zone | null;
  /** Änderungen der letzten Runde, Sicht von "p" (z. B. aus Event2 "zone"). Neues Objekt → Pops spielen erneut. */
  lastDeltas?: Partial<Record<Zone, number>> | null;
  /** Wo der GEGNER der Perspektive gerade angreifen kann (threats(s, gegner)). */
  threats?: { zone: Zone; cardIds: string[] }[];
  /** Aus wessen Sicht gezeigt wird (Standard "p"): diese Seite ist "du" (blau, links). */
  perspective?: Side;
  /** Zonen, die in dieser Lektion noch nicht aktiv sind: grau, "kommt später". */
  hidden?: Zone[];
  /** Mechanik 2: liegende Griffe (State2.grips) – Marke neben der Zone, Farbe des Besitzers. */
  grips?: { id: string; name: string; owner: Side; zone: Zone }[];
  /** Mechanik 3 „Abschluss möglich“ (B36): Zonen, in denen eine Seite nächste Runde beenden kann, wenn dort niemand rahmt. */
  finish?: { side: Side; zone: Zone }[];
  /** Mechanik 4: Zone deines eigenen verdeckten Konters (nur für dich sichtbar – nie seiner). */
  konterZone?: Zone | null;
  /** Tippen auf eine Zeile (z. B. für Erklärung). */
  onZoneTap?: (z: Zone) => void;
  className?: string;
}

function ownerWord(v: number): string {
  if (v >= 2) return "deins";
  if (v === 1) return "du führst";
  if (v === 0) return "offen";
  if (v === -1) return "er führt";
  return "seins";
}

/**
 * Körperkarte: vier Tauzieh-Leisten (Kopf/Nacken, Arme, Hüfte, Beine), je −2…+2.
 * Links = du (blau), rechts = er (rot). Der Puck rutscht zu dem, der die Zone kontrolliert.
 */
export function Board({ board, focus = null, lastDeltas = null, threats = [], perspective = "p", hidden = [], grips = [], finish = [], konterZone = null, onZoneTap, className }: BoardProps) {
  const reduced = !!useReducedMotion();
  const sign = perspective === "p" ? 1 : -1;
  const threatZones = new Set(threats.filter((t) => t.cardIds.length > 0).map((t) => t.zone));

  // Pops bei neuem Delta-Objekt neu abspielen.
  const [nonce, setNonce] = useState(0);
  const prev = useRef(lastDeltas);
  useEffect(() => {
    if (prev.current !== lastDeltas) { prev.current = lastDeltas; setNonce((n) => n + 1); }
  }, [lastDeltas]);
  const [popsOn, setPopsOn] = useState(false);
  useEffect(() => {
    if (!lastDeltas) return;
    setPopsOn(true);
    const t = setTimeout(() => setPopsOn(false), 1500);
    return () => clearTimeout(t);
  }, [nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={["k2-board", className].filter(Boolean).join(" ")} role="group" aria-label="Körperkarte: wer kontrolliert welche Zone">
      <div className="k2-board-ends" aria-hidden>
        <span className="k2-end-p">du</span>
        <span className="k2-end-o">er</span>
      </div>
      {ZONES.map((z) => {
        const v = Math.max(-2, Math.min(2, (board[z] ?? 0) * sign));
        const d = lastDeltas?.[z] ? (lastDeltas[z] as number) * sign : 0;
        if (hidden.includes(z)) {
          return (
            <div key={z} className="k2-row is-later" aria-label={`${ZONE_LABEL[z]}: kommt später`}>
              <div className="k2-row-label">
                <ZoneIcon zone={z} size={15} />
                <span>{ZONE_LABEL[z]}</span>
              </div>
              <div className="k2-track k2-track-later"><span>kommt später</span></div>
              <span className="k2-row-val" />
            </div>
          );
        }
        const isFocus = focus === z;
        const threat = threatZones.has(z);
        const fin = finish.filter((f) => f.zone === z);
        const finMine = fin.some((f) => f.side === perspective), finHis = fin.some((f) => f.side !== perspective);
        const finTxt = finHis ? ". Er kann hier beenden – rahmen!" : finMine ? ". Du kannst hier beenden." : "";
        const zg = grips.filter((g) => g.zone === z);
        const gripTxt = zg.map((g) => `${g.owner === perspective ? "Dein" : "Sein"} Griff: ${g.name}`).join(". ");
        // +2 → Puck ganz links (bei dir), −2 → ganz rechts (bei ihm).
        const left = 50 - v * 20;
        const tone = v > 0 ? "p" : v < 0 ? "o" : "n";
        return (
          <div key={z}
            className={`k2-row tone-${tone}${isFocus ? " is-focus" : ""}${threat ? " is-threat" : ""}${finHis ? " is-finish his" : finMine ? " is-finish mine" : ""}${onZoneTap ? " is-tappable" : ""}`}
            aria-label={`${ZONE_QUESTION[z]} ${ownerWord(v)}${threat ? ". Er kann hier angreifen." : ""}${finTxt}${gripTxt ? `. ${gripTxt}` : ""}${konterZone === z ? ". Dein Konter liegt hier verdeckt" : ""}`}
            title={ZONE_QUESTION[z]}
            role={onZoneTap ? "button" : "group"}
            tabIndex={onZoneTap ? 0 : undefined}
            onKeyDown={onZoneTap ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onZoneTap(z); } } : undefined}
            onClick={onZoneTap ? () => onZoneTap(z) : undefined}>
            <div className="k2-row-label">
              {/* Pro Zone liegt höchstens ein Griff (B33 verdrängt seinen) – die Griff-Marke ersetzt das Zonen-Symbol. */}
              {zg.length ? zg.slice(0, 1).map((g) => (
                <span key={`${g.owner}-${g.id}`} className={`k2-grip-tok ${g.owner === perspective ? "p" : "o"}`} title={`${g.owner === perspective ? "Dein" : "Sein"} Griff: ${g.name}`} aria-hidden>
                  <GripIcon size={11} />
                </span>
              )) : <ZoneIcon zone={z} size={15} />}
              <span>{ZONE_LABEL[z]}</span>
              {konterZone === z && <span className="k2-konter-tok" title="Dein Konter liegt hier verdeckt" aria-hidden><KonterIcon size={10} /></span>}
            </div>
            <div className="k2-track">
              <div className="k2-track-fill" />
              {[-2, -1, 0, 1, 2].map((t) => (
                <span key={t} className={`k2-tick${t === 0 ? " mid" : ""}`} style={{ left: `${50 - t * 20}%` }} />
              ))}
              <motion.span className={`k2-puck tone-${tone}`}
                initial={false}
                animate={{ left: `${left}%` }}
                transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 17, mass: 0.9 }}>
                <span className="k2-puck-v">{v === 0 ? "" : Math.abs(v)}</span>
              </motion.span>
              <AnimatePresence>
                {popsOn && d !== 0 && (
                  <motion.span key={`pop-${nonce}`} className={`k2-delta ${d > 0 ? "up" : "down"}`}
                    style={{ left: `${left}%` }}
                    initial={{ opacity: 0, y: 4, scale: 0.5 }}
                    animate={{ opacity: 1, y: -14, scale: 1 }}
                    exit={{ opacity: 0, y: -22 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}>
                    {d > 0 ? `+${d}` : `−${Math.abs(d)}`}
                  </motion.span>
                )}
              </AnimatePresence>
              {threat && (
                <span className="k2-threat" aria-hidden><ThreatChevron size={14} /></span>
              )}
            </div>
            <span className={`k2-row-val tone-${tone}`}>{ownerWord(v)}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Zonen-Deltas einer Runde aus deren Events (Sicht "p"). */
export function deltasOf(events: { t: string; zone?: Zone; delta?: number }[]): Partial<Record<Zone, number>> {
  const out: Partial<Record<Zone, number>> = {};
  for (const e of events) if (e.t === "zone" && e.zone && e.delta) out[e.zone] = (out[e.zone] ?? 0) + e.delta;
  return out;
}

export { fmtSigned };
