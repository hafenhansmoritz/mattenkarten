// Mechanik 3 „Kette“ und „Abschluss möglich“ (B35–B37).
import { beforeEach, describe, expect, it } from "vitest";
import type { State2 } from "../types";
import { CARD2 } from "../data/cards";
import { finishThreats, KRAFT_MAX, legalCards, newMatch, PASS, playRound, setCardRegistry } from "./index";
import { chainFrom, CHAIN_EFFECT } from "./chains";
import { UNFRAMED_STEPS } from "./legal";
import { BALANCE } from "./resolve";

beforeEach(() => setCardRegistry(null));
const ok = (s: State2, side: "p" | "o", id: string) => legalCards(s, side).find((l) => l.id === id)?.ok ?? false;

function guardBottom(board: Partial<State2["board"]>, opts: { chains?: boolean } = {}): State2 {
  // p unten in der Guard (o oben).
  const s = newMatch({ seed: 1, start: { pos: "guard", top: "o", board }, chains: opts.chains });
  s.p.kraft = KRAFT_MAX; s.o.kraft = KRAFT_MAX;
  return s;
}

describe("Kette (B35)", () => {
  it("Armbar abgewehrt → Triangle braucht Kopf 1 weniger", () => {
    // Kopf 0: Triangle (Kopf +1) wäre ohne Kette nicht spielbar.
    let s = guardBottom({ arme: 1, kopf: -1 });
    expect(ok(s, "p", "gb_triangle")).toBe(false);
    // Er rahmt die Armbar (Dilemma öffnet Kopf +1 → Kopf 0).
    const frame = legalCards(s, "o").map((l) => CARD2[l.id]).find((c) => c.kind === "rahmen" && c.zone === "arme" && ok(s, "o", c.id));
    s = playRound(s, "gb_armbar", frame?.id ?? PASS).state;
    expect(s.pos).toBe("guard");
    s.board.kopf = 0;
    expect(chainFrom(s, "p", CARD2.gb_triangle)?.id).toBe("gb_armbar");
    expect(ok(s, "p", "gb_triangle")).toBe(true);
    const { round } = playRound(s, "gb_triangle", PASS);
    expect(round.events).toContainEqual({ t: "chain", side: "p", from: "gb_armbar", card: "gb_triangle" });
    expect(round.headline).toMatch(/Kette|Tap/);
  });

  it("Ketten aus (erste drei Lektionen): keine Erleichterung, kein Ketten-Ereignis", () => {
    let s = guardBottom({ arme: 1, kopf: 0 }, { chains: false });
    s = playRound(s, "gb_armbar", PASS).state;
    s.board.kopf = 0;
    expect(chainFrom(s, "p", CARD2.gb_triangle)).toBeNull();
    expect(ok(s, "p", "gb_triangle")).toBe(false);
  });

  it("reißt, wenn er dazwischen die Position wechselt; hält über die eigene Positionskarte (Snap Down → Go-Behind)", () => {
    // Snap Down bringt dich in die Kopfklammer oben – Go-Behind (Arme +1) braucht dann Arme 0.
    let s = newMatch({ seed: 1, start: { pos: "stand", top: null, board: { kopf: 1 } } });
    s = playRound(s, "cl_snap_down", PASS).state;
    expect(s.pos).toBe("headlock");
    s.board.arme = 0;
    expect(chainFrom(s, "p", CARD2.hl_go_behind)?.id).toBe("cl_snap_down");
    expect(ok(s, "p", "hl_go_behind")).toBe(true);
    // Andere Lage als Vorrunde, nicht durch die eigene Karte: Kette weg.
    const moved: State2 = { ...s, pos: "turtle" };
    expect(chainFrom(moved, "p", CARD2.hl_go_behind)).toBeNull();
  });

  it("Tag sub:<id>: jede Americana öffnet die Armbar im Mount", () => {
    let s = newMatch({ seed: 1, start: { pos: "mount", top: "p", board: { arme: 1, huefte: 1 } } });
    s.p.kraft = KRAFT_MAX;
    s = playRound(s, "mt_americana", PASS).state;
    expect(chainFrom(s, "p", CARD2.mt_armbar)?.id).toBe("mt_americana");
  });

  it("eine Wirkung für alle Ketten: 1, nur in der eigenen Zone der Karte", () => {
    expect(CHAIN_EFFECT).toBe(1);
    for (const c of Object.values(CARD2)) if (c.chain) {
      expect(c.kind, c.id).toBe("angriff");
      expect(c.requires?.[c.zone], `${c.id}: Kette wirkt nur, wenn die Karte in ihrer Zone etwas braucht`).toBeDefined();
      expect(c.chain.why.split(/\s+/).length, c.id).toBeLessThanOrEqual(20);
      expect(!!c.chain.source || c.chain.check === true, c.id).toBe(true);
      for (const a of c.chain.after) {
        const id = a.startsWith("sub:") ? null : a;
        if (id) expect(CARD2[id], `${c.id} after ${a}`).toBeTruthy();
        else expect(Object.values(CARD2).some((x) => x.submission?.id === a.slice(4)), a).toBe(true);
      }
    }
    expect(Object.values(CARD2).filter((c) => c.chain).length).toBeGreaterThanOrEqual(8);
  });
});

describe("Abschluss möglich (B36)", () => {
  it("UNFRAMED_STEPS entspricht der Balance-Regel B2", () => {
    expect(UNFRAMED_STEPS).toBe(BALANCE.unframedSubSteps);
  });

  it("ab Schritt 1 mit spielbarer Karte desselben Griffs: Abschluss möglich – und ungerahmt klopft er wirklich ab", () => {
    let s = newMatch({ seed: 1, start: { pos: "mount", top: "p", board: { arme: 2, huefte: 1, beine: 2 } } });
    s.p.kraft = KRAFT_MAX;
    expect(finishThreats(s, "p")).toEqual([]);
    // Er rahmt die Americana: Leiste steht danach auf 1.
    const frame = legalCards(s, "o").map((l) => CARD2[l.id]).find((c) => c.kind === "rahmen" && c.zone === "arme");
    expect(frame).toBeTruthy();
    s = playRound(s, "mt_americana", PASS).state; // ungerahmt: 2 Schritte
    s.subs = s.subs.map((t) => ({ ...t, step: 1 }));
    s.board.arme = 2; s.p.kraft = KRAFT_MAX;
    const ft = finishThreats(s, "p");
    expect(ft.map((f) => f.sub)).toEqual(["americana"]);
    expect(ft[0].zone).toBe("arme");
    expect(ft[0].cardIds).toContain("mt_americana"); // gesperrt, aber Griff fortsetzen erlaubt
    expect(finishThreats(s, "o")).toEqual([]);
    // Ungerahmt (er spielt woanders oder passt) → Tap. Gerahmt in der Zone → kein Tap.
    expect(playRound(s, "mt_americana", PASS).state.result?.type).toBe("tap");
    expect(playRound(s, "mt_americana", frame!.id).state.result).toBeNull();
  });

  it("ohne spielbare Karte (zu wenig Atem) kein Abschluss möglich; nur öffentliche Daten", () => {
    let s = newMatch({ seed: 1, start: { pos: "mount", top: "p", board: { arme: 2, huefte: 1, beine: 2 } } });
    s.p.kraft = KRAFT_MAX;
    s = playRound(s, "mt_americana", PASS).state;
    s.subs = s.subs.map((t) => ({ ...t, step: 1 }));
    s.p.kraft = 0;
    // mt_armbar und mt_americana kosten Atem: nichts spielbar.
    expect(finishThreats(s, "p")).toEqual([]);
    expect(finishThreats.length).toBe(2); // (state, side) – keine verdeckte Karte als Eingabe
  });
});
