// Mechanik 5 „Spielstil“: Stil-Wahl vor freiem Match, Boss und Tages-Challenge („Dein A-Game“).
// Große Karten mit Kämpfer-Bild in der Lieblingslage, Fähigkeit mit Preis, ein Satz „Im echten Grappling“ mit Quelle.
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { StilId } from "../types";
import { STIL_COOLDOWN, STIL_COST, STIL_POWER } from "../engine/stil";
import { STILE, readStil, writeStil } from "../data/stile";
import { KEYWORD } from "../data/keywords";
import { FightersK2 } from "./FightersK2";
import { KraftIcon, StilIcon, ZONE_LABEL } from "./meta";
import "../../styles/core2.css";

export interface StilWahlProps {
  /** Wofür gewählt wird (z. B. „Freies Spiel · Normal“, „Boss · Der Drücker“). */
  context: string;
  /** Optional: Stil des Gegners, wenn er feststeht (Boss). */
  foe?: { name: string; stil: StilId };
  onPick: (id: StilId) => void;
  onBack: () => void;
}

export function StilWahl({ context, foe, onPick, onBack }: StilWahlProps) {
  const [sel, setSel] = useState<StilId>(() => readStil() ?? "ringer");
  const reduced = !!useReducedMotion();
  const cur = STILE.find((x) => x.id === sel)!;
  const go = () => { writeStil(sel); onPick(sel); };
  return (
    <div className="screen more k2-stilwahl" lang="de">
      <button type="button" className="btn small ghost" onClick={onBack}>← Zurück</button>
      <span className="label">{context}</span>
      <h2 className="display" style={{ fontSize: 30, margin: "2px 0 0" }}>Dein A-Game</h2>
      <p className="muted small">
        Jeder Grappler hat einen Lieblingsweg. Wähl deinen Stil – er bringt dir eine kleine Fähigkeit.
        Die Karten und Grundlagen bleiben für alle gleich.
      </p>
      {foe && <p className="k2-stil-foe small">Gegner: <b>{foe.name}</b> · Fähigkeit {STIL_POWER[foe.stil].power} an {ZONE_LABEL[STIL_POWER[foe.stil].zone]}</p>}
      <div className="k2-stil-list" role="group" aria-label="Spielstil wählen">
        {STILE.map((x, i) => {
          const p = STIL_POWER[x.id];
          const on = x.id === sel;
          return (
            <motion.button key={x.id} type="button" className={`k2-stil-card${on ? " on" : ""}`} aria-pressed={on}
              onClick={() => setSel(x.id)}
              initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduced ? 0 : i * 0.05 }}>
              <span className="k2-stil-art" aria-hidden>
                <FightersK2 pos={x.scene.pos} top={x.scene.top} />
              </span>
              <span className="k2-stil-meta">
                <strong className="display">{x.name}</strong>
                <span className="k2-stil-tag">{x.tagline}</span>
                <span className="k2-stil-agame">{x.agame}</span>
                <span className="k2-stil-power">
                  <StilIcon size={13} /> <b>{p.power}</b> · <KraftIcon size={11} /> {STIL_COST} Atem
                </span>
                <span className="k2-stil-do">{x.powerDo}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
      <section className="k2-stil-why" aria-live="polite">
        <p><b>Im echten Grappling:</b> {cur.bjj}</p>
        {cur.source && <a className="kw-src" href={cur.source.url} target="_blank" rel="noopener noreferrer">Quelle: {cur.source.title} ↗</a>}
        {cur.check && <p className="kw-check">Trainer prüfen: noch ohne Primärquelle.</p>}
        <p className="muted small">
          So geht’s: Zusätzlich zur Karte tippst du auf deine Fähigkeit – {STIL_COST} Atem, +1 in ihrer Zone, danach {STIL_COOLDOWN === 1 ? "eine Runde" : `${STIL_COOLDOWN} Runden`} Pause.
          {" "}{KEYWORD.stil.rule.split(". ").slice(-1)[0]}
        </p>
      </section>
      <button type="button" className="btn primary big" onClick={go}>Los geht’s als {cur.name}</button>
    </div>
  );
}
