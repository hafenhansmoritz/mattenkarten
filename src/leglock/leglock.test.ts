import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  AREAS, LESSONS, QUESTIONS, SOURCES, UNVERIFIED_MARK, lessonQuestions, type RuleStatement, type SrcId,
} from "./content";
import { checkOpen, completeLesson, isLeglockUnlocked, lessonOpen, recordCheck, scoreCheck, leglockMenu } from "./store";
import { EMPTY, completeDay, type ProgramProgress } from "../program/store";

/* ---------- Hilfen ---------- */
function allRules(): RuleStatement[] {
  const out: RuleStatement[] = [];
  for (const l of LESSONS) for (const s of l.steps) {
    if (s.kind === "info" && s.rules) out.push(...s.rules);
    if (s.kind === "sort") out.push(...s.items.map((i) => i.rule));
  }
  return out;
}

function allTexts(): string[] {
  const t: string[] = [];
  for (const l of LESSONS) {
    t.push(l.title, l.short);
    for (const s of l.steps) {
      t.push(s.title);
      if (s.kind === "info") t.push(...s.body, ...(s.rules ?? []).map((r) => r.text));
      if (s.kind === "sort") t.push(s.intro, ...s.items.map((i) => i.rule.text));
      if (s.kind === "spot") t.push(s.q, s.why, ...s.captions);
      if (s.kind === "card") t.push(s.front, ...s.back);
      if (s.kind === "tap") t.push(s.text, s.done);
    }
  }
  for (const q of QUESTIONS) t.push(q.q, q.why, ...q.options);
  return t;
}

const sentences = (s: string) => s.split(/(?<=[.!?])\s+/).filter(Boolean);
const words = (s: string) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));

const prog = (days: number[]): ProgramProgress => days.reduce((p, n) => completeDay(p, n, "done", "2026-11-05"), { ...EMPTY });

/* ---------- Inhalt ---------- */
describe("Woche 2: Inhalte", () => {
  it("hat 4 Lektionen in der Reihenfolge Regeln, Verteidigung, Fußhebel, Abklopfen", () => {
    expect(LESSONS.map((l) => l.id)).toEqual(["regeln", "verteidigung", "fusshebel", "abklopfen"]);
  });

  it("jede Regelaussage ist belegt oder trägt den Prüf-Marker", () => {
    for (const r of allRules()) {
      if (r.verified) {
        expect(r.src?.length, r.text).toBeGreaterThan(0);
        expect(r.text).not.toContain(UNVERIFIED_MARK);
        // Regeln nur aus Primärquellen (Regelwerk)
        for (const id of r.src!) expect(SOURCES[id].kind, `${r.text} → ${id}`).toBe("primär");
      } else {
        expect(r.text, r.text).toContain("Regel deines Turniers/Gyms prüfen");
      }
    }
  });

  it("nennt andere Ligen nur mit Beleg oder Marker", () => {
    const leagues = /\b(ADCC|EBI|NAGA|10th Planet|Grappling Industries|Deutsche Turniere|andere Ligen)\b/;
    for (const r of allRules()) if (leagues.test(r.text)) {
      expect(r.verified ? r.src!.length > 0 : r.text.includes(UNVERIFIED_MARK), r.text).toBe(true);
    }
    for (const q of QUESTIONS) if (leagues.test(q.why) || leagues.test(q.q)) {
      expect(q.src?.length, q.id).toBeGreaterThan(0);
    }
  });

  it("alle Quellen haben URL und Abrufdatum", () => {
    for (const [id, s] of Object.entries(SOURCES)) {
      expect(s.url, id).toMatch(/^https:\/\//);
      expect(s.checked, id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    const used = new Set<SrcId>();
    for (const r of allRules()) r.src?.forEach((x) => used.add(x));
    for (const q of QUESTIONS) q.src?.forEach((x) => used.add(x));
    for (const id of used) expect(SOURCES[id]).toBeTruthy();
  });

  it("höchstens 20 Wörter pro Satz", () => {
    const long = allTexts().flatMap(sentences).filter((s) => words(s).length > 20);
    expect(long).toEqual([]);
  });

  it("je Bereich 5 Fragen mit gültiger Antwort; Lektion nimmt 2", () => {
    for (const a of AREAS) {
      const qs = QUESTIONS.filter((q) => q.area === a);
      expect(qs.length, a).toBe(5);
      expect(lessonQuestions(a).length).toBe(2);
    }
    for (const q of QUESTIONS) {
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
    }
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
  });

  it("Heel Hook, Kneebar, Toe Hold, Calf Slicer, Knee Reaping sind verboten, nur der gerade Fußhebel erlaubt", () => {
    const sort = LESSONS[0].steps.find((s) => s.kind === "sort");
    if (!sort || sort.kind !== "sort") throw new Error("kein Sortierschritt");
    const allowed = sort.items.filter((i) => i.allowed).map((i) => i.name);
    expect(allowed).toEqual(["Gerader Fußhebel"]);
    for (const n of ["Heel Hook", "Kneebar", "Toe Hold", "Calf Slicer", "Knee Reaping"]) {
      expect(sort.items.find((i) => i.name === n)?.allowed, n).toBe(false);
    }
  });

  it("Fußhebel-Lektion verlangt Trainer und langsames Ansetzen", () => {
    const txt = JSON.stringify(LESSONS.find((l) => l.id === "fusshebel"));
    expect(txt).toMatch(/Trainer/);
    expect(txt).toMatch(/langsam/);
  });

  it("Modul enthält keine spielbaren Angriffskarten", () => {
    const dir = __dirname;
    for (const f of readdirSync(dir).filter((n) => /\.(ts|tsx)$/.test(n) && !n.endsWith(".test.ts"))) {
      const src = readFileSync(join(dir, f), "utf8");
      expect(src, f).not.toMatch(/from "\.\.\/(core2\/data\/cards|data\/cards)/);
    }
  });
});

/* ---------- Freischaltung ---------- */
describe("Woche 2: Freischaltung", () => {
  it("gesperrt bis Tag 7 geschafft ist", () => {
    expect(isLeglockUnlocked(prog([]))).toBe(false);
    expect(isLeglockUnlocked(prog([1, 2, 3, 4, 5, 6]))).toBe(false);
    expect(isLeglockUnlocked(prog([1, 2, 3, 4, 5, 6, 7]))).toBe(true);
    expect(leglockMenu(prog([1, 2, 3])).locked).toBe(true);
    expect(leglockMenu(prog([1, 2, 3, 4, 5, 6, 7])).locked).toBe(false);
  });

  it("Lektionen der Reihe nach, Check erst nach allen 4", () => {
    let s = { done: [] as typeof LESSONS[number]["id"][] };
    expect(lessonOpen(s, "regeln")).toBe(true);
    expect(lessonOpen(s, "verteidigung")).toBe(false);
    expect(lessonOpen(s, "fusshebel")).toBe(false);
    s = completeLesson(s, "regeln");
    expect(lessonOpen(s, "verteidigung")).toBe(true);
    expect(lessonOpen(s, "fusshebel")).toBe(false);
    expect(checkOpen(s)).toBe(false);
    for (const l of LESSONS) s = completeLesson(s, l.id);
    expect(checkOpen(s)).toBe(true);
    expect(completeLesson(s, "regeln").done.length).toBe(4);
  });

  it("Check: jeder Bereich ≥ 80 %", () => {
    const areaOf = (id: string) => QUESTIONS.find((q) => q.id === id)?.area;
    const all = QUESTIONS.map((q) => ({ id: q.id, ok: true }));
    expect(scoreCheck(all, areaOf).passed).toBe(true);
    // ein Fehler pro Bereich = 4/5 = 80 % → bestanden
    const oneWrong = QUESTIONS.map((q) => ({ id: q.id, ok: !q.id.endsWith("1") }));
    expect(scoreCheck(oneWrong, areaOf).passed).toBe(true);
    // zwei Fehler in einem Bereich = 60 % → nicht bestanden
    const twoWrong = QUESTIONS.map((q) => ({ id: q.id, ok: !(q.id === "ll-r1" || q.id === "ll-r2") }));
    const c = scoreCheck(twoWrong, areaOf);
    expect(c.passed).toBe(false);
    expect(c.areas.regeln).toEqual([3, 5]);
    // fehlender Bereich → nicht bestanden
    expect(scoreCheck(all.filter((r) => !r.id.startsWith("ll-a")), areaOf).passed).toBe(false);
  });

  it("bestandener Check wird nicht durch einen schlechteren überschrieben", () => {
    const areaOf = (id: string) => QUESTIONS.find((q) => q.id === id)?.area;
    const pass = scoreCheck(QUESTIONS.map((q) => ({ id: q.id, ok: true })), areaOf);
    const fail = scoreCheck(QUESTIONS.map((q) => ({ id: q.id, ok: false })), areaOf);
    const s = recordCheck({ done: [] }, pass);
    expect(recordCheck(s, fail).check?.passed).toBe(true);
    expect(recordCheck({ done: [] }, fail).check?.passed).toBe(false);
  });
});
