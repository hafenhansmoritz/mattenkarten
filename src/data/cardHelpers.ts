import type { PositionId, Role, Slot } from "../engine/types";

export const at = (pos: PositionId, role: Role = "neutral"): Slot => ({ pos, role });

export const DIST = at("dist");
export const CLINCH = at("clinch");
export const FHL_TOP = at("fhl", "top");
export const FHL_BOTTOM = at("fhl", "bottom");
export const GUARD_TOP = at("guard", "top");
export const GUARD_BOTTOM = at("guard", "bottom");
export const SIDE_TOP = at("side", "top");
export const SIDE_BOTTOM = at("side", "bottom");
export const MOUNT_TOP = at("mount", "top");
export const MOUNT_BOTTOM = at("mount", "bottom");
export const BACK_TOP = at("back", "top");
export const BACK_BOTTOM = at("back", "bottom");

/** Alle 12 Slots der Kampfkette (für Tests und Validierung). */
export const ALL_SLOTS: Slot[] = [
  DIST, CLINCH, FHL_TOP, FHL_BOTTOM, GUARD_TOP, GUARD_BOTTOM,
  SIDE_TOP, SIDE_BOTTOM, MOUNT_TOP, MOUNT_BOTTOM, BACK_TOP, BACK_BOTTOM,
];

export const SAFETY_SUB = "Im Training langsam ansetzen, früh abklopfen, beim Tap sofort loslassen.";
export const SAFETY_THROW = "Ukemi (Fallschule) zuerst. Partner kontrolliert ablegen – kein Slam.";
