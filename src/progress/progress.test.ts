import { beforeEach, describe, expect, it } from "vitest";
import { EMPTY, completeDay, type ProgramProgress } from "../program/store";
import { _reloadShared, getShared, markLessonDone, migrate, programLessons, recordK2Result, PROGRESS_KEY } from "./store";
import { LESSON_3, planDraftHint, unlocks } from "./unlock";

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
});
