import { beforeEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  EMPTY, _reloadProgram, completeDay, getProgram, loadProgress, resumeFor, sanitizeResume, setResume, updateProgram,
} from "./store";
import { GYM_TIPS } from "../home/finish";
import { HeaderBelt, hasLadderResult } from "../home/HeaderBelt";

const mem = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => { mem.set(k, v); },
  removeItem: (k: string) => { mem.delete(k); },
};
beforeEach(() => { mem.clear(); _reloadProgram(); });

describe("Fortschritt im Tag (UX-Review 2, Punkt 8)", () => {
  it("Schritt wird gespeichert, nach Neuladen gelesen und beim Abschluss gelöscht", () => {
    updateProgram((p) => setResume(p, { day: 2, step: "puzzle", lesson: 0 }));
    _reloadProgram();
    expect(resumeFor(getProgram(), 2)).toEqual({ day: 2, step: "puzzle", lesson: 0 });
    expect(resumeFor(getProgram(), 3)).toBeNull();
    updateProgram((p) => completeDay(p, 2, "done", "2026-11-06"));
    expect(loadProgress().resume).toBeUndefined();
  });

  it("alte Stände ohne Merker und kaputte Merker laden sicher", () => {
    mem.set("mk.program.v1", JSON.stringify({ done: [1], doneOn: {}, drills: {}, checklist: ["frueh"] }));
    expect(loadProgress()).toMatchObject({ done: [1], checklist: ["frueh"] });
    expect(loadProgress().resume).toBeUndefined();
    expect(sanitizeResume({ day: 9, step: "puzzle", lesson: 0 })).toBeUndefined();
    expect(sanitizeResume({ day: 3, step: "hack", lesson: 0 })).toBeUndefined();
    expect(sanitizeResume({ day: 3, step: "lesson", lesson: "x" })).toEqual({ day: 3, step: "lesson", lesson: 0 });
    mem.set("mk.program.v1", JSON.stringify({ done: [1], resume: { day: 2, step: "drill", lesson: 1 } }));
    expect(loadProgress().resume).toEqual({ day: 2, step: "drill", lesson: 1 });
  });

  it("Checkliste: ein gemeinsamer Stand – Haken bleiben nach Tag 7 und nach Neuladen", () => {
    let p = { ...EMPTY };
    for (let n = 1; n <= 7; n++) p = completeDay(p, n, "done", "2026-11-06");
    updateProgram(() => p);
    updateProgram((x) => ({ ...x, checklist: [...x.checklist, "frueh", "schmuck"] }));
    // zweiter Bildschirm ändert danach etwas anderes – darf die Haken nicht überschreiben
    updateProgram((x) => ({ ...x, boss: "skipped" }));
    _reloadProgram();
    expect(getProgram().checklist).toEqual(["frueh", "schmuck"]);
  });
});

describe("Nach Tag 7 (UX-Review 2, Punkt 9)", () => {
  it("Kopfzeile zeigt „7/7 ✓“ bis zum ersten Ranglisten-Ergebnis, nicht „0 Streifen“", () => {
    let p = { ...EMPTY };
    for (let n = 1; n <= 7; n++) p = completeDay(p, n, "done", "2026-11-06");
    updateProgram(() => p);
    const html = renderToStaticMarkup(createElement(HeaderBelt, { onOpen: () => {} }));
    expect(html).toContain("7/7 ✓");
    expect(html).not.toMatch(/Streifen/);
    expect(hasLadderResult(null)).toBe(false);
    expect(hasLadderResult({ games: 0, history: [], belt: 0 })).toBe(false);
    expect(hasLadderResult({ games: 1, history: [{}], belt: 0 })).toBe(true);
  });

  it("Gym-Tipps: kurz, du-Form, nichts zu Preisen oder Verträgen", () => {
    expect(GYM_TIPS.length).toBeGreaterThanOrEqual(4);
    for (const t of GYM_TIPS) {
      expect(t.split(/\s+/).length, t).toBeLessThanOrEqual(20);
      expect(t).not.toMatch(/\bSie\b|€|Vertrag|Preis/);
    }
    expect(GYM_TIPS.join(" ")).toMatch(/Probetraining/);
    expect(GYM_TIPS.join(" ")).toMatch(/neu bist/);
  });
});
