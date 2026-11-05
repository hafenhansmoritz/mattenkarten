import { beforeEach, describe, expect, it } from "vitest";
import { CARDS2 } from "../data/cards";
import { _reloadCollection, cardsToCollect, collect, collectRound, getCollection, markSeen } from "./store";
import { groupByPosition } from "./Sammlung";

const mem = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => { mem.set(k, v); },
  removeItem: (k: string) => { mem.delete(k); },
};

beforeEach(() => { mem.clear(); _reloadCollection(); });

describe("Sammlung: freischalten", () => {
  it("eigene Karte immer, gegnerische nur bei Erfolg, Passen nie", () => {
    expect(cardsToCollect({ pCard: "a", oCard: "b", winner: "p" })).toEqual(["a"]);
    expect(cardsToCollect({ pCard: "a", oCard: "b", winner: "o" })).toEqual(["a", "b"]);
    expect(cardsToCollect({ pCard: "a", oCard: "b", winner: "both" })).toEqual(["a", "b"]);
    expect(cardsToCollect({ pCard: "a", oCard: "b", winner: "none" })).toEqual(["a"]);
    expect(cardsToCollect({ pCard: "pass", oCard: "b", winner: "o" })).toEqual(["b"]);
    expect(cardsToCollect({ pCard: "pass", oCard: "pass", winner: "none" })).toEqual([]);
  });

  it("sammelt einmal, meldet nur neue, speichert dauerhaft", () => {
    expect(collectRound({ pCard: "a", oCard: "b", winner: "o" })).toEqual(["a", "b"]);
    expect(collectRound({ pCard: "a", oCard: "c", winner: "p" })).toEqual([]);
    expect(collect(["c", "c"])).toEqual(["c"]);
    _reloadCollection();
    expect(getCollection().ids).toEqual(["a", "b", "c"]);
    expect(getCollection().fresh).toEqual(["a", "b", "c"]);
    markSeen(["a"]);
    expect(getCollection().fresh).toEqual(["b", "c"]);
    markSeen();
    expect(getCollection().fresh).toEqual([]);
  });

  it("verträgt kaputte Speicherdaten", () => {
    mem.set("mk.k2.sammlung.v1", "{kaputt");
    _reloadCollection();
    expect(getCollection()).toEqual({ ids: [], fresh: [] });
  });
});

describe("Sammlung: Gruppen", () => {
  it("jede Karte genau einmal, bekannte Positionen in Lernreihenfolge, unbekannte hinten", () => {
    const extra = { ...CARDS2[0], id: "zz_neu", slots: [{ pos: "zz_unbekannt" as any, role: "top" as const }] };
    const g = groupByPosition([...CARDS2, extra]);
    expect(g.flatMap((x) => x.cards).length).toBe(CARDS2.length + 1);
    expect(g[0].pos).toBe("stand");
    expect(g[g.length - 1].pos).toBe("zz_unbekannt");
  });
});
