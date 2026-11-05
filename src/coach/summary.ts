// Baut aus einem beendeten Match die kompakte Zusammenfassung für die Coach-Analyse.
import { CARD } from "../data/cards";
import { POSITION_GUIDE } from "../data/positions";
import { plainName, recap } from "../engine/learn";
import type { MatchState, Recap, Role, Side } from "../engine/types";
import type { CoachMatchSummary } from "./types";

const roleFor = (top: Side | null, side: Side): Role => (top === null ? "neutral" : top === side ? "top" : "bottom");
const ROLE_TXT: Record<Role, string> = { neutral: "", top: " oben", bottom: " unten" };

function named(id: string): string {
  const c = CARD[id];
  if (!c) return id;
  return c.plain && c.plain !== c.name ? `${c.plain} (${c.name})` : c.name;
}

/** Zusammenfassung für askCoach({ mode: "analysis", match }). `rc` optional, falls recap() schon berechnet ist. */
export function matchSummary(state: MatchState, opponent?: string, rc: Recap = recap(state)): CoachMatchSummary {
  const res = state.result;
  const me = state.p.pts;
  const them = state.o.pts;
  let outcome: CoachMatchSummary["outcome"] = "unentschieden";
  let how = `Punkte ${me}:${them}`;
  if (res?.type === "submission") {
    outcome = res.winner === "p" ? "sieg" : "niederlage";
    how = `${res.winner === "p" ? "Du hast" : "Er hat"} mit Aufgabegriff gewonnen: ${named(res.card)}`;
  } else if (res?.type === "points" && res.winner) {
    outcome = res.winner === "p" ? "sieg" : "niederlage";
  }

  const hist = state.history ?? [];
  const moments = hist.slice(-12).map((r) => {
    const g = POSITION_GUIDE[r.pos];
    const who = r.winner === "p" ? "du gewinnst" : r.winner === "o" ? "er gewinnt" : "keiner gewinnt";
    return `Zug ${r.turn}, ${g.plain}${ROLE_TXT[roleFor(r.top, "p")]}: Du ${plainName(r.pCard)}, er ${plainName(r.oCard)} – ${who}. ${r.headline}`;
  });

  const decisive = rc.decisive
    ? `Zug ${rc.decisive.record.turn}: Du ${plainName(rc.decisive.record.pCard)}, er ${plainName(rc.decisive.record.oCard)}.` +
      (rc.decisive.better ? ` Besser wäre ${named(rc.decisive.better)} gewesen.` : "") +
      ` ${rc.decisive.why}`
    : undefined;

  const practice = [...new Set([...(rc.decisive?.better ? [rc.decisive.better] : []), ...rc.mistakes.map((m) => m.better)])];
  if (!practice.length) {
    const won = hist.filter((r) => r.winner === "p").map((r) => r.pCard);
    if (won.length) practice.push(won[won.length - 1]);
  }

  return {
    outcome,
    how,
    ...(opponent ? { opponent } : {}),
    turns: hist.length,
    points: { me, them },
    moments,
    lessons: rc.lessons,
    ...(decisive ? { decisive } : {}),
    practice: practice.slice(0, 3),
  };
}
