#!/usr/bin/env node
/**
 * Barrierefreiheits-Audit für Mattenkarten (Bauplan Schritt 85 / 75).
 *
 * Prüft die Hauptbildschirme mit axe-core (WCAG 2.0/2.1 A+AA plus best-practice, u. a.
 * Überschriften-Reihenfolge) bei 390×844,
 * einmal mit prefers-color-scheme: dark und einmal light, und zusätzlich:
 *   – Tap-Ziele kleiner als 44×44 px (sichtbare Buttons/Links),
 *   – Farbenblind-freundlich: jede sichtbare Spielkarte zeigt ihre Art auch als Symbol
 *     (SVG-Icon mit Fläche > 0), nicht nur über die Rahmenfarbe.
 *
 * So wiederholen:
 *   npx vite build && npx vite preview --port 4197 &
 *   # einmalig Werkzeuge holen (nicht im Lockfile, damit die App-Abhängigkeiten schlank bleiben):
 *   npm i --no-save playwright-core axe-core        # oder A11Y_TOOLS=/pfad/mit/node_modules setzen
 *   node scripts/a11y-check.mjs                     # alle Bildschirme, dark + light
 *   node scripts/a11y-check.mjs --scheme dark --only home,spielen --verbose
 *   node scripts/a11y-check.mjs --shots ./shots     # Screenshots je Bildschirm und Schema
 *
 * Optionen: --url (Standard http://localhost:4197/), --chrome /pfad/zu/chrome (sonst
 * CHROME_PATH oder Playwright-Chromium), --json datei.json, --verbose (Knoten zeigen).
 * Exit-Code 1, wenn axe Verstöße mit Wirkung „serious“/„critical“ findet.
 */
import { createRequire } from "node:module";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : def; };
const flag = (name) => args.includes(`--${name}`);
const URL0 = opt("url", "http://localhost:4197/");
const SCHEMES = (opt("scheme", "both") === "both" ? ["dark", "light"] : [opt("scheme")]);
const ONLY = opt("only", "") ? opt("only").split(",") : null;
const SHOTS = opt("shots", "");
const JSON_OUT = opt("json", "");
const VERBOSE = flag("verbose");

// ---------- Werkzeuge finden (Projekt-node_modules oder A11Y_TOOLS) ----------
const bases = [process.cwd(), process.env.A11Y_TOOLS].filter(Boolean).map((b) => path.resolve(b));
function resolveFrom(id) {
  for (const b of bases) {
    try { return createRequire(path.join(b, "noop.js")).resolve(id); } catch { /* weiter */ }
  }
  return null;
}
const pwPath = resolveFrom("playwright") ?? resolveFrom("playwright-core");
const axePath = resolveFrom("axe-core/axe.min.js");
if (!pwPath || !axePath) {
  console.error("playwright(-core) und axe-core fehlen: npm i --no-save playwright-core axe-core (oder A11Y_TOOLS=… setzen)");
  process.exit(2);
}
const { chromium } = createRequire(import.meta.url)(pwPath);
const AXE_SRC = readFileSync(axePath, "utf8");
const chromePath = opt("chrome", process.env.CHROME_PATH || (existsSync("/usr/bin/google-chrome") ? "/usr/bin/google-chrome" : undefined));

// ---------- Bildschirme: Rezept, wie man von der Startseite hinkommt ----------
const clickText = (t) => async (p) => { await p.getByRole("button", { name: t }).first().click(); await p.waitForTimeout(450); };
const tabNav = (t) => async (p) => { await p.locator("nav.tabs button", { hasText: new RegExp(`^${t}`) }).first().click(); await p.waitForTimeout(500); };
const item = (t, title) => async (p) => { await tabNav(t)(p); await p.locator(".more-item, .hm-tile, .hm-row", { hasText: title }).first().click(); await p.waitForTimeout(500); };
const gear = async (p) => { await p.getByRole("button", { name: "Einstellungen" }).click(); await p.waitForTimeout(500); };
const seq = (...fns) => async (p) => { for (const f of fns) await f(p); };
const playFree = async (p) => { await tabNav("Spielen")(p); await p.getByRole("button", { name: /^Locker spielen$/ }).first().click(); await p.waitForTimeout(1500); };

// Navigation seit UX-Review 06.11.2026: Start · Spielen · Üben · Gym + Zahnrad (Einstellungen, Rechtliches, Klassik).
// Gesperrte Einträge (Beinhebel-Woche, Rangliste/Tages-Challenge auf Start, Spielplan/Draft) fehlen für frische Nutzer.
export const SCREENS = [
  { id: "home", go: async () => {} },
  { id: "spielen", go: tabNav("Spielen") },
  { id: "ueben", go: tabNav("Üben") },
  { id: "gym", go: tabNav("Gym") },
  { id: "einstellungen", go: gear },
  { id: "start7", go: async (p) => { await p.locator(".hm-hero").click(); await p.waitForTimeout(600); } },
  { id: "training", go: item("Gym", "Nach dem Training") },
  { id: "k2arena", go: playFree },
  // Mechanik 2: freies Match spielen (Griff-Karten bevorzugt), bis Griffe auf dem Brett liegen – Wahl-Phase prüfen.
  { id: "k2griffe", go: seq(playFree, async (p) => {
      const PREF = ["nd_clinch_entry", "cl_collar_tie", "cl_underhook", "hb_underhook", "ht_crossface", "sct_crossface", "bt_seatbelt", "tt_seatbelt", "gb_wrist_control", "tt_front_headlock"];
      for (let r = 0; r < 9; r++) {
        if (await p.locator(".k2-grip-chip").count() && await p.locator(".k2-hcard").count()) break;
        if (await p.locator(".k2-end").count()) break;
        const ids = await p.locator(".k2-hcard:not([disabled])").evaluateAll((els) => els.map((e) => e.getAttribute("data-card")));
        const pick = PREF.find((id) => ids.includes(id)) ?? ids[0];
        if (pick) await p.locator(`.k2-hcard[data-card="${pick}"]`).click();
        await p.locator(".k2-go").click(); await p.waitForTimeout(400);
        if (await p.locator(".k2-predict-opt").count()) { await p.locator(".k2-predict-opt").first().click(); await p.locator(".k2-go").click(); }
        await p.waitForTimeout(1500);
        if (await p.locator(".k2-tapnext").count()) { await p.locator(".k2-tapnext").click(); await p.waitForTimeout(500); }
      }
    }) },
  { id: "k2tut", go: item("Spielen", /Raus von unten/i) },
  { id: "warmup", go: item("Üben", "Aufwärmen") },
  { id: "glossar", go: item("Üben", "Glossar") },
  { id: "hotseat", go: item("Gym", "Duell zu zweit") },
  { id: "trainer", go: item("Gym", "Für Trainer") },
  { id: "rangliste", go: item("Spielen", "Rangliste") },
  { id: "sammlung", go: item("Spielen", "Sammlung") },
  { id: "pakete", go: item("Spielen", "Pakete") },
  { id: "gymscreen", go: item("Gym", "Fürs Gym") },
  { id: "klassik", go: seq(gear, clickText(/^Klassik/)) },
  { id: "klassik-deck", go: seq(gear, clickText(/^Klassik/), async (p) => { await p.getByRole("tab", { name: "Deck" }).click(); await p.waitForTimeout(500); }) },
  { id: "arena", go: seq(gear, clickText(/^Klassik/), async (p) => { await p.locator("button", { hasText: /Nächster Kampf/i }).first().click(); await p.waitForTimeout(900); }) },
  { id: "impressum", go: seq(gear, clickText(/^Impressum$/)) },
];

// Eigene Prüfungen (One-Hand-Nutzung): kleine Tap-Ziele
const SMALL_TARGETS = () => {
  const out = [];
  const els = document.querySelectorAll("button, a[href], [role=button], [role=switch], [role=tab], input, select, summary");
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const st = getComputedStyle(el);
    if (st.visibility === "hidden" || st.display === "none" || el.closest("[aria-hidden=true]")) continue;
    if (r.bottom < 0 || r.top > innerHeight * 3) continue;
    // Fließtext-Links sind ausgenommen (WCAG 2.5.8 „inline“)
    if (el.tagName === "A" && st.display === "inline") continue;
    // Checkbox/Radio in einem ausreichend großen <label>: das Label ist die Tap-Fläche
    const lab = el.tagName === "INPUT" ? el.closest("label") : null;
    if (lab) { const lr = lab.getBoundingClientRect(); if (lr.width >= 44 && lr.height >= 44) continue; }
    if (r.width < 44 - 0.5 || r.height < 44 - 0.5) {
      const label = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
      out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0] || "-"} ${Math.round(r.width)}×${Math.round(r.height)} „${label}“`);
    }
  }
  return out;
};

// Farbenblind-Check: Karten mit Art-Farbe brauchen ein sichtbares Art-Symbol.
const COLOR_ONLY_CARDS = () => {
  const bad = [];
  const cards = document.querySelectorAll(".mk-card:not(.mk-facedown), .k2-hcard, .k2-rcard:not(.kind-none)");
  for (const c of cards) {
    const r = c.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const icon = [...c.querySelectorAll(".mk-kind-icon, .k2-kind-ico")].some((i) => { const b = i.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(i).visibility !== "hidden"; });
    if (!icon) bad.push((c.getAttribute("aria-label") || c.className).slice(0, 50));
  }
  return { total: cards.length, bad };
};

async function run() {
  const browser = await chromium.launch({ executablePath: chromePath, args: ["--no-sandbox"] });
  const report = [];
  let seriousTotal = 0;
  for (const scheme of SCHEMES) {
    for (const s of SCREENS) {
      if (ONLY && !ONLY.includes(s.id)) continue;
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme, reducedMotion: "reduce", hasTouch: true, isMobile: true });
      // Ton aus, damit kein AudioContext stört; sonst frischer Spielstand.
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      let navOk = true;
      try {
        await page.goto(URL0, { waitUntil: "networkidle" });
        await page.waitForTimeout(400);
        await s.go(page);
        await page.waitForTimeout(400);
      } catch (e) { navOk = false; errors.push("Navigation: " + String(e.message).split("\n")[0]); }
      await page.addScriptTag({ content: AXE_SRC });
      const res = await page.evaluate(async () => {
        // eslint-disable-next-line no-undef
        const r = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] }, resultTypes: ["violations"] });
        return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => ({ target: n.target.join(" "), summary: n.failureSummary?.split("\n").slice(1, 2).join(" ") })) }));
      });
      const small = await page.evaluate(SMALL_TARGETS);
      const cb = await page.evaluate(COLOR_ONLY_CARDS);
      if (SHOTS) { mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, `${s.id}-${scheme}.png`) }); }
      const nodes = res.reduce((a, v) => a + v.nodes.length, 0);
      seriousTotal += res.filter((v) => v.impact === "serious" || v.impact === "critical").length;
      report.push({ screen: s.id, scheme, navOk, violations: res.length, nodes, rules: res, smallTargets: small, colorOnlyCards: cb.bad, cards: cb.total, errors });
      const tag = navOk ? "" : " (Navigation fehlgeschlagen)";
      console.log(`${scheme.padEnd(5)} ${s.id.padEnd(11)} axe: ${String(res.length).padStart(2)} Regeln / ${String(nodes).padStart(3)} Knoten · <44px: ${String(small.length).padStart(2)}${cb.total ? ` · Karten nur per Farbe: ${cb.bad.length}/${cb.total}` : ""}${tag}`);
      for (const v of res) {
        console.log(`        - [${v.impact}] ${v.id} (${v.nodes.length}): ${v.help}`);
        if (VERBOSE) for (const n of v.nodes.slice(0, 6)) console.log(`            ${n.target}  ${n.summary ?? ""}`);
      }
      if (VERBOSE) for (const t of small.slice(0, 12)) console.log(`        · klein: ${t}`);
      for (const e of errors) console.log(`        ! ${e}`);
      await ctx.close();
    }
  }
  await browser.close();
  const tot = report.reduce((a, r) => ({ v: a.v + r.violations, n: a.n + r.nodes, s: a.s + r.smallTargets.length, c: a.c + r.colorOnlyCards.length }), { v: 0, n: 0, s: 0, c: 0 });
  console.log(`\nSumme: ${tot.v} Regelverstöße (${tot.n} Knoten) auf ${report.length} Bildschirm-Läufen · kleine Tap-Ziele: ${tot.s} · Karten nur per Farbe: ${tot.c}`);
  if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify(report, null, 2));
  process.exit(seriousTotal ? 1 : 0);
}

run().catch((e) => { console.error(e); process.exit(2); });
