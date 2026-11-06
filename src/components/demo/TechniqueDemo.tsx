import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { CARD } from "../../data/cards";
import type { Side } from "../../engine/types";
import {
  FIGHTER_PARTS, JOINTS, MAT_Y, STROKE, beltPath, layerOrder, limbPath, segPath,
  type Joint, type Part, type Pose,
} from "../fighters/poses";
import { DEMOS, hasDemo, type DemoFrame } from "./sequences";

/** Basistakt pro Schritt (ms), Zeitlupe ×2.2. */
const STEP_MS = 900;
const SLOW_FACTOR = 2.2;
const SPRING = { type: "spring" as const, stiffness: 120, damping: 19, mass: 1 };
/** Gleiches Dämpfungsverhältnis, nur langsamer (Steifigkeit / 2.2², Dämpfung / 2.2). */
const SPRING_SLOW = { type: "spring" as const, stiffness: 120 / (SLOW_FACTOR * SLOW_FACTOR), damping: 19 / SLOW_FACTOR, mass: 1 };

const COLORS: Record<Side, string> = { p: "var(--gi-p, #3E8BFF)", o: "var(--gi-o, #E5484D)" };
const FOCUS_COLOR = "var(--points, #ffd166)";

interface Step { p: Pose; o: Pose; caption: string; focus?: Joint[]; focusSide?: Side; hold?: number }

export interface TechniqueDemoProps {
  cardId: string;
  /** Startet automatisch (Standard true; bei reduced motion immer aus). */
  autoPlay?: boolean;
  onClose?: () => void;
  /** Startschritt (0 = Ausgangslage). */
  initialStep?: number;
  className?: string;
}

export function TechniqueDemo({ cardId, autoPlay = true, onClose, initialStep = 0, className }: TechniqueDemoProps) {
  const reduced = !!useReducedMotion();
  const seq = DEMOS[cardId];
  const steps: Step[] = useMemo(
    () => (seq ? [{ ...seq.start }, ...seq.frames.map((f: DemoFrame) => f)] : []),
    [seq],
  );
  const last = Math.max(0, steps.length - 1);
  const [idx, setIdx] = useState(() => Math.min(Math.max(0, initialStep), last));
  const [playing, setPlaying] = useState(autoPlay && !reduced);
  const [slow, setSlow] = useState(false);

  useEffect(() => { if (reduced) setPlaying(false); }, [reduced]);

  // Auto-Advance
  useEffect(() => {
    if (!playing || reduced) return;
    if (idx >= last) { setPlaying(false); return; }
    const hold = (steps[idx]?.hold ?? 1) * (idx === 0 ? 0.8 : 1);
    const t = window.setTimeout(() => setIdx((i) => Math.min(last, i + 1)), STEP_MS * hold * (slow ? SLOW_FACTOR : 1));
    return () => window.clearTimeout(t);
  }, [playing, idx, last, slow, reduced, steps]);

  const go = useCallback((i: number) => { setPlaying(false); setIdx(Math.min(last, Math.max(0, i))); }, [last]);
  const replay = useCallback(() => { setIdx(0); setPlaying(!reduced); }, [reduced]);
  const togglePlay = useCallback(() => {
    if (idx >= last) { replay(); return; }
    setPlaying((p) => !p);
  }, [idx, last, replay]);

  // Tastatur: ←/→ Schritt, Leertaste Play/Pause, Esc schließen
  const rootRef = useRef<HTMLDivElement>(null);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(idx + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
    else if (e.key === " " && !reduced) { e.preventDefault(); togglePlay(); }
    else if (e.key === "Escape" && onClose) { e.preventDefault(); onClose(); }
  };

  if (!seq) return null;
  const step = steps[idx];
  const card = CARD[cardId];
  const isEnd = idx >= last;

  return (
    <div
      ref={rootRef}
      className={`dm-demo${reduced ? " dm-reduced" : ""}${className ? ` ${className}` : ""}`}
      role="group"
      aria-roledescription="Technik-Demo"
      aria-label={`So geht's: ${seq.title ?? card?.name ?? cardId}`}
      tabIndex={-1}
      onKeyDown={onKey}
    >
      <header className="dm-head">
        <div className="dm-titles">
          <span className="dm-kicker">So geht's</span>
          <h3 className="dm-title">{seq.title ?? card?.name ?? cardId}</h3>
          {(seq.sub ?? card?.de) && <span className="dm-sub">{seq.sub ?? card?.de}</span>}
        </div>
        {onClose && (
          <button type="button" className="dm-close" onClick={onClose} aria-label="Demo schließen">
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
          </button>
        )}
      </header>

      <div className="dm-stage">
        <DemoStage step={step} reduced={reduced} slow={slow} solo={!!seq.solo} />
        {slow && !reduced && <span className="dm-slowtag" aria-hidden>Zeitlupe</span>}
      </div>

      <div className="dm-caption" aria-live="polite">
        <motion.p
          key={idx}
          className={`dm-caption-text${idx === 0 ? " is-start" : ""}${isEnd ? " is-end" : ""}`}
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
        >
          {step.caption}
        </motion.p>
      </div>

      <div className="dm-dots" role="tablist" aria-label="Schritte">
        {steps.map((s, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === idx}
            aria-label={i === 0 ? `Ausgangslage: ${s.caption}` : s.caption}
            className={`dm-dot${i === idx ? " is-on" : ""}${i < idx ? " is-done" : ""}${i === 0 ? " is-start" : ""}`}
            onClick={() => go(i)}
          />
        ))}
      </div>

      <div className="dm-controls">
        <button type="button" className="dm-ctl" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="Schritt zurück">
          <Icon d="M12.5 4.5L7 10l5.5 5.5" />
        </button>
        {!reduced && (
          <button type="button" className="dm-ctl dm-ctl-main" onClick={togglePlay}
            aria-label={isEnd ? "Nochmal abspielen" : playing ? "Pause" : "Abspielen"}>
            {isEnd ? <Icon d="M4.5 10a5.5 5.5 0 1 0 1.8-4.1M4.5 3.8v3.6h3.6" /> : playing
              ? <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden><rect x="5.5" y="4.5" width="3" height="11" rx="1" fill="currentColor" /><rect x="11.5" y="4.5" width="3" height="11" rx="1" fill="currentColor" /></svg>
              : <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden><path d="M6.5 4.3v11.4L15.5 10z" fill="currentColor" /></svg>}
          </button>
        )}
        <button type="button" className="dm-ctl" onClick={() => go(idx + 1)} disabled={isEnd} aria-label="Nächster Schritt">
          <Icon d="M7.5 4.5L13 10l-5.5 5.5" />
        </button>
        {!reduced && (
          <>
            <span className="dm-ctl-gap" />
            <button type="button" className="dm-ctl" onClick={replay} aria-label="Von vorn">
              <Icon d="M4.5 10a5.5 5.5 0 1 0 1.8-4.1M4.5 3.8v3.6h3.6" />
            </button>
            <button type="button" className={`dm-ctl dm-slow${slow ? " is-on" : ""}`} onClick={() => setSlow((s) => !s)}
              aria-pressed={slow} aria-label="Zeitlupe">
              <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="10" cy="10.5" r="6" /><path d="M10 7.5v3.2l2 1.3M8 2.8h4" />
              </svg>
              <span className="dm-slow-label">0.5×</span>
            </button>
          </>
        )}
      </div>
      <p className="dm-count" aria-hidden>{idx === 0 ? "Start" : `Schritt ${idx} / ${last}`}</p>
    </div>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

// ---------------- Bühne ----------------

function DemoStage({ step, reduced, slow, solo = false }: { step: Step; reduced: boolean; slow: boolean; solo?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const cfg = slow ? SPRING_SLOW : SPRING;
  const P = useSpringPose(step.p, reduced, cfg);
  const O = useSpringPose(step.o, reduced, cfg);
  const F = { p: P, o: O };
  // Kleiner Bias, damit der Spieler bei Gleichstand vorn liegt.
  // Solo-Drill: nur der blaue Kämpfer.
  const layers = layerOrder([{ key: "p" as const, z: step.p.z + 0.01 }, { key: "o" as const, z: step.o.z }]).filter((l) => !solo || l.who === "p");
  const focusSide: Side = step.focusSide ?? "p";
  const focus = step.focus ?? [];
  const focusKey = `${step.caption}|${focusSide}|${focus.join(",")}`;

  return (
    <svg viewBox="20 20 360 200" className="dm-svg" role="img" aria-label={step.caption}>
      <DemoMat uid={uid} />
      <Shadow f={P} />
      {!solo && <Shadow f={O} />}
      {layers.map((l, i) => (
        <g key={i} fill="none" strokeLinecap="round" strokeLinejoin="round">
          {l.parts.map((part) => <PartPath key={part} f={F[l.who]} part={part} color={COLORS[l.who]} />)}
        </g>
      ))}
      {focus.length > 0 && <FocusMarks key={focusKey} f={F[focusSide]} joints={focus} reduced={reduced} />}
    </svg>
  );
}

interface SpringPose {
  x: Record<Joint, MotionValue<number>>;
  y: Record<Joint, MotionValue<number>>;
  path: (part: Exclude<Part, "body">) => MotionValue<string>;
  torso: MotionValue<string>;
  belt: MotionValue<string>;
  shadowCx: MotionValue<number>;
  shadowRx: MotionValue<number>;
}

function useSpringPose(pose: Pose, reduced: boolean, cfg: typeof SPRING): SpringPose {
  const x = {} as Record<Joint, MotionValue<number>>;
  const y = {} as Record<Joint, MotionValue<number>>;
  for (const j of JOINTS) {
    /* eslint-disable react-hooks/rules-of-hooks */
    x[j] = useMotionValue(pose[j].x);
    y[j] = useMotionValue(pose[j].y);
    /* eslint-enable react-hooks/rules-of-hooks */
  }
  useEffect(() => {
    const ctl: { stop: () => void }[] = [];
    for (const j of JOINTS) {
      if (reduced) { x[j].jump(pose[j].x); y[j].jump(pose[j].y); continue; }
      ctl.push(animate(x[j], pose[j].x, cfg), animate(y[j], pose[j].y, cfg));
    }
    return () => ctl.forEach((c) => c.stop());
  }, [pose, reduced, cfg]); // eslint-disable-line react-hooks/exhaustive-deps

  const g = (j: Joint) => ({ x: r1(x[j].get()), y: r1(y[j].get()) });
  const armF = useTransform(() => limbPath(g("shoulderF"), g("elbowF"), g("handF")));
  const armB = useTransform(() => limbPath(g("shoulderB"), g("elbowB"), g("handB")));
  const legF = useTransform(() => limbPath(g("hip"), g("kneeF"), g("footF")));
  const legB = useTransform(() => limbPath(g("hip"), g("kneeB"), g("footB")));
  const torso = useTransform(() => segPath(g("hip"), g("neck")));
  const belt = useTransform(() => beltPath(g("hip"), g("neck")));
  const shadowCx = useTransform(() => {
    const xs = JOINTS.filter((j) => y[j].get() > MAT_Y - 45).map((j) => x[j].get());
    const all = xs.length ? xs : JOINTS.map((j) => x[j].get());
    return r1((Math.min(...all) + Math.max(...all)) / 2);
  });
  const shadowRx = useTransform(() => {
    const xs = JOINTS.filter((j) => y[j].get() > MAT_Y - 45).map((j) => x[j].get());
    const all = xs.length ? xs : JOINTS.map((j) => x[j].get());
    return r1(Math.max(22, (Math.max(...all) - Math.min(...all)) / 2 + 12));
  });
  const paths = { armF, armB, legF, legB };
  return { x, y, path: (p) => paths[p], torso, belt, shadowCx, shadowRx };
}

const r1 = (v: number) => Math.round(v * 10) / 10;

function PartPath({ f, part, color }: { f: SpringPose; part: Part; color: string }) {
  if (part === "body") {
    return (
      <g>
        <motion.path d={f.torso} stroke={color} strokeWidth={STROKE.torso} />
        <motion.path d={f.belt} stroke="var(--belt, #12141c)" strokeWidth={STROKE.belt} opacity={0.85} />
        <motion.circle cx={f.x.head} cy={f.y.head} r={STROKE.head} fill={color} stroke="none" />
      </g>
    );
  }
  const far = part === "armB" || part === "legB";
  return (
    <g>
      <motion.path d={f.path(part)} stroke={color} strokeWidth={STROKE.limb} />
      {far && <motion.path d={f.path(part)} stroke="#000" strokeOpacity={0.32} strokeWidth={STROKE.limb} />}
    </g>
  );
}

/** Welche Gliedmaße ein Fokus-Gelenk zum Leuchten bringt. */
const LIMB_OF: Partial<Record<Joint, Exclude<Part, "body">>> = {
  elbowF: "armF", handF: "armF", elbowB: "armB", handB: "armB",
  kneeF: "legF", footF: "legF", kneeB: "legB", footB: "legB",
};

function FocusMarks({ f, joints, reduced }: { f: SpringPose; joints: Joint[]; reduced: boolean }) {
  const limbs = [...new Set(joints.map((j) => LIMB_OF[j]).filter(Boolean))] as Exclude<Part, "body">[];
  return (
    <g className="dm-focus" aria-hidden style={{ pointerEvents: "none" }}>
      {limbs.map((l) => (
        <motion.path key={l} d={f.path(l)} fill="none" stroke={FOCUS_COLOR} strokeLinecap="round" strokeLinejoin="round"
          strokeWidth={STROKE.limb + 7}
          style={{ mixBlendMode: "screen" }}
          initial={{ opacity: 0 }}
          animate={reduced ? { opacity: 0.4 } : { opacity: [0, 0.55, 0.3] }}
          transition={reduced ? { duration: 0 } : { duration: 0.9, delay: 0.25, ease: "easeOut" }} />
      ))}
      {joints.map((j) => <FocusRing key={j} f={f} j={j} reduced={reduced} big={j === "hip" || j === "head" || j === "neck"} />)}
    </g>
  );
}

function FocusRing({ f, j, reduced, big }: { f: SpringPose; j: Joint; reduced: boolean; big: boolean }) {
  const R = big ? 17 : 12;
  if (reduced) {
    return <motion.circle cx={f.x[j]} cy={f.y[j]} r={R} fill="none" stroke={FOCUS_COLOR} strokeWidth={2.5} opacity={0.9} />;
  }
  return (
    <g>
      <motion.circle cx={f.x[j]} cy={f.y[j]} fill="none" stroke={FOCUS_COLOR} strokeWidth={2.5}
        initial={{ r: R * 1.8, opacity: 0 }}
        animate={{ r: [R * 1.8, R, R * 1.15, R], opacity: [0, 1, 0.85, 0.9] }}
        transition={{ duration: 0.8, delay: 0.2, times: [0, 0.45, 0.7, 1], ease: "easeOut" }} />
      <motion.circle cx={f.x[j]} cy={f.y[j]} r={2.6} fill="#fff"
        initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.7] }} transition={{ duration: 0.5, delay: 0.3 }} />
    </g>
  );
}

function Shadow({ f }: { f: SpringPose }) {
  return <motion.ellipse cx={f.shadowCx} cy={MAT_Y + 3} rx={f.shadowRx} ry={6} fill="#000" opacity={0.28} />;
}

function DemoMat({ uid }: { uid: string }) {
  const g = `dm-mat-${uid}`;
  return (
    <g aria-hidden>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--mat-b, #0e2655)" />
          <stop offset="1" stopColor="var(--mat-a, #14336f)" />
        </linearGradient>
      </defs>
      <rect x="0" y="172" width="400" height="18" fill="var(--mat-b, #0e2655)" />
      <rect x="0" y={MAT_Y} width="400" height="40" fill={`url(#${g})`} />
      <line x1="0" y1={MAT_Y} x2="400" y2={MAT_Y} stroke="var(--mat-line, #2b4f99)" strokeWidth={1.5} opacity={0.8} />
      <line x1="0" y1="206" x2="400" y2="206" stroke="var(--mat-line, #2b4f99)" strokeWidth={1} opacity={0.3} />
    </g>
  );
}

// ---------------- Button ----------------

export interface DemoButtonProps {
  cardId: string;
  onOpen: (cardId: string) => void;
  className?: string;
}

/** Kleiner "So geht's ▶"-Button; rendert nichts, wenn es für die Karte keine Demo gibt. */
export function DemoButton({ cardId, onOpen, className }: DemoButtonProps) {
  if (!hasDemo(cardId)) return null;
  return (
    <button
      type="button"
      className={`dm-btn${className ? ` ${className}` : ""}`}
      onClick={(e) => { e.stopPropagation(); onOpen(cardId); }}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={`So geht's: ${CARD[cardId]?.name ?? cardId} als Animation ansehen`}
    >
      <span>So geht's</span>
      <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden><path d="M3 1.8v8.4L10 6z" fill="currentColor" /></svg>
    </button>
  );
}
