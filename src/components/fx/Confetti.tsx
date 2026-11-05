import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

export interface ConfettiProps {
  /** Auf true setzen (oder Zahl hochzählen), um eine Salve auszulösen. */
  run: boolean | number;
  /** Anzahl Teilchen (≤ 120). */
  count?: number;
  /** Farben; Standard: Gürtel-/Theme-Farben. */
  colors?: string[];
  onDone?: () => void;
}

const DUR = 1600;

function themeColors(el: HTMLElement): string[] {
  const cs = getComputedStyle(el);
  const v = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
  return [v("--points", "#ffd166"), v("--gi-p", "#3e8bff"), v("--gas", "#5fe3b4"), v("--k-angriff", "#f0573f"), "#ffffff", v("--r-episch-a", "#c4b5fd")];
}

/** Leichtgewichtiges Canvas-Konfetti (≤ 120 Teilchen, 1.6 s) für Siege und Gürtel-Beförderungen. */
export function Confetti({ run, count = 110, colors, onDone }: ConfettiProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = !!useReducedMotion();
  useEffect(() => {
    if (!run || reduced) { if (run) onDone?.(); return; }
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = cv.clientWidth, H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.scale(dpr, dpr);
    const pal = colors ?? themeColors(cv);
    const n = Math.min(120, count);
    const ps = Array.from({ length: n }, (_, i) => {
      const fromLeft = i % 2 === 0;
      const ang = (fromLeft ? -60 : -120) + (Math.random() - 0.5) * 50;
      const sp = (H * 0.9 + Math.random() * H * 0.7) / 1000; // px/ms
      return {
        x: fromLeft ? W * 0.15 : W * 0.85, y: H * 0.85,
        vx: Math.cos((ang * Math.PI) / 180) * sp, vy: Math.sin((ang * Math.PI) / 180) * sp,
        w: 5 + Math.random() * 5, h: 8 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.02,
        c: pal[i % pal.length], wob: Math.random() * 6,
      };
    });
    let raf = 0; const t0 = performance.now(); let last = t0;
    const g = H / 900000 * 1.6; // px/ms²
    const tick = (now: number) => {
      const dt = Math.min(32, now - last); last = now;
      const t = now - t0;
      ctx.clearRect(0, 0, W, H);
      const fade = t > DUR - 400 ? Math.max(0, (DUR - t) / 400) : 1;
      for (const p of ps) {
        p.vy += g * dt; p.vx *= 0.995; p.vy *= 0.995;
        p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.scale(1, Math.cos(p.r * 2 + p.wob)); // Flattern
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (t < DUR) raf = requestAnimationFrame(tick);
      else { ctx.clearRect(0, 0, W, H); onDone?.(); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, reduced]); // eslint-disable-line react-hooks/exhaustive-deps
  return <canvas ref={ref} className="fx fx-confetti" aria-hidden />;
}
