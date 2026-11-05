import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  animate, motion, useAnimationControls, useMotionValue, useReducedMotion, useSpring, useTransform,
  type MotionValue,
} from "framer-motion";
import type { PositionId, Side } from "../../engine/types";
import {
  FIGHTER_PARTS, JOINTS, MAT_Y, STROKE, contactPoint, layerOrder, shadowOf,
  type Joint, type Part, type Pose, type Pt, type SceneId,
} from "./poses";
import {
  GRIP_ZONE, finalPose, moveKeyframes, sceneGrips, tapHand,
  type Grip, type Pair, type SubPose, type TapState,
} from "./choreo";

const SPRING = { stiffness: 140, damping: 18, mass: 1 };
/** Zeitlupe: 0.4× Steifigkeit, Dämpfung mit √0.4 skaliert → gleiches Dämpfungsverhältnis, nur langsamer. */
const SPRING_SLOW = { stiffness: 56, damping: 11.4, mass: 1 };
const LEAN_SPRING = { stiffness: 260, damping: 20, mass: 1 };
/** Anteil der Ausholbewegung je Gelenk: [x-Lean, y-Crouch]. Füße bleiben stehen. */
const LEAN: Record<Joint, [number, number]> = {
  head: [1, 1], neck: [1, 1], shoulderF: [1, 1], shoulderB: [1, 1],
  elbowF: [0.9, 0.9], elbowB: [0.9, 0.9], handF: [0.8, 0.75], handB: [0.8, 0.75],
  hip: [0.6, 0.8], kneeF: [0.3, 0.3], kneeB: [0.3, 0.3], footF: [0, 0], footB: [0, 0],
};
const LEAN_X = 6;
const LEAN_Y = 4;

export type BodyPart = "legs" | "hips" | "arms" | "neck" | "head" | "torso";
export interface FighterHighlight {
  side: Side;
  part: BodyPart;
  /** Optional eigene Farbe; Standard ist Gold (--points). */
  color?: string;
}

/** Gelenke, um die beim Highlight ein Leuchtring liegt. "torso" = Mitte zwischen Nacken und Hüfte.
 *  Nur near-Seite (F), damit sich Ringe nicht stapeln – die Gliedmaßen selbst leuchten zusätzlich. */
const HIGHLIGHT_JOINTS: Record<BodyPart, (Joint | "torso")[]> = {
  legs: ["kneeF", "footF"],
  hips: ["hip"],
  arms: ["elbowF", "handF"],
  neck: ["neck"],
  head: ["head"],
  torso: ["torso"],
};
/** Gliedmaßen, die beim Highlight als Glow-Strich nachgezogen werden. */
const HIGHLIGHT_LIMBS: Partial<Record<BodyPart, (keyof typeof FIGHTER_PARTS)[]>> = {
  legs: ["legF", "legB"],
  arms: ["armF", "armB"],
};
/** Gelenke, die beim Atmen mitgehen (Hände bleiben am Griff). */
const BREATHE: ReadonlySet<Joint> = new Set(["head", "neck", "shoulderF", "shoulderB", "elbowF", "elbowB"]);

export interface FightersProps {
  pos: PositionId;
  top: Side | null;
  shake?: "x" | "y" | null;
  flash?: Side | null;
  className?: string;
  /** Leuchtring um das Körperteil, das den Schlagabtausch entschieden hat (pulsiert 2×, bleibt dann schwach sichtbar). */
  highlight?: FighterHighlight | null;
  /** Solange true: Springs laufen mit ~0.4× Steifigkeit (dramatischer Takedown). */
  slowmo?: boolean;
  /** Kamera-Punch-in: true → in 300 ms auf 1.12× zum Kontaktpunkt zoomen; false → zurück (350 ms). */
  zoom?: boolean;
  /** Ausholen vor dem Ergebnis: dieser Kämpfer lehnt sich ~6 px zum Gegner und geht leicht in die Knie. */
  windup?: Side | null;
  /** Griff-Marker (Glow-Punkt) an den Händen dieses Kämpfers, deren Griff in dieser Zone wirkt. */
  gripZone?: { side: Side; zone: string } | null;
  /** Laufende Aufgabe: Angreifer-Gliedmaßen schließen sich je Schritt enger um Arm/Hals. */
  sub?: SubPose | null;
  /** Tap-Moment: hold = Griff sitzt, tapping = Verteidiger klopft ab, release = Angreifer lässt sofort los. */
  tap?: TapState;
}

export function Fighters(props: FightersProps) {
  return <FightersScene {...props} />;
}

/** Wie FightersProps, aber `pos` darf jede Szene sein (inkl. Kern-2 "half"/"turtle"). */
export type FightersSceneProps = Omit<FightersProps, "pos"> & { pos: SceneId };

/** Gemeinsamer Renderer für das alte Spiel (Fighters) und Kern 2 (FightersK2). */
export function FightersScene({
  pos, top, shake = null, flash = null, className,
  highlight = null, slowmo = false, zoom = false, windup = null,
  gripZone = null, sub = null, tap = null,
}: FightersSceneProps) {
  const reduced = !!useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const subKey = sub ? `${sub.owner}:${sub.id}:${sub.zone}:${sub.step}` : "";
  const final = useMemo(() => finalPose(pos, top, sub, tap), [pos, top, subKey, tap]); // eslint-disable-line react-hooks/exhaustive-deps

  // Positionswechsel: 2 Zwischen-Keyframes (Takedown, Pass, Shrimp, Bridge, Stand-up), dann Zielpose.
  const [kf, setKf] = useState<Pair | null>(null);
  const prevScene = useRef({ pos, top });
  useLayoutEffect(() => {
    const pr = prevScene.current;
    prevScene.current = { pos, top };
    if (pr.pos === pos && pr.top === top) return;
    const { frames } = reduced ? { frames: [] as Pair[] } : moveKeyframes(pr.pos, pr.top, pos, top);
    if (!frames.length) { setKf(null); return; }
    const hold = slowmo ? 320 : 200;
    setKf(frames[0]);
    const ts = frames.slice(1).map((f, i) => setTimeout(() => setKf(f), hold * (i + 1)));
    ts.push(setTimeout(() => setKf(null), hold * frames.length));
    return () => ts.forEach(clearTimeout);
  }, [pos, top]); // eslint-disable-line react-hooks/exhaustive-deps
  const { p, o } = kf ?? final;
  const grips = useMemo(() => sceneGrips(pos, top), [pos, top]);

  // Abklopfen: freie Hand des Verteidigers geht 3× auf und ab, dann kurze Pause.
  const tapMv = useMotionValue(0);
  useEffect(() => {
    if (tap !== "tapping" || reduced) { tapMv.set(0); return; }
    const c = animate(tapMv, [0, 1, 0, 1, 0, 1, 0], { duration: 0.95, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.45 });
    return () => c.stop();
  }, [tap, reduced, tapMv]);
  const tapper: Side | null = sub && tap === "tapping" ? (sub.owner === "p" ? "o" : "p") : null;
  const tapJ = sub ? tapHand(sub) : null;

  // Atem-Oszillation (0 … 1.6 px), bei reduced motion aus.
  const breath = useMotionValue(0);
  useEffect(() => {
    if (reduced) { breath.set(0); return; }
    const c = animate(breath, [0, 1.6, 0], { duration: 2.5, ease: "easeInOut", repeat: Infinity });
    return () => c.stop();
  }, [reduced, breath]);

  const spring = slowmo && !reduced ? SPRING_SLOW : SPRING;
  const leanP = useSpring(0, LEAN_SPRING);
  const leanO = useSpring(0, LEAN_SPRING);
  useEffect(() => {
    const tp = windup === "p" && !reduced ? 1 : 0;
    const to = windup === "o" && !reduced ? 1 : 0;
    if (reduced) { leanP.jump(0); leanO.jump(0); return; }
    leanP.set(tp); leanO.set(to);
  }, [windup, reduced, leanP, leanO]);
  const dirP = Math.sign(o.hip.x - p.hip.x) || p.face;
  const dirO = Math.sign(p.hip.x - o.hip.x) || o.face;

  const P = useAnimatedFighter(p, breath, 0, reduced, spring, leanP, dirP, tapper === "p" ? tapJ : null, tapMv);
  const O = useAnimatedFighter(o, breath, 1, reduced, spring, leanO, dirO, tapper === "o" ? tapJ : null, tapMv);

  // Kamera-Punch-in Richtung Kontaktpunkt
  const camRef = useRef<SVGGElement>(null);
  const cam = useMotionValue(1);
  const focus = useMemo(() => contactPoint(pos, top), [pos, top]);
  useEffect(() => {
    const apply = (s: number) => {
      const el = camRef.current;
      if (!el) return;
      if (Math.abs(s - 1) < 1e-4) { el.removeAttribute("transform"); return; }
      // zoomt um den Kontaktpunkt, verschiebt ihn dabei leicht Richtung Bildmitte
      const t = (s - 1) / 0.12;
      const cx = focus.x, cy = focus.y;
      const sx = (200 - cx) * 0.25 * t, sy = (130 - cy) * 0.25 * t;
      el.setAttribute("transform", `translate(${r1(cx + sx)} ${r1(cy + sy)}) scale(${s.toFixed(4)}) translate(${-cx} ${-cy})`);
    };
    apply(cam.get());
    return cam.on("change", apply);
  }, [cam, focus]);
  useEffect(() => {
    if (reduced) { cam.jump(1); return; }
    const c = zoom
      ? animate(cam, 1.12, { duration: 0.3, ease: [0.2, 0.7, 0.2, 1] })
      : animate(cam, 1, { duration: 0.35, ease: [0.4, 0, 0.2, 1] });
    return () => c.stop();
  }, [zoom, reduced, cam]);

  // Szene schütteln
  const shakeCtl = useAnimationControls();
  useEffect(() => {
    if (!shake || reduced) return;
    const amp = shake === "x" ? 6 : 8;
    const seq = [0, amp, -amp * 0.75, amp * 0.5, -amp * 0.25, 0];
    void shakeCtl.start(shake === "x"
      ? { x: seq, transition: { duration: 0.25, ease: "easeOut" } }
      : { y: seq, transition: { duration: 0.25, ease: "easeOut" } });
  }, [shake, reduced, shakeCtl]);

  // Treffer-Flash
  const flashP = useAnimationControls();
  const flashO = useAnimationControls();
  useEffect(() => {
    if (!flash) return;
    const ctl = flash === "p" ? flashP : flashO;
    void ctl.start({
      filter: ["brightness(1)", "brightness(1.9)", "brightness(1)"],
      transition: { duration: reduced ? 0.15 : 0.35, ease: "easeOut" },
    });
  }, [flash, flashP, flashO, reduced]);

  const layers = layerOrder([{ key: "p" as const, z: p.z }, { key: "o" as const, z: o.z }]);
  const F = { p: P, o: O };
  // Glow-Marker: Hände mit Griff in der gespielten Zone; bei laufender Aufgabe die Hände des Angreifers.
  const markers: { side: Side; hand: "F" | "B"; grip: Grip | "sub" }[] = [];
  if (gripZone) {
    for (const h of ["F", "B"] as const) {
      const g = grips[gripZone.side][h];
      if (g && GRIP_ZONE[g] === gripZone.zone) markers.push({ side: gripZone.side, hand: h, grip: g });
    }
  }
  if (sub && sub.step > 0 && tap !== "release") {
    for (const h of ["F", "B"] as const) {
      if (!markers.some((m) => m.side === sub.owner && m.hand === h)) markers.push({ side: sub.owner, hand: h, grip: "sub" });
    }
  }

  return (
    <svg
      viewBox="0 0 400 220"
      className={className}
      role="img"
      aria-label={`Position: ${pos}`}
      style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}
    >
      <g ref={camRef}>
        <Mat uid={uid} />
        <motion.g animate={shakeCtl}>
          <Shadow f={P} />
          <Shadow f={O} />
          {layers.map((l, i) => (
            <motion.g key={i} animate={l.who === "p" ? flashP : flashO}>
              <FighterLayer f={F[l.who]} parts={l.parts} kit={KIT[l.who]} />
            </motion.g>
          ))}
          {markers.map((m) => (
            <GripMarker key={`${m.side}${m.hand}${m.grip}-${gripZone?.zone ?? ""}-${sub?.step ?? 0}`}
              f={F[m.side]} hand={m.hand} reduced={reduced} grad={`mk-grip-${uid}`} strong={m.grip === "sub" && (sub?.step ?? 0) >= 2} />
          ))}
          {markers.length > 0 && (
            <defs>
              <radialGradient id={`mk-grip-${uid}`}>
                <stop offset="0" stopColor="#fff6d6" stopOpacity="1" />
                <stop offset="0.35" stopColor="#ffd166" stopOpacity="0.85" />
                <stop offset="1" stopColor="#ffd166" stopOpacity="0" />
              </radialGradient>
            </defs>
          )}
          {highlight && (
            <Highlight
              key={`${highlight.side}-${highlight.part}`}
              f={F[highlight.side]} part={highlight.part} reduced={reduced}
              grad={`mk-hl-${uid}`} color={highlight.color ?? "var(--points, #ffd166)"}
            />
          )}
        </motion.g>
      </g>
    </svg>
  );
}

// ---------- animiertes Skelett ----------
interface AnimatedFighter {
  j: (k: Joint) => MotionValue<number>[];
  limb: (a: Joint, b: Joint, c: Joint) => MotionValue<string>;
  /** Teilstück: Gelenk a → Punkt bei t0…t1 entlang a→b (für Ärmel, Hosenbein). */
  seg: Record<string, MotionValue<string>>;
  torso: MotionValue<string>;
  waist: MotionValue<string>;
  seam: MotionValue<string>;
  head: { x: MotionValue<number>; y: MotionValue<number> };
  shadow: { cx: MotionValue<number>; rx: MotionValue<number> };
}

function useAnimatedFighter(
  pose: Pose, breath: MotionValue<number>, phase: number, reduced: boolean,
  spring: typeof SPRING, lean: MotionValue<number>, dir: number,
  tapJ: "F" | "B" | null, tapMv: MotionValue<number>,
): AnimatedFighter {
  const xsRaw: Record<string, MotionValue<number>> = {};
  const xs: Record<string, MotionValue<number>> = {};
  const ysRaw: Record<string, MotionValue<number>> = {};
  const ys: Record<string, MotionValue<number>> = {};
  const tapRef = useRef(tapJ);
  tapRef.current = tapJ;
  for (const j of JOINTS) {
    /* eslint-disable react-hooks/rules-of-hooks */
    xsRaw[j] = useSpring(pose[j].x, spring);
    ysRaw[j] = useSpring(pose[j].y, spring);
    const k = BREATHE.has(j) ? (j === "head" || j === "neck" ? 1 : 0.6) : 0;
    const [lx, ly] = LEAN[j];
    const rx = xsRaw[j];
    const raw = ysRaw[j];
    // Abklopfen: Hand hebt sich 16 px, Ellbogen halb so viel.
    const tapW = () => (tapRef.current && j === `hand${tapRef.current}` ? 16 : tapRef.current && j === `elbow${tapRef.current}` ? 6 : 0);
    xs[j] = useTransform(() => rx.get() + dir * LEAN_X * lx * lean.get());
    ys[j] = useTransform(() => raw.get() + LEAN_Y * ly * lean.get() - k * (phase ? breath.get() * 0.85 : breath.get()) - tapW() * tapMv.get());
    /* eslint-enable react-hooks/rules-of-hooks */
  }
  useEffect(() => {
    for (const j of JOINTS) {
      if (reduced) { xsRaw[j].jump(pose[j].x); ysRaw[j].jump(pose[j].y); }
      else { xsRaw[j].set(pose[j].x); ysRaw[j].set(pose[j].y); }
    }
  }, [pose]); // eslint-disable-line react-hooks/exhaustive-deps

  const P = (k: Joint): Pt => ({ x: xs[k].get(), y: ys[k].get() });
  const along = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const torso = useTransform(() => {
    const h = P("hip"), n = P("neck");
    const w = along(h, n, 0.16);
    return `M${r1(w.x)} ${r1(w.y)}L${r1(n.x)} ${r1(n.y)}`;
  });
  const waist = useTransform(() => {
    const h = P("hip"), n = P("neck");
    const w = along(h, n, 0.2);
    return `M${r1(h.x)} ${r1(h.y)}L${r1(w.x)} ${r1(w.y)}`;
  });
  // Seitennaht der Rashguard: farbiges Band leicht versetzt zur Rumpfmitte
  const seam = useTransform(() => {
    const h = P("hip"), n = P("neck");
    const dx = n.x - h.x, dy = n.y - h.y, l = Math.hypot(dx, dy) || 1;
    const ox = (-dy / l) * 6, oy = (dx / l) * 6;
    const a = along(h, n, 0.3), b = along(h, n, 0.86);
    return `M${r1(a.x + ox)} ${r1(a.y + oy)}L${r1(b.x + ox)} ${r1(b.y + oy)}`;
  });
  const armF = useTransform(() => lp(P("shoulderF"), P("elbowF"), P("handF")));
  const armB = useTransform(() => lp(P("shoulderB"), P("elbowB"), P("handB")));
  const legF = useTransform(() => lp(P("hip"), P("kneeF"), P("footF")));
  const legB = useTransform(() => lp(P("hip"), P("kneeB"), P("footB")));
  const sub = (a: Joint, b: Joint, t0: number, t1: number) => () => {
    const A = P(a), B = P(b);
    const u = along(A, B, t0), v = along(A, B, t1);
    return `M${r1(u.x)} ${r1(u.y)}L${r1(v.x)} ${r1(v.y)}`;
  };
  /* eslint-disable react-hooks/rules-of-hooks */
  const seg: Record<string, MotionValue<string>> = {
    sleeveF: useTransform(sub("shoulderF", "elbowF", 0, 0.72)),
    sleeveB: useTransform(sub("shoulderB", "elbowB", 0, 0.72)),
    cuffF: useTransform(sub("shoulderF", "elbowF", 0.6, 0.72)),
    cuffB: useTransform(sub("shoulderB", "elbowB", 0.6, 0.72)),
    shortsF: useTransform(sub("hip", "kneeF", 0, 0.66)),
    shortsB: useTransform(sub("hip", "kneeB", 0, 0.66)),
    hemF: useTransform(sub("hip", "kneeF", 0.56, 0.66)),
    hemB: useTransform(sub("hip", "kneeB", 0.56, 0.66)),
  };
  /* eslint-enable react-hooks/rules-of-hooks */
  const sh = useTransform(() => {
    const keys = JOINTS;
    return shadowOf(keys.map((k) => xs[k].get()), keys.map((k) => ysRaw[k].get()));
  });
  const cx = useTransform(() => sh.get().cx);
  const rx = useTransform(() => sh.get().rx);
  const limbs: Record<string, MotionValue<string>> = {
    "shoulderF,elbowF,handF": armF, "shoulderB,elbowB,handB": armB,
    "hip,kneeF,footF": legF, "hip,kneeB,footB": legB,
  };
  return {
    j: (k) => [xs[k], ys[k]],
    limb: (a, b, c) => limbs[`${a},${b},${c}`],
    seg, torso, waist, seam,
    head: { x: xs.head, y: ys.head },
    shadow: { cx, rx },
  };
}

const r1 = (v: number) => Math.round(v * 10) / 10;
const lp = (a: Pt, b: Pt, c: Pt) => `M${r1(a.x)} ${r1(a.y)}L${r1(b.x)} ${r1(b.y)}L${r1(c.x)} ${r1(c.y)}`;

/** No-Gi-Ausrüstung: Rashguard (Rumpf + kurze Ärmel mit Farbband) und Shorts; Haut neutral, Teamfarbe als Kontur. */
interface Kit { shirt: string; band: string; shorts: string; skin: string }
const KIT: Record<Side, Kit> = {
  p: { shirt: "var(--gi-p, #3E8BFF)", band: "var(--rash-band-p, #bcd7ff)", shorts: "var(--shorts-p, #142a63)", skin: "var(--skin, #d3b49b)" },
  o: { shirt: "var(--gi-o, #E5484D)", band: "var(--rash-band-o, #ffc2c3)", shorts: "var(--shorts-o, #5e141b)", skin: "var(--skin, #d3b49b)" },
};
const W = { rim: 14, skin: 9, sleeve: 16, shorts: 20, torso: 26, hand: 6.2 } as const;

function FighterLayer({ f, parts, kit }: { f: AnimatedFighter; parts: Part[]; kit: Kit }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {parts.map((part) => {
        if (part === "body") {
          return (
            <g key="body">
              <motion.path d={f.waist} stroke={kit.shorts} strokeWidth={W.torso + 1} />
              <motion.path d={f.torso} stroke={kit.shirt} strokeWidth={W.torso} />
              <motion.path d={f.seam} stroke={kit.band} strokeWidth={3.2} opacity={0.75} />
              {/* Kopf: neutral, ohne Gesicht – Teamfarbe als Kontur */}
              <motion.circle cx={f.head.x} cy={f.head.y} r={STROKE.head} fill={kit.skin} stroke={kit.shirt} strokeWidth={3} />
            </g>
          );
        }
        const far = part === "armB" || part === "legB";
        const arm = part === "armF" || part === "armB";
        const s = part.endsWith("F") ? "F" : "B";
        const [a, b, c] = FIGHTER_PARTS[part];
        const [hx, hy] = f.j(c);
        return (
          <g key={part}>
            <motion.path d={f.limb(a, b, c)} stroke={kit.shirt} strokeWidth={W.rim} />
            <motion.path d={f.limb(a, b, c)} stroke={kit.skin} strokeWidth={W.skin} />
            {arm ? (
              <>
                <motion.path d={f.seg[`sleeve${s}`]} stroke={kit.shirt} strokeWidth={W.sleeve} />
                <motion.path d={f.seg[`cuff${s}`]} stroke={kit.band} strokeWidth={W.sleeve - 2} strokeLinecap="butt" />
                <motion.circle cx={hx} cy={hy} r={W.hand} fill={kit.skin} stroke={kit.shirt} strokeWidth={2.5} />
              </>
            ) : (
              <>
                <motion.path d={f.seg[`shorts${s}`]} stroke={kit.shorts} strokeWidth={W.shorts} />
                <motion.path d={f.seg[`hem${s}`]} stroke={kit.shirt} strokeWidth={W.shorts - 3} strokeLinecap="butt" />
              </>
            )}
            {far && (
              <>
                <motion.path d={f.limb(a, b, c)} stroke="#000" strokeOpacity={0.3} strokeWidth={W.rim} />
                <motion.path d={f.seg[arm ? `sleeve${s}` : `shorts${s}`]} stroke="#000" strokeOpacity={0.3} strokeWidth={arm ? W.sleeve : W.shorts} />
              </>
            )}
          </g>
        );
      })}
    </g>
  );
}

/** Griff-Marker: Glow-Punkt an der greifenden Hand (pulsiert 2×, bleibt dann sichtbar). */
function GripMarker({ f, hand, reduced, grad, strong }: {
  f: AnimatedFighter; hand: "F" | "B"; reduced: boolean; grad: string; strong: boolean;
}) {
  const [cx, cy] = f.j(`hand${hand}`);
  const R = strong ? 13 : 10;
  if (reduced) return <motion.circle cx={cx} cy={cy} r={R} fill={`url(#${grad})`} opacity={0.8} style={{ pointerEvents: "none" }} />;
  return (
    <motion.circle cx={cx} cy={cy} fill={`url(#${grad})`} style={{ pointerEvents: "none", mixBlendMode: "screen" }}
      initial={{ r: R * 0.4, opacity: 0 }}
      animate={{ r: [R * 0.4, R * 1.5, R, R * 1.5, R], opacity: [0, 1, 0.7, 1, 0.85] }}
      transition={{ duration: 1.2, ease: "easeOut" }} />
  );
}

/** Leuchtring + weicher Glow an den Gelenken des entscheidenden Körperteils. Folgt den Springs. */
function Highlight({ f, part, reduced, grad, color }: {
  f: AnimatedFighter; part: BodyPart; reduced: boolean; grad: string; color: string;
}) {
  const spots = HIGHLIGHT_JOINTS[part];
  return (
    <g style={{ color, pointerEvents: "none" }} className="mk-highlight" aria-hidden>
      <defs>
        {/* Stop-Farben explizit (currentColor würde im <defs>-Kontext aufgelöst) */}
        <radialGradient id={grad}>
          <stop offset="0" stopColor={color} stopOpacity="0.85" />
          <stop offset="0.45" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      {(HIGHLIGHT_LIMBS[part] ?? []).map((l) => {
        const [a, b, c] = FIGHTER_PARTS[l];
        return (
          <motion.path key={l} d={f.limb(a, b, c)} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round"
            strokeWidth={STROKE.limb + 8}
            style={{ mixBlendMode: "screen" }}
            initial={{ opacity: 0 }}
            animate={reduced ? { opacity: 0.35 } : { opacity: [0, 0.6, 0.2, 0.6, 0.28] }}
            transition={reduced ? { duration: 0 } : { duration: 1.5, times: [0, 0.22, 0.45, 0.67, 1], ease: "easeOut" }} />
        );
      })}
      {spots.map((s) => <HighlightSpot key={s} f={f} spot={s} reduced={reduced} grad={grad} big={s === "torso" || s === "hip" || s === "head"} />)}
    </g>
  );
}

function HighlightSpot({ f, spot, reduced, grad, big }: {
  f: AnimatedFighter; spot: Joint | "torso"; reduced: boolean; grad: string; big: boolean;
}) {
  const [hx, hy] = f.j("hip");
  const [nx, ny] = f.j("neck");
  const [jx, jy] = spot === "torso" ? [hx, hy] : f.j(spot);
  const cx = useTransform(() => (spot === "torso" ? (hx.get() + nx.get()) / 2 : jx.get()));
  const cy = useTransform(() => (spot === "torso" ? (hy.get() + ny.get()) / 2 : jy.get()));
  const R = big ? 20 : 14;
  if (reduced) {
    return (
      <g>
        <motion.circle cx={cx} cy={cy} r={R * 1.5} fill={`url(#${grad})`} opacity={0.55} />
        <motion.circle cx={cx} cy={cy} r={R} fill="none" stroke="currentColor" strokeWidth={2.5} opacity={0.8} />
      </g>
    );
  }
  const T = { duration: 1.5, times: [0, 0.22, 0.45, 0.67, 1], ease: "easeOut" as const };
  return (
    <g>
      <motion.circle cx={cx} cy={cy} fill={`url(#${grad})`}
        initial={{ r: R * 0.6, opacity: 0 }}
        animate={{ r: [R * 0.6, R * 1.9, R * 1.3, R * 1.9, R * 1.5], opacity: [0, 0.95, 0.45, 0.95, 0.5] }}
        transition={T} />
      <motion.circle cx={cx} cy={cy} fill="none" stroke="currentColor" strokeWidth={3}
        initial={{ r: R * 0.7, opacity: 0 }}
        animate={{ r: [R * 0.7, R * 1.8, R * 0.8, R * 1.8, R], opacity: [1, 0, 1, 0, 0.55] }}
        transition={T} />
      <motion.circle cx={cx} cy={cy} r={3} fill="#fff"
        initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.6] }} transition={{ duration: 0.6 }} />
    </g>
  );
}

function Shadow({ f }: { f: AnimatedFighter }) {
  return <motion.ellipse cx={f.shadow.cx} cy={MAT_Y + 3} rx={f.shadow.rx} ry={6} fill="#000" opacity={0.28} />;
}

function Mat({ uid }: { uid: string }) {
  const g = `mk-mat-${uid}`;
  const fade = `mk-fade-${uid}`;
  // Perspektivlinien laufen zu einem Fluchtpunkt weit über der Szene.
  const vx = 200, vy = -260;
  const lines = [-3, -2, -1, 0, 1, 2, 3].map((i) => {
    const bx = 200 + i * 120;
    const t = (172 - vy) / (220 - vy);
    return { x1: vx + (bx - vx) * t, y1: 172, x2: bx, y2: 220 };
  });
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--mat-b, #0e2655)" />
          <stop offset="1" stopColor="var(--mat-a, #14336f)" />
        </linearGradient>
        <linearGradient id={fade} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.35" />
          <stop offset="0.18" stopColor="#000" stopOpacity="0" />
          <stop offset="0.82" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      {/* hinterer Streifen (Zone B) und vorderer Streifen (Zone A) */}
      <rect x="-40" y="172" width="480" height="18" fill="var(--mat-b, #0e2655)" />
      <rect x="-40" y={MAT_Y} width="480" height="40" fill={`url(#${g})`} />
      <rect x="-40" y={MAT_Y} width="480" height="40" fill="var(--mat-a, #14336f)" opacity={0.55} />
      <g stroke="var(--mat-line, #2b4f99)" strokeWidth={1} opacity={0.45}>
        {lines.map((l, i) => <line key={i} {...l} />)}
        <line x1="-40" y1={MAT_Y} x2="440" y2={MAT_Y} strokeWidth={1.5} opacity={0.9} />
        <line x1="-40" y1="206" x2="440" y2="206" opacity={0.5} />
      </g>
      <rect x="-40" y="172" width="480" height="58" fill={`url(#${fade})`} />
    </g>
  );
}
