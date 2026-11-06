// UX-Review 2, Punkt 4: Erklärungen zu Gegnerkarten aus Sicht des Spielers.
import { afterAll, describe, expect, it } from "vitest";
import { CARDS2 } from "../data/cards";
import { WHY_OPP, CHAIN_WHY_OPP } from "../data/whyOpp";
import { chainWhyFor, flipPerspective, whyFor } from "./perspective";
import { newMatch, playRound, setCardRegistry } from "./index";

afterAll(() => setCardRegistry(null));

const PERSON = /\b(du|dein\w*|dich|dir|er|sein(e[mnrs]?)?|ihn|ihm)\b/i;
/** Befehle an den Kartenbesitzer („Fang den Kopf“) – im Gegner-Text wäre das ein Befehl für seine Handlung. */
const IMPERATIVES = ["Zieh", "Fang", "Drück", "Starte", "geh", "hol", "schieß", "schieb", "schwimm", "Hol", "Geh"];

/** Handlungen des Kartenbesitzers in du-Form: „du landest“, „hältst du“. */
function ownerActions(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\b[Dd]u ([a-zäöüß]+)/g)) out.push(`du ${m[1]}`);
  for (const m of text.matchAll(/\b([A-Za-zäöüß]+st) du\b/g)) out.push(`${m[1].toLowerCase()} du`);
  for (const imp of IMPERATIVES) if (new RegExp(`(^|[.;:–,] ?)${imp}\\b`).test(text)) out.push(`#${imp}`);
  return out;
}

/** Geprüfte Ausnahmen: dasselbe Verb für beide Seiten („Streckt er …, streckst du weiter“ → „Streckst du …, streckt er weiter“). */
const SYMMETRIC = new Set(["streckst du"]);

function violations(own: string, opp: string): string[] {
  const low = opp.toLowerCase();
  return ownerActions(own).filter((a) => !SYMMETRIC.has(a) || !/\ber\b/i.test(opp)).filter((a) => a.startsWith("#")
    ? new RegExp(`(^|[.;:–,] ?)${a.slice(1)}\\b`).test(opp)
    : low.includes(a));
}

describe("flipPerspective", () => {
  it("tauscht du/er samt Verb", () => {
    expect(flipPerspective("so kommst du an ihm vorbei")).toBe("so kommt er an dir vorbei");
    expect(flipPerspective("er kann nicht auf einem Bein hüpfen")).toBe("du kannst nicht auf einem Bein hüpfen");
    expect(flipPerspective("Hältst du sein Handgelenk, kann er den Arm nicht wegziehen")).toBe("Hält er dein Handgelenk, kannst du den Arm nicht wegziehen");
    expect(flipPerspective("du landest hinter ihm")).toBe("er landet hinter dir");
  });
  it("tauscht Possessiva und Objekte, Groß-/Kleinschreibung bleibt", () => {
    expect(flipPerspective("Deine Hüfte schwer auf seinen Schultern hält ihn unten.")).toBe("Seine Hüfte schwer auf deinen Schultern hält dich unten.");
  });
  it("reflexiv und Nebensatz", () => {
    expect(flipPerspective("stemmt er sich hoch")).toBe("stemmst du dich hoch");
    expect(flipPerspective("bis er auf die Hände fällt")).toBe("bis du auf die Hände fällst");
    expect(flipPerspective("während du seine Hände hältst")).toBe("während er deine Hände hält");
  });
  it("Texte ohne Personen bleiben gleich", () => {
    expect(flipPerspective("Breite Basis: wer stabil steht, wird nicht gekippt.")).toBe("Breite Basis: wer stabil steht, wird nicht gekippt.");
  });
});

describe("Gegner-Erklärungen aller Karten", () => {
  it("eigene Karte: Text wie geschrieben", () => {
    for (const c of CARDS2) expect(whyFor(c, "p")).toBe(c.why);
  });

  it("Gegnerkarte: keine Handlung des Gegners in du-Form (Heuristik), Personen-Sätze werden umgedreht", () => {
    const bad: string[] = [];
    for (const c of CARDS2) {
      const opp = whyFor(c, "o");
      for (const v of violations(c.why, opp)) bad.push(`${c.id}: „${v}“ in „${opp}“`);
      if (PERSON.test(c.why) && opp === c.why) bad.push(`${c.id}: nicht umgedreht`);
      if (c.chain) {
        const co = chainWhyFor(c, "o");
        for (const v of violations(c.chain.why, co)) bad.push(`${c.id} (Kette): „${v}“ in „${co}“`);
        if (PERSON.test(c.chain.why) && co === c.chain.why) bad.push(`${c.id} (Kette): nicht umgedreht`);
      }
    }
    expect(bad, bad.join("\n")).toEqual([]);
  });

  it("Overrides gehören zu echten Karten", () => {
    const ids = new Set(CARDS2.map((c) => c.id));
    for (const id of [...Object.keys(WHY_OPP), ...Object.keys(CHAIN_WHY_OPP)]) expect(ids.has(id), id).toBe(true);
    for (const id of Object.keys(CHAIN_WHY_OPP)) expect(CARDS2.find((c) => c.id === id)!.chain, id).toBeTruthy();
  });

  it("Review-Beispiele: Knie zusammen, Mount → Rücken, Aufstieg in den Mount", () => {
    const by = (id: string) => whyFor(CARDS2.find((c) => c.id === id)!, "o");
    expect(by("mt_knee_pinch")).toMatch(/^Seine engen Knie/);
    expect(by("mt_knee_pinch")).toContain("dein Wegrutschen");
    expect(by("mt_to_back")).toContain("nimmt er deinen Rücken");
    expect(by("mt_to_back")).toContain("Hände an den Hals");
    expect(by("sct_to_mount")).toContain("deine Hüfte");
    expect(by("mt_heavy_hips")).toContain("dein Knie");
  });
});

describe("Rundenerklärung in der Engine", () => {
  it("Gegner blockt mit Knie zusammen: Erklärung spricht von deinem Wegrutschen", () => {
    const s = newMatch({ seed: 1, cards: CARDS2, start: { pos: "mount", top: "o", board: { beine: 0, huefte: 0 } } });
    const { round } = playRound(s, "mb_elbow_escape", "mt_knee_pinch");
    expect(round.headline).toContain("stoppt deinen Angriff");
    expect(round.why).toContain("dein Wegrutschen");
    expect(round.why).not.toMatch(/sein (Knie|Wegrutschen)/);
  });
});
