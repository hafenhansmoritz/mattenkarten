// Auflösung einer Runde (Spec „Regeln“ 1–9).
import type { Card2, Event2, Round2, Side, State2, SubTrack, Zone } from "../types";
import { ZONES } from "../types";
import { clampZone, other, POS_LABEL, roleOf, sign, topFor, ZONE_LABEL } from "./board";
import { checkCard, heldInSub, PASS, unmetRequires } from "./legal";
import { cardById } from "./registry";

export const KRAFT_MAX = 5;

/** Balance-Schalter (Spec „Balance-Änderungen“). Jeder Schalter ist eine Regel, die ein Anfänger in einem Satz versteht. */
export const BALANCE = {
  /** B1 Dilemma: der Rahmen stoppt den Angriff, gewinnt aber selbst keine Zone. */
  dilemmaNoFrameGain: true,
  /** B2 Ungerahmter Griff: ein Aufgabe-Angriff, der nicht in seiner Zone gerahmt wird, rückt 2 Schritte vor. */
  unframedSubSteps: 2,
  /** B3 Gewicht: Aufbauen gegen Aufbauen in derselben Zone – der Obere setzt sich durch (+1); im Stand hebt es sich auf. */
  topWinsBuildTie: true,
  /** B4 Griff hält fest: sitzt ein Aufgabegriff gegen den Unteren (Leiste ab Schritt 2, auch in derselben Runde), scheitert seine Flucht.
   *  Bei Schritt 1 (nur isoliert) bleibt Weggehen erlaubt – und löscht die Leiste. Schwelle: HOLD_STEP in legal.ts. */
  gripStopsEscape: true,
  /** B5 Schwung: nach einem Positionswechsel steht die Zone, die ihn trug, auf +1 für den Gewinner. */
  momentum: true,
  /** B6 Gerangel: Angriff gegen Angriff ohne Vorsprung in der Zone – Vorteil auf der Körperkarte, sonst am Boden der Obere
   *  (er hat die Basis). Nie der Atem. Im Stand/Clinch bleibt es Gerangel. */
  boardThenTopWinsScramble: true,
};

export function cloneState(s: State2): State2 {
  return {
    ...s,
    board: { ...s.board },
    p: { ...s.p, locked: [...s.p.locked] },
    o: { ...s.o, locked: [...s.o.locked] },
    subs: s.subs.map((t) => ({ ...t })),
    history: [...s.history],
    result: s.result ? { ...s.result } : null,
    goal: s.goal ? s.goal.map((g) => ({ ...g })) : undefined,
  };
}

type Rule = Round2["rule"];

/** Ergebnis-Notiz für Schlagzeile/Erklärung. prio: höher = wichtiger. */
interface Note { prio: number; side: Side | null; headline: string; why?: string; zone: Zone | null }

interface Ctx {
  s: State2;           // wird verändert
  start: State2;       // Zustand zu Rundenbeginn (requires-Prüfung)
  events: Event2[];
  notes: Note[];
  acted: Set<Side>;    // Seiten, deren Karte etwas bewirkt hat
  pendingMoves: { side: Side; card: Card2 }[];
}

const q = (c: Card2) => `„${c.plain}“`;
const you = (side: Side) => side === "p";

function addZone(ctx: Ctx, side: Side, zone: Zone, n: number): number {
  const before = ctx.s.board[zone];
  const after = clampZone(before + n * sign(side));
  ctx.s.board[zone] = after;
  const delta = after - before;
  if (delta !== 0) ctx.events.push({ t: "zone", zone, delta, by: side });
  return delta;
}

function gainWith(ctx: Ctx, side: Side, c: Card2, extra = 0): void {
  addZone(ctx, side, c.zone, (c.gain ?? 1) + extra);
  if (c.alsoGain) for (const z of ZONES) { const v = c.alsoGain[z]; if (v) addZone(ctx, side, z, v); }
}

function changeKraft(ctx: Ctx, side: Side, delta: number): void {
  const f = ctx.s[side];
  const nv = Math.max(0, Math.min(KRAFT_MAX, f.kraft + delta));
  if (nv !== f.kraft) { ctx.events.push({ t: "kraft", side, delta: nv - f.kraft }); f.kraft = nv; }
}

/** Rahmen schlägt den Aufgabe-Angriff `ac` (rahmen>angriff, gleiche Zone): dessen Leiste −1. true = etwas bewirkt. */
function frameSubs(ctx: Ctx, side: Side, c: Card2, ac: Card2): boolean {
  const foe = other(side);
  if (!ac.submission) return false;
  let hit = false;
  for (const t of ctx.s.subs) {
    if (t.owner === foe && t.id === ac.submission.id && t.step > 0) {
      t.step = (t.step - 1) as SubTrack["step"];
      ctx.events.push({ t: "sub", owner: foe, id: t.id, step: t.step });
      hit = true;
      ctx.notes.push({
        prio: 50, side,
        headline: you(side) ? `Dein ${q(c)} löst seinen Griff etwas.` : `Sein ${q(c)} löst deinen Griff etwas.`,
        why: "Ein Rahmen in derselben Zone setzt die Aufgabe um einen Schritt zurück.",
        zone: c.zone,
      });
    }
  }
  ctx.s.subs = ctx.s.subs.filter((t) => t.step > 0);
  return hit;
}

/** Angriff ausführen (Erfolg). Positionswechsel werden gesammelt und am Ende angewendet. */
function attackSucceeds(ctx: Ctx, side: Side, c: Card2, steps = 1): boolean {
  if (unmetRequires(ctx.start, side, c).length) return false;
  ctx.acted.add(side);
  if (c.submission) {
    let t = ctx.s.subs.find((x) => x.owner === side && x.id === c.submission!.id);
    if (!t) { t = { id: c.submission.id, name: c.submission.name, owner: side, step: 0, zone: c.zone }; ctx.s.subs.push(t); }
    t.zone = c.zone;
    t.step = Math.min(3, t.step + steps) as SubTrack["step"];
    ctx.events.push({ t: "sub", owner: side, id: t.id, step: t.step });
    if (t.step >= 3) {
      ctx.notes.push({
        prio: 100, side,
        headline: you(side) ? `Tap! Du gewinnst mit ${t.name}.` : `Tap! Er gewinnt mit ${t.name}.`,
        why: c.why, zone: c.zone,
      });
    } else {
      ctx.notes.push({
        prio: 60, side,
        headline: you(side) ? `${q(c)} greift: Aufgabe Schritt ${t.step} von 3.` : `Sein ${q(c)}: Aufgabe gegen dich, Schritt ${t.step}.`,
        why: c.why, zone: c.zone,
      });
    }
  }
  if (c.to) ctx.pendingMoves.push({ side, card: c });
  if (!c.submission && !c.to) {
    ctx.notes.push({ prio: 40, side, headline: you(side) ? `Dein ${q(c)} sitzt.` : `Sein ${q(c)} sitzt.`, why: c.why, zone: c.zone });
  }
  return true;
}

function applyMove(ctx: Ctx, side: Side, c: Card2): void {
  const to = c.to!;
  const s = ctx.s;
  s.pos = to.pos;
  s.top = topFor(side, to.role);
  // Zone, die den Wechsel trug, auf ±1 kappen.
  const before = s.board[c.zone];
  // Balance „Schwung“: der Gewinner kommt mit +1 in dieser Zone an (statt nur kappen).
  s.board[c.zone] = BALANCE.momentum ? sign(side) : Math.max(-1, Math.min(1, before));
  if (s.board[c.zone] !== before) ctx.events.push({ t: "zone", zone: c.zone, delta: s.board[c.zone] - before, by: side });
  // Positionswechsel löscht alle Aufgabe-Leisten.
  for (const t of s.subs) if (t.step > 0) ctx.events.push({ t: "sub", owner: t.owner, id: t.id, step: 0 });
  s.subs = [];
  ctx.events.push({ t: "move", pos: s.pos, top: s.top, escape: to.escape });
  if (to.points) { s[side].pts += to.points; ctx.events.push({ t: "points", side, n: to.points }); }
  const role = to.role === "neutral" ? "im" : to.role === "top" ? "oben in" : "unten in";
  const pos = POS_LABEL[to.pos];
  ctx.notes.push({
    prio: 80, side,
    headline: you(side) ? `${q(c)} klappt: du ${role} ${pos}.` : `Sein ${q(c)}: er ${role} ${pos}.`,
    why: c.why, zone: c.zone,
  });
}

function resolveMoves(ctx: Ctx): void {
  const mv = ctx.pendingMoves;
  if (mv.length === 0) return;
  if (mv.length === 1) {
    const m = mv[0];
    // Balance „Griff hält fest“: setzt der Gegner in derselben Runde erfolgreich einen Aufgabegriff an, scheitert die Flucht.
    if (BALANCE.gripStopsEscape && heldInSub(ctx.s, m.side)) {
      ctx.notes.push({
        prio: 65, side: other(m.side),
        headline: you(m.side) ? `Sein Griff hält dich: ${q(m.card)} scheitert.` : `Dein Griff hält ihn: ${q(m.card)} scheitert.`,
        why: "Wer im Moment der Flucht gegriffen wird, muss erst den Griff lösen.",
        zone: m.card.zone,
      });
      return;
    }
    applyMove(ctx, m.side, m.card);
    return;
  }
  // Beide Angriffe mit Positionswechsel erfolgreich (nur in verschiedenen Zonen möglich):
  // wer in seiner Zone weiter vorne liegt, setzt sich durch; Gleichstand = Gerangel.
  const v = mv.map((m) => ctx.start.board[m.card.zone] * sign(m.side));
  const kw = scrambleWinner(ctx);
  if (v[0] === v[1] && !kw) { scramble(ctx, null); return; }
  const w = v[0] > v[1] ? mv[0] : v[1] > v[0] ? mv[1] : mv.find((m) => m.side === kw)!;
  applyMove(ctx, w.side, w.card);
}

/** Balance „Gerangel“ (B6): bei Gleichstand in der Zone setzt sich durch, wer auf der ganzen Körperkarte vorne liegt
 *  (Vorteil), sonst am Boden der Obere (Basis auf der Matte). Atem entscheidet nie. null = echtes Gerangel (Stand/Clinch). */
function scrambleWinner(ctx: Ctx): Side | null {
  if (!BALANCE.boardThenTopWinsScramble) return null;
  const sum = ZONES.reduce((a, z) => a + ctx.start.board[z], 0);
  if (sum !== 0) return sum > 0 ? "p" : "o";
  return ctx.start.top;
}

function scramble(ctx: Ctx, zone: Zone | null): void {
  changeKraft(ctx, "p", -1);
  changeKraft(ctx, "o", -1);
  ctx.notes.push({
    prio: 30, side: null,
    headline: "Gerangel: beide hängen fest, beide verlieren Atem.",
    why: "Gleich starke Angriffe blockieren sich. Wer die Zone vorher gewinnt, setzt sich durch.",
    zone,
  });
}

const RULE_WHY: Record<Rule, string> = {
  "verschiedene-zonen": "Verschiedene Zonen: beide Karten wirken unabhängig voneinander.",
  "angriff>aufbauen": "Wer aufbaut statt zu verteidigen, wird angegriffen.",
  "aufbauen>rahmen": "Der Rahmen wartete auf einen Angriff – die Finte nutzt das.",
  "rahmen>angriff": "Ein Rahmen in der richtigen Zone stoppt den Angriff.",
  "angriff=angriff": "Angriff gegen Angriff: wer die Zone kontrolliert, gewinnt.",
  "aufbauen=aufbauen": "Beide bauen in derselben Zone – das hebt sich auf.",
  "rahmen=rahmen": "Beide verteidigen – niemand kommt voran.",
  "rahmen-ins-leere": "Ein Rahmen ohne Angriff in seiner Zone verpufft.",
};

/** Haupt-Auflösung. Karten müssen legal sein (oder PASS, wenn keine Karte spielbar ist). */
export function resolveRound(s0: State2, pId: string, oId: string): { state: State2; round: Round2 } {
  if (s0.result) throw new Error("Match ist beendet");
  const ids: Record<Side, string> = { p: pId, o: oId };
  const cards: Record<Side, Card2 | null> = { p: null, o: null };
  for (const side of ["p", "o"] as Side[]) {
    const id = ids[side];
    if (id === PASS) continue;
    const c = cardById(id);
    if (!c) throw new Error(`Unbekannte Karte: ${id}`);
    if (!c.slots.some((sl) => sl.pos === s0.pos && sl.role === roleOf(s0, side))) throw new Error(`${id} passt nicht in den Slot`);
    const chk = checkCard(s0, side, c);
    if (!chk.ok) throw new Error(`${id} nicht spielbar: ${chk.reason}`);
    cards[side] = c;
  }

  const s = cloneState(s0);
  const ctx: Ctx = { s, start: s0, events: [], notes: [], acted: new Set(), pendingMoves: [] };

  // Atem bezahlen (internes Feld: kraft).
  for (const side of ["p", "o"] as Side[]) { const c = cards[side]; if (c?.kraft) changeKraft(ctx, side, -c.kraft); }

  const P = cards.p, O = cards.o;
  let rule: Rule;
  let triWinner: Side | "both" | "none" | null = null;

  if (P && O && P.zone === O.zone) {
    const z = P.zone;
    const kinds = `${P.kind}|${O.kind}`;
    const byKind = (k: string): Side => (P.kind === k ? "p" : "o");
    if (P.kind === O.kind) {
      if (P.kind === "angriff") {
        rule = "angriff=angriff";
        const vp = s0.board[z]; // >0: p vorne
        const kw = scrambleWinner(ctx);
        if (vp === 0 && !kw) { scramble(ctx, z); triWinner = "none"; }
        else {
          const w: Side = vp > 0 ? "p" : vp < 0 ? "o" : kw!;
          if (attackSucceeds(ctx, w, cards[w]!)) triWinner = w; else triWinner = "none";
        }
      } else if (P.kind === "aufbauen") {
        rule = "aufbauen=aufbauen"; triWinner = "none";
        const t = s0.top;
        if (BALANCE.topWinsBuildTie && t) {
          addZone(ctx, t, z, 1);
          ctx.acted.add(t);
          triWinner = t;
          ctx.notes.push({
            prio: 15, side: t,
            headline: you(t) ? `Beide bauen an ${ZONE_LABEL[z]} – du oben setzt dich durch.` : `Beide bauen an ${ZONE_LABEL[z]} – er oben setzt sich durch.`,
            why: "Bauen beide in derselben Zone, gewinnt der Obere: er hat das Gewicht.",
            zone: z,
          });
        } else ctx.notes.push({ prio: 10, side: null, headline: `Beide bauen an ${ZONE_LABEL[z]} – hebt sich auf.`, zone: z });
      } else {
        rule = "rahmen=rahmen"; triWinner = "none";
        ctx.notes.push({ prio: 5, side: null, headline: "Beide rahmen – nichts passiert.", zone: z });
      }
    } else if (kinds.includes("angriff") && kinds.includes("aufbauen")) {
      rule = "angriff>aufbauen";
      const a = byKind("angriff");
      // Erwischt beim Aufbauen statt Verteidigen: ein Aufgabegriff rutscht gleich weiter.
      triWinner = attackSucceeds(ctx, a, cards[a]!, BALANCE.unframedSubSteps) ? a : "none";
    } else if (kinds.includes("aufbauen") && kinds.includes("rahmen")) {
      rule = "aufbauen>rahmen";
      const b = byKind("aufbauen"), c = cards[b]!;
      gainWith(ctx, b, c, 1);
      ctx.acted.add(b);
      triWinner = b;
      const n = (c.gain ?? 1) + 1;
      ctx.notes.push({
        prio: 45, side: b,
        headline: you(b) ? `Finte! ${q(c)} bringt dir +${n} an ${ZONE_LABEL[z]}.` : `Finte! ${q(c)} bringt ihm +${n} an ${ZONE_LABEL[z]}.`,
        why: RULE_WHY["aufbauen>rahmen"], zone: z,
      });
    } else {
      rule = "rahmen>angriff";
      const r = byKind("rahmen"), a = other(r);
      const rc = cards[r]!, ac = cards[a]!;
      if (!(ac.dilemmaOpens && BALANCE.dilemmaNoFrameGain)) gainWith(ctx, r, rc);
      frameSubs(ctx, r, rc, ac);
      // B16 Konter-Wechsel: stoppt ein Rahmen mit onStop einen Positionsangriff (Sprawl gegen den Shot), wechselt die Position.
      if (rc.onStop && ac.to && !unmetRequires(ctx.start, r, { ...rc, requires: rc.onStopRequires }).length) {
        ctx.pendingMoves.push({ side: r, card: { ...rc, to: rc.onStop } });
      }
      ctx.acted.add(r);
      triWinner = r;
      let why = rc.why;
      if (ac.dilemmaOpens) {
        addZone(ctx, a, ac.dilemmaOpens, 1);
        ctx.events.push({ t: "dilemma", side: a, zone: ac.dilemmaOpens });
        ctx.acted.add(a);
        why = `Dilemma: Wer ${ZONE_LABEL[z]} verteidigt, öffnet ${ZONE_LABEL[ac.dilemmaOpens]}.`;
      }
      ctx.notes.push({
        prio: 70, side: r,
        headline: you(r) ? `Dein ${q(rc)} stoppt seinen Angriff.` : `Sein ${q(rc)} stoppt deinen Angriff.`,
        why, zone: z,
      });
    }
  } else {
    // Verschiedene Zonen (oder eine Seite passt): beide wirken unabhängig.
    let leer = false;
    for (const side of ["p", "o"] as Side[]) {
      const c = cards[side];
      if (!c) continue;
      if (c.kind === "aufbauen") {
        gainWith(ctx, side, c);
        ctx.acted.add(side);
        ctx.notes.push({
          prio: 20, side,
          headline: you(side) ? `Du baust auf: ${q(c)}, ${ZONE_LABEL[c.zone]} +${c.gain ?? 1}.` : `Er baut auf: ${q(c)}, ${ZONE_LABEL[c.zone]} +${c.gain ?? 1}.`,
          why: c.why, zone: c.zone,
        });
      } else if (c.kind === "angriff") {
        attackSucceeds(ctx, side, c, BALANCE.unframedSubSteps);
      } else {
        {
          leer = true;
          ctx.notes.push({
            prio: 25, side: other(side),
            headline: you(side) ? `Dein Rahmen an ${ZONE_LABEL[c.zone]} geht ins Leere.` : `Sein Rahmen an ${ZONE_LABEL[c.zone]} geht ins Leere.`,
            why: RULE_WHY["rahmen-ins-leere"], zone: c.zone,
          });
        }
      }
    }
    rule = leer ? "rahmen-ins-leere" : "verschiedene-zonen";
  }

  // Tap vor Positionswechsel (Wechsel würde die Leiste löschen).
  const taps = s.subs.filter((t) => t.step >= 3);
  if (taps.length === 1) {
    const t = taps[0];
    s.result = { type: "tap", winner: t.owner, sub: t.name };
    ctx.events.push({ t: "tap", winner: t.owner, sub: t.name });
  } else if (taps.length > 1) {
    // Beide gleichzeitig am Ende: keiner schafft es, beide Leisten bleiben auf 2.
    for (const t of taps) { t.step = 2; ctx.events.push({ t: "sub", owner: t.owner, id: t.id, step: 2 }); }
  }
  if (!s.result) resolveMoves(ctx);

  // Rundenende: Sperren, Atem, Rundenzähler, Ziel/Punkte.
  s.p.locked = P ? [P.id] : [];
  s.o.locked = O ? [O.id] : [];
  if (!s.result && s.goal && s.goal.some((g) => g.pos === s.pos && g.role === roleOf(s, "p"))) {
    s.result = { type: "goal", winner: "p" };
  }
  if (!s.result) {
    for (const side of ["p", "o"] as Side[]) { const f = s[side]; f.kraft = Math.min(KRAFT_MAX, f.kraft + 1); }
    if (s.round >= s.maxRounds) {
      let w: Side | null = s.p.pts > s.o.pts ? "p" : s.o.pts > s.p.pts ? "o" : null;
      if (w === null) {
        // Vorteil: bei Punktgleichstand entscheidet die Brettsumme (Sicht von p).
        const sum = ZONES.reduce((a, z) => a + s.board[z], 0);
        if (sum !== 0) {
          w = sum > 0 ? "p" : "o";
          ctx.notes.push({
            prio: 90, side: w,
            headline: w === "p" ? "Punktgleich – du gewinnst durch Vorteil." : "Punktgleich – er gewinnt durch Vorteil.",
            why: "Bei gleichen Punkten gewinnt, wer auf der Körperkarte insgesamt vorne liegt.",
            zone: null,
          });
        }
      }
      s.result = { type: "points", winner: w };
    } else s.round += 1;
  }

  const winner: Round2["winner"] = triWinner ?? (ctx.acted.size === 2 ? "both" : ctx.acted.size === 1 ? [...ctx.acted][0] : "none");
  const top = ctx.notes.slice().sort((a, b) => b.prio - a.prio)[0];
  const round: Round2 = {
    round: s0.round,
    pCard: pId, oCard: oId,
    rule, winner, events: ctx.events,
    headline: top?.headline ?? "Keiner kommt voran.",
    why: top?.why ?? RULE_WHY[rule],
    focusZone: top?.zone ?? null,
    posBefore: s0.pos, topBefore: s0.top,
  };
  s.history.push(round);
  return { state: s, round };
}
