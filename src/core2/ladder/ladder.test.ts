import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mulberry32 } from "../../engine/rng";
import {
  BELT_TIERS, GATE_LEN, GATE_LEVEL, HONESTY, MMR_START, STRIPES, TOP, eloUpdate, framesOwned, inGate, newLadder, pickFoe, recordResult,
  rollSeason, sanitizeLadder, seasonName, seasonOf, targetRating, tierWeights, type LadderState, type MatchResult,
} from "./ladder";
import { LADDER_KEY, readLadder, writeLadder } from "./store";
import { LadderCard } from "./LadderBelt";
import { Rangliste } from "../ui/Rangliste";
import { REWARDS, applyEvent, emptyRewards, maxDailyRepeatablePacks, rewardReason } from "../rewards/table";

const mem = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => { mem.set(k, v); },
  removeItem: (k: string) => { mem.delete(k); },
};
beforeEach(() => mem.clear());

const D = "2026-11-06";
const at = (belt: number, stripes: number, extra: Partial<LadderState> = {}): LadderState => {
  const s = { ...newLadder(42, D), belt, stripes, ...extra };
  return { ...s, next: pickFoe(s) };
};
const play = (s: LadderState, ...rs: MatchResult[]) => rs.reduce((x, r) => recordResult(x, r).state, s);

describe("B77 Streifen und Gürtel", () => {
  it("Sieg gibt einen Streifen, Niederlage nimmt einen", () => {
    const s = play(at(1, 1), "win");
    expect([s.belt, s.stripes]).toEqual([1, 2]);
    expect(play(s, "loss").stripes).toBe(1);
  });
  it("Weiß-Schutz: auf Weiß kostet eine Niederlage keinen Streifen, auch nicht in der Prüfung", () => {
    expect(play(at(0, 2), "loss").stripes).toBe(2);
    expect(play(at(0, STRIPES), "loss").stripes).toBe(STRIPES);
  });
  it("Untergrenze: nie unter den aktuellen Gürtel", () => {
    const s = play(at(2, 1), "loss", "loss", "loss", "loss");
    expect([s.belt, s.stripes]).toEqual([2, 0]);
  });
  it("Unentschieden ändert nichts (außerhalb der Prüfung)", () => {
    const s0 = at(1, 2, { streak: 2 });
    const s = play(s0, "draw");
    expect([s.belt, s.stripes, s.streak]).toEqual([1, 2, 2]);
  });
  it("Siegesserie: ab dem 3. Sieg in Folge Bonus-Streifen – nur auf Weiß und Blau, nie über die Prüfung hinaus", () => {
    const w = recordResult(at(0, 0, { streak: 2 }), "win");
    expect(w.state.stripes).toBe(2);
    expect(w.info.bonus).toBe(true);
    const l = recordResult(at(2, 0, { streak: 2 }), "win");
    expect(l.state.stripes).toBe(1);
    const cap = recordResult(at(1, 3, { streak: 5 }), "win");
    expect(cap.state.stripes).toBe(STRIPES);
    expect(cap.state.belt).toBe(1);
  });
  it("keine Strafe für Niederlagen-Serien: jede Niederlage nimmt genau einen Streifen", () => {
    const s = play(at(1, 4 - 1), "loss", "loss");
    expect(s.stripes).toBe(1);
  });
});

describe("B79 Gürtelprüfung", () => {
  it("bei 4 Streifen kommt ein Boss; Stufe 2 von Weiß nach Blau, sonst Stufe 3", () => {
    for (let b = 0; b < TOP; b++) {
      const s = at(b, STRIPES);
      expect(inGate(s)).toBe(true);
      expect(s.next.boss).toBeDefined();
      expect(s.next.level).toBe(GATE_LEVEL[b]);
      expect(s.next.gate).toEqual({ n: 1, of: GATE_LEN[b] });
    }
  });
  it("Prüfung bestanden → nächster Gürtel mit 0 Streifen; höhere Gürtel brauchen mehr Bosse in Folge", () => {
    for (let b = 0; b < TOP; b++) {
      let s = at(b, STRIPES);
      const seen: string[] = [];
      for (let k = 0; k < GATE_LEN[b]; k++) {
        expect(s.belt).toBe(b);
        seen.push(s.next.boss!);
        const r = recordResult(s, "win");
        s = r.state;
        if (k < GATE_LEN[b] - 1) expect(r.info.gateStep).toBe(true);
        else expect(r.info.promoted).toBe(b + 1);
      }
      expect([s.belt, s.stripes, s.promo, s.best]).toEqual([b + 1, 0, b + 1, b + 1]);
      expect(new Set(seen).size).toBe(seen.length); // kein Boss doppelt in einer Prüfung
    }
  });
  it("Prüfung verloren (oder unentschieden) → ein Streifen weg, Prüfung beginnt neu", () => {
    const s = play(at(2, STRIPES), "win", "loss");
    expect([s.belt, s.stripes, s.gate]).toEqual([2, STRIPES - 1, 0]);
    const d = play(at(1, STRIPES), "draw");
    expect([d.belt, d.stripes]).toEqual([1, STRIPES - 1]);
  });
  it("Schwarz ist oben: keine Prüfung mehr, Streifen höchstens 4", () => {
    const s = play(at(TOP, STRIPES), "win", "win");
    expect(inGate(s)).toBe(false);
    expect([s.belt, s.stripes]).toEqual([TOP, STRIPES]);
    expect(s.next.boss).toBeUndefined();
  });
});

describe("B80 Gegnerwahl und versteckte Wertung", () => {
  it("Gegner-Stufen hängen vom Gürtel ab", () => {
    expect(BELT_TIERS.weiss).toEqual(["l1", "l2"]);
    expect(BELT_TIERS.blau).toEqual(["l2", "l3"]);
    for (const b of ["lila", "braun", "schwarz"] as const) expect(BELT_TIERS[b].every((t) => t === "l3" || t === "konter")).toBe(true);
  });
  it("höhere Wertung und mehr Streifen → stärkere Gegner (innerhalb des Gürtels)", () => {
    const w = (mmr: number, stripes: number) => tierWeights({ belt: 1, mmr, stripes }).find((x) => x.tier === "l3")!.w;
    expect(w(1200, 0)).toBeGreaterThan(w(900, 0));
    expect(w(900, 3)).toBeGreaterThan(w(900, 0));
    expect(targetRating({ mmr: 900, stripes: 2 })).toBe(1050);
    const sum = tierWeights({ belt: 0, mmr: MMR_START, stripes: 1 }).reduce((n, x) => n + x.w, 0);
    expect(sum).toBeCloseTo(1, 9);
  });
  it("Elo: Sieg gegen Stärkere bringt mehr als gegen Schwächere, Niederlage senkt", () => {
    expect(eloUpdate(900, 1200, "win", 20) - 900).toBeGreaterThan(eloUpdate(900, 800, "win", 20) - 900);
    expect(eloUpdate(900, 900, "loss", 20)).toBeLessThan(900);
    expect(eloUpdate(900, 900, "draw", 20)).toBe(900);
  });
  it("Gegner sind seed-fest", () => {
    const a = at(1, 2), b = at(1, 2);
    expect(a.next).toEqual(b.next);
  });
  it("Klettern endet nie in einer Schleife und bleibt nach 30 Kämpfen über Weiß 2 Streifen (Modell-Wahrscheinlichkeiten)", () => {
    const P: Record<string, number> = { l1: 0.6, l2: 0.5, l3: 0.15, konter: 0.13, b2: 0.47, b3: 0.11 };
    const rng = mulberry32(5);
    for (let i = 0; i < 40; i++) {
      let s = newLadder(100 + i, D);
      for (let g = 1; g <= 200; g++) {
        const f = s.next;
        const p = P[f.boss ? `b${f.level}` : f.tier];
        s = recordResult(s, rng() < p ? "win" : "loss").state;
        expect(s.next).toBeTruthy();
        if (g >= 30) expect(s.belt * (STRIPES + 1) + s.stripes).toBeGreaterThanOrEqual(2);
      }
      expect(s.games).toBe(200);
    }
  });
});

describe("B81 Saison", () => {
  it("Saison = Monat, nur der Name (kein Countdown)", () => {
    expect(seasonOf(D)).toBe("2026-11");
    expect(seasonName("2026-11")).toBe("Saison November 2026");
    expect(seasonName("2027-03")).not.toMatch(/\d+\s*(Tage|Std|h|min)/);
  });
  it("weicher Reset: Gürtel bleibt, Streifen auf 0, Rahmen für den höchsten Gürtel der alten Saison", () => {
    const s = rollSeason(at(2, 3, { best: 2, streak: 4 }), "2026-12-01");
    expect([s.belt, s.stripes, s.streak, s.season]).toEqual([2, 0, 0, "2026-12"]);
    expect(s.frames).toEqual([{ season: "2026-11", belt: 2 }]);
    expect(s.seasonNote).toEqual({ from: "2026-11", belt: 2 });
    expect(framesOwned(s)).toEqual([0, 1, 2]);
    expect(rollSeason(s, "2026-12-30")).toBe(s); // gleiche Saison: nichts
  });
  it("mitten in der Prüfung: Saisonwechsel beginnt wieder bei 0 Streifen, Gürtel bleibt", () => {
    const s = rollSeason(play(at(3, STRIPES), "win"), "2027-01-02");
    expect([s.belt, s.stripes, s.gate]).toEqual([3, 0, 0]);
  });
});

describe("Speicher", () => {
  it("speichert und lädt (resume-sicher), kaputte Daten werden verworfen", () => {
    const s = play(at(1, 1), "win");
    writeLadder(s);
    const r = readLadder(D)!;
    expect([r.belt, r.stripes, r.mmr, r.next]).toEqual([s.belt, s.stripes, s.mmr, s.next]);
    mem.set(LADDER_KEY, JSON.stringify({ v: 1, belt: 9, stripes: -2 }));
    expect(readLadder(D)).toBeNull();
    expect(sanitizeLadder("kaputt", D)).toBeNull();
  });
  it("neuer Schlüssel steht in der Datenschutzerklärung", () => {
    expect(readFileSync("public/landing/datenschutz.html", "utf8")).toContain(`<code>${LADDER_KEY}</code>`);
  });
});

describe("B82 Belohnung (Ethik)", () => {
  const ev = (belt: string, season = "2026-11") => ({ type: "ladder_belt" as const, belt, season, name: "Blaugurt" });
  it("neuer Gürtel: 1 Paket, je Gürtel einmal pro Saison", () => {
    let st = emptyRewards(D), packs = 0;
    for (const e of [ev("blau"), ev("blau"), ev("lila"), ev("blau", "2026-12")]) {
      const r = applyEvent(st, e, D); st = r.state; packs += r.grant?.packs ?? 0;
    }
    expect(packs).toBe(3);
    expect(rewardReason(ev("blau"))).toContain("Spielrang");
  });
  it("echtes Training bleibt die größte wiederholbare Belohnung; Tagesmaximum unverändert", () => {
    expect(REWARDS.ladder_belt.perDay).toBeNull();
    expect(REWARDS.ladder_belt.onceKey).not.toBeNull();
    expect(REWARDS.ladder_belt.packs * 40 + REWARDS.ladder_belt.staub).toBeLessThan(REWARDS.training_logged.packs * 40 + REWARDS.training_logged.staub);
    expect(maxDailyRepeatablePacks()).toBe(4);
  });
});

describe("Ehrlichkeit", () => {
  it("der Satz zu echten Gürteln steht im Code und auf den Bildschirmen", () => {
    expect(HONESTY).toBe("Das ist ein Spielrang, kein echter Gürtel – den vergibt nur dein Trainer.");
    const html = renderToStaticMarkup(createElement(Rangliste, { onBack: () => {} }));
    expect(html).toContain(HONESTY);
    expect(html).toContain("Saison November 2026".slice(0, 6));
    expect(html).not.toMatch(/endet in|noch \d+ Tage|nur heute|Countdown/i);
    expect(renderToStaticMarkup(createElement(LadderCard, { onOpen: () => {} }))).toContain("kein echter Gürtel");
  });
});
