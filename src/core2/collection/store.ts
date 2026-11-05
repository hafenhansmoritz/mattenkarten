// Kern 2 – Sammlung (Schritt 71): Eine Karte ist gesammelt, sobald du sie spielst
// oder sie erfolgreich gespielt siehst (egal von wem). Lokal im Browser gespeichert.
import { useSyncExternalStore } from "react";
import type { Round2 } from "../types";

const COLLECTION_KEY = "mk.k2.sammlung.v1";

export interface CollectionData {
  /** Gesammelte Karten-IDs in Sammel-Reihenfolge. */
  ids: string[];
  /** Noch nicht in der Sammlung angesehen (für „neu“-Marke). */
  fresh: string[];
}

const empty = (): CollectionData => ({ ids: [], fresh: [] });

function load(): CollectionData {
  try {
    const raw = localStorage.getItem(COLLECTION_KEY);
    if (!raw) return empty();
    const d = JSON.parse(raw) as Partial<CollectionData>;
    const ids = Array.isArray(d.ids) ? d.ids.filter((x): x is string => typeof x === "string") : [];
    const fresh = Array.isArray(d.fresh) ? d.fresh.filter((x): x is string => typeof x === "string" && ids.includes(x)) : [];
    return { ids, fresh };
  } catch {
    return empty();
  }
}

let data: CollectionData | null = null;
const subs = new Set<() => void>();
const get = (): CollectionData => (data ??= load());

function save(next: CollectionData) {
  data = next;
  try { localStorage.setItem(COLLECTION_KEY, JSON.stringify(next)); } catch { /* Speichern nicht möglich – Spiel läuft trotzdem */ }
  subs.forEach((f) => f());
}

/** Karten, die eine Runde für den Spieler sammelbar macht: eigene Karte immer, gegnerische nur bei Erfolg. */
export function cardsToCollect(r: Pick<Round2, "pCard" | "oCard" | "winner">, pass = "pass"): string[] {
  const out: string[] = [];
  if (r.pCard && r.pCard !== pass) out.push(r.pCard);
  const oWon = r.winner === "o" || r.winner === "both";
  if (oWon && r.oCard && r.oCard !== pass && !out.includes(r.oCard)) out.push(r.oCard);
  return out;
}

/** Sammelt die Karten; gibt die neu gesammelten zurück. */
export function collect(ids: string[]): string[] {
  const cur = get();
  const add = ids.filter((id, i) => id && !cur.ids.includes(id) && ids.indexOf(id) === i);
  if (!add.length) return [];
  save({ ids: [...cur.ids, ...add], fresh: [...cur.fresh, ...add] });
  return add;
}

export function collectRound(r: Pick<Round2, "pCard" | "oCard" | "winner">): string[] {
  return collect(cardsToCollect(r));
}

/** „Neu“-Marken entfernen (nach dem Ansehen). */
export function markSeen(ids?: string[]): void {
  const cur = get();
  const fresh = ids ? cur.fresh.filter((x) => !ids.includes(x)) : [];
  if (fresh.length === cur.fresh.length) return;
  save({ ...cur, fresh });
}

export function getCollection(): CollectionData {
  return get();
}

/** Nur für Tests: Speicher neu einlesen. */
export function _reloadCollection(): void {
  data = null;
  subs.forEach((f) => f());
}

export function useCollection(): CollectionData {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => { subs.delete(f); }; },
    get,
    get,
  );
}
