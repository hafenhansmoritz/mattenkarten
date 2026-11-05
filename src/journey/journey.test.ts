import { beforeEach, describe, expect, it } from "vitest";
import { ALL_QUESTIONS, Q_BY_ID } from "../program/questions";
import { DAYS } from "../program/days";
import { TUTORIALS_K2 } from "../core2/data/tutorials";
import { LESSONS_PROGRAM } from "../program/lessons";
import {
  COACH_QUESTIONS, POSITIONS, RECOMMEND, ROLES, resolveLesson, suggestQuestion, wordCount,
} from "./recommend";
import { pickRelated } from "./related";
import {
  EMPTY_REVIEW, ERROR_GRADUATE, INTERVALS, SESSION_MAX, SESSION_MIN, addDays, applyAnswer, boost, buildSession,
  daysBetween, dueIds, errorIds, interleave, learn, nextDue, sanitizeReview, todayCount, type ReviewState,
} from "./schedule";
import {
  JOURNEY_KEY, addTraining, getJourney, loadJourney, recordAnswer, resetJourneyCache, sanitizeJourney, saveJourney,
} from "./store";
import { emitQuizAnswer } from "./events";

const D0 = "2026-11-01";
const empty = (): ReviewState => ({ ...EMPTY_REVIEW, items: {}, errors: {} });

/* ---------- Speicher-Attrappe ---------- */
class MemStore {
  m = new Map<string, string>();
  throwing = false;
  getItem(k: string) { if (this.throwing) throw new Error("blocked"); return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { if (this.throwing) throw new Error("quota"); this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}
const mem = new MemStore();
(globalThis as unknown as { localStorage: MemStore }).localStorage = mem;

describe("Wiederholung mit wachsendem Abstand", () => {
  it("Termine liegen 1, 2, 4, 7, 14, 30 Tage nach dem ersten Lernen", () => {
    expect([...INTERVALS]).toEqual([1, 2, 4, 7, 14, 30]);
    let s = learn(empty(), "q1", D0);
    const seen: number[] = [];
    for (let k = 0; k < INTERVALS.length; k++) {
      const due = s.items.q1.due!;
      seen.push(daysBetween(D0, due));
      s = applyAnswer(s, { id: "q1", ok: true, session: `s${k}` }, due); // pünktlich wiederholt
    }
    expect(seen).toEqual([1, 2, 4, 7, 14, 30]);
    expect(s.items.q1.due).toBeNull();
    expect(s.items.q1.stage).toBe(INTERVALS.length);
  });

  it("nicht fällig → kein Fortschritt; zu spät → nächster Termin nie in der Vergangenheit", () => {
    let s = learn(empty(), "q1", D0);
    s = applyAnswer(s, { id: "q1", ok: true, session: "a" }, D0); // am selben Tag nochmal: zählt nicht
    expect(s.items.q1.stage).toBe(0);
    const late = addDays(D0, 20);
    s = applyAnswer(s, { id: "q1", ok: true, session: "b" }, late);
    expect(s.items.q1.stage).toBe(1);
    expect(s.items.q1.due! > late).toBe(true);
    expect(nextDue(D0, 1, late)).toBe(addDays(late, 1));
  });

  it("falsch bei fälliger Frage → morgen nochmal, Stufe bleibt", () => {
    let s = learn(empty(), "q1", D0);
    const d = addDays(D0, 1);
    s = applyAnswer(s, { id: "q1", ok: false, session: "a" }, d);
    expect(s.items.q1.stage).toBe(0);
    expect(s.items.q1.due).toBe(addDays(d, 1));
  });

  it("unbekannte Frage aus einem Quiz kommt in den Plan (morgen fällig)", () => {
    const s = applyAnswer(empty(), { id: "qx", ok: true, session: "a" }, D0);
    expect(s.items.qx).toEqual({ learned: D0, stage: 0, due: addDays(D0, 1) });
  });

  it("Runde: 5–8 Fragen, Themen gemischt, unbekannte IDs werden ignoriert", () => {
    let s = empty();
    const qs = ALL_QUESTIONS.slice(0, 20);
    for (const q of qs) s = learn(s, q.id, D0);
    s = learn(s, "gibt-es-nicht", D0);
    const known = (id: string) => !!Q_BY_ID[id];
    const topicOf = (id: string) => Q_BY_ID[id].topic;
    const ids = buildSession(s, addDays(D0, 3), { topicOf, known, seed: 7 });
    expect(ids.length).toBeGreaterThanOrEqual(SESSION_MIN);
    expect(ids.length).toBeLessThanOrEqual(SESSION_MAX);
    expect(ids).not.toContain("gibt-es-nicht");
    expect(new Set(ids).size).toBe(ids.length);
    // nie zweimal dasselbe Thema hintereinander, wenn genug Themen da sind
    const topics = new Set(ids.map(topicOf));
    if (topics.size > 1) for (let i = 1; i < ids.length; i++) if (topicOf(ids[i]) === topicOf(ids[i - 1])) {
      // nur erlaubt, wenn kein anderes Thema mehr übrig war
      expect(ids.slice(i).every((id) => topicOf(id) === topicOf(ids[i]))).toBe(true);
    }
  });

  it("wenig fällig → mit nächsten Terminen auf 5 aufgefüllt", () => {
    let s = empty();
    ALL_QUESTIONS.slice(0, 10).forEach((q, i) => { s = learn(s, q.id, addDays(D0, i)); });
    const ids = buildSession(s, addDays(D0, 1), { topicOf: (id) => Q_BY_ID[id].topic, seed: 1 });
    expect(ids.length).toBe(SESSION_MIN);
  });

  it("interleave mischt Themen ohne etwas zu verlieren", () => {
    const ids = ["a1", "a2", "a3", "b1", "b2", "c1"];
    const out = interleave(ids, (id) => id[0]);
    expect([...out].sort()).toEqual([...ids].sort());
    for (let i = 1; i < out.length; i++) expect(out[i][0]).not.toBe(out[i - 1][0]);
  });

  it("boost holt Fragen auf heute", () => {
    let s = learn(empty(), "q1", D0);
    s = boost(s, ["q1", "q2"], D0);
    expect(dueIds(s, D0)).toEqual(expect.arrayContaining(["q1", "q2"]));
  });
});

describe("Fehlerdeck", () => {
  it("falsch → rein; erst 3× richtig in getrennten Runden → raus", () => {
    let s = applyAnswer(empty(), { id: "q1", ok: false, session: "s1" }, D0);
    expect(errorIds(s)).toEqual(["q1"]);
    s = applyAnswer(s, { id: "q1", ok: true, session: "s2" }, D0);
    s = applyAnswer(s, { id: "q1", ok: true, session: "s2" }, D0); // gleiche Runde zählt nicht doppelt
    expect(s.errors.q1.streak).toBe(1);
    s = applyAnswer(s, { id: "q1", ok: true, session: "s3" }, D0);
    expect(s.errors.q1.streak).toBe(2);
    s = applyAnswer(s, { id: "q1", ok: true, session: "s4" }, D0);
    expect(s.errors.q1).toBeUndefined();
    expect(s.graduated).toBe(1);
    expect(ERROR_GRADUATE).toBe(3);
  });

  it("ein Fehler setzt die Serie zurück", () => {
    let s = applyAnswer(empty(), { id: "q1", ok: false, session: "s1" }, D0);
    s = applyAnswer(s, { id: "q1", ok: true, session: "s2" }, D0);
    s = applyAnswer(s, { id: "q1", ok: true, session: "s3" }, D0);
    s = applyAnswer(s, { id: "q1", ok: false, session: "s4" }, D0);
    expect(s.errors.q1.streak).toBe(0);
    expect(s.errors.q1.added).toBe(D0);
  });

  it("Fehlerkarten kommen in jede Runde (max. 3) und zählen heute mit", () => {
    let s = empty();
    for (const q of ALL_QUESTIONS.slice(0, 5)) s = applyAnswer(s, { id: q.id, ok: false, session: "x" }, D0);
    const ids = buildSession(s, D0, { topicOf: (id) => Q_BY_ID[id].topic, seed: 3 });
    expect(ids.filter((id) => s.errors[id]).length).toBeGreaterThanOrEqual(3);
    expect(todayCount(s, D0).errors).toBe(5);
  });
});

describe("Nach dem Training: Empfehlung", () => {
  const all = [...TUTORIALS_K2, ...LESSONS_PROGRAM];
  const has = (id: string) => all.some((t) => t.id === id);
  const dayLessons = (n: number) => DAYS.find((d) => d.n === n)?.lessons as { kind: string; id?: string }[] | undefined;

  it("jede Lage × Rolle hat eine Empfehlung mit Themen, die es gibt", () => {
    const topics = new Set(ALL_QUESTIONS.map((q) => q.topic as string));
    for (const p of POSITIONS) for (const r of ROLES) {
      const rec = RECOMMEND[p][r];
      expect(rec, `${p}/${r}`).toBeDefined();
      expect(rec.topics.length).toBeGreaterThan(0);
      expect(rec.topics.some((t) => topics.has(t)), `${p}/${r} Themen`).toBe(true);
      expect(wordCount(rec.why)).toBeLessThanOrEqual(20);
      const t = resolveLesson(rec, has, dayLessons);
      if (t.kind === "k2") expect(has(t.id)).toBe(true);
      expect(pickRelated(ALL_QUESTIONS, rec.topics, empty(), 4).length).toBeGreaterThan(0);
    }
  });

  it("fehlende Lektion → Tag-Lektion → Landkarte (immer ein Ziel)", () => {
    const rec = { lessonId: "weg", day: 2, topics: ["mount"], why: "" };
    const viaDay = resolveLesson(rec, (id) => id === "x", () => [{ kind: "k2", id: "x" }]);
    expect(viaDay).toEqual({ kind: "k2", id: "x" });
    expect(resolveLesson(rec, () => false, () => undefined)).toEqual({ kind: "map" });
  });

  it("Trainer-Fragen: 2–3 je Lage und Rolle, du-Form, ≤ 20 Wörter", () => {
    for (const p of POSITIONS) for (const r of ROLES) {
      const list = COACH_QUESTIONS[p][r];
      expect(list.length).toBeGreaterThanOrEqual(2);
      expect(list.length).toBeLessThanOrEqual(3);
      for (const q of list) {
        expect(wordCount(q), q).toBeLessThanOrEqual(20);
        expect(q.endsWith("?")).toBe(true);
      }
      expect(list).toContain(suggestQuestion(p, r, 5));
    }
  });
});

describe("Speicher (mk.journey.v1)", () => {
  beforeEach(() => { mem.throwing = false; mem.clear(); resetJourneyCache(); });

  it("leer, kaputt oder falscher Typ → leerer Zustand", () => {
    expect(loadJourney().log).toEqual([]);
    mem.setItem(JOURNEY_KEY, "{kaputt");
    expect(loadJourney()).toMatchObject({ v: 1, items: {}, errors: {}, log: [] });
    mem.setItem(JOURNEY_KEY, JSON.stringify([1, 2, 3]));
    expect(loadJourney().items).toEqual({});
    mem.setItem(JOURNEY_KEY, "null");
    expect(loadJourney().errors).toEqual({});
  });

  it("repariert einzelne kaputte Einträge statt alles zu verwerfen", () => {
    const raw = {
      items: { ok: { learned: D0, stage: 2, due: addDays(D0, 4) }, bad: { learned: "gestern" }, odd: { learned: D0, stage: 99 } },
      errors: { e1: { added: D0, streak: 7 }, e2: "x" },
      graduated: -4,
      log: [{ id: "t1", at: D0, trained: ["mount", "quatsch"], stuck: { pos: "mount", role: "seitlich" }, feel: 9 }, { at: 1 }],
    };
    const s = sanitizeJourney(raw);
    expect(Object.keys(s.items).sort()).toEqual(["odd", "ok"]);
    expect(s.items.odd.due).toBeNull();
    expect(s.errors.e1.streak).toBe(ERROR_GRADUATE - 1);
    expect(s.errors.e2).toBeUndefined();
    expect(s.graduated).toBe(0);
    expect(s.log).toHaveLength(1);
    expect(s.log[0]).toMatchObject({ trained: ["mount"], stuck: null, feel: 5 });
    expect(sanitizeReview(undefined)).toEqual({ items: {}, errors: {}, graduated: 0 });
  });

  it("speichern und laden – auch wenn localStorage wirft", () => {
    recordAnswer("q-tap-when", false, "s1", D0);
    resetJourneyCache();
    expect(getJourney().errors["q-tap-when"]).toBeDefined();
    mem.throwing = true;
    expect(() => saveJourney(getJourney())).not.toThrow();
    expect(() => recordAnswer("q-tap-how", true, "s2", D0)).not.toThrow();
    expect(getJourney().items["q-tap-how"]).toBeDefined(); // im Speicher weiter da
    resetJourneyCache();
    expect(loadJourney().log).toEqual([]);
  });

  it("Quiz-Ereignis landet im Fehlerdeck; Training legt Fragen in die Wiederholung", () => {
    emitQuizAnswer({ id: "q-tap-clear", ok: false, session: "z" });
    expect(getJourney().errors["q-tap-clear"]).toBeDefined();
    const e = addTraining({ at: D0, trained: ["mount"], stuck: { pos: "mount", role: "bottom" }, feel: 3 }, ["q-mount-first"], D0);
    expect(getJourney().log.at(-1)!.id).toBe(e.id);
    expect(dueIds(getJourney(), D0)).toContain("q-mount-first");
    resetJourneyCache();
    expect(loadJourney().log).toHaveLength(1);
  });
});
