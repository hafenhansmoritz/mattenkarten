import { beforeEach, describe, expect, it } from "vitest";
import { EMPTY, completeDay, type ProgramProgress } from "../program/store";
import { _reloadShared, getShared, markLessonDone, migrate, programLessons, recordK2Result, PROGRESS_KEY } from "./store";
import { CORE_LESSONS, LESSON_2, LESSON_3, allowedLadder, lessonOpen, planDraftHint, ranglisteChoices, unlocks } from "./unlock";
import { TUTORIALS_K2, TUTORIAL_GUARD_ODER_TD } from "../core2/data/tutorials";
import { newLadder } from "../core2/ladder/ladder";

const prog = (days: number[]): ProgramProgress => days.reduce((p, n) => completeDay(p, n, "done", "2026-11-01"), { ...EMPTY });

class MemStore {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

describe("Gemeinsamer Lektions-Fortschritt", () => {
  beforeEach(() => { (globalThis as any).localStorage = new MemStore(); _reloadShared(); });

  it("Programm-Tage bringen ihre Kern-2-Lektionen mit (Tag 2 → Lektion 1, Tag 6 → Lektion 3)", () => {
    expect(programLessons(prog([1]))).toEqual([]);
    expect(programLessons(prog([1, 2]))).toEqual(["k2-raus-von-unten"]);
    expect(programLessons(prog([1, 2, 3, 4, 5, 6]))).toContain(LESSON_3);
  });

  it("übernimmt mk.k2.done und Programm-Tage einmalig und löscht den Alt-Schlüssel", () => {
    localStorage.setItem("mk.k2.done", JSON.stringify(["k2-keile-vorbeigehen"]));
    localStorage.setItem("mk.program.v1", JSON.stringify(prog([1, 2])));
    _reloadShared();
    expect(getShared().lessons.sort()).toEqual(["k2-keile-vorbeigehen", "k2-raus-von-unten"]);
    expect(localStorage.getItem("mk.k2.done")).toBeNull();
    expect(JSON.parse(localStorage.getItem(PROGRESS_KEY)!).lessons).toHaveLength(2);
    expect(migrate("kaputt", prog([])).lessons).toEqual([]);
  });

  it("ein Sieg in einer Lektion zählt überall – und als Sieg", () => {
    recordK2Result(true, "p-side-escape");
    recordK2Result(false, "k2-raus-von-unten");
    recordK2Result(true);
    expect(getShared().lessons).toEqual(["p-side-escape"]);
    expect(getShared().wins).toBe(2);
    markLessonDone("p-side-escape");
    expect(getShared().lessons).toEqual(["p-side-escape"]);
  });
});

describe("Freischalten", () => {
  it("Normal/Hart und Spielstil nach Tag 7 oder Lektion 3", () => {
    expect(unlocks({ day: 3, lessons: [], wins: 9 }).levels).toBe(false);
    expect(unlocks({ day: 3, lessons: [LESSON_3], wins: 0 }).levels).toBe(true);
    expect(unlocks({ day: 8, lessons: [], wins: 0 }).levels).toBe(true);
  });
  it("Spielplan und Draft erst nach Lektion 3 UND 3 Siegen", () => {
    expect(unlocks({ day: 8, lessons: [], wins: 10 }).planDraft).toBe(false);
    expect(unlocks({ day: 2, lessons: [LESSON_3], wins: 2 }).planDraft).toBe(false);
    expect(unlocks({ day: 2, lessons: [LESSON_3], wins: 3 }).planDraft).toBe(true);
    expect(planDraftHint({ day: 2, lessons: [], wins: 1 })).toBe("Schaltet sich frei nach Lektion 3 und 2 weiteren Siegen.");
    expect(planDraftHint({ day: 2, lessons: [LESSON_3], wins: 2 })).toBe("Schaltet sich frei nach 1 weiteren Sieg.");
  });
  it("Rangliste/Tages-Challenge auf Start und Beinhebel-Woche erst nach Tag 7", () => {
    expect(unlocks({ day: 7, lessons: [LESSON_3], wins: 5 }).startExtras).toBe(false);
    expect(unlocks({ day: 8, lessons: [], wins: 0 }).startExtras).toBe(true);
    expect(unlocks({ day: 8, lessons: [], wins: 0 }).leglock).toBe(true);
  });
  it("Rangliste (Spielen-Tab) erst nach Tag 7 – auch nicht durch Lektion 3 oder Siege", () => {
    expect(unlocks({ day: 1, lessons: [], wins: 0 }).rangliste).toBe(false);
    expect(unlocks({ day: 7, lessons: [LESSON_3], wins: 20 }).rangliste).toBe(false);
    expect(unlocks({ day: 8, lessons: [], wins: 0 }).rangliste).toBe(true);
  });
  it("Rangliste: Spielplan-Modus nur mit Spielplan-Freischaltung, Spielstil/Stufen nach Tag 7", () => {
    const after7 = unlocks({ day: 8, lessons: [], wins: 0 });
    expect(ranglisteChoices(after7)).toEqual({ plan: false, stil: true, levels: true });
    expect(ranglisteChoices(unlocks({ day: 8, lessons: [LESSON_3], wins: 3 })).plan).toBe(true);
    const s = { ...newLadder(1, "2026-11-06", "ringer"), mode: "plan" as const };
    expect(allowedLadder(s, false).mode).toBe("stil");
    expect(allowedLadder(s, true).mode).toBe("plan");
  });
  it("Bosse nach Lektion 3 oder Tag 7", () => {
    expect(unlocks({ day: 1, lessons: [], wins: 0 }).bosses).toBe(false);
    expect(unlocks({ day: 7, lessons: [LESSON_2], wins: 9 }).bosses).toBe(false);
    expect(unlocks({ day: 3, lessons: [LESSON_3], wins: 0 }).bosses).toBe(true);
    expect(unlocks({ day: 8, lessons: [], wins: 0 }).bosses).toBe(true);
  });
  it("Extra-Lektion nach Lektion 2 oder Tag 4", () => {
    expect(TUTORIAL_GUARD_ODER_TD.id).toBe("k2-guard-oder-takedown");
    expect(unlocks({ day: 1, lessons: [], wins: 0 }).extraLesson).toBe(false);
    expect(unlocks({ day: 4, lessons: [LESSON_3], wins: 0 }).extraLesson).toBe(false);
    expect(unlocks({ day: 2, lessons: [LESSON_2], wins: 0 }).extraLesson).toBe(true);
    expect(unlocks({ day: 5, lessons: [], wins: 0 }).extraLesson).toBe(true);
  });
  it("Lektionskette: Lektion 3 aus dem Programm sperrt sich nicht wegen fehlender Lektion 2", () => {
    expect(CORE_LESSONS.map((l) => l.id)).toEqual(TUTORIALS_K2.map((t) => t.id));
    const fresh = { day: 1, lessons: [], wins: 0 };
    expect([0, 1, 2].map((i) => lessonOpen(i, fresh))).toEqual([true, false, false]);
    expect(lessonOpen(1, { ...fresh, lessons: [TUTORIALS_K2[0].id] })).toBe(true);
    // Programm: Tag 2 (Lektion 1) und Tag 6 (Lektion 3) geschafft, Lektion 2 nie gespielt
    const prog7 = { day: 8, lessons: [TUTORIALS_K2[0].id, LESSON_3], wins: 2 };
    expect([0, 1, 2].map((i) => lessonOpen(i, prog7))).toEqual([true, true, true]);
    expect(lessonOpen(2, { day: 2, lessons: [LESSON_3], wins: 0 })).toBe(true);
    // Nach Tag 3 sind die Begriffe von Lektion 2 bekannt
    expect(lessonOpen(1, { day: 4, lessons: [], wins: 0 })).toBe(true);
  });
});
