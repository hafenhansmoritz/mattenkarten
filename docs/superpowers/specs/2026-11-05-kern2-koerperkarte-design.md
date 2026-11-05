# Kern 2 „Körperkarte“ – Design-Spec

Stand 2026-11-05 · vom Nutzer freigegeben · Umsetzung als Prototyp-Modus neben dem bestehenden Spiel

## Anlass
Selbstkritik aus Sicht Hearthstone-Design und John Danaher: Der alte Kern ist zu oft Raten, hat keinen aufbauenden Zustand, zu viele Systeme, zu lange Matches; Kontrolle ist abstrakt, Aufgaben sind ein Würfelwurf, Dilemmas sind Beiwerk, die Lernreihenfolge widerspricht Danaher (Befreiungen zuerst). Recherche: research_notes/Kern 2 Kontrolle und Abschluss/.

## Fachliche Grundlage (belegt, siehe Wissensbasis)
- Danaher: Pinnen beruht auf **Keilen** (fernes/nahes Hüftbein, Nacken), nicht auf Gewicht; Innenposition gewinnt man Gliedmaße für Gliedmaße; Ellbogen-Knie-Verbindung des Unteren.
- Danaher: erstes Lernziel sind **Pin-Befreiungen**; drei Arten: in den neutralen Stand, Umdrehen, zurück in die Guard.
- Zwei Wege zur Aufgabe: schneller Eintritt oder **schrittweiser Abbau der Verteidigung**; Verteidigung in Schichten (RNC: Hände → Kinn → Griff lösen).
- Half Guard: Kampf um Kopf/Schultern, Underhook, Knee Shield, Crossface. Turtle: schnell raus, Seatbelt zuerst stoppen.
- Auslage: belegt nur der Kampf um die Außenposition des Führfußes (Schlagdistanz). Folgen für Beinangriffe/Underhook-Seite unbelegt → nicht modelliert, Trainer-Prüfpunkt.

## Regeln
1. **Brett:** vier Zonen (Kopf/Nacken, Arme, Hüfte, Beine), je −2…+2 aus Sicht des Spielers. Bleibt über Runden bestehen; bei Positionswechsel bleibt das Brett, die Zone, die den Wechsel trug, steht danach auf +1 für den Gewinner (B5).
2. **Zug:** beide wählen verdeckt eine Karte; jede Karte wirkt in einer Zone.
   - Verschiedene Zonen: beide Karten wirken unabhängig. Ein Rahmen in einer Zone ohne Angriff verpufft („Rahmen ins Leere“).
   - Gleiche Zone: Dreieck – Angriff > Aufbauen > Rahmen > Angriff. Angriff gegen Angriff: wer in der Zone vorne liegt, gewinnt; bei Gleichstand Gerangel. Aufbauen gegen Aufbauen hebt sich auf.
3. **Angriffe** brauchen Zonenwerte (`requires`) – Position vor Aufgabe ist damit sichtbar. Erfolgreiche Angriffe wechseln die Position oder schieben eine Aufgabe-Leiste.
4. **Aufgabe als Prozess:** Leiste mit drei Schritten (Isolieren → Kontrollieren → Beenden). Jeder erfolgreiche Schritt +1, ungerahmt +2 (B2); ein Rahmen in derselben Zone setzt um 1 zurück; Positionswechsel löscht die Leiste. Schritt 3 = Tap. Abschluss-Schritte kosten Kraft.
5. **Dilemma als Grundregel:** Viele Angriffe haben `dilemmaOpens`: verteidigt der Gegner sie erfolgreich, gewinnt der Angreifer +1 in der geöffneten Zone.
6. **Sperre:** gespielte Karte ist die nächste Runde gesperrt (öffentlich sichtbar).
7. **Information statt Zufall:** öffentlich sind Brett, Position, gesperrte Karten und `threats` (wo der Gegner angreifen kann). Kein zufälliges Absichts-Signal.
8. **Kraft:** einzige Ressource, Start 3, +1 pro Runde, max. 5.
9. **Punkte & Sieg:** IBJJF-Punkte bei Positionsgewinnen; Tap gewinnt sofort; sonst Punkte nach 9 Runden (B8); bei Punktgleichstand entscheidet die Brettsumme (Vorteil).
10. **Positionen:** Stand, Clinch, Guard, Half Guard, Turtle, Side Control, Mount, Back (oben/unten).

## Balance-Änderungen
Stand 2026-11-05. Anlass: KI-gegen-KI-Simulation (`npx tsx scripts/simulate2.ts`, 500 Matches je Paarung) verfehlte alle Ziele. Ursachen: zwei KIs spiegelten sich Runde für Runde (Angriff A/B im Wechsel wegen Sperre, Rahmen A/B im Wechsel), Aufbauen gegen Aufbauen und Gerangel blockierten endlos, eine Aufgabe brauchte drei ungestörte Treffer und jede Befreiung löschte die Leiste. Schalter in `src/core2/engine/resolve.ts` (`BALANCE`) und `legal.ts` (`heldInSub`).

| # | Regel | Ein Satz für Anfänger |
|---|---|---|
| B1 | Dilemma: Stoppt ein Rahmen einen Dilemma-Angriff, gewinnt der Rahmen selbst keine Zone. | Wer sich gegen einen Dilemma-Angriff wehrt, stoppt ihn zwar, öffnet dabei aber die andere Zone und gewinnt selbst nichts. |
| B2 | Ein Aufgabe-Angriff, den der Gegner nicht in derselben Zone rahmt (er baut auf oder spielt anderswo), rückt 2 Schritte vor; Angriff gegen Angriff bleibt +1, ein Rahmen setzt weiter −1. | Verteidigst du einen Griff nicht genau dort, wo er sitzt, geht es doppelt so schnell. |
| B3 | Aufbauen gegen Aufbauen in derselben Zone: am Boden setzt sich der Obere durch (+1), im Stand/Clinch hebt es sich auf. | Bauen beide an derselben Stelle, gewinnt am Boden der Obere – er hat das Gewicht. |
| B4 | Griff hält fest: Läuft eine Aufgabe-Leiste gegen den Unteren (ab Schritt 1), sind seine Positionswechsel nicht spielbar („Erst den Griff lösen“); sitzt der Griff in derselben Runde, scheitert seine Flucht. Gilt nicht für Pässe von oben. | Steckt dein Arm im Hebel, musst du ihn erst befreien, bevor du wegrutschen kannst. |
| B5 | Schwung: Nach einem Positionswechsel steht die Zone, die ihn trug, auf +1 für den Gewinner (vorher nur auf ±1 gekappt). | Wer eine Position gewinnt, kommt mit Schwung an und ist in dieser Zone vorne. |
| B6 | Gerangel: Angriff gegen Angriff ohne Vorsprung in der Zone (auch zwei Positionswechsel gleichzeitig) – erst entscheidet die Brettsumme (Vorteil), dann wer zu Rundenbeginn mehr Kraft hatte; sonst Gerangel wie bisher. | Greifen beide gleichzeitig an, setzt sich durch, wer insgesamt besser steht – oder wer mehr Kraft hat. |
| B7 | Karte „Knie rein, halbe Guard“ (scb_knee_in) braucht Hüfte 0 statt −1. | Das Knie kommt nur rein, wenn deine Hüfte frei ist. |
| B8 | Ein Match dauert 9 statt 8 Runden (Tutorials/Lektionen setzen ihre eigene Rundenzahl). | Ein Kampf hat neun Runden – genug Zeit, nach der Position auch die Aufgabe zu beenden. |

KI (keine Regel, aber Teil der Balance): Stufe 3 mischt zwischen fast gleich guten Karten (Softmax, kein perfekter Konter), erwartet Rahmen dort, wo sie selbst bedroht, und spielt dann Finten; ein Tap zählt mehr als ein Punktsieg; eine Leiste, gegen die der Gegner nächste Runde keinen Rahmen hat, zählt extra. Stufe 2 meidet Gerangel bei Gleichstand (baut die Zone erst auf) und wertet Aufgaben in offenen Zonen auf.

Geprüft und verworfen (kein messbarer Effekt oder schädlich): Rahmen hält eine Leiste ab Schritt 2 nur auf (kein Effekt), gestoppte Angriffe ungesperrt (Befreiungen zu leicht bzw. L2-Patt), Rahmen ohne Zonengewinn (mehr Remis), 10 Runden (Dominanz erst Ø Runde 5,2).

Ergebnis (4500 Matches): L3-gegen-L3-Remis 44,2 % → 0,2 %; Taps 0,1 % → 10,4 % (alle sieben Griffe, Kimura 45 %); Rücken erreicht 3,0 % → 6,0 %, Mount 8,5 % → 17,8 %; Dominanz (Side/Mount/Rücken/Turtle oben) Ø Runde 5,77 in 32 % → 4,95 in 68 % der Matches. Offen: Kimura aus der Seitkontrolle ist der häufigste Tap (einziger Griff im Slot); bb_shrimp wird von der KI nicht mehr gespielt.

## Lernen
- Erklärung über das Brett: die entscheidende Zone leuchtet; ein Satz „warum“ (≤ 20 Wörter), Details nur auf Tippen.
- Tutorial nach Danaher: (1) Pin erkennen & befreien (Mount unten → Guard), (2) Keile bauen & passieren, (3) Abschluss schrittweise.

## Umsetzung
`src/core2/` (types, engine, data, ui), eigener Modus „Prototyp: Körperkarte“ unter „Mehr“. Kein Deckbau im Prototyp: Hand = alle Karten des Slots, abzüglich gesperrter. Kämpfer-Szenen um Half Guard und Turtle erweitert. Tests: Regeln, Simulation (KI vs. KI), Tutorials lösbar.
