import { describe, expect, it } from "vitest";
import { chooseCard } from "../engine/ai";
import { createMatch, playableCards, playTurn } from "../engine/match";
import { mulberry32 } from "../engine/rng";
import { roleOf } from "../engine/state";
import type { MatchState } from "../engine/types";
import { ARCHETYPE } from "./campaign";
import { CARD } from "./cards";
import { TUTORIALS, tutorialFor, type TutorialDef } from "./tutorials";

const ALL = [TUTORIALS[1], TUTORIALS[2], TUTORIALS[3]];
const SEEDS = Array.from({ length: 40 }, (_, i) => i * 101 + 7);

function start(t: TutorialDef, seed: number): MatchState {
  const arch = ARCHETYPE[t.archId];
  return createMatch(arch.deck, arch.deck, seed, t.maxTurns, t.options);
}

/** "Vernünftiger" Neuling, der den Tipps folgt: requireCard, sonst die Linie aus den Hinweisen. */
function sensible(t: TutorialDef, s: MatchState): string {
  const ok = playableCards(s, "p").filter((x) => x.playable).map((x) => x.id);
  const req = t.steps.find((st) => st.when === "beforePick" && st.turn === s.turn && st.requireCard)?.requireCard;
  if (req) return req;
  const prefer: string[] =
    t.n === 2
      ? s.pos === "dist" ? ["sprawl"] : ["double_leg"]
      : t.n === 3
        ? ["armbar_mount", "americana", "b_mount_base"]
        : ["double_leg", "b_guard_open_pass", "b_side_mount"];
  return prefer.find((id) => ok.includes(id)) ?? ok.find((id) => CARD[id].kind === "angriff") ?? ok[0];
}

function run(t: TutorialDef, seed: number) {
  const arch = ARCHETYPE[t.archId];
  const rng = mulberry32(seed ^ 0x9e3779b9);
  let s = start(t, seed);
  const log: { turn: number; p: string; o: string; rule: string }[] = [];
  while (!s.result) {
    const p = sensible(t, s);
    const req = t.steps.find((st) => st.when === "beforePick" && st.turn === s.turn && st.requireCard)?.requireCard;
    if (req) {
      const pl = playableCards(s, "p").find((x) => x.id === req);
      expect(pl?.playable, `${t.title} Zug ${s.turn}: ${req} muss spielbar sein (seed ${seed})`).toBe(true);
    }
    const o = chooseCard(s, arch, rng).card;
    const turn = s.turn;
    const r = playTurn(s, p, o, rng);
    log.push({ turn, p, o, rule: r.outcome.rule });
    s = r.state;
  }
  return { s, log };
}

describe("Tutorials: Daten", () => {
  it("drei Tutorials, passend zu den Tutorial-Archetypen", () => {
    for (const n of [1, 2, 3] as const) {
      const t = TUTORIALS[n];
      expect(t.n).toBe(n);
      expect(ARCHETYPE[t.archId]?.tutorial).toBe(n);
      expect(tutorialFor(t.archId)).toBe(t);
    }
    expect(tutorialFor("w_boss")).toBeUndefined();
  });

  it("alle Karten-IDs existieren, Schritt-IDs sind eindeutig", () => {
    const ids = new Set<string>();
    for (const t of ALL) {
      for (const id of t.options.fixedHand ?? []) expect(CARD[id], id).toBeDefined();
      for (const st of t.steps) {
        expect(ids.has(st.id), st.id).toBe(false);
        ids.add(st.id);
        if (st.cardId) expect(CARD[st.cardId], st.cardId).toBeDefined();
        if (st.requireCard) expect(CARD[st.requireCard], st.requireCard).toBeDefined();
        if (st.when !== "start") expect(st.turn).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("Texte kurz: höchstens 2 Sätze pro Schritt", () => {
    for (const t of ALL) {
      for (const st of t.steps) {
        const sentences = st.text.split(/[.!?](?=\s|$)/).filter((x) => x.trim().length > 0);
        expect(sentences.length, st.id).toBeLessThanOrEqual(2);
        expect(st.text.length, st.id).toBeLessThanOrEqual(150);
      }
    }
  });

  it("Tutorial 1+2 ohne Ressourcen, Tutorial 3 mit; 3 hat kein winAt", () => {
    expect(TUTORIALS[1].options.noResources).toBe(true);
    expect(TUTORIALS[2].options.noResources).toBe(true);
    expect(TUTORIALS[3].options.noResources).toBeFalsy();
    expect(TUTORIALS[3].options.winAt).toBeUndefined();
  });

  it("feste Hand ist im Startslot spielbar (T1/T2) bzw. Aufgabegriffe anfangs gesperrt (T3)", () => {
    for (const t of [TUTORIALS[1], TUTORIALS[2]]) {
      const s = start(t, 1);
      const pl = playableCards(s, "p");
      for (const id of t.options.fixedHand!) expect(pl.find((x) => x.id === id)?.playable, id).toBe(true);
    }
    const s3 = start(TUTORIALS[3], 1);
    const pl3 = playableCards(s3, "p");
    expect(pl3.find((x) => x.id === "americana")?.playable).toBe(false);
    expect(pl3.find((x) => x.id === "armbar_mount")?.playable).toBe(false);
    expect(pl3.find((x) => x.id === "b_mount_base")?.playable).toBe(true);
  });
});

describe("Tutorials: mit echter Engine durchspielbar", () => {
  it("T1: Zug 1 beide vorbereiten (nichts passiert), Zug 2 Angriff schlägt Vorbereiten, Sieg", () => {
    for (const seed of SEEDS) {
      const { s, log } = run(TUTORIALS[1], seed);
      expect(log[0].rule, `seed ${seed}`).toBe("beide-setup");
      expect(CARD[log[0].o].kind).toBe("setup");
      expect(log[1].rule, `seed ${seed}`).toBe("angriff>setup");
      expect(s.result).toEqual({ type: "points", winner: "p" });
      expect(["side", "mount"]).toContain(s.pos);
      expect(roleOf(s, "p")).toBe("top");
      expect(log.length).toBeLessThanOrEqual(TUTORIALS[1].maxTurns);
    }
  });

  it("T2: Gegner greift an, Sprawl ist Pflicht in Zug 1, Spieler gewinnt", () => {
    let countered = 0;
    let missed = 0;
    for (const seed of SEEDS) {
      const { s, log } = run(TUTORIALS[2], seed);
      expect(log[0].p).toBe("sprawl");
      for (const l of log) expect(CARD[l.o].kind, `seed ${seed}`).toBe("angriff");
      if (log[0].rule === "reaktion>angriff") countered++;
      if (log[0].rule === "durch") missed++; // Lernmoment: Konter passte nicht
      expect(s.result?.winner, `seed ${seed}: ${JSON.stringify(log)}`).toBe("p");
      expect(log.length).toBeLessThanOrEqual(TUTORIALS[2].maxTurns);
    }
    expect(countered).toBeGreaterThan(0);
    expect(countered + missed).toBeGreaterThan(SEEDS.length / 2);
  });

  it("T3: zwei Setups bauen Griff 3 auf, dann Tap in Zug 3", () => {
    for (const seed of SEEDS) {
      const { s, log } = run(TUTORIALS[3], seed);
      expect(log.slice(0, 2).map((l) => l.p)).toEqual(["b_mount_base", "b_mount_base"]);
      expect(s.result?.type, `seed ${seed}`).toBe("submission");
      expect(s.result?.winner).toBe("p");
      expect(log.length).toBe(3);
    }
  });

  it("T3: nach Zug 1 ist Americana frei, nach Zug 2 auch Armbar", () => {
    const t = TUTORIALS[3];
    const arch = ARCHETYPE[t.archId];
    const rng = mulberry32(5);
    let s = start(t, 5);
    s = playTurn(s, "b_mount_base", chooseCard(s, arch, rng).card, rng).state;
    expect(s.p.control).toBe(2);
    expect(playableCards(s, "p").find((x) => x.id === "americana")?.playable).toBe(true);
    expect(playableCards(s, "p").find((x) => x.id === "armbar_mount")?.playable).toBe(false);
    s = playTurn(s, "b_mount_base", chooseCard(s, arch, rng).card, rng).state;
    expect(s.p.control).toBe(3);
    expect(playableCards(s, "p").find((x) => x.id === "armbar_mount")?.playable).toBe(true);
  });
});
