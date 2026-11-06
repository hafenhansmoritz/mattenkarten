import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mulberry32 } from "../../engine/rng";
import { aiChoose, legalCards, newMatch, PASS, playRound, roleOf, setCardRegistry, slotCards, cardById } from "../engine";
import { ZONES } from "../types";
import { TUTORIALS_K2 } from "../data/tutorials";
import { LESSONS_PROGRAM } from "../../program/lessons";
import { filterHandByZones, hiddenZones } from "./disclosure";
import { outcomeOf, predictionFeedback, shouldPredict } from "./predict";

beforeAll(() => setCardRegistry(null));
afterAll(() => setCardRegistry(null));

const ALL = [...TUTORIALS_K2, ...LESSONS_PROGRAM];
const byId = (id: string) => ALL.find((t) => t.id === id)!;

describe("Schrittweises Aufdecken (zones)", () => {
  it("ohne zones: alles sichtbar", () => {
    expect(hiddenZones(undefined)).toEqual([]);
    const s = newMatch({ seed: 1, start: { pos: "mount", top: "o" } });
    const hand = slotCards(s.pos, roleOf(s, "p"));
    expect(filterHandByZones(hand, legalCards(s, "p"))).toBe(hand);
  });

  it("Lektion „Raus von unten“: nur Beine und Hüfte, Tutorial-Karten bleiben sichtbar", () => {
    const t = byId("k2-raus-von-unten");
    expect(t.zones).toEqual(["beine", "huefte"]);
    expect(hiddenZones(t.zones).sort()).toEqual(["arme", "kopf"]);
    const s = newMatch({ seed: 1, start: t.start, goal: t.goal, grips: t.grips });
    const shown = filterHandByZones(slotCards(s.pos, roleOf(s, "p")), legalCards(s, "p"), t.zones, "mb_knee_inside");
    expect(shown.length).toBeGreaterThan(0);
    for (const c of shown) expect(["beine", "huefte"]).toContain(c.zone);
    expect(shown.map((c) => c.id)).toContain("mb_knee_inside");
    expect(shown.map((c) => c.id)).toContain("mb_elbow_escape");
  });

  it("Lektion „Keile bauen“: Hüfte, Beine, Arme; spätere Lektionen alle Zonen", () => {
    expect(byId("k2-keile-vorbeigehen").zones?.slice().sort()).toEqual(["arme", "beine", "huefte"]);
    expect(byId("k2-erst-griff-dann-beenden").zones).toBeUndefined();
    for (const t of LESSONS_PROGRAM) expect(hiddenZones(t.zones), t.id).toEqual([]);
  });

  it("geforderte Karte aus versteckter Zone bleibt sichtbar", () => {
    const s = newMatch({ seed: 1, start: { pos: "guard", top: "p" } });
    const hand = slotCards(s.pos, roleOf(s, "p"));
    const shown = filterHandByZones(hand, legalCards(s, "p"), ["beine"], "gt_posture");
    expect(shown.map((c) => c.id)).toContain("gt_posture");
    expect(shown.filter((c) => c.zone === "kopf").map((c) => c.id)).toEqual(["gt_posture"]);
  });

  it("ist keine sichtbare Karte spielbar, kommen spielbare aus versteckten Zonen dazu", () => {
    const s = newMatch({ seed: 1, start: { pos: "mount", top: "o" } });
    const hand = slotCards(s.pos, roleOf(s, "p"));
    // Künstlich: alles in Beinen/Hüfte gesperrt, nur eine Arm-Karte frei.
    const armCard = hand.find((c) => c.zone === "arme")!;
    const legal = hand.map((c) => ({ id: c.id, ok: c.id === armCard.id }));
    const shown = filterHandByZones(hand, legal, ["beine", "huefte"]);
    expect(shown.map((c) => c.id)).toContain(armCard.id);
    // Nicht spielbare Karten anderer versteckter Zonen bleiben weg.
    for (const c of shown) if (c.id !== armCard.id) expect(["beine", "huefte"]).toContain(c.zone);
  });

  it("jede Lektion mit zones: an jedem Zug ist mindestens eine sichtbare Karte spielbar oder Passen", () => {
    for (const t of ALL.filter((x) => x.zones)) {
      for (let seed = 1; seed <= 15; seed++) {
        let s = newMatch({ seed, maxRounds: t.maxRounds, start: t.start, goal: t.goal, grips: t.grips });
        const rng = mulberry32(seed);
        while (!s.result) {
          const legal = legalCards(s, "p");
          const shown = filterHandByZones(slotCards(s.pos, roleOf(s, "p")), legal, t.zones);
          const anyLegal = legal.some((l) => l.ok);
          const okShown = shown.filter((c) => legal.find((l) => l.id === c.id)?.ok);
          expect(anyLegal ? okShown.length > 0 : true, `${t.id} R${s.round}`).toBe(true);
          const pId = okShown.length ? okShown[Math.floor(rng() * okShown.length)].id : PASS;
          s = playRound(s, pId, aiChoose(s, "o", t.aiLevel, rng)).state;
        }
      }
    }
  });
});

describe("Vorhersage vor dem Aufdecken", () => {
  it("Lektionen 1–2 fragen jede Runde, sonst nur markierte Runden", () => {
    expect(shouldPredict(byId("k2-raus-von-unten"), 5)).toBe(true);
    expect(shouldPredict(byId("p-side-escape"), 1)).toBe(true);
    expect(shouldPredict(byId("p-guard-posture"), 2)).toBe(true);
    expect(shouldPredict(byId("p-guard-posture"), 3)).toBe(false);
    expect(shouldPredict(byId("k2-erst-griff-dann-beenden"), 1)).toBe(false);
    expect(shouldPredict(undefined, 1)).toBe(false);
  });

  it("Rahmen in derselben Zone stoppt den Angriff → „Er stoppt dich“", () => {
    const s = newMatch({ seed: 3, start: { pos: "mount", top: "o", board: { beine: 0, huefte: 0 } } });
    expect(legalCards(s, "p").find((l) => l.id === "mb_elbow_escape")?.ok).toBe(true);
    const frame = slotCards(s.pos, roleOf(s, "o")).find((c) => c.kind === "rahmen" && c.zone === "beine")!;
    const { round } = playRound(s, "mb_elbow_escape", frame.id);
    expect(round.winner).toBe("o");
    expect(outcomeOf(round)).toBe("stopped");
    expect(predictionFeedback("stopped", round).ok).toBe(true);
    expect(predictionFeedback("win", round).ok).toBe(false);
  });

  it("Passen → „Nichts passiert“", () => {
    const s = newMatch({ seed: 3, start: { pos: "mount", top: "o" } });
    const o = slotCards(s.pos, roleOf(s, "o")).find((c) => c.kind === "aufbauen")!;
    expect(outcomeOf(playRound(s, PASS, o.id).round)).toBe("nothing");
  });

  it("Ableitung ist rein und passt zur aufgedeckten Runde (viele Zufallsrunden)", () => {
    for (const t of ALL) {
      for (let seed = 1; seed <= 6; seed++) {
        let s = newMatch({ seed, maxRounds: t.maxRounds, start: t.start, goal: t.goal, grips: t.grips });
        const rng = mulberry32(seed * 7);
        while (!s.result) {
          const before = JSON.stringify(s);
          const pId = aiChoose(s, "p", 1, rng);
          const oId = aiChoose(s, "o", t.aiLevel, rng);
          const { state, round } = playRound(s, pId, oId);
          expect(JSON.stringify(s), "playRound verändert s nicht").toBe(before);
          const o = outcomeOf(round);
          const pc = cardById(pId), oc = cardById(oId);
          if (o === "win") expect(["p", "both"]).toContain(round.winner);
          if (o === "stopped") { expect(round.winner).toBe("o"); expect(pc?.zone).toBe(oc?.zone); }
          if (o === "nothing") expect(["p", "both"]).not.toContain(round.winner);
          // Dieselbe Runde zweimal berechnet → gleiches Ergebnis (Vorhersage = Aufdecken).
          expect(outcomeOf(playRound(s, pId, oId).round)).toBe(o);
          s = state;
        }
      }
    }
    expect(ZONES.length).toBe(4);
  });
});
