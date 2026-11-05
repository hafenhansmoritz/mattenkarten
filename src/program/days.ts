// 7-Tage-Startprogramm – Tagesplan (Spec: docs/superpowers/specs/2026-11-05-7-tage-startprogramm-design.md).
// Abruf nach 1, 2 und 4 Tagen (Cepeda 2008, Recherche 2). Tag 1–3 geblockt, ab Tag 4 gemischt.
// No-Gi-Reihenfolge (KB 8.12, research_notes/No-Gi Fokus/notes.md): 4 Guard No-Gi, 5 Stand & Hand Fighting,
// 6 Rücken & Front Headlock (plus Aufgabe als Prozess). Passieren mit Keilen bleibt als Kern-2-Lektion im Menü.

export type LessonRef =
  | { kind: "map" }                 // Tag 1: Positions-Landkarte (kein Match)
  | { kind: "k2"; id: string }      // Kern-2-Lektion (TUTORIALS_K2 oder LESSONS_PROGRAM)
  | { kind: "exam" };               // Tag 7: Prüfung

/** Ein Punkt für den Selbst-Check. check: true = keine direkte Quelle → Trainer prüfen. */
export interface DrillPoint { text: string; check?: boolean }

export interface Drill {
  title: string;
  /** Schritte, je ≤ 20 Wörter. */
  steps: string[];
  safety: string;
  /** Selbst-Check nach dem Drill: 2–3 Punkte zum Abhaken. */
  checks: DrillPoint[];
  /** Typische Fehler: 1–2. */
  mistakes: DrillPoint[];
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
  /** Bilderrätsel (Tag 1–4): „Wo bist du?“ / „Was ist hier falsch?“ – kommen nach den Rätseln. */
  pics?: string[];
  drill: Drill;
}

// Selbst-Check und typische Fehler der Drills: research_notes/7 Tage Startprogramm/notes.md, Abschnitt 3
// (Grapplearts Solo Drills, JitsuIQ Technical Stand-up, Evolve MMA Breakfalls, BJJ More: ausatmen) und KB 4.5
// (Frame → Bridge → Shrimp). check: true = nur eigene Ableitung → Trainer prüfen.
export const DAYS: ProgramDay[] = [
  {
    n: 1, title: "Positionen & Abklopfen",
    goal: "Du kennst die Positionen, dein Ziel oben und unten – und klopfst sicher ab.",
    why: "Wer die Landkarte kennt, versteht im Training jede Erklärung schneller.",
    lessons: [{ kind: "map" }],
    warmup: [],
    puzzle: ["q-pos-goal-bottom", "q-tap-when", "q-tap-release"],
    pics: ["qi-where-side", "qi-where-back"],
    drill: {
      title: "Brücke",
      steps: [
        "Leg dich auf den Rücken, Füße nah am Po.",
        "Hüfte hoch, kurz halten, langsam ablegen.",
        "3 Runden à 1 Minute, dazwischen 1 Minute Pause.",
      ],
      safety: "Gewicht auf Schultern und Füßen, nie auf dem Nacken. Und: Tap heißt sofort loslassen.",
      checks: [
        { text: "Du drückst über Schultern und Füße, nicht über den Kopf.", check: true },
        { text: "Hüfte ruhig hoch und langsam ab – nicht reißen." },
        { text: "Beim Hochgehen ausatmen." },
      ],
      mistakes: [
        { text: "Gewicht rutscht auf den Nacken.", check: true },
      ],
    },
  },
  {
    n: 2, title: "Raus aus dem Mount",
    goal: "Unten im Mount: erst Rahmen, dann Elbow Escape oder Upa.",
    why: "Erst raus, dann angreifen: Befreien ist dein erstes Ziel im Jiu-Jitsu.",
    lessons: [{ kind: "k2", id: "k2-raus-von-unten" }],
    warmup: ["q-pos-best", "q-pos-guard-name", "q-tap-how"],
    puzzle: ["q-mount-first", "q-mount-upa-trap", "q-mount-switch"],
    pics: ["qi-mount-elbows", "qi-mount-turn"],
    drill: {
      title: "Shrimp am Platz",
      steps: [
        "Auf den Rücken, Füße aufgestellt.",
        "Mit einem Fuß abdrücken, Hüfte zur Seite schieben.",
        "Zurück in die Mitte, dann die andere Seite. 3 Runden à 1 Minute.",
      ],
      safety: "Langsam und ruhig. Beim Bewegen ausatmen.",
      checks: [
        { text: "Der Fuß drückt ab, die Hüfte rutscht zur Seite." },
        { text: "Beide Seiten gleich oft." },
        { text: "Beim Bewegen ausatmen." },
      ],
      mistakes: [
        { text: "Nur die Schultern bewegen sich, die Hüfte bleibt liegen.", check: true },
        { text: "Immer nur die Lieblingsseite üben." },
      ],
    },
  },
  {
    n: 3, title: "Raus aus Side Control",
    goal: "Unten in Side Control: Rahmen, Hüfte weg, Guard zurück.",
    why: "Side Control kommt in jedem Training. Mit Rahmen und Hüfte kommst du raus.",
    lessons: [{ kind: "k2", id: "p-side-escape" }],
    warmup: ["q-mount-no-back", "q-mount-breathe", "q-pos-mount-name", "q-tap-dizzy"],
    puzzle: ["q-side-order", "q-side-goal", "q-side-underhook"],
    pics: ["qi-side-flat", "qi-where-half"],
    drill: {
      title: "Shrimp über die Matte + Brücke-Shrimp",
      steps: [
        "Shrimp hintereinander die Matte entlang, dann zurück.",
        "Danach: erst brücken, dann zur Seite shrimpen.",
        "2 Runden à 1 Minute pro Übung.",
      ],
      safety: "Mit Partner nur kooperativ: Er gibt nach, ihr bleibt langsam.",
      checks: [
        { text: "Erst brücken, dann shrimpen – nicht beides gleichzeitig." },
        { text: "Bei jedem Shrimp landet die Hüfte ein Stück weiter weg." },
      ],
      mistakes: [
        { text: "Shrimpen, ohne vorher mit der Brücke Platz zu schaffen." },
      ],
    },
  },
  {
    n: 4, title: "Guard in No-Gi",
    goal: "Oben: Haltung, Kopf hoch. Unten: Nacken und Arm greifen, Butterfly, aufstehen.",
    why: "Ohne Gi greifst du Körper statt Stoff. Und oben schützt du deinen Hals.",
    lessons: [{ kind: "k2", id: "p-guard-posture" }],
    warmup: ["q-side-frame", "q-mount-progress", "q-side-shrimp"],
    puzzle: ["q-guard-nogi-grip", "q-guard-top-posture", "q-guard-guillotine-top"],
    pics: ["qi-guard-posture", "qi-guard-flat"],
    drill: {
      title: "Guard-Haltung + Technical Stand-up",
      steps: [
        "Knie breit, Rücken gerade, Hände auf einem Kissen: Haltung 30 Sekunden halten.",
        "Dann Technical Stand-up: Hand hinten, Hand vorn, Bein durchziehen, aufstehen.",
        "Je Seite 5 Mal, langsam.",
      ],
      safety: "Rücken gerade. Mit Partner nie am Nacken reißen.",
      checks: [
        { text: "Haltung: Knie breit, Rücken gerade, Blick nach vorn." },
        { text: "Stand-up: Hand hinten stützt, das Bein zieht weit nach hinten durch." },
        { text: "Beide Seiten geübt, langsam und kontrolliert." },
      ],
      mistakes: [
        { text: "Rund im Rücken, zusammengesunken." },
        { text: "Hastig aufstehen ohne feste Basis." },
      ],
    },
  },
  {
    n: 5, title: "Stand & Hand Fighting",
    goal: "Handgelenk, Nacken, Underhook gewinnen – Snap Down und Sprawl. Shots nur solo.",
    why: "Jeder Kampf beginnt im Stand. Wer die Hände gewinnt, bestimmt, wo es hingeht.",
    lessons: [{ kind: "k2", id: "p-shot-sprawl" }],
    warmup: ["q-guard-elbows", "q-side-drill", "q-pos-goal-top", "q-guard-best-bottom"],
    puzzle: ["q-stand-wrist", "q-stand-underhook", "q-stand-sprawl"],
    drill: {
      title: "Sprawl solo + Fallen aus dem Sitz",
      steps: [
        "Aus dem Stand: Hände runter, Beine nach hinten, Hüfte zur Matte. Aufstehen. 10 Mal.",
        "Im Sitz: Kinn zur Brust, nach hinten abrollen, Arme schlagen auf. 10 Mal.",
      ],
      safety: "Keine Würfe oder Takedowns mit Partner ohne Trainer. Kinn zur Brust.",
      checks: [
        { text: "Beim Fallen bleibt das Kinn auf der Brust." },
        { text: "Die Arme schlagen auf, wenn der Rücken die Matte berührt." },
        { text: "Sprawl: Hüfte zur Matte, Beine weit nach hinten." },
      ],
      mistakes: [
        { text: "Der Kopf schlägt nach hinten auf die Matte." },
        { text: "Luft anhalten statt ausatmen." },
      ],
    },
  },
  {
    n: 6, title: "Rücken & Front Headlock",
    goal: "Rücken schützen, Hals verteidigen – und eine Aufgabe sicher ansetzen.",
    why: "In No-Gi sind Rücken und Front Headlock zentral. Erst den Hals schützen, dann selbst beenden.",
    lessons: [{ kind: "k2", id: "p-back-protect" }, { kind: "k2", id: "k2-erst-griff-dann-beenden" }],
    warmup: ["q-stand-orthodox", "q-stand-breakfall", "q-guard-standup", "q-mount-switch"],
    puzzle: ["q-sub-rnc-def", "q-back-headlock", "q-back-seatbelt"],
    drill: {
      title: "Stand-up + Shrimp-Flow",
      steps: [
        "Shrimp links, Shrimp rechts, dann Technical Stand-up.",
        "Wieder hinsetzen und von vorn. 3 Runden à 1 Minute.",
      ],
      safety: "Aufgaben nie bis zum Druck üben – das gehört in die Halle.",
      checks: [
        { text: "Beide Seiten gleich oft." },
        { text: "Beim Aufstehen ist eine Hand vorn als Schutz." },
        { text: "Sauber statt schnell." },
      ],
      mistakes: [
        { text: "Schwache Basis beim Aufstehen – du kippst leicht um." },
      ],
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
      checks: [
        { text: "Brücke ohne Gewicht auf dem Nacken.", check: true },
        { text: "Beim Fallen Kinn zur Brust." },
        { text: "Ruhig geatmet, jede Übung beidseitig." },
      ],
      mistakes: [
        { text: "Tempo vor Sauberkeit." },
      ],
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
  { id: "bein", text: "Beinhebel: früh abklopfen, nie rausdrehen – Heel Hooks sind für Weißgurte verboten" },
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
  "Beinhebel (Heel Hook für Weißgurte verboten; früh abklopfen, nie rausdrehen)",
  "Fallen aus dem Stand",
];
