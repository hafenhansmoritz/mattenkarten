// Schlüsselwörter (Mechanik 1): keywordsOf muss zu den Regeln passen – geprüft an allen echten Karten und per Engine.
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import type { Card2, Side, State2, Zone } from "../types";
import { ZONES } from "../types";
import { CARDS2 } from "./cards";
import { KEYWORDS, KEYWORD, KEYWORDS_SEEN_KEY, firstUnseen, isPass, isTakedown, keywordsOf, type KeywordId } from "./keywords";
import { legalCards, newMatch, PASS, playRound, setCardRegistry, KRAFT_MAX } from "../engine";
import { BALANCE } from "../engine/resolve";
import { HOLD_STEP } from "../engine/legal";

beforeEach(() => setCardRegistry(null));

const words = (s: string) => s.trim().split(/\s+/).filter((w) => !/^[–\-→:]$/.test(w)).length;
const sentences = (s: string) => s.split(/(?<=[.!?])\s+/).filter(Boolean);
const has = (c: Card2, id: KeywordId) => keywordsOf(c).some((k) => k.id === id);
const withKw = (id: KeywordId) => CARDS2.filter((c) => has(c, id));

/** Startlage im ersten Slot der Karte, Spieler p spielt sie; Brett so, dass ihre Bedingungen erfüllt sind. */
function setup(c: Card2, extra: Partial<Record<Zone, number>> = {}): State2 {
  const sl = c.slots[0];
  const top: Side | null = sl.role === "neutral" ? null : sl.role === "top" ? "p" : "o";
  const board: Partial<Record<Zone, number>> = { ...extra };
  for (const z of ZONES) if (c.requires?.[z] !== undefined) board[z] = c.requires[z];
  const s = newMatch({ seed: 1, start: { pos: sl.pos, top, board } });
  s.p.kraft = KRAFT_MAX; s.o.kraft = KRAFT_MAX;
  return s;
}
const ok = (s: State2, side: Side, id: string) => legalCards(s, side).find((l) => l.id === id)?.ok ?? false;

describe("Glossar", () => {
  it("zehn Schlüsselwörter, eindeutig, je mit Regel, Hinweis, BJJ-Satz und Quelle oder Trainer-Prüfung", () => {
    expect(KEYWORDS.length).toBeGreaterThanOrEqual(6);
    // Jede Mechanik darf höchstens ein Wort mitbringen (Mechanik 4: Konter → 11).
    expect(KEYWORDS.length).toBeLessThanOrEqual(12);
    expect(new Set(KEYWORDS.map((k) => k.id)).size).toBe(KEYWORDS.length);
    expect(new Set(KEYWORDS.map((k) => k.name)).size).toBe(KEYWORDS.length);
    for (const k of KEYWORDS) {
      expect(k.rule && k.hint && k.bjj, k.id).toBeTruthy();
      expect(!!k.source || k.check === true, `${k.id} Quelle oder check`).toBe(true);
      if (k.source) expect(k.source.url).toMatch(/^https:\/\//);
    }
  });
  it("Wortgrenzen: Regel ≤ 3 Sätze à ≤ 20 Wörter, BJJ-Satz ≤ 20, Hinweis ≤ 14; du-Form", () => {
    for (const k of KEYWORDS) {
      const rs = sentences(k.rule);
      expect(rs.length, `${k.id} Sätze`).toBeLessThanOrEqual(3);
      for (const r of rs) expect(words(r), `${k.id}: ${r}`).toBeLessThanOrEqual(20);
      for (const b of sentences(k.bjj)) expect(words(b), `${k.id} bjj`).toBeLessThanOrEqual(20);
      expect(words(k.hint), `${k.id} hint`).toBeLessThanOrEqual(14);
      expect(k.hint.startsWith(k.name), `${k.id} hint beginnt mit dem Namen`).toBe(true);
      for (const t of [k.rule, k.hint, k.bjj]) expect(t, k.id).not.toMatch(/\b(Sie|Ihr|Ihnen)\b/);
    }
  });
  it("jedes Schlüsselwort hat mindestens eine Beispielkarte", () => {
    for (const k of KEYWORDS) expect(withKw(k.id).length, k.id).toBeGreaterThan(0);
  });
  it("Labels: Zusatz nur bei Dilemma (Zone) und Atem (Zahl); Griff oder Griff lösen", () => {
    for (const c of CARDS2) for (const h of keywordsOf(c)) {
      if (h.id === "atem") expect(h.label).toBe(`Atem ${c.kraft}`);
      else if (h.id === "dilemma") expect(h.label).toMatch(/^Dilemma → (Kopf|Arme|Hüfte|Beine)$/);
      else if (h.id === "griff") expect(h.label).toBe(c.grip ? "Griff" : "Griff lösen");
      else expect(h.label).toBe(KEYWORD[h.id].name);
    }
  });
  it("neuer localStorage-Schlüssel steht in der Datenschutzerklärung", () => {
    const html = readFileSync("public/landing/datenschutz.html", "utf8");
    expect(html).toContain(KEYWORDS_SEEN_KEY);
  });
});

describe("keywordsOf folgt den Daten", () => {
  it("Art: jedes Aufbauen ist Keil, jeder Rahmen ist Rahmen, Angriffe sind keins von beiden", () => {
    for (const c of CARDS2) {
      expect(has(c, "keil"), c.id).toBe(c.kind === "aufbauen");
      expect(has(c, "rahmen"), c.id).toBe(c.kind === "rahmen");
    }
  });
  it("jede Flucht-Transition hat Flucht, jedes Dilemma Dilemma, jede Aufgabe Aufgabe, jede Atem-Karte Atem", () => {
    for (const c of CARDS2) {
      expect(has(c, "flucht"), c.id).toBe(!!c.to?.escape);
      expect(has(c, "dilemma"), c.id).toBe(!!c.dilemmaOpens);
      expect(has(c, "aufgabe"), c.id).toBe(!!c.submission);
      expect(has(c, "atem"), c.id).toBe(!!c.kraft);
      expect(has(c, "kette"), c.id).toBe(!!c.chain);
      // Konter: nur Rahmen – und nur, wenn er im gegenüberliegenden Slot in dieser Zone angreifen kann.
      if (has(c, "konter")) expect(c.kind, c.id).toBe("rahmen");
    }
  });
  it("Takedown und Pass nur mit Positionswechsel nach oben; bekannte Beispiele", () => {
    for (const c of CARDS2) {
      if (has(c, "takedown") || has(c, "pass")) { expect(c.to?.role, c.id).toBe("top"); expect(c.kind).toBe("angriff"); }
    }
    const td = withKw("takedown").map((c) => c.id);
    expect(td).toEqual(expect.arrayContaining(["nd_double_leg", "nd_single_leg", "cl_body_lock", "nd_arm_drag"]));
    expect(td).not.toContain("cl_pull_guard"); // Guard ziehen: unten, kein Takedown
    expect(td).not.toContain("cl_snap_down"); // Front Headlock ist noch kein Boden (B23)
    expect(withKw("pass").map((c) => c.id)).toEqual(expect.arrayContaining(["gt_knee_slice", "gt_toreando", "ht_pass", "ht_knee_slide"]));
    expect(withKw("pass").every((c) => isPass(c) && !isTakedown(c))).toBe(true);
  });
  it("Regeltexte nennen die aktuellen Balance-Werte", () => {
    expect(KEYWORD.atem.rule).toContain(`höchstens ${KRAFT_MAX}`);
    expect(KEYWORD.flucht.rule).toContain(`Schritt ${HOLD_STEP}`);
    expect(BALANCE.unframedSubSteps).toBe(2);
    expect(KEYWORD.aufgabe.rule).toContain("zwei Schritte");
    expect(BALANCE.dilemmaNoFrameGain).toBe(true);
    // „+1“ auf Keil und Rahmen: kein abweichender gain in den Daten.
    for (const c of CARDS2) if (c.kind !== "angriff") expect(c.gain ?? 1, c.id).toBe(1);
  });
});

describe("Schlüsselwörter sagen die Wahrheit (Engine)", () => {
  it("Keil: +1 in seiner Zone, bleibt liegen", () => {
    for (const c of withKw("keil")) {
      const s = setup(c);
      const { state } = playRound(s, c.id, PASS);
      expect(state.board[c.zone] - s.board[c.zone], c.id).toBe(1);
      expect(state.board[c.zone], `${c.id} bleibt`).toBe(1);
    }
  });
  it("Rahmen: stoppt Angriff in derselben Zone (+1, außer Dilemma), verpufft allein", () => {
    let checked = 0;
    for (const r of withKw("rahmen")) {
      const s0 = setup(r);
      const alone = playRound(s0, r.id, PASS);
      expect(alone.round.rule, r.id).toBe("rahmen-ins-leere");
      expect(alone.state.board).toEqual(s0.board);
      const sl = r.slots[0];
      const foeRole = sl.role === "neutral" ? "neutral" : sl.role === "top" ? "bottom" : "top";
      for (const a of CARDS2.filter((x) => x.kind === "angriff" && x.zone === r.zone && x.slots.some((y) => y.pos === sl.pos && y.role === foeRole))) {
        const board: Partial<Record<Zone, number>> = {};
        for (const z of ZONES) if (a.requires?.[z] !== undefined) board[z] = -a.requires[z]!;
        const s = newMatch({ seed: 1, start: { pos: sl.pos, top: s0.top, board } });
        s.p.kraft = KRAFT_MAX; s.o.kraft = KRAFT_MAX;
        if (!ok(s, "o", a.id) || !ok(s, "p", r.id)) continue;
        const { state, round } = playRound(s, r.id, a.id);
        expect(round.rule, `${r.id} vs ${a.id}`).toBe("rahmen>angriff");
        expect(round.events.some((e) => e.t === "sub" && e.owner === "o" && e.step > 0), `${a.id} gestoppt`).toBe(false);
        if (!r.onStop) expect(state.pos, `${a.id} gestoppt`).toBe(s.pos);
        expect(state.board[r.zone] - s.board[r.zone], `${r.id} vs ${a.id}`).toBe(!a.dilemmaOpens ? 1 : a.dilemmaOpens === r.zone ? -1 : 0); // Dilemma in die eigene Zone: nur der Angreifer gewinnt dort
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(20);
  });
  it("Takedown: aus dem Stand zu Boden, du oben", () => {
    for (const c of withKw("takedown")) {
      const { state } = playRound(setup(c), c.id, PASS);
      expect(["guard", "half", "side", "mount", "back", "turtle"], c.id).toContain(state.pos);
      expect(state.top, c.id).toBe("p");
    }
  });
  it("Pass: von oben weiter, sein Griff hält dich nicht fest", () => {
    for (const c of withKw("pass")) {
      const s = setup(c);
      s.subs = [{ id: "x", name: "X", owner: "o", step: 2, zone: "kopf" }];
      expect(ok(s, "p", c.id), c.id).toBe(true);
      const { state } = playRound(setup(c), c.id, PASS);
      expect(state.pos, c.id).toBe(c.to!.pos);
      expect(state.top, c.id).toBe("p");
    }
  });
  it("Flucht: bringt dich raus – gesperrt, sobald sein Griff auf Schritt 2 sitzt", () => {
    for (const c of withKw("flucht")) {
      const s = setup(c);
      expect(s.top, `${c.id} unten`).toBe("o");
      const { state } = playRound(s, c.id, PASS);
      expect(state.pos, c.id).toBe(c.to!.pos);
      const held = setup(c);
      held.subs = [{ id: "x", name: "X", owner: "o", step: HOLD_STEP, zone: "kopf" }];
      expect(ok(held, "p", c.id), `${c.id} gesperrt`).toBe(false);
      const loose = setup(c);
      loose.subs = [{ id: "x", name: "X", owner: "o", step: 1, zone: "kopf" }];
      expect(ok(loose, "p", c.id), `${c.id} bei Schritt 1 erlaubt`).toBe(true);
    }
  });
  it("Aufgabe: Leiste rückt vor (ungestört zwei Schritte), Positionswechsel löscht sie", () => {
    for (const c of withKw("aufgabe")) {
      const { state } = playRound(setup(c), c.id, PASS);
      const t = state.subs.find((x) => x.owner === "p" && x.id === c.submission!.id);
      expect(t?.step, c.id).toBe(2);
    }
  });
  it("Dilemma: gestoppt durch Rahmen → +1 in der geöffneten Zone", () => {
    let checked = 0;
    for (const a of withKw("dilemma")) {
      const sl = a.slots[0];
      const foeRole = sl.role === "neutral" ? "neutral" : sl.role === "top" ? "bottom" : "top";
      for (const r of CARDS2.filter((x) => x.kind === "rahmen" && x.zone === a.zone && x.slots.some((y) => y.pos === sl.pos && y.role === foeRole))) {
        const s = setup(a);
        if (!ok(s, "o", r.id)) continue;
        const before = s.board[a.dilemmaOpens!];
        const { state, round } = playRound(s, a.id, r.id);
        expect(round.rule).toBe("rahmen>angriff");
        expect(round.events.some((e) => e.t === "dilemma" && e.side === "p" && e.zone === a.dilemmaOpens), `${a.id} vs ${r.id}`).toBe(true);
        if (a.dilemmaOpens !== a.zone) expect(state.board[a.dilemmaOpens!] - before, `${a.id} vs ${r.id}`).toBe(Math.min(1, 2 - before));
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(5);
  });
  it("Kette: nach der passenden Vorrunden-Karte 1 weniger in ihrer Zone – auch wenn die erste abgewehrt wurde", () => {
    let checked = 0;
    for (const c of withKw("kette")) {
      const z = c.zone;
      expect(c.requires?.[z], `${c.id} braucht etwas in ihrer Zone`).toBeDefined();
      const prev = CARDS2.find((x) => c.chain!.after.some((a) => a === x.id || a === `sub:${x.submission?.id}`) && x.slots.some((sl) => sl.pos === c.slots[0].pos || x.to?.pos === c.slots[0].pos))!;
      expect(prev, c.id).toBeTruthy();
      // Vorrunde: p spielt prev, o rahmt (oder passt); danach steht die Zone der Ketten-Karte genau 1 zu niedrig.
      let s = setup(prev, { [z]: 2 });
      s = playRound(s, prev.id, PASS).state;
      if (s.result || !c.slots.some((sl) => sl.pos === s.pos && sl.role === (s.top === "p" ? "top" : s.top === "o" ? "bottom" : "neutral"))) continue;
      for (const y of ZONES) if (c.requires![y] !== undefined) s.board[y] = c.requires![y]!;
      s.board[z] = c.requires![z]! - 1;
      s.p.kraft = KRAFT_MAX; s.p.locked = [];
      expect(ok(s, "p", c.id), `${c.id} nach ${prev.id}`).toBe(true);
      const off = { ...s, history: [] };
      expect(ok(off, "p", c.id), `${c.id} ohne Kette`).toBe(false);
      const { round } = playRound(s, c.id, PASS);
      expect(round.events.some((e) => e.t === "chain" && e.side === "p" && e.from === prev.id && e.card === c.id), c.id).toBe(true);
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(6);
  });
  it("Atem: die Zahl wird beim Aufdecken bezahlt, jede Runde +1", () => {
    for (const c of withKw("atem")) {
      const s = setup(c);
      const { state } = playRound(s, c.id, PASS);
      if (state.result) continue;
      expect(state.p.kraft, c.id).toBe(Math.min(KRAFT_MAX, KRAFT_MAX - c.kraft! + 1));
      const poor = setup(c); poor.p.kraft = c.kraft! - 1;
      expect(ok(poor, "p", c.id), `${c.id} zu teuer`).toBe(false);
    }
  });
});

describe("Erstes Auftauchen", () => {
  it("firstUnseen nimmt das erste noch nicht erklärte Wort in Glossar-Reihenfolge", () => {
    const mt = CARDS2.filter((c) => c.slots.some((s) => s.pos === "mount" && s.role === "top"));
    expect(firstUnseen(mt, [])).toBe("keil");
    expect(firstUnseen(mt, ["keil", "rahmen"])).toBe("aufgabe");
    expect(firstUnseen(mt, KEYWORDS.map((k) => k.id))).toBeNull();
  });
});
