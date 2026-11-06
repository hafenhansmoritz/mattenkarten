import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TUTORIALS_K2 } from "../core2/data/tutorials";
import { LESSONS_PROGRAM } from "../program/lessons";
import { Q_BY_ID, TOPIC_LABEL } from "../program/questions";
import { GAME_BY_CODE, GAME_SOURCES, GAMES, TRAINER_LABEL, gamesFor } from "./games";
import { GYM_CODE_PREFIX, GYM_POS_ORDER, dateOfDay, dayNumber, decodeGym, encodeGym, readGymFromHash } from "./gymCode";
import { buildScript, drillSources, gameSource } from "./reader";
import { isStale, themeTitle, weekPlan } from "./store";
import { keyAction, slidesFor, stepIndex } from "./trainerMode";

const words = (s: string) => s.trim().split(/\s+/).filter((w) => w !== "–" && w !== "-").length;
const sentences = (s: string) => s.split(/(?<=[.!?:])\s+/).filter(Boolean);
const lessonIds = new Set([...TUTORIALS_K2, ...LESSONS_PROGRAM].map((l) => l.id));

/** Roh-Code mit beliebigen Bytes (gültiges Prüfbyte) – für Robustheits-Tests. */
function raw(payload: number[]): string {
  let h = 0x811c9dc5;
  for (const b of [0x47, 0x59, 0x4d, ...payload]) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; }
  const bytes = [...payload, h & 0xff];
  return GYM_CODE_PREFIX + btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

describe("Positionsspiele (Schritt 53) – Datenintegrität", () => {
  it("10–12 Spiele, eindeutige IDs und Codes", () => {
    expect(GAMES.length).toBeGreaterThanOrEqual(10);
    expect(GAMES.length).toBeLessThanOrEqual(12);
    expect(new Set(GAMES.map((g) => g.id)).size).toBe(GAMES.length);
    expect(new Set(GAMES.map((g) => g.code)).size).toBe(GAMES.length);
    for (const g of GAMES) {
      expect(g.code).toBeGreaterThan(0);
      expect(g.code).toBeLessThan(251);
      expect(GAME_BY_CODE[g.code]).toBe(g);
    }
  });

  it("jedes Spiel: NUR MIT TRAINER, Sicherheitszeile, Ziele für beide Rollen, Regeln, Dauer", () => {
    expect(TRAINER_LABEL).toBe("NUR MIT TRAINER");
    for (const g of GAMES) {
      expect(g.trainerOnly, g.id).toBe(true);
      expect(g.safety.trim().length, g.id).toBeGreaterThan(10);
      expect(g.a.goal.length && g.b.goal.length, g.id).toBeTruthy();
      expect(g.rules.length, g.id).toBeGreaterThanOrEqual(2);
      expect(g.rules.length, g.id).toBeLessThanOrEqual(4);
      expect(g.timer.rounds * g.timer.work, g.id).toBeGreaterThan(0);
      expect(g.cues.length, g.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("Intensität bleibt in 30–50 %", () => {
    for (const g of GAMES) {
      expect(g.intensity[0], g.id).toBeGreaterThanOrEqual(30);
      expect(g.intensity[1], g.id).toBeLessThanOrEqual(50);
      expect(g.intensity[0]).toBeLessThanOrEqual(g.intensity[1]);
    }
  });

  it("keine Aufgabegriffe: jede Regel-Liste verbietet Würger/Aufgabegriffe oder Werfen", () => {
    for (const g of GAMES) {
      expect(g.rules.join(" "), g.id).toMatch(/Kein(e)? (Aufgabegriff|Würg|Würger|Werfen)|kein Würgen|kein Werfen/i);
    }
  });

  it("jedes Spiel hat Quellen, mindestens eine externe; alle Quellen gültig und markiert", () => {
    for (const g of GAMES) {
      expect(g.sources.length, g.id).toBeGreaterThanOrEqual(2);
      expect(g.sources.some((k) => /^https:\/\//.test(GAME_SOURCES[k].url)), g.id).toBe(true);
      for (const k of g.sources) expect(GAME_SOURCES[k], `${g.id}: ${k}`).toBeDefined();
    }
    for (const s of Object.values(GAME_SOURCES)) {
      expect(["belegt", "Sekundär", "Marketing", "ungeprüft", "Design"]).toContain(s.mark);
    }
    // Studio-Blogs sind als Marketing markiert, das Forum als ungeprüft.
    expect(GAME_SOURCES.evolve.mark).toBe("Marketing");
    expect(GAME_SOURCES.reddit.mark).toBe("ungeprüft");
  });

  it("Spiele ohne direkte Quelle sind als Trainer-Prüfung markiert", () => {
    for (const g of GAMES) if (g.sources.includes("design") || g.sources.includes("reddit")) expect(g.check, g.id).toBe(true);
  });

  it("Lektionen und Themen existieren", () => {
    for (const g of GAMES) {
      if (g.lessonId) expect(lessonIds.has(g.lessonId), g.id).toBe(true);
      for (const t of g.topics) expect(TOPIC_LABEL[t], `${g.id}: ${t}`).toBeDefined();
    }
  });

  it("du-Form, höchstens 20 Wörter pro Satz", () => {
    for (const g of GAMES) {
      const texts = [g.title, g.idea, g.a.goal, g.b.goal, g.safety, ...g.rules, ...g.cues];
      for (const t of texts) for (const s of sentences(t)) expect(words(s), `${g.id}: ${s}`).toBeLessThanOrEqual(20);
      expect([g.idea, g.a.goal, g.b.goal, ...g.rules].join(" "), g.id).not.toMatch(/\bSie\b|\bIhr(e|en)? (Partner|Gegner)\b/);
    }
  });

  it("die wichtigsten Anfänger-Lagen haben Spiele", () => {
    for (const p of ["mount", "side", "guard", "back", "stand"] as const) expect(gamesFor(p).length, p).toBeGreaterThanOrEqual(1);
  });

  it("KB-Abschnitt nennt die Quellen", () => {
    const kb = readFileSync(join(__dirname, "..", "..", "docs", "knowledge-base.md"), "utf8");
    expect(kb).toMatch(/### 8\.13 Positionsspiele/);
    for (const s of Object.values(GAME_SOURCES)) if (/^https:/.test(s.url)) expect(kb, s.url).toContain(s.url);
  });
});

describe("Gym-Code (Schritt 60)", () => {
  it("Round Trip: Positionen, Spiele, Datum", () => {
    const t = { positions: ["side", "mount"] as const, games: ["g-side-guard", "g-mount-knie"], date: "2026-11-09" };
    const code = encodeGym({ ...t, positions: [...t.positions] });
    expect(code.startsWith(GYM_CODE_PREFIX)).toBe(true);
    expect(code.length).toBeLessThan(40);
    const d = decodeGym(code)!;
    expect(d.positions).toEqual(["side", "mount"]);
    expect([...d.games].sort()).toEqual(["g-mount-knie", "g-side-guard"]);
    expect(d.date).toBe("2026-11-09");
    expect(d.unknownGames).toBe(0);
  });

  it("Round Trip über alle Positionen und alle Spiele", () => {
    const code = encodeGym({ positions: [...GYM_POS_ORDER].reverse(), games: GAMES.map((g) => g.id), date: "2030-02-28" });
    const d = decodeGym(code)!;
    expect(d.positions).toEqual(GYM_POS_ORDER);
    expect(d.games.length).toBe(GAMES.length);
    expect(d.date).toBe("2030-02-28");
  });

  it("gleiches Thema → gleicher Code (Reihenfolge egal, Duplikate egal)", () => {
    const a = encodeGym({ positions: ["mount", "side"], games: ["g-mount-knie", "g-side-guard"], date: "2026-11-09" });
    const b = encodeGym({ positions: ["side", "mount", "side"], games: ["g-side-guard", "g-mount-knie", "g-side-guard"], date: "2026-11-09" });
    expect(a).toBe(b);
  });

  it("liest Links, Hash und Kleinschreibung des Präfixes", () => {
    const code = encodeGym({ positions: ["guard"], games: [], date: "2026-11-02" });
    expect(decodeGym(`https://mattenkarten.app/#gym=${code}`)?.positions).toEqual(["guard"]);
    expect(decodeGym(`  ${code}\n`)?.positions).toEqual(["guard"]);
    expect(decodeGym("gym1-" + code.slice(5))?.positions).toEqual(["guard"]);
    expect(readGymFromHash(`#gym=${code}`)?.date).toBe("2026-11-02");
    expect(readGymFromHash(`#deck=MK1-xyz&gym=${code}`)?.positions).toEqual(["guard"]);
    expect(readGymFromHash("#deck=MK1-abc")).toBeNull();
  });

  it("robust gegen Müll, Tippfehler und manipulierte Codes", () => {
    const code = encodeGym({ positions: ["side"], games: ["g-side-guard"], date: "2026-11-09" });
    const bad: unknown[] = [
      "", "GYM1-", "GYM1-!!!!", "MK1-AAAA", "hallo", null, undefined, 42, {}, "GYM1-" + "A".repeat(500),
      code.slice(0, -1), code.slice(0, -2) + (code.endsWith("A") ? "B" : "A"), "%E0%A4%A", "#gym=",
    ];
    for (const b of bad) expect(decodeGym(b), String(b)).toBeNull();
    // Keine Position → ungültig
    expect(decodeGym(raw([1, 0, 0, 0, 10, 0]))).toBeNull();
    // Falsche Version
    expect(decodeGym(raw([2, 0, 1, 0, 10, 0]))).toBeNull();
    // Anzahl passt nicht zur Länge
    expect(decodeGym(raw([1, 0, 1, 0, 10, 3, 1]))).toBeNull();
  });

  it("unbekannte Spiel-Codes und unbekannte Positions-Bits werden toleriert", () => {
    const d = decodeGym(raw([1, 0xfe, 0x40, 0x0b, 0xb8, 3, 1, 200, 201]))!;
    expect(d.positions).toEqual(["side"]); // Bit 6 = side, höhere Bits ignoriert
    expect(d.games).toEqual([GAME_BY_CODE[1].id]);
    expect(d.unknownGames).toBe(2);
  });

  it("Tageszählung ist stabil", () => {
    for (const s of ["2024-01-01", "2026-11-06", "2027-02-28", "2028-02-29", "2099-12-31"]) expect(dateOfDay(dayNumber(s))).toBe(s);
    expect(dayNumber("kaputt")).toBe(0);
  });

  it("Wochenplan: Titel, Lektionen, Fragen, Spiele", () => {
    const plan = weekPlan({ positions: ["side"], games: [] });
    expect(plan.title).toBe("Seitenkontrolle");
    expect(plan.lessons.length).toBeGreaterThan(0);
    for (const id of plan.lessons) expect(lessonIds.has(id)).toBe(true);
    expect(plan.questions.length).toBeGreaterThan(0);
    for (const id of plan.questions) expect(Q_BY_ID[id]).toBeDefined();
    expect(plan.games.map((g) => g.pos)).toEqual(gamesFor("side").map(() => "side"));
    // Ausgewählte Spiele haben Vorrang
    expect(weekPlan({ positions: ["side"], games: ["g-side-guard"] }).games.map((g) => g.id)).toEqual(["g-side-guard"]);
    expect(themeTitle(["side", "mount", "back"])).toBe("Seitenkontrolle, Mount und Rücken");
  });

  it("älteres Thema wird erkannt", () => {
    expect(isStale("2026-11-02", "2026-11-09")).toBe(false);
    expect(isStale("2026-10-20", "2026-11-09")).toBe(true);
  });
});

describe("Partner-Modus (Schritt 58)", () => {
  it("Spiel: zwei Durchgänge, Rollen tauschen, Timer in jedem Durchgang", () => {
    const s = buildScript(gameSource(GAMES[0]));
    expect(s.filter((x) => x.kind === "timer")).toHaveLength(2);
    expect(s.filter((x) => x.kind === "swap")).toHaveLength(1);
    expect(s[s.length - 1].kind).toBe("done");
    const swapAt = s.findIndex((x) => x.kind === "swap");
    expect(s.slice(0, swapAt).some((x) => x.kind === "timer")).toBe(true);
    const goal1 = s.find((x) => x.kind === "read" && x.pass === 1 && x.who === "a");
    const goal2 = s.find((x) => x.kind === "read" && x.pass === 2 && x.who === "b");
    expect(goal1 && goal1.kind === "read" && goal1.kicker).toMatch(/^Blau/);
    expect(goal2 && goal2.kind === "read" && goal2.kicker).toMatch(/^Rot/);
    // Sicherheitszeile wird vorgelesen
    expect(s.some((x) => x.kind === "read" && x.text === GAMES[0].safety)).toBe(true);
  });

  it("Drills: alle Programm-Drills und Aufwärmen, Schritte und Sicherheit", () => {
    const d = drillSources();
    expect(d.length).toBeGreaterThanOrEqual(5);
    expect(d.some((x) => x.id === "warmup")).toBe(true);
    for (const src of d) {
      const s = buildScript(src);
      expect(s.filter((x) => x.kind === "timer"), src.id).toHaveLength(2);
      expect(s.some((x) => x.kind === "read" && x.kicker === "Sicherheit"), src.id).toBe(true);
      for (const x of s) if (x.kind === "read") expect(x.text.trim().length, src.id).toBeGreaterThan(0);
    }
  });
});

describe("Trainer-Modus (Schritt 59) – Tasten", () => {
  it("Weiter: Pfeil rechts/unten, Leertaste, PageDown (Clicker)", () => {
    for (const key of ["ArrowRight", "ArrowDown", " ", "PageDown"]) expect(keyAction({ key }), key).toBe("next");
  });
  it("Zurück: Pfeil links/oben, PageUp", () => {
    for (const key of ["ArrowLeft", "ArrowUp", "PageUp"]) expect(keyAction({ key }), key).toBe("prev");
  });
  it("Vollbild, Schwarzbild, Anfang/Ende, Esc", () => {
    expect(keyAction({ key: "f" })).toBe("fullscreen");
    expect(keyAction({ key: "F" })).toBe("fullscreen");
    expect(keyAction({ key: "b" })).toBe("blank");
    expect(keyAction({ key: "." })).toBe("blank");
    expect(keyAction({ key: "Home" })).toBe("first");
    expect(keyAction({ key: "End" })).toBe("last");
    expect(keyAction({ key: "Escape" })).toBe("exit");
  });
  it("ignoriert Tasten mit Strg/Alt/Cmd, in Eingabefeldern und fremde Tasten", () => {
    expect(keyAction({ key: "ArrowRight", ctrlKey: true })).toBeNull();
    expect(keyAction({ key: "f", metaKey: true })).toBeNull();
    expect(keyAction({ key: "ArrowLeft", altKey: true })).toBeNull();
    expect(keyAction({ key: " ", targetTag: "INPUT" })).toBeNull();
    expect(keyAction({ key: "ArrowRight", targetTag: "textarea" })).toBeNull();
    expect(keyAction({ key: "x" })).toBeNull();
    expect(keyAction({ key: "Tab" })).toBeNull();
    expect(keyAction({ key: "Enter" })).toBeNull();
  });
  it("Folien-Index bleibt im Bereich", () => {
    expect(stepIndex(0, 5, "prev")).toBe(0);
    expect(stepIndex(4, 5, "next")).toBe(4);
    expect(stepIndex(2, 5, "next")).toBe(3);
    expect(stepIndex(2, 5, "first")).toBe(0);
    expect(stepIndex(2, 5, "last")).toBe(4);
    expect(stepIndex(9, 5, "fullscreen")).toBe(4);
    expect(stepIndex(3, 0, "next")).toBe(0);
  });
  it("Folien: Spiel mit NUR MIT TRAINER und Sicherheit, Lektion mit allen Schritten", () => {
    for (const g of GAMES) {
      const sl = slidesFor({ kind: "game", game: g });
      expect(sl.every((x) => x.badge === TRAINER_LABEL), g.id).toBe(true);
      expect(sl.some((x) => x.safety === g.safety), g.id).toBe(true);
    }
    for (const l of [...TUTORIALS_K2, ...LESSONS_PROGRAM]) {
      const sl = slidesFor({ kind: "lesson", lesson: l });
      expect(sl.length, l.id).toBe(l.steps.length + 2);
      expect(sl[0].title).toBe(l.title);
    }
  });
});
