import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Side, SubTrack } from "../types";
import { ZONE_DAT, ZONE_SHORT, ZoneIcon } from "./meta";

export interface SubTracksProps {
  subs: SubTrack[];
  /** Wer "du" ist (Standard "p"). */
  perspective?: Side;
  /** Mechanik 3 „Abschluss möglich“ (B36): diese Leisten klopfen nächste Runde ab, wenn niemand in ihrer Zone rahmt. */
  finish?: { side: Side; id: string }[];
  className?: string;
}

const STEPS = ["Isolieren", "Kontrollieren", "Beenden"] as const;

/** Aufgabe-Leisten: drei Segmente Isolieren → Kontrollieren → Beenden. Bei Schritt 2 zittert die Leiste. */
export function SubTracks({ subs, perspective = "p", finish = [], className }: SubTracksProps) {
  const reduced = !!useReducedMotion();
  const live = subs.filter((s) => s.step > 0);
  return (
    <div className={["k2-subs", className].filter(Boolean).join(" ")}>
      <AnimatePresence initial={false}>
        {live.map((s) => {
          const mine = s.owner === perspective;
          const danger = s.step >= 2;
          const fin = finish.some((f) => f.side === s.owner && f.id === s.id);
          return (
            <motion.div key={`${s.owner}-${s.id}`} layout
              className={`k2-sub ${mine ? "mine" : "his"}${danger ? " is-danger" : ""}${fin ? " is-finish" : ""}`}
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              aria-label={`${mine ? "Deine" : "Seine"} Aufgabe ${s.name}: Schritt ${s.step} von 3${fin ? (mine ? ". Du kannst beenden" : `. Er kann beenden – Rahmen an ${ZONE_DAT[s.zone]}`) : ""}`}>
              <motion.div className="k2-sub-in"
                animate={danger && !reduced ? { x: [0, -2, 2, -1.5, 1.5, 0] } : { x: 0 }}
                transition={danger && !reduced ? { duration: 0.42, repeat: Infinity, repeatDelay: 0.9 } : { duration: 0.2 }}>
                <div className="k2-sub-head">
                  <span className="k2-sub-who">{mine ? "Du" : "Er"}</span>
                  <b className="k2-sub-name">{s.name}</b>
                  <span className="k2-sub-zone"><ZoneIcon zone={s.zone} size={12} />{ZONE_SHORT[s.zone]}</span>
                  {fin ? <span className="k2-sub-warn k2-sub-fin">{mine ? "Du kannst beenden" : `Er kann beenden – Rahmen an ${ZONE_DAT[s.zone]}!`}</span>
                    : danger && <span className="k2-sub-warn">{mine ? "Noch ein Schritt!" : "Jetzt rahmen!"}</span>}
                </div>
                <div className="k2-sub-segs">
                  {STEPS.map((label, i) => {
                    const on = s.step > i;
                    return (
                      <div key={label} className={`k2-seg${on ? " on" : ""}${s.step === i + 1 ? " cur" : ""}`}>
                        <motion.span className="k2-seg-fill" initial={false}
                          animate={{ scaleX: on ? 1 : 0 }}
                          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 24 }} />
                        <span className="k2-seg-t">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
