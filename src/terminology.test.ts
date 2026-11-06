// Begriffs-Standard (docs/knowledge-base.md, „Begriffs-Standard“; UX-Review 2026-11-06, Punkt 10):
// deutsches Alltagswort zuerst, englischer No-Gi-Begriff in Klammern. Dieser Test durchsucht die
// nutzersichtbaren Daten- und Textdateien nach verbotenen Synonymen. Kommentare werden ignoriert,
// Quellentitel/URLs und englische Fachfelder (term:, name: … de:) sind erlaubt.
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { splitTerms } from "./program/glossary";

const ROOT = path.resolve(__dirname, "..");

/** Dateien mit Texten, die Nutzer sehen. */
const SCAN_DIRS = [
  "src/core2/data", "src/core2/draft", "src/core2/daily", "src/program", "src/journey", "src/gym", "src/leglock",
  "src/data", "src/components/learn", "src/components/demo",
];
const SCAN_FILES = [
  "src/coach/catalog.ts", "src/components/cardText.ts", "src/core2/engine/board.ts", "src/core2/engine/planBuilder.ts",
  "src/core2/engine/stil.ts", "src/engine/text.ts", "src/engine/match.ts", "src/screens/Puzzles.tsx", "public/landing/index.html",
];

function files(): string[] {
  const out = new Set<string>(SCAN_FILES);
  for (const d of SCAN_DIRS) {
    for (const f of fs.readdirSync(path.join(ROOT, d))) {
      if (/\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f)) out.add(`${d}/${f}`);
    }
  }
  return [...out];
}

/** Entfernt Block- und Zeilenkommentare (grob, reicht für unsere Dateien: keine „//“ in Strings außer URLs). */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`\w])\/\/.*$/gm, "$1")
    .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, " "));
}

/** Zeilen, in denen Englisch/Fremdtitel erlaubt sind. */
const LINE_ALLOW = [
  /\bs\(\s*"/,            // Quellen: s("BJJ Atlas – Side Control Escapes", url)
  /https?:\/\//,          // URLs und Quellentitel daneben
  /\bterm:\s*"/,          // englischer No-Gi-Fachbegriff einer Karte
  /\bname:\s*"[^"]*",\s*de:/, // alte Karten: name = englischer Fachbegriff, de = Alltagswort
  /\bnogi:\s*"/,          // Glossar-Spalte „Fachbegriff“
  /\ben:\s*"/,            // Glossar (src/program/glossary.ts): englische Spalte
  /\bmatch:\s*\[/,        // Glossar: Schreibweisen, die gefunden werden
  /\bavoid:\s*\[/,        // Glossar: verbotene Varianten selbst
  /\btitle:\s*"(JitsuIQ|BJJ|Grapplearts|Evolve)/, // Quellentitel
];

/** Text außerhalb von Klammern: „(… Half Guard …)“ ist die erlaubte englische Ergänzung. */
function outsideParens(line: string): string {
  let depth = 0, out = "";
  for (const ch of line) {
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else out += depth > 0 ? " " : ch;
  }
  return out;
}

interface Rule { id: string; re: RegExp; why: string; outside?: boolean; only?: RegExp; skip?: RegExp }
const RULES: Rule[] = [
  { id: "puste", re: /(?<![A-Za-z])Puste\b/, why: "Ressource heißt „Atem“" },
  { id: "kraft-ressource", re: /verlier\w*\s+(viel\s+)?Kraft\b|\+\s?\d+\s+Kraft\b|\b\d+\s+Kraft\b(?!\s*arbeiten)|kostet\s+(\w+\s+)?Kraft\b/, why: "Ressource heißt „Atem“, nicht „Kraft“" },
  { id: "vorbereiten", re: /(?<![A-Za-z])Vorbereiten\b/, why: "Kartenart heißt „Aufbauen“" },
  { id: "kontern", re: /(?<![A-Za-z])Kontern\b/, why: "Kartenart heißt „Rahmen“ („Konter“ nur für die verdeckte Konter-Mechanik)" },
  { id: "konter-alt", re: /(?<![A-Za-z])Konter(?![-\w])/, why: "„Konter“ nur für die verdeckte Konter-Mechanik (Kern 2)",
    only: /^src\/(program|journey|data\/puzzles|screens\/Puzzles|components\/learn)/ },
  { id: "side-control", re: /Side Control/, outside: true, why: "„Seitenkontrolle“, Englisch nur in Klammern" },
  { id: "half-guard", re: /Half Guard/, outside: true, why: "„Halbe Guard“, Englisch nur in Klammern" },
  { id: "seitkontrolle", re: /Seitkontrolle|Halbguard/, why: "Schreibweise: „Seitenkontrolle“, „halbe Guard“" },
  { id: "elbow-escape", re: /Elbow Escape/, outside: true, why: "„Wegrutschen, Knie dazwischen (Elbow Escape)“" },
  { id: "ellbogen-knie", re: /Ellbogen-Knie(?!-Verbindung)(?![a-zäöü])/, why: "Grundbegriff heißt „Ellbogen-Knie-Verbindung“" },
  { id: "trainer-fragen", re: /\(Trainer fragen\)/, why: "Neulinge haben noch keinen Trainer: „(noch unsicher – frag später deinen Trainer)“" },
  { id: "marketing-label", re: /"\s?\[Marketing\]"/, why: "Quellen zeigen nur den Namen; [Marketing] bleibt in den Daten" },
  { id: "gi-griffe", re: /Kragen|Ärmel|Revers/, why: "No-Gi: keine Kragen-/Ärmelgriffe",
    skip: /options:\s*\[|Keine Kragen|ohne Kragen|Ohne Kragen|Kragen- oder Ärmel|Kragen-, Ärmel|Kragen\/Ärmel fallen|statt Kragen|Ersatz für den Kragengriff/ },
];

function scan(): { rule: string; at: string; line: string }[] {
  const hits: { rule: string; at: string; line: string }[] = [];
  for (const f of files()) {
    const raw = fs.readFileSync(path.join(ROOT, f), "utf8");
    const lines = stripComments(raw).split("\n");
    lines.forEach((line, i) => {
      if (!line.trim() || LINE_ALLOW.some((r) => r.test(line))) return;
      for (const r of RULES) {
        if (r.only && !r.only.test(f)) continue;
        if (r.skip && r.skip.test(line)) continue;
        const text = r.outside ? outsideParens(line) : line;
        if (r.re.test(text)) hits.push({ rule: r.id, at: `${f}:${i + 1}`, line: line.trim().slice(0, 140) });
      }
    });
  }
  return hits;
}

describe("Begriffs-Standard", () => {
  it("nutzersichtbare Texte nutzen keine verbotenen Synonyme", () => {
    const hits = scan();
    const report = hits.map((h) => `${h.rule} @ ${h.at}: ${h.line}  → ${RULES.find((r) => r.id === h.rule)!.why}`).join("\n");
    expect(hits, report).toEqual([]);
  });

  it("der Scanner findet Verstöße (Selbsttest)", () => {
    const line = 'text: "Du liegst unten in Side Control und hast keine Puste.",';
    expect(RULES.find((r) => r.id === "side-control")!.re.test(outsideParens(line))).toBe(true);
    expect(RULES.find((r) => r.id === "puste")!.re.test(line)).toBe(true);
    expect(RULES.find((r) => r.id === "side-control")!.re.test(outsideParens('"Seitenkontrolle (Side Control)"'))).toBe(false);
    expect(stripComments('a // Side Control\nb')).not.toContain("Side Control");
  });

  it("Glossar-Begriffe werden antippbar – jeder nur beim ersten Auftauchen", () => {
    const parts = splitTerms("Erst Upa, dann Elbow Escape. Danach wieder Upa in der halben Guard.");
    const ids = parts.filter((p) => typeof p !== "string").map((p) => (p as { id: string }).id);
    expect(ids).toEqual(["upa", "elbowescape", "half"]);
    expect(parts.map((p) => (typeof p === "string" ? p : p.text)).join("")).toBe("Erst Upa, dann Elbow Escape. Danach wieder Upa in der halben Guard.");
    // keine Treffer mitten im Wort
    expect(splitTerms("Unterhaken").filter((p) => typeof p !== "string").map((p) => (p as { id: string }).id)).toEqual(["underhook"]);
    expect(splitTerms("Mountain").every((p) => typeof p === "string")).toBe(true);
  });
});
