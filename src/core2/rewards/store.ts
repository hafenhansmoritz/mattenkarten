// Mechanik 8 – Belohnungs-Speicher (localStorage "mk.k2.belohnung.v1", robust gegen kaputte Daten).
// Hört auf Lern-Ereignisse (events.ts), schreibt Pakete/Staub gut und sammelt Hinweise („Für deine Wiederholung“).
// Die Sammlung selbst bleibt in "mk.k2.sammlung.v1" – Pakete und Herstellen fügen dort nur Karten hinzu.
import { useSyncExternalStore } from "react";
import { collect, getCollection } from "../collection/store";
import { loadProgress, localDate } from "../../program/store";
import { onLearning, type LearningEvent } from "./events";
import {
  applyEvent, canCraft, emptyRewards, rollPack, sanitizeRewards,
  type CraftCheck, type Grant, type PackCard, type PoolCard, type RewardState, type Rng,
} from "./table";

export const REWARD_KEY = "mk.k2.belohnung.v1";

let state: RewardState | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

function readRaw(key: string): unknown {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; }
}

/**
 * B67 Übernahme: Wer vor Mechanik 8 schon gelernt hat, bekommt die Einmal-Belohnungen nachträglich
 * (geschaffte Programm-Tage, Prüfung, besiegte Bosse, Beinhebel-Abzeichen). Tägliche Quellen zählen erst ab jetzt.
 */
export function retroEvents(): LearningEvent[] {
  const out: LearningEvent[] = [];
  const p = loadProgress();
  for (const d of p.done) out.push({ type: "program_day", day: d });
  if (p.exam?.passed) out.push({ type: "exam_passed" });
  const bosses = readRaw("mk.k2.bosses");
  if (Array.isArray(bosses)) for (const b of bosses) if (typeof b === "string") out.push({ type: "boss_first_win", boss: b });
  const ll = readRaw("mk.leglock.v1") as { check?: { passed?: unknown } } | null;
  if (ll && ll.check?.passed === true) out.push({ type: "leglock_badge" });
  return out;
}

function load(): RewardState {
  let raw: string | null = null;
  try { raw = localStorage.getItem(REWARD_KEY); } catch { /* privat */ }
  if (raw) {
    try { return sanitizeRewards(JSON.parse(raw)); } catch { /* kaputt → neu aufbauen (Einmal-Belohnungen nachtragen) */ }
  }
  // Erster Start (oder kaputter Speicher): Einmal-Belohnungen aus bisherigem Fortschritt nachtragen.
  const today = localDate();
  let s = emptyRewards(today);
  let packs = 0, staub = 0;
  for (const e of retroEvents()) {
    const r = applyEvent(s, e, today);
    if (r.grant) { packs += r.grant.packs; staub += r.grant.staub; }
    s = r.state;
  }
  // Nachträge zählen nicht für Tagesgrenzen von heute; Log als ein Eintrag.
  s = { ...s, day: { date: today, counts: {} }, log: packs || staub ? [{ at: today, reason: "Für deinen bisherigen Lernfortschritt", packs, staub }] : [] };
  persist(s);
  if (packs || staub) queueToast({ packs, staub, reason: "Für deinen bisherigen Lernfortschritt" });
  return s;
}

function persist(s: RewardState) {
  try { localStorage.setItem(REWARD_KEY, JSON.stringify(s)); } catch { /* Speichern nicht möglich – Spiel läuft trotzdem */ }
}

export function getRewards(): RewardState { return (state ??= load()); }

function save(next: RewardState) { state = next; persist(next); emit(); }

/* ---------- Hinweise (nur im Speicher, nie gespeichert) ---------- */

export interface RewardToast extends Grant { id: number }
let toasts: RewardToast[] = [];
let toastId = 0;
const toastSubs = new Set<() => void>();
function queueToast(g: Grant) {
  toasts = [...toasts, { ...g, id: ++toastId }].slice(-3);
  toastSubs.forEach((f) => f());
}
export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  toastSubs.forEach((f) => f());
}
/** Alle Hinweise schließen (z. B. wenn „Pakete & Staub“ offen ist – dort steht es ja schon). */
export function dismissAllToasts() {
  if (!toasts.length) return;
  toasts = [];
  toastSubs.forEach((f) => f());
}
export function useRewardToasts(): RewardToast[] {
  return useSyncExternalStore((f) => { toastSubs.add(f); return () => { toastSubs.delete(f); }; }, () => toasts, () => toasts);
}

/* ---------- Aktionen ---------- */

/** Lern-Ereignis gutschreiben (Tagesgrenzen und Einmal-Schlüssel gelten). */
export function grantFor(e: LearningEvent, today = localDate()): Grant | null {
  const { state: next, grant } = applyEvent(getRewards(), e, today);
  if (!grant) return null;
  save(next);
  queueToast(grant);
  return grant;
}

export interface OpenResult { cards: PackCard[]; staub: number }

/** Ein Paket öffnen. Das Ergebnis wird sofort gespeichert – auch wer die Animation abbricht, verliert nichts. */
export function openPack(pool: PoolCard[], rng: Rng = Math.random): OpenResult | null {
  const s = getRewards();
  if (s.packs < 1 || !pool.length) return null;
  const cards = rollPack(pool, getCollection().ids, rng);
  const staub = cards.reduce((n, c) => n + c.staub, 0);
  collect(cards.filter((c) => c.isNew).map((c) => c.id));
  save({ ...s, packs: s.packs - 1, staub: s.staub + staub, opened: s.opened + 1 });
  return { cards, staub };
}

/** Fehlende Karte mit Mattenstaub herstellen. */
export function craftCard(card: PoolCard | undefined): CraftCheck {
  const s = getRewards();
  const chk = canCraft(card, getCollection().ids, s.staub);
  if (!chk.ok || !card) return chk;
  collect([card.id]);
  save({ ...s, staub: s.staub - chk.cost });
  return chk;
}

export function useRewards(): RewardState {
  return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, getRewards, getRewards);
}

/** Nur für Tests: Speicher neu einlesen, Hinweise leeren. */
export function _reloadRewards(): void { state = null; toasts = []; emit(); }

/* Zuhören, sobald dieses Modul geladen ist (App lädt es mit den Hinweisen sofort). */
let installed = false;
export function installRewardListener() {
  if (installed) return;
  installed = true;
  onLearning((e) => { grantFor(e); });
}
installRewardListener();
