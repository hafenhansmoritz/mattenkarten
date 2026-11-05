import { Fragment } from "react";
import type { Pos2, Round2, SubTrack } from "../types";
import { CHAIN, chainPhase, chainRepeats } from "./chain";

/** Bauplan 40: kompakte Kampfkette über der Szene. Hebt die aktuelle Phase hervor; „Repeat“ nach Rückkehr in den Stand. */
export function ChainStrip({ pos, subs, last, history, reduced }: {
  pos: Pos2; subs: SubTrack[]; last: Round2 | null; history: Round2[]; reduced: boolean;
}) {
  const cur = chainPhase(pos, subs, last);
  const idx = CHAIN.findIndex((c) => c.id === cur);
  const rep = chainRepeats(history, pos);
  const label = CHAIN[idx].label;
  return (
    <nav className={`k2-chain${reduced ? " is-reduced" : ""}`} aria-label={`Kampfkette: jetzt ${label}${rep ? `, Wiederholung ${rep}` : ""}`}>
      {CHAIN.map((c, i) => (
        <Fragment key={c.id}>
          {i > 0 && <span className={`k2-chain-sep${i <= idx ? " done" : ""}`} aria-hidden>›</span>}
          <span className={`k2-chain-step${i === idx ? " on" : i < idx ? " done" : ""}${c.id === "takedown" ? " is-tr" : ""}`}
            aria-current={i === idx ? "step" : undefined} title={c.id === "distanz" && rep ? "Zurück im Stand: die Kette beginnt neu" : undefined}>
            {/* Zurück im Stand nach Boden/Kopfklammer: „Repeat“ statt „Distanz“, danach ein kleiner Zähler. */}
            {c.id === "distanz" && rep > 0 ? (i === idx ? <>↺ Repeat{rep > 1 ? ` ×${rep}` : ""}</> : <>{c.label}<sup className="k2-chain-rep">↺{rep}</sup></>) : c.label}
          </span>
        </Fragment>
      ))}
    </nav>
  );
}
