// Freie Wiedergabe („Erklär in einem Satz“): Fragenbank-Regeln und Einbindung in Programm, Prüfung, Reise.
import { describe, expect, it } from "vitest";
import { applyAnswer } from "../journey/schedule";
import { DAYS } from "./days";
import { buildExam } from "./exam";
import { ALL_QUESTIONS, EXPLAIN_QUESTIONS, Q_BY_ID, TOPIC_AREA, explainFor } from "./questions";

const words = (s: string) => s.trim().split(/\s+/).filter((w) => w !== "–" && w !== "-").length;
const sentences = (s: string) => s.split(/(?<=[.!?:])\s+/).filter(Boolean);

describe("Ein-Satz-Fragen", () => {
  it("6 Fragen, eindeutig, in ALL_QUESTIONS und Q_BY_ID", () => {
    expect(EXPLAIN_QUESTIONS).toHaveLength(6);
    for (const q of EXPLAIN_QUESTIONS) {
      expect(Q_BY_ID[q.id]).toBe(q);
      expect(ALL_QUESTIONS.filter((x) => x.id === q.id)).toHaveLength(1);
    }
  });

  it("Form: Erklär in einem Satz …, Musterantwort ≤ 25 Wörter, 2–3 Kernpunkte, Quelle, du-Form", () => {
    for (const q of EXPLAIN_QUESTIONS) {
      expect(q.kind).toBe("erklaeren");
      expect(q.q, q.id).toMatch(/^Erklär in einem Satz, warum .+\.$/);
      expect(q.options).toEqual([]);
      expect(q.answer).toBe(-1);
      expect(words(q.why), q.id).toBeLessThanOrEqual(25);
      for (const s of sentences(q.why)) expect(words(s), `${q.id}: ${s}`).toBeLessThanOrEqual(20);
      expect(q.explain!.points.length, q.id).toBeGreaterThanOrEqual(2);
      expect(q.explain!.points.length, q.id).toBeLessThanOrEqual(3);
      for (const p of q.explain!.points) expect(words(p), p).toBeLessThanOrEqual(12);
      expect(q.src, q.id).toBeTruthy();
      expect(`${q.q} ${q.why} ${q.explain!.points.join(" ")}`).not.toMatch(/\bSie\b|\bIhr(e|en)?\b/);
      expect(TOPIC_AREA[q.topic]).toBeTruthy();
    }
  });

  it("No-Gi: keine Kragen-, Ärmel-, Hosen- oder Gürtelgriffe", () => {
    for (const q of EXPLAIN_QUESTIONS) expect(`${q.q} ${q.why}`).not.toMatch(/Kragen|Ärmel|Hose|Gürtel|Revers/i);
  });

  it("hängen an Programm-Tagen 2–6 (nach den Rätseln), inkl. Mount-Ellbogen-Frage an Tag 2", () => {
    for (const d of DAYS.filter((x) => x.n >= 2 && x.n <= 6)) expect(explainFor(d.n).length, `Tag ${d.n}`).toBeGreaterThanOrEqual(1);
    expect(explainFor(1)).toEqual([]);
    expect(explainFor(7)).toEqual([]);
    expect(explainFor(2)).toContain("qe-mount-elbows");
    for (const q of EXPLAIN_QUESTIONS) expect(DAYS.some((d) => d.n === q.day)).toBe(true);
  });

  it("Prüfung bleibt Auswahl: keine Ein-Satz-Fragen", () => {
    for (let seed = 1; seed < 40; seed++) expect(buildExam(seed).some((q) => q.kind === "erklaeren")).toBe(false);
  });

  it("falsche Selbst-/Coach-Bewertung landet wie eine MC-Antwort im Fehlerdeck", () => {
    const s = applyAnswer({ items: {}, errors: {}, graduated: 0 }, { id: "qe-mount-elbows", ok: false, session: "t" }, "2026-11-05");
    expect(s.errors["qe-mount-elbows"]?.streak).toBe(0);
    expect(s.items["qe-mount-elbows"]).toBeTruthy();
  });
});
