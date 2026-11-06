// Katalog für den KI-Coach: Kern-2-Karten, 7-Tage-Programm, No-Gi-Regeln – und das Build-Skript dazu.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CARDS2 } from "../core2/data/cards";
import { DAYS } from "../program/days";
import { EXPLAIN_QUESTIONS } from "../program/questions";
import { buildCatalog, buildGradeItems, card2Line } from "./catalog";

const ROOT = join(__dirname, "..", "..");
const catalog = buildCatalog();

describe("Coach-Katalog", () => {
  it("enthält jede Kern-2-Karte mit Alltagsname, Fachbegriff, Was, Warum, Merke, Fehler, Sicherheit", () => {
    for (const c of CARDS2) {
      const line = catalog.split("\n").find((l) => l.startsWith(`[${c.id}] `));
      expect(line, c.id).toBeTruthy();
      expect(line).toContain(`${c.plain} (${c.term})`);
      expect(line).toContain(`Was: ${c.plainDo}`);
      expect(line).toContain(`Warum: ${c.why}`);
      for (const k of c.keys) expect(line, `${c.id}: ${k}`).toContain(k);
      for (const m of c.mistakes) expect(line, `${c.id}: ${m}`).toContain(m);
      if (c.safety) expect(line).toContain(`Sicherheit: ${c.safety}`);
      if (c.check) expect(line).toContain("vom Trainer prüfen lassen");
      expect(line).toMatch(/\| Wo: [^|]+/);
    }
  });

  it("nennt Position und Rolle (Slot) in Alltagssprache", () => {
    const mb = CARDS2.find((c) => c.slots.some((s) => s.pos === "mount" && s.role === "bottom"))!;
    expect(card2Line(mb)).toContain("Wo: Mount unten");
    const st = CARDS2.find((c) => c.slots.some((s) => s.pos === "stand"))!;
    expect(card2Line(st)).toMatch(/Wo: Stand\b/);
  });

  it("enthält alle Tage des 7-Tage-Programms mit Ziel, Lektion und Drill-Sicherheit", () => {
    for (const d of DAYS) {
      expect(catalog).toContain(`### Tag ${d.n}: ${d.title}`);
      expect(catalog).toContain(d.goal);
      expect(catalog).toContain(d.drill.safety);
    }
    expect(catalog).toContain("Raus von unten");
    expect(catalog).toContain("Rücken schützen");
  });

  it("No-Gi- und IBJJF-Weißgurt-Regeln, Beinhebel-Sicherheit", () => {
    expect(catalog).toContain("IBJJF Weißgurt");
    expect(catalog).toMatch(/verboten: Heel Hook, Kneebar, Toe Hold/);
    expect(catalog).toContain("früh abklopfen, nie rausdrehen");
    expect(catalog).toContain("Keine Kragen-, Ärmel-, Hosen- oder Gürtelgriffe");
    // Ehemalige Gi-Karten sind auf No-Gi umgeschrieben (UX-Review 2026-11-06): keine Kragen-/Ärmelgriffe im Katalog
    const cardLines = catalog.split("\n").filter((l) => /^\s*- \[/.test(l)).join("\n");
    expect(cardLines).not.toMatch(/Kragen|Ärmel/);
  });

  it("Ein-Satz-Fragen mit Musterantwort und Kernpunkten", () => {
    const items = buildGradeItems();
    expect(Object.keys(items).sort()).toEqual(EXPLAIN_QUESTIONS.map((q) => q.id).sort());
    for (const q of EXPLAIN_QUESTIONS) {
      expect(items[q.id]).toEqual({ q: q.q, model: q.why, points: q.explain!.points });
      expect(catalog).toContain(q.why);
    }
  });

  it("bleibt kompakt (Prompt-Caching, Kosten)", () => {
    expect(catalog.length).toBeLessThan(90_000);
  });
});

describe("scripts/build-catalog.mjs", () => {
  it("schreibt CATALOG und GRADE_ITEMS – identisch mit buildCatalog()", () => {
    const out = join(mkdtempSync(join(tmpdir(), "mk-catalog-")), "_catalog.ts");
    execFileSync(process.execPath, [join(ROOT, "scripts/build-catalog.mjs"), "--out", out], { cwd: ROOT, stdio: "pipe" });
    const src = readFileSync(out, "utf8");
    expect(src).toMatch(/^\/\/ AUTOMATISCH ERZEUGT/);
    const cat = JSON.parse(src.match(/export const CATALOG: string = (".*?");\n/s)![1]);
    expect(cat).toBe(catalog);
    const grade = JSON.parse(src.match(/export const GRADE_ITEMS: [^=]+= (\{[\s\S]*\});\n$/)![1]);
    expect(grade).toEqual(buildGradeItems());
  }, 30_000);
});
