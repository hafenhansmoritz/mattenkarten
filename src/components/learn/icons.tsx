import type { CardKind } from "../../engine/types";

/* Kleine Inline-Icons für die Lern-Ebene. 24er-Raster, currentColor. Keine Emojis. */

interface IconProps {
  size?: number;
  className?: string;
  title?: string;
}

function Svg({ size = 18, className, title, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={["lr-ico", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** Atem: Windstoß (Atem). */
export function IconPuste(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 8h10a3 3 0 1 0-3-3" />
      <path d="M3 12.5h15a3 3 0 1 1-3 3" />
      <path d="M3 17h6" />
    </Svg>
  );
}

/** Griff: Hand, die eine Stange umschließt. */
export function IconGriff(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M2 12.5h20" strokeWidth={2.4} />
      <path d="M7 12.5V9.2a1.6 1.6 0 0 1 3.2 0v3.3" />
      <path d="M10.2 12.5V8.4a1.6 1.6 0 0 1 3.2 0v4.1" />
      <path d="M13.4 12.5V9a1.6 1.6 0 0 1 3.2 0v3.5" />
      <path d="M5 12.5c0 4 2.6 6.5 6.4 6.5h1.4c3.4 0 5.6-2.4 5.6-6.5" />
    </Svg>
  );
}

/** Lücke (Öffnung): Flamme. */
export function IconOeffnung(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2.8c.8 3.2 5.6 5.4 5.6 10.6a5.6 5.6 0 0 1-11.2 0c0-2.3 1-3.9 2.3-5 .1 2.1 1 3.3 2.2 3.4.1-3.2-.9-5.4 1.1-9z" />
    </Svg>
  );
}

export function IconBulb(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9.2 17.5h5.6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.9 10.6c.8.7 1.1 1.5 1.1 2.4h5.6c0-.9.3-1.7 1.1-2.4A6 6 0 0 0 12 3z" />
    </Svg>
  );
}

export function IconTarget(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </Svg>
  );
}

export function IconWarn(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3.5 2.8 19.5h18.4z" />
      <path d="M12 10v4.2" />
      <path d="M12 17.1v.1" strokeWidth={2.6} />
    </Svg>
  );
}

export function IconCheck(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Svg>
  );
}

export function IconCross(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}

export function IconEye(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

/** Kartentyp als Verb-Symbol: Pfeile (Angreifen), Ringe (Aufbauen), Schild (Rahmen). */
export function KindIcon({ kind, ...p }: IconProps & { kind: CardKind }) {
  return (
    <Svg {...p}>
      {kind === "angriff" ? (
        <>
          <path d="M4 6l6 6-6 6" opacity={0.55} />
          <path d="M12 6l6 6-6 6" />
        </>
      ) : kind === "setup" ? (
        <>
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="8" opacity={0.6} />
        </>
      ) : (
        <>
          <path d="M12 3l7.5 2.7v6c0 4.5-3.2 7.6-7.5 9.3-4.3-1.7-7.5-4.8-7.5-9.3v-6z" />
          <path d="m8.8 12 2.3 2.3 4.3-4.6" />
        </>
      )}
    </Svg>
  );
}

/** Coach-Avatar: Kopf mit Kappe und Pfeife. */
export function CoachAvatar({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className="lr-coach-ava" aria-hidden="true" focusable="false">
      <circle cx="24" cy="24" r="23" fill="var(--surface-3)" stroke="var(--line-strong)" />
      {/* Hals/Schultern */}
      <path d="M10 46c1.5-7 7-10 14-10s12.5 3 14 10" fill="var(--k-reaktion)" />
      {/* Kopf */}
      <circle cx="24" cy="24" r="9.5" fill="#f1c9a5" />
      {/* Kappe */}
      <path d="M14.3 21.5a9.7 9.7 0 0 1 19.4 0z" fill="var(--k-angriff)" />
      <path d="M24 21.5h12.5" stroke="var(--k-angriff)" strokeWidth="2.6" strokeLinecap="round" />
      {/* Augen + Mund */}
      <circle cx="20.6" cy="25" r="1.15" fill="#1b2235" />
      <circle cx="27.4" cy="25" r="1.15" fill="#1b2235" />
      <path d="M21 29.2c1.8 1.2 4.2 1.2 6 0" stroke="#1b2235" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {/* Pfeifenband + Pfeife */}
      <path d="M17 35.5c2 4.5 5 6.5 8.5 6.6" stroke="var(--text)" strokeWidth="1.2" fill="none" />
      <rect x="25" y="39.6" width="7.6" height="4.4" rx="2.2" fill="var(--k-setup)" />
      <circle cx="31" cy="41.8" r="1" fill="#1b2235" />
    </svg>
  );
}
