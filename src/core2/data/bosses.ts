// Kern 2 – Bosse mit Spielstil (Bauplan 73, B28).
// Jeder Boss = KI Stufe 2/3 + Gewichtsprofil (AiStyle). Dazu ein Konter-Profil, mit dem die Simulation
// (bosses.test.ts, simulate2.ts) prüft, dass die richtige Gegenstrategie wirklich hilft.
// Quellen (per WebFetch geprüft, 2026-11-06):
//  - Evolve MMA, 5 Ways To Counter Takedowns In No-Gi BJJ: Underhook, Sprawl (Hüfte runter), danach Front Headlock → Guillotine.
//  - Evolve MMA, BJJ Takedown 101: The Snap Down.
//  - Evolve MMA, 5 Attacks From The BJJ Full Guard: Armbar, Triangle, Kimura, Hip-Bump- und Scissor-Sweep.
//  - BJJ Atlas, Stack Pass: „postured up – head up, spine straight“; gebrochene Haltung führt ins Triangle/Armbar.
//  - Evolve MMA, How To Stay Safe And Effective Off Your Back In MMA: unten drohen Schläge, Ziel ist aufstehen oder sweepen.
//  - JitsuIQ, Side Control: Crossface + Underhook, Gewicht auf der Brust; Americana/Kimura; unten Rahmen + Shrimp.
//  - Evolve MMA, The Complete Guide to the BJJ Turtle: Rücken zeigen ist gefährlich, Seatbelt, Sit Out.
//  - Grapplearts, Preventing & Escaping the RNC: Hände kämpfen, Kinn runter, zur Seite rausrollen.
import type { AiStyle } from "../engine/ai";
import type { Pos2, Side } from "../types";

type Src = { title: string; url: string };
const SRC = {
  tdCounter: { title: "Evolve MMA – 5 Ways To Counter Takedowns In No-Gi BJJ", url: "https://evolve-mma.com/blog/5-ways-to-counter-takedowns-in-no-gi-bjj/" },
  snapDown: { title: "Evolve MMA – BJJ Takedown 101: The Snap Down", url: "https://evolve-mma.com/blog/bjj-takedown-101-the-snap-down/" },
  fullGuard: { title: "Evolve MMA – 5 Attacks From The BJJ Full Guard", url: "https://evolve-mma.com/blog/5-attacks-from-the-bjj-full-guard/" },
  stackPass: { title: "BJJ Atlas – Stack Pass", url: "https://bjj-atlas.pages.dev/guard-passing/stack-pass" },
  offBack: { title: "Evolve MMA – How To Stay Safe And Effective Off Your Back In MMA", url: "https://evolve-mma.com/blog/how-to-stay-safe-and-effective-off-your-back-in-mma/" },
  side: { title: "JitsuIQ – Side Control", url: "https://jitsuiq.com/positions/side-control/side-control.html" },
  turtle: { title: "Evolve MMA – The Complete Guide to the BJJ Turtle", url: "https://evolve-mma.com/blog/the-complete-guide-to-the-bjj-turtle-position/" },
  rnc: { title: "Grapplearts – Preventing & Escaping the RNC", url: "https://www.grapplearts.com/preventing-escaping-the-rnc/" },
} satisfies Record<string, Src>;

export interface BossDef {
  id: "ringer" | "guard" | "druecker" | "ruecken";
  name: string;
  /** Kurzer Untertitel (≤ 5 Wörter). */
  tagline: string;
  /** KI-Grundstufe, auf die das Stilprofil aufsetzt. */
  level: 2 | 3;
  style: AiStyle;
  /** Konter-Heuristik (für Simulation und als Tipp): so spielt man richtig dagegen. */
  counter: AiStyle;
  /** Intro: „Was er/sie gern macht“ (≤ 25 Wörter). */
  likes: string;
  /** Intro: „Wie du dagegen spielst“ (≤ 25 Wörter). */
  howTo: string;
  /** Optionaler MMA-Satz (≤ 15 Wörter). */
  mma?: string;
  /** Lehrsatz nach dem Match (≤ 15 Wörter). */
  lesson: string;
  /** Kartenbild: Lieblingslage (Boss = "o"). */
  scene: { pos: Pos2; top: Side | null };
  /** Diese Lagen zeigen den Stil (Sim: häufiger als die Grundstufe ohne Stil). Schlüssel "pos/role" aus Boss-Sicht. */
  signature: string[];
  sources: Src[];
  check?: boolean;
}

export const BOSSES: BossDef[] = [
  {
    id: "ringer",
    name: "Der Ringer",
    tagline: "Kampf im Stand",
    level: 3,
    style: {
      pos: { "clinch/neutral": 3, "headlock/top": 6, "turtle/top": 1.5, "guard/bottom": -3, "half/bottom": -1 },
      cards: {
        nd_double_leg: 1.5, nd_single_leg: 1.5, nd_clinch_entry: 1.5, nd_level_change: 1, cl_snap_down: 4, cl_body_lock: 1.5,
        nd_outside_foot: 2, cl_collar_tie: 3, cl_underhook: 1, nd_sprawl: 2, hl_elbow_pull: 1, gb_wrestle_up: 2.5, hlb_stand_up: 1, tb_stand_up: 1.5,
        hb_come_up: 1.5, cl_pull_guard: -6,
      },
      subs: { guillotine: 1 },
      // Mechanik 2: seine Signatur-Griffe im Clinch.
      grips: { collar_tie: 1.5, underhook: 1 },
      // Mechanik 3: Signatur-Kette Snap Down → Go-Behind.
      chains: { hl_go_behind: 2 },
      // Mechanik 4: sein vorbereiteter Sprawl gegen deinen Shot.
      konter: { nd_sprawl: 2 },
    },
    counter: {
      // Am Boden oben ist er schwächer: Lagen oben aufwerten, Front Headlock unten meiden.
      pos: { "headlock/bottom": -3, "guard/top": 1, "half/top": 1.5, "side/top": 1.5 },
      cards: { nd_sprawl: 1, cl_hips_back: 1, cl_underhook: 1, hlb_hands: 1.5, hlb_head_out: 1.5, tb_guillotine_def: 1 },
      // Mechanik 4: Hände und Kopf vorbereiten gegen seinen Snap Down, selbst den Sprawl bereithalten.
      konter: { nd_hand_fight: 1.5, nd_sprawl: 1 },
    },
    likes: "Er bleibt gern im Stand und im Clinch. Er schießt auf deine Beine und zieht deinen Kopf runter (Snap Down).",
    howTo: "Schießt er, sprawlst du: Beine nach hinten, Hüfte runter. Im Clinch erst den Underhook holen. Unten am Boden ist er schwächer.",
    lesson: "Gegen Shots zuerst sprawlen. Hast du dabei seinen Kopf, fass den Front Headlock.",
    scene: { pos: "headlock", top: "o" },
    signature: ["clinch/neutral", "headlock/top"],
    sources: [SRC.tdCounter, SRC.snapDown],
  },
  {
    id: "guard",
    name: "Die Guard-Spielerin",
    tagline: "Gefährlich von unten",
    level: 3,
    style: {
      pos: { "guard/bottom": 4, "half/bottom": 1, "mount/top": 1.5, "side/bottom": -1 },
      cards: {
        nd_clinch_entry: 1.5, cl_pull_guard: 5, gb_triangle: 2, gb_guillotine: 2, gb_armbar: 1.5, gb_butterfly_sweep: 2,
        gb_break_posture: 1.5, gb_wrist_control: 1, hb_recover: 2.5, hb_old_school: 1.5, scb_shrimp: 1.5, scb_knee_in: 1.5,
        bb_shrimp: 1.5, mb_elbow_escape: 1, gb_wrestle_up: -2,
      },
      subs: { triangle: 2, guillotine: 1.5, armbar: 1 },
      grips: { wrist: 1.5 },
      // Mechanik 3: Signatur-Kette Armbar ↔ Triangle.
      chains: { gb_triangle: 2, gb_armbar: 2 },
      // Mechanik 4: Hüfte raus, Knie dazwischen – vorbereitet gegen deinen Pass.
      konter: { gb_hip_frame: 2 },
    },
    counter: {
      pos: { "side/top": 2, "half/top": 1 },
      cards: { gt_posture: 2.5, gt_elbows_in: 2.5, gt_both_arms: 3, gt_base_post: 2.5, gt_knee_slice: 1, gt_toreando: 1, gt_body_lock: 1, gt_open_guard: 0.5 },
      // Mechanik 4: Ellbogen eng und Hals schützen, bevor sie Armbar oder Triangle ansetzt.
      konter: { gt_elbows_in: 1.5, gt_both_arms: 1.5 },
    },
    likes: "Sie zieht die Guard und kämpft gern von unten: Sweeps, Triangle, Armbar, Guillotine.",
    howTo: "Bleib aufrecht (Posture): Kopf hoch, Rücken gerade, Ellbogen eng – nie nur ein Arm drin. Erst Haltung, dann passieren.",
    mma: "Im MMA ist Guard ziehen riskant: unten kassierst du Schläge.",
    lesson: "In ihrer Guard gilt: Haltung zuerst – dann passieren.",
    scene: { pos: "guard", top: "p" },
    signature: ["guard/bottom"],
    sources: [SRC.fullGuard, SRC.stackPass, SRC.offBack],
  },
  {
    id: "druecker",
    name: "Der Drücker",
    tagline: "Schwer von oben",
    level: 3,
    style: {
      pos: { "side/top": 3, "mount/top": 4, "half/top": 1.5, "guard/bottom": -2, "side/bottom": -1, "mount/bottom": -1 },
      cards: {
        nd_single_leg: 1, cl_body_lock: 1.5, gt_body_lock: 1, gt_knee_slice: 1, ht_crossface: 1.5, ht_flatten: 1.5, ht_underhook: 1,
        ht_knee_slide: 1, sct_crossface: 1.5, sct_far_hip: 1.5, sct_underhook: 1, sct_to_mount: 1.5, sct_hip_block: 1,
        mt_heavy_hips: 1.5, mt_knee_pinch: 1, sct_americana: 2, sct_kimura: 2, mt_americana: 2,
      },
      subs: { americana: 2, kimura: 2 },
      grips: { crossface: 2, underhook: 1 },
      // Mechanik 3: Signatur-Ketten Americana ↔ Kimura (Side) und Americana ↔ Armbar (Mount).
      chains: { sct_kimura: 2, sct_americana: 1.5, mt_armbar: 2, mt_americana: 1.5 },
      // Mechanik 4: Hüfte zumachen und Knie zusammen – deine Flucht ist schon eingeplant.
      konter: { sct_hip_block: 1.5, mt_knee_pinch: 1 },
    },
    counter: {
      pos: { "side/bottom": -2, "mount/bottom": -3 },
      cards: {
        scb_frame: 1.5, scb_v_frame: 3.5, scb_protect_arms: 4, bot_elbow_knee: 1.5, scb_shrimp: 2, scb_head_arm_def: 2,
        mb_elbows_tight: 4, mb_knee_inside: 1.5, mb_elbow_escape: 2, hb_knee_shield: 2, hb_underhook: 1.5, nd_sprawl: 1.5, cl_hips_back: 1.5,
      },
      // Mechanik 4: Rahmen bauen, bevor die Keile sitzen – Knie davor, Arme eng, vorbereitet.
      konter: { scb_v_frame: 3, scb_protect_arms: 3, mb_elbows_tight: 3, hb_knee_shield: 2 },
    },
    likes: "Er kommt nach oben und drückt: Kopf wegdrehen (Crossface), Hüfte keilen. Dann Seitenkontrolle, Mount, Americana und Kimura.",
    howTo: "Rahmen bauen, bevor die Keile sitzen. Ellbogen eng, Arme nicht weggeben. Dann wegrutschen (Shrimp) und die Guard zurückholen.",
    lesson: "Unten zählt der erste Rahmen – je früher, desto leichter raus.",
    scene: { pos: "side", top: "o" },
    signature: ["side/top", "mount/top"],
    sources: [SRC.side],
  },
  {
    id: "ruecken",
    name: "Die Rückenjägerin",
    tagline: "Immer hinter dir",
    level: 3,
    style: {
      pos: { "back/top": 5, "turtle/top": 3, "headlock/top": 1, "mount/top": 1 },
      cards: {
        nd_arm_drag: 2, hl_go_behind: 2.5, tt_seatbelt: 1.5, tt_hip_pressure: 1, tt_back_take: 2.5, bt_seatbelt: 1.5, bt_hooks: 1.5,
        bt_clear_hands: 1, bt_rnc: 2, bt_hook_retention: 1, bt_follow: 1, mt_to_back: 2.5, hb_back_take: 2,
      },
      subs: { rnc: 3, back_armbar: 1 },
      grips: { seatbelt: 1, chin_strap: 0.5 },
      // Mechanik 3: Signatur-Kette RNC → Armbar vom Rücken.
      chains: { bt_armbar: 2 },
      // Mechanik 4: Haken drin lassen – deine Flucht vom Rücken ist schon eingeplant.
      konter: { bt_hook_retention: 1 },
    },
    counter: {
      pos: { "turtle/bottom": -3, "back/bottom": -4, "clinch/neutral": -1.5 },
      cards: {
        mb_no_back: 3, bb_chin_tuck: 4, bb_elbows_tight: 3, bb_hand_fight: 2.5, bb_shrimp: 2, bb_escape_side: 2,
        tb_sit_out: 2, tb_stand_up: 2, tb_shell: 3.5, hlb_elbow_in: 3.5, scb_underhook: -2,
        // Mechanik 2: ihren Seatbelt lösen (Hände frei machen), in der Half Guard selbst den Underhook holen (verdrängt ihren) – sonst geht sie an den Rücken.
        tb_hands: 2.5, ht_underhook: 2,
      },
      // Mechanik 4: Ellbogen an die Knie und Gesicht zu ihr, bevor sie rumgeht oder die Haken setzt.
      konter: { tb_shell: 4, hlb_elbow_in: 3, mb_no_back: 3, bb_chin_tuck: 2 },
    },
    likes: "Sie will hinter dich: Arm ziehen, Turtle, Oberkörper umklammern (Seatbelt), Haken rein – dann der Würger von hinten.",
    howTo: "Zeig ihr nie den Rücken. Kinn runter, Hände an ihre Würgehand. Aus der Turtle sofort raussitzen (Sit Out) oder aufstehen.",
    lesson: "Wer den Rücken zeigt, gibt den Hals frei – Gesicht zu ihr.",
    scene: { pos: "back", top: "o" },
    signature: ["turtle/top", "back/top"],
    sources: [SRC.turtle, SRC.rnc],
  },
];

export const BOSS: Record<BossDef["id"], BossDef> = Object.fromEntries(BOSSES.map((b) => [b.id, b])) as Record<BossDef["id"], BossDef>;
