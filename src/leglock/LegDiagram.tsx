// Einfache eigene Bein-Skizzen (Seitenansicht) für „Was ist hier gefährlich?“.
// Du = blau (var(--gi-p)), Partner = rot (var(--gi-o)). Bewusst schematisch, keine Technik-Anleitung.
import type { DiagramId } from "./content";

type P = [number, number];

interface Cfg {
  knee: P;
  foot: P;
  toes: "pulled" | "pointed";
  /** Beine des Partners: offen, gekreuzt über deinem Bein oder keine Beinkontrolle. */
  his: "open" | "crossed" | "none";
  /** Wo seine Hände sind. */
  arm: "shin" | "armpit" | "achilles" | "knee";
  lean?: boolean;
  hipLine?: boolean;
  /** Gefahrenstelle (gelber Ring nach dem Antippen). */
  mark?: P;
}

const HIP: P = [62, 96];
const YOU_HIP: P = [206, 84];

const CFG: Record<DiagramId, Cfg> = {
  "knee-safe": { knee: [122, 52], foot: [74, 58], toes: "pulled", his: "open", arm: "shin", hipLine: true },
  "knee-past": { knee: [70, 70], foot: [34, 46], toes: "pulled", his: "open", arm: "shin", hipLine: true, mark: [70, 70] },
  "foot-hidden": { knee: [122, 52], foot: [76, 60], toes: "pulled", his: "open", arm: "shin" },
  "foot-exposed": { knee: [122, 52], foot: [70, 62], toes: "pointed", his: "open", arm: "shin", mark: [56, 66] },
  "legs-open": { knee: [122, 52], foot: [74, 58], toes: "pulled", his: "open", arm: "shin" },
  "legs-crossed": { knee: [122, 52], foot: [74, 58], toes: "pulled", his: "crossed", arm: "shin", mark: [146, 78] },
  "heel-free": { knee: [128, 48], foot: [96, 34], toes: "pulled", his: "open", arm: "knee" },
  "heel-armpit": { knee: [112, 56], foot: [48, 56], toes: "pulled", his: "open", arm: "armpit", mark: [48, 56] },
  "ankle-lock": { knee: [118, 58], foot: [50, 58], toes: "pointed", his: "open", arm: "achilles", lean: true, mark: [58, 62] },
  "leg-hold": { knee: [140, 56], foot: [104, 108], toes: "pulled", his: "none", arm: "knee" },
};

const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const mul = (a: P, k: number): P => [a[0] * k, a[1] * k];
const norm = (a: P): P => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; };
const pts = (...ps: P[]) => ps.map((p) => p.join(",")).join(" ");

export function LegDiagram({ id, showMark = false, label }: { id: DiagramId; showMark?: boolean; label?: string }) {
  const c = CFG[id];
  const shoulder: P = c.lean ? [36, 62] : [48, 50];
  const head: P = add(shoulder, [-6, -16]);
  // Fuß: Richtung des Schienbeins; angezogen = Zehen nach oben, gestreckt = Zehen in Schienbein-Richtung.
  const d = norm([c.foot[0] - c.knee[0], c.foot[1] - c.knee[1]]);
  const up: P = d[0] < 0 ? [d[1], -d[0]] : [-d[1], d[0]];
  const toeDir = c.toes === "pointed" ? d : norm([up[0] * 0.9 + d[0] * 0.3, up[1] * 0.9 + d[1] * 0.3]);
  const toe = add(c.foot, mul(toeDir, 14));
  const heel = add(c.foot, mul(d, -2));
  // Hand des Partners
  const grip: P = c.arm === "armpit" ? c.foot : c.arm === "achilles" ? add(c.foot, mul(d, -9)) : c.arm === "knee" ? c.knee : add(c.foot, mul(d, -22));

  return (
    <svg viewBox="18 14 202 110" className="ll-diagram" role="img" aria-label={label ?? id}>
      <rect x="18" y="14" width="202" height="110" rx="10" className="ll-mat" />
      <line x1="6" y1="118" x2="214" y2="118" className="ll-ground" />
      {c.hipLine && (
        <g>
          <line x1={HIP[0] + 14} y1="10" x2={HIP[0] + 14} y2="118" className="ll-hipline" />
          <text x={HIP[0] + 18} y="28" className="ll-tag">seine Hüfte</text>
        </g>
      )}
      {/* Partner (rot): Rumpf, Kopf, Beine */}
      <g className="ll-o">
        {c.his === "open" && (
          <>
            <polyline points={pts(HIP, [112, 108], [160, 112])} />
            <polyline points={pts(HIP, [104, 76], [150, 62])} />
          </>
        )}
        {c.his === "crossed" && (
          <>
            <polyline points={pts(HIP, [112, 106], [156, 66])} />
            <polyline points={pts(HIP, [104, 70], [158, 92])} />
          </>
        )}
        {c.his === "none" && <polyline points={pts(HIP, [96, 112], [128, 116])} />}
        <line x1={HIP[0]} y1={HIP[1]} x2={shoulder[0]} y2={shoulder[1]} className="ll-torso" />
        <circle cx={head[0]} cy={head[1]} r="10" className="ll-head" />
      </g>
      {/* Du (blau): Bein von rechts */}
      <g className="ll-p">
        <line x1={YOU_HIP[0]} y1={YOU_HIP[1]} x2="220" y2="60" className="ll-torso" />
        <polyline points={pts(YOU_HIP, c.knee, c.foot)} />
        <line x1={heel[0]} y1={heel[1]} x2={toe[0]} y2={toe[1]} className="ll-foot" />
        <circle cx={c.knee[0]} cy={c.knee[1]} r="4" className="ll-joint" />
      </g>
      {/* Arm des Partners obenauf */}
      <g className="ll-o ll-arm">
        <polyline points={pts(add(shoulder, [2, 6]), grip)} />
        {c.arm === "armpit" && <circle cx={c.foot[0]} cy={c.foot[1]} r="9" className="ll-wrap" />}
        {c.arm === "achilles" && <line x1={grip[0] - 8} y1={grip[1] + 6} x2={grip[0] + 8} y2={grip[1] - 6} />}
      </g>
      {c.his === "crossed" && <text x="160" y="104" className="ll-tag">gekreuzt</text>}
      <text x={c.knee[0] + 6} y={c.knee[1] - 8} className="ll-tag ll-tag-p">Knie</text>
      {showMark && c.mark && <circle cx={c.mark[0]} cy={c.mark[1]} r="15" className="ll-mark" />}
    </svg>
  );
}
