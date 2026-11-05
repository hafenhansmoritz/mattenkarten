import { useMemo } from "react";
import { FightersScene, sceneOfPos2, type BodyPart, type FighterHighlight } from "../../components/fighters";
import type { Pos2, Side, Zone } from "../types";

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
}

/** Kampf-Silhouetten für Kern 2: nutzt den Fighters-Renderer, kennt zusätzlich "half" und "turtle". */
export function FightersK2({ pos, top, zone = null, zoneColor, part = null, ...rest }: FightersK2Props) {
  const highlight = useMemo<FighterHighlight | null>(
    () => (part ? { side: part.side, part: part.part, color: zoneColor }
      : zone ? { side: zone.side, part: ZONE_PART[zone.zone], color: zoneColor } : null),
    [zone?.side, zone?.zone, part?.side, part?.part, zoneColor], // eslint-disable-line react-hooks/exhaustive-deps
  );
  return <FightersScene pos={sceneOfPos2(pos)} top={pos === "stand" || pos === "clinch" ? null : top} highlight={highlight} {...rest} />;
}
