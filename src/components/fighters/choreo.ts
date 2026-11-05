// ============================================================
// Mattenkarten – Choreografie der Kämpfer (No-Gi)
// - Griffe je Szene (wo liegen die Hände: Collar Tie, Underhook, Seatbelt …)
// - Zwischen-Keyframes für Positionswechsel (Takedown, Pass, Shrimp, Bridge, Technical Stand-up)
// - Aufgabe-Leiste als Körperbewegung (Isolieren → Kontrollieren → Beenden, Tap, Loslassen)
// Alle Funktionen sind rein (keine React-Abhängigkeit) und arbeiten auf Posen-Kopien.
// ============================================================
import type { Side } from "../../engine/types";
import {
  JOINTS, LEN, NEUTRAL, ON_MAT, build, ik, mirrorPose, pt, scenePoseAny,
  type Joint, type Pose, type Pt, type SceneId, type ScenePair,
} from "./poses";

export type Pair = { p: Pose; o: Pose };
type Hand = "F" | "B";

// ---------- Griffe ----------
export type Grip =
  | "collar" | "underhook" | "overhook" | "wrist" | "seatbelt" | "headlock"
  | "crossface" | "post" | "hips" | "frame" | "bodylock";

/** Grob: welche Körperkarten-Zone ein Griff bedient (für die Glow-Marker). */
export const GRIP_ZONE: Record<Grip, "kopf" | "arme" | "huefte" | "beine"> = {
  collar: "kopf", headlock: "kopf", crossface: "kopf", seatbelt: "kopf",
  underhook: "arme", overhook: "arme", wrist: "arme", frame: "arme",
  post: "huefte", hips: "huefte", bodylock: "huefte",
};

export const GRIP_LABEL: Record<Grip, string> = {
  collar: "Collar Tie", headlock: "Front Headlock", crossface: "Crossface", seatbelt: "Seatbelt",
  underhook: "Underhook", overhook: "Overhook", wrist: "Handgelenk", frame: "Rahmen",
  post: "Hände gestützt", hips: "Hände an der Hüfte", bodylock: "Body Lock",
};

type HandGrips = Partial<Record<Hand, Grip>>;
/** Griffe in Roh-Koordinaten der Szene (a = oben/links, b = unten/rechts). */
const SCENE_GRIPS: Record<SceneId, { a: HandGrips; b: HandGrips }> = {
  dist: { a: {}, b: {} },
  clinch: { a: { F: "collar", B: "underhook" }, b: { F: "underhook", B: "collar" } },
  fhl: { a: { F: "headlock", B: "headlock" }, b: { F: "post", B: "post" } },
  guard: { a: { F: "hips", B: "hips" }, b: { F: "wrist", B: "wrist" } },
  half: { a: { F: "crossface", B: "underhook" }, b: { F: "frame", B: "underhook" } },
  side: { a: { F: "crossface", B: "underhook" }, b: { F: "frame", B: "frame" } },
  mount: { a: { F: "post", B: "post" }, b: { F: "hips", B: "hips" } },
  back: { a: { F: "seatbelt", B: "seatbelt" }, b: { F: "wrist", B: "wrist" } },
  turtle: { a: { F: "seatbelt", B: "seatbelt" }, b: { F: "post", B: "post" } },
};

const isNeutral = (s: SceneId) => (NEUTRAL as readonly SceneId[]).includes(s);

/** Griffe aus Sicht der Kämpfer p/o (gleiche Zuordnung wie scenePoseAny). */
export function sceneGrips(pos: SceneId, top: Side | null): { p: HandGrips; o: HandGrips } {
  const g = SCENE_GRIPS[pos];
  if (isNeutral(pos) || top !== "o") return { p: g.a, o: g.b };
  return { p: g.b, o: g.a };
}

// ---------- Posen-Werkzeuge ----------
export function clonePose(p: Pose): Pose {
  const out = { face: p.face, z: p.z } as Pose;
  for (const j of JOINTS) out[j] = { x: p[j].x, y: p[j].y };
  return out;
}

const UPPER: readonly Joint[] = ["head", "neck", "shoulderF", "shoulderB", "elbowF", "elbowB", "handF", "handB"];
const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
/** Biegerichtung so wählen, dass das Mittelgelenk auf derselben Seite bleibt wie bisher. */
const bendOf = (root: Pt, mid: Pt, end: Pt): 1 | -1 => (cross(root, end, mid) < 0 ? 1 : -1);

/** Hand zu einem Ziel führen (Ellbogen per IK, Seite bleibt erhalten). */
export function reach(p: Pose, hand: Hand, target: Pt): void {
  const s = p[`shoulder${hand}`], e = p[`elbow${hand}`], h = p[`hand${hand}`];
  const r = ik(s, target, LEN.upperArm, LEN.foreArm, bendOf(s, e, h));
  p[`elbow${hand}`] = r.mid; p[`hand${hand}`] = r.end;
}

/** Fuß zu einem Ziel führen (Knie per IK). */
export function reachLeg(p: Pose, leg: Hand, target: Pt): void {
  const k = p[`knee${leg}`], f = p[`foot${leg}`];
  const r = ik(p.hip, target, LEN.thigh, LEN.shin, bendOf(p.hip, k, f));
  p[`knee${leg}`] = r.mid; p[`foot${leg}`] = r.end;
}

/** Oberkörper + Hüfte verschieben; Beine per IK nachführen, Füße bleiben stehen. */
export function shiftBody(p: Pose, dx: number, dy: number): void {
  const feet = { F: { ...p.footF }, B: { ...p.footB } };
  for (const j of [...UPPER, "hip" as Joint]) p[j] = pt(p[j].x + dx, p[j].y + dy);
  reachLeg(p, "F", feet.F); reachLeg(p, "B", feet.B);
}

/** Oberkörper um die Hüfte drehen (Grad, im Uhrzeigersinn positiv). */
export function rotateUpper(p: Pose, deg: number): void {
  const c = Math.cos((deg * Math.PI) / 180), s = Math.sin((deg * Math.PI) / 180);
  for (const j of UPPER) {
    const dx = p[j].x - p.hip.x, dy = p[j].y - p.hip.y;
    p[j] = pt(p.hip.x + dx * c - dy * s, p.hip.y + dx * s + dy * c);
  }
}

const mid = (a: Pt, b: Pt, t = 0.5): Pt => pt(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
const towards = (a: Pt, b: Pt, l: number): Pt => {
  const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return pt(a.x + ((b.x - a.x) / d) * l, a.y + ((b.y - a.y) / d) * l);
};

function mapPair(s: ScenePair, top: Side | null): Pair {
  if (top !== "o") return { p: s.a, o: s.b };
  return { p: mirrorPose(s.b), o: mirrorPose(s.a) };
}

// ---------- Positionswechsel ----------
export type MoveKind = "takedown" | "pass" | "shrimp" | "bridge" | "standup";
const GUARDISH: readonly SceneId[] = ["guard", "half"];
const DOMINANT: readonly SceneId[] = ["side", "mount", "back"];

export function classifyMove(from: SceneId, fromTop: Side | null, to: SceneId, toTop: Side | null): { kind: MoveKind; frameTop: Side } | null {
  if (from === to && fromTop === toTop) return null;
  const nf = isNeutral(from), nt = isNeutral(to);
  if (nf && nt) return null;
  if (nf && !nt && toTop) return { kind: "takedown", frameTop: toTop };
  if (!nf && nt && fromTop) return { kind: "standup", frameTop: fromTop };
  if (!fromTop || !toTop) return null;
  if (fromTop !== toTop) return { kind: "bridge", frameTop: fromTop };
  if (GUARDISH.includes(from) && (DOMINANT.includes(to) || to === "turtle")) return { kind: "pass", frameTop: toTop };
  if ((DOMINANT.includes(from) || from === "turtle") && GUARDISH.includes(to)) return { kind: "shrimp", frameTop: toTop };
  return null;
}

/** Zwischenposen in Roh-Koordinaten (a = Rahmen-„top“ links, b = rechts). */
const RAW_KEYS: Record<MoveKind, () => ScenePair[]> = {
  takedown: () => [
    { // Level Change + Penetration Step: A tief, Kopf an B's Hüfte, Hände hinter B's Knien
      a: build({
        hip: { x: 172, y: 150 }, torso: -24, headAng: -14, face: 1, z: 1,
        handF: { x: 250, y: 158 }, handB: { x: 256, y: 152 }, elbowBendF: 1, elbowBendB: 1,
        legF: { kneel: 1, shinDir: 180 }, legB: { foot: { x: 118, y: ON_MAT }, bend: 1 },
      }),
      b: build({
        hip: { x: 244, y: 122 }, torso: -102, headAng: -120, face: -1, z: 0,
        handF: { x: 212, y: 124 }, handB: { x: 220, y: 120 }, elbowBendF: -1, elbowBendB: -1,
        legF: { foot: { x: 232, y: ON_MAT }, bend: -1 }, legB: { foot: { x: 264, y: ON_MAT }, bend: -1 },
      }),
    },
    { // Anheben & Durchdrücken: B kippt nach hinten, Beine verlieren den Boden
      a: build({
        hip: { x: 196, y: 140 }, torso: -38, headAng: -24, face: 1, z: 1,
        handF: { x: 248, y: 150 }, handB: { x: 254, y: 146 }, elbowBendF: 1, elbowBendB: 1,
        legF: { foot: { x: 222, y: ON_MAT }, bend: 1 }, legB: { foot: { x: 150, y: ON_MAT }, bend: 1 },
      }),
      b: build({
        hip: { x: 252, y: 146 }, torso: -48, headAng: -30, face: -1, z: 0,
        handF: { x: 292, y: 176 }, handB: { x: 230, y: 116 }, elbowBendF: -1, elbowBendB: -1,
        legF: { foot: { x: 214, y: 132 }, bend: 1 }, legB: { foot: { x: 222, y: 150 }, bend: 1 },
      }),
    },
  ],
  pass: () => [
    { // Haltung aufrichten, Knie aufstellen, Hände drücken B's Knie weg
      a: build({
        hip: { x: 178, y: 136 }, torso: -68, headAng: -58, face: 1, z: 1,
        handF: { x: 206, y: 146 }, handB: { x: 200, y: 140 }, elbowBendF: -1, elbowBendB: -1,
        legF: { foot: { x: 204, y: ON_MAT }, bend: 1 }, legB: { kneel: 1 },
      }),
      b: build({
        hip: { x: 230, y: 175 }, torso: -4, headAng: 8, face: 1, z: 0,
        handF: { x: 210, y: 150 }, handB: { x: 216, y: 146 }, elbowBendF: -1, elbowBendB: -1,
        legF: { foot: { x: 190, y: 146 }, bend: -1 }, legB: { foot: { x: 198, y: 160 }, bend: -1 },
      }),
    },
    { // Um die Beine herum: A tief, Beine nach hinten, B's Knie fallen zur Seite
      a: build({
        hip: { x: 196, y: 146 }, torso: -18, headAng: 12, face: 1, z: 1,
        handF: { x: 262, y: 170 }, handB: { x: 226, y: 172 }, elbowBendF: 1, elbowBendB: -1,
        legF: { foot: { x: 144, y: ON_MAT }, bend: 1 }, legB: { foot: { x: 160, y: ON_MAT }, bend: 1 },
      }),
      b: build({
        hip: { x: 214, y: 177 }, torso: -2, headAng: 6, face: 1, z: 0,
        handF: { x: 236, y: 158 }, handB: { x: 240, y: 154 }, elbowBendF: -1, elbowBendB: -1,
        legF: { foot: { x: 160, y: 176 }, bend: 1 }, legB: { foot: { x: 166, y: ON_MAT }, bend: 1 },
      }),
    },
  ],
  shrimp: () => [
    { // Rahmen + Hüfte raus (Shrimp): B dreht auf die Seite, Füße unter der Hüfte
      a: build({
        hip: { x: 194, y: 152 }, torso: -24, headAng: 4, face: 1, z: 1,
        handF: { x: 252, y: 176 }, handB: { x: 246, y: 174 }, elbowBendF: 1, elbowBendB: 1,
        legF: { kneel: 1 }, legB: { kneel: -1, shinDir: 180 },
      }),
      b: build({
        hip: { x: 238, y: 175 }, torso: -6, headAng: 4, face: 1, z: 0,
        handF: { x: 214, y: 150 }, handB: { x: 220, y: 146 }, elbowBendF: -1, elbowBendB: -1,
        legF: { foot: { x: 222, y: ON_MAT }, bend: -1 }, legB: { foot: { x: 214, y: ON_MAT }, bend: -1 },
      }),
    },
    { // Knie rein: B's Knie schiebt sich zwischen die Hüften
      a: build({
        hip: { x: 188, y: 150 }, torso: -56, headAng: -40, face: 1, z: 1,
        handF: { x: 214, y: 160 }, handB: { x: 220, y: 158 }, elbowBendF: -1, elbowBendB: -1,
        legF: { kneel: 1 }, legB: { kneel: 1 },
      }),
      b: build({
        hip: { x: 236, y: 175 }, torso: -6, headAng: 6, face: 1, z: 0,
        handF: { x: 212, y: 140 }, handB: { x: 218, y: 136 }, elbowBendF: -1, elbowBendB: -1,
        legF: { foot: { x: 190, y: 150 }, bend: -1 }, legB: { foot: { x: 190, y: ON_MAT }, bend: -1 },
      }),
    },
  ],
  bridge: () => [
    { // Bridge (Upa): B's Hüfte schießt hoch, A wird ausgehebelt
      a: build({
        hip: { x: 220, y: 130 }, torso: -100, headAng: -96, face: 1, z: 1,
        handF: { x: 262, y: 128 }, handB: { x: 256, y: 120 }, elbowBendF: -1, elbowBendB: -1,
        legF: { foot: { x: 198, y: 168 }, bend: 1 }, legB: { foot: { x: 192, y: 172 }, bend: 1 },
      }),
      b: build({
        hip: { x: 214, y: 150 }, torso: 28, headAng: 24, face: 1, z: 0,
        handF: { x: 222, y: 126 }, handB: { x: 226, y: 122 }, elbowBendF: -1, elbowBendB: -1,
        legF: { foot: { x: 180, y: ON_MAT }, bend: -1 }, legB: { foot: { x: 172, y: ON_MAT }, bend: -1 },
      }),
    },
    { // Rollen: A kippt nach hinten, B kommt hoch
      a: build({
        hip: { x: 196, y: 156 }, torso: -140, headAng: -160, face: 1, z: 0,
        handF: { x: 146, y: ON_MAT }, handB: { x: 154, y: ON_MAT }, elbowBendF: 1, elbowBendB: 1,
        legF: { foot: { x: 234, y: 128 }, bend: -1 }, legB: { foot: { x: 242, y: 138 }, bend: -1 },
      }),
      b: build({
        hip: { x: 224, y: 166 }, torso: -58, headAng: -70, face: -1, z: 1,
        handF: { x: 190, y: 138 }, handB: { x: 196, y: 132 }, elbowBendF: -1, elbowBendB: -1,
        legF: { kneel: -1, shinDir: 0 }, legB: { foot: { x: 262, y: ON_MAT }, bend: -1 },
      }),
    },
  ],
  standup: () => [
    { // Technical Stand-up 1: hinsetzen, Hand hinten stützen, vordere Hand als Rahmen
      a: build({
        hip: { x: 166, y: 136 }, torso: -80, headAng: -66, face: 1, z: 0,
        handF: { x: 196, y: 108 }, handB: { x: 190, y: 102 }, elbowBendF: 1, elbowBendB: 1,
        legF: { foot: { x: 190, y: ON_MAT }, bend: 1 }, legB: { foot: { x: 136, y: ON_MAT }, bend: 1 },
      }),
      b: build({
        hip: { x: 240, y: 176 }, torso: -58, headAng: -80, face: -1, z: 1,
        handF: { x: 210, y: 140 }, handB: { x: 282, y: ON_MAT }, elbowBendF: -1, elbowBendB: 1,
        legF: { foot: { x: 206, y: ON_MAT }, bend: -1 }, legB: { foot: { x: 218, y: 176 }, bend: 1 },
      }),
    },
    { // Technical Stand-up 2: Hüfte hoch, Bein nach hinten durchziehen
      a: build({
        hip: { x: 150, y: 128 }, torso: -76, headAng: -64, face: 1, z: 0,
        handF: { x: 192, y: 94 }, handB: { x: 184, y: 86 }, elbowBendF: 1, elbowBendB: 1,
        legF: { foot: { x: 176, y: ON_MAT }, bend: 1 }, legB: { foot: { x: 120, y: ON_MAT }, bend: 1 },
      }),
      b: build({
        hip: { x: 256, y: 146 }, torso: -88, headAng: -100, face: -1, z: 1,
        handF: { x: 222, y: 118 }, handB: { x: 276, y: ON_MAT }, elbowBendF: -1, elbowBendB: 1,
        legF: { foot: { x: 230, y: ON_MAT }, bend: -1 }, legB: { foot: { x: 294, y: ON_MAT }, bend: -1 },
      }),
    },
  ],
};

const KEY_CACHE = new Map<MoveKind, ScenePair[]>();

/** Zwischenposen (p/o) für einen Positionswechsel – leer, wenn direkt interpoliert wird. */
export function moveKeyframes(from: SceneId, fromTop: Side | null, to: SceneId, toTop: Side | null): { kind: MoveKind | null; frames: Pair[] } {
  const m = classifyMove(from, fromTop, to, toTop);
  if (!m) return { kind: null, frames: [] };
  let raw = KEY_CACHE.get(m.kind);
  if (!raw) { raw = RAW_KEYS[m.kind](); KEY_CACHE.set(m.kind, raw); }
  return { kind: m.kind, frames: raw.map((k) => mapPair(k, m.frameTop)) };
}

// ---------- Aufgabe als Körperbewegung ----------
export interface SubPose { owner: Side; id: string; zone: string; step: number }
export type TapState = "hold" | "tapping" | "release" | null;

const CHOKES = new Set(["rnc", "guillotine", "arm_triangle", "triangle"]);
const other = (s: Side): Side => (s === "p" ? "o" : "p");

/** Welche Hand des Verteidigers abklopft (die freie). */
export function tapHand(sub: SubPose): Hand {
  return CHOKES.has(sub.id) || sub.zone === "kopf" ? "F" : "B";
}

/**
 * Posen für den Aufgabe-Fortschritt: Schritt 1 isolieren, 2 kontrollieren, 3 beenden.
 * tap="tapping": Verteidiger legt die freie Hand zum Abklopfen an; tap="release": Angreifer lässt sofort los.
 */
export function applySub(base: Pair, sub: SubPose | null, tap: TapState): Pair {
  if (!sub || sub.step <= 0) return base;
  const A = clonePose(base[sub.owner]);
  const D = clonePose(base[other(sub.owner)]);
  const toD = Math.sign(D.hip.x - A.hip.x) || A.face;
  const step = tap ? 3 : Math.min(3, sub.step);

  if (tap === "release") {
    // Sofort loslassen: Hände geöffnet nach oben, Oberkörper weg vom Partner.
    shiftBody(A, -toD * 4, -2);
    for (const h of ["F", "B"] as const) {
      const s = A[`shoulder${h}`];
      reach(A, h, pt(s.x + toD * (h === "F" ? 16 : 10), s.y - 34));
    }
    return { [sub.owner]: A, [other(sub.owner)]: D } as Pair;
  }

  const choke = CHOKES.has(sub.id) || sub.zone === "kopf";
  if (choke) {
    if (sub.id === "triangle") {
      // Beine schließen um Hals + Arm: erst ein Bein, dann beide (Figure Four)
      if (step >= 1) reachLeg(A, "F", pt(D.neck.x - toD * 2, D.neck.y - 6));
      if (step >= 2) reachLeg(A, "B", pt(D.neck.x + toD * 4, D.neck.y - 2));
      if (step >= 1) reach(A, "F", towards(A.shoulderF, D.head, 60));
      if (step >= 2) reach(A, "B", D.head);
      if (step >= 3) { D.head = pt(D.head.x, D.head.y + 6); shiftBody(A, -toD * 3, 0); }
    } else {
      if (step >= 3) { shiftBody(A, -toD * 4, -2); rotateUpper(A, -toD * 8); }
      if (step >= 1) reach(A, "F", pt(D.neck.x + toD * 3, D.neck.y + 1));
      if (step >= 2) {
        reach(A, "B", pt(D.head.x + toD * 4, D.head.y - 3));
        // Kopf an Kopf
        A.head = towards(A.neck, mid(A.head, D.head, 0.35), LEN.neck);
      }
      if (step >= 3) D.head = towards(D.neck, pt(D.head.x - toD * 6, D.head.y), LEN.neck);
      // Verteidiger: beide Hände am würgenden Arm
      if (step >= 2) { reach(D, "F", pt(D.neck.x + toD * 2, D.neck.y + 4)); reach(D, "B", pt(D.neck.x - toD * 2, D.neck.y + 2)); }
    }
  } else {
    // Armhebel: der nahe Arm des Verteidigers wird isoliert (1), an die Brust gezogen (2), dann Hüfte hoch (3).
    if (step >= 2) shiftBody(A, toD * 6, 0);
    if (step >= 3) { shiftBody(A, 0, -7); rotateUpper(A, -toD * 10); }
    if (step >= 2) {
      const chest = mid(A.hip, A.neck, 0.55);
      reach(D, "F", step >= 3 ? towards(D.shoulderF, chest, 80) : chest);
    }
    const w = D.handF;
    reach(A, "F", w);
    reach(A, "B", pt(D.elbowF.x + (w.x - D.elbowF.x) * 0.45, D.elbowF.y + (w.y - D.elbowF.y) * 0.45 - 2));
  }

  if (tap === "tapping") {
    // Freie Hand zum Abklopfen auf den Angreifer (Hüfte/Oberschenkel), Animation kommt vom Renderer.
    // Sichtbar abklopfen: bei Würgern auf das Bein des Angreifers (falls erreichbar), sonst deutlich auf die Matte neben sich.
    const h = tapHand(sub);
    const sh = D[`shoulder${h}`];
    const leg = A.kneeF;
    const legOk = choke && Math.hypot(leg.x - sh.x, leg.y - sh.y) < LEN.upperArm + LEN.foreArm - 4;
    const away = Math.sign(D.neck.x - D.hip.x) || -toD;
    reach(D, h, legOk ? pt(leg.x, leg.y - 6) : pt(sh.x + away * 34, Math.min(ON_MAT - 6, sh.y + 40)));
  }
  return { [sub.owner]: A, [other(sub.owner)]: D } as Pair;
}

/** Posen für Szene + Aufgabe + Tap in einem Schritt. */
export function finalPose(pos: SceneId, top: Side | null, sub: SubPose | null, tap: TapState): Pair {
  return applySub(scenePoseAny(pos, top), sub, tap);
}
