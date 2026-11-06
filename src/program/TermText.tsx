// Antippbare Fachbegriffe (UX-Review 2026-11-06): Begriff antippen → kleines Glossar-Blatt von unten.
// Gleiche Optik wie das Schlüsselwort-Popover (styles/keywords.css: kw-pop-layer/kw-pop).
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GLOSSARY_BY_ID, splitTerms } from "./glossary";
import "../styles/keywords.css";

const OpenCtx = createContext<((id: string) => void) | null>(null);

/** Stellt das Popover bereit; alle <TermText> darunter öffnen es. */
export function TermProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string | null>(null);
  return (
    <OpenCtx.Provider value={setId}>
      {children}
      <TermPopover id={id} onClose={() => setId(null)} />
    </OpenCtx.Provider>
  );
}

/** Text mit antippbaren Fachbegriffen (jeder Begriff einmal pro Textblock). Ohne Provider: eigenes Popover. */
export function TermText({ text }: { text: string }) {
  const ctx = useContext(OpenCtx);
  const [own, setOwn] = useState<string | null>(null);
  const open = ctx ?? setOwn;
  const parts = splitTerms(text);
  return (
    <>
      {parts.map((p, i) => typeof p === "string" ? p : (
        <button key={i} type="button" className="term-link" aria-haspopup="dialog"
          aria-label={`${p.text} – Begriff erklären`}
          onClick={(e) => { e.stopPropagation(); open(p.id); }}>{p.text}</button>
      ))}
      {!ctx && <TermPopover id={own} onClose={() => setOwn(null)} />}
    </>
  );
}

function TermPopover({ id, onClose }: { id: string | null; onClose: () => void }) {
  const reduced = !!useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeFn = useRef(onClose);
  closeFn.current = onClose;
  const t = id ? GLOSSARY_BY_ID[id] : null;
  useEffect(() => {
    if (!t) return;
    const back = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); closeFn.current(); } };
    window.addEventListener("keydown", onKey, true);
    return () => { window.removeEventListener("keydown", onKey, true); back?.focus?.(); };
  }, [t]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {t && (
        <motion.div className="kw-pop-layer" key="term" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, pointerEvents: "none" }}
          onClick={(e) => { e.stopPropagation(); onClose(); }}>
          <motion.div className="kw-pop" role="dialog" aria-modal="true" aria-label={`Begriff: ${t.de}`}
            onClick={(e) => e.stopPropagation()}
            initial={reduced ? { opacity: 0 } : { y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduced ? { opacity: 0 } : { y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}>
            <span className="kw-pop-h">Begriff</span>
            <div className="kw-explain term-explain">
              <b className="kw-explain-h">{t.de}{t.en && t.en !== t.de ? <span className="term-en" lang="en"> ({t.en})</span> : null}</b>
              <p className="kw-rule">{t.explain}</p>
            </div>
            <div className="kw-pop-btns">
              <button ref={closeRef} type="button" className="btn small" onClick={onClose}>Verstanden</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
