import { describe, expect, it } from "vitest";
import { CARD } from "../data/cards";
import { STARTER_DECK } from "../data/campaign";
import { beats, bestAnswer, coachHint, counterWorks, mistakeQuestion, recap } from "./learn";
import { createMatch, playTurn, playableCards } from "./match";
import { mulberry32 } from "./rng";
import { stateAt } from "./testUtils";
import type { MatchState } from "./types";

const words = (s: string) => s.trim().split(/\s+/).length;
const playableIds = (s: MatchState) => playableCards(s, "p").filter((x) => x.playable).map((x) => x.id);

describe("Dreieck & Konter", () => {
  it("beats folgt dem Dreieck", () => {
    expect(beats("angriff", "setup")).toBe(true);
    expect(beats("setup", "reaktion")).toBe(true);
    expect(beats("reaktion", "angriff")).toBe(true);
    expect(beats("setup", "angriff")).toBe(false);
    expect(beats("angriff", "angriff")).toBe(false);
  });

  it("counterWorks prüft die Tags", () => {
    expect(counterWorks(CARD.sprawl, CARD.double_leg)).toBe(true);
    expect(counterWorks(CARD.sprawl, CARD.jab)).toBe(false);
    expect(counterWorks(CARD.double_leg, CARD.sprawl)).toBe(false);
  });
});

describe("bestAnswer", () => {
  it("Sprawl gegen Double Leg", () => {
    const s = stateAt("dist", null, { hand: ["sprawl", "jab", "level_change"] });
    const a = bestAnswer(s, "p", "double_leg");
    expect(a.cardId).toBe("sprawl");
    expect(a.why.length).toBeGreaterThan(0);
    expect(words(a.why)).toBeLessThanOrEqual(20);
  });

  it("Setup gegen Reaktion, Angriff gegen Setup", () => {
    const s = stateAt("dist", null, { hand: ["level_change", "jab"] });
    expect(CARD[bestAnswer(s, "p", "sprawl").cardId!].kind).toBe("setup");
    expect(CARD[bestAnswer(s, "p", "level_change").cardId!].kind).toBe("angriff");
  });

  it("null, wenn nichts gewinnt", () => {
    const s = stateAt("dist", null, { hand: ["b_stance"] });
    // gegen einen Jab (Tempo 2) gewinnt höchstens Distanz halten – das ist eine Grundtechnik und spielbar
    expect(bestAnswer(s, "p", "jab").cardId).toBe("b_distance");
    const s2 = stateAt("dist", null, { hand: [], gas: 0 }, {}, { options: {} });
    const a = bestAnswer(s2, "p", "double_leg");
    // b_hips_back gibt es in der Distanz nicht; nur 0-Gas-Grundtechniken spielbar, keine kontert Shots
    expect(a.cardId === null || CARD[a.cardId].kind !== "reaktion").toBe(true);
  });
});

describe("coachHint", () => {
  const s = stateAt("dist", null, { hand: ["sprawl", "jab", "level_change", "double_leg", "collar_tie"] });

  it("Stufe 1 nennt keine Karte, 2 und 3 eine spielbare", () => {
    for (const intent of [null, "angriff", "setup", "reaktion"] as const) {
      const h1 = coachHint(s, "p", 1, intent);
      expect(h1.cardId).toBeUndefined();
      expect(h1.text.length).toBeGreaterThan(0);
      for (const lvl of [2, 3] as const) {
        const h = coachHint(s, "p", lvl, intent);
        expect(h.level).toBe(lvl);
        expect(playableIds(s)).toContain(h.cardId);
      }
    }
  });

  it("Absicht Angriff → Reaktion, die Shots kontert", () => {
    const h = coachHint(s, "p", 3, "angriff");
    expect(h.cardId).toBe("sprawl"); // Shots sind die gefährlichsten Angriffe aus der Distanz
    expect(h.text).toContain(CARD[h.cardId!].plain ?? CARD[h.cardId!].name);
  });

  it("Absicht Setup → Angriff", () => {
    expect(CARD[coachHint(s, "p", 2, "setup").cardId!].kind).toBe("angriff");
  });

  it("schließt mit Kontrolle ab", () => {
    const b = stateAt("back", "p", { hand: ["rnc"], control: 3 });
    expect(coachHint(b, "p", 2, null).cardId).toBe("rnc");
  });

  it("unten im Mount: raus", () => {
    const m = stateAt("mount", "o", { hand: ["upa", "jab"] });
    const h = coachHint(m, "p", 2, null);
    expect(["upa", "b_mount_shrimp", "elbow_knee"]).toContain(h.cardId);
  });

  it("Kontrolle aufbauen vor der Submission", () => {
    const b = stateAt("back", "p", { hand: ["rnc"], control: 0 });
    expect(CARD[coachHint(b, "p", 2, null).cardId!].kind).toBe("setup");
  });
});

/** Konstruiertes Verlust-Match: Spieler bereitet vor, Gegner schießt; unten in der Guard verliert er weiter. */
function losingMatch(): MatchState {
  let s = createMatch(STARTER_DECK, STARTER_DECK, 4, 12, {
    fixedHand: ["sprawl", "level_change", "jab", "hip_bump", "b_stance"],
  });
  s = { ...s, o: { ...s.o, hand: ["double_leg", "double_leg", "stack_pass", "jab", "level_change"] } };
  const rng = mulberry32(1);
  s = playTurn(s, "level_change", "double_leg", rng).state; // Shot erwischt das Setup → o oben in der Guard
  expect(s.pos).toBe("guard");
  expect(s.top).toBe("o");
  s = { ...s, o: { ...s.o, hand: ["stack_pass", ...s.o.hand.filter((x) => x !== "stack_pass")] } };
  const pc = playableIds(s).find((id) => CARD[id].kind === "setup")!;
  s = playTurn(s, pc, "stack_pass", rng).state; // Pass erwischt das Setup
  return s;
}

describe("recap", () => {
  it("findet Fehler, Lernsätze und den entscheidenden Moment", () => {
    const s = losingMatch();
    expect(s.history).toHaveLength(2);
    const r = recap(s);
    expect(r.lessons.length).toBeGreaterThan(0);
    expect(r.lessons.length).toBeLessThanOrEqual(3);
    expect(new Set(r.lessons).size).toBe(r.lessons.length);
    expect(r.mistakes.length).toBeGreaterThanOrEqual(1);
    const first = r.mistakes.find((m) => m.oCard === "double_leg")!;
    expect(first.id).toBe("dist|neutral|double_leg");
    expect(first.better).toBe("sprawl");
    expect(r.decisive).toBeDefined();
    expect(r.decisive!.record.winner).toBe("o");
    expect(r.decisive!.better).toBeDefined();
    expect(r.decisive!.why.length).toBeGreaterThan(0);
  });

  it("dedupliziert gleiche Fehler-Situationen", () => {
    let s = createMatch(STARTER_DECK, STARTER_DECK, 4, 12, { fixedHand: ["sprawl", "level_change"] });
    const rng = mulberry32(2);
    // Zweimal Setup gegen Double Leg in der Distanz – via Zurücksetzen der Position
    for (let i = 0; i < 2; i++) {
      s = { ...s, pos: "dist", top: null, o: { ...s.o, hand: ["double_leg", ...s.o.hand.slice(1)], gas: 12 } };
      s = playTurn(s, "level_change", "double_leg", rng).state;
    }
    expect(recap(s).mistakes.filter((m) => m.id === "dist|neutral|double_leg")).toHaveLength(1);
  });

  it("leeres Match → leerer Rückblick", () => {
    const r = recap(createMatch(STARTER_DECK, STARTER_DECK, 1));
    expect(r).toEqual({ lessons: [], mistakes: [] });
  });
});

describe("mistakeQuestion", () => {
  it("3 verschiedene Optionen inkl. Antwort", () => {
    const m = recap(losingMatch()).mistakes[0];
    const q = mistakeQuestion(m);
    expect(q.options).toHaveLength(3);
    expect(new Set(q.options).size).toBe(3);
    expect(q.options).toContain(q.answer);
    expect(q.answer).toBe(m.better);
    expect(q.q).toContain(CARD[m.oCard].name);
    for (const id of q.options) expect(CARD[id].slots.some((sl) => sl.pos === m.pos && sl.role === m.role)).toBe(true);
    expect(mistakeQuestion(m)).toEqual(q); // deterministisch ohne rng
  });
});
