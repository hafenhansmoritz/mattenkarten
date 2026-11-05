import type { PositionId, Role } from "../../engine/types";
import { FIGHTER_PARTS, MAT_Y, STROKE, beltPath, layerOrder, limbPath, scenePose, segPath, type Pose } from "./poses";

export interface PoseThumbProps {
  pos: PositionId;
  /** Rolle des Karteninhabers: top/bottom; neutral → Inhaber links. */
  role: Role;
  size?: number;
}

/** Statische Mini-Szene als Kartenbild (keine Springs). */
export function PoseThumb({ pos, role, size = 96 }: PoseThumbProps) {
  // Inhaber = "p". Ist der Inhaber unten, liegt der andere oben.
  const top = role === "bottom" ? "o" : role === "top" ? "p" : null;
  const { p, o } = scenePose(pos, top);
  const fighters = { p, o };
  const colors = { p: "var(--thumb-a, #fff)", o: "var(--thumb-b, rgba(255,255,255,.35))" };
  const layers = layerOrder([{ key: "p" as const, z: p.z + 0.01 }, { key: "o" as const, z: o.z }]);
  return (
    <svg
      viewBox="30 30 340 172"
      width={size}
      height={(size * 172) / 340}
      role="img"
      aria-label={`${pos} (${role})`}
      style={{ display: "block" }}
    >
      <line x1="30" y1={MAT_Y} x2="370" y2={MAT_Y} stroke={colors.o} strokeWidth={3} strokeLinecap="round" />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {layers.map((l, i) => (
          <StaticParts key={i} pose={fighters[l.who]} parts={l.parts} color={colors[l.who]} />
        ))}
      </g>
    </svg>
  );
}

function StaticParts({ pose, parts, color }: { pose: Pose; parts: ("armF" | "armB" | "legF" | "legB" | "body")[]; color: string }) {
  return (
    <>
      {parts.map((part) => {
        if (part === "body") {
          return (
            <g key="body">
              <path d={segPath(pose.hip, pose.neck)} stroke={color} strokeWidth={STROKE.torso} />
              <path d={beltPath(pose.hip, pose.neck)} stroke="rgba(0,0,0,.45)" strokeWidth={STROKE.belt} />
              <circle cx={pose.head.x} cy={pose.head.y} r={STROKE.head} fill={color} />
            </g>
          );
        }
        const [a, b, c] = FIGHTER_PARTS[part];
        const far = part === "armB" || part === "legB";
        return (
          <path
            key={part}
            d={limbPath(pose[a], pose[b], pose[c])}
            stroke={color}
            strokeWidth={STROKE.limb}
            opacity={far ? 0.75 : 1}
          />
        );
      })}
    </>
  );
}
