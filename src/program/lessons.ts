// 7-Tage-Startprogramm – neue Kern-2-Lektionen für Tag 3, 4 und 5.
// Nur bestehende Karten aus src/core2/data/cards.ts. Lösbarkeit: lessons.test.ts (≥ 90 % über 30 Seeds).
// Quellen: research_notes/7 Tage Startprogramm/notes.md, docs/knowledge-base.md (Danaher: erst Pin-Escapes).
import type { TutorialK2Def } from "../core2/ui/tutorialTypes";

export const LESSONS_PROGRAM: TutorialK2Def[] = [
  {
    id: "p-side-escape",
    title: "Rahmen, Hüfte, Guard zurück",
    idea: "Unten in Side Control: erst Unterarm als Stütze, dann wegrutschen.",
    // Kopf im Minus (sein Crossface). Arme und Hüfte +1: Ellbogen innen, Knie an der Hüfte –
    // so bleibt die Lektion bei wechselnder Engine-Balance lösbar (Test: ≥ 90 % über 30 Seeds).
    start: { pos: "side", top: "o", board: { kopf: -1, arme: 1, huefte: 1 } },
    // Lektion 2 des Programms: jede Runde „Was passiert jetzt?“ (KB 8.5). Alle Zonen aktiv.
    predictAll: true,
    goal: [
      { pos: "guard", role: "bottom" },
      { pos: "half", role: "bottom" },
      { pos: "turtle", role: "bottom" },
    ],
    aiLevel: 1,
    maxRounds: 8,
    steps: [
      {
        round: 1, when: "start", highlightZone: "kopf",
        text: "Er liegt quer auf dir (Side Control). Erst schützt du deinen Hals, dann schaffst du Platz.",
      },
      {
        round: 1, when: "pick", requireCard: "scb_frame", highlightZone: "kopf",
        text: "Leg deinen Unterarm an seinen Hals und seine Hüfte (Frame). Du drückst nicht – du stützt nur ab.",
      },
      {
        round: 1, when: "after",
        text: "Der Rahmen hält ihn auf Abstand. In die Lücke kommt gleich deine Hüfte.",
      },
      {
        round: 2, when: "pick", requireCard: "bot_elbow_knee", highlightZone: "huefte",
        text: "Ellbogen und Knie zusammen. So kann er nicht über deine Hüfte steigen.",
      },
      {
        round: 2, when: "after", highlightZone: "huefte",
        text: "Deine Hüfte ist geschützt. Jetzt ist „Wegrutschen, Beine davor“ (Shrimp) spielbar.",
      },
      {
        round: 3, when: "start",
        text: "Jetzt du allein: wegrutschen und Beine zurück vor ihn. Fehlt Platz, bau erst den Rahmen nach.",
      },
    ],
  },
  {
    id: "p-guard-posture",
    title: "Haltung in der Guard",
    idea: "Oben in der Guard: erst aufrecht sitzen, dann seine Beine öffnen.",
    // Hüfte +1: dein Knie-Keil sitzt, sein Hüft-Sweep ist anfangs nicht spielbar. Arme +1: Ellbogen eng.
    // Fokus: erst Haltung (Kopf).
    start: { pos: "guard", top: "p", board: { arme: 1, huefte: 1 } },
    goal: [
      { pos: "half", role: "top" },
      { pos: "side", role: "top" },
      { pos: "mount", role: "top" },
    ],
    aiLevel: 1,
    maxRounds: 8,
    steps: [
      {
        round: 1, when: "start", highlightZone: "kopf",
        text: "Du kniest in seiner Guard. Er zieht deinen Kopf runter. Unten will er Würger und Armhebel.",
      },
      {
        round: 1, when: "pick", requireCard: "gt_posture", highlightZone: "kopf",
        text: "Setz dich aufrecht hin, Rücken gerade, Hände auf seinen Bauch (Posture). Dann kommt er schwer an dich ran.",
      },
      {
        round: 1, when: "after",
        text: "Merke: Oben heißt es „Haltung“. Unten heißt es „Haltung brechen“. Wer gewinnt, bestimmt das Spiel.",
      },
      {
        round: 2, when: "pick", highlightZone: "beine", predict: true,
        text: "Jetzt seine Beine aufmachen (Guard öffnen). Ohne offene Beine kommst du nicht vorbei.",
      },
      {
        round: 3, when: "start",
        text: "Jetzt du allein: Halte deine Haltung und geh an seinen Beinen vorbei. Rot zeigt seine Angriffe.",
      },
    ],
  },
  {
    id: "p-shot-sprawl",
    title: "Shot oder Sprawl",
    idea: "Im Stand: tief gehen, dann schießen – schießt er, Beine weg.",
    // Kopf +1: du stehst gut (Auslage, Blick nach vorn) – Fokus liegt auf Tiefe und Beinen.
    start: { pos: "stand", top: null, board: { kopf: 1 } },
    goal: [
      { pos: "guard", role: "top" },
      { pos: "half", role: "top" },
      { pos: "side", role: "top" },
      { pos: "turtle", role: "top" },
      { pos: "mount", role: "top" },
      { pos: "back", role: "top" },
    ],
    aiLevel: 1,
    maxRounds: 8,
    steps: [
      {
        round: 1, when: "start", highlightZone: "beine",
        text: "Du stehst ihm gegenüber. Wer den anderen zu Boden bringt (Takedown), landet oben.",
      },
      {
        round: 1, when: "pick", requireCard: "nd_level_change", highlightZone: "beine",
        text: "Geh erst in die Knie (Level Change). Aus der Tiefe kommst du an seine Beine.",
      },
      {
        round: 1, when: "after",
        text: "Jetzt sind seine Beine näher. Ein Schuss auf beide Beine (Double Leg) wird stärker.",
      },
      {
        round: 2, when: "pick", highlightZone: "beine", predict: true,
        text: "Greift er deine Beine an? Dann Beine nach hinten, Hüfte drauf (Sprawl). Sonst: schieß selbst.",
      },
      {
        round: 3, when: "start",
        text: "Jetzt du allein. Bring ihn runter und lande oben. Rot zeigt, wo er schießen kann.",
      },
    ],
  },
];
