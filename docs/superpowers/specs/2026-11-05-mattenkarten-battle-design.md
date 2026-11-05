# Mattenkarten – Battle-Card-Game für BJJ/MMA-Einsteiger (Design-Spec)

Stand: 2026-11-05 · Status: vom Nutzer freigegeben (Ansatz A, Kernregeln), Umsetzung gestartet

## 1. Ziel und Erfolgskriterien

Ein Kartenspiel im Gleichzeitig-Aufdecken-Prinzip (Yomi/Marvel Snap), das sich wie ein echtes Battle-Card-Game anfühlt und dabei die Logik des Grapplings lehrt.

Erfolg heißt:
- **Didaktisch korrekt:** Wer gewinnt, hat die Kampfkette verstanden: Distanz → Clinch → Takedown → Kontrolle → Submission, bei Misserfolg Repeat. Position vor Submission ist eine harte Regel. Reaktionen kontern nur die passende Angriffsfamilie.
- **Spielgefühl:** animierte Karten (Tilt, Holo, Reveal-Flip), Kämpfer-Silhouetten, die sich in jede Position bewegen, Hitstop, Shake und Sound.
- **Motivation:** Gürtel-Kampagne (Weiß → Schwarz) mit Gegner-Archetypen, Karten-Belohnungen als Lehrpfad, eigenes Deck = eigener Stil.
- **Sicherheit:** Tap- und Loslassen-Momente, verbotene Techniken nur als Regel-Lektion, Hinweis, dass die App keinen Coach ersetzt.

## 2. Kernregeln

### 2.1 Positionen (Knoten der Kette)
| Position | Rollen | Kettenglied |
|---|---|---|
| Distanz (`dist`) | neutral | 1 |
| Clinch (`clinch`) | neutral | 2 |
| Front Headlock (`fhl`) | top = kontrolliert den Kopf, bottom = Kopf gefangen/Turtle | 3 (Scramble-Knoten) |
| Guard (`guard`) | top = in der Guard, bottom = Guard-Spieler | 3 (Landung nach Takedown) |
| Side Control (`side`) | top/bottom | 4 |
| Mount (`mount`) | top/bottom | 4 |
| Back (`back`) | top = hinten, bottom | 4 |

Submission = Kettenglied 5. Der Front Headlock ist der zentrale Knoten: Sprawl, Snap Down und Konter laufen dort zusammen.

### 2.2 Ein Zug
1. Beide ziehen auf 5 Handkarten (Deck mit 20 Karten, Ablage wird neu gemischt).
2. Beide wählen verdeckt **eine** Karte: aus der Hand oder eine **Grundtechnik** der aktuellen Position bzw. Rolle (immer verfügbar, schwächer).
3. Aufdecken, dann Auflösung im Dreieck:
   - **Angriff schlägt Setup.** Wer sich vorbereitet, wird erwischt.
   - **Setup schlägt Reaktion.** Die Finte lockt den Konter heraus: Der Reagierende verliert 1 Gas, der Setup-Spieler erhält seinen Effekt plus „Öffnung“.
   - **Reaktion schlägt Angriff, aber nur bei passendem Tag** (`counters` ∩ `tags`). Passt der Tag nicht, geht der Angriff durch („durch“).
   - **Angriff gegen Angriff:** Das niedrigere Tempo gewinnt, ein Gleichstand ist ein Scramble (beide −1 Gas, nichts passiert).
   - **Setup gegen Setup:** Beide Effekte greifen.
   - **Reaktion gegen Reaktion:** Patt, beide +1 Gas.
4. +1 Gas Regeneration für beide (max. 12), dann Zugende. Nach 12 Zügen entscheiden die Punkte.

### 2.3 Ressourcen
- **Gas** (Start 12): Kosten pro Karte. Bei Gas ≤ 2 sind Angriffe +1 Tempo langsamer.
- **Kontrolle** (0–5) entsteht durch Setups (Griffe, Druck, Haltung brechen) und durch Aufstieg in eine bessere Position (= 1). Submissions und manche Takedowns verlangen Mindest-Kontrolle: **Position vor Submission**. Wer gekontert wird, verliert 1 Kontrolle. Eine gekonterte Submission setzt die Kontrolle auf 0 und kann die Position kosten (Danaher: Wer zur Submission wechselt, riskiert die Kontrolle).
- **Öffnung:** entsteht durch ein Setup (z. B. Jab → Level Change). Der nächste eigene Angriff mit passendem Tag ist 2 Tempo schneller.
- **Dilemma** (Danaher: „attack in pairs“): Wurde die Partnerkarte im letzten Zug gekontert, ignoriert die zweite Karte genau diese Reaktion. Beispiele: Hip Bump → Kimura, Armbar → Triangle, Snap Down ↔ Shot.

### 2.4 Punkte und Sieg
- IBJJF-Punkte: Takedown 2, Sweep 2, Pass 3, Mount 4, Back 4. Back-Punkte gibt es erst, wenn die Hooks sitzen (eigene Setup-Karte).
- **Sieg:** Submission (Tap) sofort, sonst Punkte nach 12 Zügen, bei Gleichstand Unentschieden.
- **Tap-Moment:** Erwischt dich eine Submission, musst du in 3,5 s „Tap“ drücken. Rechtzeitig = Ehren-XP, zu spät = Sicherheitslektion.
- **Loslassen-Moment:** Gewinnst du per Submission, musst du sofort loslassen.

## 3. Inhalte
- Etwa 45 Karten (Grundtechniken plus Deck-Karten). Quellen: die Wissensbasis (`docs/knowledge-base.md`) und die Recherche zur Aktion-Reaktion.
- Jede Karte trägt Lerninhalt (Beschreibung, Schlüsselpunkte, Fehler, Sicherheit, Quelle, `check` bei fehlender Primärquelle).
- Verbotene Techniken (Slam, Neck Crank, Heel Hook, Kani Basami) erscheinen nicht als spielbare Karten, sondern als Regel-Lektion in Weiß.

## 4. Meta-Spiel
- **Gürtel-Kampagne:** Weiß, Blau, Lila, Braun, Schwarz. Pro Gürtel 2–3 Gegner-Archetypen plus eine Gürtelprüfung (Boss). Archetypen: Ringer (Shots), Judoka (Clinch-Würfe), Guard-Spieler (Guard ziehen, Submissions), Pressure-Passer, Striker (Distanz). Ab höheren Gürteln liest die KI deine Muster öfter (`reads`) und telegrafiert ihre Absicht seltener (`telegraph`).
- **Belohnungen deterministisch:** Jeder Sieg schaltet festgelegte Karten frei, die einen Lehrpfad bilden (z. B. Sprawl gegen den Ringer). Keine Lootboxen, keine Käufe.
- **Lektion beim Freischalten:** Karte umdrehen, Schlüsselpunkte lesen, eine Kontrollfrage beantworten (Abruf).
- **Deckbau:** 20 Karten, maximal 2 Kopien, legendäre Karten nur 1×. Ein Starterdeck wird gestellt.
- **Bibliothek:** alle gesammelten Karten mit Rückseite, Quiz-Training und Matten-Aufgaben. Meisterschaft ist rein kosmetisch (Foil-Stufen), kein Pay-to-win.
- **Tutorial:** Die ersten 3 Kämpfe in Weiß sind geführt und führen je ein Element ein: (1) Dreieck und Takedown, (2) Reaktion und Tags (Sprawl), (3) Kontrolle und Submission.

## 5. Darstellung
- **Arena** in Seitenansicht: Matte, zwei Kämpfer als Vektor-Skelette (dicke runde Linien plus Kopf, Gi-Farben Blau und Rot). Jede Position und Rolle hat eine Pose, Wechsel werden mit Framer Motion als Spring interpoliert.
- **Kettenleiste** oben (5 Glieder) mit eigenem Fortschritt und Gegner-Fortschritt.
- **Karten:** Typfarbe (Angriff Rot, Setup Gelb, Reaktion Blau), Rarität als Rahmen bzw. Holo, Tilt und Glare nach der Zeigerposition, Hover-Lift von −12 px bei scale 1.05 in 150 ms. Bild-Art ist die Mini-Pose der Ergebnisposition.
- **Reveal-Sequenz:** Karten fliegen in die Mitte (250 ms), Flip (350 ms), Auflösungsbanner, Hitstop 80 ms, Shake je nach Ereignis (vertikal beim Takedown), dann Arena-Pose und Punkte.
- **Sound:** synthetisiert über WebAudio, stummschaltbar.
- **Mobile-first**, Dunkel-Design (Arena bei Nacht), Atkinson Hyperlegible plus Big Shoulders Display.

## 6. Architektur
- Vite + React 18 + TypeScript, Framer Motion, Zustand, Vitest.
- `src/engine/` enthält reine, deterministisch testbare Funktionen: `resolve.ts` (Reveal-Auflösung), `match.ts` (Zuglogik, Ziehen, Ende), `ai.ts` (KI-Auswahl mit Archetyp und Reads), `rng.ts` (seedbarer Zufall).
- `src/data/` enthält Karten, Archetypen bzw. Kampagne und das Starterdeck.
- `src/components/` enthält Card, Hand, Fighters (Skelett-Renderer), ChainBar, RevealStage, TapOverlay.
- `src/screens/` enthält Home/Kampagne, Arena, Deck, Bibliothek und Lektion.
- `src/store.ts` hält mit Zustand den Fortschritt (localStorage, try/catch).
- `api/coach.ts` ist eine optionale Vercel-Funktion für den KI-Coach (`ANTHROPIC_API_KEY`). Fehlt der Schlüssel, ist der Coach ausgeblendet.
- Deploy auf Vercel, Account hafenhansmoritz-1230, Git-Repo bei github.com/hafenhansmoritz.

## 7. Tests
- Engine: Dreiecksregeln, Tag-Matching, Tempo-Gleichstand, Kontrolle bzw. Position vor Submission, Dilemma, Öffnung, Punkte, Hooks-Regel, Spielende. Dazu Simulation von 500 KI-gegen-KI-Matches ohne Fehler, mit plausiblen Ausgängen und ohne Positionen ohne spielbare Grundtechnik.
- Build ohne TypeScript-Fehler.

## 8. Nicht im ersten Release
Multiplayer, Ranked, Käufe, gemalte Illustrationen, native App.
