#!/usr/bin/env node
/**
 * Ladezeit-Messung für Mattenkarten (Bauplan Schritt 76), Lighthouse-ähnlich mit Playwright + CDP.
 *
 * Mittelklasse-Handy simuliert: 390×844, CPU 4× gedrosselt, Netz „Fast 3G“
 * (562,5 ms RTT, 1,44 Mbit/s runter, 0,67 Mbit/s hoch).
 *   kalt  = erster Besuch, leerer Cache, noch kein Service Worker
 *   warm  = zweiter Besuch, Service Worker aktiv (Precache)
 * Gemessen: FCP, „bedienbar“ (Startknopf sichtbar und 500 ms ohne Long Task danach),
 * übertragene JS-/CSS-/Font-Bytes, geladene Schriften.
 *
 * So wiederholen:
 *   npx vite build && npx vite preview --port 4197 &
 *   npm i --no-save playwright-core            # oder A11Y_TOOLS=/pfad/mit/node_modules
 *   node scripts/perf-check.mjs                # Standard-URL http://localhost:4197/, 3 Läufe (Median)
 *   node scripts/perf-check.mjs --url http://localhost:4198/ --runs 5
 */
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : def; };
const URL0 = opt("url", "http://localhost:4197/");
const RUNS = Number(opt("runs", "3"));

const bases = [process.cwd(), process.env.A11Y_TOOLS].filter(Boolean).map((b) => path.resolve(b));
const resolveFrom = (id) => { for (const b of bases) { try { return createRequire(path.join(b, "noop.js")).resolve(id); } catch { /* weiter */ } } return null; };
const pwPath = resolveFrom("playwright") ?? resolveFrom("playwright-core");
if (!pwPath) { console.error("playwright(-core) fehlt: npm i --no-save playwright-core"); process.exit(2); }
const { chromium } = createRequire(import.meta.url)(pwPath);
const chromePath = opt("chrome", process.env.CHROME_PATH || (existsSync("/usr/bin/google-chrome") ? "/usr/bin/google-chrome" : undefined));

const FAST3G = { offline: false, latency: 562.5, downloadThroughput: (1474.56 * 1024) / 8, uploadThroughput: (675 * 1024) / 8 };

async function throttle(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", FAST3G);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  return cdp;
}

async function measure(page) {
  const bytes = { js: 0, css: 0, font: 0, other: 0 };
  const fonts = [];
  const onResp = async (r) => {
    try {
      const url = r.url();
      const fromSW = r.fromServiceWorker();
      const len = fromSW ? 0 : Number((await r.headerValue("content-length")) ?? (await r.body()).length);
      const k = /\.js(\?|$)/.test(url) ? "js" : /\.css(\?|$)/.test(url) ? "css" : /\.woff2(\?|$)/.test(url) ? "font" : "other";
      bytes[k] += len || 0;
      if (k === "font") fonts.push(url.split("/").pop());
    } catch { /* ignorieren */ }
  };
  page.on("response", onResp);
  await page.addInitScript(() => {
    window.__lt = [];
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push(e.startTime + e.duration); }).observe({ type: "longtask", buffered: true }); } catch { /* alt */ }
  });
  const t0 = Date.now();
  await page.goto(URL0, { waitUntil: "commit" });
  // „Bedienbar“: Haupt-Aktion der Startseite ist sichtbar …
  await page.waitForSelector(".pfad-card, .pg-hero, button.btn.primary", { state: "visible", timeout: 60000 });
  const visibleAt = await page.evaluate(() => performance.now());
  // … und danach 500 ms keine Long Tasks mehr.
  let ready = visibleAt;
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(250);
    const r = await page.evaluate(() => ({ now: performance.now(), last: Math.max(0, ...window.__lt) }));
    ready = Math.max(visibleAt, r.last);
    if (r.now - ready >= 500) break;
  }
  const fcp = await page.evaluate(() => performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? null);
  page.off("response", onResp);
  return { fcp: Math.round(fcp), interactive: Math.round(ready), wall: Date.now() - t0, bytes, fonts: [...new Set(fonts)] };
}

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const kb = (n) => `${(n / 1024).toFixed(0)} kB`;

const browser = await chromium.launch({ executablePath: chromePath, args: ["--no-sandbox"] });
const cold = [], warm = [];
for (let i = 0; i < RUNS; i++) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: "allow" });
  const page = await ctx.newPage();
  await throttle(page);
  cold.push(await measure(page));
  // Service Worker fertig installieren lassen (Precache), dann zweiter Besuch.
  await page.evaluate(async () => { const r = await navigator.serviceWorker?.ready; return !!r; }).catch(() => false);
  await page.waitForTimeout(1500);
  for (let k = 0; k < 40; k++) {
    const ok = await page.evaluate(() => !!navigator.serviceWorker?.controller).catch(() => false);
    if (ok) break;
    await page.waitForTimeout(500);
  }
  const page2 = await ctx.newPage();
  await throttle(page2);
  warm.push(await measure(page2));
  await ctx.close();
}
await browser.close();

for (const [name, rs] of [["kalt (1. Besuch)", cold], ["warm (SW-Cache)", warm]]) {
  const r = rs[0];
  console.log(`${name.padEnd(17)} FCP ${median(rs.map((x) => x.fcp))} ms · bedienbar ${median(rs.map((x) => x.interactive))} ms · übertragen JS ${kb(r.bytes.js)}, CSS ${kb(r.bytes.css)}, Fonts ${kb(r.bytes.font)} (${r.fonts.join(", ") || "–"})`);
}
console.log(`Läufe: ${RUNS} (Median) · URL ${URL0} · CPU 4×, Fast 3G`);
