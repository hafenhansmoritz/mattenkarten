// UX-Review 2, Punkte 5 und 6: Erklärungen nach Stufe, Zonen-Satz der Lektion.
import { afterAll, describe, expect, it } from "vitest";
import { explainForLevel, mentionsHidden, uiFeatures, zonesIntro } from "./disclosure";
import { TUTORIALS_K2 } from "../data/tutorials";
import { LESSONS_PROGRAM } from "../../program/lessons";
import { CARDS2 } from "../data/cards";
import { newMatch, playRound, setCardRegistry, aiChooseLesson, legalCards, PASS } from "../engine";
import { foeRules } from "./disclosure";
import { mulberry32 } from "../../engine/rng";
import type { UiLevel } from "./tutorialTypes";

afterAll(() => setCardRegistry(null));

describe("explainForLevel", () => {
  it("streicht das Etikett „Dilemma:“ vor Stufe 6", () => {
    expect(explainForLevel("Dilemma: Wer Beine verteidigt, öffnet Hüfte.", 3)).toBe("Wer Beine verteidigt, öffnet Hüfte.");
    expect(explainForLevel("Dilemma: Wer Beine verteidigt, öffnet Hüfte.", 6)).toBe("Dilemma: Wer Beine verteidigt, öffnet Hüfte.");
  });
  it("Klammer-Teile und Satzteile mit verborgenen Begriffen fallen weg", () => {
    expect(explainForLevel("Hüfte geblockt, dann Knie über den Bauch (Mount, 4 Punkte); stemmt er dagegen, liegt sein Arm frei.", 4))
      .toBe("Hüfte geblockt, dann Knie über den Bauch (Mount); stemmt er dagegen, liegt sein Arm frei.");
    expect(explainForLevel("Mit Griffen in die Guard setzen (Pull Guard) bringt dich zu Boden – Punkte gibt es dafür nicht.", 2))
      .toBe("Mit Griffen in die Guard setzen (Pull Guard) bringt dich zu Boden.");
    expect(explainForLevel("Liegt er flach (Keil an der Hüfte), fehlen ihm Seite und Winkel.", 5)).toBe("Liegt er flach, fehlen ihm Seite und Winkel.");
  });
  it("ganz verborgene Sätze werden leer", () => {
    expect(explainForLevel("Punktgleich – du gewinnst durch Vorteil.", 4)).toBe("");
    expect(explainForLevel("Punktgleich – du gewinnst durch Vorteil.", 5)).toBe("Punktgleich – du gewinnst durch Vorteil.");
  });
  it("alle Karten-Erklärungen sind auf Stufe 2 frei von Dilemma, Keil, Punkte, Vorteil", () => {
    for (const c of CARDS2) {
      const t = explainForLevel(c.why, 2);
      expect(mentionsHidden(t, 2), `${c.id}: ${t}`).toBe(false);
      expect(t.length, `${c.id}: Erklärung fällt auf Stufe 2 ganz weg`).toBeGreaterThan(10);
    }
  });
  it("Lektionen bis Stufe 5: keine Rundenerklärung nennt verborgene Konzepte", () => {
    for (const t of [...TUTORIALS_K2, ...LESSONS_PROGRAM].filter((x) => (x.ui ?? 7) < 6)) {
      const lvl = (t.ui ?? 7) as UiLevel;
      const f = uiFeatures(t);
      const rules = foeRules(t, f);
      for (let seed = 1; seed <= 15; seed++) {
        const rng = mulberry32(seed);
        let s = newMatch({ seed, cards: CARDS2, start: t.start, goal: t.goal, maxRounds: t.maxRounds, grips: t.grips, chains: t.chains, konter: t.konter });
        while (!s.result) {
          const mine = legalCards(s, "p").filter((l) => l.ok);
          const p = mine.length ? mine[Math.floor(rng() * mine.length)].id : PASS;
          const o = aiChooseLesson(s, "o", t.aiLevel, rng, rules!);
          const res = playRound(s, p, o);
          s = res.state;
          for (const txt of [res.round.headline, res.round.why]) {
            const shown = explainForLevel(txt, lvl);
            expect(mentionsHidden(shown, lvl), `${t.id} R${res.round.round}: ${shown}`).toBe(false);
          }
        }
      }
    }
  });
});

describe("zonesIntro", () => {
  it("nennt nur die sichtbaren Zonen", () => {
    expect(zonesIntro(["beine", "huefte"])).toBe("Heute zwei Zonen: Hüfte und Beine. Wer Zonen gewinnt, kommt weiter.");
    expect(zonesIntro(["kopf", "huefte", "beine"])).toMatch(/^Heute drei Zonen: Kopf\/Nacken, Hüfte und Beine\./);
    expect(zonesIntro(["kopf", "arme", "huefte", "beine"])).toMatch(/^Alle vier Zonen/);
  });
  it("Tag-2-Lektion: zwei Zonen", () => {
    expect(zonesIntro(uiFeatures(TUTORIALS_K2[0]).zones)).toContain("Hüfte und Beine");
  });
});
