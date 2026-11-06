// Kern 2 – Sammlung (Schritt 71): alle Karten nach Position, ungesammelte als Silhouette.
// Antippen öffnet die Karte groß; nochmal antippen dreht sie um → Kurzwissen (warum, Schlüssel, Fehler, Sicherheit, Quelle, MMA).
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Card2, Pos2, Role2 } from "../types";
import { allCards } from "../engine";
import { KIND_LABEL, POS_LABEL, ZONE_LABEL, ZoneIcon } from "../ui/meta";
import { Foil, KindIcon, RarityGem } from "../ui/frame";
import { RARITIES, RARITY_HINT, RARITY_LABEL, mmaNote, rarityOf } from "../ui/rarity";
import { markSeen, useCollection } from "./store";
import { keywordsOf, type KeywordId } from "../data/keywords";
import { KeywordChips, KeywordPopover, KeywordTags } from "../ui/Keywords";
import { sfx } from "../../sound";
import { craftCard, useRewards } from "../rewards/store";
import { CRAFT_COST } from "../rewards/table";
import { PackMini } from "../rewards/RewardToasts";
import "../../styles/core2.css";
import "../../styles/sammlung.css";

const POS_ORDER: string[] = ["stand", "clinch", "headlock", "guard", "half", "turtle", "side", "mount", "back"];
const ROLE_SHORT: Record<string, string> = { neutral: "", top: "oben", bottom: "unten" };

export const posLabel = (p: string): string => (POS_LABEL as Record<string, string>)[p] ?? p.charAt(0).toUpperCase() + p.slice(1);

export interface PosGroup { pos: string; cards: Card2[] }

/** Karten nach ihrer ersten Position gruppieren; unbekannte Positionen (neue Daten) hinten anhängen. */
export function groupByPosition(cards: Card2[]): PosGroup[] {
  const map = new Map<string, Card2[]>();
  for (const c of cards) {
    const p = c.slots[0]?.pos ?? "stand";
    const arr = map.get(p) ?? [];
    arr.push(c);
    map.set(p, arr);
  }
  const keys = [...map.keys()].sort((a, b) => {
    const ia = POS_ORDER.indexOf(a), ib = POS_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
  const roleRank = (c: Card2) => ["top", "neutral", "bottom"].indexOf(c.slots[0]?.role ?? "neutral");
  const rarRank = (c: Card2) => RARITIES.indexOf(rarityOf(c));
  return keys.map((pos) => ({ pos, cards: map.get(pos)!.slice().sort((a, b) => roleRank(a) - roleRank(b) || rarRank(a) - rarRank(b)) }));
}

function slotText(c: Card2): string {
  const seen = new Set<string>();
  return c.slots.map((s: { pos: Pos2; role: Role2 }) => {
    const t = [posLabel(s.pos), ROLE_SHORT[s.role]].filter(Boolean).join(" ");
    if (seen.has(t)) return null; seen.add(t); return t;
  }).filter(Boolean).join(" · ");
}

export function Sammlung({ onBack, onPakete }: { onBack: () => void; onPakete?: () => void }) {
  const col = useCollection();
  const rw = useRewards();
  const cards = useMemo(() => allCards(), []);
  const groups = useMemo(() => groupByPosition(cards), [cards]);
  const have = useMemo(() => new Set(col.ids), [col.ids]);
  const [freshAtOpen] = useState(() => new Set(col.fresh));
  const [open, setOpen] = useState<Card2 | null>(null);
  const total = cards.length;
  const got = cards.filter((c) => have.has(c.id)).length;

  // „Neu“-Marken nach dem Öffnen abbauen (bleiben in dieser Ansicht sichtbar).
  useEffect(() => { markSeen(); }, []);

  const byRar = RARITIES.map((r) => {
    const all = cards.filter((c) => rarityOf(c) === r);
    return { r, n: all.filter((c) => have.has(c.id)).length, of: all.length };
  });

  return (
    <div className="screen sm-wrap" lang="de">
      <button className="btn small ghost" onClick={onBack}>← Zurück</button>
      <header className="sm-head">
        <h2 className="display">Sammlung</h2>
        <div className="sm-progress" aria-label={`${got} von ${total} Karten gesammelt`}>
          <span className="num"><b>{got}</b> / {total}</span>
          <span className="sm-bar"><i style={{ width: `${total ? (got / total) * 100 : 0}%` }} /></span>
        </div>
        <p className="muted small">Du sammelst eine Karte, wenn du sie spielst – oder wenn du sie im Kampf erfolgreich siehst. Tippe eine Karte an, dann nochmal zum Umdrehen.</p>
        {onPakete && (
          <button type="button" className="sm-pakete" onClick={() => { sfx.select(); onPakete(); }}>
            <span><b>Pakete &amp; Staub</b><span className="muted small">{rw.packs ? `${rw.packs} ${rw.packs === 1 ? "Paket wartet" : "Pakete warten"}` : "Fürs Lernen gibt es Kartenpakete"} · {rw.staub} Staub</span></span>
            <PackMini size={30} />
          </button>
        )}
        <ul className="sm-rar">
          {byRar.map(({ r, n, of }) => (
            <li key={r}><RarityGem rarity={r} size={13} /><b>{RARITY_LABEL[r]}</b><span className="num">{n}/{of}</span><span className="muted">{RARITY_HINT[r]}</span></li>
          ))}
        </ul>
      </header>

      {groups.map((g) => {
        const n = g.cards.filter((c) => have.has(c.id)).length;
        return (
          <section key={g.pos} className="sm-group" aria-label={posLabel(g.pos)}>
            <h3 className="sm-group-h"><span className="display">{posLabel(g.pos)}</span><span className="num muted">{n}/{g.cards.length}</span></h3>
            <div className="sm-grid">
              {g.cards.map((c) => {
                const ok = have.has(c.id);
                const rar = rarityOf(c);
                return (
                  <button key={c.id} type="button" data-card={c.id}
                    className={ok ? `sm-card k2-hcard kind-${c.kind} rar-${rar}` : `sm-card sm-ghost kind-${c.kind}`}
                    aria-label={ok ? `${c.plain}, ${KIND_LABEL[c.kind]}, ${RARITY_LABEL[rar]}` : `Noch nicht gesammelt: ${KIND_LABEL[c.kind]}`}
                    onClick={() => { sfx.select(); setOpen(c); }}>
                    {ok ? (<>
                      <Foil />
                      <span className="k2-hcard-kind"><KindIcon kind={c.kind} size={9} />{KIND_LABEL[c.kind]}</span>
                      <RarityGem rarity={rar} size={10} className="k2-hcard-gem" />
                      <span className="k2-hcard-t">{c.plain}</span>
                      <span className="sm-card-role">{ROLE_SHORT[c.slots[0]?.role ?? "neutral"] || " "}</span>
                      {freshAtOpen.has(c.id) && <span className="sm-new">neu</span>}
                    </>) : (<>
                      <span className="sm-ghost-ico"><KindIcon kind={c.kind} size={18} /></span>
                      <span className="sm-ghost-t">?</span>
                    </>)}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <AnimatePresence>
        {open && <BigCard key={open.id} card={open} owned={have.has(open.id)} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </div>
  );
}

/** Große Karte: Vorderseite → (Tippen) → Rückseite mit Kurzwissen. */
export function BigCard({ card: c, owned, onClose }: { card: Card2; owned: boolean; onClose: () => void }) {
  const reduced = !!useReducedMotion();
  const [back, setBack] = useState(false);
  const rar = rarityOf(c);
  const mma = mmaNote(c);
  const keys = c.keys.filter((k) => !/^MMA:/i.test(k.trim()));
  const flip = () => { if (!owned) return; sfx.flip(); setBack((b) => !b); };
  const kws = keywordsOf(c);
  const [kw, setKw] = useState<KeywordId | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div className="sm-overlay" role="dialog" aria-modal="true" aria-label={owned ? c.plain : "Noch nicht gesammelt"}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="sm-big-wrap" onClick={(e) => e.stopPropagation()}
        initial={reduced ? { opacity: 0 } : { scale: 0.85, y: 20 }} animate={reduced ? { opacity: 1 } : { scale: 1, y: 0 }}
        exit={reduced ? { opacity: 0 } : { scale: 0.9, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}>
        {!owned ? (
          <div className={`sm-big sm-big-ghost kind-${c.kind}`}>
            <span className="sm-ghost-ico"><KindIcon kind={c.kind} size={46} /></span>
            <b>Noch nicht gesammelt</b>
            <p>{KIND_LABEL[c.kind]} · {slotText(c)}</p>
            <p className="muted small">Spiel diese Lage im Kampf. Sobald du die Karte spielst oder sie erfolgreich gegen dich sitzt, gehört sie dir.</p>
            <CraftButton card={c} />
          </div>
        ) : (
          <motion.div className="sm-flip" onClick={flip} role="button" tabIndex={0} aria-pressed={back}
            aria-label={back ? "Vorderseite zeigen" : "Umdrehen: Kurzwissen"}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } }}
            animate={reduced ? undefined : { rotateY: back ? 180 : 0 }} transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}>
            <div className={`sm-face sm-front sm-big k2-hcard kind-${c.kind} rar-${rar}`} style={reduced ? { display: back ? "none" : undefined } : undefined} aria-hidden={back}>
              <Foil />
              <span className="sm-big-top">
                <span className="k2-hcard-kind"><KindIcon kind={c.kind} size={12} />{KIND_LABEL[c.kind]}</span>
                <span className="sm-big-rar"><RarityGem rarity={rar} size={14} />{RARITY_LABEL[rar]}</span>
              </span>
              <span className="sm-big-t display">{c.plain}</span>
              <span className="sm-big-term">{c.term}</span>
              <span className="sm-big-zone"><ZoneIcon zone={c.zone} size={14} /> {ZONE_LABEL[c.zone]}</span>
              <KeywordTags hits={kws} className="sm-big-kw" />
              <p className="sm-big-do">{c.plainDo}</p>
              <span className="sm-big-slots">{slotText(c)}</span>
              <span className="sm-big-art" aria-hidden="true"><KindIcon kind={c.kind} size={120} className="sm-big-art-kind" /><ZoneIcon zone={c.zone} size={56} /></span>
              <span className="sm-big-hint">Tippen zum Umdrehen ↻</span>
            </div>
            <div className={`sm-face sm-back kind-${c.kind}`} style={reduced ? { display: back ? undefined : "none" } : undefined} aria-hidden={!back}>
              <span className="sm-back-h"><KindIcon kind={c.kind} size={12} /> Kurzwissen · {c.plain}</span>
              <p className="sm-why"><b>Warum es klappt:</b> {c.why}</p>
              {keys.length > 0 && <div><b>Darauf kommt es an</b><ul>{keys.slice(0, 3).map((k) => <li key={k}>{k}</li>)}</ul></div>}
              {c.mistakes.length > 0 && <div><b>Typische Fehler</b><ul>{c.mistakes.slice(0, 2).map((k) => <li key={k}>{k}</li>)}</ul></div>}
              {c.safety && <p className="sm-safety"><b>Sicherheit:</b> {c.safety}</p>}
              {mma && <p className="sm-mma"><b>MMA:</b> {mma}</p>}
              {c.check && <p className="sm-check">Trainer prüfen: noch ohne Primärquelle.</p>}
              {c.source && <a className="sm-src" href={c.source.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>Quelle: {c.source.title} ↗</a>}
            </div>
          </motion.div>
        )}
        {owned && kws.length > 0 && <KeywordChips card={c} onOpen={setKw} className="sm-big-chips" />}
        <button type="button" className="btn small sm-close" onClick={onClose}>Schließen</button>
        <KeywordPopover ids={kw ? [kw] : null} labels={Object.fromEntries(kws.map((h) => [h.id, h.label]))} onClose={() => setKw(null)} />
      </motion.div>
    </motion.div>
  );
}

/** Mechanik 8: fehlende Karte mit Mattenstaub herstellen (zweimal tippen = bestätigen). */
function CraftButton({ card: c }: { card: Card2 }) {
  const rw = useRewards();
  const [sure, setSure] = useState(false);
  const cost = CRAFT_COST[rarityOf(c)];
  const can = rw.staub >= cost;
  return (
    <button type="button" className={`btn small sm-craft-btn ${sure ? "primary" : ""}`} disabled={!can}
      onClick={(e) => {
        e.stopPropagation();
        if (!sure) { sfx.select(); setSure(true); return; }
        const r = craftCard({ id: c.id, rarity: rarityOf(c) });
        if (r.ok) sfx.win();
        setSure(false);
      }}>
      {!can ? `Herstellen: ${cost} Staub nötig (du hast ${rw.staub})` : sure ? `Ja, für ${cost} Staub herstellen` : `Mit Mattenstaub herstellen · ${cost}`}
    </button>
  );
}
