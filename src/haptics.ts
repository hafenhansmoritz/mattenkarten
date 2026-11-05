// Haptisches Feedback über navigator.vibrate (Android/Chrome; iOS-Safari ignoriert still).
// Folgt der Sound-Einstellung aus dem Store (sound=false → auch keine Vibration).
import { useGame } from "./store";

type Pattern = number | number[];

let last = 0;

function canVibrate(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

function enabled(): boolean {
  try {
    return useGame.getState().sound !== false;
  } catch {
    return true;
  }
}

function reducedMotion(): boolean {
  try {
    return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function vibrate(p: Pattern, minGapMs = 30): void {
  if (!canVibrate() || !enabled()) return;
  const now = Date.now();
  if (now - last < minGapMs) return; // Spam bei schnellen Taps vermeiden
  last = now;
  // Bei "weniger Bewegung" nur dezente Einzelimpulse.
  const pat = reducedMotion() ? (Array.isArray(p) ? p[0] : p) : p;
  try {
    navigator.vibrate(pat);
  } catch {
    /* manche Browser werfen ohne User-Geste */
  }
}

export const haptic = {
  /** Leichter Tipp – Buttons, Karten antippen. */
  tap: () => vibrate(8),
  /** Auswahl / Umschalten. */
  select: () => vibrate(14),
  /** Treffer, Takedown – kräftig mit Nachschwingen. */
  hit: () => vibrate([28, 30, 14], 60),
  /** Sieg – rhythmisches Feiern. */
  win: () => vibrate([20, 50, 20, 50, 60], 100),
  /** Fehler / falsche Antwort – doppelter Brummer. */
  error: () => vibrate([40, 60, 40], 80),
  /** Alle laufenden Vibrationen stoppen. */
  stop: () => {
    if (canVibrate()) try { navigator.vibrate(0); } catch { /* ignore */ }
  },
};

export const hapticsSupported = canVibrate;
