import { aiChoose, newMatch, playRound, roleOf, PASS } from "../src/core2/engine/index";
import { mulberry32 } from "../src/engine/rng";
import type { Side, State2 } from "../src/core2/types";
const lp = Number(process.argv[2] ?? 2), lo = Number(process.argv[3] ?? 2), N = Number(process.argv[4] ?? 500);
const dec = new Map<string, number>(), pick = new Map<string, number>(), rules = new Map<string,number>();
const inc = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
let dom = 0, taps = 0, mount = 0;
for (let i = 0; i < N; i++) {
  const rng = mulberry32(lp * 100000 + lo * 10000 + i);
  let s: State2 = newMatch({ seed: lp * 100000 + lo * 10000 + i });
  let d = false, m = false;
  while (!s.result) {
    const ids: Record<Side, string> = { p: "", o: "" };
    for (const side of ["p", "o"] as Side[]) {
      ids[side] = aiChoose(s, side, (side === "p" ? lp : lo) as 1|2|3, rng);
      const sk = `${s.pos}/${roleOf(s, side)}`; inc(dec, sk); inc(pick, `${sk}|${ids[side]}`);
    }
    const r = playRound(s, ids.p, ids.o); s = r.state; inc(rules, `${r.round.posBefore}:${r.round.rule}`);
    if (["side","mount","back","turtle"].includes(s.pos)) d = true;
    if (s.pos === "mount") m = true;
  }
  if (d) dom++; if (m) mount++; if (s.result.type === "tap") taps++;
}
console.log(`dom ${(100*dom/N).toFixed(1)}% mount ${(100*mount/N).toFixed(1)}% taps ${(100*taps/N).toFixed(1)}%`);
const bySlot = new Map<string, [string, number][]>();
for (const [k, v] of pick) { const [sk, id] = k.split("|"); bySlot.set(sk, [...(bySlot.get(sk) ?? []), [id, v]]); }
for (const [sk, arr] of [...bySlot].sort((a,b)=>(dec.get(b[0])!-dec.get(a[0])!))) console.log(sk.padEnd(14), dec.get(sk), arr.sort((a,b)=>b[1]-a[1]).map(([id,v])=>`${id} ${(100*v/dec.get(sk)!).toFixed(0)}%`).join(", "));
console.log([...rules].sort((a,b)=>b[1]-a[1]).slice(0,20).map(([k,v])=>`${k} ${v}`).join("\n"));
