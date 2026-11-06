import { describe, expect, it } from "vitest";
import { afterAnswer, type QuizItem } from "./Quiz";
import { EXPLAIN_QUESTIONS, Q_BY_ID } from "./questions";

const item = (id: string, key: number): QuizItem => ({ q: Q_BY_ID[id], retry: false, key });

describe("Quiz-Warteschlange (UX-Review 2, Punkt 1)", () => {
  it("„Weiß ich nicht“ bei einer Ein-Satz-Frage: einmal wiederholen, dann nie wieder – keine Endlosschleife", () => {
    const ex = EXPLAIN_QUESTIONS[0].id;
    let q: QuizItem[] = [item(ex, 0)];
    let shown = 0;
    // Nutzer drückt immer „Weiß ich nicht“ (= falsch)
    while (q.length && shown < 50) { shown++; q = afterAnswer(q, false); }
    expect(shown).toBe(2);
    expect(q).toEqual([]);
  });

  it("falsche Antwort kommt genau einmal ans Ende, richtige ist raus", () => {
    const q = [item("q-tap-when", 0), item("q-tap-release", 1)];
    const a = afterAnswer(q, false);
    expect(a.map((x) => [x.q.id, x.retry])).toEqual([["q-tap-release", false], ["q-tap-when", true]]);
    const b = afterAnswer(a, true);
    expect(b.map((x) => x.q.id)).toEqual(["q-tap-when"]);
    expect(afterAnswer(b, false)).toEqual([]);
  });
});
