// Kern 2 – Schlüsselwörter in der UI: fette Chips, Glossar-Popover, Hinweis beim ersten Auftauchen.
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Card2 } from "../types";
import { KEYWORD, keywordsOf, type KeywordHit, type KeywordId } from "../data/keywords";
import "../../styles/keywords.css";

/** Nicht-interaktive Chips (z. B. in der kleinen Handkarte, die selbst ein Button ist). */
export function KeywordTags({ hits, className }: { hits: KeywordHit[]; className?: string }) {
  if (!hits.length) return null;
  return (
    <span className={["kw-tags", className].filter(Boolean).join(" ")} aria-hidden="true">
      {hits.map((h, i) => <b key={h.id} className={`kw-tag kw-${h.id}`}>{h.label}{i < hits.length - 1 ? " " : ""}</b>)}
    </span>
  );
}

/** Antippbare Chips: öffnen das Glossar-Popover für genau dieses Wort. */
export function KeywordChips({ card, onOpen, className }: { card: Card2; onOpen: (id: KeywordId) => void; className?: string }) {
  const hits = keywordsOf(card);
  if (!hits.length) return null;
  return (
    <span className={["kw-chips", className].filter(Boolean).join(" ")}>
      {hits.map((h) => (
        <button key={h.id} type="button" className={`kw-chip kw-${h.id}`} aria-haspopup="dialog"
          aria-label={`Schlüsselwort ${h.label} erklären`}
          onClick={(e) => { e.stopPropagation(); onOpen(h.id); }}>
          {h.label}
        </button>
      ))}
    </span>
  );
}

/** Eine Erklärung: Regel + „Im echten Grappling:“ + Quelle oder Trainer-Prüfung. */
export function KeywordExplain({ id, label }: { id: KeywordId; label?: string }) {
  const k = KEYWORD[id];
  return (
    <div className={`kw-explain kw-${id}`}>
      <b className="kw-explain-h"><span className={`kw-chip kw-${id} is-static`}>{label ?? k.name}</span></b>
      <p className="kw-rule">{k.rule}</p>
      <p className="kw-bjj"><b>Im echten Grappling:</b> {k.bjj}</p>
      {k.source && <a className="kw-src" href={k.source.url} target="_blank" rel="noopener noreferrer">Quelle: {k.source.title} ↗</a>}
      {k.check && <p className="kw-check">Trainer prüfen: noch ohne Primärquelle.</p>}
    </div>
  );
}

/** Glossar-Popover (Blatt von unten): ein oder mehrere Schlüsselwörter. Escape/Antippen außerhalb schließt. */
export function KeywordPopover({ ids, labels, onClose, onGlossar }: {
  ids: KeywordId[] | null; labels?: Partial<Record<KeywordId, string>>; onClose: () => void; onGlossar?: () => void;
}) {
  const reduced = !!useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeFn = useRef(onClose);
  closeFn.current = onClose;
  const open = !!ids && ids.length > 0;
  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); closeFn.current(); } };
    window.addEventListener("keydown", onKey, true);
    return () => { window.removeEventListener("keydown", onKey, true); back?.focus?.(); };
  }, [open]);
  if (typeof document === "undefined") return null;
  // Portal: fixe Ebene auch dann über dem ganzen Bildschirm, wenn ein Vorfahr transformiert ist (Sammlung).
  return createPortal(
    <AnimatePresence>
      {ids && ids.length > 0 && (
        <motion.div className="kw-pop-layer" key="kw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, pointerEvents: "none" }}
          onClick={(e) => { e.stopPropagation(); onClose(); }}>
          <motion.div className="kw-pop" role="dialog" aria-modal="true" aria-label={`Glossar: ${ids.map((i) => KEYWORD[i].name).join(", ")}`}
            onClick={(e) => e.stopPropagation()}
            initial={reduced ? { opacity: 0 } : { y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduced ? { opacity: 0 } : { y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}>
            <span className="kw-pop-h">Schlüsselwort</span>
            {ids.map((id) => <KeywordExplain key={id} id={id} label={labels?.[id]} />)}
            <div className="kw-pop-btns">
              {onGlossar && <button type="button" className="btn small ghost" onClick={onGlossar}>Ganzes Glossar</button>}
              <button ref={closeRef} type="button" className="btn small" onClick={onClose}>Verstanden</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Eine Zeile beim ersten Auftauchen eines Schlüsselworts im Kampf. */
export function KeywordToast({ id, onOpen, onDone }: { id: KeywordId | null; onOpen: (id: KeywordId) => void; onDone: () => void }) {
  const doneFn = useRef(onDone);
  doneFn.current = onDone;
  useEffect(() => {
    if (!id) return;
    const t = setTimeout(() => doneFn.current(), 6500);
    return () => clearTimeout(t);
  }, [id]);
  return (
    <AnimatePresence>
      {id && (
        <motion.div key={id} className="kw-toast" role="status" aria-live="polite"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
          <span className="kw-toast-new">Neu</span>
          <span className="kw-toast-t"><b>{KEYWORD[id].name}</b>{KEYWORD[id].hint.slice(KEYWORD[id].name.length)}</span>
          <button type="button" className="kw-toast-more" onClick={() => onOpen(id)}>Mehr</button>
          <button type="button" className="kw-toast-x" aria-label="Hinweis schließen" onClick={onDone}>×</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
