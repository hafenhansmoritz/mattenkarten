import { useEffect, useId, useMemo, useRef } from "react";
import {
  animate, motion, useAnimationControls, useMotionValue, useReducedMotion, useSpring, useTransform,
  type MotionValue,
} from "framer-motion";
import type { PositionId, Side } from "../../engine/types";
import {
  FIGHTER_PARTS, JOINTS, MAT_Y, STROKE, beltPath, contactPoint, layerOrder, scenePose, shadowOf,
  type Joint, type Part, type Pose, type Pt,
} from "./poses";

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
}

export function Fighters({
  pos, top, shake = null, flash = null, className,
  highlight = null, slowmo = false, zoom = false, windup = null,
}: FightersProps) {
  const reduced = !!useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const { p, o } = useMemo(() => scenePose(pos, top), [pos, top]);

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

  const P = useAnimatedFighter(p, breath, 0, reduced, spring, leanP, dirP);
  const O = useAnimatedFighter(o, breath, 1, reduced, spring, leanO, dirO);

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
      <g ref={camRef}>
        <Mat uid={uid} />
        <motion.g animate={shakeCtl}>
          <Shadow f={P} />
          <Shadow f={O} />
          {layers.map((l, i) => (
            <motion.g key={i} animate={l.who === "p" ? flashP : flashO}>
              <FighterLayer f={F[l.who]} parts={l.parts} color={colors[l.who]} />
            </motion.g>
          ))}
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
  torso: MotionValue<string>;
  belt: MotionValue<string>;
  head: { x: MotionValue<number>; y: MotionValue<number> };
  shadow: { cx: MotionValue<number>; rx: MotionValue<number> };
}

function useAnimatedFighter(
  pose: Pose, breath: MotionValue<number>, phase: number, reduced: boolean,
  spring: typeof SPRING, lean: MotionValue<number>, dir: number,
): AnimatedFighter {
  const xsRaw: Record<string, MotionValue<number>> = {};
  const xs: Record<string, MotionValue<number>> = {};
  const ysRaw: Record<string, MotionValue<number>> = {};
  const ys: Record<string, MotionValue<number>> = {};
  for (const j of JOINTS) {
    /* eslint-disable react-hooks/rules-of-hooks */
    xsRaw[j] = useSpring(pose[j].x, spring);
    ysRaw[j] = useSpring(pose[j].y, spring);
    const k = BREATHE.has(j) ? (j === "head" || j === "neck" ? 1 : 0.6) : 0;
    const [lx, ly] = LEAN[j];
    const rx = xsRaw[j];
    const raw = ysRaw[j];
    xs[j] = useTransform(() => rx.get() + dir * LEAN_X * lx * lean.get());
    ys[j] = useTransform(() => raw.get() + LEAN_Y * ly * lean.get() - k * (phase ? breath.get() * 0.85 : breath.get()));
    /* eslint-enable react-hooks/rules-of-hooks */
  }
  useEffect(() => {
    for (const j of JOINTS) {
      if (reduced) { xsRaw[j].jump(pose[j].x); ysRaw[j].jump(pose[j].y); }
      else { xsRaw[j].set(pose[j].x); ysRaw[j].set(pose[j].y); }
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
