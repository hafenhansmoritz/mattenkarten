// Fortschritt des Spielers (lokal im Browser gespeichert).
import { create } from "zustand";
import { ARCHETYPES, STARTER_COLLECTION, STARTER_DECK } from "./data/campaign";
import { CARD } from "./data/cards";

const KEY = "mattenkarten-save-v2";

export interface Progress {
  collection: string[];      // freigeschaltete Kartenids (eindeutig)
  deck: string[];            // 20 Kartenids
  beaten: string[];          // besiegte Archetypen
  xp: number;
  wins: number;
  losses: number;
  taps: number;              // rechtzeitig abgeklopft
  releases: number;          // sauber losgelassen
  mastery: Record<string, number>; // richtige Antworten pro Karte (kosmetisch)
  sound: boolean;
  introSeen: boolean;
}

const fresh = (): Progress => ({
  collection: [...STARTER_COLLECTION], deck: [...STARTER_DECK], beaten: [], xp: 0, wins: 0, losses: 0,
  taps: 0, releases: 0, mastery: {}, sound: true, introSeen: false,
});

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const p = { ...fresh(), ...JSON.parse(raw) } as Progress;
    // Unbekannte Karten (nach Datenänderungen) aussortieren
    p.collection = p.collection.filter((id) => CARD[id]);
    p.deck = p.deck.filter((id) => CARD[id]);
    if (p.deck.length !== 20) p.deck = [...STARTER_DECK];
    return p;
  } catch {
    return fresh();
  }
}

interface Store extends Progress {
  set: (patch: Partial<Progress>) => void;
  winAgainst: (archId: string) => string[]; // gibt neu freigeschaltete Karten zurück
  addXP: (n: number) => void;
  reset: () => void;
}

export const useGame = create<Store>((set, get) => ({
  ...load(),
  set: (patch) => set(patch),
  addXP: (n) => set({ xp: get().xp + n }),
  winAgainst: (archId) => {
    const arch = ARCHETYPES.find((a) => a.id === archId);
    const s = get();
    const first = !s.beaten.includes(archId);
    const fresh = first && arch ? arch.reward.filter((id) => CARD[id] && !s.collection.includes(id)) : [];
    set({
      beaten: first ? [...s.beaten, archId] : s.beaten,
      collection: [...s.collection, ...fresh],
    });
    return fresh;
  },
  reset: () => set(fresh()),
}));

useGame.subscribe((s) => {
  const { set: _s, winAgainst: _w, addXP: _a, reset: _r, ...data } = s;
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* Speichern nicht möglich – Spiel läuft trotzdem */ }
});

/** Ein Gegner ist offen, wenn alle vorherigen besiegt sind. */
export function isUnlocked(archId: string, beaten: string[]): boolean {
  const i = ARCHETYPES.findIndex((a) => a.id === archId);
  return ARCHETYPES.slice(0, i).every((a) => beaten.includes(a.id));
}

export function currentBeltIndex(beaten: string[]): number {
  const order = ["weiss", "blau", "lila", "braun", "schwarz"];
  let idx = 0;
  for (let i = 0; i < order.length; i++) {
    const boss = ARCHETYPES.find((a) => a.belt === order[i] && a.boss);
    if (boss && beaten.includes(boss.id)) idx = Math.min(i + 1, order.length - 1);
  }
  return idx;
}
