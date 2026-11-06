// Kern 2 – gemeinsame UI-Bausteine: Zonen-/Arten-Texte, Icons, Positionsnamen.
import type { Board, Card2, Kind2, Pos2, Role2, Side, Zone, ZoneReq } from "../types";
import { ZONES } from "../types";

export const ZONE_LABEL: Record<Zone, string> = { kopf: "Kopf/Nacken", arme: "Arme", huefte: "Hüfte", beine: "Beine" };
/** Kurzform für Chips ("Hüfte +1"). */
export const ZONE_SHORT: Record<Zone, string> = { kopf: "Nacken", arme: "Arme", huefte: "Hüfte", beine: "Beine" };
/** Dativ für Sätze ("an Hüfte und Armen"). */
export const ZONE_DAT: Record<Zone, string> = { kopf: "Nacken", arme: "Armen", huefte: "Hüfte", beine: "Beinen" };
export const ZONE_QUESTION: Record<Zone, string> = {
  kopf: "Wer hat den Nacken?", arme: "Wer hat die Arme?", huefte: "Wer hat die Hüfte?", beine: "Wer hat die Beine?",
};

export const KIND_LABEL: Record<Kind2, string> = { angriff: "Angreifen", aufbauen: "Aufbauen", rahmen: "Rahmen" };
export const KIND_COLOR: Record<Kind2, string> = {
  angriff: "var(--k-angriff)", aufbauen: "var(--k-setup)", rahmen: "var(--k-reaktion)",
};

export const POS_LABEL: Record<Pos2, string> = {
  stand: "Stand", clinch: "Clinch", headlock: "Kopfklammer (Front Headlock)", guard: "Guard", half: "Halbe Guard", turtle: "Turtle",
  side: "Seitenkontrolle", mount: "Mount", back: "Rücken",
};
export const ROLE_LABEL: Record<Role2, string> = { neutral: "neutral", top: "du oben", bottom: "du unten" };

export const SIDE_COLOR: Record<Side, string> = { p: "var(--gi-p)", o: "var(--gi-o)" };

/** Natürliche Aufzählung: "Hüfte", "Hüfte und Armen", "Nacken, Hüfte und Armen". */
export function listDe(words: string[]): string {
  if (words.length <= 1) return words[0] ?? "";
  return words.slice(0, -1).join(", ") + " und " + words[words.length - 1];
}

export function fmtSigned(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0";
}

/** Prüft eine Zonen-Bedingung gegen ein Brett aus Sicht des Kartenspielers. */
export function reqMet(req: ZoneReq | undefined, myBoard: Board | undefined, zone: Zone): boolean | null {
  if (!req || req[zone] == null || !myBoard) return null;
  return myBoard[zone] >= (req[zone] as number);
}

/** Bedingungen einer Karte. gripZones (Mechanik 2): Zonen mit eigenem Griff – dort braucht ein Angriff in dieser Zone 1 weniger. */
export function reqList(c: Card2, gripZones: Zone[] = []): { zone: Zone; n: number; grip?: boolean }[] {
  if (!c.requires) return [];
  return ZONES.filter((z) => c.requires![z] != null).map((z) => {
    const grip = z === c.zone && gripZones.includes(z);
    return { zone: z, n: (c.requires![z] as number) - (grip ? 1 : 0), ...(grip ? { grip } : {}) };
  });
}

function Svg({ size = 16, className, children }: { size?: number; className?: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={["k2-ico", className].filter(Boolean).join(" ")}
      fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

/** Mechanik 2: Griff (greifende Hand). */
export function GripIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <Svg size={size} className={className}>
      <path d="M18 11.5V9a2 2 0 0 0-4 0v1.4" /><path d="M14 10V8a2 2 0 0 0-4 0v2" /><path d="M10 9.9V9a2 2 0 0 0-4 0v5" />
      <path d="M6 14a2 2 0 0 0-4 0" /><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8 2 2 0 1 1 4 0" />
    </Svg>
  );
}

/** Kleines Körper-Icon pro Zone. */
export function ZoneIcon({ zone, size = 16, className }: { zone: Zone; size?: number; className?: string }) {
  return (
    <Svg size={size} className={className}>
      {zone === "kopf" && (<>
        <circle cx="12" cy="8" r="4.4" />
        <path d="M9.6 12.6v2.6M14.4 12.6v2.6" />
        <path d="M5 21c.6-3.4 3.4-5.8 7-5.8s6.4 2.4 7 5.8" />
      </>)}
      {zone === "arme" && (<>
        <path d="M3.5 18.5h5.2l3.6-6.2" />
        <path d="M12.3 12.3 16 6.5" />
        <circle cx="17.6" cy="5" r="2" />
        <path d="M6 18.5c0-2 .8-3.6 2.4-4.6" opacity={0.55} />
      </>)}
      {zone === "huefte" && (<>
        <path d="M5 7.5h14" />
        <path d="M5.5 7.5c0 4.2 2.4 7.6 6.5 7.6s6.5-3.4 6.5-7.6" />
        <path d="M8.5 14.2 7.4 21M15.5 14.2l1.1 6.8" />
        <rect x="10.4" y="5.8" width="3.2" height="3.4" rx="0.6" fill="currentColor" stroke="none" />
      </>)}
      {zone === "beine" && (<>
        <path d="M8.5 3v7.5L6.5 21" />
        <path d="M15.5 3v7.5l2.5 4.2-1.2 6.3" />
        <path d="M4.5 21h4M15 21h4" />
      </>)}
    </Svg>
  );
}

export function LockIcon({ size = 12 }: { size?: number }) {
  return (
    <Svg size={size}>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7" />
    </Svg>
  );
}

/** Sichtbarer Name der Ressource (internes Feld `kraft`): BJJ ist Hebel statt Kraft – man haushaltet mit dem Atem. */
export const ATEM_LABEL = "Atem";

/** Atem-Symbol (Luftzug). Name bleibt KraftIcon, damit bestehende Importe gelten. */
export function KraftIcon({ size = 12 }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M3 9h10.5a3 3 0 1 0-3-3" />
      <path d="M3 15h14a3 3 0 1 1-3 3" />
      <path d="M3 12h17" />
    </Svg>
  );
}

/** Roter Doppel-Chevron (Bedrohung). */
export function ThreatChevron({ size = 14 }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M5 6l6 6-6 6" opacity={0.6} />
      <path d="M12 6l6 6-6 6" />
    </Svg>
  );
}
