import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PRACTICE_MAX, practiceIds, practiceTopics } from "./practice";
import { Q_BY_ID } from "./questions";

describe("Üben: Fragen des 7-Tage-Starts statt Klassik-Rätsel (UX-Review 2, Punkt 3)", () => {
  it("vor Tag 1 ist kein Thema offen; nach Tag 1 nur Positionen und Abklopfen", () => {
    expect(practiceTopics(0).every((t) => !t.open)).toBe(true);
    expect(practiceIds(null, 0)).toEqual([]);
    const open1 = practiceTopics(1).filter((t) => t.open).map((t) => t.topic).sort();
    expect(open1).toEqual(["abklopfen", "positionen"]);
  });

  it("Themen öffnen sich Tag für Tag; Fragen nur aus geschafften Tagen", () => {
    const t = practiceTopics(3);
    expect(t.find((x) => x.topic === "side")!.open).toBe(true);
    expect(t.find((x) => x.topic === "guard")!).toMatchObject({ open: false, day: 4, count: 0 });
    for (let seed = 1; seed < 20; seed++) {
      const ids = practiceIds(null, 3, seed);
      expect(ids.length).toBe(PRACTICE_MAX);
      for (const id of ids) expect(Q_BY_ID[id].day).toBeLessThanOrEqual(3);
    }
    expect(practiceIds("mount", 6, 5).every((id) => Q_BY_ID[id].topic === "mount")).toBe(true);
    expect(practiceTopics(7).every((x) => x.open)).toBe(true);
  });

  it("der Tab „Üben“ lädt die Klassik-Rätsel nicht mehr", () => {
    const src = readFileSync(new URL("../home/UebenTab.tsx", import.meta.url), "utf8");
    expect(src).not.toMatch(/screens\/Puzzles/);
    expect(readFileSync(new URL("../home/KlassikScreen.tsx", import.meta.url), "utf8")).toMatch(/screens\/Puzzles/);
  });
});
