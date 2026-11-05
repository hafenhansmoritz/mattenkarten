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
1. **Brett:** vier Zonen (Kopf/Nacken, Arme, Hüfte, Beine), je −2…+2 aus Sicht des Spielers. Bleibt über Runden bestehen; bei Positionswechsel bleibt das Brett, die Zone, die den Wechsel trug, wird auf ±1 gekappt.
2. **Zug:** beide wählen verdeckt eine Karte; jede Karte wirkt in einer Zone.
   - Verschiedene Zonen: beide Karten wirken unabhängig. Ein Rahmen in einer Zone ohne Angriff verpufft („Rahmen ins Leere“).
   - Gleiche Zone: Dreieck – Angriff > Aufbauen > Rahmen > Angriff. Angriff gegen Angriff: wer in der Zone vorne liegt, gewinnt; bei Gleichstand Gerangel. Aufbauen gegen Aufbauen hebt sich auf.
3. **Angriffe** brauchen Zonenwerte (`requires`) – Position vor Aufgabe ist damit sichtbar. Erfolgreiche Angriffe wechseln die Position oder schieben eine Aufgabe-Leiste.
4. **Aufgabe als Prozess:** Leiste mit drei Schritten (Isolieren → Kontrollieren → Beenden). Jeder erfolgreiche Schritt +1; ein Rahmen in derselben Zone setzt um 1 zurück; Positionswechsel löscht die Leiste. Schritt 3 = Tap. Abschluss-Schritte kosten Kraft.
5. **Dilemma als Grundregel:** Viele Angriffe haben `dilemmaOpens`: verteidigt der Gegner sie erfolgreich, gewinnt der Angreifer +1 in der geöffneten Zone.
6. **Sperre:** gespielte Karte ist die nächste Runde gesperrt (öffentlich sichtbar).
7. **Information statt Zufall:** öffentlich sind Brett, Position, gesperrte Karten und `threats` (wo der Gegner angreifen kann). Kein zufälliges Absichts-Signal.
8. **Kraft:** einzige Ressource, Start 3, +1 pro Runde, max. 5.
9. **Punkte & Sieg:** IBJJF-Punkte bei Positionsgewinnen; Tap gewinnt sofort; sonst Punkte nach 8 Runden.
10. **Positionen:** Stand, Clinch, Guard, Half Guard, Turtle, Side Control, Mount, Back (oben/unten).

## Lernen
- Erklärung über das Brett: die entscheidende Zone leuchtet; ein Satz „warum“ (≤ 20 Wörter), Details nur auf Tippen.
- Tutorial nach Danaher: (1) Pin erkennen & befreien (Mount unten → Guard), (2) Keile bauen & passieren, (3) Abschluss schrittweise.

## Umsetzung
`src/core2/` (types, engine, data, ui), eigener Modus „Prototyp: Körperkarte“ unter „Mehr“. Kein Deckbau im Prototyp: Hand = alle Karten des Slots, abzüglich gesperrter. Kämpfer-Szenen um Half Guard und Turtle erweitert. Tests: Regeln, Simulation (KI vs. KI), Tutorials lösbar.
