import { useCallback, useId, useRef, type ReactNode, type PointerEvent as RPointerEvent, type KeyboardEvent as RKeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { CardDef, CardKind } from "../engine/types";
import { KIND_LABEL, RARITY_LABEL, countersText, effectText } from "./cardText";

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
  const ariaLabel = faceDown
    ? "Verdeckte Karte"
    : `${card.name}${card.de ? `, ${card.de}` : ""}. ${KIND_LABEL[card.kind]}, ${card.gas} Gas. ${effectText(card)}${disabled && reason ? `. Gesperrt: ${reason}` : ""}`;

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
      <div className="mk-tilt">
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
    chips.push(
      <span key="ctl" className="mk-chip mk-chip-control" title={`Braucht Kontrolle ${card.requiresControl}`}>
        <span className="mk-short">Kontr. {card.requiresControl}</span>
        <span className="mk-long">Braucht Kontrolle {card.requiresControl}</span>
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
        <span className="mk-kind-label">{KIND_LABEL[card.kind]}</span>
        <span className="mk-gem num" title={`${card.gas} Gas`}>
          {card.gas}
          <span className="mk-gem-label">Gas</span>
        </span>
      </div>
      <div className="mk-head">
        <h3 className="mk-title">{card.name}</h3>
        {card.de && <p className="mk-de">{card.de}</p>}
      </div>
      <div className="mk-art">
        {art ?? <ArtPattern kind={card.kind} />}
        {card.basic && <span className="mk-ribbon">Grundtechnik</span>}
      </div>
      {chips.length > 0 && <div className="mk-stats">{chips}</div>}
      {counters && <p className="mk-counters">{counters}</p>}
      {fx && <p className="mk-fx">{fx}</p>}
      {!card.basic && <span className="sr-only">{RARITY_LABEL[card.rarity]}</span>}
      <div className="mk-foil" aria-hidden="true" />
      <div className="mk-glare" aria-hidden="true" />
    </div>
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
