import { describe, expect, it } from "vitest";
import { chooseCard, predictKind } from "./ai";
import { createMatch, playTurn, playableCards } from "./match";
import { mulberry32, pick } from "./rng";
import { stateAt } from "./testUtils";
import { ARCHETYPES } from "../data/campaign";
import { CARD } from "../data/cards";
import type { MatchResult, PositionId } from "./types";

describe("KI", () => {
  it("predictKind: häufigster Typ der letzten 3", () => {
    expect(predictKind([])).toBeNull();
    expect(predictKind(["setup", "angriff", "angriff"])).toBe("angriff");
    expect(predictKind(["angriff", "angriff", "reaktion", "setup", "setup"])).toBe("setup");
  });

  it("wählt nur spielbare Karten", () => {
    const arch = ARCHETYPES[5];
    const rng = mulberry32(9);
    for (let i = 0; i < 50; i++) {
      const s = createMatch(arch.deck, arch.deck, i);
      const { card } = chooseCard(s, arch, rng);
      expect(playableCards(s, "o").find((x) => x.id === card)?.playable).toBe(true);
    }
  });

  it("schließt ab, wenn die Kontrolle reicht", () => {
    const arch = ARCHETYPES.find((a) => a.id === "br_backtaker")!;
    const s = stateAt("back", "o", {}, { hand: ["rnc", "seatbelt_hooks"], control: 3 }, { backPointsAwarded: { p: false, o: true } });
    const picks: Record<string, number> = {};
    const rng = mulberry32(1);
    for (let i = 0; i < 40; i++) {
      const c = chooseCard(s, { ...arch, reads: 0 }, rng).card;
      picks[c] = (picks[c] ?? 0) + 1;
    }
    expect(picks.rnc ?? 0).toBeGreaterThan(20);
  });

  it("Yomi: hohe reads kontern ein klares Muster", () => {
    const arch = { ...ARCHETYPES[ARCHETYPES.length - 1], reads: 1, likes: {} };
    const s = stateAt("clinch", null, { history: ["angriff", "angriff", "angriff"] }, { hand: ["head_up", "collar_tie", "snap_down", "frames_hips_back", "sprawl"] });
    const rng = mulberry32(3);
    let reactions = 0;
    for (let i = 0; i < 40; i++) if (CARD[chooseCard(s, arch, rng).card].kind === "reaktion") reactions++;
    expect(reactions).toBeGreaterThan(25);
  });

  it("telegraph = 0 zeigt nie eine Absicht", () => {
    const s = createMatch(ARCHETYPES[0].deck, ARCHETYPES[0].deck, 1);
    expect(chooseCard(s, { ...ARCHETYPES[0], telegraph: 0 }, mulberry32(1)).intent).toBeNull();
    expect(chooseCard(s, { ...ARCHETYPES[0], telegraph: 1 }, mulberry32(1)).intent).not.toBeNull();
  });
});

describe("Simulation: 500 KI-gegen-KI-Matches", () => {
  it("wirft nie, endet immer, mischt Submission- und Punkte-Ausgänge", () => {
    const rng = mulberry32(2026);
    const dist = { submission: 0, points: 0, draw: 0 };
    const subCards: Record<string, number> = {};
    const posSeen = new Set<PositionId>();
    let totalTurns = 0;

    for (let m = 0; m < 500; m++) {
      const pa = pick(ARCHETYPES, rng);
      const oa = pick(ARCHETYPES, rng);
      let s = createMatch(pa.deck, oa.deck, Math.floor(rng() * 1e9));
      let guard = 0;
      while (!s.result) {
        // Spieler-KI sieht sich spiegelbildlich: wir lassen sie als Seite "p" wählen
        const pc = chooseCard(s, pa, rng, "p").card;
        const oc = chooseCard(s, oa, rng, "o").card;
        s = playTurn(s, pc, oc, rng).state;
        posSeen.add(s.pos);
        if (++guard > 20) throw new Error("Match endet nicht");
      }
      totalTurns += s.turn - 1;
      const r: MatchResult = s.result;
      if (r.type === "submission") {
        dist.submission++;
        subCards[r.card] = (subCards[r.card] ?? 0) + 1;
      } else if (r.winner) dist.points++;
      else dist.draw++;
    }

    console.log("Simulation 500 Matches:", dist, "Ø Züge:", (totalTurns / 500).toFixed(1));
    console.log("Submissions nach Karte:", subCards);
    console.log("Erreichte Positionen:", [...posSeen].join(", "));

    expect(dist.submission + dist.points + dist.draw).toBe(500);
    expect(dist.submission).toBeGreaterThan(25);
    expect(dist.points).toBeGreaterThan(25);
    expect(posSeen.size).toBe(7);
  });
});

describe("KI: scriptedKind (Tutorial)", () => {
  it("spielt nur Karten des vorgegebenen Typs, falls möglich", () => {
    const arch = ARCHETYPES[0];
    const rng = mulberry32(4);
    for (const kind of ["angriff", "setup", "reaktion"] as const) {
      for (let i = 0; i < 20; i++) {
        const s = createMatch(arch.deck, arch.deck, i, 12, { scriptedKind: kind });
        expect(CARD[chooseCard(s, arch, rng).card].kind).toBe(kind);
      }
    }
  });

  it("fällt zurück, wenn kein Karte des Typs spielbar ist", () => {
    const arch = ARCHETYPES[0];
    const base = stateAt("dist", null, {}, { hand: [], gas: 0 });
    const s = { ...base, options: { scriptedKind: "angriff" as const } };
    // 0 Gas: Close the Distance (1 Gas) unmöglich → nur Setup/Reaktion
    expect(CARD[chooseCard(s, arch, mulberry32(1)).card].kind).not.toBe("angriff");
  });
});
