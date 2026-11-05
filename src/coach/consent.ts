// Einwilligung für den KI-Coach (Fragen gehen über /api/coach an Anthropic).
// Wird lokal gespeichert; ohne Einwilligung sendet die App nichts an den Coach.
import { useCallback, useEffect, useState } from "react";

export const COACH_CONSENT_KEY = "mk.coach.consent.v1";
/** Version des Hinweistexts – bei inhaltlicher Änderung erhöhen, dann wird neu gefragt. */
export const COACH_CONSENT_VERSION = 1;

export function hasCoachConsent(): boolean {
  try {
    const raw = localStorage.getItem(COACH_CONSENT_KEY);
    if (!raw) return false;
    const v = JSON.parse(raw) as { v?: number };
    return v?.v === COACH_CONSENT_VERSION;
  } catch {
    return false;
  }
}

const listeners = new Set<() => void>();

export function setCoachConsent(on: boolean): void {
  sessionConsent = on;
  try {
    if (on) localStorage.setItem(COACH_CONSENT_KEY, JSON.stringify({ v: COACH_CONSENT_VERSION, at: new Date().toISOString() }));
    else localStorage.removeItem(COACH_CONSENT_KEY);
  } catch {
    /* privat/voll – dann gilt die Zustimmung nur für diese Sitzung */
  }
  listeners.forEach((l) => l());
}

let sessionConsent = false;

export function useCoachConsent(): [boolean, (on: boolean) => void] {
  const [ok, setOk] = useState(() => hasCoachConsent() || sessionConsent);
  useEffect(() => {
    const l = () => setOk(hasCoachConsent() || sessionConsent);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  const set = useCallback((on: boolean) => setCoachConsent(on), []);
  return [ok, set];
}
