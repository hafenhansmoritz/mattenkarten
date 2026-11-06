import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mulberry32 } from "../engine/rng";
import { aiChoose, aiChooseLesson, cardById, legalCards, newMatch, playRound, roleOf, setCardRegistry, slotCards } from "../core2/engine";
import { filterHandByLevel, foeRules, uiFeatures } from "../core2/ui/disclosure";
import { TUTORIALS_K2 } from "../core2/data/tutorials";
import { DAYS } from "./days";
import type { State2 } from "../core2/types";
import type { TutorialK2Def } from "../core2/ui/tutorialTypes";
import { CARD2, SLOTS2 } from "../core2/data/cards";
import { LESSONS_PROGRAM } from "./lessons";

beforeAll(() => setCardRegistry(null));
afterAll(() => setCardRegistry(null));

const SEEDS = Array.from({ length: 30 }, (_, i) => i * 101 + 7);
const words = (s: string) => s.trim().split(/\s+/).filter((w) => w !== "–" && w !== "-").length;
const VALID_SLOT = new Set(SLOTS2.map((s) => `${s.pos}:${s.role}`));

/** Wie ArenaK2: requireCard aus dem pick-Schritt, sonst aus der Start-Blase der Runde. */
function requiredCard(t: TutorialK2Def, round: number): string | undefined {
  const here = t.steps.filter((st) => st.round == null || st.round === round);
  return here.find((st) => st.when === "pick")?.requireCard ?? here.find((st) => st.when === "start" && st.requireCard)?.requireCard;
}

/** Sichtbare Hand wie in ArenaK2 (Stufe: Zonen und Kartenarten). */
function visibleIds(t: TutorialK2Def, s: State2, req?: string): Set<string> {
  return new Set(filterHandByLevel(slotCards(s.pos, roleOf(s, "p")), legalCards(s, "p"), uiFeatures(t), req).map((c) => c.id));
}

/**
 * Wie ArenaK2 im Tutorial: Gegner = Lektions-KI (aktive Zonen, Skript, Vorliebe), Seed = mulberry(seed || 1).
 * Spieler: folgt requireCard, sonst Stufe 3 – aber nur mit Karten, die er sieht. moves: feste Spielerzüge (Wiederholung).
 */
export function runLesson(t: TutorialK2Def, oSeed: number, pSeed: number, moves?: string[]) {
  let s = newMatch({ seed: oSeed, maxRounds: t.maxRounds, start: t.start, goal: t.goal, grips: t.grips, chains: t.chains, konter: t.konter });
  const oRng = mulberry32(oSeed || 1);
  const pRng = mulberry32(pSeed ^ 0x9e3779b9);
  const rules = foeRules(t);
  const log: string[] = [];
  const played: string[] = [];
  while (!s.result) {
    const req = requiredCard(t, s.round);
    if (req) {
      const l = legalCards(s, "p").find((x) => x.id === req);
      expect(l?.ok, `${t.id} Runde ${s.round}: ${req} muss spielbar sein (seed ${oSeed}) – ${l?.reason ?? "nicht im Slot"}`).toBe(true);
    }
    const vis = visibleIds(t, s, req);
    const p = moves?.[played.length] ?? req ?? aiChoose(s, "p", 3, pRng, undefined, (c) => vis.has(c.id));
    const o = aiChooseLesson(s, "o", t.aiLevel, oRng, rules);
    const r = playRound(s, p, o);
    played.push(p);
    log.push(`${r.round.round}: ${p} / ${o} → ${r.state.pos}`);
    s = r.state;
  }
  return { s, log, played };
}

const reached = (t: TutorialK2Def, s: State2) =>
  t.goal ? s.result?.type === "goal" && s.result.winner === "p" : s.result?.type === "tap" && s.result.winner === "p";

describe("Startprogramm – neue Kern-2-Lektionen", () => {
  it("IDs eindeutig, Slots gültig, Karten existieren", () => {
    const ids = LESSONS_PROGRAM.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of LESSONS_PROGRAM) {
      const s = newMatch({ seed: 1, start: t.start, grips: t.grips, chains: t.chains });
      expect(VALID_SLOT.has(`${s.pos}:${roleOf(s, "p")}`), t.id).toBe(true);
      for (const g of t.goal ?? []) expect(VALID_SLOT.has(`${g.pos}:${g.role}`), `${t.id} goal`).toBe(true);
      for (const st of t.steps) if (st.requireCard) expect(CARD2[st.requireCard], st.requireCard).toBeDefined();
    }
  });

  it("Texte: ≤ 25 Wörter pro Schritt, Idee ≤ 15 Wörter, du-Form", () => {
    for (const t of LESSONS_PROGRAM) {
      expect(words(t.idea), t.idea).toBeLessThanOrEqual(15);
      for (const st of t.steps) {
        expect(words(st.text), st.text).toBeLessThanOrEqual(25);
        expect(st.text).not.toMatch(/\bSie\b|\bIhr(e|en)?\b/);
      }
    }
  });

  for (const t of LESSONS_PROGRAM) {
    it(`${t.title}: fester Seed + Skript-Gegner – 100 % der Spielerläufe; andere Seeds ≥ 90 %`, () => {
      expect(t.seed, `${t.id}: fester Seed`).toBeTypeOf("number");
      const fails: string[] = [];
      for (const pSeed of SEEDS) {
        const { s, log } = runLesson(t, t.seed!, pSeed);
        if (!reached(t, s)) fails.push(`${pSeed}: ${log.join(" | ")} → ${JSON.stringify(s.result)}`);
      }
      expect(fails, fails.slice(0, 3).join("\n")).toEqual([]);
      let ok = 0;
      for (const seed of SEEDS) if (reached(t, runLesson(t, seed, seed).s)) ok++;
      expect(ok / SEEDS.length).toBeGreaterThanOrEqual(0.9);
    });
  }
});

const ALL_LESSONS: TutorialK2Def[] = [...TUTORIALS_K2, ...LESSONS_PROGRAM];

describe("Lektionen: Gegner nur in aktiven Zonen, deterministisch (UX-Review 06.11.)", () => {
  it("jede Lektion hat einen festen Seed", () => {
    for (const t of ALL_LESSONS) expect(t.seed, t.id).toBeTypeOf("number");
  });

  it("Gegner spielt nie Karten aus versteckten Zonen und keine unerlaubte Aufgabe (auch bei zufälligen Spielerzügen)", () => {
    for (const t of ALL_LESSONS) {
      const f = uiFeatures(t);
      const rules = foeRules(t, f);
      for (let seed = 1; seed <= 25; seed++) {
        let s = newMatch({ seed, maxRounds: t.maxRounds, start: t.start, goal: t.goal, grips: t.grips, chains: t.chains, konter: t.konter });
        const rng = mulberry32(seed), oRng = mulberry32(seed * 31 + 1);
        while (!s.result) {
          const vis = [...visibleIds(t, s)].filter((id) => legalCards(s, "p").find((l) => l.id === id)?.ok);
          const p = vis.length ? vis[Math.floor(rng() * vis.length)] : "pass";
          const o = aiChooseLesson(s, "o", t.aiLevel, oRng, rules);
          const c = cardById(o.split("&")[0]);
          if (c) {
            expect(f.zones, `${t.id} R${s.round}: ${c.id}`).toContain(c.zone);
            if (c.submission && rules.subs) expect(rules.subs, `${t.id}: ${c.id}`).toContain(c.submission.id);
            if (f.level <= 2) expect(c.submission, `${t.id}: Stufe 2 ohne gegnerische Aufgabe`).toBeUndefined();
          }
          s = playRound(s, p, o).state;
        }
      }
    }
  });

  it("day-2 lesson: opponent never plays a card in a hidden zone over 200 random player policies", () => {
    const t = TUTORIALS_K2.find((x) => x.id === "k2-raus-von-unten")!;
    expect(DAYS.find((d) => d.n === 2)!.lessons).toEqual([{ kind: "k2", id: t.id }]);
    const rules = foeRules(t);
    for (let k = 0; k < 200; k++) {
      // Gegner wie in ArenaK2: fester Lektions-Seed. Spieler: zufällig – gerade Läufe nur sichtbare Karten, ungerade jede legale Karte.
      let s = newMatch({ seed: t.seed!, maxRounds: t.maxRounds, start: t.start, goal: t.goal, grips: t.grips, chains: t.chains, konter: t.konter });
      const oRng = mulberry32(t.seed! || 1), pRng = mulberry32(k * 7919 + 13);
      while (!s.result) {
        const legal = legalCards(s, "p").filter((l) => l.ok).map((l) => l.id);
        const vis = visibleIds(t, s);
        const pool = k % 2 === 0 ? legal.filter((id) => vis.has(id)) : legal;
        const p = pool.length ? pool[Math.floor(pRng() * pool.length)] : "pass";
        const o = aiChooseLesson(s, "o", t.aiLevel, oRng, rules);
        const c = cardById(o.split("&")[0]);
        if (c) {
          expect(["huefte", "beine"], `Politik ${k} R${s.round}: ${c.id}`).toContain(c.zone);
          expect(c.submission, `Politik ${k} R${s.round}: ${c.id}`).toBeUndefined();
        }
        s = playRound(s, p, o).state;
        // Keine gegnerische Aufgabe-Leiste – weder begonnen noch fortgesetzt noch beendet.
        expect(s.subs.filter((x) => x.owner === "o"), `Politik ${k}`).toEqual([]);
        if (s.result?.type === "tap") expect(s.result.winner, `Politik ${k}: kein Tap durch ihn`).not.toBe("o");
      }
    }
  });

  it("gleiche Spielerzüge → gleicher Verlauf (fester Seed, auch nach „Nochmal“)", () => {
    for (const t of ALL_LESSONS) {
      for (const pSeed of SEEDS.slice(0, 8)) {
        const a = runLesson(t, t.seed!, pSeed);
        // Wiederholung mit genau denselben Zügen (anderer Spieler-RNG spielt keine Rolle mehr).
        const b = runLesson(t, t.seed!, pSeed + 999, a.played);
        expect(b.log, `${t.id} pSeed ${pSeed}`).toEqual(a.log);
        expect(b.s.result).toEqual(a.s.result);
      }
    }
  });

  it("Tag 3 (Side Control): genau eine gegnerische Aufgabe, Turtle ist kein Ziel", () => {
    const t = LESSONS_PROGRAM.find((x) => x.id === "p-side-escape")!;
    expect(t.foe?.subs).toEqual(["arm_triangle"]);
    expect(t.goal!.map((g) => `${g.pos}:${g.role}`).sort()).toEqual(["guard:bottom", "half:bottom"]);
    // In die Turtle zu flüchten beendet die Lektion nicht.
    const s0 = newMatch({ seed: 1, start: { pos: "side", top: "o", board: { arme: 1, huefte: 1 } }, goal: t.goal, grips: false, chains: false, konter: false });
    const r = playRound(s0, "scb_underhook", "sct_crossface");
    expect(r.state.pos).toBe("turtle");
    expect(r.state.result).toBeNull();
    // Die Arm-Karte (Turtle) ist auf Stufe 3 gar nicht in der Hand.
    expect(visibleIds(t, newMatch({ seed: 1, start: t.start, grips: false })).has("scb_underhook")).toBe(false);
    expect(t.steps.some((st) => /Rücken nie zeigen/.test(st.text))).toBe(true);
    // Der Kopf-Arm-Würger kommt im Skript genau einmal und wird gerahmt.
    const { log } = runLesson(t, t.seed!, 7);
    expect(log.filter((l) => /sct_arm_triangle/.test(l))).toHaveLength(1);
    expect(log[2]).toMatch(/^3: scb_head_arm_def \/ sct_arm_triangle/);
  });
});

describe("Freischalten nach Tagen: Stufe je Programmtag", () => {
  it("jede Programm-Lektion hat die Stufe ihres Tages; Hub-Lektionen 1–3 haben dieselben Stufen", () => {
    const byId = new Map(ALL_LESSONS.map((t) => [t.id, t]));
    for (const d of DAYS) for (const l of d.lessons) if (l.kind === "k2") expect(byId.get(l.id)!.ui, `Tag ${d.n}: ${l.id}`).toBe(d.n);
    expect(TUTORIALS_K2.map((t) => t.ui)).toEqual([2, 3, 6]);
  });

  it("Tag 2: Hüfte + Beine, nur Aufbauen/Angreifen, kein Atem, keine Phasenleiste, keine Vorhersage", () => {
    const f = uiFeatures(undefined, 2);
    expect(f.zones).toEqual(["huefte", "beine"]);
    expect(f.kinds).toEqual(["aufbauen", "angriff"]);
    expect([f.atem, f.phaseBar, f.predict]).toEqual([false, false, false]);
    expect(f.hideKeywords).toEqual(expect.arrayContaining(["rahmen", "keil", "dilemma", "flucht", "atem"]));
  });

  it("Tag 3: + Rahmen, Kopf/Nacken; Tag 4: + Arme, Flucht; Tag 5: + Atem, Phasenleiste; Tag 6: + Keil, Dilemma, Vorhersage", () => {
    const f3 = uiFeatures(undefined, 3), f4 = uiFeatures(undefined, 4), f5 = uiFeatures(undefined, 5), f6 = uiFeatures(undefined, 6);
    expect(f3.zones).toEqual(["kopf", "huefte", "beine"]);
    expect(f3.kinds).toContain("rahmen");
    expect(f3.hideKeywords).not.toContain("rahmen");
    expect([f3.atem, f3.phaseBar, f3.predict]).toEqual([false, false, false]);
    expect(f4.zones).toEqual(["kopf", "arme", "huefte", "beine"]);
    expect(f4.hideKeywords).not.toContain("flucht");
    expect([f4.atem, f4.phaseBar]).toEqual([false, false]);
    expect([f5.atem, f5.phaseBar, f5.predict]).toEqual([true, true, false]);
    expect(f5.hideKeywords).toEqual(expect.arrayContaining(["keil", "dilemma"]));
    expect([f6.atem, f6.phaseBar, f6.predict]).toEqual([true, true, true]);
    expect(f6.hideKeywords).toEqual([]);
    // Freies Spiel (keine Stufe): alles sichtbar wie bisher.
    expect(uiFeatures(undefined).level).toBe(7);
    expect(uiFeatures(undefined).hideKeywords).toEqual([]);
  });

  it("Tag 2: Rahmen-Karten fehlen in der Hand, außer es geht sonst nichts", () => {
    const t = TUTORIALS_K2[0];
    const s = newMatch({ seed: 1, start: t.start, grips: false });
    const ids = visibleIds(t, s);
    for (const id of ids) {
      expect(cardById(id)!.kind, id).not.toBe("rahmen");
      expect(["huefte", "beine"]).toContain(cardById(id)!.zone);
    }
    // Künstlich: nur ein Rahmen spielbar → er erscheint.
    const hand = slotCards(s.pos, roleOf(s, "p"));
    const frame = hand.find((c) => c.kind === "rahmen" && c.zone === "huefte")!;
    const shown = filterHandByLevel(hand, hand.map((c) => ({ id: c.id, ok: c.id === frame.id })), uiFeatures(t));
    expect(shown.map((c) => c.id)).toContain(frame.id);
  });
});
