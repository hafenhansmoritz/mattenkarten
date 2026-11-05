import { useEffect, useState } from "react";
import { FightersK2 } from "./FightersK2";
import { Hand2 } from "./Hand2";
import { cardsFor } from "../data/cards";
import type { Pos2, Role2, Side, Zone } from "../types";
import "../../styles/core2.css";
import type { TapState } from "../../components/fighters/choreo";

/**
 * Entwickler-Labor für die Kämpfer-Szenen (?figlab&pos=mount&top=p …).
 * Parameter: pos, top, from, fromTop, delay, zone, zside, sub, owner, step, subzone, tap, tapseq, slow, label,
 * hand (Rolle des Spielers: neutral/top/bottom → zeigt die Hand des Slots), sel (gewählte Karte, z. B. für den MMA-Chip)
 * Wird nur über den URL-Parameter `figlab` geladen (Screenshots, visuelle Prüfung).
 */
export default function FighterLab() {
  const q = new URLSearchParams(location.search);
  const pos = (q.get("pos") ?? "stand") as Pos2;
  const topQ = q.get("top");
  const top = (topQ === "p" || topQ === "o" ? topQ : null) as Side | null;
  const from = q.get("from") as Pos2 | null;
  const fromTopQ = q.get("fromTop");
  const fromTop = (fromTopQ === "p" || fromTopQ === "o" ? fromTopQ : null) as Side | null;
  const delay = Number(q.get("delay") ?? 400);
  const zone = q.get("zone") as Zone | null;
  const zside = (q.get("zside") ?? "p") as Side;
  const subId = q.get("sub");
  const owner = (q.get("owner") ?? "p") as Side;
  const step = Number(q.get("step") ?? 0) as 0 | 1 | 2 | 3;
  const subZone = (q.get("subzone") ?? "arme") as Zone;
  const tapQ = q.get("tap") as TapState;
  const tapSeq = q.has("tapseq");
  const slow = q.has("slow");
  const handRole = q.get("hand") as Role2 | null;
  const [sel, setSel] = useState<string | null>(q.get("sel"));

  const [cur, setCur] = useState<{ pos: Pos2; top: Side | null }>(from ? { pos: from, top: fromTop } : { pos, top });
  const [tap, setTap] = useState<TapState>(tapSeq ? "hold" : tapQ);
  // delay < 0: Wechsel erst über window.__go() (deterministische Screenshots)
  useEffect(() => {
    const go = () => {
      if (from) setCur({ pos, top });
      if (tapSeq) { setTap("tapping"); setTimeout(() => setTap("release"), 1400); }
    };
    (window as unknown as { __go?: () => void }).__go = go;
    if (delay < 0) return;
    const t = setTimeout(go, delay);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: "100vh", background: "#0b1224", color: "#fff", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <div id="lab-label" style={{ fontSize: 14, opacity: 0.85, marginBottom: 8 }}>
        {q.get("label") ?? `${cur.pos} · top ${cur.top ?? "–"}${subId ? ` · ${subId} ${step}` : ""}${tap ? ` · ${tap}` : ""}`}
      </div>
      <div style={{ background: "#101a33", borderRadius: 12, padding: "8px 0" }}>
        <FightersK2 pos={cur.pos} top={cur.top} slowmo={slow}
          zone={zone ? { side: zside, zone } : null}
          sub={subId ? { owner, id: subId, zone: subZone, step } : null}
          tap={tap} />
      </div>
      {handRole && (
        <div style={{ marginTop: 12 }}>
          <Hand2 cards={cardsFor(pos, handRole)} legal={[]} selected={sel} onSelect={setSel} />
        </div>
      )}
    </div>
  );
}
