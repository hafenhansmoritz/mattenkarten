// Hält Datenschutzerklärung und Code synchron: jeder localStorage-Schlüssel muss in der Erklärung stehen,
// und nichts lädt Schriften oder Skripte von Google.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.(ts|tsx)$/.test(n) && !/\.test\.tsx?$/.test(n) ? [p] : [];
  });
}

function storageKeys(): string[] {
  const keys = new Set<string>();
  for (const f of walk(join(ROOT, "src"))) {
    const src = readFileSync(f, "utf8");
    if (!/localStorage|sessionStorage/.test(src)) continue;
    for (const m of src.matchAll(/const\s+\w*KEY\w*\s*=\s*["']([^"']+)["']/g)) keys.add(m[1]);
    for (const m of src.matchAll(/(?:local|session)Storage\.(?:get|set|remove)Item\(\s*["']([^"']+)["']/g)) keys.add(m[1]);
  }
  return [...keys].sort();
}

describe("Datenschutzerklärung", () => {
  const ds = read("public/landing/datenschutz.html");

  it("nennt jeden localStorage-Schlüssel der App", () => {
    const keys = storageKeys();
    expect(keys.length).toBeGreaterThan(3);
    const missing = keys.filter((k) => !ds.includes(`<code>${k}</code>`));
    expect(missing).toEqual([]);
  });

  it("ist als Vorlage markiert und hat den Block für die App", () => {
    for (const p of ["public/landing/datenschutz.html", "public/landing/impressum.html"]) {
      const html = read(p);
      expect(html).toContain('id="legal"');
      expect(html).toContain("Vorlage – vor Veröffentlichung rechtlich prüfen lassen");
    }
    expect(ds).toContain("Anthropic");
    expect(ds).toContain("Vercel");
  });

  it("lädt nichts von Google-Fonts", () => {
    for (const p of ["index.html", "public/landing/index.html", "public/landing/datenschutz.html", "public/landing/impressum.html", "vite.config.ts"]) {
      expect(read(p)).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
    }
  });
});
