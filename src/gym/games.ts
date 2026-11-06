// Schritt 53: Positionsspiele für das Training (Constraints-Led Approach, „Specific Training“).
// Jedes Spiel: Startlage, Ziel für beide Rollen, Regeln, Intensität, Dauer, Sicherheitszeile, NUR MIT TRAINER.
// Recherche: docs/knowledge-base.md § 8.13 (Quellen unten in GAME_SOURCES, mit Markierung).
// Grundsatz: Anfänger spielen das nie allein. Die App zeigt die Spiele als Vorschlag für den Trainer.
// Alle Spiele ohne Aufgabegriffe, ohne Würfe, ohne Slams. check: true = eigene Ableitung → Trainer prüfen.
import type { Pos2, Side } from "../core2/types";
import type { Topic } from "../program/questions";
import type { TimerConfig } from "../program/timer";

export type SourceMark = "belegt" | "Sekundär" | "Marketing" | "ungeprüft" | "Design";

export interface GameSource { title: string; url: string; mark: SourceMark; note: string }

/** Quellen zu Positionsspielen (KB § 8.13). Markierung wie KB 1.1, plus [Marketing] für Studio-Blogs. */
export const GAME_SOURCES = {
  grapplearts: {
    title: "Grapplearts: Situational Sparring and Positional Drilling",
    url: "https://www.grapplearts.com/situational-sparring-and-positional-drilling/",
    mark: "belegt",
    note: "Start in fester Lage, klare Endpunkte, dann Reset. Beispiel Turtle mit Seatbelt.",
  },
  graciebarra: {
    title: "Gracie Barra: Specific Training – A Great Training Method",
    url: "https://graciebarra.com/2015/09/training-method",
    mark: "Marketing",
    note: "Start aus dem Thema der Stunde, Ziel je Rolle, Reset, 3-Minuten-Runden. Gut für Neue.",
  },
  claSubstack: {
    title: "A Coat of Red Paint: How to design an ecological dynamics scenario",
    url: "https://acoatofredpaintinhell.substack.com/p/how-to-design-an-ecological-dynamics",
    mark: "Sekundär",
    note: "Rollen mit Haupt- und Nebenaufgabe, Einschränkungen wie „Knie nicht auf die Matte“, Stufen.",
  },
  souders: {
    title: "BJJ Doc: Greg Souders – BJJ Is Being Taught All Wrong",
    url: "https://bjjdoc.com/?p=20524",
    mark: "Sekundär",
    note: "Constraints-Led Approach: Live-Widerstand dosiert und in Spielen statt steriler Drills.",
  },
  nickyRyan: {
    title: "BJJEE: Nicky Ryan talks Eco approach",
    url: "https://www.bjjee.com/bjj-news/nicky-ryan-talks-eco-approach-to-bjj-i-like-what-gregs-doing-but-id-do-it-differently/",
    mark: "Sekundär",
    note: "Mittelweg: Positionsrunden mit Einschränkungen plus etwas Technik-Wiederholung.",
  },
  tnbjj: {
    title: "TNBJJ: Game Plan Based Training",
    url: "https://tnbjj.com/linkedpages/gameplan.html",
    mark: "Marketing",
    note: "Studio-Seite: Start, Ziele je Partner, Neustart nach Erfolg.",
  },
  reddit: {
    title: "r/bjj: Which positional round is simple and fun for new students?",
    url: "https://www.reddit.com/r/bjj/comments/1in41nq/which_positional_round_is_simple_and_fun_for_new/",
    mark: "ungeprüft",
    note: "Forum: Mount mit Händen auf der Matte, Side ohne Griffe, Fuß-Tippen, Halbe Guard mit Underhook.",
  },
  evolve: {
    title: "Evolve MMA: 11 Things You Should Know Before You Start Sparring BJJ",
    url: "https://evolve-mma.com/blog/11-things-you-should-know-before-you-start-sparring-bjj/",
    mark: "Marketing",
    note: "Sparring ist Training, kein Wettkampf. Früh abklopfen, Platz zu anderen Paaren halten.",
  },
  kdmma: {
    title: "KD MMA: Do beginners spar?",
    url: "https://www.kdmma.com/blog/do-beginners-spar",
    mark: "Marketing",
    note: "BJJ beginnt mit kontrolliertem Positionstraining. Trainer schaut zu, stoppt zu harte Runden.",
  },
  cursa: {
    title: "Cursa: BJJ Starter Guide – Safety, Tapping, and Positional Priorities",
    url: "https://cursa.app/en/page/bjj-starter-guide-safety-tapping-and-positional-priorities",
    mark: "belegt",
    note: "Anfänger rollen mit 60–70 %, Kontrolle vor Tempo, Stopp bei Nacken- oder Knieschmerz.",
  },
  design: {
    title: "Mattenkarten: eigene Ableitung",
    url: "docs/knowledge-base.md#813-positionsspiele-für-das-training-recherche-2026-11-06",
    mark: "Design",
    note: "30–50 % Intensität, keine Aufgabegriffe, NUR MIT TRAINER – bewusst vorsichtiger als die Quellen.",
  },
} as const satisfies Record<string, GameSource>;

export type SourceKey = keyof typeof GAME_SOURCES;

export interface GameRole {
  /** Kurzname der Rolle: „Oben“, „Unten“, „Hinten“, „Vorn“, „Blau“, „Rot“. */
  role: string;
  /** Ziel der Rolle, ≤ 20 Wörter pro Satz. */
  goal: string;
}

export interface PositionalGame {
  id: string;
  /** Stabiler Kurz-Code für den Gym-Code (1–250, nie neu vergeben). */
  code: number;
  pos: Pos2;
  /** Wer in der Szene oben ist (Blau = "p"). Stand und Clinch: null. */
  top: Side | null;
  title: string;
  /** Ein Satz: worum geht es? */
  idea: string;
  /** Blau (in der Szene „p“). */
  a: GameRole;
  /** Rot (in der Szene „o“). */
  b: GameRole;
  /** Regeln und Einschränkungen (2–4). */
  rules: string[];
  /** Intensität in Prozent (Spanne). */
  intensity: [number, number];
  /** Runden je Rolle. Danach tauscht ihr. */
  timer: TimerConfig;
  /** Sicherheitszeile (ein Satz, Pflicht). */
  safety: string;
  /** Kurze Zurufe für den Vorleser (2–3). */
  cues: string[];
  /** Immer true: Diese Spiele gibt es nur mit Trainer. */
  trainerOnly: true;
  /** Monat 1 = einfacher Einstieg, Monat 2–3 = mehr Widerstand. */
  month: 1 | 2;
  /** Passende Lektion in der App (zum Vorbereiten). */
  lessonId?: string;
  topics: Topic[];
  sources: SourceKey[];
  /** Spielform ist eigene Ableitung bzw. nur im Forum belegt → Trainer prüfen. */
  check?: boolean;
}

export const TRAINER_LABEL = "NUR MIT TRAINER";
export const SHOW_TRAINER = "Zeig das deinem Trainer. Frag, ob ihr das zusammen spielen könnt.";
export const INTENSITY_NOTE =
  "30–50 % heißt: ruhig, mit Kontrolle, ohne Kraftspitzen. Ihr lernt beide, keiner muss gewinnen.";

const T = (work = 60): TimerConfig => ({ rounds: 2, work, rest: 20, prep: 10 });

export const GAMES: PositionalGame[] = [
  {
    id: "g-mount-knie", code: 1, pos: "mount", top: "p", month: 1,
    title: "Mount: Knie rein",
    idea: "Unten im Mount holst du dir mit dem Knie Platz zurück.",
    a: { role: "Oben", goal: "Halte den Mount 60 Sekunden. Deine Hände bleiben auf der Matte." },
    b: { role: "Unten", goal: "Bring ein Knie zwischen euch. Dann bist du raus und ihr startet neu." },
    rules: [
      "Keine Aufgabegriffe, kein Würgen, kein Druck auf den Hals.",
      "Unten: erst Ellbogen an die Knie, dann wegrutschen.",
      "Knie drin oder Zeit um: kurz stoppen und neu aufbauen.",
    ],
    intensity: [30, 50], timer: T(60),
    safety: "Oben sitzt du auf der Hüfte, nie auf Brust oder Hals.",
    cues: ["Ellbogen an die Knie", "Wegrutschen, Knie rein", "Ruhig atmen"],
    trainerOnly: true, lessonId: "k2-raus-von-unten", topics: ["mount", "schutz"],
    sources: ["reddit", "grapplearts", "graciebarra", "design"], check: true,
  },
  {
    id: "g-mount-rollen", code: 2, pos: "mount", top: "p", month: 1,
    title: "Mount: Brücke und rollen",
    idea: "Unten im Mount rollst du ihn mit einer Brücke zur Seite.",
    a: { role: "Oben", goal: "Bleib oben. Deine Hände liegen auf seiner Brust, nicht auf der Matte." },
    b: { role: "Unten", goal: "Fang einen Arm und einen Fuß auf derselben Seite. Dann Brücke und rollen." },
    rules: [
      "Keine Aufgabegriffe, keine Schläge, kein Reißen am Arm.",
      "Unten rollst du über die Schulter, nie über den Kopf.",
      "Nach dem Rollen: stoppen, Mount neu aufbauen.",
    ],
    intensity: [30, 40], timer: T(45),
    safety: "Rollt langsam und haltet den Platz zur Seite frei.",
    cues: ["Arm und Fuß fangen", "Hüfte hoch", "Über die Schulter rollen"],
    trainerOnly: true, lessonId: "k2-raus-von-unten", topics: ["mount"],
    sources: ["grapplearts", "claSubstack", "design"], check: true,
  },
  {
    id: "g-side-guard", code: 3, pos: "side", top: "p", month: 1,
    title: "Seitenkontrolle: Guard zurück",
    idea: "Unten in der Seitenkontrolle baust du Rahmen und holst die Beine zurück.",
    a: { role: "Oben", goal: "Halte die Seitenkontrolle 60 Sekunden. Hände nur zum Balancieren, keine Griffe." },
    b: { role: "Unten", goal: "Rahmen bauen, Hüfte weg, Knie rein. Beine vor ihm heißt: geschafft." },
    rules: [
      "Kein Unterarm quer über das Gesicht, kein Knie auf den Bauch.",
      "Keine Aufgabegriffe von oben oder unten.",
      "Knie drin oder Zeit um: stoppen, neu aufbauen.",
    ],
    intensity: [30, 50], timer: T(60),
    safety: "Oben drückst du mit der Brust, nicht mit dem Kopf oder Ellbogen.",
    cues: ["Unterarm an den Hals", "Hüfte weg", "Knie rein"],
    trainerOnly: true, lessonId: "p-side-escape", topics: ["side", "schutz"],
    sources: ["reddit", "tnbjj", "graciebarra", "design"], check: true,
  },
  {
    id: "g-side-aufstehen", code: 4, pos: "side", top: "p", month: 2,
    title: "Seitenkontrolle: Auf die Knie",
    idea: "Unten in der Seitenkontrolle drehst du dich auf die Knie und stehst auf.",
    a: { role: "Oben", goal: "Halte ihn 60 Sekunden mit dem Rücken auf der Matte." },
    b: { role: "Unten", goal: "Komm auf beide Knie. Dann bist du raus und ihr startet neu." },
    rules: [
      "Oben: keine Aufgabegriffe, kein Knie auf Bauch oder Kopf.",
      "Unten: Kopf und Ellbogen eng, nie den Hals frei geben.",
      "Auf den Knien angekommen: stoppen, neu aufbauen.",
    ],
    intensity: [30, 50], timer: T(60),
    safety: "Beim Drehen auf die Knie zieht keiner am Kopf oder am Hals.",
    cues: ["Ellbogen eng", "Hüfte weg", "Auf die Knie"],
    trainerOnly: true, lessonId: "p-side-escape", topics: ["side"],
    sources: ["tnbjj", "reddit", "design"], check: true,
  },
  {
    id: "g-guard-haltung", code: 5, pos: "guard", top: "p", month: 1,
    title: "Guard: Haltung halten",
    idea: "Oben in der Guard sitzt du aufrecht. Unten ziehst du ihn runter.",
    a: { role: "Oben", goal: "Bleib 60 Sekunden aufrecht sitzen. Hände auf seinem Bauch, Ellbogen eng." },
    b: { role: "Unten", goal: "Beine bleiben zu. Zieh ihn runter, bis seine Brust 3 Sekunden auf dir liegt." },
    rules: [
      "Keine Würger, keine Armhebel, kein Reißen am Kopf.",
      "Unten ziehst du mit den Beinen und an den Armen.",
      "Brust 3 Sekunden unten oder Zeit um: neu starten.",
    ],
    intensity: [30, 50], timer: T(60),
    safety: "Oben: Kein Ellbogen in Oberschenkel oder Leiste bohren.",
    cues: ["Rücken gerade", "Hände auf den Bauch", "Unten: Beine ziehen"],
    trainerOnly: true, lessonId: "p-guard-posture", topics: ["guard"],
    sources: ["graciebarra", "reddit", "design"], check: true,
  },
  {
    id: "g-guard-vorbei", code: 6, pos: "guard", top: "p", month: 2,
    title: "Offene Guard: Beine vorn",
    idea: "Unten hältst du Füße und Hände vor ihm. Oben gehst du vorbei.",
    a: { role: "Oben", goal: "Du stehst. Komm an den Beinen vorbei und leg 3 Sekunden Brust auf Brust." },
    b: { role: "Unten", goal: "Du sitzt. Halte Füße und Hände vor ihm, so bleibt er draußen." },
    rules: [
      "Oben: Deine Knie berühren nicht die Matte.",
      "Kein Springen, kein Werfen, kein Fallenlassen auf ihn.",
      "Brust auf Brust oder Zeit um: neu starten.",
    ],
    intensity: [30, 50], timer: T(60),
    safety: "Unten: Füße an Hüfte und Schienbein, nie gegen Knie oder Kopf treten.",
    cues: ["Füße vor ihm", "Hände als Rahmen", "Oben: Haltung, dann vorbei"],
    trainerOnly: true, lessonId: "k2-keile-vorbeigehen", topics: ["guard", "keile"],
    sources: ["claSubstack", "graciebarra", "nickyRyan", "design"], check: true,
  },
  {
    id: "g-half-underhook", code: 7, pos: "half", top: "p", month: 2,
    title: "Halbe Guard: Underhook",
    idea: "Unten in der halben Guard kommst du mit dem Underhook auf die Seite.",
    a: { role: "Oben", goal: "Drück ihn flach auf den Rücken und halte ihn dort." },
    b: { role: "Unten", goal: "Du startest mit Arm unter seiner Achsel. Komm auf die Seite und auf dein Knie." },
    rules: [
      "Keine Aufgabegriffe, kein Kopf-Arm-Würger.",
      "Oben: Kein Druck mit dem Kopf ins Gesicht.",
      "Auf dem Knie oder flach gedrückt: neu starten.",
    ],
    intensity: [30, 50], timer: T(60),
    safety: "Wer ein Knie verdreht spürt, ruft sofort Stopp.",
    cues: ["Arm unter die Achsel", "Auf die Seite", "Kopf hoch"],
    trainerOnly: true, lessonId: "p-side-escape", topics: ["side", "guard"],
    sources: ["reddit", "grapplearts", "design"], check: true,
  },
  {
    id: "g-turtle-haken", code: 8, pos: "turtle", top: "p", month: 2,
    title: "Turtle: Haken rein",
    idea: "Oben auf der Turtle willst du an den Rücken. Unten schüttelst du ihn ab.",
    a: { role: "Oben", goal: "Du startest mit Armen um seine Brust. Bring beide Haken rein, dann Stopp." },
    b: { role: "Unten", goal: "Schieb seine Brust von deinem Rücken oder setz dich in deine Guard." },
    rules: [
      "Kein Würgen, keine Hand am Hals. Das Spiel endet bei zwei Haken.",
      "Unten: Ellbogen an die Knie, Kopf eng.",
      "Haken drin oder Brust weg: neu starten.",
    ],
    intensity: [30, 50], timer: T(60),
    safety: "Nicht mit vollem Gewicht auf den Nacken fallen.",
    cues: ["Ellbogen an die Knie", "Oben: Brust an den Rücken", "Ruhig bleiben"],
    trainerOnly: true, lessonId: "p-back-protect", topics: ["ruecken"],
    sources: ["grapplearts", "graciebarra", "design"], check: true,
  },
  {
    id: "g-ruecken-haende", code: 9, pos: "back", top: "p", month: 2,
    title: "Rücken: Hände zuerst",
    idea: "Ist er an deinem Rücken, kämpfst du erst die Hände, dann rutschst du raus.",
    a: { role: "Hinten", goal: "Halte den Rücken 60 Sekunden. Arme um die Brust, keine Hand am Hals." },
    b: { role: "Vorn", goal: "Kämpf seine Hände, rutsch zur Seite. Beide Schultern auf der Matte heißt: geschafft." },
    rules: [
      "Kein Würgen, kein Griff am Hals oder Kinn.",
      "Vorn: Hände an deinen Hals, dann seine Hände fassen.",
      "Schultern auf der Matte oder Zeit um: neu starten.",
    ],
    intensity: [30, 40], timer: T(60),
    safety: "Hinten: Keine Beine um den Bauch kreuzen und zudrücken.",
    cues: ["Hände an den Hals", "Seine Hände fassen", "Zur Seite rutschen"],
    trainerOnly: true, lessonId: "p-back-protect", topics: ["ruecken", "schutz"],
    sources: ["grapplearts", "claSubstack", "design"], check: true,
  },
  {
    id: "g-stand-fuss", code: 10, pos: "stand", top: null, month: 1,
    title: "Stand: Fuß tippen",
    idea: "Im Stand übst du Abstand und Auslage, ganz ohne Werfen.",
    a: { role: "Blau", goal: "Tipp mit deinem Fuß auf seinen Fuß, ohne selbst getippt zu werden." },
    b: { role: "Rot", goal: "Genau dasselbe. Wer zuerst dreimal tippt, gewinnt die Runde." },
    rules: [
      "Nur antippen, nicht treten, nicht stampfen.",
      "Kein Greifen, kein Schuss zu den Beinen, kein Werfen.",
      "Bleibt in eurem Feld, weg von Wand und anderen Paaren.",
    ],
    intensity: [30, 40], timer: T(45),
    safety: "Barfuß nur mit dem Fußballen tippen, nie auf die Zehen springen.",
    cues: ["Knie leicht gebeugt", "Kleine Schritte", "Abstand halten"],
    trainerOnly: true, lessonId: "p-shot-sprawl", topics: ["stand"],
    sources: ["reddit", "evolve", "design"], check: true,
  },
  {
    id: "g-stand-handgelenk", code: 11, pos: "stand", top: null, month: 1,
    title: "Stand: Handgelenk fassen",
    idea: "No-Gi-Griffkampf: Wer hält das Handgelenk des anderen?",
    a: { role: "Blau", goal: "Halte ein Handgelenk von ihm 3 Sekunden fest." },
    b: { role: "Rot", goal: "Genau dasselbe. Löse Griffe mit Drehen zum Daumen hin." },
    rules: [
      "Nur Hände und Unterarme. Kein Werfen, kein Ziehen zu Boden.",
      "Nichts verdrehen, keine Finger einzeln fassen.",
      "3 Sekunden gehalten: Punkt, kurz loslassen, weiter.",
    ],
    intensity: [30, 40], timer: T(45),
    safety: "Finger und Handgelenke nie verdrehen. Schmerz heißt sofort loslassen.",
    cues: ["Hände vorn", "Zum Daumen drehen", "Haltung bleibt aufrecht"],
    trainerOnly: true, lessonId: "p-shot-sprawl", topics: ["stand"],
    sources: ["reddit", "design"], check: true,
  },
  {
    id: "g-clinch-underhook", code: 12, pos: "clinch", top: null, month: 2,
    title: "Clinch: Underhook-Kampf",
    idea: "Im Clinch kämpft ihr um die Arme unter den Achseln.",
    a: { role: "Blau", goal: "Hol beide Arme unter seine Achseln und halte das 3 Sekunden." },
    b: { role: "Rot", goal: "Genau dasselbe. Hüfte bleibt etwas weg, Kopf neben seinem Kopf." },
    rules: [
      "Kein Werfen, kein Anheben, kein Griff an die Beine.",
      "Köpfe nebeneinander, nie Stirn gegen Stirn stoßen.",
      "3 Sekunden gehalten: Punkt, lösen, weiter.",
    ],
    intensity: [30, 40], timer: T(45),
    safety: "Keiner zieht am Nacken nach unten. Wer fällt, lässt sofort los.",
    cues: ["Ellbogen eng", "Arm unter die Achsel", "Hüfte weg"],
    trainerOnly: true, lessonId: "p-shot-sprawl", topics: ["stand", "positionen"],
    sources: ["graciebarra", "design"], check: true,
  },
];

export const GAME_BY_ID: Record<string, PositionalGame> = Object.fromEntries(GAMES.map((g) => [g.id, g]));
export const GAME_BY_CODE: Record<number, PositionalGame> = Object.fromEntries(GAMES.map((g) => [g.code, g]));

export function gamesFor(pos: Pos2): PositionalGame[] {
  return GAMES.filter((g) => g.pos === pos);
}

/** Positionen, für die es mindestens ein Spiel gibt (Reihenfolge wie recommend.ts). */
export const GAME_POSITIONS: Pos2[] = ["stand", "clinch", "guard", "half", "turtle", "side", "mount", "back"].filter(
  (p) => GAMES.some((g) => g.pos === p),
) as Pos2[];

export const intensityLabel = (g: PositionalGame) => `${g.intensity[0]}–${g.intensity[1]} %`;

/** „2 × 60 s je Rolle, dann tauschen“ */
export function durationLabel(g: PositionalGame): string {
  const t = g.timer;
  return `${t.rounds} × ${t.work} s je Rolle, dann tauschen`;
}
