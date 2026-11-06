// Kern 2 – Spielpläne (Mechanik 6, Spec B51–B56): Standard-Plan je Spielstil, Signatur-Plan je Boss, gespeicherter Plan.
// Regeln (Ziehen, Mulligan, Grundlagen) stehen in engine/plan.ts – hier nur Inhalte und Speicher.
// Quelle (per WebFetch geprüft, 2026-11-06): Gracie Barra, How To Build Your A Game – „Study all aspects of that smaller number
// of A Game techniques and make them as sharp as possible.“ / „Foundation in the fundamentals comes first.“
import { PLAN_SIZE } from "../engine/plan";
import type { StilId } from "../types";
import { STIL_IDS } from "../engine/stil";

export const PLAN_SRC = { title: "Gracie Barra – How To Build Your A Game", url: "https://graciebarra.com/gb-learning/how-to-build-your-a-game" };

/** „Warum das im echten Grappling so ist“ (≤ 20 Wörter). */
export const PLAN_BJJ = "Erst die Grundlagen, dann wenige eigene Techniken – die übst du, bis sie richtig scharf sind.";
/** Die Regel in zwei Sätzen (Hub, Mulligan, Glossar). */
export const PLAN_RULE = [
  "Dein Spielplan sind 15 Angriffe: Du startest mit 4, tauschst einmal bis zu 2 und ziehst jede Runde 1.",
  "Gezogene Angriffe sind geübt und brauchen 1 weniger – Aufbauen, Rahmen und Befreiungen kann jeder, immer.",
];

export interface PlanDef {
  id: string;
  name: string;
  /** Zu welchem Stil er passt (Standard-Plan) bzw. wessen Stil (Boss). */
  stil: StilId;
  /** Idee in einem Satz (≤ 20 Wörter, du-Form). */
  idea: string;
  cards: string[];
}

/** B56 Standard-Spielpläne je Spielstil (spielbar, bevor es den Spielplan-Bauer gibt). Reihenfolge wie STIL_IDS. */
export const DEFAULT_PLANS: PlanDef[] = [
  {
    id: "std-ringer", name: "Ringer-Plan", stil: "ringer",
    idea: "Im Stand schießen, oben passieren, in Side Control und Mount mit Kimura, Americana oder Armbar beenden.",
    cards: [
      "nd_double_leg", "nd_single_leg", "nd_clinch_entry", "cl_snap_down", "gt_knee_slice", "ht_pass", "ht_knee_slide",
      "sct_to_mount", "sct_kimura", "sct_americana", "mt_americana", "tt_back_take", "mt_armbar", "gt_toreando", "gt_body_lock",
    ],
  },
  {
    id: "std-guard", name: "Guard-Plan", stil: "guard",
    idea: "Guard ziehen, dann Sweep, Triangle, Armbar oder Guillotine – und oben weiter.",
    cards: [
      "nd_clinch_entry", "cl_pull_guard", "cl_snap_down", "gb_butterfly_sweep", "gb_armbar", "gb_triangle", "gb_guillotine",
      "hl_guillotine", "mt_armbar", "mt_americana", "sct_arm_triangle", "mt_to_back", "ht_pass", "gt_body_lock", "nd_single_leg",
    ],
  },
  {
    id: "std-druecker", name: "Druck-Plan", stil: "druecker",
    idea: "Runterbringen, schwer passieren, in Side Control drücken – Arm-Triangle oder Americana.",
    cards: [
      "nd_double_leg", "nd_single_leg", "nd_clinch_entry", "cl_body_lock", "gt_body_lock", "gt_knee_slice", "ht_pass",
      "ht_knee_slide", "sct_to_mount", "sct_arm_triangle", "sct_americana", "mt_americana", "cl_snap_down", "nd_arm_drag", "hl_guillotine",
    ],
  },
  {
    id: "std-ruecken", name: "Rücken-Plan", stil: "ruecken",
    idea: "Arm Drag oder Snap Down, hinter ihn, Rücken nehmen – dann der Würger von hinten.",
    cards: [
      "nd_clinch_entry", "nd_single_leg", "nd_arm_drag", "cl_snap_down", "tt_back_take", "tt_to_headlock", "hl_go_behind",
      "hl_guillotine", "bt_rnc", "bt_armbar", "mt_to_back", "sct_to_mount", "gt_knee_slice", "ht_knee_slide", "sct_arm_triangle",
    ],
  },
];
export const DEFAULT_PLAN: Record<StilId, PlanDef> = Object.fromEntries(DEFAULT_PLANS.map((p) => [p.stil, p])) as Record<StilId, PlanDef>;

/** B55 Signatur-Pläne der Bosse (ihr A-Game aus data/bosses.ts: Lieblingslagen, Aufgaben, Griffe, Ketten). */
export const BOSS_PLANS: Record<StilId, PlanDef> = {
  ringer: {
    id: "boss-ringer", name: "Kopfklammer-System", stil: "ringer",
    idea: "Collar Tie, Snap Down, Kopf fassen – dann Guillotine oder dahinter.",
    cards: [
      "nd_double_leg", "nd_single_leg", "nd_clinch_entry", "cl_snap_down", "nd_arm_drag", "hl_guillotine", "hl_go_behind",
      "tt_back_take", "tt_to_headlock", "bt_rnc", "gt_knee_slice", "ht_pass", "sct_to_mount", "sct_kimura", "mt_americana",
    ],
  },
  guard: {
    id: "boss-guard", name: "Closed-Guard-System", stil: "guard",
    idea: "Guard ziehen, Handgelenk kontrollieren – Triangle, Armbar und Guillotine als Kette.",
    cards: [
      "nd_clinch_entry", "cl_pull_guard", "cl_snap_down", "nd_single_leg", "gb_butterfly_sweep", "gb_armbar", "gb_triangle",
      "gb_guillotine", "hl_guillotine", "mt_armbar", "mt_americana", "mt_to_back", "sct_arm_triangle", "ht_pass", "bt_rnc",
    ],
  },
  druecker: {
    id: "boss-druecker", name: "Druck-System", stil: "druecker",
    idea: "Crossface und Underhook, Side Control, Mount – Kimura und Americana.",
    cards: [
      "nd_double_leg", "nd_single_leg", "cl_body_lock", "gt_body_lock", "gt_knee_slice", "gt_toreando", "ht_pass",
      "ht_knee_slide", "sct_to_mount", "sct_kimura", "sct_americana", "sct_arm_triangle", "mt_americana", "mt_armbar", "mt_to_back",
    ],
  },
  ruecken: {
    id: "boss-ruecken", name: "Rücken-System", stil: "ruecken",
    idea: "Turtle, Seatbelt, Haken rein – RNC oder Armbar vom Rücken.",
    cards: [
      "nd_clinch_entry", "nd_single_leg", "nd_double_leg", "nd_arm_drag", "cl_snap_down", "tt_back_take", "tt_to_headlock",
      "hl_go_behind", "hl_guillotine", "bt_rnc", "bt_armbar", "mt_to_back", "sct_to_mount", "gt_knee_slice", "ht_knee_slide",
    ],
  },
};

export const ALL_PLANS: PlanDef[] = [...DEFAULT_PLANS, ...STIL_IDS.map((id) => BOSS_PLANS[id])];

// ---------------- Gewählter Spielplan (localStorage) ----------------
/** Gewählter Spielplan: { id, cards } – Prompt 7 (Spielplan-Bauer) speichert hier eigene Pläne mit derselben Form. */
export const PLAN_KEY = "mk.k2.plan";
/** Hinweis „So geht der Spielplan-Modus“ schon gesehen. */
export const PLAN_HINT_KEY = "mk.k2.plan.hint";

export interface SavedPlan { id: string; cards: string[] }

export function readPlan(): SavedPlan | null {
  try {
    const v = JSON.parse(localStorage.getItem(PLAN_KEY) ?? "null");
    if (v && typeof v.id === "string" && Array.isArray(v.cards) && v.cards.length === PLAN_SIZE && v.cards.every((x: unknown) => typeof x === "string")) return v;
    return null;
  } catch { return null; }
}
export function writePlan(p: SavedPlan): void {
  try { localStorage.setItem(PLAN_KEY, JSON.stringify(p)); } catch { /* privat oder voll */ }
}
export function readPlanHintSeen(): boolean {
  try { return localStorage.getItem(PLAN_HINT_KEY) === "1"; } catch { return false; }
}
export function markPlanHintSeen(): void {
  try { localStorage.setItem(PLAN_HINT_KEY, "1"); } catch { /* egal */ }
}
/** Name eines gespeicherten Plans (Standard-Plan oder „Eigener Plan“). */
export function planName(p: SavedPlan): string {
  return ALL_PLANS.find((x) => x.id === p.id)?.name ?? "Eigener Plan";
}
