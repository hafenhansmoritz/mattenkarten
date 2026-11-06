import { useMemo } from "react";
import { FightersScene, sceneOfPos2, type BodyPart, type FighterHighlight } from "../../components/fighters";
import type { Grip2, Pos2, Side, SubTrack, Zone } from "../types";
import type { Grip, TapState } from "../../components/fighters/choreo";

/** Mechanik 2: Griff-ID der Karte → Hand-Griff der Choreografie (für den dauerhaften Glow). */
export const GRIP_SCENE: Record<string, Grip> = {
  collar_tie: "collar", underhook: "underhook", crossface: "crossface", seatbelt: "seatbelt", wrist: "wrist", chin_strap: "chinstrap",
};

/** Zone der Körperkarte → hervorgehobenes Körperteil. */
export const ZONE_PART: Record<Zone, BodyPart> = {
  kopf: "neck",
  arme: "arms",
  huefte: "hips",
  beine: "legs",
};

export interface FightersK2Props {
  pos: Pos2;
  top: Side | null;
  shake?: "x" | "y" | null;
  flash?: Side | null;
  zoom?: boolean;
  slowmo?: boolean;
  windup?: Side | null;
  /** Hebt die Körperzone eines Kämpfers hervor (kopf→Nacken/Kopf, arme→Arme, huefte→Hüfte, beine→Beine). */
  zone?: { side: Side; zone: Zone } | null;
  className?: string;
  /** Optionale Highlight-Farbe (Standard Gold). */
  zoneColor?: string;
  /** Direktes Körperteil-Highlight (z. B. Bilderrätsel: Ellbogen weg vom Knie). Hat Vorrang vor zone. */
  part?: { side: Side; part: BodyPart } | null;
  /** Laufende Aufgabe-Leiste: Angreifer schließt Schritt für Schritt um Arm/Hals (1 isolieren, 2 kontrollieren, 3 beenden). */
  sub?: Pick<SubTrack, "owner" | "id" | "zone" | "step"> | null;
  /** Tap-Moment: hold = Griff sitzt, tapping = Verteidiger klopft ab, release = Angreifer lässt sofort los. */
  tap?: TapState;
  /** Griff-Marker an den Händen (Standard: wie `zone`). */
  grips?: { side: Side; zone: Zone } | null;
  /** Mechanik 2: liegende Griffe (State2.grips) – ihre Hände glühen, solange der Griff liegt. */
  held?: Pick<Grip2, "id" | "owner">[];
}

/** Kampf-Silhouetten für Kern 2: nutzt den Fighters-Renderer, kennt zusätzlich "half" und "turtle". */
export function FightersK2({ pos, top, zone = null, zoneColor, part = null, sub = null, tap = null, grips, held = [], ...rest }: FightersK2Props) {
  const highlight = useMemo<FighterHighlight | null>(
    () => (part ? { side: part.side, part: part.part, color: zoneColor }
      : zone ? { side: zone.side, part: ZONE_PART[zone.zone], color: zoneColor } : null),
    [zone?.side, zone?.zone, part?.side, part?.part, zoneColor], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const gz = grips === undefined ? zone : grips;
  const gripZone = useMemo(() => (gz ? { side: gz.side, zone: gz.zone } : null), [gz?.side, gz?.zone]); // eslint-disable-line react-hooks/exhaustive-deps
  const subPose = useMemo(() => (sub && sub.step > 0 ? { owner: sub.owner, id: sub.id, zone: sub.zone, step: sub.step } : null),
    [sub?.owner, sub?.id, sub?.zone, sub?.step]); // eslint-disable-line react-hooks/exhaustive-deps
  const heldKey = held.map((g) => `${g.owner}:${g.id}`).join(",");
  const heldScene = useMemo(() => held.filter((g) => GRIP_SCENE[g.id]).map((g) => ({ side: g.owner, grip: GRIP_SCENE[g.id] })), [heldKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return <FightersScene pos={sceneOfPos2(pos)} top={pos === "stand" || pos === "clinch" ? null : top} highlight={highlight}
    gripZone={gripZone} sub={subPose} tap={tap} held={heldScene} {...rest} />;
}
