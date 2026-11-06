# 10 Mechaniken aus Hearthstone und Magic – auf BJJ übersetzt

Stand 2026-11-06 · Umsetzung nacheinander (Prompt 1 → 10), jede auf dem Ergebnis der vorigen.

Leitregel: Eine Mechanik kommt nur ins Spiel, wenn sie ein echtes Grappling-Prinzip abbildet und in einem Satz für Anfänger erklärbar ist. Sonst ist sie Deko.

| # | Vorbild | Mechanik bei uns | BJJ-Prinzip dahinter |
|---|---|---|---|
| 1 | Keywords (HS: Taunt, Rush; MTG: Flying, First Strike) | **Schlüsselwörter** auf Karten mit Glossar | Fachbegriffe als feste Konzepte: Keil, Rahmen, Kette, Druck, Isolieren |
| 2 | Permanents / Minions auf dem Board | **Griffe bleiben liegen** (Underhook, Seatbelt, Crossface …) | Kontrolle ist ein Zustand, kein Moment; Griffe muss man aktiv lösen |
| 3 | Combo (HS) / Synergie, Lethal-Anzeige | **Kette**: Bonus, wenn die Karte auf einen passenden Aufbau folgt; Anzeige „Abschluss möglich“ (umgesetzt: Kern-2-Spec B35–B37) | Ketten (Kimura → Armbar), Aufbau vor Abschluss |
| 4 | Secrets (HS) / Instants & Stack (MTG) | **Vorbereiteter Konter** verdeckt legen, löst bei passendem Angriff aus (umgesetzt: Kern-2-Spec B38–B43 – zusätzlich zur Karte, 3 Atem, einmal pro Kampf, Gegner sieht nur „Er hat etwas vorbereitet“) | Antizipation: Rahmen steht, bevor er angreift |
| 5 | Hero Power + Klassen | **Spielstil-Fähigkeit** (Ringer, Guard, Druck, Rücken) einmal pro Runde für Atem | Eigenes A-Game, Identität |
| 6 | Deck, Nachziehen, Handlimit, Mulligan | **Spielplan-Modus**: Deck aus 15, Hand 4, ziehen, Mulligan | Gameplan statt alles können; Fokus auf wenige Wege |
| 7 | Deckbau, Mana-Kurve, Sideboard (MTG) | **Spielplan-Bauer** mit Kurve, Pflicht-Grundlagen, Anpassen vor dem Boss | System bauen; Anpassung an den Gegner |
| 8 | Booster, Crafting (Staub) | **Belohnungen fürs Lernen**: Kartenpakete aus Lektionen/Wiederholung, „Mattenstaub“ | Lernen schaltet Werkzeuge frei |
| 9 | Arena (HS) / Draft (MTG), Discover | **Draft**: 1 aus 3 wählen, Lauf bis 3 Niederlagen | Entscheiden unter Unsicherheit, Positions-Logik |
| 10 | Ranked Ladder, Saisons | **Gürtel-Rangliste** gegen KI mit Sternen, Saison, Belohnung | Fortschritt sichtbar, ohne Druck |

## Gemeinsame Regeln für jeden Prompt
- Eigener git-Worktree unter dem Scratchpad, nie direkt in /home/claude/mattenkarten arbeiten; `git pull --rebase origin main`, `git push origin HEAD:main`, Worktree entfernen.
- Didaktik: Jede Mechanik hat einen Satz „Warum das im echten Grappling so ist“ (Quelle per WebFetch oder `check:true`), ein kurzes Tutorial oder einen Hinweis beim ersten Auftauchen, Text du-Form, ≤ 20 Wörter pro Satz.
- Lektionen und Startprogramm dürfen nicht schwerer werden: neue Mechaniken sind in den ersten drei Lektionen aus oder ausdrücklich eingeführt.
- Balance: `npx tsx scripts/simulate2.ts` und `src/core2/engine/balance.test.ts` bleiben grün (Ziele in der Spec B1–B30); neue Regeln als B31+ mit Anfängersatz in der Kern-2-Spec.
- No-Gi, keine Beinhebel-Karten, ≤ 8 Karten pro Slot in der Standard-Hand, jeder neue localStorage-Schlüssel in `public/landing/datenschutz.html`.
- `npx tsc --noEmit -p .`, `npx vitest run`, `npx vite build` grün; Screenshots 390×844.
