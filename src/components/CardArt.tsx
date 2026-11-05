import type { CardDef } from "../engine/types";
import { PoseThumb } from "./fighters";

/** Kartenbild = Mini-Pose der Ergebnisposition (bei Submissions/Setups: Ausgangsposition). */
export function CardArt({ card, size = 112 }: { card: CardDef; size?: number }) {
  const o = card.success ?? card.onCounter;
  const slot = card.slots[0];
  const pos = o?.pos ?? slot.pos;
  const role = o?.role ?? slot.role;
  return (
    <div className="card-art" style={{ ["--thumb-a" as any]: "#ffffff", ["--thumb-b" as any]: "rgba(255,255,255,.32)" }}>
      <PoseThumb pos={pos} role={role} size={size} />
    </div>
  );
}
