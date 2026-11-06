import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as events from "./events";
import { emitLearning } from "./events";
import {
  CRAFT_COST, DUP_STAUB, ODDS, PACK_SIZE, REWARDS, applyEvent, canCraft, draftAmount, emptyRewards, maxDailyRepeatablePacks, rewardReason,
  meisterPerPack, oddsPercent, rollPack, sanitizeRewards, seededRng, type PoolCard,
} from "./table";
import { REWARD_KEY, _reloadRewards, craftCard, getRewards, openPack } from "./store";
import { _reloadCollection, collect, getCollection } from "../collection/store";
import { packPool } from "./pool";
import { PaketeScreen } from "./PaketeScreen";

const mem = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => { mem.set(k, v); },
  removeItem: (k: string) => { mem.delete(k); },
};
const setStore = (s: object) => mem.set(REWARD_KEY, JSON.stringify({ ...emptyRewards(), ...s }));

beforeEach(() => { mem.clear(); _reloadCollection(); _reloadRewards(); });

const D1 = "2026-11-06", D2 = "2026-11-07";

/* ---------- B63 Belohnungs-Tabelle ---------- */
describe("Belohnungs-Tabelle: Grenzen", () => {
  const run = (evs: Parameters<typeof applyEvent>[1][], day = D1, s = emptyRewards(day)) => {
    let packs = 0, staub = 0, st = s;
    for (const e of evs) { const r = applyEvent(st, e, day); st = r.state; if (r.grant) { packs += r.grant.packs; staub += r.grant.staub; } }
    return { packs, staub, st };
  };

  it("Wiederholung: höchstens 1 Paket pro Tag, am nächsten Tag wieder", () => {
    const a = run([{ type: "review_done" }, { type: "review_done" }, { type: "review_done" }]);
    expect(a.packs).toBe(1);
    const b = run([{ type: "review_done" }], D2, a.st);
    expect(b.packs).toBe(1);
  });
  it("Fehlerkarte 3/3: kleiner Staub, höchstens 3 pro Tag, keine Pakete", () => {
    const a = run(Array.from({ length: 5 }, (_, i) => ({ type: "error_cleared" as const, id: `q${i}` })));
    expect(a.packs).toBe(0);
    expect(a.staub).toBe(3 * REWARDS.error_cleared.staub);
  });
  it("Echtes Training: 1 Paket + Staub, 1 pro Tag – die größte wiederholbare Belohnung", () => {
    const a = run([{ type: "training_logged" }, { type: "training_logged" }]);
    expect(a).toMatchObject({ packs: 1, staub: 10 });
    const value = (t: keyof typeof REWARDS) => REWARDS[t].packs * 40 + REWARDS[t].staub;
    for (const t of ["review_done", "error_cleared", "daily_won"] as const) expect(value("training_logged")).toBeGreaterThan(value(t));
  });
  it("Programm-Tage: je Tag einmal für immer (7 Pakete), Prüfung 2 einmal", () => {
    const days = Array.from({ length: 7 }, (_, i) => ({ type: "program_day" as const, day: i + 1 }));
    const a = run([...days, ...days, { type: "exam_passed" }, { type: "exam_passed" }]);
    expect(a.packs).toBe(7 + 2);
    expect(run([{ type: "program_day", day: 3 }], D2, a.st).packs).toBe(0);
  });
  it("Tages-Challenge 1 pro Tag, Boss je Boss einmal, Beinhebel-Abzeichen 2 einmal", () => {
    const a = run([{ type: "daily_won", date: D1 }, { type: "daily_won", date: D1 },
      { type: "boss_first_win", boss: "ringer" }, { type: "boss_first_win", boss: "ringer" }, { type: "boss_first_win", boss: "guard" },
      { type: "leglock_badge" }, { type: "leglock_badge" }]);
    expect(a.packs).toBe(1 + 2 + 2);
  });
  it("Tagesmaximum aus wiederholbaren Quellen ist klein (4 Pakete mit dem Draft)", () => {
    expect(maxDailyRepeatablePacks()).toBe(4);
  });
  it("Draft-Lauf (B74): ab 3 Siegen 1 Paket, 7 Siege +5 Staub, höchstens ein belohnter Lauf pro Tag", () => {
    expect(run([{ type: "draft_run", wins: 2 }])).toMatchObject({ packs: 0, staub: 0 });
    // Ein Lauf unter 3 Siegen verbraucht die Tagesgrenze nicht.
    const a = run([{ type: "draft_run", wins: 2 }, { type: "draft_run", wins: 4 }, { type: "draft_run", wins: 7 }]);
    expect(a).toMatchObject({ packs: 1, staub: 0 });
    expect(run([{ type: "draft_run", wins: 7 }])).toMatchObject({ packs: 1, staub: 5 });
    expect(run([{ type: "draft_run", wins: 7 }], D2, a.st)).toMatchObject({ packs: 1, staub: 5 });
    expect(draftAmount(3)).toEqual({ packs: 1, staub: 0 });
    expect(rewardReason({ type: "draft_run", wins: 5 })).toBe("Für deinen Draft-Lauf mit 5 Siegen");
  });
  it("Draft: kein Einsatz, kleiner als echtes Training (Mattenzeit zählt am meisten)", () => {
    const best = draftAmount(7);
    expect(best.packs * 40 + best.staub).toBeLessThan(REWARDS.training_logged.packs * 40 + REWARDS.training_logged.staub);
  });
  it("kein Eintrag straft: verpasste Tage ziehen nichts ab", () => {
    const a = run([{ type: "review_done" }]);
    const later = run([], "2026-12-24", a.st);
    expect(later.st.packs).toBe(a.st.packs);
  });
});

/* ---------- B64 Chancen ---------- */
const pool = packPool();
describe("Mattenpaket: Chancen", () => {
  it("Chancen summieren sich zu 1 und stimmen mit der Anzeige überein", () => {
    const sum = Object.values(ODDS).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1)).toBeLessThan(1e-9);
    const html = renderToStaticMarkup(createElement(PaketeScreen, { onBack: () => {} }));
    for (const r of ["grundlage", "technik", "meister"] as const) {
      expect(oddsPercent(r)).toBeCloseTo(ODDS[r] * 100, 5);
      const m = html.match(new RegExp(`data-odds="${r}">([^<]+)<`));
      expect(m?.[1]).toBe(`${String(oddsPercent(r)).replace(".", ",")} %`);
    }
    expect(html).toContain(`etwa ${meisterPerPack()} %`);
  });
  it("gezogene Seltenheiten entsprechen den gezeigten Chancen (volle Sammlung, 30 000 Karten)", () => {
    const rng = seededRng(42);
    const all = pool.map((c) => c.id);
    const n: Record<string, number> = { grundlage: 0, technik: 0, meister: 0 };
    for (let i = 0; i < 10000; i++) for (const c of rollPack(pool, all, rng)) n[c.rarity]++;
    for (const r of Object.keys(ODDS) as (keyof typeof ODDS)[]) expect(Math.abs(n[r] / 30000 - ODDS[r])).toBeLessThan(0.012);
  });
  it("ein Paket hat immer 3 Karten aus dem Kern-2-Pool", () => {
    const ids = new Set(pool.map((c) => c.id));
    const p = rollPack(pool, [], seededRng(1));
    expect(p).toHaveLength(PACK_SIZE);
    p.forEach((c) => expect(ids.has(c.id)).toBe(true));
  });
});

describe("Mattenpaket: Garantie und Doppelte", () => {
  it("mindestens eine fehlende Karte, solange welche fehlen", () => {
    const rng = seededRng(7);
    for (let i = 0; i < 400; i++) {
      const owned = pool.filter(() => rng() < 0.9).map((c) => c.id);
      const p = rollPack(pool, owned, rng);
      if (owned.length < pool.length) expect(p.some((c) => c.isNew)).toBe(true);
    }
  });
  it("fehlt genau eine Karte, steckt genau sie im Paket", () => {
    const missing = pool[17];
    const owned = pool.filter((c) => c !== missing).map((c) => c.id);
    for (let s = 0; s < 50; s++) expect(rollPack(pool, owned, seededRng(s)).some((c) => c.id === missing.id && c.isNew)).toBe(true);
  });
  it("Doppelte werden zu Staub nach Seltenheit, eine Karte doppelt im Paket zählt einmal als neu", () => {
    const tiny: PoolCard[] = [{ id: "a", rarity: "grundlage" }];
    const p = rollPack(tiny, [], seededRng(3));
    expect(p.map((c) => c.isNew)).toEqual([true, false, false]);
    expect(p[1].staub).toBe(DUP_STAUB.grundlage);
    const full = rollPack(pool, pool.map((c) => c.id), seededRng(5));
    expect(full.every((c) => !c.isNew && c.staub === DUP_STAUB[c.rarity])).toBe(true);
  });
});

/* ---------- B65/B66 Herstellen ---------- */
describe("Herstellen mit Mattenstaub", () => {
  it("Kosten nach Seltenheit; Doppelte bringen deutlich weniger als Herstellen kostet", () => {
    expect(CRAFT_COST).toEqual({ grundlage: 20, technik: 50, meister: 120 });
    for (const r of ["grundlage", "technik", "meister"] as const) expect(DUP_STAUB[r] * 3).toBeLessThanOrEqual(CRAFT_COST[r]);
  });
  it("nur fehlende Karten, nur mit genug Staub", () => {
    const c: PoolCard = { id: "x", rarity: "technik" };
    expect(canCraft(c, ["x"], 999)).toMatchObject({ ok: false, why: "owned" });
    expect(canCraft(c, [], 49)).toMatchObject({ ok: false, why: "staub" });
    expect(canCraft(c, [], 50)).toMatchObject({ ok: true, cost: 50 });
    expect(canCraft(undefined, [], 999)).toMatchObject({ ok: false, why: "unknown" });
  });
  it("Herstellen zieht Staub ab und legt die Karte in die Sammlung; Eigene bleiben unberührt", () => {
    setStore({ staub: 60 });
    const card = pool.find((c) => c.rarity === "technik")!;
    expect(craftCard(card).ok).toBe(true);
    expect(getRewards().staub).toBe(10);
    expect(getCollection().ids).toContain(card.id);
    expect(craftCard(card)).toMatchObject({ ok: false, why: "owned" });
    expect(getRewards().staub).toBe(10);
  });
});

/* ---------- Speicher: öffnen, Übernahme, kaputte Daten ---------- */
describe("Speicher", () => {
  it("Paket öffnen: −1 Paket, neue Karten in der Sammlung (mit „neu“), Doppelte als Staub", () => {
    collect(pool.slice(0, 100).map((c) => c.id));
    setStore({ packs: 2 });
    const before = getCollection().ids.length;
    const r = openPack(pool, seededRng(9))!;
    expect(getRewards().packs).toBe(1);
    const nNew = r.cards.filter((c) => c.isNew).length;
    expect(nNew).toBeGreaterThanOrEqual(1);
    expect(getCollection().ids.length).toBe(before + nNew);
    expect(getCollection().fresh).toEqual(expect.arrayContaining(r.cards.filter((c) => c.isNew).map((c) => c.id)));
    expect(getRewards().staub).toBe(r.staub);
    expect(getRewards().opened).toBe(1);
  });
  it("ohne Paket lässt sich nichts öffnen", () => {
    expect(openPack(pool, seededRng(1))).toBeNull();
  });
  it("Übernahme: bisheriger Fortschritt bringt die Einmal-Belohnungen, Sammlung bleibt unverändert", () => {
    mem.set("mk.program.v1", JSON.stringify({ done: [1, 2, 3, 4, 5, 6, 7], doneOn: {}, drills: {}, checklist: [], exam: { passed: true } }));
    mem.set("mk.k2.bosses", JSON.stringify(["ringer", "guard"]));
    mem.set("mk.leglock.v1", JSON.stringify({ done: [], check: { passed: true } }));
    mem.set("mk.k2.sammlung.v1", JSON.stringify({ ids: ["a", "b"], fresh: [] }));
    const s = getRewards();
    expect(s.packs).toBe(7 + 2 + 2 + 2);
    expect(s.day.counts).toEqual({});
    expect(mem.get("mk.k2.sammlung.v1")).toBe(JSON.stringify({ ids: ["a", "b"], fresh: [] }));
    // nicht doppelt beim nächsten Laden
    _reloadRewards();
    expect(getRewards().packs).toBe(13);
  });
  it("kaputter Speicher: kein Absturz, gültige Werte", () => {
    mem.set(REWARD_KEY, "{kaputt");
    expect(getRewards().packs).toBe(0);
    mem.set(REWARD_KEY, JSON.stringify({ packs: "viele", staub: -40, claimed: 3, day: null, log: [1, null, { reason: 5 }] }));
    _reloadRewards();
    expect(getRewards()).toMatchObject({ packs: 0, staub: 0, claimed: [], log: [] });
    expect(sanitizeRewards(null).v).toBe(1);
    expect(sanitizeRewards({ packs: 3.7, staub: 1e12 })).toMatchObject({ packs: 3, staub: 99999 });
  });
  it("Lern-Ereignis → Paket und Hinweis mit Grund; Tagesgrenze gilt auch hier", () => {
    getRewards();
    emitLearning({ type: "review_done" });
    emitLearning({ type: "review_done" });
    expect(getRewards().packs).toBe(1);
    expect(getRewards().log.at(-1)?.reason).toBe("Für deine Wiederholung");
  });
  it("neuer Schlüssel steht in der Datenschutzerklärung", () => {
    expect(readFileSync("public/landing/datenschutz.html", "utf8")).toContain(`<code>${REWARD_KEY}</code>`);
  });
});

/* ---------- B68 Ethik: Lernen ist nie gesperrt ---------- */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) && !/\.test\./.test(f) ? [p] : [];
  });
}
describe("Ethik: Lerninhalte prüfen nie Belohnungen", () => {
  const learning = [
    ...files("src/program"), ...files("src/journey"), ...files("src/leglock"),
    "src/screens/Lesson.tsx", "src/core2/data/tutorials.ts",
  ];
  it("Programm, Lektionen, Reise und Beinhebel-Modul importieren nur den Melde-Kanal", () => {
    expect(learning.length).toBeGreaterThan(10);
    for (const f of learning) {
      const src = readFileSync(f, "utf8");
      expect(src, f).not.toMatch(/rewards\/(store|table|pool|PaketeScreen|PackOpening)/);
      expect(src, f).not.toMatch(/\b(useRewards|getRewards|REWARD_KEY|mk\.k2\.belohnung)/);
    }
  });
  it("der Melde-Kanal hat keine Abfrage: nur melden und zuhören", () => {
    expect(Object.keys(events).sort()).toEqual(["emitLearning", "onLearning"]);
    expect(emitLearning({ type: "review_done" })).toBeUndefined();
  });
  it("kein Geld, keine Käufe im Belohnungs-Code", () => {
    for (const f of files("src/core2/rewards")) {
      const src = readFileSync(f, "utf8");
      expect(src, f).not.toMatch(/€|\$\s?\d+[.,]\d\d|price|payment|checkout|purchase|in-app/i);
    }
  });
});
