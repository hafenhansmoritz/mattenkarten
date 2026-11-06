// Mechanik 8 – Hinweis nach Lektion, Wiederholung, Training …: „Für deine Wiederholung · +1 Mattenpaket“.
// Höflich angesagt (aria-live), schließt von selbst nach einigen Sekunden – die Pakete bleiben ja liegen.
import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { dismissToast, getRewards, useRewardToasts, type RewardToast } from "./store";
import "../../styles/rewards.css";

export const grantText = (t: { packs: number; staub: number }): string =>
  [t.packs ? `+${t.packs} Mattenpaket${t.packs === 1 ? "" : "e"}` : "", t.staub ? `+${t.staub} Mattenstaub` : ""].filter(Boolean).join(" · ");

export function RewardToasts({ onOpen }: { onOpen?: () => void }) {
  const list = useRewardToasts();
  // Beim Start laden: Wer vorher schon gelernt hat, sieht die Nachzahlung als Hinweis.
  useEffect(() => { getRewards(); }, []);
  const reduced = !!useReducedMotion();
  return (
    <div className="rw-toasts" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {list.map((t) => (
          <motion.div key={t.id} layout={!reduced} className="rw-toast"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}>
            <Toast t={t} onOpen={onOpen} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function Toast({ t, onOpen }: { t: RewardToast; onOpen?: () => void }) {
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (hold) return;
    const id = window.setTimeout(() => dismissToast(t.id), 7000);
    return () => window.clearTimeout(id);
  }, [t.id, hold]);
  return (
    <div className="rw-toast-in" onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)}
      onFocus={() => setHold(true)} onBlur={() => setHold(false)}>
      <span className="rw-toast-pack" aria-hidden="true"><PackMini /></span>
      <span className="rw-toast-txt">
        <b>{t.reason}</b>
        <span>{grantText(t)}</span>
      </span>
      {onOpen && t.packs > 0 && <button type="button" className="btn small rw-toast-go" onClick={() => { dismissToast(t.id); onOpen(); }}>Ansehen</button>}
      <button type="button" className="rw-toast-x" aria-label="Hinweis schließen" onClick={() => dismissToast(t.id)}>×</button>
    </div>
  );
}

/** Kleines Paket-Symbol (Folie mit Edelstein). */
export function PackMini({ size = 30 }: { size?: number }) {
  const gid = `rwpm${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 30 40" width={size * 0.75} height={size} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd166" /><stop offset=".55" stopColor="#f0573f" /><stop offset="1" stopColor="#7a3cff" />
        </linearGradient>
      </defs>
      <path d="M3 4 6 1l3 3 3-3 3 3 3-3 3 3 3-3 3 3v32l-3 3-3-3-3 3-3-3-3 3-3-3-3 3-3-3z" fill={`url(#${gid})`} />
      <path d="M15 13 21 20l-6 7-6-7z" fill="#fff" opacity=".85" />
    </svg>
  );
}
