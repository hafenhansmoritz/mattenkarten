// Perspektive der Erklärtexte (UX-Review 2, Punkt 4).
// Karten-Texte (why, chain.why) sind aus Sicht des Kartenbesitzers geschrieben („du“ = wer die Karte spielt,
// „er“ = sein Gegner). Spielt der Gegner die Karte, liest der Spieler den Satz aus seiner eigenen Sicht:
// „Enge Knie lassen keinen Platz für sein Knie“ → „… für dein Knie“. Automatisch: Pronomen und Possessiva tauschen,
// Verben neben du/er umbeugen. Wo das nicht reicht (Imperative, „er“ für Dinge), steht ein Text in WHY_OPP.
import type { Card2, Side } from "../types";
import { WHY_OPP, CHAIN_WHY_OPP } from "../data/whyOpp";

const POSS: Record<string, string> = {
  dein: "sein", deine: "seine", deinen: "seinen", deinem: "seinem", deiner: "seiner", deines: "seines",
};
const POSS_BACK: Record<string, string> = Object.fromEntries(Object.entries(POSS).map(([a, b]) => [b, a]));
const OBJ: Record<string, string> = { dich: "ihn", dir: "ihm", ihn: "dich", ihm: "dir" };

/** 2. Person Singular → 3. Person (unregelmäßige; regelmäßig: -st → -t, -est → -et). */
const DU_ER_IRREG: Record<string, string> = {
  bist: "ist", hast: "hat", wirst: "wird", kannst: "kann", musst: "muss", willst: "will", darfst: "darf",
  hältst: "hält", fällst: "fällt", läufst: "läuft", lässt: "lässt", liest: "liest", triffst: "trifft",
  siehst: "sieht", nimmst: "nimmt", gibst: "gibt", schiebst: "schiebt", isst: "isst", weißt: "weiß",
  schützt: "schützt", sitzt: "sitzt", setzt: "setzt", drückst: "drückt", löst: "löst", stößt: "stößt",
};
const ER_DU_IRREG: Record<string, string> = Object.fromEntries(
  Object.entries(DU_ER_IRREG).filter(([a, b]) => a !== b).map(([a, b]) => [b, a]),
);
const ER_DU_SAME = new Set(["schützt", "sitzt", "setzt", "löst", "lässt", "liest", "isst", "stößt"]);

function duToEr(v: string): string | null {
  const low = v.toLowerCase();
  if (DU_ER_IRREG[low]) return keepCase(v, DU_ER_IRREG[low]);
  if (/(t|d)est$/.test(low)) return keepCase(v, low.replace(/est$/, "et"));
  if (/st$/.test(low) && low.length > 3) return keepCase(v, low.replace(/st$/, "t"));
  return null;
}

function erToDu(v: string): string | null {
  const low = v.toLowerCase();
  if (ER_DU_SAME.has(low)) return v;
  if (ER_DU_IRREG[low]) return keepCase(v, ER_DU_IRREG[low]);
  if (/(t|d)et$/.test(low)) return keepCase(v, low.replace(/et$/, "est"));
  if (/[szß]t$/.test(low)) return v;
  if (/t$/.test(low) && low.length > 2) return keepCase(v, low.replace(/t$/, "st"));
  return null;
}

function keepCase(orig: string, repl: string): string {
  return orig[0] === orig[0].toUpperCase() ? repl[0].toUpperCase() + repl.slice(1) : repl;
}

/** Konjunktionen, nach denen das Verb ans Ende des Teilsatzes rückt. */
const SUB_CONJ = new Set(["bis", "während", "wenn", "sobald", "bevor", "weil", "dass", "ob", "solange", "nachdem", "falls"]);

/** Wörter, die nach du/er kein Verb sind (dann wird nur das Pronomen getauscht). */
const NOT_VERB = new Set(["nicht", "auch", "schon", "noch", "nur", "sofort", "selbst", "dann", "oben", "unten", "den", "die", "das", "ihn", "ihm", "dich", "dir", "sich", "mit", "an", "in", "zu", "am", "im", "vor", "hinter", "seinen", "deinen", "seine", "deine", "sein", "dein", "es", "einen", "eine", "wieder", "erst", "oft", "kaum", "weiter", "sie"]);

/**
 * Tauscht die Perspektive eines du-Textes: du ↔ er, dein ↔ sein, dich/dir ↔ ihn/ihm; das Verb direkt vor oder nach
 * dem Pronomen wird umgebeugt („kommst du“ → „kommt er“, „er kann“ → „du kannst“). Groß-/Kleinschreibung bleibt.
 */
export function flipPerspective(text: string): string {
  const tok = text.split(/([A-Za-zÄÖÜäöüß]+)/);
  // Wörter stehen an ungeraden Indizes.
  const isWord = (i: number) => i % 2 === 1 && i < tok.length;
  const done = new Set<number>();
  const nextWord = (i: number) => (isWord(i + 2) && /^\s+$/.test(tok[i + 1]) ? i + 2 : -1);
  const prevWord = (i: number) => (isWord(i - 2) && /^\s+$/.test(tok[i - 1]) ? i - 2 : -1);
  for (let i = 1; i < tok.length; i += 2) {
    if (done.has(i)) continue;
    const w = tok[i], low = w.toLowerCase();
    if (low === "du" || low === "er") {
      const toEr = low === "du";
      tok[i] = keepCase(w, toEr ? "er" : "du");
      done.add(i);
      // Reflexiv: „stemmt er sich“ → „stemmst du dich“, „drehst du dich“ → „dreht er sich“ (bis zum Satzzeichen).
      for (let k = i + 2; k < tok.length && k <= i + 8; k += 2) {
        if (/[,.;:–()]/.test(tok[k - 1])) break;
        const lw = tok[k].toLowerCase();
        if (toEr && lw === "dich" && k <= i + 4 && !/^(zu|an|über|hinter|vor|auf|gegen|für|um)$/i.test(tok[k - 2])) { tok[k] = "sich"; done.add(k); break; }
        if (!toEr && lw === "sich") { tok[k] = "dich"; done.add(k); break; }
      }
      // Nebensatz („bis er auf die Hände fällt“): das Verb steht am Ende des Teilsatzes.
      const pw = prevWord(i);
      if (pw > 0 && SUB_CONJ.has(tok[pw].toLowerCase())) {
        let end = i;
        for (let k = i + 2; k < tok.length; k += 2) { if (/[,.;:–()]/.test(tok[k - 1])) break; end = k; }
        if (end > i && !done.has(end)) {
          const nv = toEr ? duToEr(tok[end]) : erToDu(tok[end]);
          if (nv) { tok[end] = nv; done.add(end); }
        }
        continue;
      }
      // Verb danach („du landest“) oder davor („landest du“, „Kommst du“).
      for (const j of [prevWord(i), nextWord(i)]) {
        if (j < 0 || done.has(j)) continue;
        const v = tok[j];
        if (NOT_VERB.has(v.toLowerCase()) || POSS[v.toLowerCase()] || POSS_BACK[v.toLowerCase()]) continue;
        // Großgeschriebene Wörter mitten im Satz sind Nomen (außer am Satzanfang).
        const atStart = j === 1 || /[.!?:–]\s*$/.test(tok[j - 1] ?? "");
        if (v[0] === v[0].toUpperCase() && !atStart) continue;
        const nv = toEr ? duToEr(v) : erToDu(v);
        if (nv) { tok[j] = nv; done.add(j); break; }
      }
      continue;
    }
    if (POSS[low]) { tok[i] = keepCase(w, POSS[low]); done.add(i); continue; }
    if (POSS_BACK[low]) { tok[i] = keepCase(w, POSS_BACK[low]); done.add(i); continue; }
    if (OBJ[low]) { tok[i] = keepCase(w, OBJ[low]); done.add(i); continue; }
  }
  return tok.join("");
}

/** Erklärung einer Karte aus Sicht des Spielers: eigene Karte wie geschrieben, Gegnerkarte umgedreht. */
export function whyFor(c: Card2, side: Side): string {
  if (side === "p") return c.why;
  return WHY_OPP[c.id] ?? flipPerspective(c.why);
}

/** Ketten-Erklärung aus Sicht des Spielers. */
export function chainWhyFor(c: Card2, side: Side): string {
  const w = c.chain?.why ?? "";
  if (side === "p" || !w) return w;
  return CHAIN_WHY_OPP[c.id] ?? flipPerspective(w);
}
