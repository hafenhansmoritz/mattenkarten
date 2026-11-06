// Mechanik 8 – Karten, die in Mattenpaketen stecken können: alle Kern-2-Karten (No-Gi, keine Beinhebel).
// Eigenes Modul, damit der Hinweis-Speicher (store.ts) die Karten-Engine nicht in den Start-Chunk zieht.
import { allCards } from "../engine";
import { rarityOf } from "../ui/rarity";
import type { PoolCard } from "./table";

let cache: PoolCard[] | null = null;
export function packPool(): PoolCard[] {
  return (cache ??= allCards().map((c) => ({ id: c.id, rarity: rarityOf(c) })));
}
