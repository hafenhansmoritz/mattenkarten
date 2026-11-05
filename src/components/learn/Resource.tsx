import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { IconGriff, IconOeffnung, IconPuste } from "./icons";

export type ResourceType = "gas" | "control" | "opening";

export const RESOURCE_WORD: Record<ResourceType, string> = {
  gas: "Puste",
  control: "Griff",
  opening: "Lücke",
};

export const RESOURCE_HELP: Record<ResourceType, string> = {
  gas: "Puste = deine Ausdauer. Jede Karte kostet Puste.",
  control: "Griff = wie fest du ihn hältst. Starke Angriffe brauchen Griff.",
  opening: "Lücke = er ist offen. Dein nächster passender Angriff kommt schneller durch.",
};

export function ResourceIcon({ type, size = 18 }: { type: ResourceType; size?: number }) {
  const cls = `lr-res-ico lr-res-${type}`;
  if (type === "gas") return <span className={cls}><IconPuste size={size} /></span>;
  if (type === "control") return <span className={cls}><IconGriff size={size} /></span>;
  return <span className={cls}><IconOeffnung size={size} /></span>;
}

export interface ResourceBadgeProps {
  type: ResourceType;
  value: number;
  max: number;
  /** Rechtsbündig (Gegner-Seite). */
  mirror?: boolean;
  /** Wort ausblenden (nur, wenn Platz extrem knapp ist – Icon bleibt). */
  hideWord?: boolean;
}

/** HUD-Anzeige: Icon + Wort + Segmentbalken. Pulsiert, wenn sich der Wert ändert. */
export function ResourceBadge({ type, value, max, mirror = false, hideWord = false }: ResourceBadgeProps) {
  const prev = useRef(value);
  const [pulse, setPulse] = useState<{ n: number; dir: "up" | "down" } | null>(null);

  useEffect(() => {
    if (prev.current !== value) {
      const dir = value > prev.current ? "up" : "down";
      prev.current = value;
      setPulse((p) => ({ n: (p?.n ?? 0) + 1, dir }));
    }
  }, [value]);

  const segs = Math.max(1, Math.min(12, Math.round(max)));
  const filled = Math.max(0, Math.min(segs, Math.round((value / Math.max(1, max)) * segs)));
  const word = RESOURCE_WORD[type];

  return (
    <motion.div
      key={pulse?.n ?? 0}
      className={`lr-badge lr-badge-${type}${mirror ? " mirror" : ""}${pulse ? ` pulse-${pulse.dir}` : ""}`}
      role="meter"
      aria-label={word}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      title={RESOURCE_HELP[type]}
      initial={pulse ? { scale: pulse.dir === "up" ? 1.12 : 0.92 } : false}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 14 }}
    >
      <span className="lr-badge-head">
        <ResourceIcon type={type} size={16} />
        {!hideWord && <span className="lr-badge-word">{word}</span>}
        <span className="lr-badge-num num">{value}</span>
      </span>
      <span className="lr-badge-bar" aria-hidden="true">
        {Array.from({ length: segs }, (_, i) => (
          <i key={i} className={i < filled ? "on" : undefined} />
        ))}
      </span>
    </motion.div>
  );
}
