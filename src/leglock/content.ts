// Woche 2: Beinhebel sicher – Inhalte (Schritte 43–48 des 100-Schritte-Plans).
// Keine spielbaren Beinhebel-Angriffskarten: nur Regelkunde, Verteidigung, Erkennen und Abklopfen.
// Regeln: IBJJF-Primärquellen am 2026-11-05 abgerufen (KB 8.12.2, research_notes/No-Gi Fokus/notes.md).
// Jede Regelaussage ist entweder belegt (verified + Quelle) oder trägt den Marker UNVERIFIED_MARK.
// Satzlänge: höchstens 20 Wörter pro Satz (Test in leglock.test.ts).

/** Marker für Regelaussagen ohne Primärbeleg. */
export const UNVERIFIED_MARK = "Regel deines Turniers/Gyms prüfen.";

export type SrcId = "ibjjf-illegal" | "ibjjf-rules" | "adcc-opens" | "giles" | "graciebarra" | "bjjatlas" | "digitsu-sal";

export interface Source {
  label: string;
  url: string;
  /** Abrufdatum (YYYY-MM-DD). */
  checked: string;
  /** Primärquelle (Regelwerk) oder Sekundärquelle (Trainer, Artikel). */
  kind: "primär" | "sekundär";
}

export const SOURCES: Record<SrcId, Source> = {
  "ibjjf-illegal": {
    label: "IBJJF: Technical Fouls & Illegal Moves (VRS 4.0, 01.01.2024)",
    url: "https://ibjjf.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBcE1WIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--e13c15f6e568323ecea8ef21a102b726067a4540/20240101_GolpesProibidos_EN.pdf",
    checked: "2026-11-05", kind: "primär",
  },
  "ibjjf-rules": {
    label: "IBJJF Rules Book, Version 6.1 (Juni 2024), Regel 2.1",
    url: "https://ibjjf.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBbTRaIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--c53798f1b94f5ebc202702cb44e9428a7606a19b/2024JUN_IBJJF_Rules_EN.pdf",
    checked: "2026-11-05", kind: "primär",
  },
  "adcc-opens": {
    label: "ADCC Opens Legal Techniques by Division (Stand 20.07.2026)",
    url: "https://cdn.shopify.com/s/files/1/0679/7950/9959/files/2026_Grid_ADCC_Legal_Techs_720_26.pdf",
    checked: "2026-11-05", kind: "primär",
  },
  giles: {
    label: "Lachlan Giles bei FloGrappling (28.03.2018), Erfahrungswert",
    url: "https://flograppling.com/articles/6158055-lachlan-giles-explains-the-true-danger-of-heel-hooks",
    checked: "2026-11-05", kind: "sekundär",
  },
  graciebarra: {
    label: "Gracie Barra: Leg Locks in Training",
    url: "https://graciebarra.com/gb-news/leg-locks-in-training",
    checked: "2026-11-05", kind: "sekundär",
  },
  bjjatlas: {
    label: "BJJ Atlas: Leg Lock Defense (Sekundärquelle)",
    url: "https://bjj-atlas.pages.dev/leg-locks/leg-lock-defense",
    checked: "2026-11-05", kind: "sekundär",
  },
  // KB 9 (2026-11-06): „Fuß anwinkeln“ = Zehen Richtung Schienbein (Dorsalflexion) gegen den geraden Fußhebel.
  "digitsu-sal": {
    label: "Digitsu: Straight Ankle Lock 101 („dorsiflex your foot, pulling toes toward your knee“)",
    url: "https://digitsu.com/a/straight-ankle-lock-101",
    checked: "2026-11-06", kind: "sekundär",
  },
};

/** Eine Regelaussage. Unbelegt → Text endet mit UNVERIFIED_MARK. */
export interface RuleStatement {
  text: string;
  verified: boolean;
  src?: SrcId[];
}

export type Area = "regeln" | "verteidigung" | "fusshebel" | "abklopfen";
export const AREAS: Area[] = ["regeln", "verteidigung", "fusshebel", "abklopfen"];
export const AREA_LABEL: Record<Area, string> = {
  regeln: "Regelkunde",
  verteidigung: "Erst Verteidigung",
  fusshebel: "Gerader Fußhebel",
  abklopfen: "Früh abklopfen",
};

/* ---------- Bilder (eigene SVG-Skizzen, siehe LegDiagram.tsx) ---------- */
export type DiagramId =
  | "knee-safe" | "knee-past"
  | "foot-hidden" | "foot-exposed"
  | "legs-open" | "legs-crossed"
  | "heel-free" | "heel-armpit"
  | "ankle-lock" | "leg-hold";

/* ---------- Lektionsschritte ---------- */
export interface SortItem { name: string; allowed: boolean; rule: RuleStatement }

export type Step =
  | { kind: "info"; title: string; body: string[]; rules?: RuleStatement[]; src?: SrcId[]; trainer?: boolean }
  | { kind: "sort"; title: string; intro: string; items: SortItem[] }
  | {
      kind: "spot"; title: string; q: string;
      /** Zwei Bilder; `danger` = Index des gefährlichen oder gesuchten Bildes. */
      pics: [DiagramId, DiagramId]; danger: 0 | 1;
      captions: [string, string]; why: string; src?: SrcId[]; trainer?: boolean;
    }
  | { kind: "card"; title: string; front: string; back: string[] }
  | { kind: "tap"; title: string; text: string; done: string };

export type LessonId = "regeln" | "verteidigung" | "fusshebel" | "abklopfen";

export interface Lesson {
  id: LessonId;
  /** Nummer im 100-Schritte-Plan. */
  plan: string;
  area: Area;
  title: string;
  short: string;
  steps: Step[];
}

export const LESSONS: Lesson[] = [
  {
    id: "regeln", plan: "43", area: "regeln",
    title: "Regelkunde",
    short: "Was ist für Weißgurte erlaubt – und was nicht?",
    steps: [
      {
        kind: "info", title: "Die strengste Regel zuerst",
        body: [
          "Wir nehmen die Regel der IBJJF für Weißgurte.",
          "Mit der strengsten Regel bist du überall auf der sicheren Seite.",
        ],
        rules: [
          { text: "Die IBJJF-Tabelle trennt Gi und No-Gi erst bei Braun- und Schwarzgurt. Für Weißgurte gilt beides gleich.", verified: true, src: ["ibjjf-illegal"] },
        ],
      },
      {
        kind: "sort", title: "Erlaubt oder verboten?",
        intro: "IBJJF, Weißgurt, Erwachsene. Tippe für jeden Hebel deine Antwort.",
        items: [
          { name: "Gerader Fußhebel", allowed: true, rule: { text: "Der gerade Fußhebel ist für erwachsene Weißgurte erlaubt.", verified: true, src: ["ibjjf-illegal"] } },
          { name: "Heel Hook", allowed: false, rule: { text: "Heel Hook ist für Weißgurte verboten. In No-Gi ist er erst ab Braungurt erlaubt.", verified: true, src: ["ibjjf-illegal"] } },
          { name: "Kneebar", allowed: false, rule: { text: "Die Kneebar ist für Weiß-, Blau- und Lilagurte verboten.", verified: true, src: ["ibjjf-illegal"] } },
          { name: "Toe Hold", allowed: false, rule: { text: "Der Toe Hold ist für Weiß-, Blau- und Lilagurte verboten.", verified: true, src: ["ibjjf-illegal"] } },
          { name: "Calf Slicer", allowed: false, rule: { text: "Der Calf Slicer ist für Weiß-, Blau- und Lilagurte verboten.", verified: true, src: ["ibjjf-illegal"] } },
          { name: "Knee Reaping", allowed: false, rule: { text: "Knee Reaping ist für Weißgurte verboten. Es ist erst für Braungurte in No-Gi erlaubt.", verified: true, src: ["ibjjf-illegal"] } },
          { name: "Kniedrehhebel", allowed: false, rule: { text: "Hebel, die das Knie verdrehen, sind für Weißgurte verboten.", verified: true, src: ["ibjjf-illegal"] } },
        ],
      },
      {
        kind: "info", title: "Andere Regeln, anderes Turnier",
        body: ["Nicht überall gilt die IBJJF-Regel. Lies vor jedem Turnier die Regeln."],
        rules: [
          { text: "Unter 16 Jahren ist bei der IBJJF sogar der gerade Fußhebel verboten.", verified: true, src: ["ibjjf-illegal"] },
          { text: "Bei ADCC Opens dürfen erwachsene Anfänger Heel Hook, Kneebar und Toe Hold ansetzen.", verified: true, src: ["adcc-opens"] },
          { text: `Deutsche Turniere und andere Ligen haben eigene Regeln. ${UNVERIFIED_MARK}`, verified: false },
          { text: `Im Training gilt, was dein Trainer erlaubt. ${UNVERIFIED_MARK}`, verified: false },
        ],
      },
    ],
  },
  {
    id: "verteidigung", plan: "45", area: "verteidigung",
    title: "Erst Verteidigung",
    short: "Knie, Fuß, Beine, Ferse: Wo wird es gefährlich?",
    steps: [
      {
        kind: "info", title: "Erst schützen, dann angreifen",
        body: [
          "Beinhebel greifen Knie und Fuß an.",
          "Bevor jemand bei dir ansetzt, weißt du, wo dein Bein in Gefahr ist.",
          "Du bist blau, dein Partner rot. Die Details zeigt dir dein Trainer.",
        ],
        trainer: true,
      },
      {
        kind: "spot", title: "Knie-Linie", q: "Was ist hier gefährlich?",
        pics: ["knee-safe", "knee-past"], danger: 1,
        captions: ["Knie vor seiner Hüfte", "Knie hinter seiner Hüfte"],
        why: "Ist dein Knie hinter seiner Hüfte, kontrolliert er das Bein. Zieh das Knie zurück auf deine Seite.",
        src: ["bjjatlas"], trainer: true,
      },
      {
        kind: "spot", title: "Fuß verstecken", q: "Was ist hier gefährlich?",
        pics: ["foot-hidden", "foot-exposed"], danger: 1,
        captions: ["Fuß angewinkelt", "Fuß gestreckt"],
        why: "Ein gestreckter Fuß lässt sich leicht greifen. Winkel den Fuß an, Zehen zum Schienbein, und versteck ihn.",
        src: ["bjjatlas", "digitsu-sal"], trainer: true,
      },
      {
        kind: "spot", title: "Beine nicht kreuzen lassen", q: "Was ist hier gefährlich?",
        pics: ["legs-open", "legs-crossed"], danger: 1,
        captions: ["Seine Beine offen", "Seine Beine gekreuzt"],
        why: "Kreuzt er die Beine über deinem Bein, steckt es fest. Lös das früh, sonst klopf ab.",
        src: ["bjjatlas"], trainer: true,
      },
      {
        kind: "spot", title: "Ferse aus der Achsel", q: "Was ist hier gefährlich?",
        pics: ["heel-free", "heel-armpit"], danger: 1,
        captions: ["Ferse frei", "Ferse in seiner Achsel"],
        why: "Steckt deine Ferse in seiner Achsel, kann er sie drehen. Ferse raus – oder früh abklopfen.",
        src: ["bjjatlas"], trainer: true,
      },
    ],
  },
  {
    id: "fusshebel", plan: "46", area: "fusshebel",
    title: "Gerader Fußhebel",
    short: "Erkennen – und nur mit Trainer üben.",
    steps: [
      {
        kind: "info", title: "So erkennst du ihn",
        body: [
          "Er klemmt deinen Fuß unter seine Achsel.",
          "Sein Unterarm liegt an deiner Achillessehne.",
          "Dann lehnt er sich zurück.",
        ],
        trainer: true,
      },
      {
        kind: "spot", title: "Fußhebel erkennen", q: "Wo droht ein gerader Fußhebel?",
        pics: ["leg-hold", "ankle-lock"], danger: 1,
        captions: ["Er hält dein Knie", "Fuß unter seiner Achsel"],
        why: "Fuß unter der Achsel, Arm an der Achillessehne, er lehnt zurück. Das ist der Fußhebel.",
        trainer: true,
      },
      {
        kind: "info", title: "Nur mit Trainer",
        body: [
          "Üb den Fußhebel nur, wenn dein Trainer dabei ist.",
          "Setz ihn langsam an. Dein Partner braucht Zeit zum Abklopfen.",
          "Fuß anwinkeln, Zehen zum Schienbein, bremst den Hebel nur kurz. Spürst du Druck, klopf ab.",
        ],
        src: ["graciebarra", "bjjatlas", "digitsu-sal"],
        rules: [
          { text: "Beim Fußhebel zur Seite des freien Fußes drehen ist für Weißgurte verboten.", verified: true, src: ["ibjjf-illegal"] },
        ],
      },
    ],
  },
  {
    id: "abklopfen", plan: "47–48", area: "abklopfen",
    title: "Sicherheitskarte",
    short: "Früh abklopfen – nie rausdrehen.",
    steps: [
      {
        kind: "card", title: "Deine Sicherheitskarte",
        front: "Früh abklopfen – nie rausdrehen",
        back: [
          "Beinhebel tun oft kaum weh, bevor etwas reißt.",
          "Wildes Rausdrehen kann das Knie selbst verletzen.",
          "Also: früh abklopfen, ruhig bleiben, neu anfangen.",
        ],
      },
      {
        kind: "info", title: "Warum so früh?",
        body: [
          "Beim Heel Hook reichen etwa 2 cm Bewegung der Ferse für eine Verletzung.",
          "Beim Armbar sind es etwa 30 cm am Handgelenk.",
          "Beim Armbar bleibt also Zeit zum Abklopfen. Beim Beinhebel kaum.",
        ],
        src: ["giles", "graciebarra"],
      },
      {
        kind: "tap", title: "Abklopfen üben",
        text: "Klopf zweimal deutlich auf die Karte.",
        done: "Genau so: zweimal, deutlich. Dein Partner lässt sofort los.",
      },
      {
        kind: "info", title: "Hände gefangen?",
        body: ["Auch ohne Hände kannst du aufgeben. Dein Partner hört dann sofort auf."],
        rules: [
          { text: "Sind deine Arme gefangen, klopf zweimal mit dem Fuß auf die Matte.", verified: true, src: ["ibjjf-rules"] },
          { text: "Laut „Stopp“ sagen zählt auch als Aufgabe.", verified: true, src: ["ibjjf-rules"] },
        ],
      },
    ],
  },
];

/* ---------- Fragen: 5 pro Bereich. Die ersten 2 kommen am Ende der Lektion. ---------- */
export interface LQuestion {
  id: string;
  area: Area;
  q: string;
  options: string[];
  answer: number;
  why: string;
  src?: SrcId[];
}

export const QUESTIONS: LQuestion[] = [
  // Regelkunde
  {
    id: "ll-r1", area: "regeln", q: "Welcher Beinhebel ist für Weißgurte bei der IBJJF erlaubt?",
    options: ["Gerader Fußhebel", "Heel Hook", "Kneebar", "Toe Hold"], answer: 0, src: ["ibjjf-illegal"],
    why: "Nur der gerade Fußhebel ist erlaubt. Heel Hook, Kneebar und Toe Hold sind für Weißgurte verboten.",
  },
  {
    id: "ll-r2", area: "regeln", q: "Gilt das Heel-Hook-Verbot für Weißgurte auch in No-Gi?",
    options: ["Ja, in Gi und No-Gi", "Nein, nur im Gi"], answer: 0, src: ["ibjjf-illegal"],
    why: "Die IBJJF trennt Gi und No-Gi erst bei Braun- und Schwarzgurt.",
  },
  {
    id: "ll-r3", area: "regeln", q: "Ab welchem Gurt erlaubt die IBJJF Heel Hooks in No-Gi?",
    options: ["Braungurt", "Blaugurt", "Lilagurt", "Nie"], answer: 0, src: ["ibjjf-illegal"],
    why: "Heel Hook und Knee Reaping sind nur für Braun- und Schwarzgurte in No-Gi erlaubt.",
  },
  {
    id: "ll-r4", area: "regeln", q: "Was ist beim Knee Reaping das Merkmal?",
    options: ["Sein Fuß kreuzt über deinem Bein deine Körpermitte", "Ein Wurf über die Hüfte", "Ein Würgegriff von hinten"], answer: 0, src: ["ibjjf-illegal"],
    why: "Seine Wade liegt über deinem Oberschenkel, sein Fuß kreuzt deine Mitte. Für Weißgurte ist das verboten.",
  },
  {
    id: "ll-r5", area: "regeln", q: "Dein Turnier ist kein IBJJF-Turnier. Was tust du?",
    options: ["Vorher die Regeln des Turniers lesen", "Einfach IBJJF-Regeln annehmen", "Den Gegner auf der Matte fragen"], answer: 0, src: ["adcc-opens"],
    why: "Regeln unterscheiden sich stark. ADCC Opens erlauben erwachsenen Anfängern sogar Heel Hooks.",
  },
  // Verteidigung
  {
    id: "ll-v1", area: "verteidigung", q: "Er will an dein Bein. Wo soll dein Knie sein?",
    options: ["Vor seiner Hüfte, auf deiner Seite", "Hinter seiner Hüfte", "Egal, Hauptsache gestreckt"], answer: 0, src: ["bjjatlas"],
    why: "Ist dein Knie hinter seiner Hüfte, kontrolliert er das Bein. Knie zurück auf deine Seite.",
  },
  {
    id: "ll-v2", area: "verteidigung", q: "Was machst du mit deinem Fuß?",
    options: ["Fuß anwinkeln (Zehen zum Schienbein) und verstecken", "Fuß locker strecken", "Fuß in seine Achsel schieben"], answer: 0, src: ["bjjatlas", "digitsu-sal"],
    why: "Ein gestreckter, freier Fuß ist leicht zu greifen. Angewinkelt und versteckt ist er schwerer zu fassen.",
  },
  {
    id: "ll-v3", area: "verteidigung", q: "Er kreuzt seine Beine über deinem Bein. Was heißt das?",
    options: ["Dein Bein steckt fest: früh lösen oder abklopfen", "Alles gut, du bist sicher", "Du hast die bessere Position"], answer: 0, src: ["bjjatlas"],
    why: "Gekreuzte Beine halten dein Bein fest. Dann bleibt wenig Zeit.",
  },
  {
    id: "ll-v4", area: "verteidigung", q: "Deine Ferse steckt in seiner Achsel. Was tust du?",
    options: ["Ferse rausziehen oder früh abklopfen", "Bein strecken und rausdrehen", "Abwarten, bis es weh tut"], answer: 0, src: ["bjjatlas", "graciebarra"],
    why: "In der Achsel kann er die Ferse drehen. Rausdrehen kann das Knie selbst verletzen.",
  },
  {
    id: "ll-v5", area: "verteidigung", q: "Warum lernst du zuerst die Verteidigung?",
    options: ["Damit du dein Bein schützt, bevor jemand ansetzt", "Weil Angriffe immer verboten sind", "Weil Verteidigung mehr Punkte bringt"], answer: 0,
    why: "Erst Schutz, dann Angriff. So bleibt dein Knie gesund, wenn andere Beinhebel üben.",
  },
  // Gerader Fußhebel
  {
    id: "ll-f1", area: "fusshebel", q: "Woran erkennst du einen geraden Fußhebel?",
    options: ["Fuß unter seiner Achsel, Arm an der Achillessehne, er lehnt zurück", "Er sitzt auf deinem Bauch", "Er streckt deinen Arm"], answer: 0,
    why: "Fuß eingeklemmt, Unterarm an der Achillessehne, Zug nach hinten. Das ist der gerade Fußhebel.",
  },
  {
    id: "ll-f2", area: "fusshebel", q: "Wie übst du den Fußhebel?",
    options: ["Nur mit Trainer, langsam ansetzen", "Allein mit Freunden, schnell", "Mit Ruck, damit er sitzt"], answer: 0, src: ["graciebarra"],
    why: "Langsam ansetzen gibt deinem Partner Zeit zum Abklopfen. Dein Trainer sieht Fehler sofort.",
  },
  {
    id: "ll-f3", area: "fusshebel", q: "Du winkelst den Fuß an, Zehen zum Schienbein. Reicht das gegen den Fußhebel?",
    options: ["Nein, es bremst nur kurz. Spürst du Druck, klopf ab", "Ja, dann kann nichts passieren"], answer: 0, src: ["bjjatlas", "digitsu-sal"],
    why: "Den Fuß anwinkeln verzögert den Hebel nur. Abklopfen schützt dich wirklich.",
  },
  {
    id: "ll-f4", area: "fusshebel", q: "Was ist beim Fußhebel für Weißgurte verboten?",
    options: ["Zur Seite des freien Fußes drehen", "Langsam ansetzen", "Beim Abklopfen loslassen"], answer: 0, src: ["ibjjf-illegal"],
    why: "Diese Drehung belastet das Knie. Die IBJJF verbietet sie für Weiß- bis Lilagurte.",
  },
  {
    id: "ll-f5", area: "fusshebel", q: "Darf ein 14-Jähriger bei der IBJJF den geraden Fußhebel ansetzen?",
    options: ["Nein, unter 16 ist er verboten", "Ja, er ist für alle erlaubt"], answer: 0, src: ["ibjjf-illegal"],
    why: "Bis 15 Jahre ist bei der IBJJF auch der gerade Fußhebel verboten.",
  },
  // Abklopfen
  {
    id: "ll-a1", area: "abklopfen", q: "Er hat deine Ferse und beginnt zu drehen. Was tust du?",
    options: ["Sofort abklopfen", "Rausdrehen", "Warten, bis es weh tut"], answer: 0, src: ["graciebarra"],
    why: "Früh abklopfen – nie rausdrehen. Beim Beinhebel kommt der Schaden oft vor dem Schmerz.",
  },
  {
    id: "ll-a2", area: "abklopfen", q: "Wie viel Bewegung der Ferse kann beim Heel Hook schon verletzen?",
    options: ["Etwa 2 cm", "Etwa 30 cm", "Etwa 1 Meter"], answer: 0, src: ["giles"],
    why: "Laut Lachlan Giles reichen etwa 2 cm. Deshalb bleibt kaum Zeit.",
  },
  {
    id: "ll-a3", area: "abklopfen", q: "Wie viel Weg hat das Handgelenk beim Armbar etwa bis zur Verletzung?",
    options: ["Etwa 30 cm", "Etwa 2 cm", "Etwa 1 Meter"], answer: 0, src: ["giles"],
    why: "Beim Armbar etwa 30 cm, beim Heel Hook etwa 2 cm. Bei Beinhebeln klopfst du früher ab.",
  },
  {
    id: "ll-a4", area: "abklopfen", q: "Deine Hände sind gefangen. Wie gibst du auf?",
    options: ["Laut „Stopp“ sagen oder zweimal mit dem Fuß klopfen", "Gar nicht, du musst durch", "Einmal nicken"], answer: 0, src: ["ibjjf-rules"],
    why: "Die IBJJF zählt Fußklopfen und Aufgeben mit Worten. Dein Partner hört sofort auf.",
  },
  {
    id: "ll-a5", area: "abklopfen", q: "Es tut noch nicht weh. Bist du sicher?",
    options: ["Nein, Schäden können vor dem Schmerz kommen", "Ja, Schmerz warnt immer rechtzeitig"], answer: 0, src: ["graciebarra"],
    why: "Beinhebel tun oft kaum weh, bevor etwas reißt. Klopf bei Druck im Knie ab.",
  },
];

export const LESSON_QUIZ = 2;
export const lessonQuestions = (a: Area) => QUESTIONS.filter((q) => q.area === a).slice(0, LESSON_QUIZ);

export const BADGE = "Beinhebel-Sicherheit: Wissen geprüft";
export const TRAINER_REMINDER = "Wissen ist geprüft, Technik noch nicht. Üb Beinhebel nur mit Trainer.";
/** Hinweis bei Technik-Details ohne Primärbeleg. */
export const TRAINER_CHECK = "Technik-Detail: Dein Trainer zeigt dir, wie es richtig geht.";
