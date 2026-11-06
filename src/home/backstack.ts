// Android-/Browser-Zurück innerhalb der App (UX-Review 2, Punkt 8).
// Jeder offene Unterbildschirm (Tab außer Start, Programm-Tag, Checkliste, Unterseiten) ist eine „Ebene“
// mit genau einem History-Eintrag (pushState, ohne URL-Änderung). Zurück schließt die oberste Ebene.
// Schließt die App eine Ebene selbst (Zurück-Knopf), wird ihr Eintrag still wieder entfernt.
import { useEffect, useRef } from "react";

interface Layer { id: number; onBack: () => void }

export interface HistoryLike {
  readonly state: unknown;
  pushState(data: unknown, unused: string): void;
  replaceState(data: unknown, unused: string): void;
  go(delta: number): void;
}

const MARK = "mkLayer";
const isOurs = (st: unknown) => !!st && typeof st === "object" && MARK in (st as object);

/** Reine Logik, mit austauschbarer History (Tests). */
export function createBackStack(h: HistoryLike, defer: (f: () => void) => void = (f) => queueMicrotask(f)) {
  const stack: Layer[] = [];
  let seq = 0;
  let stale = 0;      // Einträge, die noch entfernt werden müssen
  let ignore = 0;     // eigene go(-k) erzeugen ein popstate, das wir überspringen
  let scheduled = false;

  function flush() {
    scheduled = false;
    if (stale <= 0) return;
    const k = stale;
    stale = 0;
    ignore++;
    h.go(-k);
  }

  return {
    push(onBack: () => void): number {
      const id = ++seq;
      stack.push({ id, onBack });
      const data = { [MARK]: stack.length };
      // Wurde im selben Moment eine Ebene geschlossen, ihren Eintrag wiederverwenden (z. B. Sammlung → Pakete).
      if (stale > 0) { stale--; h.replaceState(data, ""); } else h.pushState(data, "");
      return id;
    },
    drop(id: number): void {
      const i = stack.findIndex((l) => l.id === id);
      if (i < 0) return; // schon per Zurück geschlossen
      stack.splice(i, 1);
      stale++;
      if (!scheduled) { scheduled = true; defer(flush); }
    },
    /** popstate-Handler. */
    pop(state: unknown): void {
      if (ignore > 0) { ignore--; return; }
      const top = stack.pop();
      if (top) { top.onBack(); return; }
      // Alte Einträge von vor einem Neuladen: überspringen, damit Zurück nicht „hängt“.
      if (isOurs(state)) h.go(-1);
    },
    get depth() { return stack.length; },
  };
}

type BackStack = ReturnType<typeof createBackStack>;
let shared: BackStack | null = null;
function stackOf(): BackStack | null {
  if (typeof window === "undefined" || typeof history === "undefined") return null;
  if (!shared) {
    shared = createBackStack(history);
    window.addEventListener("popstate", (e) => shared!.pop(e.state));
  }
  return shared;
}

/**
 * Solange `active` wahr ist, hat dieser Bildschirm einen History-Eintrag; Zurück ruft `onBack`
 * (das `active` auf falsch setzen oder `key` ändern soll). Ein neuer `key` (z. B. anderer Unterbildschirm)
 * ersetzt den Eintrag – so führt Zurück aus „Klassik“ erst zu den Einstellungen.
 */
export function useBackLayer(active: boolean, onBack: () => void, key?: string | number): void {
  const cb = useRef(onBack);
  cb.current = onBack;
  useEffect(() => {
    if (!active) return;
    const s = stackOf();
    if (!s) return;
    const id = s.push(() => cb.current());
    return () => s.drop(id);
  }, [active, key]);
}
