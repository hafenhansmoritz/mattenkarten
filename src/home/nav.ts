// Navigation (UX-Review 06.11.2026): vier Tabs + Zahnrad. Ziele, die die Tabs öffnen können.
import type { JourneyStart } from "../journey/ReviewCard";

export type Tab = "start" | "spielen" | "ueben" | "gym";
export const TAB_LABEL: Record<Tab, string> = { start: "Start", spielen: "Spielen", ueben: "Üben", gym: "Gym" };

export type Target =
  | "program" | "gymweek" | "leglock" | "warmup" | "glossar" | "gym" | "hotseat" | "trainer" | "coach"
  | "sammlung" | "pakete" | "rangliste" | "daily" | "settings" | "klassik" | "impressum" | "datenschutz"
  | { journey: JourneyStart };
