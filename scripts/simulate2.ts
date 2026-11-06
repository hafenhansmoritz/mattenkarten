// Kern 2 „Körperkarte“ – KI-gegen-KI-Simulation auf echten Karten (CARDS2).
// Ausführen: npx tsx scripts/simulate2.ts [matchesProPaarung=500] [--fixtures]
import { CARDS2 } from "../src/core2/data/cards";
import { FIX } from "../src/core2/engine/fixtures";
import {
  aiChoose, allCards, cardById, legalCards, newMatch, PASS, playRound, POS_LABEL, roleOf, setCardRegistry, slotCards,
} from "../src/core2/engine/index";
import { other, topFor } from "../src/core2/engine/board";
import { chainFrom } from "../src/core2/engine/chains";
import { finishThreats } from "../src/core2/engine/legal";
import { splitPlay } from "../src/core2/engine/konter";
import { isGrundlage, roundShare, simMatch, type SimPlayer } from "../src/core2/engine/sim";
import { BOSSES } from "../src/core2/data/bosses";
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
const POS: Pos2[] = ["stand", "clinch", "headlock", "guard", "half", "turtle", "side", "mount", "back"];
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
const DOMINANT = new Set<string>(["side", "mount", "back", "turtle"]);
interface Agg {
  tap: number; points: number; draw: number; goal: number; pWins: number; oWins: number;
  rounds: number; pass: number; noOk: Map<string, number>;
  pos: Map<string, number>; zone: Map<number, number>; rules: Map<string, number>;
  decisive: Map<string, number>; played: Map<string, number>; taps: Map<string, number>; zeroAction: number;
  reach: Map<string, number>; domRoundSum: number; domMatches: number; vorteil: number;
  /** Slot-Entscheidungen: "pos/role" → Anzahl, und "pos/role|karte" → Anzahl. */
  slotDec: Map<string, number>; slotPick: Map<string, number>;
  /** B29 Didaktik: gespielte Karten, davon Grundlage; Unten-Entscheidungen, davon Grundlage. */
  playedN: number; grundAll: number; bottomDec: number; grundBottom: number;
  /** Mechanik 2: Griffe gelegt (je Griff), gelöst (je Grund), Matches mit mindestens einem Griff. */
  gripOn: Map<string, number>; gripOff: Map<string, number>; gripMatches: number;
  /** Mechanik 3: Ketten – bereit (spielbare Ketten-Karte in der Hand), gespielt (davon), Treffer je Ketten-Karte, Matches, Taps in Ketten-Runden. */
  chainReady: number; chainPlayed: number; chainHit: Map<string, number>; chainMatches: number; chainTaps: number;
  /** Mechanik 3: Entscheidungen, bei denen „Abschluss möglich“ für die Gegenseite angezeigt war, und wie oft der Verteidiger dann in der Zone rahmte. */
  finishShown: number; finishFramed: number;
  /** Mechanik 4: Konter gelegt (je Karte), ausgelöst (je Karte), verfallen (Zeit/Position), Entscheidungen von Stufe 2/3, Matches mit Konter, Taps nach Auslösen. */
  konterSet: Map<string, number>; konterHit: Map<string, number>; konterGone: Map<string, number>; decL23: number; konterMatches: number;
  konterByLevel: Map<number, number>; decByLevel: Map<number, number>;
}
const inc = <K>(m: Map<K, number>, k: K, n = 1) => m.set(k, (m.get(k) ?? 0) + n);
const newAgg = (): Agg => ({ tap: 0, points: 0, draw: 0, goal: 0, pWins: 0, oWins: 0, rounds: 0, pass: 0, noOk: new Map(), pos: new Map(), zone: new Map(), rules: new Map(), decisive: new Map(), played: new Map(), taps: new Map(), zeroAction: 0, reach: new Map(), domRoundSum: 0, domMatches: 0, vorteil: 0, slotDec: new Map(), slotPick: new Map(), playedN: 0, grundAll: 0, bottomDec: 0, grundBottom: 0, gripOn: new Map(), gripOff: new Map(), gripMatches: 0, chainReady: 0, chainPlayed: 0, chainHit: new Map(), chainMatches: 0, chainTaps: 0, finishShown: 0, finishFramed: 0, konterSet: new Map(), konterHit: new Map(), konterGone: new Map(), decL23: 0, konterMatches: 0, konterByLevel: new Map(), decByLevel: new Map() });
const total = newAgg();

function runMatch(lp: Lv, lo: Lv, seed: number, aggs: Agg[]): void {
  const rec = (f: (a: Agg) => void) => aggs.forEach(f);
  const rng = mulberry32(seed);
  let s: State2 = newMatch({ seed });
  let guard = 0;
  let lastScoring: { side: Side; id: string } | null = null;
  const reached = new Set<string>([s.pos]);
  let domRound = 0;
  let vorteil = false;
  let gripped = false;
  let chained = false;
  let kontered = false;
  while (!s.result) {
    if (guard++ > 50) { anomalies.push(`Match seed ${seed} endet nicht (>50 Runden).`); break; }
    const ids: Record<Side, string> = { p: "", o: "" };
    const plays: Record<Side, string> = { p: "", o: "" };
    for (const side of ["p", "o"] as Side[]) {
      const lv = side === "p" ? lp : lo;
      const full = aiChoose(s, side, lv, rng);
      plays[side] = full;
      const sp = splitPlay(full);
      ids[side] = sp.card;
      rec((a) => { inc(a.decByLevel, lv); if (sp.konter) { inc(a.konterByLevel, lv); inc(a.konterSet, sp.konter); } });
      const ready = legalCards(s, side).filter((l) => l.ok && chainFrom(s, side, cardById(l.id)!)).map((l) => l.id);
      if (ready.length) rec((a) => { a.chainReady++; if (ready.includes(ids[side])) a.chainPlayed++; });
      const fin = finishThreats(s, other(side));
      if (fin.length) {
        const c = cardById(ids[side]);
        rec((a) => { a.finishShown++; if (c && fin.some((f) => f.zone === c.zone && c.kind === "rahmen")) a.finishFramed++; });
      }
      const sk = `${s.pos}/${roleOf(s, side)}`;
      rec((a) => { inc(a.slotDec, sk); inc(a.slotPick, `${sk}|${ids[side]}`); });
      if (ids[side] === PASS) {
        rec((a) => a.pass++);
        const all = legalCards(s, side);
        const k = `${s.pos}/${roleOf(s, side)} (${all.length} Karten, alle gesperrt/zu schwach)`; rec((a) => inc(a.noOk, k));
      } else {
        const id = ids[side]; rec((a) => inc(a.played, id));
        const role = roleOf(s, side);
        const g = isGrundlage(cardById(id), s.pos, role);
        rec((a) => { a.playedN++; if (g) a.grundAll++; if (role === "bottom") { a.bottomDec++; if (g) a.grundBottom++; } });
      }
    }
    const { state, round } = playRound(s, plays.p, plays.o);
    rec((a) => inc(a.rules, round.rule));
    if (round.headline.split(/\s+/).length > 10) anomalies.push(`Headline > 10 Wörter: "${round.headline}"`);
    if (round.why.split(/\s+/).length > 20) anomalies.push(`Why > 20 Wörter (${ids.p}/${ids.o}): "${round.why}"`);
    if (round.winner === "none") rec((a) => a.zeroAction++);
    const played: Record<Side, string> = { p: round.pCard, o: round.oCard };
    for (const e of round.events) {
      if (e.t === "konter") { kontered = true; if (e.on === "trigger") rec((a) => inc(a.konterHit, e.card!)); if (e.on === "gone") rec((a) => inc(a.konterGone, e.why!)); }
      if (e.t === "chain") { chained = true; rec((a) => inc(a.chainHit, e.card)); if (round.events.some((x) => x.t === "tap" && x.winner === e.side)) rec((a) => a.chainTaps++); }
      if (e.t === "grip") { gripped = true; if (e.on) rec((a) => inc(a.gripOn, e.name)); else rec((a) => inc(a.gripOff, e.why ?? "?")); }
      if (e.t === "tap") { const id = played[e.winner]; rec((a) => inc(a.decisive, id)); }
      if (e.t === "move") {
        // Wer hat den Wechsel ausgelöst? Die Seite, deren Karte genau dieses Ziel hat.
        for (const side of ["p", "o"] as Side[]) {
          const c = cardById(played[side]);
          const stop = c?.onStop && c.kind === "rahmen" ? { ...c, to: c.onStop } : c;
          if (stop?.to && stop.to.pos === e.pos && topFor(side, stop.to.role) === e.top) { lastScoring = { side, id: stop.id }; continue; }
          if (c?.to && c.to.pos === e.pos && topFor(side, c.to.role) === e.top) lastScoring = { side, id: c.id };
        }
      }
    }
    s = state;
    reached.add(s.pos);
    if (!domRound && DOMINANT.has(s.pos)) domRound = round.round;
    if (/Vorteil/.test(round.headline)) vorteil = true;
    const pk = `${s.pos}${s.top ? "/" + (s.top === "p" ? "p-oben" : "o-oben") : ""}`;
    rec((a) => { inc(a.pos, pk); for (const z of ZONES) inc(a.zone, s.board[z]); });
  }
  const r = s.result;
  const ls = lastScoring as { side: Side; id: string } | null;
  rec((agg) => {
    agg.rounds += s.history.length;
    for (const p of reached) inc(agg.reach, p);
    if (domRound) { agg.domRoundSum += domRound; agg.domMatches++; }
    if (vorteil) agg.vorteil++;
    if (gripped) agg.gripMatches++;
    if (chained) agg.chainMatches++;
    if (kontered) agg.konterMatches++;
    if (!r) return;
    if (r.type === "tap") { agg.tap++; inc(agg.taps, r.sub); }
    else if (r.type === "goal") agg.goal++;
    else if (r.winner === null) agg.draw++;
    else { agg.points++; if (ls && ls.side === r.winner) inc(agg.decisive, ls.id); }
    if (r.winner === "p") agg.pWins++; else if (r.winner === "o") agg.oWins++;
  });
}

const pct = (n: number, d: number) => `${((100 * n) / Math.max(1, d)).toFixed(1)}%`;
console.log(`\nPaarung   tap     punkte  remis   p-sieg  o-sieg  Ø Runden  PASS/Match  Vorteil  Side    Mount   Dominanz@Runde`);
const byPair = new Map<string, Agg>();
for (const lp of [1, 2, 3] as Lv[]) for (const lo of [1, 2, 3] as Lv[]) {
  const agg = newAgg();
  for (let i = 0; i < N; i++) runMatch(lp, lo, lp * 100000 + lo * 10000 + i, [agg, total]);
  console.log(`L${lp}-L${lo}     ${pct(agg.tap, N).padEnd(8)}${pct(agg.points, N).padEnd(8)}${pct(agg.draw, N).padEnd(8)}${pct(agg.pWins, N).padEnd(8)}${pct(agg.oWins, N).padEnd(8)}${(agg.rounds / N).toFixed(2).padEnd(10)}${(agg.pass / N).toFixed(2).padEnd(12)}${pct(agg.vorteil, N).padEnd(9)}${pct(agg.reach.get("side") ?? 0, N).padEnd(8)}${pct(agg.reach.get("mount") ?? 0, N).padEnd(8)}${agg.domMatches ? (agg.domRoundSum / agg.domMatches).toFixed(2) : "–"} (${pct(agg.domMatches, N)})`);
  byPair.set(`${lp}${lo}`, agg);
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
console.log("\nAufgaben (Taps):"); { const tt = [...total.taps.values()].reduce((a, b) => a + b, 0); for (const [k, v] of top(total.taps, 15)) console.log(`  ${k.padEnd(24)} ${String(v).padStart(4)}  ${pct(v, tt)}`); }
console.log("\nEntscheidende Karten (Tap-Karte bzw. letzter Positionswechsel des Punktsiegers):"); for (const [k, v] of top(total.decisive, 12)) console.log(`  ${k.padEnd(24)} ${v}`);
console.log("\nMeistgespielt:"); for (const [k, v] of top(total.played, 10)) console.log(`  ${k.padEnd(24)} ${v}`);
const playedIds = new Set(total.played.keys());
const unplayed = CARDS.filter((c) => !playedIds.has(c.id)).map((c) => c.id);
if (unplayed.length) anomalies.push(`Nie gespielt (${unplayed.length}): ${unplayed.join(", ")}`);
for (const [k, v] of top(total.noOk, 10)) anomalies.push(`PASS (keine ok-Karte) ${v}× in ${k}`);
for (const [id, cs] of subCards) if (!total.taps.has(CARDS.find((c) => c.submission?.id === id)!.submission!.name)) anomalies.push(`Aufgabe ${id} nie beendet (Karten: ${cs.join(", ")})`);
if (total.draw / M > 0.4) anomalies.push(`Hohe Remisquote ${pct(total.draw, M)} – Patt-Gefahr.`);
console.log("\nPositionen erreicht (Anteil Matches):"); for (const p of POS) console.log(`  ${p.padEnd(8)} ${pct(total.reach.get(p) ?? 0, M)}`);
// Befreiungen unten: Anteil der Slot-Entscheidungen, in denen die Karte gespielt wurde.
const ESC_SLOTS: [Pos2, Role2][] = [["side", "bottom"], ["mount", "bottom"], ["back", "bottom"], ["half", "bottom"], ["turtle", "bottom"], ["headlock", "bottom"]];
const ESC_TARGET: Set<string> = new Set(["side/bottom", "mount/bottom"]);
const escLow: string[] = [];
console.log("\nBefreiungen unten (Anteil der Slot-Entscheidungen):");
for (const [pos, role] of ESC_SLOTS) {
  const sk = `${pos}/${role}`;
  const dec = total.slotDec.get(sk) ?? 0;
  const parts = slotCards(pos, role).filter((c) => c.to).map((c) => {
    const n = total.slotPick.get(`${sk}|${c.id}`) ?? 0;
    if (ESC_TARGET.has(sk) && n / Math.max(1, dec) < 0.02) escLow.push(`${c.id} ${pct(n, dec)}`);
    return `${c.id} ${pct(n, dec)}`;
  });
  console.log(`  ${sk.padEnd(13)} (${dec} Entsch.)  ${parts.join(", ")}`);
}
{
  const on = [...total.gripOn.values()].reduce((a, b) => a + b, 0);
  console.log(`\nGriffe (Mechanik 2): in ${pct(total.gripMatches, M)} der Matches, ${(on / M).toFixed(2)} gelegt je Match`);
  console.log(`  gelegt:  ${top(total.gripOn, 10).map(([k, v]) => `${k} ${pct(v, on)}`).join(", ")}`);
  const off = [...total.gripOff.values()].reduce((a, b) => a + b, 0);
  const WHY: Record<string, string> = { rahmen: "Rahmen stoppt Angriff", loesen: "Griff lösen", verdraengt: "verdrängt", position: "Positionswechsel", alt: "ältester ersetzt" };
  console.log(`  gelöst:  ${top(total.gripOff, 10).map(([k, v]) => `${WHY[k] ?? k} ${pct(v, off)}`).join(", ")} (${pct(off, on)} aller gelegten)`);
  const ch = [...total.chainHit.values()].reduce((a, b) => a + b, 0);
  console.log(`\nKetten (Mechanik 3): in ${pct(total.chainMatches, M)} der Matches, ${(ch / M).toFixed(2)} Treffer je Match, Taps in Ketten-Runden ${pct(total.chainTaps, Math.max(1, [...total.taps.values()].reduce((a, b) => a + b, 0)))} aller Taps`);
  console.log(`  bereit: ${total.chainReady} Entscheidungen, gespielt ${pct(total.chainPlayed, Math.max(1, total.chainReady))}`);
  console.log(`  Treffer: ${top(total.chainHit, 12).map(([k, v]) => `${k} ${pct(v, Math.max(1, ch))}`).join(", ")}`);
    const ks = [...total.konterSet.values()].reduce((a, b) => a + b, 0);
  const kh = [...total.konterHit.values()].reduce((a, b) => a + b, 0);
  const lvTxt = ([2, 3] as const).map((lv) => `L${lv} ${pct(total.konterByLevel.get(lv) ?? 0, total.decByLevel.get(lv) ?? 0)}`).join(", ");
  console.log(`\nKonter (Mechanik 4): in ${pct(total.konterMatches, M)} der Matches, ${(ks / M).toFixed(2)} gelegt je Match (Anteil der Entscheidungen: ${lvTxt})`);
  console.log(`  ausgelöst ${pct(kh, ks)} der gelegten · verfallen: Zeit ${pct(total.konterGone.get("zeit") ?? 0, ks)}, Position ${pct(total.konterGone.get("position") ?? 0, ks)}`);
  console.log(`  gelegt:    ${top(total.konterSet, 8).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  console.log(`  ausgelöst: ${top(total.konterHit, 8).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  console.log(`Abschluss möglich (B36): bei ${total.finishShown} Entscheidungen angezeigt, Verteidiger rahmt die Zone in ${pct(total.finishFramed, Math.max(1, total.finishShown))}`);
}
const tapTot = [...total.taps.values()].reduce((a, b) => a + b, 0);
const topTap = top(total.taps, 1)[0];
const domAvg = total.domMatches ? total.domRoundSum / total.domMatches : Infinity;
const l33 = byPair.get("33")!;
// L1 < L2 < L3: Siegquote der stärkeren Stufe über beide Seiten gemittelt (entschiedene Matches).
const share = (hi: Lv, lo: Lv) => {
  const a = byPair.get(`${hi}${lo}`)!, b = byPair.get(`${lo}${hi}`)!;
  const w = a.pWins + b.oWins, l = a.oWins + b.pWins;
  return w / Math.max(1, w + l);
};
const s21 = share(2, 1), s32 = share(3, 2), s31 = share(3, 1);
console.log(`\nStufen (Siegquote der stärkeren Stufe, beide Seiten, entschiedene Matches): L2>L1 ${pct(s21, 1)}, L3>L2 ${pct(s32, 1)}, L3>L1 ${pct(s31, 1)}`);
const tapShares = [...subCards.keys()].map((id) => {
  const name = CARDS.find((c) => c.submission?.id === id)!.submission!.name;
  return { name, share: (total.taps.get(name) ?? 0) / Math.max(1, tapTot) };
});
const lowTaps = tapShares.filter((t) => t.share < 0.03);
const reachShare = (p: Pos2) => (total.reach.get(p) ?? 0) / M;
const checks: [string, boolean, string][] = [
  ["L3 vs L3 Remis < 15%", l33.draw / N < 0.15, pct(l33.draw, N)],
  ["L3 vs L3 per Vorteil ≤ 30%", l33.vorteil / N <= 0.3, pct(l33.vorteil, N)],
  ["Taps gesamt 10–30%", total.tap / M >= 0.1 && total.tap / M <= 0.3, pct(total.tap, M)],
  ["jede Position in ≥ 3% der Matches", POS.every((p) => reachShare(p) >= 0.03), POS.filter((p) => reachShare(p) < 0.03).join(",") || "alle"],
  ["Mount in ≥ 20% der Matches", reachShare("mount") >= 0.2, pct(total.reach.get("mount") ?? 0, M)],
  ["Side Control in ≥ 50% der Matches", reachShare("side") >= 0.5, pct(total.reach.get("side") ?? 0, M)],
  ["Dominanz Ø bis Runde ≤ 5", domAvg <= 5, `${domAvg.toFixed(2)} (in ${pct(total.domMatches, M)} der Matches)`],
  ["kein Griff > 25% der Taps", !topTap || topTap[1] / Math.max(1, tapTot) <= 0.25, topTap ? `${topTap[0]} ${pct(topTap[1], tapTot)}` : "–"],
  ["jeder Griff ≥ 3% der Taps", lowTaps.length === 0, lowTaps.map((t) => `${t.name} ${pct(t.share, 1)}`).join(", ") || "alle"],
  ["jede Befreiung aus Side/Mount unten ≥ 2% der Slot-Entscheidungen", escLow.length === 0, escLow.join(", ") || "alle"],
  ["Stufen gestaffelt: L2 > L1 ≥ 55%, L3 > L2 ≥ 65%, L3 > L1 ≥ 70% (entschiedene Matches)", s21 >= 0.55 && s32 >= 0.65 && s31 >= 0.7, `L2>L1 ${pct(s21, 1)}, L3>L2 ${pct(s32, 1)}, L3>L1 ${pct(s31, 1)}`],
];
// ---- B29 Didaktik: Grundlage-Karten (Rahmen, Befreiungen, Aufbauen in Festhalte-Lagen) ----
const grundBottom = total.grundBottom / Math.max(1, total.bottomDec);
console.log(`\nGrundlage (Rahmen/Befreiungen): ${pct(total.grundAll, total.playedN)} aller gespielten Karten, ${pct(total.grundBottom, total.bottomDec)} der Unten-Entscheidungen`);
checks.push(["Didaktik: ≥ 25% der Unten-Entscheidungen sind Grundlage", grundBottom >= 0.25, pct(total.grundBottom, total.bottomDec)]);

// ---- B28 Bosse: Spielstil auf Stufe 2/3 ----
const NB = Math.max(40, Math.round(N / 2));
const bossVs = (boss: SimPlayer, foe: SimPlayer, sig: string[]) => {
  let w = 0, l = 0, tap = 0, sr = 0, rounds = 0; const hit = new Map<string, number>();
  for (let i = 0; i < NB; i++) {
    const bp = i % 2 === 0;
    const m = bp ? simMatch(boss, foe, 9000 + i) : simMatch(foe, boss, 9000 + i);
    const bs: Side = bp ? "p" : "o";
    const r = m.state.result;
    if (r?.winner === bs) w++; else if (r?.winner) l++;
    if (r?.type === "tap") tap++;
    for (const k of sig) if (m.slots[bs].has(k)) inc(hit, k);
    if (sig.some((k) => m.slots[bs].has(k))) inc(hit, "*");
    const rs = roundShare(m, bs, sig); sr += rs.n; rounds += rs.rounds;
  }
  return { win: w / Math.max(1, w + l), tap: tap / NB, sig: (hit.get("*") ?? 0) / NB, sigRounds: sr / Math.max(1, rounds), hit };
};
console.log(`\nBosse (${NB} Matches je Paarung, Boss abwechselnd p/o; Sieg = entschiedene Matches):`);
for (const b of BOSSES) {
  const boss: SimPlayer = { level: b.level, style: b.style };
  const v1 = bossVs(boss, { level: 1 }, b.signature);
  const v0 = bossVs({ level: b.level }, { level: 1 }, b.signature);
  const v2 = bossVs(boss, { level: 2 }, b.signature);
  const vc = bossVs(boss, { level: 2, style: b.counter }, b.signature);
  const sigTxt = (v: ReturnType<typeof bossVs>) => b.signature.map((k) => `${k} ${pct(v.hit.get(k) ?? 0, NB)}`).join(", ");
  console.log(`  ${b.name.padEnd(20)} vs L1 ${pct(v1.win, 1)} (Tap ${pct(v1.tap, 1)}) · Stil: ${sigTxt(v1)}, ${pct(v1.sigRounds, 1)} der Runden – ohne Stil: ${sigTxt(v0)}, ${pct(v0.sigRounds, 1)} der Runden`);
  console.log(`  ${"".padEnd(20)} vs L2 ${pct(v2.win, 1)} · vs L2+Konter ${pct(vc.win, 1)} (Signatur ${pct(v2.sig, 1)} → ${pct(vc.sig, 1)})`);
  checks.push([`${b.name}: schlägt L1 ≥ 65%`, v1.win >= 0.65, pct(v1.win, 1)]);
  checks.push([`${b.name}: Stil sichtbar (Signatur häufiger als ohne Stil)`, v1.sig > v0.sig && v1.sigRounds > v0.sigRounds, `Matches ${pct(v1.sig, 1)} vs ${pct(v0.sig, 1)}, Runden ${pct(v1.sigRounds, 1)} vs ${pct(v0.sigRounds, 1)}`]);
  checks.push([`${b.name}: verliert manchmal gegen Konter (≥ 10%), Konter wirkt`, 1 - vc.win >= 0.1 && (vc.win < v2.win || vc.sig < v2.sig), `Konter gewinnt ${pct(1 - vc.win, 1)}`]);
}

console.log("\nZiele:"); for (const [n, ok, v] of checks) console.log(`  [${ok ? "ok" : "--"}] ${n}: ${v}`);
console.log("\nAuffälligkeiten:"); if (!anomalies.length) console.log("  keine"); for (const a of [...new Set(anomalies)].slice(0, 60)) console.log(`  - ${a}`);
