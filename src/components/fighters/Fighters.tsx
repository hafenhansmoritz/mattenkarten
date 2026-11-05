import { useEffect, useId, useMemo } from "react";
import {
  animate, motion, useAnimationControls, useMotionValue, useReducedMotion, useSpring, useTransform,
  type MotionValue,
} from "framer-motion";
import type { PositionId, Side } from "../../engine/types";
import {
  FIGHTER_PARTS, JOINTS, MAT_Y, STROKE, beltPath, layerOrder, scenePose, shadowOf,
  type Joint, type Part, type Pose, type Pt,
} from "./poses";

const SPRING = { stiffness: 140, damping: 18, mass: 1 };
/** Gelenke, die beim Atmen mitgehen (Hände bleiben am Griff). */
const BREATHE: ReadonlySet<Joint> = new Set(["head", "neck", "shoulderF", "shoulderB", "elbowF", "elbowB"]);

export interface FightersProps {
  pos: PositionId;
  top: Side | null;
  shake?: "x" | "y" | null;
  flash?: Side | null;
  className?: string;
}

export function Fighters({ pos, top, shake = null, flash = null, className }: FightersProps) {
  const reduced = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const { p, o } = useMemo(() => scenePose(pos, top), [pos, top]);

  // Atem-Oszillation (0 … 1.6 px), bei reduced motion aus.
  const breath = useMotionValue(0);
  useEffect(() => {
    if (reduced) { breath.set(0); return; }
    const c = animate(breath, [0, 1.6, 0], { duration: 2.5, ease: "easeInOut", repeat: Infinity });
    return () => c.stop();
  }, [reduced, breath]);

  const P = useAnimatedFighter(p, breath, 0, !!reduced);
  const O = useAnimatedFighter(o, breath, 1, !!reduced);

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
  const colors = {
    p: "var(--gi-p, #3E8BFF)",
    o: "var(--gi-o, #E5484D)",
  };

  return (
    <svg
      viewBox="0 0 400 220"
      className={className}
      role="img"
      aria-label={`Position: ${pos}`}
      style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}
    >
      <Mat uid={uid} />
      <motion.g animate={shakeCtl}>
        <Shadow f={P} />
        <Shadow f={O} />
        {layers.map((l, i) => (
          <motion.g key={i} animate={l.who === "p" ? flashP : flashO}>
            <FighterLayer f={F[l.who]} parts={l.parts} color={colors[l.who]} />
          </motion.g>
        ))}
      </motion.g>
    </svg>
  );
}

// ---------- animiertes Skelett ----------
interface AnimatedFighter {
  j: (k: Joint) => MotionValue<number>[];
  limb: (a: Joint, b: Joint, c: Joint) => MotionValue<string>;
  torso: MotionValue<string>;
  belt: MotionValue<string>;
  head: { x: MotionValue<number>; y: MotionValue<number> };
  shadow: { cx: MotionValue<number>; rx: MotionValue<number> };
}

function useAnimatedFighter(pose: Pose, breath: MotionValue<number>, phase: number, reduced: boolean): AnimatedFighter {
  const xs: Record<string, MotionValue<number>> = {};
  const ysRaw: Record<string, MotionValue<number>> = {};
  const ys: Record<string, MotionValue<number>> = {};
  for (const j of JOINTS) {
    /* eslint-disable react-hooks/rules-of-hooks */
    xs[j] = useSpring(pose[j].x, SPRING);
    ysRaw[j] = useSpring(pose[j].y, SPRING);
    const k = BREATHE.has(j) ? (j === "head" || j === "neck" ? 1 : 0.6) : 0;
    const raw = ysRaw[j];
    ys[j] = useTransform(() => raw.get() - k * (phase ? breath.get() * 0.85 : breath.get()));
    /* eslint-enable react-hooks/rules-of-hooks */
  }
  useEffect(() => {
    for (const j of JOINTS) {
      if (reduced) { xs[j].jump(pose[j].x); ysRaw[j].jump(pose[j].y); }
      else { xs[j].set(pose[j].x); ysRaw[j].set(pose[j].y); }
    }
  }, [pose]); // eslint-disable-line react-hooks/exhaustive-deps

  const P = (k: Joint): Pt => ({ x: xs[k].get(), y: ys[k].get() });
  const torso = useTransform(() => {
    const h = P("hip"), n = P("neck");
    return `M${h.x} ${h.y}L${n.x} ${n.y}`;
  });
  const belt = useTransform(() => beltPath(P("hip"), P("neck")));
  const armF = useTransform(() => lp(P("shoulderF"), P("elbowF"), P("handF")));
  const armB = useTransform(() => lp(P("shoulderB"), P("elbowB"), P("handB")));
  const legF = useTransform(() => lp(P("hip"), P("kneeF"), P("footF")));
  const legB = useTransform(() => lp(P("hip"), P("kneeB"), P("footB")));
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
    torso, belt,
    head: { x: xs.head, y: ys.head },
    shadow: { cx, rx },
  };
}

const r1 = (v: number) => Math.round(v * 10) / 10;
const lp = (a: Pt, b: Pt, c: Pt) => `M${r1(a.x)} ${r1(a.y)}L${r1(b.x)} ${r1(b.y)}L${r1(c.x)} ${r1(c.y)}`;

function FighterLayer({ f, parts, color }: { f: AnimatedFighter; parts: Part[]; color: string }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {parts.map((part) => {
        if (part === "body") {
          return (
            <g key="body">
              <motion.path d={f.torso} stroke={color} strokeWidth={STROKE.torso} />
              <motion.path d={f.belt} stroke="var(--belt, #12141c)" strokeWidth={STROKE.belt} opacity={0.85} />
              <motion.circle cx={f.head.x} cy={f.head.y} r={STROKE.head} fill={color} stroke="none" />
            </g>
          );
        }
        const far = part === "armB" || part === "legB";
        const [a, b, c] = FIGHTER_PARTS[part];
        return (
          <g key={part}>
            <motion.path d={f.limb(a, b, c)} stroke={color} strokeWidth={STROKE.limb} />
            {far && (
              <motion.path d={f.limb(a, b, c)} stroke="#000" strokeOpacity={0.32} strokeWidth={STROKE.limb} />
            )}
          </g>
        );
      })}
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
