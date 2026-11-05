// Kern 2 „Körperkarte“ – KI-gegen-KI-Simulation auf echten Karten (CARDS2).
// Ausführen: npx vite-node scripts/simulate2.ts [matchesProPaarung=500] [--fixtures]
import { CARDS2 } from "../src/core2/data/cards";
import { FIX } from "../src/core2/engine/fixtures";
import {
  aiChoose, allCards, cardById, legalCards, newMatch, PASS, playRound, POS_LABEL, roleOf, setCardRegistry, slotCards,
} from "../src/core2/engine/index";
import { topFor } from "../src/core2/engine/board";
import { mulberry32 } from "../src/engine/rng";
import type { Pos2, Role2, Side, State2 } from "../src/core2/types";
import { ZONES } from "../src/core2/types";

const args = process.argv.slice(2);
const N = Number(args.find((a) => /^\d+$/.test(a)) ?? 500);
const useFix = args.includes("--fixtures");
if (useFix) setCardRegistry(FIX);
else if (CARDS2.length === 0) { console.error("CARDS2 ist leer – nichts zu simulieren (--fixtures für Testkarten)."); process.exit(1); }
const CARDS = allCards();
console.log(`Karten: ${CARDS.length}${useFix ? " (Fixtures)" : ""} · ${N} Matches je Paarung\n`);

// ---- Statische Prüfung: Slots ----
const POS: Pos2[] = ["stand", "clinch", "guard", "half", "turtle", "side", "mount", "back"];
const slots: { pos: Pos2; role: Role2 }[] = [];
for (const pos of POS) for (const role of (pos === "stand" || pos === "clinch" ? ["neutral"] : ["top", "bottom"]) as Role2[]) slots.push({ pos, role });
const anomalies: string[] = [];
console.log("Slots (Karten: angriff/aufbauen/rahmen, Ausgänge):");
for (const sl of slots) {
  const cs = slotCards(sl.pos, sl.role);
  const k = (kind: string) => cs.filter((c) => c.kind === kind).length;
  const free = cs.filter((c) => c.kind === "angriff" && !c.requires && !c.kraft).length;
  const exits = cs.filter((c) => c.to).map((c) => `${c.to!.pos}/${c.to!.role}`);
  console.log(`  ${sl.pos.padEnd(7)} ${sl.role.padEnd(7)} ${String(cs.length).padStart(2)}  (${k("angriff")}/${k("aufbauen")}/${k("rahmen")})  frei-Angriffe:${free}  → ${[...new Set(exits)].join(", ") || "–"}`);
  if (cs.length === 0) anomalies.push(`Slot ${sl.pos}/${sl.role} hat keine Karten.`);
  else if (cs.length === 1) anomalies.push(`Slot ${sl.pos}/${sl.role} hat nur 1 Karte → nach Sperre jede 2. Runde PASS.`);
  else if (k("aufbauen") === 0 && k("angriff") > 0 && cs.every((c) => c.kind !== "angriff" || c.requires)) anomalies.push(`Slot ${sl.pos}/${sl.role}: Angriffe brauchen Zonen, aber kein Aufbauen im Slot.`);
}
// Erreichbare Ziele ohne Karten
for (const c of CARDS) if (c.to) {
  const tgtRole = c.to.role;
  const both: Role2[] = tgtRole === "neutral" ? ["neutral"] : ["top", "bottom"];
  for (const r of both) if (slotCards(c.to.pos, r).length === 0) anomalies.push(`${c.id} führt nach ${c.to.pos}/${r} – dort keine Karten.`);
  if (c.to.pos !== "stand" && c.to.pos !== "clinch" && c.to.role === "neutral") anomalies.push(`${c.id}: Ziel ${c.to.pos} mit Rolle neutral.`);
  if ((c.to.pos === "stand" || c.to.pos === "clinch") && c.to.role !== "neutral") anomalies.push(`${c.id}: Ziel ${c.to.pos} mit Rolle ${c.to.role}.`);
}
for (const c of CARDS) {
  if (c.kind === "angriff" && !c.to && !c.submission) anomalies.push(`${c.id}: Angriff ohne to/submission (wirkungslos).`);
  if (c.kind !== "angriff" && (c.to || c.submission || c.requires)) anomalies.push(`${c.id}: ${c.kind} mit to/submission/requires (wird ignoriert).`);
  if (c.requires) for (const z of ZONES) if ((c.requires[z] ?? -9) > 2) anomalies.push(`${c.id}: requires ${z} > 2 unerreichbar.`);
}
// Aufgaben: brauchen 3 Erfolge; mit Sperre wechselt man zwischen ≥2 Karten desselben Griffs oder spielt Pausen.
const subCards = new Map<string, string[]>();
for (const c of CARDS) if (c.submission) subCards.set(c.submission.id, [...(subCards.get(c.submission.id) ?? []), c.id]);

// ---- Simulation ----
type Lv = 1 | 2 | 3;
interface Agg {
  tap: number; points: number; draw: number; goal: number; pWins: number; oWins: number;
  rounds: number; pass: number; noOk: Map<string, number>;
  pos: Map<string, number>; zone: Map<number, number>; rules: Map<string, number>;
  decisive: Map<string, number>; played: Map<string, number>; taps: Map<string, number>; zeroAction: number;
}
const inc = <K>(m: Map<K, number>, k: K, n = 1) => m.set(k, (m.get(k) ?? 0) + n);
const newAgg = (): Agg => ({ tap: 0, points: 0, draw: 0, goal: 0, pWins: 0, oWins: 0, rounds: 0, pass: 0, noOk: new Map(), pos: new Map(), zone: new Map(), rules: new Map(), decisive: new Map(), played: new Map(), taps: new Map(), zeroAction: 0 });
const total = newAgg();

function runMatch(lp: Lv, lo: Lv, seed: number, aggs: Agg[]): void {
  const rec = (f: (a: Agg) => void) => aggs.forEach(f);
  const rng = mulberry32(seed);
  let s: State2 = newMatch({ seed });
  let guard = 0;
  let lastScoring: { side: Side; id: string } | null = null;
  while (!s.result) {
    if (guard++ > 50) { anomalies.push(`Match seed ${seed} endet nicht (>50 Runden).`); break; }
    const ids: Record<Side, string> = { p: "", o: "" };
    for (const side of ["p", "o"] as Side[]) {
      const lv = side === "p" ? lp : lo;
      ids[side] = aiChoose(s, side, lv, rng);
      if (ids[side] === PASS) {
        rec((a) => a.pass++);
        const all = legalCards(s, side);
        const k = `${s.pos}/${roleOf(s, side)} (${all.length} Karten, alle gesperrt/zu schwach)`; rec((a) => inc(a.noOk, k));
      } else { const id = ids[side]; rec((a) => inc(a.played, id)); }
    }
    const { state, round } = playRound(s, ids.p, ids.o);
    rec((a) => inc(a.rules, round.rule));
    if (round.headline.split(/\s+/).length > 10) anomalies.push(`Headline > 10 Wörter: "${round.headline}"`);
    if (round.why.split(/\s+/).length > 20) anomalies.push(`Why > 20 Wörter (${ids.p}/${ids.o}): "${round.why}"`);
    if (round.winner === "none") rec((a) => a.zeroAction++);
    for (const e of round.events) {
      if (e.t === "tap") { const id = e.winner === "p" ? ids.p : ids.o; rec((a) => inc(a.decisive, id)); }
      if (e.t === "move") {
        // Wer hat den Wechsel ausgelöst? Die Seite, deren Karte genau dieses Ziel hat.
        for (const side of ["p", "o"] as Side[]) {
          const c = cardById(ids[side]);
          if (c?.to && c.to.pos === e.pos && topFor(side, c.to.role) === e.top) lastScoring = { side, id: c.id };
        }
      }
    }
    s = state;
    const pk = `${s.pos}${s.top ? "/" + (s.top === "p" ? "p-oben" : "o-oben") : ""}`;
    rec((a) => { inc(a.pos, pk); for (const z of ZONES) inc(a.zone, s.board[z]); });
  }
  const r = s.result;
  const ls = lastScoring as { side: Side; id: string } | null;
  rec((agg) => {
    agg.rounds += s.history.length;
    if (!r) return;
    if (r.type === "tap") { agg.tap++; inc(agg.taps, r.sub); }
    else if (r.type === "goal") agg.goal++;
    else if (r.winner === null) agg.draw++;
    else { agg.points++; if (ls && ls.side === r.winner) inc(agg.decisive, ls.id); }
    if (r.winner === "p") agg.pWins++; else if (r.winner === "o") agg.oWins++;
  });
}

const pct = (n: number, d: number) => `${((100 * n) / Math.max(1, d)).toFixed(1)}%`;
console.log(`\nPaarung   tap     punkte  remis   p-sieg  o-sieg  Ø Runden  PASS/Match`);
for (const lp of [1, 2, 3] as Lv[]) for (const lo of [1, 2, 3] as Lv[]) {
  const agg = newAgg();
  for (let i = 0; i < N; i++) runMatch(lp, lo, lp * 100000 + lo * 10000 + i, [agg, total]);
  console.log(`L${lp}-L${lo}     ${pct(agg.tap, N).padEnd(8)}${pct(agg.points, N).padEnd(8)}${pct(agg.draw, N).padEnd(8)}${pct(agg.pWins, N).padEnd(8)}${pct(agg.oWins, N).padEnd(8)}${(agg.rounds / N).toFixed(2).padEnd(10)}${(agg.pass / N).toFixed(2)}`);
}
const M = 9 * N;
const top = <K>(m: Map<K, number>, n: number) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
const totalRounds = [...total.rules.values()].reduce((a, b) => a + b, 0);
console.log(`\nGesamt (${M} Matches): tap ${pct(total.tap, M)}, punkte ${pct(total.points, M)}, remis ${pct(total.draw, M)}, Ø Runden ${(total.rounds / M).toFixed(2)}`);
console.log(`Runden ohne Wirkung (winner none): ${pct(total.zeroAction, totalRounds)}`);
console.log("\nRegeln:"); for (const [k, v] of top(total.rules, 10)) console.log(`  ${k.padEnd(20)} ${pct(v, totalRounds)}`);
const posTot = [...total.pos.values()].reduce((a, b) => a + b, 0);
console.log("\nPositionen (Rundenende):"); for (const [k, v] of top(total.pos, 30)) console.log(`  ${k.padEnd(16)} ${pct(v, posTot)}`);
const reached = new Set([...total.pos.keys()].map((k) => k.split("/")[0]));
const never = POS.filter((p) => !reached.has(p));
if (never.length) anomalies.push(`Nie erreicht: ${never.map((p) => POS_LABEL[p]).join(", ")}`);
const zTot = [...total.zone.values()].reduce((a, b) => a + b, 0);
console.log("\nZonenwerte (alle Zonen, Rundenende):"); for (const v of [-2, -1, 0, 1, 2]) console.log(`  ${String(v).padStart(2)}  ${pct(total.zone.get(v) ?? 0, zTot)}`);
console.log("\nAufgaben (Taps):"); for (const [k, v] of top(total.taps, 15)) console.log(`  ${k.padEnd(24)} ${v}`);
console.log("\nEntscheidende Karten (Tap-Karte bzw. letzter Positionswechsel des Punktsiegers):"); for (const [k, v] of top(total.decisive, 12)) console.log(`  ${k.padEnd(24)} ${v}`);
console.log("\nMeistgespielt:"); for (const [k, v] of top(total.played, 10)) console.log(`  ${k.padEnd(24)} ${v}`);
const playedIds = new Set(total.played.keys());
const unplayed = CARDS.filter((c) => !playedIds.has(c.id)).map((c) => c.id);
if (unplayed.length) anomalies.push(`Nie gespielt (${unplayed.length}): ${unplayed.join(", ")}`);
for (const [k, v] of top(total.noOk, 10)) anomalies.push(`PASS (keine ok-Karte) ${v}× in ${k}`);
for (const [id, cs] of subCards) if (!total.taps.has(CARDS.find((c) => c.submission?.id === id)!.submission!.name)) anomalies.push(`Aufgabe ${id} nie beendet (Karten: ${cs.join(", ")})`);
if (total.draw / M > 0.4) anomalies.push(`Hohe Remisquote ${pct(total.draw, M)} – Patt-Gefahr.`);
console.log("\nAuffälligkeiten:"); if (!anomalies.length) console.log("  keine"); for (const a of [...new Set(anomalies)].slice(0, 60)) console.log(`  - ${a}`);
