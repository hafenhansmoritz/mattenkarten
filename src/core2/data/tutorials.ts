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
    title: "Raus von unten",
    idea: "Unten im Mount: erst Knie und Ellbogen zusammen, dann raus.",
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
    steps: [
      {
        round: 1, when: "start", highlightZone: "beine",
        text: "Er sitzt auf dir (Mount). Keine Panik: erst schützen, dann raus. Das Brett zeigt, wo du gerade schwach bist.",
      },
      {
        round: 1, when: "pick", requireCard: "mb_knee_inside", highlightZone: "beine",
        text: "Bring dein Knie innen an seinen Knöchel, Ellbogen dazu (Ellbogen-Knie-Verbindung). Das ist dein Rahmen.",
      },
      {
        round: 1, when: "after", highlightZone: "beine",
        text: "Deine Beine sind nicht mehr im Minus. Damit wird „Wegrutschen, Knie dazwischen“ spielbar.",
      },
      {
        round: 2, when: "pick", requireCard: "mb_elbow_escape", highlightZone: "beine",
        text: "Jetzt raus: seitlich wegrutschen, Knie zwischen euch (Elbow Escape). Sein Bein ist gefangen – du bist in der halben Guard.",
      },
      {
        round: 2, when: "after",
        text: "Geblockt? Dann wechsle die Richtung: Brücke und rollen (Upa). Oder baue erst wieder deinen Rahmen.",
      },
      {
        round: 3, when: "start",
        text: "Jetzt du allein. Erst Rahmen, dann befreien. Rot zeigt, wo er gerade angreifen kann.",
      },
    ],
  },
  {
    id: "k2-keile-vorbeigehen",
    title: "Keile bauen, vorbeigehen",
    idea: "Oben in der Guard: erst Hüfte und Beine blockieren, dann vorbei.",
    // Hüfte schon +1 (erster Keil sitzt) – so ist sein Hüft-Sweep (Hip Bump) anfangs nicht spielbar.
    start: { pos: "guard", top: "p", board: { huefte: 1 } },
    goal: [{ pos: "side", role: "top" }],
    aiLevel: 1,
    maxRounds: 8,
    steps: [
      {
        round: 1, when: "start", highlightZone: "huefte",
        text: "Du kniest in seiner Guard. Deine Hüfte drückt schon auf seine (Keil). Zum Vorbeigehen brauchst du Hüfte und Beine.",
      },
      {
        round: 1, when: "pick", requireCard: "gt_open_guard", highlightZone: "beine",
        text: "Zweiter Keil: Mach seine Beine auf (Guard öffnen). Danach liegst du an den Beinen vorne.",
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
    title: "Erst Griff, dann beenden",
    idea: "Eine Aufgabe ist ein Prozess: fangen, kontrollieren, beenden.",
    // Beine +2: seine Befreiungen (Elbow Escape, Upa) sind anfangs nicht spielbar – Fokus liegt auf den Armen.
    start: { pos: "mount", top: "p", board: { kopf: 1, arme: 1, huefte: 1, beine: 2 } },
    aiLevel: 1,
    maxRounds: 10,
    seed: 4242,
    steps: [
      {
        round: 1, when: "start", highlightZone: "arme",
        text: "Du sitzt oben (Mount). Eine Aufgabe hat drei Schritte: Arm fangen, kontrollieren, beenden. Jeder Treffer bringt einen Schritt.",
      },
      {
        round: 1, when: "pick", requireCard: "mt_americana", highlightZone: "arme",
        text: "Schritt 1: Dreh seinen gebeugten Arm langsam Richtung Matte (Americana). Das kostet 1 Kraft.",
      },
      {
        round: 1, when: "after", highlightZone: "arme",
        text: "Rahmt er mit dem Arm, rutscht deine Leiste einen Schritt zurück. Dann streckt er den Arm – das öffnet die Armbar.",
      },
      {
        round: 2, when: "pick", highlightZone: "arme",
        text: "Dilemma: Beugt er den Arm, drehst du (Americana). Streckt er ihn, streckst du weiter (Armbar). Bleib an den Armen.",
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
