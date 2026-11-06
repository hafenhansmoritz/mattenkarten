// Kern 2 – Körperkarte: drei geführte Lektionen (Spec „Lernen“).
// Reihenfolge nach Danaher: erst Befreiung, dann Keile & Passieren, dann Abschluss als Prozess.
// Muster nach Hearthstone-FTUE: zeigen (requireCard) → Hinweis → frei spielen; eine Idee pro Lektion.
// Quellen: research_notes/Kern 2 Kontrolle und Abschluss/danaher_kontrolle.md,
//          research_notes/Neulinge und Lernen pro Runde/onboarding.md
// Lösbarkeit wird in tutorials.test.ts mit der echten Engine simuliert.
import type { TutorialK2Def } from "../ui/tutorialTypes";

export const TUTORIALS_K2: TutorialK2Def[] = [
  {
    id: "k2-raus-von-unten",
    // Mechanik 2–4: Griffe, Ketten und Konter sind in den ersten drei Lektionen aus (eine Idee pro Lektion).
    grips: false,
    chains: false,
    konter: false,
    stil: false,
    title: "Raus von unten",
    idea: "Unten im Mount: erst Knie nach innen, Ellbogen dazu – dann raus.",
    // Leicht gegen dich: Kopf und Beine im Minus. Hüfte 0, damit die Befreiung nach Runde 1 sicher spielbar ist.
    start: { pos: "mount", top: "o", board: { kopf: -1, beine: -1 } },
    // Jede Befreiung zählt: Elbow Escape → Half Guard unten, Upa → oben in der Guard, volle Guard unten.
    goal: [
      { pos: "half", role: "bottom" },
      { pos: "guard", role: "bottom" },
      { pos: "guard", role: "top" },
    ],
    aiLevel: 1,
    maxRounds: 8,
    // Schrittweises Aufdecken: erst nur Beine und Hüfte (Stufe 2 = Tag 2: nur Aufbauen/Angreifen, kein Atem,
    // keine Phasenleiste, keine Vorhersage; der Gegner greift nur in diesen Zonen an, keine Aufgabe).
    zones: ["beine", "huefte"],
    ui: 2,
    seed: 2201,
    // Skript: R1 drückt er die Hüfte schwer, R2 blockt er den Elbow Escape mit den Knien – dann hilft die andere
    // Richtung (Upa). Gleiche Züge, gleiches Ergebnis.
    foe: { script: { 1: "mt_heavy_hips", 2: "mt_knee_pinch" }, prefer: ["mt_heavy_hips", "mt_post", "mt_knee_pinch"] },
    steps: [
      {
        round: 1, when: "start", highlightZone: "beine",
        text: "Er sitzt auf dir (Mount). Keine Panik: erst schützen, dann raus. Das Brett zeigt, wo du gerade schwach bist.",
      },
      {
        round: 1, when: "pick", requireCard: "mb_knee_inside", highlightZone: "beine",
        text: "Spiel „Knie nach innen“ (Elbow-Knee): dein Knie innen an seinen Knöchel, Ellbogen dazu. Das ist deine Schutzhaltung – Ellbogen an die Knie.",
      },
      {
        round: 1, when: "after", highlightZone: "beine",
        text: "Deine Beine sind nicht mehr im Minus. Damit wird „Wegrutschen, Knie dazwischen“ spielbar.",
      },
      {
        round: 2, when: "pick", requireCard: "mb_elbow_escape", highlightZone: "beine",
        text: "Jetzt raus: „Wegrutschen, Knie dazwischen“ (Elbow Escape). Klappt es, bist du in der halben Guard.",
      },
      {
        round: 2, when: "after",
        text: "Geblockt? Dann wechsle die Richtung: „Brücke und rollen“ (Upa). Oder schütz dich erst wieder mit „Knie nach innen“.",
      },
      {
        round: 3, when: "start",
        text: "Jetzt du allein. Erst schützen, dann befreien. Blockt er eine Seite, nimm die andere.",
      },
    ],
  },
  {
    id: "k2-keile-vorbeigehen",
    // Mechanik 2–4: Griffe, Ketten und Konter sind in den ersten drei Lektionen aus (eine Idee pro Lektion).
    grips: false,
    chains: false,
    konter: false,
    stil: false,
    title: "Keile bauen, vorbeigehen",
    idea: "Oben in der Guard: erst Hüfte und Beine blockieren, dann vorbei.",
    // Hüfte schon +1 (erster Keil sitzt) – so ist sein Hüft-Sweep (Hip Bump) anfangs nicht spielbar.
    start: { pos: "guard", top: "p", board: { huefte: 1 } },
    goal: [{ pos: "side", role: "top" }],
    aiLevel: 1,
    maxRounds: 8,
    // Schrittweises Aufdecken: Hüfte, Beine, dazu die Arme (Stufe 3: Rahmen sichtbar, kein Atem, keine Phasenleiste).
    zones: ["huefte", "beine", "arme"],
    ui: 3,
    seed: 3201,
    steps: [
      {
        round: 1, when: "start", highlightZone: "huefte",
        text: "Du kniest in seiner Guard. Deine Hüfte drückt schon auf seine (Keil). Zum Vorbeigehen brauchst du Hüfte und Beine.",
      },
      {
        round: 1, when: "pick", requireCard: "gt_open_guard", highlightZone: "beine",
        text: "Zweiter Keil: „Guard öffnen“ – mach seine Beine auf. Danach liegst du an den Beinen vorne.",
      },
      {
        round: 1, when: "after", highlightZone: "beine",
        text: "Hüfte und Beine stehen. Jetzt sind die Karten zum Vorbeigehen (Pass) frei.",
      },
      {
        round: 2, when: "pick", highlightZone: "huefte",
        text: "Sein Rahmen blockt nur eine Zone. Sperrt er die Beine, geh über die Hüfte (Knee Slice) – und umgekehrt (Toreando).",
      },
      {
        round: 2, when: "after",
        text: "Gestoppt? Dann hat er sich geöffnet (Dilemma): Du bekommst einen Bonus in der anderen Zone. Greif dort an.",
      },
      {
        round: 3, when: "start",
        text: "Jetzt du allein. Die rote Linie zeigt, wo er angreifen kann. Fehlt ein Keil, bau ihn zuerst nach.",
      },
    ],
  },
  {
    id: "k2-erst-griff-dann-beenden",
    // Mechanik 2–4: Griffe, Ketten und Konter sind in den ersten drei Lektionen aus (eine Idee pro Lektion).
    grips: false,
    chains: false,
    konter: false,
    stil: false,
    title: "Erst Griff, dann beenden",
    idea: "Eine Aufgabe ist ein Prozess: fangen, kontrollieren, beenden.",
    // Beine +2: seine Befreiungen (Elbow Escape, Upa) sind anfangs nicht spielbar – Fokus liegt auf den Armen.
    start: { pos: "mount", top: "p", board: { kopf: 1, arme: 1, huefte: 1, beine: 2 } },
    aiLevel: 1,
    maxRounds: 10,
    seed: 4242,
    // Tag 6 im Startprogramm: Stufe 6 (Atem, Phasenleiste, Dilemma).
    ui: 6,
    steps: [
      {
        round: 1, when: "start", highlightZone: "arme",
        text: "Du sitzt oben (Mount). Eine Aufgabe hat drei Schritte: Arm fangen, kontrollieren, beenden. Rahmt er nicht, bringt ein Treffer zwei Schritte.",
      },
      {
        round: 1, when: "pick", requireCard: "mt_americana", highlightZone: "arme",
        text: "Schritt 1: „Arm nach unten drehen“ (Americana) – seinen gebeugten Arm langsam Richtung Matte. Das kostet 1 Atem.",
      },
      {
        round: 1, when: "after", highlightZone: "arme",
        text: "Rahmt er mit dem Arm, rutscht deine Leiste einen Schritt zurück. Dann streckt er den Arm – das öffnet die Armbar. Später heißt das „Kette“.",
      },
      {
        round: 2, when: "pick", highlightZone: "arme",
        text: "Dilemma: Beugt er den Arm, drehst du ihn nach unten. Streckt er ihn, streckst du weiter (Armbar). Bleib an den Armen.",
      },
      {
        round: 3, when: "start", highlightZone: "arme",
        text: "Jetzt du allein. Bleib bei einem Griff, bis er sitzt. Wird der Arm schwach, isoliere ihn erst wieder (Arm isolieren).",
      },
      {
        when: "after",
        text: "Klopft er ab: sofort loslassen. Im Training immer langsam ansetzen – dein Partner vertraut dir.",
      },
    ],
  },
];

/**
 * Bauplan 38: Zusatz-Lektion „Guard ziehen oder Takedown?“ (bewusst nicht in TUTORIALS_K2 – die drei Kern-Lektionen bleiben die Danaher-Reihe).
 * BJJ vs. MMA: Guard ziehen ist im BJJ erlaubt, bringt aber keine Punkte (Karte cl_pull_guard, mma: "nein");
 * im MMA drohen unten Schläge – Ziel ist oben landen oder wieder aufstehen.
 * Quellen: Evolve MMA, How To Stay Safe And Effective Off Your Back In MMA (https://evolve-mma.com/blog/how-to-stay-safe-and-effective-off-your-back-in-mma/);
 *          Evolve MMA, 5 Ways To Counter Takedowns In No-Gi BJJ (Underhook als Clinch-Basis, https://evolve-mma.com/blog/5-ways-to-counter-takedowns-in-no-gi-bjj/);
 *          IBJJF-Punkte (Takedown 2) wie in cards.ts.
 */
export const TUTORIAL_GUARD_ODER_TD: TutorialK2Def = {
  id: "k2-guard-oder-takedown",
  title: "Guard ziehen oder Takedown?",
  idea: "BJJ erlaubt Guard ziehen – im MMA bringt dich ein Takedown nach oben.",
  // Clinch, Underhook sitzt schon (Arme +1): Body Lock ist sofort spielbar.
  start: { pos: "clinch", top: null, board: { arme: 1 } },
  // Ziel: oben am Boden landen (Takedown) – nicht unten in der eigenen Guard.
  goal: [
    { pos: "half", role: "top" },
    { pos: "guard", role: "top" },
    { pos: "turtle", role: "top" },
  ],
  aiLevel: 1,
  maxRounds: 8,
  // Mechanik 4: eine Idee pro Lektion – hier keine verdeckten Konter.
  konter: false,
  stil: false,
  steps: [
    {
      round: 1, when: "start", highlightZone: "beine",
      text: "Du und er im Clinch. Zwei Wege zu Boden: Guard ziehen – du landest unten. Oder Takedown – du landest oben.",
    },
    {
      round: 1, when: "start",
      text: "Im BJJ ist Guard ziehen erlaubt, bringt aber keine Punkte. Im MMA schlägt er dich von oben – die Karte zeigt „MMA nein“.",
    },
    {
      round: 1, when: "pick", requireCard: "cl_body_lock", highlightZone: "huefte",
      text: "Dein Arm ist schon unter seiner Achsel (Underhook). Spiel „Umklammern und umkippen“ (Body Lock) – du landest oben.",
    },
    {
      round: 1, when: "after",
      text: "Oben gibt es 2 Punkte für den Takedown. Gestoppt? Hol dir wieder den Underhook, dann versuch es neu.",
    },
    {
      round: 2, when: "start",
      text: "Jetzt du allein: Bring ihn zu Boden und bleib oben. Guard ziehen ist erlaubt – hier aber nicht das Ziel.",
    },
  ],
};
