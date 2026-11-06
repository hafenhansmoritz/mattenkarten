// ============================================================
// Mattenkarten – "So geht's"-Technikdemos
// Keyframe-Sequenzen aus dem 2D-Skelettmodell (poses.ts, viewBox 400×220, Matte y = 190).
// p = Spieler (blau, führt die Technik aus), o = Gegner (rot).
// Jede Pose entsteht aus scenePose(...) oder über mk(...) mit IK/FK und festen Gliedlängen,
// damit Ober-/Unterarm und Ober-/Unterschenkel über alle Frames gleich lang bleiben.
// Technik-Kernpunkte nach docs/knowledge-base.md (4.3–4.5) und den Karten-`keys`.
// ============================================================
import type { Side } from "../../engine/types";
import { JOINTS, LEN, ON_MAT, mirrorPose, scenePose, type Joint, type Pose, type Pt } from "../fighters/poses";

export interface DemoFrame {
  p: Pose;
  o: Pose;
  /** Kernpunkt, ≤ 8 Wörter, z. B. "2. Schritt zwischen seine Füße". */
  caption: string;
  /** Gelenke, die in diesem Schritt hervorgehoben werden. */
  focus?: Joint[];
  /** Wessen Gelenke hervorgehoben werden (Standard: p). */
  focusSide?: Side;
  /** Haltezeit-Faktor (1 = Standard ~900 ms). */
  hold?: number;
}

export interface DemoSequence {
  cardId: string;
  /** Ausgangslage (wird vor Schritt 1 gezeigt, ohne Nummer). */
  start: { p: Pose; o: Pose; caption: string };
  frames: DemoFrame[];
}

// ---------------- Geometrie ----------------
const r1 = (v: number) => Math.round(v * 10) / 10;
const pt = (x: number, y: number): Pt => ({ x: r1(x), y: r1(y) });
const rad = (d: number) => (d * Math.PI) / 180;
const polar = (o: Pt, deg: number, l: number): Pt => pt(o.x + Math.cos(rad(deg)) * l, o.y + Math.sin(rad(deg)) * l);
const toward = (o: Pt, t: Pt, l: number): Pt => {
  const dx = t.x - o.x, dy = t.y - o.y;
  const d = Math.hypot(dx, dy) || 1;
  return pt(o.x + (dx / d) * l, o.y + (dy / d) * l);
};

/** Biegerichtung des Mittelgelenks: ±1 wie in poses.ts, oder relativ zum Bild. */
type Bend = 1 | -1 | "up" | "down" | "left" | "right";

/** Zwei-Segment-IK (wie poses.ts), Biegeseite optional nach Bildrichtung gewählt. */
function ik(root: Pt, target: Pt, l1: number, l2: number, bend: Bend): { mid: Pt; end: Pt } {
  const dx = target.x - root.x, dy = target.y - root.y;
  let d = Math.hypot(dx, dy);
  const ux = d === 0 ? 1 : dx / d, uy = d === 0 ? 0 : dy / d;
  d = Math.min(l1 + l2 - 0.5, Math.max(Math.abs(l1 - l2) + 1, d));
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const cand = (b: 1 | -1) => pt(root.x + ux * a + uy * b * h, root.y + uy * a - ux * b * h);
  let b: 1 | -1;
  if (bend === 1 || bend === -1) b = bend;
  else {
    const m1 = cand(1), m2 = cand(-1);
    const score = (m: Pt) => (bend === "up" ? -m.y : bend === "down" ? m.y : bend === "left" ? -m.x : m.x);
    b = score(m1) >= score(m2) ? 1 : -1;
  }
  return { mid: cand(b), end: pt(root.x + ux * d, root.y + uy * d) };
}

/** Arm/Bein: Ziel per IK, oder Mittelgelenk/Ende per FK (Richtungen, Längen fix). */
type LimbSpec =
  | { to: Pt; bend: Bend }
  | { mid: Pt; end: Pt }
  | { kneel: 1 | -1; shinDir?: number };

interface Spec {
  hip: Pt;
  /** Rumpfwinkel Hüfte→Nacken in Grad, Bildkoordinaten (−90 = senkrecht hoch, 0 = rechts, 180 = links). */
  torso: number;
  headAng: number;
  face: 1 | -1;
  z?: number;
  armF: LimbSpec; armB: LimbSpec; legF: LimbSpec; legB: LimbSpec;
}

const LIMB = {
  armF: ["shoulderF", "elbowF", "handF", LEN.upperArm, LEN.foreArm],
  armB: ["shoulderB", "elbowB", "handB", LEN.upperArm, LEN.foreArm],
  legF: ["hip", "kneeF", "footF", LEN.thigh, LEN.shin],
  legB: ["hip", "kneeB", "footB", LEN.thigh, LEN.shin],
} as const;
type LimbKey = keyof typeof LIMB;

function solveLimb(root: Pt, s: LimbSpec, l1: number, l2: number, isLeg: boolean): { mid: Pt; end: Pt } {
  if ("kneel" in s) {
    const dy = Math.min(l1 - 0.5, Math.max(0, ON_MAT - root.y));
    const knee = pt(root.x + Math.sqrt(l1 * l1 - dy * dy) * s.kneel, ON_MAT);
    const foot = polar(knee, s.shinDir ?? (s.kneel > 0 ? 180 : 0), l2);
    return { mid: knee, end: pt(foot.x, Math.min(foot.y, ON_MAT)) };
  }
  let r: { mid: Pt; end: Pt };
  if ("to" in s) r = ik(root, s.to, l1, l2, s.bend);
  else {
    const mid = toward(root, s.mid, l1);
    r = { mid, end: toward(mid, s.end, l2) };
  }
  if (isLeg) r = { mid: pt(r.mid.x, Math.min(r.mid.y, ON_MAT)), end: pt(r.end.x, Math.min(r.end.y, ON_MAT)) };
  return r;
}

/** Baut eine Pose aus Rumpf + Gliedmaßen-Zielen (Bildkoordinaten, beliebige Blickrichtung). */
function mk(s: Spec): Pose {
  const hip = pt(s.hip.x, s.hip.y);
  const neck = polar(hip, s.torso, LEN.torso);
  const head = polar(neck, s.headAng, LEN.neck);
  const shoulderF = polar(neck, s.torso + 180, 5);
  const shoulderB = pt(shoulderF.x - s.face * 2, shoulderF.y - 2);
  const hipB = pt(hip.x - s.face * 1.5, hip.y - 1);
  const aF = solveLimb(shoulderF, s.armF, LEN.upperArm, LEN.foreArm, false);
  const aB = solveLimb(shoulderB, s.armB, LEN.upperArm, LEN.foreArm, false);
  const lF = solveLimb(hip, s.legF, LEN.thigh, LEN.shin, true);
  const lB = solveLimb(hipB, s.legB, LEN.thigh, LEN.shin, true);
  return {
    head, neck, shoulderF, shoulderB,
    elbowF: aF.mid, handF: aF.end, elbowB: aB.mid, handB: aB.end,
    hip, kneeF: lF.mid, footF: lF.end, kneeB: lB.mid, footB: lB.end,
    face: s.face, z: s.z ?? 0,
  };
}

/** Einzelne Gliedmaße einer bestehenden Pose neu ausrichten (Längen bleiben). */
function limb(p: Pose, k: LimbKey, s: LimbSpec): Pose {
  const [rootJ, midJ, endJ, l1, l2] = LIMB[k];
  const root = rootJ === "hip" && k === "legB" ? pt(p.hip.x - p.face * 1.5, p.hip.y - 1) : p[rootJ];
  const r = solveLimb(root, s, l1, l2, k.startsWith("leg"));
  return { ...p, [midJ]: r.mid, [endJ]: r.end };
}

/** Ganze Pose um Punkt c drehen (positiv = im Uhrzeigersinn auf dem Bildschirm). */
function rot(p: Pose, c: Pt, deg: number): Pose {
  const cs = Math.cos(rad(deg)), sn = Math.sin(rad(deg));
  const out = { ...p };
  for (const j of JOINTS) {
    const dx = p[j].x - c.x, dy = p[j].y - c.y;
    out[j] = pt(c.x + dx * cs - dy * sn, c.y + dx * sn + dy * cs);
  }
  return out;
}

function shift(p: Pose, dx: number, dy: number): Pose {
  const out = { ...p };
  for (const j of JOINTS) out[j] = pt(p[j].x + dx, p[j].y + dy);
  return out;
}

/** Hebt die Pose so weit an, dass kein Gelenk unter der Matte liegt. */
function ground(p: Pose): Pose {
  const maxY = Math.max(...JOINTS.map((j) => p[j].y));
  return maxY > ON_MAT ? shift(p, 0, ON_MAT - maxY) : p;
}

const withZ = (p: Pose, z: number): Pose => ({ ...p, z });
const at = (p: Pose, j: Joint, dx = 0, dy = 0): Pt => pt(p[j].x + dx, p[j].y + dy);
const M = (a: Pt): Pt => pt(400 - a.x, a.y);
const mirrorScene = (s: { p: Pose; o: Pose }) => ({ p: mirrorPose(s.p), o: mirrorPose(s.o) });

const ground0 = ON_MAT;
const foot = (x: number, bend: Bend = "up"): LimbSpec => ({ to: pt(x, ground0), bend });

// ---------------- Ausgangslagen ----------------
const DIST = scenePose("dist", null);
const CLINCH = scenePose("clinch", null);
const GUARD_TOP = scenePose("guard", "p");     // p kniet in der Guard, o unten (Kopf rechts)
const GUARD_BOTTOM = scenePose("guard", "o");  // p unten (Kopf links), o kniet
const SIDE_TOP = scenePose("side", "p");
const MOUNT_TOP = scenePose("mount", "p");
const MOUNT_BOTTOM = scenePose("mount", "o");
const BACK_TOP = scenePose("back", "p");
const FHL_TOP = scenePose("fhl", "p");

/** Standard-Stand, Blick nach rechts (für p) bzw. links (face −1). */
function stance(hipX: number, face: 1 | -1, o: Partial<Spec> = {}): Pose {
  const f = face;
  return mk({
    hip: pt(hipX, 124), torso: f > 0 ? -72 : -108, headAng: f > 0 ? -62 : -118, face: f,
    armF: { to: pt(hipX + 48 * f, 84), bend: f > 0 ? 1 : -1 },
    armB: { to: pt(hipX + 40 * f, 74), bend: f > 0 ? 1 : -1 },
    legF: foot(hipX + 28 * f, f > 0 ? "right" : "left"),
    legB: foot(hipX - 32 * f, f > 0 ? "right" : "left"),
    ...o,
  });
}

// ============================================================
// Phase Distanz / Clinch
// ============================================================

function doubleLeg(): DemoSequence {
  const o0 = DIST.o;
  const p1 = mk({
    hip: pt(140, 142), torso: -60, headAng: -35, face: 1,
    armF: { to: pt(186, 120), bend: "down" }, armB: { to: pt(180, 114), bend: "down" },
    legF: foot(172, "right"), legB: foot(100, "right"),
  });
  const p2 = mk({
    hip: pt(200, 150), torso: -32, headAng: -40, face: 1, z: 1,
    armF: { to: at(o0, "kneeF", 14, 2), bend: "down" }, armB: { to: at(o0, "kneeB", 4, 2), bend: "down" },
    legF: foot(240, "right"), legB: foot(140, "right"),
  });
  // o kippt nach hinten um seinen hinteren Fuß, das vordere Bein hebt ab.
  const o3 = rot(o0, o0.footB, 14);
  const p3 = mk({
    hip: pt(214, 142), torso: -38, headAng: -40, face: 1, z: 1,
    armF: { to: at(o3, "kneeF", 12, 4), bend: "down" }, armB: { to: at(o3, "kneeB", 4, 4), bend: "down" },
    legF: foot(246, "right"), legB: foot(196, "right"),
  });
  // o fällt rückwärts auf den Hintern, Oberkörper nach hinten (rechts), Beine in p's Armen.
  const o4 = mk({
    hip: pt(270, 172), torso: -28, headAng: -15, face: -1,
    armF: { to: pt(300, ON_MAT), bend: "up" }, armB: { to: pt(306, 178), bend: "up" },
    legF: { to: pt(206, 140), bend: "up" }, legB: { to: pt(212, 146), bend: "up" },
  });
  const p4 = mk({
    hip: pt(196, 150), torso: -26, headAng: -20, face: 1, z: 1,
    armF: { to: at(o4, "kneeF", 0, 6), bend: "down" }, armB: { to: at(o4, "kneeB", -4, 8), bend: "down" },
    legF: foot(228, "right"), legB: foot(150, "right"),
  });
  return {
    cardId: "double_leg",
    start: { ...DIST, caption: "Auf Abstand" },
    frames: [
      { p: p1, o: o0, caption: "1. In die Knie, Rücken gerade", focus: ["hip", "kneeF", "kneeB"] },
      { p: p2, o: o0, caption: "2. Tiefer Schritt zwischen seine Füße", focus: ["kneeF", "footF"] },
      { p: p3, o: o3, caption: "3. Beide Kniekehlen greifen, Kopf hoch", focus: ["handF", "handB", "head"] },
      { p: p4, o: o4, caption: "4. Durchsteigen, umwerfen", focus: ["hip", "footB"] },
      { ...GUARD_TOP, caption: "5. Oben in seiner Guard: 2 Punkte", hold: 1.3 },
    ],
  };
}

function singleLeg(): DemoSequence {
  const o0 = DIST.o;
  const p1 = mk({
    hip: pt(144, 140), torso: -62, headAng: -35, face: 1,
    armF: { to: pt(188, 118), bend: "down" }, armB: { to: pt(182, 112), bend: "down" },
    legF: foot(176, "right"), legB: foot(104, "right"),
  });
  // Kopf innen an seiner Brust (IBJJF-Weißgurt-Regel), beide Arme um sein vorderes Bein.
  const p2 = mk({
    hip: pt(200, 138), torso: -52, headAng: -60, face: 1, z: 1,
    armF: { to: at(o0, "kneeF", 6, -6), bend: "down" }, armB: { to: at(o0, "kneeF", 10, 6), bend: "down" },
    legF: foot(226, "right"), legB: foot(160, "right"),
  });
  const o3 = mk({
    hip: pt(274, 120), torso: -102, headAng: -120, face: -1,
    armF: { to: pt(240, 96), bend: -1 }, armB: { to: pt(250, 84), bend: -1 },
    legF: { mid: pt(244, 128), end: pt(214, 132) },
    legB: foot(296, "left"),
  });
  const p3 = mk({
    hip: pt(196, 128), torso: -70, headAng: -66, face: 1, z: 1,
    armF: { to: at(o3, "kneeF", 2, 4), bend: "down" }, armB: { to: at(o3, "footF", 4, -2), bend: "down" },
    legF: foot(222, "right"), legB: foot(158, "right"),
  });
  const o4 = ground(shift(rot(o3, o3.footB, 50), -40, 14));
  const p4 = mk({
    hip: pt(214, 146), torso: -36, headAng: -36, face: 1, z: 1,
    armF: { to: at(o4, "kneeF", 0, 4), bend: "down" }, armB: { to: at(o4, "footF"), bend: "down" },
    legF: foot(250, "right"), legB: foot(176, "right"),
  });
  return {
    cardId: "single_leg",
    start: { ...DIST, caption: "Auf Abstand" },
    frames: [
      { p: p1, o: o0, caption: "1. In die Knie gehen", focus: ["hip", "kneeF"] },
      { p: p2, o: o0, caption: "2. Kopf innen, vorderes Bein umklammern", focus: ["head", "handF", "handB"] },
      { p: p3, o: o3, caption: "3. Bein hoch, Brust hoch", focus: ["neck", "handF"] },
      { p: p4, o: o4, caption: "4. Bein wegdrehen, er fällt", focus: ["hip"] },
      { ...GUARD_TOP, caption: "5. Oben in seiner Guard: 2 Punkte", hold: 1.3 },
    ],
  };
}

function sprawl(): DemoSequence {
  const p0 = DIST.p;
  // o schießt: Spiegel des Double-Leg-Eintritts, Hände an p's Knien.
  const o1 = mirrorPose(mk({
    hip: pt(200, 150), torso: -32, headAng: -40, face: 1,
    armF: { to: M(at(p0, "kneeF", -14, 2)), bend: "down" }, armB: { to: M(at(p0, "kneeB", -4, 2)), bend: "down" },
    legF: foot(240, "right"), legB: foot(140, "right"),
  }));
  const p2 = mk({
    hip: pt(146, 150), torso: -22, headAng: 10, face: 1, z: 1,
    armF: { to: at(o1, "shoulderF", 6, 2), bend: "down" }, armB: { to: at(o1, "shoulderB", 10, 0), bend: "down" },
    legF: foot(80, "right"), legB: foot(94, "right"),
  });
  const o3 = mk({
    hip: pt(262, 150), torso: 165, headAng: 150, face: -1,
    armF: { to: pt(170, 172), bend: "down" }, armB: { to: pt(180, 170), bend: "down" },
    legF: { kneel: -1, shinDir: 0 }, legB: foot(300, "left"),
  });
  const p3 = mk({
    hip: pt(146, 164), torso: -12, headAng: 25, face: 1, z: 1,
    armF: { to: at(o3, "shoulderF", 4, -4), bend: "down" }, armB: { to: at(o3, "neck", 8, -6), bend: "down" },
    legF: foot(76, "right"), legB: foot(88, "right"),
  });
  return {
    cardId: "sprawl",
    start: { ...DIST, caption: "Auf Abstand" },
    frames: [
      { p: p0, o: o1, caption: "1. Er schießt: früh reagieren", focus: ["head"], focusSide: "o" },
      { p: p2, o: o1, caption: "2. Beine gerade nach hinten", focus: ["footF", "footB", "kneeF"] },
      { p: p3, o: o3, caption: "3. Hüfte schwer auf seine Schultern", focus: ["hip"] },
      { ...FHL_TOP, caption: "4. Kopf umklammern: Front Headlock", focus: ["handF", "handB"], hold: 1.3 },
    ],
  };
}

/** Collar Tie: p's nahe Hand im Nacken von o, ferne Hand am Ellbogen. */
function collarTie(oLean = 0): { p: Pose; o: Pose } {
  const o = mk({
    hip: pt(236, 122), torso: -108 - oLean, headAng: -125 - oLean, face: -1,
    armF: { to: pt(186, 92), bend: -1 }, armB: { to: pt(190, 80), bend: -1 },
    legF: foot(212, "left"), legB: foot(266, "left"),
  });
  const p = mk({
    hip: pt(160, 124), torso: -76, headAng: -62, face: 1, z: 1,
    armF: { to: at(o, "neck", 6, -4), bend: 1 }, armB: { to: at(o, "elbowF", 2, 4), bend: "down" },
    legF: foot(188, "right"), legB: foot(126, "right"),
  });
  return { p, o };
}

function snapDown(): DemoSequence {
  const t1 = collarTie();
  const o2 = mk({
    hip: pt(232, 118), torso: -146, headAng: -205, face: -1,
    armF: { to: pt(176, 140), bend: "down" }, armB: { to: pt(182, 134), bend: "down" },
    legF: foot(204, "left"), legB: foot(262, "left"),
  });
  const p2 = mk({
    hip: pt(138, 128), torso: -70, headAng: -55, face: 1, z: 1,
    armF: { to: at(o2, "neck", -2, -6), bend: 1 }, armB: { to: at(o2, "elbowF", 0, -2), bend: "down" },
    legF: foot(168, "right"), legB: foot(92, "right"),
  });
  const o3 = mk({
    hip: pt(262, 148), torso: 164, headAng: 150, face: -1,
    armF: { to: pt(200, ON_MAT), bend: "left" }, armB: { to: pt(208, ON_MAT), bend: "left" },
    legF: { kneel: -1, shinDir: 0 }, legB: { kneel: -1, shinDir: 0 },
  });
  const p3 = mk({
    hip: pt(146, 156), torso: -24, headAng: 15, face: 1, z: 1,
    armF: { to: at(o3, "head", 2, 8), bend: "down" }, armB: { to: at(o3, "neck", 0, -6), bend: "down" },
    legF: foot(90, "right"), legB: foot(104, "right"),
  });
  return {
    cardId: "snap_down",
    start: { ...CLINCH, caption: "Im Clinch" },
    frames: [
      { ...t1, caption: "1. Hand in seinen Nacken", focus: ["handF"] },
      { p: p2, o: o2, caption: "2. Ruck nach unten, Schritt zurück", focus: ["handF", "footB"] },
      { p: p3, o: o3, caption: "3. Kopf unter seinen Schwerpunkt", focus: ["head"], focusSide: "o" },
      { ...FHL_TOP, caption: "4. Front Headlock sichern", focus: ["handF", "handB"], hold: 1.3 },
    ],
  };
}

function anklePick(): DemoSequence {
  const t1 = collarTie(18);
  // o steppt mit dem vorderen Fuß nach vorn
  const o1 = limb(t1.o, "legF", foot(196, "left"));
  const p1 = limb(t1.p, "armF", { to: at(o1, "neck", 4, -4), bend: 1 });
  const o2 = mk({
    hip: pt(228, 122), torso: -132, headAng: -160, face: -1,
    armF: { to: pt(186, 120), bend: "down" }, armB: { to: pt(190, 110), bend: "down" },
    legF: foot(196, "left"), legB: foot(262, "left"),
  });
  const p2 = mk({
    hip: pt(160, 160), torso: -45, headAng: -30, face: 1, z: 1,
    armF: { to: at(o2, "neck", -4, -2), bend: 1 }, armB: { to: at(o2, "footF", 4, -4), bend: "down" },
    legF: foot(178, "up"), legB: { kneel: -1, shinDir: 180 },
  });
  const o3 = ground(rot(o2, o2.footB, 38));
  const p3 = mk({
    hip: pt(186, 148), torso: -40, headAng: -30, face: 1, z: 1,
    armF: { to: at(o3, "head", 6, 6), bend: "down" }, armB: { to: at(o3, "footF"), bend: "down" },
    legF: foot(214, "right"), legB: foot(142, "right"),
  });
  return {
    cardId: "ankle_pick",
    start: { ...CLINCH, caption: "Im Clinch" },
    frames: [
      { p: p1, o: o1, caption: "1. Nacken greifen, nach vorn ziehen", focus: ["handF"] },
      { p: p2, o: o2, caption: "2. Er steppt vor: Ferse greifen", focus: ["handB"] },
      { p: p3, o: o3, caption: "3. Vorwärts treiben, Ferse hoch", focus: ["handB", "hip"] },
      { ...SIDE_TOP, caption: "4. Durchgehen in die Seitenkontrolle", hold: 1.3 },
    ],
  };
}

function oGoshi(): DemoSequence {
  // 1) Kuzushi: o wird nach vorn auf die Zehen gezogen
  const o1 = mk({
    hip: pt(234, 120), torso: -122, headAng: -140, face: -1,
    armF: { to: pt(190, 100), bend: "down" }, armB: { to: pt(196, 90), bend: "down" },
    legF: foot(206, "left"), legB: foot(262, "left"),
  });
  const p1 = mk({
    hip: pt(160, 122), torso: -80, headAng: -66, face: 1, z: 1,
    armF: { to: at(o1, "elbowF", -2, 0), bend: "down" }, armB: { to: at(o1, "shoulderB", 4, 10), bend: "down" },
    legF: foot(186, "right"), legB: foot(126, "right"),
  });
  // 2) Eindrehen: p dreht sich weg (Blick links), Hüfte tiefer und vor seiner Hüfte.
  const o2 = mk({
    hip: pt(244, 114), torso: -132, headAng: -150, face: -1,
    armF: { to: pt(194, 112), bend: "down" }, armB: { to: pt(206, 118), bend: "down" },
    legF: foot(232, "left"), legB: foot(276, "left"),
  });
  const p2 = mk({
    hip: pt(226, 138), torso: -98, headAng: -120, face: -1, z: 1,
    armF: { to: at(o2, "elbowF", -4, 2), bend: "down" }, armB: { to: at(o2, "hip", 6, -12), bend: "up" },
    legF: foot(212, "left"), legB: foot(250, "left"),
  });
  // 3) Drehen statt heben: o rollt über p's Hüfte (Kopf nach links unten)
  const o3 = rot(o2, pt(228, 124), -92);
  const p3 = mk({
    hip: pt(228, 132), torso: -140, headAng: -170, face: -1, z: 1,
    armF: { to: at(o3, "elbowF", 0, 4), bend: "down" }, armB: { to: at(o3, "hip", -4, 4), bend: "up" },
    legF: foot(208, "left"), legB: foot(250, "left"),
  });
  const end = mirrorScene(SIDE_TOP);
  return {
    cardId: "o_goshi",
    start: { ...CLINCH, caption: "Im Clinch" },
    frames: [
      { p: p1, o: o1, caption: "1. Kuzushi: nach vorn ziehen", focus: ["handF", "handB"] },
      { p: p2, o: o2, caption: "2. Eindrehen, Hüfte tiefer als seine", focus: ["hip"] },
      { p: p3, o: withZ(o3, 2), caption: "3. Drehen statt heben", focus: ["hip", "neck"] },
      { ...end, caption: "4. Kontrolliert ablegen, Seitenkontrolle", hold: 1.3 },
    ],
  };
}

// ============================================================
// Guard
// ============================================================

/** p unten in der Guard (Kopf links), Pose in Bildkoordinaten. */
function guardBottom(o: Partial<Spec>): Pose {
  return mk({
    hip: pt(172, 174), torso: 183, headAng: 170, face: -1, z: 0,
    armF: { to: pt(180, 150), bend: "down" }, armB: { to: pt(176, 146), bend: "down" },
    legF: foot(204, "up"), legB: foot(198, "up"),
    ...o,
  });
}

function hipBump(): DemoSequence {
  const o0 = GUARD_BOTTOM.o;
  const p1 = guardBottom({ armF: { to: at(o0, "elbowF", -2, 6), bend: "down" }, armB: { to: at(o0, "elbowB", 0, 8), bend: "down" } });
  const p2 = mk({
    hip: pt(174, 176), torso: -118, headAng: -100, face: 1, z: 1,
    armF: { to: at(o0, "shoulderF", 10, -2), bend: "up" }, armB: { to: pt(132, ON_MAT), bend: "left" },
    legF: foot(206, "up"), legB: { kneel: 1, shinDir: 160 },
  });
  const o3 = rot(o0, pt(222, ON_MAT), 30);
  const p3 = mk({
    hip: pt(190, 158), torso: -62, headAng: -50, face: 1, z: 1,
    armF: { to: at(o3, "shoulderF", 8, 0), bend: "up" }, armB: { to: pt(186, ON_MAT), bend: "left" },
    legF: foot(214, "up"), legB: { kneel: -1, shinDir: 175 },
  });
  return {
    cardId: "hip_bump",
    start: { ...GUARD_BOTTOM, caption: "Unten in der Guard" },
    frames: [
      { p: p1, o: o0, caption: "1. Er sitzt aufrecht: Füße auf die Matte", focus: ["footF", "footB"] },
      { p: p2, o: o0, caption: "2. Aufsitzen, Hand hinten posten", focus: ["handB", "neck"] },
      { p: p3, o: o3, caption: "3. Hüfte hoch, in ihn stoßen", focus: ["hip"] },
      { ...MOUNT_TOP, caption: "4. Mitrollen in den Mount", hold: 1.3 },
    ],
  };
}

function scissorSweep(): DemoSequence {
  // o wird über Kragen/Ärmel nach vorn gezogen
  const o1 = mk({
    hip: pt(212, 152), torso: -138, headAng: -160, face: -1,
    armF: { to: pt(166, 160), bend: "down" }, armB: { to: pt(172, 156), bend: "down" },
    legF: { kneel: -1, shinDir: 0 }, legB: { kneel: -1, shinDir: 0 },
  });
  const p1 = guardBottom({
    torso: 200, headAng: 190,
    armF: { to: at(o1, "neck", 2, 2), bend: "down" }, armB: { to: at(o1, "elbowF", 0, 2), bend: "down" },
    legF: { to: pt(226, 130), bend: "up" }, legB: { to: pt(220, 136), bend: "up" },
  });
  const p2 = mk({
    hip: pt(160, 176), torso: 196, headAng: 186, face: -1, z: 1,
    armF: { to: at(o1, "neck", 2, 2), bend: "down" }, armB: { to: at(o1, "elbowF", 0, 2), bend: "down" },
    legF: { mid: pt(176, 136), end: pt(214, 132) }, legB: { to: pt(206, 180), bend: "up" },
  });
  const o3 = ground(rot(o1, at(o1, "kneeF"), 34));
  const p3 = mk({
    hip: pt(166, 174), torso: 205, headAng: 190, face: -1, z: 1,
    armF: { to: at(o3, "neck", 0, 4), bend: "down" }, armB: { to: at(o3, "elbowF", 0, 2), bend: "down" },
    legF: { mid: pt(190, 128), end: pt(228, 120) }, legB: { to: pt(232, 182), bend: "up" },
  });
  return {
    cardId: "scissor_sweep",
    start: { ...GUARD_BOTTOM, caption: "Unten in der Guard" },
    frames: [
      { p: p1, o: o1, caption: "1. Kragen und Ärmel greifen", focus: ["handF", "handB"] },
      { p: p2, o: o1, caption: "2. Hüfte raus, Knie quer über Bauch", focus: ["kneeF", "hip"] },
      { p: p3, o: o3, caption: "3. Ziehen und scheren gleichzeitig", focus: ["footF", "footB"] },
      { ...MOUNT_TOP, caption: "4. Mitrollen in den Mount", hold: 1.3 },
    ],
  };
}

function kimuraGuard(): DemoSequence {
  // o stützt sich mit der Hand neben p's Hüfte ab
  const o1 = mk({
    hip: pt(212, 154), torso: -138, headAng: -150, face: -1,
    armF: { to: pt(160, 178), bend: "right" }, armB: { to: pt(180, 160), bend: "down" },
    legF: { kneel: -1, shinDir: 0 }, legB: { kneel: -1, shinDir: 0 },
  });
  const p1 = guardBottom({ armF: { to: at(o1, "handF", 0, -3), bend: "down" }, armB: { to: pt(150, 160), bend: "down" } });
  const p2 = mk({
    hip: pt(170, 176), torso: -132, headAng: -150, face: 1, z: 1,
    armF: { to: at(o1, "handF", 0, -3), bend: "down" }, armB: { to: at(o1, "elbowF", 6, -4), bend: "up" },
    legF: foot(206, "up"), legB: { to: pt(222, 150), bend: "up" },
  });
  const p3 = limb(p2, "armB", { to: at(p2, "handF", 3, -3), bend: "up" });
  // Zurückfallen, sein Ellbogen an p's Rippen, Hand dreht nach oben zu seinem Rücken.
  const o4base = mk({
    hip: pt(210, 154), torso: -148, headAng: -170, face: -1,
    armF: { mid: pt(168, 156), end: pt(184, 132) }, armB: { to: pt(186, 170), bend: "down" },
    legF: { kneel: -1, shinDir: 0 }, legB: { kneel: -1, shinDir: 0 },
  });
  const p4 = mk({
    hip: pt(166, 176), torso: 192, headAng: 186, face: -1, z: 0,
    armF: { to: at(o4base, "handF", -2, 2), bend: "down" }, armB: { to: at(o4base, "handF", 2, -2), bend: "up" },
    legF: { to: pt(214, 150), bend: "up" }, legB: { to: pt(224, 134), bend: "up" },
  });
  return {
    cardId: "kimura_guard",
    start: { ...GUARD_BOTTOM, caption: "Unten in der Guard" },
    frames: [
      { p: p1, o: o1, caption: "1. Er stützt sich: Handgelenk greifen", focus: ["handF"] },
      { p: p2, o: o1, caption: "2. Aufsitzen, über seine Schulter greifen", focus: ["handB", "neck"] },
      { p: p3, o: o1, caption: "3. Figure-Four: eigenes Handgelenk", focus: ["handF", "handB"] },
      { p: p4, o: withZ(o4base, 1), caption: "4. Zurückfallen, Hand Richtung Rücken", focus: ["handF", "elbowF"], focusSide: "o", hold: 1.3 },
    ],
  };
}

function triangle(): DemoSequence {
  const o0 = GUARD_BOTTOM.o;
  // 1) ein Arm rein (auf p's Bauch), einer raus (zur Seite gezogen)
  const o1 = mk({
    hip: pt(214, 150), torso: -110, headAng: -125, face: -1,
    armF: { to: pt(180, 166), bend: "down" }, armB: { to: pt(214, 138), bend: "down" },
    legF: { kneel: -1, shinDir: 0 }, legB: { kneel: -1, shinDir: 0 },
  });
  const p1 = guardBottom({ armF: { to: at(o1, "handF", 0, -2), bend: "down" }, armB: { to: at(o1, "elbowB", -2, 2), bend: "down" } });
  // 2) Bein über Schulter und Nacken, Hüfte hoch
  const o2 = mk({
    hip: pt(212, 152), torso: -126, headAng: -150, face: -1,
    armF: { to: pt(176, 168), bend: "down" }, armB: { to: pt(214, 140), bend: "down" },
    legF: { kneel: -1, shinDir: 0 }, legB: { kneel: -1, shinDir: 0 },
  });
  const p2 = mk({
    hip: pt(176, 166), torso: 168, headAng: 175, face: -1, z: 1,
    armF: { to: at(o2, "handF", 0, -2), bend: "down" }, armB: { to: at(o2, "neck", -6, 4), bend: "down" },
    legF: { mid: at(o2, "shoulderF", -10, 6), end: at(o2, "neck", 14, -6) }, legB: { to: pt(226, 150), bend: "up" },
  });
  // 3) verriegeln: Kniekehle über den Fuß
  const o3 = mk({
    hip: pt(210, 154), torso: -140, headAng: -165, face: -1,
    armF: { to: pt(176, 170), bend: "down" }, armB: { to: pt(206, 146), bend: "down" },
    legF: { kneel: -1, shinDir: 0 }, legB: { kneel: -1, shinDir: 0 },
  });
  const p3 = mk({
    hip: pt(180, 164), torso: 166, headAng: 175, face: -1, z: 1,
    armF: { to: at(o3, "handF", 0, -2), bend: "down" }, armB: { to: at(o3, "head", 0, -4), bend: "down" },
    legF: { mid: at(o3, "shoulderF", -8, 6), end: at(o3, "neck", 18, -4) },
    legB: { mid: at(o3, "neck", 22, 6), end: at(o3, "head", -4, -16) },
  });
  const o4 = mk({
    hip: pt(208, 156), torso: -152, headAng: -175, face: -1,
    armF: { to: pt(176, 172), bend: "down" }, armB: { to: pt(204, 150), bend: "down" },
    legF: { kneel: -1, shinDir: 0 }, legB: { kneel: -1, shinDir: 0 },
  });
  const p4 = mk({
    hip: pt(182, 164), torso: 166, headAng: 175, face: -1, z: 1,
    armF: { to: at(o4, "head", 4, -6), bend: "down" }, armB: { to: at(o4, "head", 8, -2), bend: "down" },
    legF: { mid: at(o4, "shoulderF", -8, 6), end: at(o4, "neck", 18, -4) },
    legB: { mid: at(o4, "neck", 22, 6), end: at(o4, "head", -4, -16) },
  });
  return {
    cardId: "triangle",
    start: { p: GUARD_BOTTOM.p, o: o0, caption: "Unten in der Guard" },
    frames: [
      { p: p1, o: o1, caption: "1. Ein Arm rein, einer raus", focus: ["handF", "handB"], focusSide: "o" },
      { p: p2, o: o2, caption: "2. Bein über Schulter und Nacken", focus: ["kneeF", "footF"] },
      { p: p3, o: o3, caption: "3. Beine verriegeln, 45°-Winkel", focus: ["kneeB", "footF"] },
      { p: p4, o: o4, caption: "4. Kopf runterziehen, Knie zusammen", focus: ["handF", "handB", "kneeB"], hold: 1.3 },
    ],
  };
}

function stackPass(): DemoSequence {
  const o0 = GUARD_TOP.o;
  // 1) Haltung, nahen Arm unter sein Bein: o's Bein liegt über p's Schulter
  const o1 = limb(limb(o0, "legF", { to: at(GUARD_TOP.p, "shoulderF", -6, -8), bend: "up" }), "legB", { to: at(GUARD_TOP.p, "hip", 8, -4), bend: "up" });
  const p1 = limb(limb(GUARD_TOP.p, "armF", { to: at(o1, "kneeF", 12, 10), bend: "down" }), "armB", { to: at(o1, "kneeB", 2, 4), bend: "down" });
  // 2) aufstehen, seine Beine Richtung Kopf stapeln
  const o2 = mk({
    hip: pt(256, 148), torso: 36, headAng: 30, face: 1, z: 0,
    armF: { to: pt(250, 172), bend: "up" }, armB: { to: pt(246, 168), bend: "up" },
    legF: { to: pt(232, 98), bend: "up" }, legB: { to: pt(240, 102), bend: "up" },
  });
  const p2 = mk({
    hip: pt(192, 124), torso: -26, headAng: -10, face: 1, z: 1,
    armF: { to: at(o2, "hip", 4, -8), bend: "down" }, armB: { to: at(o2, "kneeB", -2, 6), bend: "down" },
    legF: foot(196, "right"), legB: foot(158, "right"),
  });
  // 3) Beine wegdrücken und herumgehen
  const o3 = mk({
    hip: pt(222, 174), torso: 2, headAng: 10, face: 1, z: 0,
    armF: { to: pt(250, 150), bend: "up" }, armB: { to: pt(244, 148), bend: "up" },
    legF: { to: pt(176, 170), bend: "up" }, legB: { to: pt(170, 176), bend: "up" },
  });
  const p3 = mk({
    hip: pt(204, 140), torso: -12, headAng: 10, face: 1, z: 1,
    armF: { to: at(o3, "kneeF", 0, -6), bend: "down" }, armB: { to: at(o3, "shoulderB", -4, -6), bend: "down" },
    legF: foot(206, "right"), legB: foot(150, "right"),
  });
  return {
    cardId: "stack_pass",
    start: { ...GUARD_TOP, caption: "In seiner Guard (oben)" },
    frames: [
      { p: p1, o: o1, caption: "1. Haltung, Arm unter sein Bein", focus: ["handF", "neck"] },
      { p: p2, o: o2, caption: "2. Aufstehen, Beine auf ihn stapeln", focus: ["hip", "footF"] },
      { p: p3, o: o3, caption: "3. Beine wegdrücken, herumgehen", focus: ["handF"] },
      { ...SIDE_TOP, caption: "4. Brust auf Brust: Seitenkontrolle", hold: 1.3 },
    ],
  };
}

// ============================================================
// Mount
// ============================================================

/** p auf dem Rücken unter dem Mount (Kopf links). */
function mountBottom(o: Partial<Spec>): Pose {
  return mk({
    hip: pt(188, 177), torso: 180, headAng: 175, face: -1, z: 0,
    armF: { to: pt(166, 150), bend: "down" }, armB: { to: pt(162, 146), bend: "down" },
    legF: foot(240, "up"), legB: foot(250, "up"),
    ...o,
  });
}

function upa(): DemoSequence {
  const o0 = MOUNT_BOTTOM.o;
  const p1 = mountBottom({ armF: { to: at(o0, "handF", 4, -2), bend: "down" }, armB: { to: at(o0, "elbowF", 0, 2), bend: "down" } });
  const p2 = mountBottom({
    armF: { to: at(o0, "handF", 4, -2), bend: "down" }, armB: { to: at(o0, "elbowF", 0, 2), bend: "down" },
    legF: foot(206, "up"), legB: foot(214, "up"),
  });
  // Bridge: Schultern bleiben auf der Matte, Hüfte hoch; o kippt über p's Kopf-Schulter nach vorn.
  const o3 = rot(shift(o0, 0, -22), pt(150, 160), -26);
  const p3 = mk({
    hip: pt(180, 148), torso: 147, headAng: 170, face: -1, z: 0,
    armF: { to: at(o3, "handF", 4, 0), bend: "down" }, armB: { to: at(o3, "elbowF", 0, 2), bend: "down" },
    legF: foot(206, "up"), legB: foot(214, "up"),
  });
  const end = mirrorScene(GUARD_TOP);
  return {
    cardId: "upa",
    start: { ...MOUNT_BOTTOM, caption: "Unten im Mount" },
    frames: [
      { p: p1, o: o0, caption: "1. Seinen Arm einklemmen", focus: ["handF", "handB"] },
      { p: p2, o: o0, caption: "2. Fuß derselben Seite sperren", focus: ["footF"] },
      { p: p3, o: withZ(o3, 1), caption: "3. Hüfte hoch: Bridge über die Schulter", focus: ["hip"] },
      { ...end, caption: "4. Rollen, oben in seiner Guard", hold: 1.3 },
    ],
  };
}

function elbowKnee(): DemoSequence {
  const o0 = MOUNT_BOTTOM.o;
  const p1 = mountBottom({ armF: { to: at(o0, "hip", -2, 4), bend: "down" }, armB: { to: at(o0, "hip", -8, 8), bend: "down" } });
  const o2 = shift(o0, 6, -4);
  const p2 = mk({
    hip: pt(196, 177), torso: 186, headAng: 178, face: -1, z: 0,
    armF: { to: at(o2, "hip", -2, 4), bend: "down" }, armB: { to: at(o2, "hip", -8, 8), bend: "down" },
    legF: foot(214, "up"), legB: foot(250, "up"),
  });
  const o3 = shift(o0, 12, -6);
  const p3 = mk({
    hip: pt(200, 177), torso: 188, headAng: 178, face: -1, z: 1,
    armF: { to: at(o3, "hip", -2, 6), bend: "down" }, armB: { to: at(o3, "kneeF", 4, -6), bend: "down" },
    legF: { mid: pt(176, 146), end: pt(204, 152) }, legB: foot(252, "up"),
  });
  return {
    cardId: "elbow_knee",
    start: { ...MOUNT_BOTTOM, caption: "Unten im Mount" },
    frames: [
      { p: p1, o: o0, caption: "1. Hände an seine Hüfte, Ellbogen eng", focus: ["elbowF", "handF"] },
      { p: p2, o: o2, caption: "2. Bridge, dann Shrimp zur Seite", focus: ["hip"] },
      { p: p3, o: o3, caption: "3. Knie zum Ellbogen, Bein raus", focus: ["kneeF", "elbowF"] },
      { ...GUARD_BOTTOM, caption: "4. Zurück in die Guard", hold: 1.3 },
    ],
  };
}

function armbarMount(): DemoSequence {
  const s = MOUNT_TOP;
  // 1) o drückt mit den Armen; p sichert ein Handgelenk an der eigenen Brust
  const o1 = limb(limb(s.o, "armF", { to: pt(236, 122), bend: "down" }), "armB", { to: pt(242, 120), bend: "down" });
  const p1 = limb(limb(s.p, "armF", { to: at(o1, "handF", 2, 2), bend: "down" }), "armB", { to: at(o1, "handF", -2, -2), bend: "down" });
  // 2) hochkommen, Bein über seinen Kopf schwingen
  const o2 = limb(o1, "armF", { to: pt(240, 112), bend: "down" });
  const p2 = mk({
    hip: pt(236, 136), torso: -84, headAng: -70, face: 1, z: 1,
    armF: { to: at(o2, "handF", 2, 2), bend: "down" }, armB: { to: at(o2, "handF", -2, -2), bend: "down" },
    legF: { mid: pt(272, 128), end: pt(298, 160) }, legB: { kneel: 1, shinDir: 180 },
  });
  // 3) zurücklehnen, Knie zusammen, sein Arm zwischen den Oberschenkeln
  const o3 = limb(limb(s.o, "armF", { mid: pt(266, 152), end: pt(278, 126) }), "armB", { to: pt(230, 160), bend: "up" });
  const p3 = mk({
    hip: pt(254, 176), torso: -12, headAng: 0, face: 1, z: 1,
    armF: { to: at(o3, "handF", 0, 4), bend: "down" }, armB: { to: at(o3, "handF", 4, 0), bend: "down" },
    // nahes Bein quer über seine Brust, fernes Bein über sein Gesicht
    legF: { to: pt(220, 178), bend: "up" }, legB: { to: pt(288, ON_MAT), bend: "up" },
  });
  // 4) Daumen hoch, Hüfte langsam heben
  const o4 = limb(o3, "armF", { mid: pt(262, 150), end: pt(272, 122) });
  const p4 = mk({
    hip: pt(254, 168), torso: -4, headAng: 5, face: 1, z: 1,
    armF: { to: at(o4, "handF", 0, 4), bend: "down" }, armB: { to: at(o4, "handF", 4, 0), bend: "down" },
    legF: { to: pt(220, 178), bend: "up" }, legB: { to: pt(288, ON_MAT), bend: "up" },
  });
  return {
    cardId: "armbar_mount",
    start: { ...s, caption: "Oben im Mount" },
    frames: [
      { p: p1, o: o1, caption: "1. Handgelenk an die Brust", focus: ["handF", "handB"] },
      { p: p2, o: o2, caption: "2. Hochkommen, Bein über seinen Kopf", focus: ["footF", "kneeF"] },
      { p: p3, o: o3, caption: "3. Zurücklehnen, Knie zusammen", focus: ["kneeF", "kneeB"] },
      { p: p4, o: o4, caption: "4. Daumen hoch, Hüfte langsam heben", focus: ["hip"], hold: 1.3 },
    ],
  };
}

function americana(): DemoSequence {
  const s = SIDE_TOP;
  // sein naher Arm 90° gebeugt, Handgelenk am Boden neben dem Kopf
  const o1 = limb(s.o, "armF", { mid: pt(288, 176), end: pt(290, 140) });
  const p1 = limb(s.p, "armF", { to: at(o1, "handF", 0, 2), bend: "up" });
  const p2 = limb(p1, "armB", { to: at(o1, "handF", -4, 6), bend: "down" });
  const o3 = limb(s.o, "armF", { mid: pt(276, 152), end: pt(254, 168) });
  const p3 = limb(limb(p2, "armF", { to: at(o3, "handF", 0, -2), bend: "up" }), "armB", { to: at(o3, "handF", -2, 4), bend: "down" });
  const o4 = limb(s.o, "armF", { mid: pt(272, 144), end: pt(250, 166) });
  const p4base = mk({
    hip: pt(186, 152), torso: -12, headAng: 20, face: 1, z: 1,
    armF: { to: at(o4, "handF", 0, -2), bend: "up" }, armB: { to: at(o4, "handF", -2, 4), bend: "down" },
    legF: { kneel: 1 }, legB: { kneel: -1, shinDir: 180 },
  });
  return {
    cardId: "americana",
    start: { ...s, caption: "Oben in der Seitenkontrolle" },
    frames: [
      { p: p1, o: o1, caption: "1. Arm 90° gebeugt auf die Matte", focus: ["elbowF", "handF"], focusSide: "o" },
      { p: p2, o: o1, caption: "2. Unter dem Arm: eigenes Handgelenk", focus: ["handB"] },
      { p: p3, o: o3, caption: "3. Handgelenk Richtung Hüfte schieben", focus: ["handF"], focusSide: "o" },
      { p: p4base, o: o4, caption: "4. Ellbogen heben: Tap!", focus: ["elbowF"], focusSide: "o", hold: 1.3 },
    ],
  };
}

// ============================================================
// Back
// ============================================================

function rnc(): DemoSequence {
  const s = BACK_TOP;
  // o's Hände kämpfen am Würgearm
  const p1 = limb(s.p, "armF", { mid: at(s.o, "head", 6, 12), end: at(s.o, "neck", 18, 4) });
  const o1 = limb(limb(s.o, "armF", { to: at(p1, "elbowF", 2, 4), bend: "down" }), "armB", { to: at(p1, "elbowF", 6, 6), bend: "down" });
  // ferne Hand kommt hoch neben seinen Kopf (Ellbogen auf Schulterhöhe), damit der Bizeps frei ist
  const p2a = limb(s.p, "armB", { mid: pt(222, 110), end: at(s.o, "head", -6, -12) });
  const biceps = pt((p2a.shoulderB.x + p2a.elbowB.x) / 2 + 4, (p2a.shoulderB.y + p2a.elbowB.y) / 2);
  const p2 = limb(p2a, "armF", { mid: at(s.o, "head", 6, 12), end: biceps });
  const p3a = limb(s.p, "armB", { mid: pt(218, 104), end: at(s.o, "head", -11, 2) });
  const biceps3 = pt((p3a.shoulderB.x + p3a.elbowB.x) / 2 + 4, (p3a.shoulderB.y + p3a.elbowB.y) / 2);
  const p3 = limb(p3a, "armF", { mid: at(s.o, "head", 6, 12), end: biceps3 });
  // Brust weiten, leicht zurücklehnen; o's Kopf geht mit nach hinten
  const o4 = mk({
    hip: pt(230, 176), torso: -102, headAng: -100, face: 1, z: 1,
    armF: { to: pt(236, 128), bend: 1 }, armB: { to: pt(240, 132), bend: 1 },
    legF: { to: pt(286, ON_MAT), bend: 1 }, legB: { to: pt(294, ON_MAT), bend: 1 },
  });
  const p4 = mk({
    hip: pt(194, 172), torso: -100, headAng: -78, face: 1, z: 0,
    armF: { mid: at(o4, "head", 6, 12), end: at(o4, "head", -8, -10) },
    armB: { mid: pt(206, 98), end: at(o4, "head", -12, 2) },
    legF: { to: pt(262, 176), bend: -1 }, legB: { to: pt(268, 178), bend: -1 },
  });
  const p4b = limb(p4, "armF", {
    mid: at(o4, "head", 6, 12),
    end: pt((p4.shoulderB.x + p4.elbowB.x) / 2 + 4, (p4.shoulderB.y + p4.elbowB.y) / 2),
  });
  const o4b = limb(limb(o4, "armF", { to: at(p4b, "elbowF", 2, 4), bend: "down" }), "armB", { to: at(p4b, "elbowF", 6, 6), bend: "down" });
  return {
    cardId: "rnc",
    start: { ...s, caption: "Am Rücken mit Seatbelt" },
    frames: [
      { p: p1, o: o1, caption: "1. Ellbogen unter sein Kinn", focus: ["elbowF"] },
      { p: p2, o: o1, caption: "2. Hand an den eigenen Bizeps", focus: ["handF"] },
      { p: p3, o: o1, caption: "3. Andere Hand hinter seinen Kopf", focus: ["handB"] },
      { p: p4b, o: o4b, caption: "4. Ellbogen zusammen, Brust weiten", focus: ["elbowF", "neck"], hold: 1.3 },
    ],
  };
}

function seatbeltHooks(): DemoSequence {
  const s = BACK_TOP;
  // Ausgang: hinter ihm sitzend, Hände auf seinen Schultern, Beine noch außen
  const o0 = limb(limb(s.o, "armF", { to: pt(262, 160), bend: "down" }), "armB", { to: pt(268, 162), bend: "down" });
  const p0 = mk({
    hip: pt(190, 172), torso: -86, headAng: -60, face: 1, z: 0,
    armF: { to: at(o0, "shoulderF", 2, 2), bend: "down" }, armB: { to: at(o0, "shoulderB", 4, -4), bend: "down" },
    legF: foot(238, "up"), legB: foot(244, "up"),
  });
  const p1 = mk({
    hip: pt(194, 172), torso: -84, headAng: -60, face: 1, z: 0,
    armF: { to: at(s.p, "handF"), bend: -1 }, armB: { to: at(s.p, "handB"), bend: 1 },
    legF: foot(238, "up"), legB: foot(244, "up"),
  });
  const o1 = limb(limb(s.o, "armF", { to: at(p1, "handF", -2, -4), bend: 1 }), "armB", { to: at(p1, "handF", 2, 0), bend: 1 });
  const p2 = limb(limb(p1, "legB", { to: at(s.p, "footB"), bend: -1 }), "legF", foot(236, "up"));
  return {
    cardId: "seatbelt_hooks",
    start: { p: p0, o: o0, caption: "Hinter ihm, noch ohne Griff" },
    frames: [
      { p: p1, o: o1, caption: "1. Seatbelt: ein Arm oben, einer unten", focus: ["handF", "handB"] },
      { p: p2, o: o1, caption: "2. Fernen Hook zuerst", focus: ["footB", "kneeB"] },
      { ...s, caption: "3. Nahen Hook rein, Füße nie kreuzen", focus: ["footF", "footB"], hold: 1.3 },
    ],
  };
}

// ============================================================
// Registry
// ============================================================

const BUILDERS: Record<string, () => DemoSequence> = {
  double_leg: doubleLeg,
  single_leg: singleLeg,
  sprawl,
  snap_down: snapDown,
  ankle_pick: anklePick,
  o_goshi: oGoshi,
  hip_bump: hipBump,
  scissor_sweep: scissorSweep,
  kimura_guard: kimuraGuard,
  triangle,
  stack_pass: stackPass,
  upa,
  elbow_knee: elbowKnee,
  armbar_mount: armbarMount,
  americana,
  rnc,
  seatbelt_hooks: seatbeltHooks,
};

/** Alle Demos, einmalig beim Laden berechnet (reine Geometrie, ~1 ms). */
export const DEMOS: Record<string, DemoSequence> = Object.fromEntries(
  Object.entries(BUILDERS).map(([id, b]) => [id, b()]),
);

export function hasDemo(cardId: string | null | undefined): boolean {
  return !!cardId && Object.prototype.hasOwnProperty.call(DEMOS, cardId);
}

export const DEMO_IDS: string[] = Object.keys(DEMOS);
