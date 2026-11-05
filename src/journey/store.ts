// Reise nach der Startwoche – Speicher (localStorage "mk.journey.v1", alles mit try/catch).
import { useEffect, useState } from "react";
import type { Pos2 } from "../core2/types";
import { onQuizAnswer } from "./events";
import { POSITIONS, ROLES, type StuckRole } from "./recommend";
import {
  applyAnswer, boost, isDate, learn, localDate, sanitizeReview, type ReviewState,
} from "./schedule";

export const JOURNEY_KEY = "mk.journey.v1";

export interface TrainingEntry {
  id: string;
  /** Lokales Datum (YYYY-MM-DD). */
  at: string;
  trained: Pos2[];
  stuck: { pos: Pos2; role: StuckRole } | null;
  /** Gefühl 1 (zäh) … 5 (super). */
  feel: number;
  note?: string;
  /** Frage für die nächste Stunde. */
  ask?: { text: string; asked: boolean };
}

export interface JourneyState extends ReviewState {
  v: 1;
  log: TrainingEntry[];
}

export const EMPTY_JOURNEY: JourneyState = { v: 1, items: {}, errors: {}, graduated: 0, log: [] };
const fresh = (): JourneyState => ({ v: 1, items: {}, errors: {}, graduated: 0, log: [] });

const isPos = (x: unknown): x is Pos2 => typeof x === "string" && (POSITIONS as string[]).includes(x);
const isRole = (x: unknown): x is StuckRole => typeof x === "string" && (ROLES as string[]).includes(x);

function sanitizeEntry(raw: unknown): TrainingEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || !isDate(r.at)) return null;
  const trained = Array.isArray(r.trained) ? r.trained.filter(isPos) : [];
  const s = r.stuck as Record<string, unknown> | null | undefined;
  const stuck = s && isPos(s.pos) && isRole(s.role) ? { pos: s.pos, role: s.role } : null;
  const feel = Number.isInteger(r.feel) ? Math.max(1, Math.min(5, r.feel as number)) : 3;
  const note = typeof r.note === "string" && r.note.trim() ? r.note.slice(0, 140) : undefined;
  const a = r.ask as Record<string, unknown> | undefined;
  const ask = a && typeof a.text === "string" ? { text: a.text.slice(0, 200), asked: a.asked === true } : undefined;
  return { id: r.id, at: r.at, trained, stuck, feel, note, ask };
}

export function sanitizeJourney(v: unknown): JourneyState {
  const review = sanitizeReview(v);
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const log = Array.isArray(o.log) ? o.log.map(sanitizeEntry).filter((e): e is TrainingEntry => !!e).slice(-200) : [];
  return { v: 1, ...review, log };
}

export function loadJourney(): JourneyState {
  try {
    const raw = localStorage.getItem(JOURNEY_KEY);
    if (!raw) return fresh();
    return sanitizeJourney(JSON.parse(raw));
  } catch {
    return fresh();
  }
}

export function saveJourney(s: JourneyState) {
  try { localStorage.setItem(JOURNEY_KEY, JSON.stringify(s)); } catch { /* privat oder voll – dann eben nur im Speicher */ }
}

/* ---------- Gemeinsamer Zustand für alle Komponenten ---------- */

let state: JourneyState | null = null;
const subs = new Set<() => void>();

export function getJourney(): JourneyState {
  if (!state) state = loadJourney();
  return state;
}

export function updateJourney(fn: (s: JourneyState) => JourneyState, silent = false) {
  const next = fn(getJourney());
  state = next;
  saveJourney(next);
  if (!silent) subs.forEach((f) => f());
}

/** Nur für Tests: Zwischenspeicher leeren. */
export function resetJourneyCache() { state = null; }

export function useJourney(): JourneyState {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((n) => n + 1);
    subs.add(f);
    return () => { subs.delete(f); };
  }, []);
  return getJourney();
}

/* ---------- Aktionen ---------- */

export function recordAnswer(id: string, ok: boolean, session: string, today = localDate()) {
  updateJourney((s) => ({ ...s, ...applyAnswer(s, { id, ok, session }, today) }));
}

/** Fragen aus abgeschlossenen Programm-Tagen nachtragen (für alle, die vor diesem Modul gelernt haben). */
export function syncLearned(pairs: { id: string; day: string }[], today = localDate(), silent = false) {
  const s = getJourney();
  if (pairs.every((p) => s.items[p.id])) return;
  updateJourney((st) => {
    let r: ReviewState = st;
    for (const p of pairs) r = learn(r, p.id, p.day > today ? today : p.day);
    return { ...st, ...r };
  }, silent);
}

export function addTraining(e: Omit<TrainingEntry, "id">, reviewIds: string[], today = localDate()): TrainingEntry {
  const entry: TrainingEntry = { ...e, id: `t${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}` };
  updateJourney((s) => ({ ...s, ...boost(s, reviewIds, today), log: [...s.log, entry].slice(-200) }));
  return entry;
}

export function patchTraining(id: string, patch: Partial<TrainingEntry>) {
  updateJourney((s) => ({ ...s, log: s.log.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
}

/* Quiz-Antworten von überall (Programm, Prüfung, Wiederholung) einsammeln. */
let installed = false;
export function installJourneyListener() {
  if (installed) return;
  installed = true;
  onQuizAnswer((e) => recordAnswer(e.id, e.ok, e.session));
}
installJourneyListener();
