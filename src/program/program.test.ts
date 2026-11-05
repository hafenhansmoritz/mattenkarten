import { describe, expect, it } from "vitest";
import { TUTORIALS_K2 } from "../core2/data/tutorials";
import { DAYS, READY_CHECKLIST, RETRIEVAL_PLAN } from "./days";
import { AREAS, buildExam, scoreExam } from "./exam";
import { LESSONS_PROGRAM } from "./lessons";
import { GOALS, LADDER } from "./PositionMap";
import { Q_BY_ID, QUESTIONS, TOPIC_AREA } from "./questions";
import { EMPTY, completeDay, currentDay, knotState, sameDayHint } from "./store";

const words = (s: string) => s.trim().split(/\s+/).filter((w) => w !== "–" && w !== "-").length;
const sentences = (s: string) => s.split(/(?<=[.!?:])\s+/).filter(Boolean);
const LESSON_IDS = new Set([...TUTORIALS_K2, ...LESSONS_PROGRAM].map((t) => t.id));

describe("Startprogramm – Fragenbank", () => {
  it("rund 40 Fragen, IDs eindeutig", () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(38);
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
  });

  it("jede Frage: 2–4 Optionen, gültige Antwort, Warum ≤ 25 Wörter, Sätze ≤ 20 Wörter", () => {
    for (const q of QUESTIONS) {
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(2);
      expect(q.options.length, q.id).toBeLessThanOrEqual(4);
      expect(new Set(q.options).size, `${q.id}: doppelte Option`).toBe(q.options.length);
      expect(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, q.id).toBe(true);
      expect(words(q.why), `${q.id}: ${q.why}`).toBeLessThanOrEqual(25);
      for (const s of sentences(q.why)) expect(words(s), `${q.id}: ${s}`).toBeLessThanOrEqual(20);
      expect(q.q).not.toMatch(/\bSie\b|\bIhr(e|en)?\b/);
      expect(q.why).not.toMatch(/\bSie\b|\bIhr(e|en)?\b/);
      expect(q.day).toBeGreaterThanOrEqual(1);
      expect(q.day).toBeLessThanOrEqual(6);
      expect(q.src || q.check, `${q.id}: Quelle oder check:true`).toBeTruthy();
    }
  });

  it("alle Themen und Prüfungsbereiche sind abgedeckt", () => {
    const topics = new Set(QUESTIONS.map((q) => q.topic));
    for (const t of Object.keys(TOPIC_AREA)) expect(topics.has(t as never), t).toBe(true);
    for (const a of AREAS) expect(QUESTIONS.filter((q) => TOPIC_AREA[q.topic] === a).length, a).toBeGreaterThanOrEqual(6);
  });
});

describe("Startprogramm – Tagesplan", () => {
  it("7 Tage, Texte kurz", () => {
    expect(DAYS.map((d) => d.n)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const d of DAYS) {
      expect(words(d.why), d.why).toBeLessThanOrEqual(20);
      expect(words(d.goal), d.goal).toBeLessThanOrEqual(15);
      for (const s of d.drill.steps) expect(words(s), s).toBeLessThanOrEqual(20);
      expect(d.drill.safety.length).toBeGreaterThan(5);
    }
  });

  it("Lektionen existieren (Tag 1 Landkarte, Tag 7 Prüfung)", () => {
    expect(DAYS[0].lessons).toEqual([{ kind: "map" }]);
    expect(DAYS[6].lessons).toEqual([{ kind: "exam" }]);
    for (const d of DAYS) for (const l of d.lessons) if (l.kind === "k2") expect(LESSON_IDS.has(l.id), `${d.n}: ${l.id}`).toBe(true);
    expect(DAYS[5].lessons).toHaveLength(2);
  });

  it("Abruf: nur frühere Tage, genau nach Spec-Plan, alle Fragen-IDs gültig", () => {
    for (const d of DAYS.slice(0, 6)) {
      const plan = RETRIEVAL_PLAN[d.n];
      for (const id of d.warmup) {
        const q = Q_BY_ID[id];
        expect(q, id).toBeDefined();
        expect(q.day, `Tag ${d.n}: ${id}`).toBeLessThan(d.n);
        expect(plan, `Tag ${d.n}: ${id} aus Tag ${q.day}`).toContain(q.day);
      }
      // jeder Plan-Tag kommt vor
      for (const pd of plan) expect(d.warmup.some((id) => Q_BY_ID[id].day === pd), `Tag ${d.n} fragt Tag ${pd} ab`).toBe(true);
      expect(d.warmup.length === 0 || (d.warmup.length >= 3 && d.warmup.length <= 4), `Tag ${d.n}`).toBe(true);
      // Rätsel: 2–3 Fragen des Tages
      expect(d.puzzle.length).toBeGreaterThanOrEqual(2);
      expect(d.puzzle.length).toBeLessThanOrEqual(3);
      for (const id of d.puzzle) expect(Q_BY_ID[id]?.day, `${d.n}: ${id}`).toBe(d.n);
    }
  });

  it("Checkliste aus der Spec, ungeprüfter Punkt markiert", () => {
    expect(READY_CHECKLIST.length).toBe(10);
    expect(READY_CHECKLIST.find((c) => c.id === "haut")?.check).toBe(true);
  });

  it("Landkarte: Hierarchie nach KB 3.2, Ziele lösbar", () => {
    expect(LADDER.map((s) => s.id)).toEqual(["back-top", "mount-top", "side-top", "guard", "side-bottom", "mount-bottom"]);
    for (const g of GOALS) {
      expect(g.answer).toBeLessThan(g.options.length);
      expect(words(g.why)).toBeLessThanOrEqual(20);
    }
  });
});

describe("Startprogramm – Prüfung", () => {
  it("12 Fragen, 3 je Bereich, ohne Dubletten (über viele Seeds)", () => {
    for (let seed = 1; seed < 60; seed++) {
      const ex = buildExam(seed);
      expect(ex).toHaveLength(12);
      expect(new Set(ex.map((q) => q.id)).size).toBe(12);
      for (const a of AREAS) expect(ex.filter((q) => TOPIC_AREA[q.topic] === a)).toHaveLength(3);
    }
  });

  it("≥ 80 % je Bereich nötig", () => {
    const ex = buildExam(5);
    const allOk = ex.map((q) => ({ id: q.id, ok: true }));
    expect(scoreExam(allOk).passed).toBe(true);
    const oneWrong = allOk.map((r, i) => (i === 0 ? { ...r, ok: false } : r));
    expect(scoreExam(oneWrong).passed).toBe(false);
  });
});

describe("Startprogramm – Fortschritt", () => {
  it("Tage schalten der Reihe nach frei, ohne Kalender-Sperre", () => {
    let p = { ...EMPTY };
    expect(currentDay(p)).toBe(1);
    expect(knotState(p, 2)).toBe("locked");
    p = completeDay(p, 1, "done", "2026-11-05");
    expect(currentDay(p)).toBe(2);
    expect(knotState(p, 2)).toBe("now");
    expect(sameDayHint(p, 2, "2026-11-05")).toBe(true);
    expect(sameDayHint(p, 2, "2026-11-06")).toBe(false);
    p = completeDay(p, 2, "later", "2026-11-05");
    expect(currentDay(p)).toBe(3);
    // Wiederholen stuft einen gemachten Drill nicht herab
    p = completeDay(p, 1, "later", "2026-11-07");
    expect(p.drills[1]).toBe("done");
    expect(p.doneOn[1]).toBe("2026-11-05");
  });
});
