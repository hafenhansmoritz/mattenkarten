import { motion } from "framer-motion";
import type { CardKind } from "../../engine/types";
import { KindIcon } from "./icons";
import { KIND_ORDER, KIND_RULE, KIND_VERB } from "./kinds";

export interface TriangleExplainerProps {
  /** Kleine Version: Mini-Dreieck + Regelzeile (für Reveal-Panel, HUD-Legende). */
  compact?: boolean;
  /** Hebt den Pfeil hervor, der vom Typ ausgeht (z. B. "reaktion" = Rahmen schlägt Angriff). */
  highlight?: CardKind | null;
  className?: string;
}

const COLOR: Record<CardKind, string> = {
  angriff: "var(--k-angriff)",
  setup: "var(--k-setup)",
  reaktion: "var(--k-reaktion)",
};

// Knoten im Uhrzeigersinn: Angreifen oben, Aufbauen rechts unten, Rahmen links unten.
const ANGLE: Record<CardKind, number> = { angriff: -90, setup: 30, reaktion: 150 };

const rad = (d: number) => (d * Math.PI) / 180;

function geometry(cx: number, cy: number, r: number, gapDeg: number, labelPad = 20) {
  const pt = (a: number, rr = r) => ({ x: cx + rr * Math.cos(rad(a)), y: cy + rr * Math.sin(rad(a)) });
  return KIND_ORDER.map((from) => {
    const to = KIND_RULE[from].beats;
    const a1 = ANGLE[from] + gapDeg;
    let a2 = ANGLE[to] - gapDeg;
    if (a2 < a1) a2 += 360;
    const s = pt(a1);
    const e = pt(a2);
    const d = `M${s.x.toFixed(1)} ${s.y.toFixed(1)} A${r} ${r} 0 0 1 ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
    // Pfeilspitze: Tangente im Uhrzeigersinn
    const tx = -Math.sin(rad(a2));
    const ty = Math.cos(rad(a2));
    const nx = -ty;
    const ny = tx;
    const L = 9;
    const W = 6;
    const head = [
      `${(e.x + tx * 2).toFixed(1)},${(e.y + ty * 2).toFixed(1)}`,
      `${(e.x - tx * L + nx * W).toFixed(1)},${(e.y - ty * L + ny * W).toFixed(1)}`,
      `${(e.x - tx * L - nx * W).toFixed(1)},${(e.y - ty * L - ny * W).toFixed(1)}`,
    ].join(" ");
    const mid = (a1 + a2) / 2;
    return { from, to, d, head, mid, label: pt(mid, r + labelPad) };
  });
}

/** Das Dreieck: Angreifen schlägt Aufbauen → Aufbauen lockt den Rahmen ins Leere → Rahmen stoppt den passenden Angriff. */
export function TriangleExplainer({ compact = false, highlight = null, className }: TriangleExplainerProps) {
  return compact ? <CompactTriangle highlight={highlight} className={className} /> : <BigTriangle highlight={highlight} className={className} />;
}

function BigTriangle({ highlight, className }: { highlight: CardKind | null; className?: string }) {
  const cx = 160;
  const cy = 132;
  const r = 88;
  const arcs = geometry(cx, cy, r, 21, 32);
  const key = highlight ?? "all";
  return (
    <figure className={["lr-tri", className].filter(Boolean).join(" ")}>
      <svg viewBox="0 0 320 272" className="lr-tri-svg" role="img" aria-label="Das Dreieck: Angreifen schlägt Aufbauen. Aufbauen lockt den Rahmen ins Leere. Rahmen stoppt den passenden Angriff.">
        {arcs.map((a, i) => {
          const on = !highlight || highlight === a.from;
          const strong = highlight === a.from;
          return (
            <g key={`${key}-${a.from}`} opacity={on ? 1 : 0.22}>
              <motion.path
                d={a.d}
                fill="none"
                stroke={COLOR[a.from]}
                strokeWidth={strong ? 6 : 4}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.55, delay: 0.15 + i * 0.32, ease: [0.2, 0.7, 0.2, 1] }}
                style={strong ? { filter: `drop-shadow(0 0 6px ${COLOR[a.from]})` } : undefined}
              />
              <motion.polygon
                points={a.head}
                fill={COLOR[a.from]}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: 0.6 + i * 0.32 }}
              />
              <motion.text
                x={a.label.x}
                y={a.label.y + 4}
                textAnchor="middle"
                className={`lr-tri-verb${strong ? " on" : ""}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.55 + i * 0.32 }}
              >
                {KIND_RULE[a.from].verb}
              </motion.text>
            </g>
          );
        })}
        {KIND_ORDER.map((k, i) => {
          const x = cx + r * Math.cos(rad(ANGLE[k]));
          const y = cy + r * Math.sin(rad(ANGLE[k]));
          const lit = !highlight || highlight === k || KIND_RULE[highlight].beats === k;
          return (
            <motion.g
              key={k}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: lit ? 1 : 0.4 }}
              transition={{ type: "spring", stiffness: 420, damping: 22, delay: i * 0.08 }}
              style={{ transformOrigin: `${x}px ${y}px`, transformBox: "view-box" }}
            >
              <circle cx={x} cy={y} r={25} fill="var(--bg-2)" stroke={COLOR[k]} strokeWidth={3} />
              <g transform={`translate(${x - 12} ${y - 12})`} color={COLOR[k]}>
                <KindIcon kind={k} size={24} />
              </g>
              <text x={x} y={k === "angriff" ? y - 33 : y + 56} textAnchor="middle" className="lr-tri-node" fill={COLOR[k]}>
                {KIND_VERB[k]}
              </text>
            </motion.g>
          );
        })}
      </svg>
      <figcaption className="lr-tri-cap">
        {(highlight ? [highlight] : KIND_ORDER).map((k) => (
          <p key={k}>
            <b style={{ color: COLOR[k] }}>{KIND_RULE[k].short}.</b> {KIND_RULE[k].long}
          </p>
        ))}
      </figcaption>
    </figure>
  );
}

function CompactTriangle({ highlight, className }: { highlight: CardKind | null; className?: string }) {
  const cx = 40;
  const cy = 40;
  const r = 28;
  const arcs = geometry(cx, cy, r, 26);
  const key = highlight ?? "all";
  return (
    <div className={["lr-tri-mini", className].filter(Boolean).join(" ")}>
      <svg viewBox="0 0 80 80" width={64} height={64} aria-hidden="true" focusable="false">
        {arcs.map((a, i) => {
          const strong = highlight === a.from;
          return (
            <g key={`${key}-${a.from}`} opacity={!highlight || strong ? 1 : 0.25}>
              <motion.path
                d={a.d}
                fill="none"
                stroke={COLOR[a.from]}
                strokeWidth={strong ? 4 : 2.5}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.45, delay: 0.1 + i * 0.18 }}
              />
            </g>
          );
        })}
        {KIND_ORDER.map((k) => {
          const x = cx + r * Math.cos(rad(ANGLE[k]));
          const y = cy + r * Math.sin(rad(ANGLE[k]));
          const lit = !highlight || highlight === k || KIND_RULE[highlight].beats === k;
          return <circle key={k} cx={x} cy={y} r={lit ? 7 : 5.5} fill={COLOR[k]} opacity={lit ? 1 : 0.4} />;
        })}
      </svg>
      <ul className="lr-tri-legend">
        {(highlight ? [highlight] : KIND_ORDER).map((k) => (
          <li key={k} className={highlight === k ? "on" : undefined}>
            <i style={{ background: COLOR[k] }} />
            {KIND_RULE[k].short}
          </li>
        ))}
      </ul>
    </div>
  );
}
