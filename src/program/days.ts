// 7-Tage-Startprogramm – Tagesplan (Spec: docs/superpowers/specs/2026-11-05-7-tage-startprogramm-design.md).
// Abruf nach 1, 2 und 4 Tagen (Cepeda 2008, Recherche 2). Tag 1–3 geblockt, ab Tag 4 gemischt.

export type LessonRef =
  | { kind: "map" }                 // Tag 1: Positions-Landkarte (kein Match)
  | { kind: "k2"; id: string }      // Kern-2-Lektion (TUTORIALS_K2 oder LESSONS_PROGRAM)
  | { kind: "exam" };               // Tag 7: Prüfung

export interface Drill {
  title: string;
  /** Schritte, je ≤ 20 Wörter. */
  steps: string[];
  safety: string;
}

export interface ProgramDay {
  n: number;
  title: string;
  /** Tagesziel (≤ 15 Wörter). */
  goal: string;
  /** „Warum heute das?“ (≤ 20 Wörter). */
  why: string;
  lessons: LessonRef[];
  /** Abruf-Fragen (Aufwärmen) – nur Inhalte früherer Tage. */
  warmup: string[];
  /** Rätsel: 2–3 Fragen zum Thema des Tages. */
  puzzle: string[];
  drill: Drill;
}

export const DAYS: ProgramDay[] = [
  {
    n: 1, title: "Positionen & Abklopfen",
    goal: "Du kennst die Positionen, dein Ziel oben und unten – und klopfst sicher ab.",
    why: "Wer die Landkarte kennt, versteht im Training jede Erklärung schneller.",
    lessons: [{ kind: "map" }],
    warmup: [],
    puzzle: ["q-pos-goal-bottom", "q-tap-when", "q-tap-release"],
    drill: {
      title: "Brücke",
      steps: [
        "Leg dich auf den Rücken, Füße nah am Po.",
        "Hüfte hoch, kurz halten, langsam ablegen.",
        "3 Runden à 1 Minute, dazwischen 1 Minute Pause.",
      ],
      safety: "Gewicht auf Schultern und Füßen, nie auf dem Nacken. Und: Tap heißt sofort loslassen.",
    },
  },
  {
    n: 2, title: "Raus aus dem Mount",
    goal: "Unten im Mount: erst Rahmen, dann Elbow Escape oder Upa.",
    why: "Erst raus, dann angreifen: Befreien ist dein erstes Ziel im Jiu-Jitsu.",
    lessons: [{ kind: "k2", id: "k2-raus-von-unten" }],
    warmup: ["q-pos-best", "q-pos-guard-name", "q-tap-how"],
    puzzle: ["q-mount-first", "q-mount-upa-trap", "q-mount-switch"],
    drill: {
      title: "Shrimp am Platz",
      steps: [
        "Auf den Rücken, Füße aufgestellt.",
        "Mit einem Fuß abdrücken, Hüfte zur Seite schieben.",
        "Zurück in die Mitte, dann die andere Seite. 3 Runden à 1 Minute.",
      ],
      safety: "Langsam und ruhig. Beim Bewegen ausatmen.",
    },
  },
  {
    n: 3, title: "Raus aus Side Control",
    goal: "Unten in Side Control: Rahmen, Hüfte weg, Guard zurück.",
    why: "Side Control kommt in jedem Training. Mit Rahmen und Hüfte kommst du raus.",
    lessons: [{ kind: "k2", id: "p-side-escape" }],
    warmup: ["q-mount-no-back", "q-mount-breathe", "q-pos-mount-name", "q-tap-dizzy"],
    puzzle: ["q-side-order", "q-side-goal", "q-side-underhook"],
    drill: {
      title: "Shrimp über die Matte + Brücke-Shrimp",
      steps: [
        "Shrimp hintereinander die Matte entlang, dann zurück.",
        "Danach: erst brücken, dann zur Seite shrimpen.",
        "2 Runden à 1 Minute pro Übung.",
      ],
      safety: "Mit Partner nur kooperativ: Er gibt nach, ihr bleibt langsam.",
    },
  },
  {
    n: 4, title: "Guard oben & unten",
    goal: "Oben: Haltung halten. Unten: Haltung brechen.",
    why: "In der Guard landest du ständig. Oben und unten zählt etwas anderes.",
    lessons: [{ kind: "k2", id: "p-guard-posture" }],
    warmup: ["q-side-frame", "q-mount-progress", "q-side-shrimp"],
    puzzle: ["q-guard-top-posture", "q-guard-bottom-break", "q-guard-hipbump"],
    drill: {
      title: "Guard-Haltung + Technical Stand-up",
      steps: [
        "Knie breit, Rücken gerade, Hände auf einem Kissen: Haltung 30 Sekunden halten.",
        "Dann Technical Stand-up: Hand hinten, Hand vorn, Bein durchziehen, aufstehen.",
        "Je Seite 5 Mal, langsam.",
      ],
      safety: "Rücken gerade. Mit Partner nie am Nacken reißen.",
    },
  },
  {
    n: 5, title: "Stand: Auslage, Distanz, Sprawl",
    goal: "Du kennst deine Auslage, gehst tief zum Shot und sprawlst gegen einen Shot.",
    why: "Jeder Kampf beginnt im Stand. Heute lernst du, oben zu landen statt unten.",
    lessons: [{ kind: "k2", id: "p-shot-sprawl" }],
    warmup: ["q-guard-elbows", "q-side-drill", "q-pos-goal-top", "q-guard-best-bottom"],
    puzzle: ["q-stand-sprawl", "q-stand-level", "q-stand-head"],
    drill: {
      title: "Sprawl solo + Fallen aus dem Sitz",
      steps: [
        "Aus dem Stand: Hände runter, Beine nach hinten, Hüfte zur Matte. Aufstehen. 10 Mal.",
        "Im Sitz: Kinn zur Brust, nach hinten abrollen, Arme schlagen auf. 10 Mal.",
      ],
      safety: "Keine Würfe oder Takedowns mit Partner ohne Trainer. Kinn zur Brust.",
    },
  },
  {
    n: 6, title: "Keile, Passieren, Aufgabe",
    goal: "Mit Keilen festhalten, vorbeigehen – und eine Aufgabe sicher ansetzen und abwehren.",
    why: "Du kennst jetzt die Wege raus. Heute lernst du festhalten und sicher beenden.",
    lessons: [{ kind: "k2", id: "k2-keile-vorbeigehen" }, { kind: "k2", id: "k2-erst-griff-dann-beenden" }],
    warmup: ["q-stand-orthodox", "q-stand-breakfall", "q-guard-standup", "q-mount-switch"],
    puzzle: ["q-wedge-before-pass", "q-sub-order", "q-sub-rnc-def"],
    drill: {
      title: "Stand-up + Shrimp-Flow",
      steps: [
        "Shrimp links, Shrimp rechts, dann Technical Stand-up.",
        "Wieder hinsetzen und von vorn. 3 Runden à 1 Minute.",
      ],
      safety: "Aufgaben nie bis zum Druck üben – das gehört in die Halle.",
    },
  },
  {
    n: 7, title: "Prüfung",
    goal: "12 gemischte Fragen. Danach optional das Boss-Match.",
    why: "Heute prüfst du dein Wissen. Das Können kommt auf der Matte mit deinem Trainer.",
    lessons: [{ kind: "exam" }],
    warmup: [],
    puzzle: [],
    drill: {
      title: "Alles einmal",
      steps: [
        "Je 1 Minute: Brücke, Shrimp, Technical Stand-up, Fallen aus dem Sitz.",
        "Ruhig atmen, sauber statt schnell.",
      ],
      safety: "Weiche Unterlage. Bei Schmerz sofort stoppen.",
    },
  },
];

/** Abruf-Plan laut Spec: welche früheren Tage am Tag n abgefragt werden. */
export const RETRIEVAL_PLAN: Record<number, number[]> = {
  1: [], 2: [1], 3: [2, 1], 4: [3, 2], 5: [4, 3, 1], 6: [5, 4, 2],
};

/** Checkliste „Bereit fürs erste Training“ (Spec). */
export const READY_CHECKLIST: { id: string; text: string; check?: boolean }[] = [
  { id: "frueh", text: "10–15 Minuten früher da sein" },
  { id: "naegel", text: "Finger- und Fußnägel kurz" },
  { id: "schmuck", text: "Schmuck ab" },
  { id: "sauber", text: "Geduscht, saubere Kleidung, Badelatschen, Wasser" },
  { id: "neu", text: "Dem Partner sagen: „Ich bin neu“ – und Verletzungen nennen" },
  { id: "tap", text: "Früh und deutlich abklopfen (Hand, Fuß oder Wort)" },
  { id: "kraft", text: "Mit 60–70 % Kraft arbeiten" },
  { id: "fragen", text: "Vor dem Drillen fragen" },
  { id: "frage", text: "Eine Frage pro Stunde an den Trainer mitbringen" },
  { id: "haut", text: "Bei Hautausschlag oder Infekt nicht trainieren", check: true },
];

/** Was du nicht allein übst (Spec). */
export const NOT_ALONE = [
  "Würfe und Takedowns mit Partner",
  "Rollen über Kopf oder Nacken",
  "Aufgaben bis zum Druck",
  "Freies Sparring",
  "Beinhebel",
  "Fallen aus dem Stand",
];
