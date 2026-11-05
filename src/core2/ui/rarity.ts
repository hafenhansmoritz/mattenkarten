// Kern 2 – Seltenheit nach Lernwert (Schritt 70).
// Grundlage = was Anfänger zuerst brauchen (Befreiungen, Rahmen) · Meister = Aufgabegriffe · Rest = Technik.
// Reine Ableitung aus den Kartendaten – keine eigene Liste, damit neue Karten automatisch passen.
import type { Card2 } from "../types";

export type Rarity = "grundlage" | "technik" | "meister";
export const RARITIES: Rarity[] = ["grundlage", "technik", "meister"];

export const RARITY_LABEL: Record<Rarity, string> = { grundlage: "Grundlage", technik: "Technik", meister: "Meister" };
/** Ein Satz, warum die Stufe so heißt (Sammlung, Tooltip). */
export const RARITY_HINT: Record<Rarity, string> = {
  grundlage: "Zuerst lernen: schützen und befreien.",
  technik: "Position aufbauen, passieren, umdrehen.",
  meister: "Aufgabegriff: erst Position, dann beenden.",
};

export function rarityOf(c: Pick<Card2, "kind" | "submission" | "to">): Rarity {
  if (c.submission) return "meister";
  if (c.kind === "rahmen" || c.to?.escape) return "grundlage";
  return "technik";
}

/** MMA-Hinweis einer Karte: eigenes Feld (falls vorhanden) oder Schlüssel „MMA: …“. */
export function mmaNote(c: Card2): string | null {
  // Kern 2 B18: Einstufung in `mma` ("ok" | "riskant" | "nein"), der Satz steht in `mmaNote`.
  if (c.mmaNote?.trim()) return c.mmaNote.trim();
  const own = (c as Card2 & { mma?: unknown }).mma;
  if (typeof own === "string" && own.trim() && !["ok", "riskant", "nein"].includes(own)) return own.trim();
  const k = c.keys.find((x) => /^MMA:/i.test(x.trim()));
  return k ? k.trim().replace(/^MMA:\s*/i, "") : null;
}
