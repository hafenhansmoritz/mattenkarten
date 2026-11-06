// Auflösung einer Runde (Spec „Regeln“ 1–9).
import type { Card2, Event2, Grip2, Round2, Side, State2, SubTrack, Zone } from "../types";
import { ZONES } from "../types";
import { clampZone, other, POS_LABEL, roleOf, sign, topFor, ZONE_LABEL } from "./board";
import { checkCard, heldInSub, PASS, unmetRequires } from "./legal";
import { cardById } from "./registry";
import { breakable, GRIP_MAX, gripFits } from "./grips";
import { chainFrom } from "./chains";
import { checkKonter, KONTER_COST, KONTER_NO_GAIN, KONTER_ROUNDS, konterFits, splitPlay } from "./konter";
import { checkStil, STIL_COST, STIL_GAIN, STIL_POWER, stilBlockedBy } from "./stil";

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
    grips: (s.grips ?? []).map((g) => ({ ...g })),
    history: [...s.history],
    result: s.result ? { ...s.result } : null,
    goal: s.goal ? s.goal.map((g) => ({ ...g })) : undefined,
    ...(s.konter ? { konter: Object.fromEntries(Object.entries(s.konter).map(([k, v]) => [k, { ...v }])) } : {}),
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

// ---------------- Mechanik 2: Griffe (B31–B34) ----------------
type GripWhy = Extract<Event2, { t: "grip" }>["why"];

function dropGrip(ctx: Ctx, g: Grip2, why: GripWhy): void {
  ctx.s.grips = ctx.s.grips.filter((x) => x !== g);
  ctx.events.push({ t: "grip", owner: g.owner, id: g.id, name: g.name, zone: g.zone, on: false, why });
}

/** B31: gelungene Griff-Karte legt den Griff. Gleicher Griff oder gleiche Zone: ersetzt den eigenen;
 *  sein Griff in dieser Zone wird verdrängt (B33); mehr als GRIP_MAX: der älteste fällt. */
function placeGrip(ctx: Ctx, side: Side, c: Card2): void {
  if (!c.grip || ctx.s.noGrips) return;
  const s = ctx.s;
  for (const g of s.grips.filter((x) => x.owner === side && (x.id === c.grip!.id || x.zone === c.zone))) s.grips = s.grips.filter((x) => x !== g);
  const pushed = s.grips.filter((x) => x.owner !== side && x.zone === c.zone);
  for (const g of pushed) dropGrip(ctx, g, "verdraengt");
  s.grips.push({ id: c.grip.id, name: c.grip.name, owner: side, zone: c.zone, card: c.id });
  ctx.events.push({ t: "grip", owner: side, id: c.grip.id, name: c.grip.name, zone: c.zone, on: true });
  const mine = s.grips.filter((x) => x.owner === side);
  if (mine.length > GRIP_MAX) dropGrip(ctx, mine[0], "alt");
  const z = ZONE_LABEL[c.zone];
  ctx.notes.push({
    prio: pushed.length ? 46 : 22, side,
    headline: pushed.length
      ? (you(side) ? `Dein ${c.grip.name} verdrängt seinen ${pushed[0].name}.` : `Sein ${c.grip.name} verdrängt deinen ${pushed[0].name}.`)
      : (you(side) ? `Dein Griff liegt: ${c.grip.name} (${z}).` : `Sein Griff liegt: ${c.grip.name} (${z}).`),
    why: you(side) ? `Solange dein Griff liegt, brauchen deine Angriffe in der Zone ${z} 1 weniger.`
      : `Solange sein Griff liegt, brauchen seine Angriffe in der Zone ${z} 1 weniger.`,
    zone: c.zone,
  });
}

/** B32 Griff lösen: Karte mit breaks, die nicht geschlagen wurde, löst seine passenden Griffe. true = etwas gelöst. */
function applyBreaks(ctx: Ctx, side: Side, c: Card2): boolean {
  const hit = breakable(ctx.s, side, c);
  for (const g of hit) dropGrip(ctx, g, "loesen");
  if (!hit.length) return false;
  ctx.acted.add(side);
  const n = hit[0].name;
  ctx.notes.push({
    prio: 56, side,
    headline: you(side) ? `${q(c)} löst seinen ${n}.` : `${q(c)}: er löst deinen ${n}.`,
    why: "Ein Griff bleibt liegen, bis man ihn aktiv löst – das ist Grip Fighting.",
    zone: hit[0].zone,
  });
  return true;
}

/** B34: nach einem Positionswechsel fallen Griffe, die zur neuen Lage nicht passen. */
function dropUnfitGrips(ctx: Ctx): void {
  for (const g of [...ctx.s.grips]) if (!gripFits(ctx.s, g)) dropGrip(ctx, g, "position");
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
  // B35 Kette: folgt die Karte auf ihre passende Vorrunden-Karte, wird der Treffer als Kette gemeldet (FX „KETTE!“).
  const from = chainFrom(ctx.start, side, c);
  if (from) {
    ctx.events.push({ t: "chain", side, from: from.id, card: c.id });
    ctx.notes.push({
      prio: 62, side,
      headline: you(side) ? `Deine Kette: ${from.term} → ${c.term}.` : `Seine Kette: ${from.term} → ${c.term}.`,
      why: c.chain!.why, zone: c.zone,
    });
  }
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
  // B34: Griffe, die zur neuen Lage nicht passen, fallen.
  dropUnfitGrips(ctx);
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
        headline: you(m.side) ? `Seine Aufgabe hält dich: ${q(m.card)} scheitert.` : `Deine Aufgabe hält ihn: ${q(m.card)} scheitert.`,
        why: "Steckst du im Moment der Flucht in seiner Aufgabe, musst du sie erst abwehren.",
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
export function resolveRound(s0: State2, pPlay: string, oPlay: string): { state: State2; round: Round2 } {
  if (s0.result) throw new Error("Match ist beendet");
  const pSplit = splitPlay(pPlay), oSplit = splitPlay(oPlay);
  const pId = pSplit.card, oId = oSplit.card;
  const konterIds: Record<Side, string | null> = { p: pSplit.konter, o: oSplit.konter };
  const ids: Record<Side, string> = { p: pId, o: oId };
  const cards: Record<Side, Card2 | null> = { p: null, o: null };
  /** Mechanik 4: diese Runde verdeckt gelegter Konter (statt einer Karte). */
  const setting: Record<Side, Card2 | null> = { p: null, o: null };
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
  for (const side of ["p", "o"] as Side[]) {
    const kid = konterIds[side];
    if (!kid) continue;
    const kc = cardById(kid);
    if (!kc) throw new Error(`Unbekannte Karte: ${kid}`);
    const chk = checkKonter(s0, side, kc, cards[side]);
    if (!chk.ok) throw new Error(`Konter ${kid} nicht legbar: ${chk.reason}`);
    setting[side] = kc;
  }
  // Mechanik 5 (B44): zusätzlich die Stil-Fähigkeit – geprüft gegen die gewählte Karte und einen gleichzeitig gelegten Konter.
  const usingStil: Record<Side, boolean> = { p: pSplit.stil, o: oSplit.stil };
  for (const side of ["p", "o"] as Side[]) {
    if (!usingStil[side]) continue;
    const chk = checkStil(s0, side, cards[side], setting[side]);
    if (!chk.ok) throw new Error(`Stil-Fähigkeit nicht möglich: ${chk.reason}`);
  }

  const s = cloneState(s0);
  const ctx: Ctx = { s, start: s0, events: [], notes: [], acted: new Set(), pendingMoves: [] };

  // B38 Legen: der zusätzlich gelegte Rahmen kostet KONTER_COST Atem und liegt ab sofort (diese und nächste Runde).
  for (const side of ["p", "o"] as Side[]) {
    const kc = setting[side];
    if (!kc) continue;
    changeKraft(ctx, side, -(KONTER_COST + (kc.kraft ?? 0)));
    s.konter = { ...s.konter, [side]: { card: kc.id, zone: kc.zone, left: KONTER_ROUNDS } };
    ctx.events.push({ t: "konter", side, on: "set" });
  }
  // B40 Auslösen: spielt er in der Zone deines Konters einen Angriff oder eine Finte, springt der Konter ein – statt deiner gewählten Karte
  // (die bleibt in der Hand, ungesperrt und unbezahlt). Geprüft gegen die gewählten Karten beider Seiten, danach ersetzt.
  const triggered: Record<Side, Card2 | null> = { p: null, o: null };
  for (const side of ["p", "o"] as Side[]) {
    const k = s.konter?.[side];
    const foeCard = cards[other(side)];
    // Auch eine Finte (Aufbauen) dort weckt den Konter – und schlägt ihn wie jeden Rahmen (Dreieck bleibt).
    if (!k?.card || !k.zone || !foeCard || foeCard.kind === "rahmen" || foeCard.zone !== k.zone) continue;
    triggered[side] = cardById(k.card) ?? null;
  }
  for (const side of ["p", "o"] as Side[]) {
    const kc = triggered[side];
    if (!kc) continue;
    const instead = cards[side];
    cards[side] = kc;
    delete s.konter![side];
    ctx.events.push({ t: "konter", side, on: "trigger", card: kc.id, zone: kc.zone, ...(instead ? { instead: instead.id } : {}) });
  }
  // Schlagzeile fürs Legen (nur wenn er nicht gleich auslöste).
  for (const side of ["p", "o"] as Side[]) {
    const kc = setting[side];
    if (!kc || triggered[side]) continue;
    ctx.notes.push({
      prio: 18, side,
      headline: you(side) ? `Du legst zusätzlich verdeckt: ${q(kc)}.` : "Er legt zusätzlich verdeckt einen Konter.",
      why: you(side) ? `Greift er an ${ZONE_LABEL[kc.zone]} an, springt dein Rahmen ein – auch nächste Runde noch.`
        : "Er hat einen Rahmen vorbereitet. Lies ihn: Wo würde er an deiner Stelle rahmen?",
      zone: you(side) ? kc.zone : null,
    });
  }

  // B44: die Fähigkeit kostet STIL_COST Atem – auch wenn sie danach verpufft (wie ein Rahmen ins Leere).
  for (const side of ["p", "o"] as Side[]) if (usingStil[side]) changeKraft(ctx, side, -STIL_COST);
  // Atem bezahlen (internes Feld: kraft). Ein ausgelöster Konter ist schon bezahlt.
  for (const side of ["p", "o"] as Side[]) { const c = cards[side]; if (c?.kraft && !triggered[side]) changeKraft(ctx, side, -c.kraft); }

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
          placeGrip(ctx, t, cards[t]!);
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
      placeGrip(ctx, b, c);
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
      if (!(ac.dilemmaOpens && BALANCE.dilemmaNoFrameGain) && !(KONTER_NO_GAIN && triggered[r])) gainWith(ctx, r, rc);
      frameSubs(ctx, r, rc, ac);
      // B16 Konter-Wechsel: stoppt ein Rahmen mit onStop einen Positionsangriff (Sprawl gegen den Shot), wechselt die Position.
      if (rc.onStop && ac.to && !unmetRequires(ctx.start, r, { ...rc, requires: rc.onStopRequires }).length) {
        ctx.pendingMoves.push({ side: r, card: { ...rc, to: rc.onStop } });
      }
      ctx.acted.add(r);
      triWinner = r;
      // B32: Der Rahmen, der seinen Angriff stoppt, löst auch seinen Griff in dieser Zone.
      for (const g of ctx.s.grips.filter((x) => x.owner === a && x.zone === z)) {
        dropGrip(ctx, g, "rahmen");
        ctx.notes.push({
          prio: 71, side: r,
          headline: you(r) ? `${q(rc)} stoppt ihn – Griff gelöst.` : `${q(rc)} stoppt dich – Griff gelöst.`,
          why: you(r) ? `Stoppst du den Angriff in der Zone seines Griffs, fällt auch sein ${g.name}.`
            : `Stoppt er den Angriff in der Zone deines Griffs, fällt auch dein ${g.name}.`,
          zone: z,
        });
      }
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
        placeGrip(ctx, side, c);
        ctx.notes.push({
          prio: 20, side,
          headline: you(side) ? `Du baust auf: ${q(c)}, ${ZONE_LABEL[c.zone]} +${c.gain ?? 1}.` : `Er baut auf: ${q(c)}, ${ZONE_LABEL[c.zone]} +${c.gain ?? 1}.`,
          why: c.why, zone: c.zone,
        });
      } else if (c.kind === "angriff") {
        attackSucceeds(ctx, side, c, BALANCE.unframedSubSteps);
      } else if (breakable(ctx.s, side, c).length || (!ctx.s.noGrips && cards[other(side)]?.grip && c.breaks?.includes(cards[other(side)]!.grip!.id))) {
        // B32: Griff lösen wird nach dem Legen geprüft (unten) – ein Rahmen, der einen Griff löst, geht nicht ins Leere.
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

  // B40: Schlagzeile für den ausgelösten Konter (über dem normalen „Rahmen stoppt“).
  for (const side of ["p", "o"] as Side[]) {
    const kc = triggered[side];
    if (!kc) continue;
    const ac = cards[other(side)];
    if (ac?.kind === "aufbauen") {
      ctx.notes.push({
        prio: 72, side: other(side),
        headline: you(side) ? `Finte! Dein Konter ${q(kc)} ist verbraucht.` : `Finte! Sein Konter ${q(kc)} ist verbraucht.`,
        why: you(side) ? "Er täuschte genau dort an, wo dein Konter lag. Ein Rahmen verliert gegen die Finte."
          : "Du hast seinen Konter gelesen: Die Finte lockt den Rahmen raus und bringt dir +2.",
        zone: kc.zone,
      });
      continue;
    }
    // Über dem Positionswechsel (80): beim Sprawl-Konter zeigt der Stempel die neue Lage, die Schlagzeile den Konter.
    ctx.notes.push({
      prio: 85, side,
      headline: you(side) ? `Konter! Dein ${q(kc)} stand schon bereit.` : `Konter! Sein ${q(kc)} stand schon bereit.`,
      why: ac?.dilemmaOpens && ac.zone === kc.zone
        ? `Dilemma: Wer ${ZONE_LABEL[kc.zone]} verteidigt, öffnet ${ZONE_LABEL[ac.dilemmaOpens]}.`
        : you(side) ? "Dein Rahmen stand, bevor er angriff. Die gewählte Karte bleibt in deiner Hand."
          : "Er hatte den Rahmen vorbereitet. Greif woanders an – oder mit Dilemma oder Kette.",
      zone: kc.zone,
    });
  }

  // B32 Griff lösen: jede Karte mit breaks, die in ihrer Zone nicht geschlagen wurde (nach dem Legen neuer Griffe).
  for (const side of ["p", "o"] as Side[]) {
    const c = cards[side];
    if (c?.breaks && triWinner !== other(side)) applyBreaks(ctx, side, c);
  }

  // B45: spielt er in der Zone der Fähigkeit eine Karte (auch ein ausgelöster Konter zählt), hält er dagegen – sie verpufft.
  // Liegt der Stil-Spieler oben, hält nur sein Angriff dagegen (Gewicht, wie B3).
  const stilEaten: Record<Side, boolean> = { p: false, o: false };
  for (const side of ["p", "o"] as Side[]) if (usingStil[side]) stilEaten[side] = stilBlockedBy(s0.stil![side]!, cards[other(side)], s0.top === side);

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

  // B44/B45: Stil-Fähigkeit wirkt NACH den Karten – +1 in ihrer Zone, wenn die Lage dieselbe ist und er dort keine Karte spielte.
  for (const side of ["p", "o"] as Side[]) {
    if (!usingStil[side] || s.result?.type === "tap") continue;
    const id = s0.stil![side]!;
    const pw = STIL_POWER[id];
    const z = ZONE_LABEL[pw.zone];
    const moved = s.pos !== s0.pos || s.top !== s0.top;
    const why = stilEaten[side] ? "dagegen" : moved ? "position" : null;
    const delta = why ? 0 : addZone(ctx, side, pw.zone, STIL_GAIN);
    if (delta !== 0) {
      ctx.events.push({ t: "stil", side, stil: id, zone: pw.zone, on: "hit" });
      ctx.acted.add(side);
      ctx.notes.push({
        prio: 19, side,
        headline: you(side) ? `Dein ${pw.power}: ${z} +${STIL_GAIN}.` : `Sein ${pw.power}: ${z} +${STIL_GAIN} für ihn.`,
        why: "Die Fähigkeit wirkt nach den Karten – sie baut für die nächste Runde auf.",
        zone: pw.zone,
      });
    } else {
      const w = why ?? "voll";
      ctx.events.push({ t: "stil", side, stil: id, zone: pw.zone, on: "fizzle", why: w });
      ctx.notes.push({
        prio: w === "dagegen" ? 24 : 13, side: other(side),
        headline: w === "dagegen" ? (you(side) ? `Er hält an ${z} dagegen: ${pw.power} verpufft.` : `Du hältst an ${z} dagegen: sein ${pw.power} verpufft.`)
          : w === "position" ? (you(side) ? `Neue Lage: dein ${pw.power} verpufft.` : `Neue Lage: sein ${pw.power} verpufft.`)
          : (you(side) ? `Dein ${pw.power} verpufft: ${z} ist voll.` : `Sein ${pw.power} verpufft: ${z} ist voll.`),
        why: w === "dagegen" ? (you(side) ? "Spielt er in der Zone deiner Fähigkeit, hält er dagegen – oben nur mit Angriff."
          : "Du kennst sein A-Game: Wer in der Zone seiner Fähigkeit spielt, hält dagegen.")
          : w === "position" ? "Die Fähigkeit wirkt nur in der Lage, in der sie eingesetzt wurde."
          : "Mehr als +2 geht in keiner Zone.",
        zone: pw.zone,
      });
    }
  }

  // Rundenende: Sperren, Atem, Rundenzähler, Ziel/Punkte.
  s.p.locked = P ? [P.id] : [];
  s.o.locked = O ? [O.id] : [];
  // B41 Konter-Pflege: jede Runde −1 (auch die Runde des Legens); nach KONTER_ROUNDS verfällt er (Karte 1 Runde gesperrt).
  // Passt sein Rahmen nach einem Positionswechsel nicht mehr in die Lage, fällt er sofort (ohne Sperre).
  for (const side of ["p", "o"] as Side[]) {
    const k = s.konter?.[side];
    if (!k) continue;
    k.left -= 1;
    const fits = konterFits(s, side, k);
    if (fits && k.left > 0) continue;
    delete s.konter![side];
    const why = fits ? "zeit" : "position";
    if (why === "zeit" && k.card) s[side].locked.push(k.card);
    ctx.events.push({ t: "konter", side, on: "gone", why, ...(k.card ? { card: k.card, zone: k.zone } : {}) });
    const kc = k.card ? cardById(k.card) : undefined;
    if (kc) ctx.notes.push({
      prio: 12, side,
      headline: why === "zeit" ? (you(side) ? `Dein Konter verfällt: ${q(kc)}.` : `Sein Konter verfällt: ${q(kc)}.`)
        : (you(side) ? `Dein Konter passt nicht mehr: ${q(kc)}.` : `Sein Konter passt nicht mehr: ${q(kc)}.`),
      why: why === "zeit" ? "Ein Konter liegt höchstens zwei Runden. Danach ist die Karte eine Runde gesperrt."
        : "Nach dem Positionswechsel passt der vorbereitete Rahmen nicht mehr.",
      zone: null,
    });
  }
  if (s.konter && !s.konter.p && !s.konter.o) delete s.konter;
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
    pCard: triggered.p ? triggered.p.id : pId,
    oCard: triggered.o ? triggered.o.id : oId,
    ...(setting.p || setting.o ? { konterSet: (["p", "o"] as Side[]).filter((x) => setting[x]) } : {}),
    ...(usingStil.p || usingStil.o ? { stilUsed: (["p", "o"] as Side[]).filter((x) => usingStil[x]) } : {}),
    rule, winner, events: ctx.events,
    headline: top?.headline ?? "Keiner kommt voran.",
    why: top?.why ?? RULE_WHY[rule],
    focusZone: top?.zone ?? null,
    posBefore: s0.pos, topBefore: s0.top,
  };
  s.history.push(round);
  return { state: s, round };
}
