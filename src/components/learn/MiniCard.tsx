import type { CardDef } from "../../engine/types";
import { Card } from "../Card";
import { CardArt } from "../CardArt";
import { CARD } from "../../data/cards";
import { KIND_VERB, plainName } from "./kinds";

export interface MiniCardProps {
  id: string;
  /** Beschriftung über der Karte, z. B. "Du" / "Er". */
  caption?: string;
  glow?: boolean;
  dim?: boolean;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  /** Alltagsname unter der Karte zeigen (Default: true). */
  showPlain?: boolean;
}

/** Mini-Karte aus CARD-Lookup + Alltagsname darunter. Unbekannte Ids zeigen einen Platzhalter. */
export function MiniCard({ id, caption, glow, dim, onClick, selected, disabled, showPlain = true }: MiniCardProps) {
  const card: CardDef | undefined = CARD[id];
  return (
    <figure className={`lr-mini${glow ? " glow" : ""}${dim ? " dim" : ""}${card ? ` k-${card.kind}` : ""}`}>
      {caption && <figcaption className="label lr-mini-cap">{caption}</figcaption>}
      {card ? (
        <Card card={card} size="mini" art={<CardArt card={card} size={72} />} onClick={onClick} selected={selected} disabled={disabled} />
      ) : (
        <div className="lr-mini-missing">{id}</div>
      )}
      {showPlain && card && (
        <span className="lr-mini-plain">
          <b>{plainName(card)}</b>
          <small className={`k-${card.kind}`}>{KIND_VERB[card.kind]}</small>
        </span>
      )}
    </figure>
  );
}
