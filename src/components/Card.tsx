import { useCallback, useId, useRef, type ReactNode, type PointerEvent as RPointerEvent, type KeyboardEvent as RKeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { CardDef, CardKind } from "../engine/types";
import { KIND_LABEL, RARITY_LABEL, countersText, effectText, plainTitle } from "./cardText";
import { RES } from "../data/positions";

export type CardSize = "hand" | "large" | "mini";

export interface CardProps {
  card: CardDef;
  size?: CardSize;
  faceDown?: boolean;
  selected?: boolean;
  disabled?: boolean;
  reason?: string;
  art?: ReactNode;
  count?: number;
  onClick?: () => void;
  layoutId?: string;
}

const MAX_TILT = 12; // deg

const spring = { type: "spring", stiffness: 520, damping: 30, mass: 0.7 } as const;

export function Card(props: CardProps) {
  const { card, size = "hand", faceDown = false, selected = false, disabled = false, reason, art, count, onClick, layoutId } = props;
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const clickable = !!onClick && !disabled;
  const interactive = !reduce && size !== "mini";

  const setVars = useCallback((vars: Record<string, string>) => {
    const el = ref.current;
    if (!el) return;
    for (const k in vars) el.style.setProperty(k, vars[k]);
  }, []);

  const onPointerMove = useCallback(
    (e: RPointerEvent<HTMLDivElement>) => {
      if (!interactive) return;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      const cx = px - 0.5;
      const cy = py - 0.5;
      const hyp = Math.min(1, Math.sqrt(cx * cx + cy * cy) * 2);
      el.classList.add("is-active");
      setVars({
        "--px": px.toFixed(3),
        "--py": py.toFixed(3),
        "--mx": `${(px * 100).toFixed(1)}%`,
        "--my": `${(py * 100).toFixed(1)}%`,
        "--rx": `${(-cy * 2 * MAX_TILT).toFixed(2)}deg`,
        "--ry": `${(cx * 2 * MAX_TILT).toFixed(2)}deg`,
        "--hyp": hyp.toFixed(3),
        "--active": "1",
      });
    },
    [interactive, setVars],
  );

  const onPointerLeave = useCallback(() => {
    ref.current?.classList.remove("is-active");
    setVars({ "--px": "0.5", "--py": "0.5", "--mx": "50%", "--my": "50%", "--rx": "0deg", "--ry": "0deg", "--hyp": "0", "--active": "0" });
  }, [setVars]);

  const onKeyDown = useCallback(
    (e: RKeyboardEvent<HTMLDivElement>) => {
      if (!clickable) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick?.();
      }
    },
    [clickable, onClick],
  );

  const cls = [
    "mk-card",
    `mk-size-${size}`,
    // face-down cards must not leak kind or rarity through the frame
    faceDown ? "" : `mk-kind-${card.kind}`,
    faceDown ? "mk-r-back" : `mk-r-${card.basic ? "basis" : card.rarity}`,
    card.basic && !faceDown ? "mk-basic" : "",
    selected ? "mk-selected" : "",
    faceDown ? "mk-facedown" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const lift = size === "mini" ? 0 : selected ? -24 : 0;
  const title = plainTitle(card);
  const ariaLabel = faceDown
    ? "Verdeckte Karte"
    : `${title}${title !== card.name ? ` (${card.name})` : ""}. ${KIND_LABEL[card.kind]}, kostet ${card.gas} ${RES.gas.name}. ${card.plainDo ?? effectText(card)}${
        card.requiresControl ? ` Braucht ${card.requiresControl} ${RES.control.name}.` : ""
      }${disabled && reason ? ` Gesperrt: ${reason}` : ""}`;

  return (
    <motion.div
      ref={ref}
      layoutId={layoutId}
      className={cls}
      data-clickable={clickable ? "true" : "false"}
      role={onClick ? "button" : "img"}
      tabIndex={onClick && !disabled ? 0 : undefined}
      aria-label={ariaLabel}
      aria-pressed={onClick ? selected : undefined}
      aria-disabled={disabled ? "true" : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={onKeyDown}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerLeave}
      initial={false}
      animate={{ y: lift, scale: selected && size !== "mini" ? 1.08 : 1 }}
      whileHover={
        reduce || disabled || size === "mini"
          ? undefined
          : { y: selected ? -26 : -12, scale: selected ? 1.08 : 1.05, transition: { duration: 0.15, ease: [0.2, 0.7, 0.2, 1] } }
      }
      whileTap={clickable ? { scale: 0.97, transition: { duration: 0.08 } } : undefined}
      transition={spring}
      style={{ zIndex: selected ? 2 : undefined }}
    >
      <div className="mk-tilt" aria-hidden="true">
        <div className="mk-edge">{faceDown ? <CardBack /> : <CardFront card={card} art={art} />}</div>
      </div>
      {typeof count === "number" && count > 1 && (
        <span className="mk-count num" aria-hidden="true">
          ×{count}
        </span>
      )}
      {disabled && reason && !faceDown && (
        <span className="mk-reason" aria-hidden="true">
          {reason}
        </span>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------ */

function CardFront({ card, art }: { card: CardDef; art?: ReactNode }) {
  const counters = countersText(card);
  const fx = effectText(card);
  const title = plainTitle(card);
  const hasPlain = title !== card.name;
  const showDe = !!card.de && card.de !== title && card.de !== card.name;
  const lead = card.plainDo ?? fx;
  const longest = title.split(/\s+/).reduce((m, w) => Math.max(m, w.length), 0);
  const titleCls = `mk-title${title.length > 18 || longest > 12 ? " mk-title-long" : ""}`;
  const chips: ReactNode[] = [];

  if (card.kind === "angriff" && typeof card.tempo === "number") {
    chips.push(
      <span key="tempo" className="mk-chip mk-chip-tempo" title={`Tempo ${card.tempo} (1 = schnell)`}>
        <span className="mk-short">T{card.tempo}</span>
        <span className="mk-long">Tempo {card.tempo}</span>
        <TempoPips tempo={card.tempo} />
      </span>,
    );
  }
  if (card.success?.points) {
    chips.push(
      <span key="pts" className="mk-chip mk-chip-points">
        +{card.success.points}
      </span>,
    );
  }
  if (card.submission) {
    chips.push(
      <span key="fin" className="mk-chip mk-chip-finish">
        Finish
      </span>,
    );
  }
  if (card.requiresControl) {
    const t = `Braucht ${card.requiresControl} ${RES.control.name}`;
    chips.push(
      <span key="ctl" className="mk-chip mk-chip-control" title={t}>
        <GripIcon />
        <span className="mk-short">
          {card.requiresControl} {RES.control.name}
        </span>
        <span className="mk-long">{t}</span>
      </span>,
    );
  }
  if (card.dilemmaWith) {
    chips.push(
      <span key="dil" className="mk-chip mk-chip-dilemma">
        Dilemma
      </span>,
    );
  }

  return (
    <div className="mk-face mk-front">
      <div className="mk-band">
        <span className="mk-kind-label">
          <KindIcon kind={card.kind} />
          {KIND_LABEL[card.kind]}
        </span>
        <span className="mk-gem-wrap" title={`Kostet ${card.gas} ${RES.gas.name}`}>
          <span className="mk-gem-name" aria-hidden="true">
            {RES.gas.name}
          </span>
          <span className="mk-gem num">
            {card.gas}
            <span className="mk-gem-label">{RES.gas.name}</span>
          </span>
          <span className="mk-gem-tag" aria-hidden="true">
            <BreathIcon />
          </span>
        </span>
      </div>
      <div className="mk-head">
        <h3 className={titleCls} lang="de">
          {title}
        </h3>
        {hasPlain && <p className="mk-tech">{card.name}</p>}
        {showDe && <p className="mk-de">{card.de}</p>}
      </div>
      <div className="mk-art">
        <div className="mk-art-inner">{art ?? <ArtPattern kind={card.kind} />}</div>
        {card.basic && <span className="mk-ribbon">Grundtechnik</span>}
      </div>
      {chips.length > 0 && <div className="mk-stats">{chips}</div>}
      {lead && (
        <p className="mk-do" lang="de">
          {lead}
        </p>
      )}
      {card.plainDo && fx && <p className="mk-fx">{fx}</p>}
      {!card.plainDo && counters && <p className="mk-counters">{counters}</p>}
      {!card.basic && <span className="sr-only">{RARITY_LABEL[card.rarity]}</span>}
      <div className="mk-foil" aria-hidden="true" />
      <div className="mk-glare" aria-hidden="true" />
    </div>
  );
}

/** Kleine Verb-Icons im Kartenband: Pfeil (angreifen), Zahnrad (vorbereiten), Schild (kontern). */
function KindIcon({ kind }: { kind: CardKind }) {
  return (
    <svg className="mk-kind-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {kind === "angriff" ? (
        <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 13 L12 4" />
          <path d="M7 3.5 H12.5 V9" />
          <path d="M2.5 10.5 L5.5 13.5" />
        </g>
      ) : kind === "setup" ? (
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="8" cy="8" r="2.4" />
          <path d="M8 1.8v2M8 12.2v2M1.8 8h2M12.2 8h2M3.6 3.6l1.4 1.4M11 11l1.4 1.4M3.6 12.4 5 11M11 5l1.4-1.4" />
        </g>
      ) : (
        <path
          d="M8 1.8 L13.5 3.8 V8 C13.5 11.2 11 13.4 8 14.4 C5 13.4 2.5 11.2 2.5 8 V3.8 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

/** Puste: drei Luftstriche. */
function BreathIcon() {
  return (
    <svg viewBox="0 0 16 16" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M2 5.5h7.5a2 2 0 1 0-2-2" />
        <path d="M2 9h10a2 2 0 1 1-2 2" />
        <path d="M2 12.5h4" />
      </g>
    </svg>
  );
}

/** Griff: geschlossene Faust/Klammer. */
function GripIcon() {
  return (
    <svg className="mk-chip-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7V5a1.5 1.5 0 0 1 3 0v2M7 6.5V4.5a1.5 1.5 0 0 1 3 0V7M10 6.5a1.5 1.5 0 0 1 3 0V9a5 5 0 0 1-5 5H7.5A4.5 4.5 0 0 1 3 9.5V8a1 1 0 0 1 1-1h3" />
      </g>
    </svg>
  );
}

function TempoPips({ tempo }: { tempo: number }) {
  // 1 = schnell -> 5 Balken, 5 = langsam -> 1 Balken
  const speed = Math.max(1, Math.min(5, 6 - tempo));
  return (
    <span className="mk-pips" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={`mk-pip${i < speed ? " on" : ""}`} />
      ))}
    </span>
  );
}

export function CardBack() {
  return (
    <div className="mk-face mk-back" aria-hidden="true">
      <div className="mk-back-ring" />
      <div className="mk-back-circle">
        <span className="mk-monogram">
          <b>M</b>
          <i>K</i>
        </span>
      </div>
      <span className="mk-back-word">Mattenkarten</span>
      <div className="mk-back-sheen" />
    </div>
  );
}

/** Default art: competition-mat motif, accent in kind color. */
function ArtPattern({ kind }: { kind: CardKind }) {
  const uid = useId().replace(/:/g, "");
  const motif =
    kind === "angriff" ? (
      // forward chevrons: pressure
      <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M30 34 L50 50 L30 66" opacity="0.35" />
        <path d="M46 34 L66 50 L46 66" opacity="0.65" />
        <path d="M62 34 L82 50 L62 66" />
      </g>
    ) : kind === "setup" ? (
      // grip lattice: control building
      <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
        <circle cx="60" cy="50" r="10" />
        <circle cx="60" cy="50" r="20" opacity="0.6" />
        <circle cx="60" cy="50" r="30" opacity="0.3" />
      </g>
    ) : (
      // frame / shield: reaction
      <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 26 L82 34 L82 52 C82 64 72 72 60 76 C48 72 38 64 38 52 L38 34 Z" />
        <path d="M50 51 L58 59 L71 43" opacity="0.7" />
      </g>
    );

  return (
    <div className="mk-art-pattern" aria-hidden="true">
      <svg viewBox="0 0 120 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id={`t${uid}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0 L0 0 0 20" fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="1" />
          </pattern>
          <radialGradient id={`g${uid}`} cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="120" height="100" fill={`url(#t${uid})`} />
        <circle cx="60" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        <circle cx="60" cy="50" r="46" fill={`url(#g${uid})`} />
        <line x1="0" y1="50" x2="120" y2="50" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        {motif}
      </svg>
    </div>
  );
}
