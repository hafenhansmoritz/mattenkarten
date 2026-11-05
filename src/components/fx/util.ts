import type { CSSProperties } from "react";

/** x/y: Zahl = px, String = beliebige CSS-Länge (z. B. "50%"). */
export type Coord = number | string;
export const css = (v: Coord) => (typeof v === "number" ? `${v}px` : v);

/** Absolute Position eines FX-Elements (Mittelpunkt bei x/y). */
export const at = (x: Coord, y: Coord): CSSProperties => ({ left: css(x), top: css(y) });

/**
 * Rechnet einen Punkt im viewBox-Koordinatensystem eines SVG (z. B. aus `contactPoint()`)
 * in px relativ zu einem Container um – ideal, um ImpactBurst/FloatText auf der Bühne
 * genau dort zu platzieren, wo sich die Kämpfer berühren.
 *
 *   const p = svgToContainer(stageSvg, contactPoint(pos, top), stageDiv)
 *   <ImpactBurst x={p.x} y={p.y} />
 */
export function svgToContainer(
  svg: SVGSVGElement | null, pt: { x: number; y: number }, container: HTMLElement | null,
): { x: number; y: number } {
  if (!svg || !container) return { x: 0, y: 0 };
  const m = svg.getScreenCTM();
  const box = container.getBoundingClientRect();
  if (!m) return { x: 0, y: 0 };
  const sp = new DOMPoint(pt.x, pt.y).matrixTransform(m);
  return { x: sp.x - box.left, y: sp.y - box.top };
}

/** Deterministischer kleiner PRNG, damit Partikel pro Instanz stabil bleiben. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

export const EASE_OUT = [0.2, 0.7, 0.2, 1] as const;
export const EASE_BACK = [0.34, 1.56, 0.64, 1] as const;
