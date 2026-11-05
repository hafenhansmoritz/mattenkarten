// Kern 2 – Kartenrahmen (Schritt 70): Form + Symbol pro Art (farbenblind lesbar), Edelstein pro Seltenheit.
// Angreifen = Spitze (abgeschrägte Ecke, Pfeil) · Aufbauen = Block (doppelte Kante, Steine) · Rahmen = Schild (runde Kante).
import type { Kind2 } from "../types";
import { RARITY_LABEL, type Rarity } from "./rarity";
import "../../styles/k2frames.css";

export const KIND_SHAPE_LABEL: Record<Kind2, string> = { angriff: "Spitze", aufbauen: "Block", rahmen: "Schild" };

/** Symbol der Kartenart. Form trägt die Bedeutung, Farbe ist nur Zusatz. */
export function KindIcon({ kind, size = 10, className }: { kind: Kind2; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={["k2-kind-ico", className].filter(Boolean).join(" ")} aria-hidden="true" focusable="false">
      {kind === "angriff" && <path d="M4 4.5 21 12 4 19.5l4-7.5z" fill="currentColor" />}
      {kind === "aufbauen" && (<>
        <rect x="3" y="13" width="18" height="7.5" rx="1.2" fill="currentColor" />
        <rect x="6.5" y="4" width="11" height="7.5" rx="1.2" fill="currentColor" opacity={0.75} />
      </>)}
      {kind === "rahmen" && <path d="M12 2.5 20.5 5.6v6.2c0 4.9-3.6 8.6-8.5 9.7-4.9-1.1-8.5-4.8-8.5-9.7V5.6z" fill="currentColor" />}
    </svg>
  );
}

/** Edelstein: Form und Farbe je Stufe (Kreis · Raute · Sechseck). */
export function RarityGem({ rarity, size = 11, className }: { rarity: Rarity; size?: number; className?: string }) {
  return (
    <span className={["k2-gem", `rar-${rarity}`, className].filter(Boolean).join(" ")} title={RARITY_LABEL[rarity]} role="img" aria-label={RARITY_LABEL[rarity]}>
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
        {rarity === "grundlage" && (<>
          <circle cx="12" cy="12" r="8.5" fill="currentColor" />
          <circle cx="9.5" cy="9.5" r="2.6" fill="#fff" opacity={0.55} />
        </>)}
        {rarity === "technik" && (<>
          <path d="M12 2.5 21 12l-9 9.5L3 12z" fill="currentColor" />
          <path d="M12 2.5 7.5 12H3z" fill="#fff" opacity={0.45} />
        </>)}
        {rarity === "meister" && (<>
          <path d="M12 2 20.7 7v10L12 22l-8.7-5V7z" fill="currentColor" />
          <path d="M12 2 20.7 7 12 12 3.3 7z" fill="#fff" opacity={0.42} />
          <path d="M12 12v10" stroke="#fff" strokeOpacity={0.3} strokeWidth={1.2} />
        </>)}
      </svg>
    </span>
  );
}

/** Folien-Ebene (nur bei Meister sichtbar, ruht bei „weniger Bewegung“). */
export function Foil() {
  return <span className="k2-foil" aria-hidden="true" />;
}
