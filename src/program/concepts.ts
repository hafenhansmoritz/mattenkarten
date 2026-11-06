// Grundkonzepte, die an einem Tag eingeführt und an späteren Tagen wieder aufgegriffen werden.
// Schutzhaltung (defense first), Quellen:
// - Cursa, BJJ Starter Guide (KB 2.4/5.1): „Reconnect elbows to ribs … to prevent arm isolation“,
//   „Protect the neck: … hands to defend the space around your neck“, „Keep chin neutral (not cranked)“,
//   „don't turn away and give your back“. https://cursa.app/en/page/bjj-starter-guide-safety-tapping-and-positional-priorities
// - Danaher (KB 2.4): „the pathway to attack is through your confidence in your defense“.
// - Priit Mihkelson, „Grilled Chicken“: kompakte Schutzform mit Ellbogen-Knie-Verbindung, „Protect your spine first“
//   – nur über Rezensionsseite belegt [Marketing: Affiliate-Links]. https://bjjmore.com/grilled-chicken-guard-retention-system/
// - RNC-Abwehr „Kinn runter“: KB 4.5 (BJJ Atlas RNC, Evolve MMA RNC).
import type { BodyPart } from "../components/fighters";
import type { Joint } from "../components/fighters";

export type ConceptId = "schutz";

export interface ConceptPoint {
  id: string;
  /** Kurzname auf dem Punkt. */
  short: string;
  /** Ein Satz: was und warum. */
  text: string;
  /** Hervorhebung auf der Figur. */
  part: BodyPart;
  /** Gelenk der blauen Figur, an dem der Tipp-Punkt sitzt. */
  joint: Joint | "torso";
  src: string;
  check?: boolean;
}

export interface Concept {
  id: ConceptId;
  title: string;
  /** Ein Satz Idee. */
  idea: string;
  points: ConceptPoint[];
  /** Fragen (questions.ts), die das Konzept abfragen. */
  questions: string[];
  sources: { label: string; url: string; marketing?: boolean }[];
}

export const SCHUTZHALTUNG: Concept = {
  id: "schutz",
  title: "Schutzhaltung",
  idea: "Unter Druck gilt: erst schützen, dann befreien. Vier Punkte, die du überall mitnimmst.",
  points: [
    { id: "ellbogen", short: "Ellbogen eng", text: "Ellbogen eng am Körper. So kann er deinen Arm nicht isolieren.", part: "arms", joint: "elbowF", src: "Cursa; KB 4.5" },
    { id: "kinn", short: "Kinn unten", text: "Kinn leicht runter, locker. Würgt er von hinten, Kinn fest zur Brust.", part: "head", joint: "head", src: "Cursa (Grundhaltung); KB 4.5 (RNC-Abwehr: Kinn zur Brust)" },
    { id: "haende", short: "Hände vorn", text: "Hände vorn, nah am Hals. Sie schützen den Raum, den ein Würger braucht.", part: "neck", joint: "handF", src: "Cursa" },
    { id: "ruecken", short: "Rücken nie zeigen", text: "Nie wegdrehen und den Rücken zeigen. Dreh dich zu ihm, nicht weg.", part: "torso", joint: "torso", src: "Cursa; KB 3.2" },
  ],
  questions: ["q-schutz-elbows", "q-schutz-neck", "q-schutz-back"],
  sources: [
    { label: "Cursa: BJJ Starter Guide – Safety & Positional Priorities", url: "https://cursa.app/en/page/bjj-starter-guide-safety-tapping-and-positional-priorities" },
    { label: "BJJ More: Grilled Chicken (Priit Mihkelson)", url: "https://bjjmore.com/grilled-chicken-guard-retention-system/", marketing: true },
  ],
};

export const CONCEPTS: Record<ConceptId, Concept> = { schutz: SCHUTZHALTUNG };
