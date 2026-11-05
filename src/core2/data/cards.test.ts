import { describe, expect, it } from "vitest";
import { ZONES, type Pos2, type Role2 } from "../types";
import { CARD2, CARDS2, SLOTS2, cardsFor } from "./cards";

const words = (s: string) => s.trim().split(/\s+/).filter((w) => w !== "–" && w !== "-").length;
const VALID_SLOT = new Set(SLOTS2.map((s) => `${s.pos}:${s.role}`));
const BANNED = [/heel hook/i, /kneebar/i, /knee bar/i, /toe hold/i, /wrist ?lock/i, /handgelenkhebel/i, /\bslam\b(?!s sind)/i, /neck crank/i, /kani ?basami/i, /suplex/i];
const NEUTRAL: Pos2[] = ["stand", "clinch"];

describe("Kern 2 – Karten", () => {
  it("hat 14 Slots und eindeutige IDs", () => {
    expect(SLOTS2).toHaveLength(14);
    const ids = CARDS2.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(Object.keys(CARD2)).toHaveLength(ids.length);
  });

  it.each(SLOTS2.map((s) => [s.pos, s.role] as [Pos2, Role2]))("Slot %s/%s: 5–8 Karten, je ≥1 aufbauen/rahmen/angriff", (pos, role) => {
    const cs = cardsFor(pos, role);
    expect(cs.length).toBeGreaterThanOrEqual(5);
    expect(cs.length).toBeLessThanOrEqual(8);
    for (const k of ["aufbauen", "rahmen", "angriff"] as const) expect(cs.some((c) => c.kind === k), k).toBe(true);
  });

  it("jeder Bottom-Slot hat eine Befreiung; alle drei Danaher-Arten kommen vor", () => {
    const kinds = new Set<string>();
    for (const s of SLOTS2.filter((x) => x.role === "bottom")) {
      const esc = cardsFor(s.pos, s.role).filter((c) => c.kind === "angriff" && c.to && (c.to.escape || c.to.role !== "bottom" || c.to.pos !== s.pos));
      expect(esc.length, `${s.pos} bottom`).toBeGreaterThan(0);
      esc.forEach((c) => c.to?.escape && kinds.add(c.to.escape));
    }
    expect([...kinds].sort()).toEqual(["guard", "neutral", "reversal"]);
  });

  it("Slots, Zonen, requires und Übergänge sind gültig", () => {
    for (const c of CARDS2) {
      expect(ZONES).toContain(c.zone);
      expect(c.slots.length).toBeGreaterThan(0);
      for (const s of c.slots) {
        expect(VALID_SLOT.has(`${s.pos}:${s.role}`), `${c.id} slot`).toBe(true);
      }
      for (const [z, v] of Object.entries(c.requires ?? {})) {
        expect(ZONES).toContain(z);
        expect(v).toBeGreaterThanOrEqual(-2);
        expect(v).toBeLessThanOrEqual(2);
      }
      for (const z of Object.keys(c.alsoGain ?? {})) expect(ZONES).toContain(z);
      if (c.dilemmaOpens) {
        expect(ZONES).toContain(c.dilemmaOpens);
        expect(c.kind).toBe("angriff");
      }
      if (c.kind !== "angriff") {
        expect(c.to, c.id).toBeUndefined();
        expect(c.submission, c.id).toBeUndefined();
        expect(c.requires, c.id).toBeUndefined();
      } else {
        expect(!!c.to !== !!c.submission, `${c.id}: genau Übergang oder Aufgabe`).toBe(true);
      }
      if (c.to) {
        expect(VALID_SLOT.has(`${c.to.pos}:${c.to.role}`), `${c.id} → ${c.to.pos}:${c.to.role}`).toBe(true);
        expect(NEUTRAL.includes(c.to.pos) === (c.to.role === "neutral"), `${c.id} Rolle`).toBe(true);
        for (const s of c.slots) expect(`${s.pos}:${s.role}` !== `${c.to.pos}:${c.to.role}`, `${c.id} wechselt`).toBe(true);
        if (c.to.escape) expect(c.slots.every((s) => s.role === "bottom"), `${c.id} escape nur unten`).toBe(true);
        if (c.to.escape === "neutral") expect(c.to.role).toBe("neutral");
        if (c.to.escape === "reversal") expect(c.to.role).toBe("top");
        if (c.to.escape === "guard") expect(c.to).toMatchObject({ pos: "guard", role: "bottom" });
        if (c.to.points !== undefined) expect([2, 3, 4]).toContain(c.to.points);
      }
    }
  });

  it("Wortgrenzen: plain 2–4, plainDo ≤ 12, why ≤ 20", () => {
    for (const c of CARDS2) {
      expect(words(c.plain), `${c.id} plain`).toBeGreaterThanOrEqual(2);
      expect(words(c.plain), `${c.id} plain`).toBeLessThanOrEqual(4);
      expect(words(c.plainDo), `${c.id} plainDo`).toBeLessThanOrEqual(12);
      expect(words(c.why), `${c.id} why`).toBeLessThanOrEqual(20);
      expect(c.term.length).toBeGreaterThan(0);
      expect(c.keys.length).toBeGreaterThan(0);
      expect(c.mistakes.length).toBeGreaterThan(0);
    }
  });

  it("keine verbotenen Techniken", () => {
    for (const c of CARDS2) {
      const text = [c.id, c.plain, c.term, c.plainDo, c.why, ...c.keys, ...c.mistakes].join(" ");
      for (const b of BANNED) expect(b.test(text), `${c.id}: ${b}`).toBe(false);
    }
  });

  it("Aufgabegriffe: Kraft ≥ 1, Sicherheitshinweis, sinnvolle Zone", () => {
    const subs = CARDS2.filter((c) => c.submission);
    expect(subs.length).toBeGreaterThanOrEqual(8);
    for (const c of subs) {
      expect(c.kraft ?? 0, c.id).toBeGreaterThanOrEqual(1);
      expect(c.safety, c.id).toMatch(/abklopfen/i);
      expect(c.requires, c.id).toBeDefined();
      expect(["kopf", "arme"]).toContain(c.zone);
    }
    expect(CARD2.bt_rnc).toMatchObject({ zone: "kopf", requires: { arme: 1 } });
    expect(CARD2.gb_triangle.zone).toBe("kopf");
  });

  it("Positionsvoraussetzungen folgen der Spec", () => {
    expect(CARD2.gt_knee_slice.requires).toMatchObject({ beine: 1, huefte: 0 });
    expect(CARD2.gt_toreando.requires).toMatchObject({ beine: 1, huefte: 0 });
    expect(CARD2.sct_to_mount.requires).toMatchObject({ huefte: 2 });
    expect(CARD2.tt_back_take.requires).toMatchObject({ kopf: 1, arme: 1 });
    expect(CARD2.nd_double_leg.to).toMatchObject({ points: 2 });
    expect(CARD2.sct_to_mount.to).toMatchObject({ pos: "mount", points: 4 });
  });

  it("Dilemma-Paare zeigen auf Zonen, in denen der Slot einen Folgeangriff hat", () => {
    for (const c of CARDS2.filter((x) => x.dilemmaOpens)) {
      const s = c.slots[0];
      const follow = cardsFor(s.pos, s.role).some((o) => o.id !== c.id && o.kind === "angriff" && o.zone === c.dilemmaOpens);
      expect(follow, `${c.id} → ${c.dilemmaOpens}`).toBe(true);
    }
  });

  it("jede Karte hat Quelle oder check", () => {
    for (const c of CARDS2) {
      expect(!!c.source || c.check === true, c.id).toBe(true);
      if (c.source) expect(c.source.url).toMatch(/^https:\/\//);
    }
  });
});
