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
import { canKonter, konterTargets } from "../engine/konter";
import { KonterIcon } from "./meta";

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
  /** Mechanik 4: Konter vorbereiten. sel = zum Legen markierter Rahmen; mine = dein schon liegender Konter (Karten-ID). */
  konter?: { sel: string | null; mine?: string | null; cost: number; check: (id: string) => { ok: boolean; reason?: string }; onToggle: (id: string | null) => void };
  /** Mechanik 6 „Spielplan“: ids = gezogene Angriffe deines Plans in dieser Lage (eigene Gruppe oben), alle anderen Karten sind
   *  Grundlagen; deck = Karten im Stapel; fresh = eben gezogen (Animation, „neu“). Ohne plan: normale Hand. */
  plan?: { ids: string[]; deck: number; fresh: string[] };
  /** Freischalt-Stufe (UX-Review 06.11.): Atem-Kosten zeigen (Standard ja). */
  showAtem?: boolean;
  /** Freischalt-Stufe: diese Schlüsselwörter (noch) nicht zeigen. */
  hideKeywords?: KeywordId[];
  /** Freischalt-Stufe: sichtbare Kartenarten (für die Legende). */
  kinds?: Card2["kind"][];
  /** Max. sichtbare Karten (Standard 8), Rest hinter "+N". */
  max?: number;
  className?: string;
}

/** Hand für Kern 2: Karten nach Zone gruppiert (vier Spalten), Farbe = Art. */
export function Hand2({ cards, legal, selected, onSelect, myBoard, locked = [], kraft, requireCard, highlightZone = null, hiddenZones = [], gripZones = [], chainReady = {}, konter, plan, showAtem = true, hideKeywords = [], kinds, max = 8, className }: Hand2Props) {
  // Versteckte Zonen: Spalte fällt ganz weg (nicht grau). Ausnahme: eine Karte daraus wird gezeigt (geforderte Karte / Notfall).
  const colZones = ZONES.filter((z) => !hiddenZones.includes(z) || cards.some((c) => c.zone === z));
  const kwOf = (c: Card2) => keywordsOf(c).filter((h) => !hideKeywords.includes(h.id));
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
  const kSel = konter?.sel ? cards.find((c) => c.id === konter.sel) ?? null : null;
  // Schlüsselwörter: Antippen im Detail oder langes Drücken auf der Karte öffnet das Glossar.
  const [kwOpen, setKwOpen] = useState<{ ids: KeywordId[]; labels: Partial<Record<KeywordId, string>> } | null>(null);
  const openKw = (c: Card2, only?: KeywordId) => {
    const hits = kwOf(c).filter((h) => !only || h.id === only);
    if (hits.length) setKwOpen({ ids: hits.map((h) => h.id), labels: Object.fromEntries(hits.map((h) => [h.id, h.label])) });
  };
  const lp = useRef<{ t?: ReturnType<typeof setTimeout>; fired: boolean }>({ fired: false });
  const lpStart = (c: Card2) => { lp.current.fired = false; clearTimeout(lp.current.t); lp.current.t = setTimeout(() => { lp.current.fired = true; openKw(c); }, 480); };
  const lpEnd = () => clearTimeout(lp.current.t);

  const planSet = new Set(plan?.ids ?? []);
  const freshSet = new Set(plan?.fresh ?? []);
  const renderCard = (c: Card2, i: number) => {
    const l = lmap.get(c.id);
    const ok = l?.ok ?? true;
    const isLocked = locked.includes(c.id) || (!ok && /gesperrt/i.test(l?.reason ?? ""));
    const blockedByTut = !!requireCard && c.id !== requireCard;
    const disabled = !ok || blockedByTut;
    const isSel = selected === c.id;
    const isKonter = konter?.sel === c.id;
    const isLying = konter?.mine === c.id;
    const tooExpensive = showAtem && c.kraft != null && kraft != null && c.kraft > kraft;
    const chainFrom = chainReady[c.id];
    // Bedingungen in ausgeblendeten Zonen nicht zeigen (dort ändert sich in der Lektion nichts).
    const reqs = reqList(c, gripZones, !!chainFrom, planSet.has(c.id)).filter((r) => !hiddenZones.includes(r.zone));
    const cost = showAtem ? c.kraft : undefined;
    const isFresh = freshSet.has(c.id);
    const rar = rarityOf(c);
    const kws = kwOf(c);
    return (
      <Pulse key={c.id} active={requireCard === c.id && !isSel} radius="8px" className="k2-hcard-pulse">
        <motion.button type="button"
          className={`k2-hcard kind-${c.kind} rar-${rar}${isSel ? " is-sel" : ""}${disabled && !isKonter ? " is-off" : ""}${isLocked ? " is-locked" : ""}${chainFrom && ok ? " is-chain" : ""}${planSet.has(c.id) ? " is-plan" : ""}${isFresh ? " is-fresh" : ""}${isKonter || isLying ? " is-konter" : ""}`}
          disabled={disabled && !isKonter}
          data-card={c.id}
          aria-pressed={isSel}
          aria-label={`${KIND_LABEL[c.kind]}: ${c.plain}${kws.filter((k) => HAND_EXTRA.includes(k.id)).map((k) => ` ${k.label}`).join("")}${chainFrom && ok ? ", Kette bereit" : ""}${isFresh ? ", neu gezogen" : ""}${isKonter ? ", Konter" : isLying ? ", liegt verdeckt" : ""}${reqs.map((r) => `, ${ZONE_SHORT[r.zone]} ${fmtSigned(r.n)}`).join("")}${cost ? `, ${cost} Atem nötig` : ""}. ${RARITY_LABEL[rar]}, Zone ${ZONE_LABEL[c.zone]}${reqs.some((r) => r.grip) ? ". Dein Griff senkt die Bedingung um 1" : ""}${reqs.some((r) => r.sharp) ? ". Geübt: dein Spielplan senkt die Bedingung um 1" : ""}${chainFrom && ok ? `. Kette nach ${chainFrom} senkt die Bedingung um 1` : ""}${isKonter ? ". Als Konter vorbereitet, verdeckt" : ""}${planSet.has(c.id) ? ". Aus deinem Spielplan" : ""}${!ok && l?.reason ? `. ${l.reason}` : blockedByTut ? ". Erst die markierte Karte" : ""}`}
          title={!ok ? l?.reason : blockedByTut ? "Erst die markierte Karte" : c.plainDo}
          initial={reduced ? { opacity: 0 } : isFresh ? { opacity: 0, y: -46, x: 40, rotate: 8, scale: 0.7 } : { opacity: 0, y: 14, scale: 0.9 }}
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
          {isFresh && <span className="k2-fresh-badge">neu gezogen </span>}
          {planSet.has(c.id) && <span className="k2-hcard-zone" aria-hidden title={ZONE_LABEL[c.zone]}><ZoneIcon zone={c.zone} size={10} /></span>}
          {(isKonter || isLying) && <span className="k2-konter-badge"><KonterIcon size={9} />{isKonter ? "Konter" : "liegt verdeckt"} </span>}
          {(reqs.length > 0 || cost) && (
            <span className="k2-hcard-reqs">
              {reqs.map((r) => {
                const met = myBoard ? myBoard[r.zone] >= r.n : null;
                return <span key={r.zone} className={`k2-req${met === true ? " met" : met === false ? " miss" : ""}${r.grip ? " by-grip" : ""}${r.chain ? " by-chain" : ""}${r.sharp ? " by-plan" : ""}`}
                  title={r.chain ? "Deine Kette senkt die Bedingung um 1" : r.grip ? "Dein Griff senkt die Bedingung um 1" : r.sharp ? "Geübt: dein Spielplan senkt die Bedingung um 1" : undefined}>{ZONE_SHORT[r.zone]} {fmtSigned(r.n)} </span>;
              })}
              {cost ? <span className={`k2-req kraft${tooExpensive ? " miss" : ""}`}><KraftIcon size={9} />{cost}</span> : null}
            </span>
          )}
          {isLocked && <span className="k2-lock" aria-hidden><LockIcon size={11} /></span>}

        </motion.button>
      </Pulse>
    );
};

  return (
    <div lang="de" className={["k2-hand", className].filter(Boolean).join(" ")}>
      {plan && (
        <div className="k2-plan-group" role="group" aria-label={`Dein Spielplan: gezogene Angriffe für diese Lage. ${plan.deck} Karten im Stapel.`}>
          <div className="k2-plan-head">
            <b>Dein Spielplan</b>
            <span className="k2-plan-deck" aria-hidden><span className="k2-plan-deck-stack" />Stapel {plan.deck}</span>
          </div>
          {plan.ids.length ? (
            <div className="k2-plan-row">{cards.filter((c) => planSet.has(c.id)).map(renderCard)}</div>
          ) : <p className="k2-plan-none">Kein gezogener Angriff passt hier – spiel eine Grundlage.</p>}
          <div className="k2-plan-head is-basics"><b>Grundlagen</b><span>kann jeder, immer</span></div>
        </div>
      )}
      <div className="k2-hand-cols" style={colZones.length !== 4 ? { gridTemplateColumns: `repeat(${colZones.length}, minmax(0, 1fr))` } : undefined}>
        {colZones.map((z) => {
          const col = cards.filter((c) => c.zone === z && visibleSet.has(c.id) && !planSet.has(c.id));
          const later = hiddenZones.includes(z) && col.length === 0;
          return (
            <div key={z} className={`k2-hcol${highlightZone === z ? " is-hl" : ""}${later ? " is-later" : ""}`}>
              <div className="k2-hcol-head" title={ZONE_LABEL[z]}><ZoneIcon zone={z} size={13} /><span>{ZONE_LABEL[z]}</span></div>
              {later && <div className="k2-hcol-empty k2-hcol-later">später</div>}
              {col.length === 0 && !later && <div className="k2-hcol-empty" aria-hidden>–</div>}
              {col.map(renderCard)}
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
            <KeywordChips card={sel} hide={hideKeywords} onOpen={(id) => openKw(sel, id)} />
            {konter && canKonter(sel) && <KonterOffer card={sel} konter={konter} />}
          </motion.div>
        ) : kSel ? (
          <motion.div key={`k-${kSel.id}`} className="k2-hand-info kind-rahmen is-konter-info" role="status"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }}>
            <b><KonterIcon size={12} /> Konter vorbereitet: {kSel.plain}</b>
            <p>Er liegt verdeckt an {ZONE_LABEL[kSel.zone]}. Wähle jetzt die Karte, die du offen spielst.</p>
            <button type="button" className="k2-konter-btn ghost" onClick={() => konter?.onToggle(null)}>Konter zurücknehmen</button>
          </motion.div>
        ) : (
          <motion.div key="none" className="k2-hand-info is-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            Wähle eine Karte. <i className="kc-a"><KindIcon kind="angriff" size={10} /> Angreifen</i> · <i className="kc-b"><KindIcon kind="aufbauen" size={10} /> Aufbauen</i>{(!kinds || kinds.includes("rahmen")) && <> · <i className="kc-r"><KindIcon kind="rahmen" size={10} /> Rahmen</i></>}
          </motion.div>
        )}
      </AnimatePresence>
      <KeywordPopover ids={kwOpen?.ids ?? null} labels={kwOpen?.labels} onClose={() => setKwOpen(null)} />
    </div>
  );
}

/** Mechanik 4: Angebot im Karten-Detail – diesen Rahmen zusätzlich verdeckt als Konter legen. */
function KonterOffer({ card, konter }: { card: Card2; konter: NonNullable<Hand2Props["konter"]> }) {
  const chk = konter.check(card.id);
  const on = konter.sel === card.id;
  const targets = konterTargets(card).map((a) => a.term);
  if (!chk.ok && !on && /aus$/.test(chk.reason ?? "")) return null;
  return (
    <div className="k2-konter-offer">
      <p className="k2-konter-why"><b>Konter:</b> lauert auf {targets.slice(0, 3).join(", ")}{targets.length > 3 ? " …" : ""}. Verdeckt, zusätzlich zu deiner Karte.</p>
      {on ? (
        <button type="button" className="k2-konter-btn ghost" onClick={() => konter.onToggle(null)}>Konter zurücknehmen</button>
      ) : (
        <button type="button" className="k2-konter-btn" disabled={!chk.ok} onClick={() => konter.onToggle(card.id)}>
          <KonterIcon size={12} /> {chk.ok ? `Als Konter vorbereiten · ${konter.cost} Atem` : chk.reason}
        </button>
      )}
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
