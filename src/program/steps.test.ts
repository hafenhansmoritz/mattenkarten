import { describe, expect, it } from "vitest";
import { DAYS } from "./days";
import { SCHUTZHALTUNG } from "./concepts";
import { Q_BY_ID } from "./questions";
import { buildPlan, cuesBetween, fmt, planMs, viewAt } from "./timer";
import { WARMUP, WARMUP_TIMER } from "./warmup";
import { knowledgeMeter, matMeter, MAT_GOAL } from "../journey/meters";

const words = (s: string) => s.trim().split(/\s+/).filter((w) => w !== "–" && w !== "-").length;

describe("Schutzhaltung (Schritt 9)", () => {
  it("4 Punkte, belegt, Tag 2 führt ein, spätere Tage greifen zurück", () => {
    expect(SCHUTZHALTUNG.points.map((p) => p.short)).toEqual(["Ellbogen eng", "Kinn unten", "Hände vorn", "Rücken nie zeigen"]);
    for (const p of SCHUTZHALTUNG.points) {
      expect(p.src || p.check, p.id).toBeTruthy();
      expect(words(p.text), p.text).toBeLessThanOrEqual(15);
    }
    expect(DAYS.filter((d) => d.concept === "schutz").map((d) => d.n)).toEqual([2]);
    const later = DAYS.filter((d) => d.recall?.includes("schutz"));
    expect(later.length).toBeGreaterThanOrEqual(2);
    for (const d of later) {
      expect(d.n).toBeGreaterThan(2);
      expect(d.why, `Tag ${d.n}`).toMatch(/Schutzhaltung/);
    }
    expect(SCHUTZHALTUNG.sources.some((s) => s.marketing)).toBe(true);
  });

  it("3 Fragen, Tag 2, Thema Schutzhaltung, eine davon im späteren Aufwärmen", () => {
    expect(SCHUTZHALTUNG.questions).toHaveLength(3);
    for (const id of SCHUTZHALTUNG.questions) {
      const q = Q_BY_ID[id];
      expect(q, id).toBeDefined();
      expect(q.day).toBe(2);
      expect(q.topic).toBe("schutz");
      expect(q.src).toBeTruthy();
    }
    expect(DAYS.slice(2).some((d) => d.warmup.some((id) => SCHUTZHALTUNG.questions.includes(id)))).toBe(true);
  });
});

describe("Solo-Drill-Timer (Schritt 56)", () => {
  const cfg = { rounds: 3, work: 60, rest: 30, prep: 5, switchSides: true };
  const plan = buildPlan(cfg);

  it("Plan: Vorlauf, Arbeit, Pause – keine Pause nach der letzten Runde", () => {
    expect(plan.map((s) => s.kind)).toEqual(["prep", "work", "rest", "work", "rest", "work"]);
    expect(planMs(plan)).toBe((5 + 60 * 3 + 30 * 2) * 1000);
  });

  it("Zustand und Seitenwechsel zur Halbzeit", () => {
    expect(viewAt(plan, 0).seg?.kind).toBe("prep");
    const w = viewAt(plan, 5000 + 29_000, true);
    expect(w.seg?.kind).toBe("work");
    expect(w.sideB).toBe(false);
    expect(viewAt(plan, 5000 + 31_000, true).sideB).toBe(true);
    expect(viewAt(plan, 5000 + 61_000).seg).toMatchObject({ kind: "rest", round: 2 });
    expect(viewAt(plan, planMs(plan) + 1).done).toBe(true);
  });

  it("Signale: Countdown, Start, Seite wechseln, Pause, Fertig", () => {
    expect(cuesBetween(plan, 0, 2500)).toEqual(["tick"]);
    expect(cuesBetween(plan, 4900, 5100)).toEqual(["start"]);
    expect(cuesBetween(plan, 34_900, 35_100, true)).toEqual(["switch"]);
    expect(cuesBetween(plan, 34_900, 35_100, false)).toEqual([]);
    expect(cuesBetween(plan, 64_900, 65_100)).toEqual(["rest"]);
    const all = cuesBetween(plan, 0, planMs(plan), true);
    expect(all.filter((c) => c === "start")).toHaveLength(3);
    expect(all.filter((c) => c === "switch")).toHaveLength(3);
    expect(all.at(-1)).toBe("done");
    expect(fmt(61_000)).toBe("1:01");
    expect(fmt(400)).toBe("0:01");
  });

  it("jeder Tages-Drill hat einen Timer, Labels passen zu den Runden", () => {
    for (const d of DAYS) {
      const t = d.drill.timer;
      expect(t.rounds, `Tag ${d.n}`).toBeGreaterThanOrEqual(1);
      expect(t.work).toBeGreaterThanOrEqual(20);
      if (t.labels) expect(t.labels).toHaveLength(t.rounds);
      expect(planMs(buildPlan(t))).toBeLessThanOrEqual(6 * 60_000);
    }
  });
});

describe("Aufwärmen No-Gi (Schritt 57)", () => {
  it("5 Übungen in fester Reihenfolge, je 1 Satz Hinweis + 1 Satz Sicherheit, etwa 5 Minuten", () => {
    expect(WARMUP.map((m) => m.name)).toEqual(["Brücke", "Shrimp", "Sprawl", "Technical Stand-up", "Fallen aus dem Sitz"]);
    for (const m of WARMUP) {
      expect(words(m.cue), m.cue).toBeLessThanOrEqual(16);
      expect(m.safety.length).toBeGreaterThan(10);
      expect(m.src || m.check).toBeTruthy();
    }
    const ms = planMs(buildPlan(WARMUP_TIMER));
    expect(ms).toBeGreaterThanOrEqual(4.5 * 60_000);
    expect(ms).toBeLessThanOrEqual(5.5 * 60_000);
    expect(WARMUP_TIMER.labels).toEqual(WARMUP.map((m) => m.name));
  });
});

describe("Wissen vs. Mattenpraxis (Schritt 62)", () => {
  it("Wissen: Quote erst ab 5 Antworten", () => {
    expect(knowledgeMeter([true, true]).rate).toBeNull();
    expect(knowledgeMeter([true, false, true, true, false]).rate).toBeCloseTo(0.6);
    expect(knowledgeMeter(undefined).n).toBe(0);
  });

  it("Mattenpraxis: nur selbst eingetragene Einheiten, kein Wissensanteil", () => {
    const m = matMeter({ drills: 5, warmups: 2, trainings: 3 });
    expect(m.units).toBe(10);
    expect(m.frac).toBeCloseTo(10 / MAT_GOAL);
    expect(matMeter({ drills: -1, warmups: NaN, trainings: 99 }).frac).toBe(1);
    // getrennte Signaturen: matMeter kennt keine Antworten
    expect(Object.keys(m)).not.toContain("rate");
  });
});
