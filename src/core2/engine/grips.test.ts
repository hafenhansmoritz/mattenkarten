// Mechanik 2 „Griffe bleiben liegen“ (B31–B34): Daten und Regeln an echten Karten.
import { beforeEach, describe, expect, it } from "vitest";
import type { Card2, Grip2, Side, State2 } from "../types";
import { CARD2, CARDS2 } from "../data/cards";
import { keywordsOf } from "../data/keywords";
import { TUTORIALS_K2 } from "../data/tutorials";
import { aiChoose, legalCards, newMatch, PASS, playRound, setCardRegistry, KRAFT_MAX } from "./index";
import { GRIP_MAX, gripFits, gripSlots } from "./grips";
import { mulberry32 } from "../../engine/rng";

beforeEach(() => setCardRegistry(null));

const GRIP_CARDS = CARDS2.filter((c) => c.grip);
const ok = (s: State2, side: Side, id: string) => legalCards(s, side).find((l) => l.id === id)?.ok ?? false;
const grip = (c: Card2, owner: Side): Grip2 => ({ id: c.grip!.id, name: c.grip!.name, owner, zone: c.zone, card: c.id });
function at(pos: State2["pos"], top: Side | null, board: Partial<State2["board"]> = {}): State2 {
  const s = newMatch({ seed: 1, start: { pos, top, board } });
  s.p.kraft = KRAFT_MAX; s.o.kraft = KRAFT_MAX;
  return s;
}

describe("Griffe: Daten", () => {
  it("6–10 Griff-Karten, alle Aufbauen (Keil), No-Gi-Griffe aus dem Glossar", () => {
    expect(GRIP_CARDS.length).toBeGreaterThanOrEqual(6);
    expect(GRIP_CARDS.length).toBeLessThanOrEqual(10);
    for (const c of GRIP_CARDS) expect(c.kind, c.id).toBe("aufbauen");
    expect(new Set(GRIP_CARDS.map((c) => c.grip!.id))).toEqual(new Set(["collar_tie", "underhook", "crossface", "seatbelt", "wrist", "chin_strap"]));
    // Gleiche Griff-ID = gleicher Name und gleiche Zone.
    for (const c of GRIP_CARDS) for (const d of GRIP_CARDS) if (c.grip!.id === d.grip!.id) {
      expect(d.grip!.name).toBe(c.grip!.name);
      expect(d.zone, `${c.id}/${d.id}`).toBe(c.zone);
    }
  });
  it("jeder Griff wirkt irgendwo: ein Angriff in seiner Zone mit Bedingung dort, in einer Lage, in der er liegt", () => {
    for (const id of new Set(GRIP_CARDS.map((c) => c.grip!.id))) {
      const zone = GRIP_CARDS.find((c) => c.grip!.id === id)!.zone;
      const slots = gripSlots(id);
      const uses = CARDS2.filter((a) => a.kind === "angriff" && a.zone === zone && a.requires?.[zone] !== undefined
        && a.slots.some((sl) => slots.some((g) => g.pos === sl.pos && g.role === sl.role)));
      expect(uses.length, id).toBeGreaterThan(0);
    }
  });
  it("„Griff lösen“: breaks nennt nur echte Griffe, jeder Griff hat eine Gegen-Karte in einer Gegenlage", () => {
    const ids = new Set(GRIP_CARDS.map((c) => c.grip!.id));
    for (const c of CARDS2) for (const b of c.breaks ?? []) expect(ids.has(b), `${c.id}: ${b}`).toBe(true);
    for (const id of ids) {
      const foeSlots = gripSlots(id).map((sl) => `${sl.pos}/${sl.role === "top" ? "bottom" : sl.role === "bottom" ? "top" : "neutral"}`);
      const breakers = CARDS2.filter((c) => c.breaks?.includes(id) && c.slots.some((sl) => foeSlots.includes(`${sl.pos}/${sl.role}`)));
      expect(breakers.length, id).toBeGreaterThan(0);
    }
    for (const c of CARDS2) if (c.breaks) expect(c.kind, c.id).not.toBe("angriff");
  });
  it("Schlüsselwort Griff folgt den Daten: Griff bei grip, Griff lösen bei breaks", () => {
    for (const c of CARDS2) {
      const h = keywordsOf(c).find((k) => k.id === "griff");
      if (c.grip) expect(h?.label, c.id).toBe("Griff");
      else if (c.breaks) expect(h?.label, c.id).toBe("Griff lösen");
      else expect(h, c.id).toBeUndefined();
    }
  });
  it("Seatbelt bleibt beim Back Take liegen (Turtle oben → Rücken oben), Crossface beim Pass (Half → Side)", () => {
    expect(gripFits({ pos: "back", top: "p" }, { id: "seatbelt", owner: "p" })).toBe(true);
    expect(gripFits({ pos: "turtle", top: "p" }, { id: "seatbelt", owner: "p" })).toBe(true);
    expect(gripFits({ pos: "back", top: "o" }, { id: "seatbelt", owner: "p" })).toBe(false);
    expect(gripFits({ pos: "side", top: "p" }, { id: "crossface", owner: "p" })).toBe(true);
    expect(gripFits({ pos: "mount", top: "p" }, { id: "crossface", owner: "p" })).toBe(false);
  });
});

describe("Griffe: Regeln (Engine)", () => {
  it("B31 gelungene Griff-Karte legt den Griff – jede, in jedem ihrer Slots", () => {
    for (const c of GRIP_CARDS) for (const sl of c.slots) {
      const s = at(sl.pos, sl.role === "neutral" ? null : sl.role === "top" ? "p" : "o");
      const { state, round } = playRound(s, c.id, PASS);
      expect(state.grips, `${c.id} @ ${sl.pos}`).toEqual([grip(c, "p")]);
      expect(round.events).toContainEqual({ t: "grip", owner: "p", id: c.grip!.id, name: c.grip!.name, zone: c.zone, on: true });
    }
  });
  it("B31 Wirkung: Angriffe in der Griff-Zone brauchen dort 1 weniger (Snap Down mit Collar Tie, Arm-Triangle mit Crossface)", () => {
    const s = at("clinch", null, { kopf: 0 });
    expect(ok(s, "p", "cl_snap_down")).toBe(false);
    s.grips = [grip(CARD2.cl_collar_tie, "p")];
    expect(ok(s, "p", "cl_snap_down")).toBe(true);
    expect(ok(s, "o", "cl_snap_down")).toBe(false); // nur für den Besitzer
    // Nur Angriffe IN der Zone: Americana (Arme) braucht weiter Kopf +1, der Kopf-Arm-Würger (Kopf) nur noch Kopf 0.
    const t = at("side", "p", { kopf: 0, arme: 1 });
    t.grips = [grip(CARD2.sct_crossface, "p")];
    expect(ok(t, "p", "sct_arm_triangle")).toBe(true);
    expect(ok(t, "p", "sct_americana")).toBe(false);
  });
  it("B31 höchstens zwei Griffe je Spieler – der älteste fällt; gleicher Griff wird erneuert", () => {
    expect(GRIP_MAX).toBe(2);
    const s = at("back", "p");
    s.grips = [grip(CARD2.cl_collar_tie, "p"), grip(CARD2.tt_front_headlock, "p")]; // künstlich (Zonen kopf/kopf egal)
    s.grips[1] = { ...s.grips[1], zone: "beine" };
    const { state, round } = playRound(s, "bt_seatbelt", PASS);
    expect(state.grips.map((g) => g.id)).toEqual(["chin_strap", "seatbelt"]);
    expect(round.events.some((e) => e.t === "grip" && e.id === "collar_tie" && !e.on && e.why === "alt")).toBe(true);
    const again = playRound({ ...state, p: { ...state.p, locked: [] } }, "bt_seatbelt", PASS).state;
    expect(again.grips.filter((g) => g.id === "seatbelt")).toHaveLength(1);
  });
  it("B33 Pummeling: sein neuer Griff in derselben Zone verdrängt deinen", () => {
    const s = at("clinch", null);
    s.grips = [grip(CARD2.cl_underhook, "p")];
    const { state, round } = playRound(s, PASS, "cl_underhook");
    expect(state.grips).toEqual([grip(CARD2.cl_underhook, "o")]);
    expect(round.events.some((e) => e.t === "grip" && e.owner === "p" && !e.on && e.why === "verdraengt")).toBe(true);
  });
  it("B32 sein Rahmen, der deinen Angriff in der Griff-Zone stoppt, löst den Griff", () => {
    // Back oben: Seatbelt (Arme) liegt, Back Armbar (Arme) gegen „Arme eng halten“.
    const s = at("back", "p", { arme: 1 });
    s.grips = [grip(CARD2.bt_seatbelt, "p")];
    const { state, round } = playRound(s, "bt_armbar", "bb_elbows_tight");
    expect(round.rule).toBe("rahmen>angriff");
    expect(state.grips).toEqual([]);
    expect(round.events.some((e) => e.t === "grip" && !e.on && e.why === "rahmen")).toBe(true);
  });
  it("B32 Griff lösen: wirkt auch ohne Angriff (kein Rahmen ins Leere) – verliert aber gegen die Finte", () => {
    const s = at("clinch", null);
    s.grips = [grip(CARD2.cl_underhook, "o")];
    const { state, round } = playRound(s, "cl_hips_back", PASS);
    expect(state.grips).toEqual([]);
    expect(round.rule).toBe("verschiedene-zonen");
    expect(round.headline).toMatch(/löst seinen Underhook/);
    // Whizzer im selben Zug, in dem er den Underhook holt: Griff kommt rein und wird sofort gelöst.
    const both = playRound(at("clinch", null), "cl_hips_back", "cl_underhook").state;
    expect(both.grips).toEqual([]);
    // Finte: „Griff lösen“-Rahmen gegen Griff-Aufbauen in derselben Zone verliert – der Griff liegt.
    const f = at("half", "o");
    f.grips = [];
    const r = playRound(f, "hb_underhook", "ht_whizzer");
    expect(r.round.rule).toBe("aufbauen>rahmen");
    expect(r.state.grips).toEqual([grip(CARD2.hb_underhook, "p")]);
  });
  it("B34 Positionswechsel: unpassende Griffe fallen, passende bleiben", () => {
    // Turtle oben mit Seatbelt → Back Take: Seatbelt bleibt; sein Griff fällt.
    const s = at("turtle", "p", { kopf: 0, arme: 1, huefte: 1 });
    s.grips = [grip(CARD2.tt_seatbelt, "p"), grip(CARD2.tt_front_headlock, "p")];
    const { state, round } = playRound(s, "tt_back_take", PASS);
    expect(state.pos).toBe("back");
    expect(state.grips.map((g) => g.id)).toEqual(["seatbelt"]);
    expect(round.events.some((e) => e.t === "grip" && e.id === "chin_strap" && !e.on && e.why === "position")).toBe(true);
    // Flucht aus der Half Guard unten in den Stand: sein Crossface fällt.
    const h = at("half", "o", { arme: 1 });
    h.grips = [grip(CARD2.ht_crossface, "o")];
    expect(playRound(h, "hb_come_up", PASS).state.grips).toEqual([]);
  });
  it("Griffe aus (Lektionen 1–3): keine Griff-Ereignisse, Karte wirkt nur als Keil", () => {
    const s = newMatch({ seed: 1, start: { pos: "clinch", top: null }, grips: false });
    const { state, round } = playRound(s, "cl_collar_tie", PASS);
    expect(state.grips).toEqual([]);
    expect(round.events.some((e) => e.t === "grip")).toBe(false);
    expect(state.board.kopf).toBe(1);
    for (const t of TUTORIALS_K2) expect(t.grips, t.id).toBe(false);
  });
  it("KI: Stufe 2 kämpft um den Griff – löst ihn (Whizzer) oder verdrängt ihn (eigener Underhook)", () => {
    const s = at("clinch", null);
    s.grips = [grip(CARD2.cl_underhook, "p")];
    let gone = 0;
    for (let i = 0; i < 40; i++) {
      const o = aiChoose(s, "o", 2, mulberry32(i));
      if (!playRound(s, PASS, o).state.grips.some((g) => g.owner === "p")) gone++;
    }
    expect(gone / 40).toBeGreaterThanOrEqual(0.5);
  });
  it("Invariante im Spiel: je Zone höchstens ein Griff, je Spieler höchstens zwei, jeder passt zur Lage", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const rng = mulberry32(seed);
      let s = newMatch({ seed });
      while (!s.result) {
        s = playRound(s, aiChoose(s, "p", 2, rng), aiChoose(s, "o", 3, rng)).state;
        const zones = s.grips.map((g) => g.zone);
        expect(new Set(zones).size, `seed ${seed}`).toBe(zones.length);
        for (const side of ["p", "o"] as Side[]) expect(s.grips.filter((g) => g.owner === side).length).toBeLessThanOrEqual(GRIP_MAX);
        for (const g of s.grips) expect(gripFits(s, g), `${g.id} @ ${s.pos}`).toBe(true);
      }
    }
  });
});
