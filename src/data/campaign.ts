// Gürtel-Kampagne: Gürtel, Gegner-Archetypen, Starterdeck. Belohnungen sind deterministisch und bilden einen Lehrpfad.
import type { Archetype, BeltId } from "../engine/types";
import { EXPANSION_REWARDS } from "./expansion";

export interface Belt { id: BeltId; name: string; color: string; accent: string }

export const BELTS: Belt[] = [
  { id: "weiss", name: "Weißgurt", color: "#f4f1ea", accent: "#c9c4b8" },
  { id: "blau", name: "Blaugurt", color: "#1f5fbf", accent: "#5d8fe0" },
  { id: "lila", name: "Lilagurt", color: "#6b3fa0", accent: "#9b72cf" },
  { id: "braun", name: "Braungurt", color: "#6e4524", accent: "#9c6b42" },
  { id: "schwarz", name: "Schwarzgurt", color: "#141414", accent: "#c8102e" },
];

/** Kompakte Deck-Notation: [id, Anzahl]. */
function deck(...entries: [string, number][]): string[] {
  return entries.flatMap(([id, n]) => Array.from({ length: n }, () => id));
}

/** Starterdeck (20) – deckt die ganze Kette ab: Distanz → Takedown → Pass → Mount → Rücken → RNC. */
export const STARTER_DECK: string[] = deck(
  ["jab", 1], ["level_change", 1], ["double_leg", 2], ["clinch_entry", 1], ["collar_tie", 1],
  ["snap_down", 1], ["sprawl", 2], ["head_up", 1], ["stack_pass", 1], ["hip_bump", 1],
  ["shrimp_recover", 1], ["upa", 1], ["elbow_knee", 1], ["wrist_free", 1], ["to_mount", 1], ["americana", 1],
  ["seatbelt_hooks", 1], ["rnc", 1],
);

/** Startsammlung: eindeutige Kartenids, die zu Beginn freigeschaltet sind (Deckbau: max. 2 Kopien, Legendär 1×). */
export const STARTER_COLLECTION: string[] = Array.from(new Set(STARTER_DECK));

/**
 * Yomi-Kurve über den Kampagnenfortschritt: reads 0.1 → 0.7, telegraph 0.9 → 0.15.
 * reads konvex (t^READS_EXP): Weiß/Blau/Lila steigen sanft, Braun/Schwarz ziehen an.
 * telegraph konkav (t^TELEGRAPH_EXP): die Absicht wird ab Blau seltener verraten, sonst sind die Prüfungen für
 * Spieler, die Absichten konsequent kontern, zu leicht. Beides per Simulation kalibriert (scripts/simulate.ts).
 */
const READS_EXP = 1.6;
const TELEGRAPH_EXP = 0.45;
function curve(i: number, n: number) {
  const t = n <= 1 ? 0 : i / (n - 1);
  const r2 = (x: number) => Math.round(x * 100) / 100;
  return { reads: r2(0.1 + 0.6 * Math.pow(t, READS_EXP)), telegraph: r2(0.9 - 0.75 * Math.pow(t, TELEGRAPH_EXP)) };
}

type ArchDraft = Omit<Archetype, "reads" | "telegraph">;

const DRAFTS: ArchDraft[] = [
  // ---------------- Weiß ----------------
  {
    id: "w_partner", name: "Tim", title: "Trainingspartner", belt: "weiss", tutorial: 1,
    blurb: "Tim baut lieber Griffe auf, als anzugreifen. Lerne das Dreieck: Ein Angriff schlägt ein Setup – bring ihn zu Boden!",
    likes: { setup: 2 },
    deck: deck(["level_change", 2], ["collar_tie", 2], ["underhook", 2], ["clinch_entry", 2], ["head_up", 2],
      ["base_post", 2], ["shrimp_recover", 2], ["elbow_knee", 2], ["upa", 2], ["hand_defense", 2]),
    reward: ["single_leg", "ankle_pick"],
  },
  {
    id: "w_ringer", name: "Rico", title: "Ringer", belt: "weiss", tutorial: 2,
    blurb: "Rico schießt auf alles, was sich bewegt. Reaktionen kontern nur die passende Familie: Sprawl gegen Shots.",
    likes: { angriff: 1, shot: 2, legs: 1 },
    deck: deck(["double_leg", 2], ["single_leg", 2], ["level_change", 2], ["jab", 1], ["clinch_entry", 1],
      ["collar_tie", 2], ["sprawl", 1], ["go_behind", 1], ["stack_pass", 2], ["to_mount", 1], ["americana", 1],
      ["shrimp_recover", 2], ["upa", 2]),
    reward: ["sprawl", "whizzer", "go_behind"],
  },
  {
    id: "w_guard", name: "Gisela", title: "Guard-Spielerin", belt: "weiss", tutorial: 3,
    blurb: "Gisela will unten liegen. Position vor Submission: Baue Kontrolle auf, bevor du abschließt – und halte deine Ellbogen eng.",
    likes: { setup: 1, armlock: 2, sweep: 1 },
    deck: deck(["armbar_guard", 2], ["kimura_guard", 1], ["hip_bump", 2], ["scissor_sweep", 1], ["head_up", 1],
      ["level_change", 1], ["clinch_entry", 1], ["base_post", 1], ["shrimp_recover", 2], ["elbow_knee", 2],
      ["upa", 1], ["hand_defense", 1], ["back_escape", 1], ["sit_out", 1], ["stack_pass", 1], ["sprawl", 1]),
    reward: ["armbar_guard", "posture_defense"],
  },
  {
    id: "w_boss", name: "Coach Ana", title: "Prüfung Weißgurt", belt: "weiss", boss: true,
    blurb: "Die Gürtelprüfung: Ana testet die ganze Kette – Distanz, Takedown, Kontrolle, Submission.",
    likes: { snap: 2, choke: 2, behind: 1 },
    deck: deck(["jab", 1], ["level_change", 1], ["clinch_entry", 2], ["collar_tie", 2], ["snap_down", 2],
      ["sprawl", 1], ["guillotine", 1], ["go_behind", 1], ["head_up", 1], ["stack_pass", 1],
      ["shrimp_recover", 2], ["upa", 2], ["to_mount", 1], ["rnc", 1], ["elbow_knee", 1]),


    reward: ["guillotine", "sit_out"],
  },
  // ---------------- Blau ----------------
  {
    id: "b_judoka", name: "Kenji", title: "Judoka", belt: "blau",
    blurb: "Kenji wartet im Clinch auf deinen Schwerpunkt. Frames und Hüfte zurück – der Sprawl hilft gegen Würfe nicht.",
    likes: { hip: 2, reap: 2, bodylock: 1, shoulderlock: 1 },
    deck: deck(["clinch_entry", 2], ["underhook", 2], ["o_goshi", 2], ["o_soto", 2], ["body_lock_trip", 1],
      ["frames_hips_back", 2], ["to_mount", 1], ["kimura_side", 2], ["americana", 1], ["shrimp_recover", 1],
      ["stack_pass", 2], ["double_leg", 1], ["sprawl", 1]),


    reward: ["o_goshi", "underhook", "frames_hips_back"],
  },
  {
    id: "b_striker", name: "Dana", title: "Striker", belt: "blau",
    blurb: "Dana hält dich mit dem Jab auf Distanz und kostet dich Gas. Schließe die Distanz hinter einer Finte.",
    likes: { strike: 2, shot: 1 },
    deck: deck(["jab", 2], ["clinch_entry", 1], ["double_leg", 2], ["single_leg", 1], ["sprawl", 2], ["head_up", 1],
      ["stack_pass", 1], ["base_post", 1], ["to_mount", 1], ["americana", 2], ["shrimp_recover", 1],
      ["upa", 1], ["elbow_knee", 1], ["sit_out", 1], ["hand_defense", 1], ["wrist_free", 1]),

    reward: ["two_on_one", "arm_drag"],
  },
  {
    id: "b_boss", name: "Professor Lima", title: "Prüfung Blaugurt", belt: "blau", boss: true,
    blurb: "Lima kombiniert Würfe und Shots. Wer nur eine Familie verteidigt, landet auf dem Rücken.",
    likes: { reap: 1, shot: 1, bodylock: 1, armlock: 1 },
    deck: deck(["level_change", 2], ["double_leg", 2], ["single_leg", 1], ["underhook", 1], ["body_lock_trip", 2],
      ["o_soto", 1], ["o_goshi", 2], ["sprawl", 2], ["frames_hips_back", 1], ["to_mount", 1],
      ["kimura_side", 1], ["armbar_mount", 1], ["americana", 1], ["clinch_entry", 1], ["upa", 1]),


    reward: ["o_soto", "body_lock_trip"],
  },
  // ---------------- Lila ----------------
  {
    id: "l_guard", name: "Mia", title: "Guard-Spielerin", belt: "lila",
    blurb: "Mia lebt in der Guard: Hip Bump und Kimura, Armbar und Triangle – immer in Paaren.",
    likes: { sweep: 2, shoulderlock: 1, armlock: 1, trianglechoke: 1 },
    deck: deck(["hip_bump", 1], ["kimura_guard", 1], ["armbar_guard", 2], ["triangle", 1], ["level_change", 2],
      ["head_up", 1], ["frames_hips_back", 1], ["sprawl", 2], ["shrimp_recover", 2], ["elbow_knee", 2],
      ["upa", 1], ["hand_defense", 1], ["back_escape", 1], ["collar_tie", 1], ["base_post", 1]),

    reward: ["kimura_guard", "scissor_sweep", "base_post"],
  },
  {
    id: "l_passer", name: "Bruno", title: "Pressure-Passer", belt: "lila",
    blurb: "Bruno passt mit Druck und lässt dich nicht atmen. Guard Retention oder Shrimp – sonst kommt der Mount.",
    likes: { pass: 2, advance: 2, shoulderlock: 1 },
    deck: deck(["double_leg", 1], ["level_change", 1], ["collar_tie", 1], ["stack_pass", 2], ["knee_slice", 2],
      ["base_post", 2], ["posture_defense", 1], ["to_mount", 2], ["kimura_side", 1], ["americana", 1],
      ["head_up", 1], ["armbar_mount", 1], ["shrimp_recover", 2], ["elbow_knee", 1], ["sprawl", 1]),


    reward: ["knee_slice", "kimura_side"],
  },
  {
    id: "l_boss", name: "Mestre Duarte", title: "Prüfung Lilagurt", belt: "lila", boss: true,
    blurb: "Duarte bestraft jede Submission ohne Kontrolle – und findet aus jeder Escape einen Weg zurück nach oben.",
    likes: { pass: 1, sweep: 1, trianglechoke: 1 },
    deck: deck(["level_change", 1], ["snap_down", 2], ["collar_tie", 2], ["sprawl", 1], ["hip_bump", 1],
      ["armbar_guard", 1], ["triangle", 1], ["knee_slice", 1], ["base_post", 1], ["posture_defense", 1],
      ["armbar_mount", 1], ["underhook_knees", 1], ["rnc", 1], ["head_up", 1], ["stack_pass", 1],
      ["hand_defense", 1], ["sit_out", 1], ["clinch_entry", 1]),

    reward: ["triangle", "underhook_knees"],
  },
  // ---------------- Braun ----------------
  {
    id: "br_wrestler", name: "Jonas", title: "Ringer (Scrambler)", belt: "braun",
    blurb: "Jonas lebt im Front Headlock: Snap Down, Go-Behind, Guillotine. Kopf hoch!",
    likes: { snap: 2, behind: 2, choke: 1 },
    deck: deck(["collar_tie", 1], ["snap_down", 2], ["single_leg", 1], ["sprawl", 1], ["go_behind", 2],
      ["guillotine", 1], ["elbow_block", 1], ["sit_out", 1], ["seatbelt_hooks", 2], ["rnc", 1],
      ["head_up", 1], ["hand_defense", 1], ["shrimp_recover", 2], ["level_change", 2], ["upa", 1]),

    reward: ["elbow_block", "mount_to_back"],
  },
  {
    id: "br_backtaker", name: "Lea", title: "Back-Taker", belt: "braun",
    blurb: "Lea will deinen Rücken. Arm Drag, Seatbelt, Hooks – und dann der Würger. Hände verteidigen zuerst.",
    likes: { drag: 2, behind: 2, choke: 2 },
    deck: deck(["two_on_one", 2], ["arm_drag", 2], ["collar_tie", 1], ["clinch_entry", 1], ["go_behind", 1],
      ["mount_to_back", 2], ["to_mount", 1], ["seatbelt_hooks", 1], ["rnc", 1], ["hand_defense", 2],
      ["back_escape", 1], ["shrimp_recover", 2], ["wrist_free", 1], ["sprawl", 2]),


    reward: ["hand_defense", "back_escape"],
  },
  {
    id: "br_boss", name: "Sensei Okada", title: "Prüfung Braungurt", belt: "braun", boss: true,
    blurb: "Okada wirft, kontrolliert und streckt den Arm – geduldig, mit voller Kontrolle.",
    likes: { reap: 1, armlock: 2, advance: 1, setup: 1 },
    deck: deck(["underhook", 1], ["o_soto", 2], ["o_goshi", 1], ["body_lock_trip", 2], ["sprawl", 1], ["to_mount", 2],
      ["armbar_mount", 2], ["americana", 1], ["kimura_side", 1], ["posture_defense", 1], ["wrist_free", 1],
      ["upa", 2], ["shrimp_recover", 1], ["double_leg", 1], ["single_leg", 1]),


    reward: ["armbar_mount", "ankle_pick"],
  },
  // ---------------- Schwarz ----------------
  {
    id: "s_mma", name: "Rafa", title: "MMA-Allrounder", belt: "schwarz",
    blurb: "Rafa mischt Jab, Shot und Clinch – und liest deine Muster.",
    likes: { strike: 2, shot: 1, advance: 1 },
    deck: deck(["jab", 2], ["level_change", 2], ["double_leg", 1], ["single_leg", 1], ["sprawl", 2],
      ["clinch_entry", 1], ["underhook", 1], ["body_lock_trip", 1], ["knee_slice", 1], ["to_mount", 1],
      ["mount_to_back", 1], ["seatbelt_hooks", 1], ["rnc", 1], ["shrimp_recover", 2], ["wrist_free", 1],
      ["frames_hips_back", 1]),


    reward: ["knee_slice"],
  },
  {
    id: "s_system", name: "Professor Vale", title: "System-Grappler", belt: "schwarz",
    blurb: "Vale greift nur in Paaren an. Jede Verteidigung öffnet den nächsten Angriff.",
    likes: { sweep: 2, shoulderlock: 1, trianglechoke: 1, snap: 1 },
    deck: deck(["snap_down", 1], ["head_up", 2], ["hip_bump", 2], ["kimura_guard", 1], ["armbar_guard", 1],
      ["triangle", 1], ["base_post", 2], ["posture_defense", 1], ["to_mount", 2], ["rnc", 1],
      ["elbow_knee", 1], ["shrimp_recover", 2], ["upa", 1], ["wrist_free", 1], ["collar_tie", 1]),

    reward: ["arm_drag"],
  },
  {
    id: "s_boss", name: "Großmeister Hara", title: "Prüfung Schwarzgurt", belt: "schwarz", boss: true,
    blurb: "Die letzte Prüfung. Hara kennt jede Kette – und weiß, was du als Nächstes tust.",
    likes: { advance: 1, choke: 1, behind: 1 },
    deck: deck(["level_change", 2], ["double_leg", 1], ["collar_tie", 2], ["snap_down", 1], ["arm_drag", 2],
      ["sprawl", 1], ["go_behind", 1], ["guillotine", 1], ["knee_slice", 1], ["base_post", 2],
      ["posture_defense", 1], ["to_mount", 1], ["mount_to_back", 1], ["seatbelt_hooks", 1], ["rnc", 1],
      ["hand_defense", 1]),

    reward: ["rnc"],
  },
];

export const ARCHETYPES: Archetype[] = DRAFTS.map((d, i) => ({ ...d, ...curve(i, DRAFTS.length), reward: [...d.reward, ...(EXPANSION_REWARDS[d.id] ?? [])] }));

export const ARCHETYPE: Record<string, Archetype> = Object.fromEntries(ARCHETYPES.map((a) => [a.id, a]));

export function archetypesForBelt(belt: BeltId): Archetype[] {
  return ARCHETYPES.filter((a) => a.belt === belt);
}
