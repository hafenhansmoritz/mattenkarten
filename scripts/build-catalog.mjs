// Erzeugt api/_catalog.ts (Karten-Katalog für den KI-Coach) aus src/data.
// Ausführen nach jeder Kartenänderung:  node scripts/build-catalog.mjs
// Warum generiert? Vercel kompiliert api/*.ts einzeln als Node-ESM; die extensionlosen
// Imports in src/ ("../data/cards") lösen dort zur Laufzeit nicht auf.
import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
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

const file =
  "// AUTOMATISCH ERZEUGT von scripts/build-catalog.mjs – nicht von Hand bearbeiten.\n" +
  "// Neu erzeugen: node scripts/build-catalog.mjs\n" +
  `export const CATALOG: string = ${JSON.stringify(catalog)};\n`;

await writeFile(resolve(root, "api/_catalog.ts"), file, "utf8");
console.log(`api/_catalog.ts geschrieben (${catalog.length} Zeichen, ${catalog.split("\n").filter((l) => l.startsWith("[")).length} Karten).`);
