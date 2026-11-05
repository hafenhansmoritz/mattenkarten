// Erzeugt api/_catalog.ts (Katalog + bewertbare Ein-Satz-Fragen für den KI-Coach)
// aus Kern 2 (src/core2/data/cards.ts), dem 7-Tage-Startprogramm (src/program/*) und den Regeln (src/coach/catalog.ts).
// Ausführen nach jeder Karten- oder Programmänderung:  node scripts/build-catalog.mjs
// (läuft automatisch in `npm run build`). Optional: --out <datei> (für Tests).
// Warum generiert? Vercel kompiliert api/*.ts einzeln als Node-ESM; die extensionlosen
// Imports in src/ ("../data/cards") lösen dort zur Laufzeit nicht auf.
import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outArg = process.argv.indexOf("--out");
const outFile = outArg > 0 ? resolve(process.argv[outArg + 1]) : resolve(root, "api/_catalog.ts");
// esbuild von Vite nehmen (das Top-Level-esbuild aus @vercel/node ist zu alt für "satisfies").
const viteRequire = createRequire(createRequire(import.meta.url).resolve("vite/package.json"));
const { build } = viteRequire("esbuild");

const out = await build({
  entryPoints: [resolve(root, "src/coach/catalog.ts")],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  logLevel: "silent",
});
const code = out.outputFiles[0].text;
const mod = await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
const catalog = mod.buildCatalog();
const grade = mod.buildGradeItems();

const file =
  "// AUTOMATISCH ERZEUGT von scripts/build-catalog.mjs – nicht von Hand bearbeiten.\n" +
  "// Neu erzeugen: node scripts/build-catalog.mjs\n" +
  `export const CATALOG: string = ${JSON.stringify(catalog)};\n\n` +
  "/** Bewertbare Ein-Satz-Fragen (mode \"grade\"): id → Frage, Musterantwort, Kernpunkte. */\n" +
  `export const GRADE_ITEMS: Record<string, { q: string; model: string; points: string[] }> = ${JSON.stringify(grade, null, 2)};\n`;

await writeFile(outFile, file, "utf8");
const cards = catalog.split("\n").filter((l) => l.startsWith("[")).length;
console.log(`${outFile.replace(root + "/", "")} geschrieben (${catalog.length} Zeichen, ${cards} Karten, ${Object.keys(grade).length} Ein-Satz-Fragen).`);
