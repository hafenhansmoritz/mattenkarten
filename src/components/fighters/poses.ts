// ============================================================
// Mattenkarten – 2D-Skelettposen (Seitenansicht) für die Kampf-Szenen
// viewBox 400×220, Mattenlinie y = 190.
// F = dem Betrachter zugewandte Seite (near), B = abgewandte Seite (far).
// Alle Gliedmaßen werden per Inverse-/Vorwärtskinematik mit festen Längen
// erzeugt, damit Oberarm≈Unterarm und Oberschenkel≈Schienbein konsistent sind.
// ============================================================
import type { PositionId, Side } from "../../engine/types";

export type Joint =
  | "head" | "neck" | "shoulderF" | "shoulderB" | "elbowF" | "elbowB" | "handF" | "handB"
  | "hip" | "kneeF" | "kneeB" | "footF" | "footB";

export const JOINTS: readonly Joint[] = [
  "head", "neck", "shoulderF", "shoulderB", "elbowF", "elbowB", "handF", "handB",
  "hip", "kneeF", "kneeB", "footF", "footB",
] as const;

export interface Pt { x: number; y: number }

export type Pose = Record<Joint, Pt> & {
  /** Blickrichtung: +1 = nach rechts, -1 = nach links (für Fußspitzen). */
  face: 1 | -1;
  /** Stapelreihenfolge des Rumpfs (höher = weiter vorn). */
  z: number;
};

export const MAT_Y = 190;
/** Gelenkpunkt, der auf der Matte liegt (Strichradius ~7). */
export const ON_MAT = 183;
export const VIEW_W = 400;

export const LEN = {
  torso: 52,
  neck: 13,
  upperArm: 28,
  foreArm: 27,
  thigh: 38,
  shin: 37,
} as const;

// ---------- Geometrie-Helfer ----------
const rad = (deg: number) => (deg * Math.PI) / 180;
export const pt = (x: number, y: number): Pt => ({ x: round(x), y: round(y) });
const round = (v: number) => Math.round(v * 10) / 10;
/** Punkt von `o` aus in Richtung `deg` (0° = rechts, 90° = unten) mit Länge `l`. */
export const polar = (o: Pt, deg: number, l: number): Pt => pt(o.x + Math.cos(rad(deg)) * l, o.y + Math.sin(rad(deg)) * l);

/**
 * Zwei-Segment-IK: Wurzel → Ziel mit Segmentlängen l1/l2.
 * bend = +1/-1 wählt die Seite, auf die das Mittelgelenk ausweicht
 * (+1 = links von der Richtung Wurzel→Ziel im SVG-Koordinatensystem, also "gegen den Uhrzeigersinn").
 * Ist das Ziel zu weit, wird der Arm/das Bein gestreckt in Zielrichtung gelegt.
 */
export function ik(root: Pt, target: Pt, l1: number, l2: number, bend: 1 | -1): { mid: Pt; end: Pt } {
  const dx = target.x - root.x;
  const dy = target.y - root.y;
  let d = Math.hypot(dx, dy);
  const maxD = l1 + l2 - 0.5;
  const minD = Math.abs(l1 - l2) + 1;
  const ux = d === 0 ? 1 : dx / d;
  const uy = d === 0 ? 0 : dy / d;
  d = Math.min(maxD, Math.max(minD, d));
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  // Normale (gegen den Uhrzeigersinn im Bildschirmkoordinatensystem: (uy, -ux))
  const nx = uy * bend;
  const ny = -ux * bend;
  const mid = pt(root.x + ux * a + nx * h, root.y + uy * a + ny * h);
  const end = pt(root.x + ux * d, root.y + uy * d);
  return { mid, end };
}

export interface Spec {
  hip: Pt;
  /** Rumpfwinkel Hüfte→Nacken in Grad (−90 = senkrecht nach oben). */
  torso: number;
  /** Winkel Nacken→Kopfmitte. */
  headAng: number;
  handF: Pt; handB: Pt; elbowBendF: 1 | -1; elbowBendB: 1 | -1;
  /** Fuß-Ziel oder Knie auf der Matte (kneel: Knie in Richtung dir auf die Matte, Schienbein liegt flach nach hinten). */
  legF: LegSpec; legB: LegSpec;
  face: 1 | -1;
  z?: number;
}

export type LegSpec =
  | { foot: Pt; bend: 1 | -1 }
  | { kneel: 1 | -1; shinDir?: number };

export function build(s: Spec): Pose {
  const hip = pt(s.hip.x, s.hip.y);
  const neck = polar(hip, s.torso, LEN.torso);
  const head = polar(neck, s.headAng, LEN.neck);
  // Schultern sitzen ein Stück unterhalb des Nackens auf der Rumpflinie, far-Schulter minimal versetzt.
  const shoulderF = polar(neck, s.torso + 180, 5);
  const shoulderB = pt(shoulderF.x - s.face * 2, shoulderF.y - 2);
  const armF = ik(shoulderF, s.handF, LEN.upperArm, LEN.foreArm, s.elbowBendF);
  const armB = ik(shoulderB, s.handB, LEN.upperArm, LEN.foreArm, s.elbowBendB);
  const lf = leg(hip, s.legF);
  const lb = leg(pt(hip.x - s.face * 1.5, hip.y - 1), s.legB);
  return {
    head, neck, shoulderF, shoulderB,
    elbowF: armF.mid, handF: armF.end, elbowB: armB.mid, handB: armB.end,
    hip, kneeF: lf.knee, footF: lf.foot, kneeB: lb.knee, footB: lb.foot,
    face: s.face, z: s.z ?? 0,
  };
}

function leg(hip: Pt, l: LegSpec): { knee: Pt; foot: Pt } {
  if ("foot" in l) {
    const r = ik(hip, l.foot, LEN.thigh, LEN.shin, l.bend);
    return { knee: r.mid, foot: r.end };
  }
  // Knie auf der Matte: horizontale Distanz aus Oberschenkellänge
  const dy = Math.min(LEN.thigh - 0.5, Math.max(0, ON_MAT - hip.y));
  const dx = Math.sqrt(LEN.thigh * LEN.thigh - dy * dy) * l.kneel;
  const knee = pt(hip.x + dx, ON_MAT);
  const foot = polar(knee, l.shinDir ?? (l.kneel > 0 ? 180 : 0), LEN.shin);
  return { knee, foot: pt(foot.x, Math.min(foot.y, ON_MAT)) };
}

// ---------- Szenen ----------
// A = "top"/linker Kämpfer, B = "bottom"/rechter Kämpfer.

export interface ScenePair { a: Pose; b: Pose }

function dist(): ScenePair {
  const a = build({
    hip: { x: 128, y: 124 }, torso: -72, headAng: -62, face: 1,
    handF: { x: 176, y: 84 }, handB: { x: 168, y: 74 }, elbowBendF: 1, elbowBendB: 1,
    legF: { foot: { x: 156, y: ON_MAT }, bend: 1 },
    legB: { foot: { x: 96, y: ON_MAT }, bend: 1 },
  });
  return { a, b: mirrorPose(a) };
}

function clinch(): ScenePair {
  // Over-Under: vorne (near) hat A den Overhook, B den Underhook; hinten umgekehrt.
  const a = build({
    hip: { x: 168, y: 122 }, torso: -78, headAng: -55, face: 1,
    handF: { x: 222, y: 78 },  // over: über B's Schulter
    handB: { x: 226, y: 104 }, // under: unter B's Achsel um den Rücken
    elbowBendF: 1, elbowBendB: -1,
    legF: { foot: { x: 192, y: ON_MAT }, bend: 1 },
    legB: { foot: { x: 130, y: ON_MAT }, bend: 1 },
  });
  const bRaw = build({
    hip: { x: 168, y: 122 }, torso: -78, headAng: -55, face: 1,
    handF: { x: 226, y: 104 }, // under
    handB: { x: 222, y: 78 },  // over
    elbowBendF: -1, elbowBendB: 1,
    legF: { foot: { x: 136, y: ON_MAT }, bend: 1 },
    legB: { foot: { x: 190, y: ON_MAT }, bend: 1 },
  });
  return { a, b: mirrorPose(bRaw) };
}

function fhl(): ScenePair {
  // B kniet (Turtle), Blick nach links, Kopf tief unter A's Brust; A sprawlt mit tiefer Hüfte, Beine weit nach hinten.
  const b = build({
    hip: { x: 268, y: 146 }, torso: 160, headAng: 140, face: -1, z: 0,
    handF: { x: 206, y: ON_MAT }, handB: { x: 214, y: ON_MAT }, elbowBendF: -1, elbowBendB: -1,
    legF: { kneel: -1, shinDir: 0 },
    legB: { kneel: -1, shinDir: 0 },
  });
  const a = build({
    hip: { x: 148, y: 166 }, torso: -10, headAng: 30, face: 1, z: 1,
    // Arme umschließen B's Kopf/Hals (Front Headlock, Hand unter dem Kinn)
    handF: { x: 204, y: 182 }, handB: { x: 214, y: 178 }, elbowBendF: 1, elbowBendB: 1,
    legF: { foot: { x: 78, y: ON_MAT }, bend: 1 },
    legB: { foot: { x: 90, y: ON_MAT }, bend: 1 },
  });
  return { a, b };
}

function guard(): ScenePair {
  // B auf dem Rücken, Kopf rechts; Beine geschlossen um A's Hüfte (Knie seitlich an A's Taille, Füße hinter A's Rücken gekreuzt).
  const b = build({
    hip: { x: 228, y: 174 }, torso: -3, headAng: 10, face: 1, z: 0,
    // No-Gi: beide Hände kontrollieren A's Handgelenke (Griffkampf aus der Guard)
    handF: { x: 230, y: 152 }, handB: { x: 236, y: 148 }, elbowBendF: -1, elbowBendB: -1,
    legF: { foot: { x: 170, y: 134 }, bend: -1 },
    legB: { foot: { x: 176, y: 128 }, bend: -1 },
  });
  // A kniet aufrecht in der Guard, Knie vorn unter sich, Hände auf B's Hüfte (Haltung).
  const a = build({
    hip: { x: 186, y: 150 }, torso: -80, headAng: -72, face: 1, z: 1,
    handF: { x: 226, y: 160 }, handB: { x: 222, y: 156 }, elbowBendF: -1, elbowBendB: -1,
    legF: { kneel: 1 },
    legB: { kneel: 1 },
  });
  return { a, b };
}

function side(): ScenePair {
  // B flach auf dem Rücken, Kopf rechts, Knie angewinkelt. A quer darüber: Brust auf Brust, Hüfte tief,
  // nahes Knie an B's Hüfte, Beine nach hinten gestreckt.
  const b = build({
    hip: { x: 212, y: 177 }, torso: 0, headAng: 5, face: 1, z: 0,
    handF: { x: 238, y: 160 }, handB: { x: 230, y: 162 }, elbowBendF: -1, elbowBendB: -1,
    legF: { foot: { x: 164, y: ON_MAT }, bend: -1 },
    legB: { foot: { x: 156, y: ON_MAT }, bend: -1 },
  });
  const a = build({
    hip: { x: 186, y: 156 }, torso: -3, headAng: 25, face: 1, z: 1,
    // Crossface (near) um B's Kopf, far-Arm Underhook Richtung B's Achsel
    handF: { x: 276, y: 172 }, handB: { x: 256, y: 176 }, elbowBendF: 1, elbowBendB: -1,
    legF: { kneel: 1 },
    legB: { kneel: -1, shinDir: 180 },
  });
  return { a, b };
}

function mount(): ScenePair {
  // B auf dem Rücken, Knie hoch; A sitzt aufrecht auf B's Hüfte, Knie neben B's Rippen, Schienbeine flach nach hinten.
  const b = build({
    hip: { x: 212, y: 177 }, torso: 0, headAng: 5, face: 1, z: 0,
    handF: { x: 234, y: 150 }, handB: { x: 238, y: 146 }, elbowBendF: -1, elbowBendB: -1,
    legF: { foot: { x: 160, y: ON_MAT }, bend: -1 },
    legB: { foot: { x: 150, y: ON_MAT }, bend: -1 },
  });
  const a = build({
    hip: { x: 222, y: 156 }, torso: -86, headAng: -78, face: 1, z: 1,
    handF: { x: 262, y: 168 }, handB: { x: 256, y: 166 }, elbowBendF: -1, elbowBendB: -1,
    legF: { kneel: 1, shinDir: 180 },
    legB: { kneel: 1, shinDir: 180 },
  });
  return { a, b };
}

function back(): ScenePair {
  // Beide sitzen, Blick nach rechts. A hinter B: Hooks innen an B's Oberschenkeln, Seatbelt über die Brust.
  const b = build({
    hip: { x: 230, y: 176 }, torso: -98, headAng: -78, face: 1, z: 1,
    // B kontrolliert mit beiden Händen den Seatbelt-Arm vor der Brust
    handF: { x: 244, y: 140 }, handB: { x: 248, y: 144 }, elbowBendF: 1, elbowBendB: 1,
    legF: { foot: { x: 286, y: ON_MAT }, bend: 1 },
    legB: { foot: { x: 294, y: ON_MAT }, bend: 1 },
  });
  const a = build({
    hip: { x: 196, y: 172 }, torso: -84, headAng: -60, face: 1, z: 0,
    // near: über B's Schulter quer über die Brust; far: unter B's Achsel
    handF: { x: 246, y: 148 }, handB: { x: 244, y: 132 }, elbowBendF: -1, elbowBendB: 1,
    // Hooks: Fersen innen an B's Oberschenkeln, Knie über B's Knien sichtbar
    legF: { foot: { x: 262, y: 176 }, bend: -1 },
    legB: { foot: { x: 268, y: 178 }, bend: -1 },
  });
  return { a, b };
}

function half(): ScenePair {
  // Half Guard: B auf der Seite/dem Rücken, Kopf rechts, Oberkörper leicht aufgedreht; B's Beine klemmen EIN Bein
  // von A ein (A's fernes Bein: B's nahes Bein hakt von oben über A's Wade, B's fernes Bein liegt darunter).
  // B's ferner Arm holt den Underhook unter A's Achsel. A liegt Brust auf Brust mit Crossface (nah),
  // das freie nahe Bein weit nach hinten gestreckt.
  const b = build({
    hip: { x: 212, y: 176 }, torso: -10, headAng: 0, face: 1, z: 0,
    // near: Rahmen an A's Hüfte; far: Underhook unter A's Achsel Richtung Rücken
    handF: { x: 196, y: 152 }, handB: { x: 208, y: 138 }, elbowBendF: -1, elbowBendB: 1,
    legF: { foot: { x: 146, y: 172 }, bend: -1 },
    legB: { foot: { x: 152, y: ON_MAT }, bend: -1 },
  });
  const a = build({
    hip: { x: 184, y: 150 }, torso: -4, headAng: 28, face: 1, z: 1,
    // Crossface (near) um B's Kopf, far-Arm unter B's Kopf
    handF: { x: 282, y: 172 }, handB: { x: 240, y: 174 }, elbowBendF: 1, elbowBendB: -1,
    // freies nahes Bein: weit nach hinten auf den Zehen (Hüfte flach)
    legF: { foot: { x: 108, y: ON_MAT }, bend: 1 },
    // eingeklemmtes fernes Bein: Knie auf der Matte, Schienbein flach nach hinten (zwischen B's Beinen)
    legB: { kneel: -1, shinDir: 180 },
  });
  return { a, b };
}

function turtle(): ScenePair {
  // Turtle: B kompakt auf Knien und Ellbogen, Blick nach rechts, Kopf eingezogen.
  // A seitlich hinter B, Brust auf B's Rücken, Seatbelt-artiger Griff (nah unter der Achsel, fern über die Schulter).
  const b = build({
    hip: { x: 196, y: 150 }, torso: 22, headAng: 70, face: 1, z: 0,
    handF: { x: 258, y: ON_MAT }, handB: { x: 264, y: ON_MAT }, elbowBendF: -1, elbowBendB: -1,
    legF: { kneel: 1, shinDir: 180 },
    legB: { kneel: 1, shinDir: 180 },
  });
  const a = build({
    hip: { x: 166, y: 128 }, torso: 14, headAng: 50, face: 1, z: 1,
    // near: unter B's Achsel zur Brust; far: über B's Schulter → Seatbelt
    handF: { x: 236, y: 166 }, handB: { x: 248, y: 160 }, elbowBendF: -1, elbowBendB: -1,
    legF: { foot: { x: 158, y: ON_MAT }, bend: 1 },
    legB: { foot: { x: 128, y: ON_MAT }, bend: 1 },
  });
  return { a, b };
}

/** Alle Szenen inkl. Kern-2-Positionen (half, turtle). */
export type SceneId = PositionId | "half" | "turtle";

const SCENES: Record<SceneId, () => ScenePair> = { dist, clinch, fhl, guard, side, mount, back, half, turtle };
const CACHE = new Map<SceneId, ScenePair>();

/** Kern-2-Positionen → Szene ("stand" nutzt die Distanz-Szene). */
export function sceneOfPos2(pos: "stand" | "clinch" | "guard" | "half" | "turtle" | "side" | "mount" | "back"): SceneId {
  return pos === "stand" ? "dist" : pos;
}

/** Rohe Szene: a = top/links, b = bottom/rechts. */
export function scene(pos: SceneId): ScenePair {
  let s = CACHE.get(pos);
  if (!s) {
    s = SCENES[pos]();
    CACHE.set(pos, s);
  }
  return s;
}

export function mirrorPose(p: Pose): Pose {
  const out = { face: (p.face * -1) as 1 | -1, z: p.z } as Pose;
  for (const j of JOINTS) out[j] = { x: round(VIEW_W - p[j].x), y: p[j].y };
  return out;
}

export const NEUTRAL: readonly PositionId[] = ["dist", "clinch"];

/**
 * Weist die Posen den Kämpfern zu (p = Spieler/blau, o = Gegner/rot).
 * Neutral: Spieler steht links. Boden: wer oben ist bekommt die Top-Pose;
 * ist der Gegner oben, wird die Szene gespiegelt, damit der Spieler auf der linken Seite bleibt.
 */
export function scenePose(pos: PositionId, topSide: Side | null): { p: Pose; o: Pose } {
  return scenePoseAny(pos, topSide);
}

/** Wie scenePose, akzeptiert aber auch die Kern-2-Szenen "half" und "turtle". */
export function scenePoseAny(pos: SceneId, topSide: Side | null): { p: Pose; o: Pose } {
  const s = scene(pos);
  if ((NEUTRAL as readonly SceneId[]).includes(pos) || topSide !== "o") return { p: s.a, o: s.b };
  return { p: mirrorPose(s.b), o: mirrorPose(s.a) };
}

// ---------- Zeichen-Helfer (geteilt von Fighters & PoseThumb) ----------
export type Getter = (j: Joint) => Pt;

export const limbPath = (a: Pt, b: Pt, c: Pt) => `M${a.x} ${a.y}L${b.x} ${b.y}L${c.x} ${c.y}`;
export const segPath = (a: Pt, b: Pt) => `M${a.x} ${a.y}L${b.x} ${b.y}`;

/** Gürtel: kurzer Querbalken über dem Rumpf knapp oberhalb der Hüfte. */
export function beltPath(hip: Pt, neck: Pt): string {
  const dx = neck.x - hip.x;
  const dy = neck.y - hip.y;
  const l = Math.hypot(dx, dy) || 1;
  const ux = dx / l, uy = dy / l;
  const cx = hip.x + ux * 7, cy = hip.y + uy * 7;
  const nx = -uy * 11, ny = ux * 11;
  return `M${round(cx - nx)} ${round(cy - ny)}L${round(cx + nx)} ${round(cy + ny)}`;
}

export const FIGHTER_PARTS = {
  armF: ["shoulderF", "elbowF", "handF"],
  armB: ["shoulderB", "elbowB", "handB"],
  legF: ["hip", "kneeF", "footF"],
  legB: ["hip", "kneeB", "footB"],
} as const satisfies Record<string, readonly [Joint, Joint, Joint]>;

export const STROKE = { limb: 15, torso: 24, head: 12, belt: 6 } as const;

export type Part = "armF" | "armB" | "legF" | "legB" | "body";
export interface Layer<K extends string> { who: K; parts: Part[] }

/**
 * Zeichenreihenfolge über beide Kämpfer hinweg: zuerst alle far-Gliedmaßen,
 * dann die Rümpfe, dann die near-Gliedmaßen – jeweils hinterer Kämpfer (kleines z) zuerst.
 * So liegen z. B. die Guard-Beine vorn über und hinten hinter dem Top-Kämpfer.
 */
export function layerOrder<K extends string>(fighters: { key: K; z: number }[]): Layer<K>[] {
  const sorted = [...fighters].sort((a, b) => a.z - b.z);
  const out: Layer<K>[] = [];
  for (const f of sorted) out.push({ who: f.key, parts: ["legB", "armB"] });
  for (const f of sorted) out.push({ who: f.key, parts: ["body"] });
  for (const f of sorted) out.push({ who: f.key, parts: ["legF", "armF"] });
  return out;
}

/** Bodenschatten: Mitte und Breite aus den tiefsten Gelenken. */
export function shadowOf(xs: number[], ys: number[]): { cx: number; rx: number } {
  let min = Infinity, max = -Infinity;
  xs.forEach((x, i) => {
    if (ys[i] > MAT_Y - 45) { min = Math.min(min, x); max = Math.max(max, x); }
  });
  if (!isFinite(min)) { min = Math.min(...xs); max = Math.max(...xs); }
  return { cx: round((min + max) / 2), rx: round(Math.max(22, (max - min) / 2 + 12)) };
}

/**
 * Ungefährer Berührungspunkt der beiden Kämpfer (viewBox-Koordinaten 400×220):
 * Mittel der drei nächstgelegenen Gelenkpaare (p-Gelenk ↔ o-Gelenk).
 * Für Treffer-Effekte (ImpactBurst) und den Kamera-Zoom.
 */
export function contactPoint(pos: SceneId, topSide: Side | null): Pt {
  const { p, o } = scenePoseAny(pos, topSide);
  const pairs: { d: number; x: number; y: number }[] = [];
  for (const a of JOINTS) for (const b of JOINTS) {
    const A = p[a], B = o[b];
    pairs.push({ d: Math.hypot(A.x - B.x, A.y - B.y), x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 });
  }
  pairs.sort((u, v) => u.d - v.d);
  const top3 = pairs.slice(0, 3);
  const x = top3.reduce((s, q) => s + q.x, 0) / top3.length;
  const y = top3.reduce((s, q) => s + q.y, 0) / top3.length;
  return { x: round(x), y: round(Math.min(y, MAT_Y - 8)) };
}
