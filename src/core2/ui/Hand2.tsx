import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Board, Card2, MmaFlag, Zone } from "../types";
import { ZONES } from "../types";
import { KIND_LABEL, KraftIcon, LockIcon, ZONE_LABEL, ZONE_SHORT, ZoneIcon, fmtSigned, reqList } from "./meta";
import { Pulse } from "../../components/fx";
import { Foil, KindIcon, RarityGem } from "./frame";
import { RARITY_LABEL, rarityOf } from "./rarity";
import { HAND_EXTRA, keywordsOf, type KeywordId } from "../data/keywords";
import { KeywordChips, KeywordPopover, KeywordTags } from "./Keywords";
import { chainAfterNames } from "../engine/chains";

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
  /** Mechanik 2: Zonen, in denen du gerade einen Griff hältst (Angriffe dort brauchen 1 weniger). */
  gripZones?: Zone[];
  /** Mechanik 3: Ketten-Karten, deren Kette gerade bereit ist → Name der eigenen Vorrunden-Karte. */
  chainReady?: Record<string, string>;
  /** Max. sichtbare Karten (Standard 8), Rest hinter "+N". */
  max?: number;
  className?: string;
}

/** Hand für Kern 2: Karten nach Zone gruppiert (vier Spalten), Farbe = Art. */
export function Hand2({ cards, legal, selected, onSelect, myBoard, locked = [], kraft, requireCard, highlightZone = null, hiddenZones = [], gripZones = [], chainReady = {}, max = 8, className }: Hand2Props) {
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
  // Schlüsselwörter: Antippen im Detail oder langes Drücken auf der Karte öffnet das Glossar.
  const [kwOpen, setKwOpen] = useState<{ ids: KeywordId[]; labels: Partial<Record<KeywordId, string>> } | null>(null);
  const openKw = (c: Card2, only?: KeywordId) => {
    const hits = keywordsOf(c).filter((h) => !only || h.id === only);
    if (hits.length) setKwOpen({ ids: hits.map((h) => h.id), labels: Object.fromEntries(hits.map((h) => [h.id, h.label])) });
  };
  const lp = useRef<{ t?: ReturnType<typeof setTimeout>; fired: boolean }>({ fired: false });
  const lpStart = (c: Card2) => { lp.current.fired = false; clearTimeout(lp.current.t); lp.current.t = setTimeout(() => { lp.current.fired = true; openKw(c); }, 480); };
  const lpEnd = () => clearTimeout(lp.current.t);

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
                const chainFrom = chainReady[c.id];
                const reqs = reqList(c, gripZones, !!chainFrom);
                const rar = rarityOf(c);
                const kws = keywordsOf(c);
                return (
                  <Pulse key={c.id} active={requireCard === c.id && !isSel} radius="8px" className="k2-hcard-pulse">
                    <motion.button type="button"
                      className={`k2-hcard kind-${c.kind} rar-${rar}${isSel ? " is-sel" : ""}${disabled ? " is-off" : ""}${isLocked ? " is-locked" : ""}${chainFrom && ok ? " is-chain" : ""}`}
                      disabled={disabled}
                      data-card={c.id}
                      aria-pressed={isSel}
                      aria-label={`${KIND_LABEL[c.kind]}: ${c.plain}${kws.filter((k) => HAND_EXTRA.includes(k.id)).map((k) => ` ${k.label}`).join("")}${chainFrom && ok ? ", Kette bereit" : ""}${reqs.map((r) => `, ${ZONE_SHORT[r.zone]} ${fmtSigned(r.n)}`).join("")}${c.kraft ? `, ${c.kraft} Atem nötig` : ""}. ${RARITY_LABEL[rar]}, Zone ${ZONE_LABEL[c.zone]}${reqs.some((r) => r.grip) ? ". Dein Griff senkt die Bedingung um 1" : ""}${chainFrom && ok ? `. Kette nach ${chainFrom} senkt die Bedingung um 1` : ""}${!ok && l?.reason ? `. ${l.reason}` : blockedByTut ? ". Erst die markierte Karte" : ""}`}
                      title={!ok ? l?.reason : blockedByTut ? "Erst die markierte Karte" : c.plainDo}
                      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.9 }}
                      animate={{ opacity: 1, y: isSel && !reduced ? -4 : 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 380, damping: 26, delay: reduced ? 0 : i * 0.04 }}
                      whileTap={disabled || reduced ? undefined : { scale: 0.95 }}
                      onPointerDown={() => lpStart(c)} onPointerUp={lpEnd} onPointerLeave={lpEnd} onPointerCancel={lpEnd}
                      onContextMenu={(e) => { e.preventDefault(); lpEnd(); lp.current.fired = true; openKw(c); }}
                      onClick={() => { if (lp.current.fired) { lp.current.fired = false; return; } onSelect(isSel ? null : c.id); }}>
                      <Foil />
                      <span className="k2-hcard-kind"><KindIcon kind={c.kind} size={9} />{KIND_LABEL[c.kind]}</span>{" "}
                      <RarityGem rarity={rar} size={10} className="k2-hcard-gem" />
                      <span className="k2-hcard-t">{c.plain}</span>{" "}
                      <KeywordTags hits={kws.filter((k) => HAND_EXTRA.includes(k.id))} />{" "}
                      {chainFrom && ok && <span className="k2-chain-badge">Kette bereit </span>}
                      {(reqs.length > 0 || c.kraft) && (
                        <span className="k2-hcard-reqs">
                          {reqs.map((r) => {
                            const met = myBoard ? myBoard[r.zone] >= r.n : null;
                            return <span key={r.zone} className={`k2-req${met === true ? " met" : met === false ? " miss" : ""}${r.grip ? " by-grip" : ""}${r.chain ? " by-chain" : ""}`}
                              title={r.chain ? "Deine Kette senkt die Bedingung um 1" : r.grip ? "Dein Griff senkt die Bedingung um 1" : undefined}>{ZONE_SHORT[r.zone]} {fmtSigned(r.n)} </span>;
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
            <b>{sel.plain}</b><RarityGem rarity={rarityOf(sel)} size={10} /><span className="k2-rar-t">{RARITY_LABEL[rarityOf(sel)]}</span> <span className="k2-term">{sel.term}</span>
            {sel.mma && <MmaChip mma={sel.mma} note={sel.mmaNote} />}
            <p>{sel.plainDo}</p>
            {sel.chain && (
              <p className={`k2-chain-info${chainReady[sel.id] ? " on" : ""}`}>
                <b>{chainReady[sel.id] ? `Kette bereit nach ${chainReady[sel.id]}:` : `Kette nach ${chainAfterNames(sel).join(" oder ")}:`}</b> {sel.chain.why}
              </p>
            )}
            <KeywordChips card={sel} onOpen={(id) => openKw(sel, id)} />
          </motion.div>
        ) : (
          <motion.div key="none" className="k2-hand-info is-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            Wähle eine Karte. <i className="kc-a"><KindIcon kind="angriff" size={10} /> Angreifen</i> · <i className="kc-b"><KindIcon kind="aufbauen" size={10} /> Aufbauen</i> · <i className="kc-r"><KindIcon kind="rahmen" size={10} /> Rahmen</i>
          </motion.div>
        )}
      </AnimatePresence>
      <KeywordPopover ids={kwOpen?.ids ?? null} labels={kwOpen?.labels} onClose={() => setKwOpen(null)} />
    </div>
  );
}

/** B18: kleiner MMA-Hinweis im Karten-Detail (Einstufung als Chip, Satz als Tooltip/Screenreader-Text). */
const MMA_CHIP: Record<MmaFlag, { t: string; c: string }> = {
  ok: { t: "MMA ok", c: "var(--good, #3fb97a)" },
  riskant: { t: "MMA riskant", c: "var(--warn, #e0a33a)" },
  nein: { t: "MMA nein", c: "var(--bad, #e05a5a)" },
};
function MmaChip({ mma, note }: { mma: MmaFlag; note?: string }) {
  const m = MMA_CHIP[mma];
  return (
    <span className={`k2-mma k2-mma-${mma}`} title={note} aria-label={note ? `${m.t}: ${note}` : m.t}
      style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: 0.2,
        color: m.c, border: `1px solid ${m.c}`, whiteSpace: "nowrap", verticalAlign: "middle" }}>
      {m.t}
    </span>
  );
}
