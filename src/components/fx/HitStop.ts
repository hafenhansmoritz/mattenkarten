import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hitstop: friert CSS-Animationen kurz ein (Standard 80 ms, Submission ~160 ms).
 * Hänge `className={frozen ? "fx-frozen" : ""}` an die Bühne – fx.css setzt dort
 * `animation-play-state: paused` für alle Nachfahren.
 *
 *   const [frozen, hitStop] = useHitStop();
 *   hitStop();          // 80 ms
 *   hitStop(160);       // Submission
 */
export function useHitStop(): [boolean, (ms?: number) => void] {
  const [frozen, setFrozen] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>();
  const trigger = useCallback((ms = 80) => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    clearTimeout(t.current);
    setFrozen(true);
    t.current = setTimeout(() => setFrozen(false), ms);
  }, []);
  useEffect(() => () => clearTimeout(t.current), []);
  return [frozen, trigger];
}
