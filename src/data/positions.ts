// ============================================================
// Positions-Steckbriefe für Neulinge (Alltagssprache zuerst, Fachbegriff klein).
// Rangfolge nach Positionshierarchie (KB 3.2): Back > Mount > Side/KOB > Guard (neutral) > Side unten > Mount unten > Back unten.
// ============================================================
import type { CardKind, PositionGuide, PositionId, Role } from "../engine/types";

export const POSITION_GUIDE: Record<PositionId, PositionGuide> = {
  dist: {
    pos: "dist",
    plain: "Auf Abstand",
    term: "Distanz",
    oneLiner: "Ihr steht euch gegenüber, ohne euch zu berühren.",
    goal: { neutral: "Reingehen – an die Beine oder umklammern." },
    danger: { neutral: "Er schießt tief auf deine Beine." },
    rank: { neutral: 0 },
  },
  clinch: {
    pos: "clinch",
    plain: "Eng umklammert",
    term: "Clinch",
    oneLiner: "Ihr steht und haltet euch gegenseitig fest umklammert.",
    goal: { neutral: "Kopf runterdrücken oder ihn umwerfen." },
    danger: { neutral: "Er wirft dich über die Hüfte." },
    rank: { neutral: 0 },
  },
  fhl: {
    pos: "fhl",
    plain: "Kopf unterm Arm",
    term: "Front Headlock",
    oneLiner: "Sein Kopf steckt vorne unter deinem Arm, er ist gebückt.",
    goal: {
      top: "Kopf festhalten, hinter ihn kommen.",
      bottom: "Kopf raus, aufrichten.",
    },
    danger: {
      top: "Er taucht unter und greift deine Beine.",
      bottom: "Er würgt dich am Hals.",
    },
    rank: { top: 2, bottom: -1 },
  },
  guard: {
    pos: "guard",
    plain: "Beine um ihn",
    term: "Guard",
    oneLiner: "Einer liegt unten und hält den anderen mit den Beinen.",
    goal: {
      top: "Aufrecht bleiben, Beine überwinden.",
      bottom: "Haltung brechen, umwerfen oder beenden.",
    },
    danger: {
      top: "Arme nach vorne lassen – er hebelt oder würgt.",
      bottom: "Er drückt deine Beine weg und kommt quer.",
    },
    rank: { top: 1, bottom: 0 },
  },
  side: {
    pos: "side",
    plain: "Quer drauf",
    term: "Side Control",
    oneLiner: "Einer liegt quer über dem anderen, Brust auf Brust.",
    goal: {
      top: "Druck halten, aufsitzen oder Arm greifen.",
      bottom: "Arme als Rahmen, Hüfte weg, Knie rein.",
    },
    danger: {
      top: "Er dreht die Hüfte weg und holt die Beine zurück.",
      bottom: "Flach liegen bleiben – er sitzt gleich drauf.",
    },
    rank: { top: 3, bottom: -2 },
  },
  mount: {
    pos: "mount",
    plain: "Draufsitzen",
    term: "Mount",
    oneLiner: "Einer sitzt rittlings auf dem Bauch des anderen.",
    goal: {
      top: "Griff aufbauen, dann beenden.",
      bottom: "Raus hier – brücken oder Knie rein.",
    },
    danger: {
      top: "Zu hoch, zu wackelig – er brückt dich runter.",
      bottom: "Arme ausstrecken – er hebelt den Arm.",
    },
    rank: { top: 4, bottom: -3 },
  },
  back: {
    pos: "back",
    plain: "Im Rücken",
    term: "Back Control",
    oneLiner: "Einer klebt hinten am anderen, Beine um seine Hüfte.",
    goal: {
      top: "Haken drin lassen, Hals greifen.",
      bottom: "Hals schützen, Schultern auf die Matte.",
    },
    danger: {
      top: "Er rutscht seitlich weg auf den Rücken.",
      bottom: "Kinn hoch – sein Arm kommt um den Hals.",
    },
    rank: { top: 5, bottom: -4 },
  },
};

/** Kurze UI-Zeile: "Draufsitzen (unten): Raus hier – brücken oder Knie rein." */
export function goalLine(pos: PositionId, role: Role): string {
  const g = POSITION_GUIDE[pos];
  const goal = g.goal[role] ?? g.goal.neutral ?? g.goal.top ?? "";
  const roleText = role === "top" ? " (oben)" : role === "bottom" ? " (unten)" : "";
  return `${g.plain}${roleText}: ${goal}`;
}

/** Kartentypen als Verben (Neulinge): Wirkung statt Kategorie. */
export const KIND_VERB: Record<CardKind, { verb: string; short: string; explain: string }> = {
  angriff: {
    verb: "Angreifen",
    short: "Angriff",
    explain: "Angreifen schlägt Aufbauen – wer zögert, wird erwischt.",
  },
  setup: {
    verb: "Aufbauen",
    short: "Aufbauen",
    explain: "Aufbauen lockt den Rahmen ins Leere – er wartet, du baust auf.",
  },
  reaktion: {
    verb: "Rahmen",
    short: "Rahmen",
    explain: "Rahmen stoppt den passenden Angriff – aber nur den passenden.",
  },
};

/** Ressourcen in Alltagssprache (immer Icon + Wort zeigen). */
export const RES = {
  gas: { name: "Atem", explain: "Deine Ausdauer. Jede Karte kostet Atem – ohne Atem geht nichts." },
  control: { name: "Griff", explain: "Wie fest du ihn kontrollierst. Aufgabegriffe brauchen genug Griff." },
  opening: { name: "Lücke", explain: "Er ist offen: Dein nächster passender Angriff kommt schneller durch." },
} as const;
