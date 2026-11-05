import { motion } from "framer-motion";
import { ARCHETYPES, BELTS } from "../data/campaign";
import { CARD } from "../data/cards";
import type { Archetype } from "../engine/types";
import { isUnlocked, useGame } from "../store";
import { PoseThumb } from "../components/fighters";
import { Card } from "../components/Card";
import { CardArt } from "../components/CardArt";
import { Triangle } from "./Arena";

export function Campaign({ onFight }: { onFight: (a: Archetype) => void }) {
  const g = useGame();
  const nextId = ARCHETYPES.find((a) => !g.beaten.includes(a.id))?.id;
  return (
    <div className="screen campaign">
      {!g.introSeen && (
        <motion.div className="intro" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <span className="label">Willkommen auf der Matte</span>
          <h2 className="display">Distanz. Clinch. Takedown. Kontrolle. Submission.</h2>
          <p>Jeder Kampf ist eine Kette. Du gewinnst, wenn du sie schneller und sauberer schließt als dein Gegner – und wenn du seine liest.</p>
          <Triangle big />
          <p className="muted small">Mattenkarten trainiert Begriffe, Positionen und Entscheidungen. Technik lernst du im Gym, mit Trainer und Partner.</p>
          <button className="btn primary" onClick={() => g.set({ introSeen: true })}>Verstanden</button>
        </motion.div>
      )}

      {BELTS.map((b) => {
        const opps = ARCHETYPES.filter((a) => a.belt === b.id);
        const done = opps.every((a) => g.beaten.includes(a.id));
        return (
          <section key={b.id} className="belt-section">
            <div className="belt-head">
              <div className="beltbar" style={{ ["--belt-c" as any]: b.color }}><i /></div>
              <h2 className="display">{b.name}</h2>
              <span className="label">{opps.filter((a) => g.beaten.includes(a.id)).length}/{opps.length}{done ? " · geschafft" : ""}</span>
            </div>
            <div className="opps">
              {opps.map((a) => {
                const open = isUnlocked(a.id, g.beaten);
                const beaten = g.beaten.includes(a.id);
                const isNext = a.id === nextId;
                return (
                  <motion.button key={a.id} className={`opp ${beaten ? "beaten" : ""} ${isNext ? "next" : ""} ${a.boss ? "boss" : ""}`}
                    disabled={!open} onClick={() => onFight(a)} whileHover={open ? { y: -4 } : undefined} whileTap={open ? { scale: .97 } : undefined}>
                    <div className="opp-art"><PoseThumb pos={a.boss ? "back" : a.tutorial === 3 ? "guard" : a.likes.shot ? "fhl" : "clinch"} role="bottom" size={110} /></div>
                    <div className="opp-info">
                      <span className="label">{a.boss ? "Gürtelprüfung" : a.tutorial ? `Tutorial ${a.tutorial}` : a.title}</span>
                      <strong className="display">{a.name}</strong>
                      <span className="small muted">{open ? a.blurb : "Gesperrt – besiege zuerst die Gegner davor."}</span>
                      {open && !beaten && a.reward.length > 0 && (
                        <span className="reward small">Belohnung: {a.reward.map((id) => CARD[id]?.name).filter(Boolean).join(", ")}</span>
                      )}
                      {beaten && <span className="badge">Besiegt</span>}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>
        );
      })}
      <p className="muted small center">App-Gürtel sind kein echter Rang. Gürtel vergibt dein Trainer.</p>
    </div>
  );
}

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
