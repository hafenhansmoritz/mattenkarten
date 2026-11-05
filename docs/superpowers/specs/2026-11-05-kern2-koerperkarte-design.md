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
4. **Aufgabe als Prozess:** Leiste mit drei Schritten (Isolieren → Kontrollieren → Beenden). Jeder erfolgreiche Schritt +1, ungerahmt +2 (B2); ein Rahmen in derselben Zone setzt um 1 zurück; Positionswechsel löscht die Leiste. Schritt 3 = Tap. Abschluss-Schritte kosten Atem.
5. **Dilemma als Grundregel:** Viele Angriffe haben `dilemmaOpens`: verteidigt der Gegner sie erfolgreich, gewinnt der Angreifer +1 in der geöffneten Zone.
6. **Sperre:** gespielte Karte ist die nächste Runde gesperrt (öffentlich sichtbar).
7. **Information statt Zufall:** öffentlich sind Brett, Position, gesperrte Karten und `threats` (wo der Gegner angreifen kann). Kein zufälliges Absichts-Signal.
8. **Atem:** einzige Ressource, Start 3, +1 pro Runde, max. 5 (im Code weiter das Feld `kraft`; sichtbar heißt sie immer „Atem“, B9).
9. **Punkte & Sieg:** IBJJF-Punkte bei Positionsgewinnen; Tap gewinnt sofort; sonst Punkte nach 9 Runden (B8); bei Punktgleichstand entscheidet die Brettsumme (Vorteil).
10. **Positionen:** Stand, Clinch, Guard, Half Guard, Turtle, Side Control, Mount, Back (oben/unten).

## Balance-Änderungen
Stand 2026-11-05. Anlass: KI-gegen-KI-Simulation (`npx tsx scripts/simulate2.ts`, 500 Matches je Paarung) verfehlte alle Ziele. Ursachen: zwei KIs spiegelten sich Runde für Runde (Angriff A/B im Wechsel wegen Sperre, Rahmen A/B im Wechsel), Aufbauen gegen Aufbauen und Gerangel blockierten endlos, eine Aufgabe brauchte drei ungestörte Treffer und jede Befreiung löschte die Leiste. Schalter in `src/core2/engine/resolve.ts` (`BALANCE`) und `legal.ts` (`heldInSub`).

| # | Regel | Ein Satz für Anfänger |
|---|---|---|
| B1 | Dilemma: Stoppt ein Rahmen einen Dilemma-Angriff, gewinnt der Rahmen selbst keine Zone. | Wer sich gegen einen Dilemma-Angriff wehrt, stoppt ihn zwar, öffnet dabei aber die andere Zone und gewinnt selbst nichts. |
| B2 | Ein Aufgabe-Angriff, den der Gegner nicht in derselben Zone rahmt (er baut auf oder spielt anderswo), rückt 2 Schritte vor; Angriff gegen Angriff bleibt +1, ein Rahmen setzt weiter −1. | Verteidigst du einen Griff nicht genau dort, wo er sitzt, geht es doppelt so schnell. |
| B3 | Aufbauen gegen Aufbauen in derselben Zone: am Boden setzt sich der Obere durch (+1), im Stand/Clinch hebt es sich auf. | Bauen beide an derselben Stelle, gewinnt am Boden der Obere – er hat das Gewicht. |
| B4 | Griff hält fest (revidiert): Erst wenn eine gegnerische Aufgabe-Leiste auf **Schritt ≥ 2** steht (der Griff sitzt), sind die Positionswechsel des Unteren nicht spielbar („Erst den Griff lösen“); erreicht der Griff Schritt 2 in derselben Runde, scheitert seine Flucht. Bei Schritt 1 (nur isoliert) bleibt Weggehen erlaubt – gelingt es, ist die Leiste weg (jeder Positionswechsel löscht Leisten). Gilt nicht für Pässe von oben. Schwelle `HOLD_STEP = 2` in `legal.ts`. | Solange er nur isoliert, ist Weggehen die beste Verteidigung. Sitzt der Griff, musst du ihn erst lösen. |
| B5 | Schwung: Nach einem Positionswechsel steht die Zone, die ihn trug, auf +1 für den Gewinner (vorher nur auf ±1 gekappt). | Wer eine Position gewinnt, kommt mit Schwung an und ist in dieser Zone vorne. |
| B6 | Gerangel (revidiert): Angriff gegen Angriff ohne Vorsprung in der Zone (auch zwei Positionswechsel gleichzeitig) – erst entscheidet die Brettsumme (Vorteil), sonst am Boden der Obere (er hat die Basis auf der Matte). Atem entscheidet nie. Im Stand/Clinch bleibt es Gerangel (beide −1 Atem). | Greifen beide gleichzeitig an, setzt sich durch, wer insgesamt besser steht – am Boden sonst der Obere, denn er hat die Basis. Kraft entscheidet nicht. |
| B7 | Karte „Knie rein, halbe Guard“ (scb_knee_in) braucht Hüfte 0 statt −1. | Das Knie kommt nur rein, wenn deine Hüfte frei ist. |
| B8 | Ein Match dauert 9 statt 8 Runden (Tutorials/Lektionen setzen ihre eigene Rundenzahl). | Ein Kampf hat neun Runden – genug Zeit, nach der Position auch die Aufgabe zu beenden. |
| B9 | Die Ressource heißt sichtbar **Atem** statt Kraft (Gründe wie „Braucht 1 Atem“, Schlagzeilen, Tutorial-Texte, Symbol: Luftzug statt Blitz, `ATEM_LABEL` in meta.tsx; offen: aria-label/title der Atem-Anzeige in ArenaK2.tsx). Regeln unverändert; internes Feld bleibt `kraft`. | Im BJJ gewinnt Hebel, nicht Kraft – große Aktionen kosten Atem, also teil ihn dir ein. |
| B10 | Grundlagen zahlen sich aus: „Rausrutschen zur Guard“ (bb_shrimp) braucht Hüfte 0 und nur Arme −1 statt 0 – die Hände dürfen noch kämpfen, die Hüfte trägt den Shrimp. Vorher spielte die KI die Karte nie (Arme fast immer im Minus). | Unter dem Rücken bringt dich die Hüfte raus: Schultern auf die Matte, dann wegrutschen. |
| B11 | Seitkontrolle oben hat drei Abschlüsse statt einem: neu **Kopf-Arm-Würger** (sct_arm_triangle, Zone Kopf, braucht Kopf +1 und Arme +1, Dilemma → Arme) und **Americana (Side)** (sct_americana, braucht Kopf +1 und Arme +1, Dilemma → Kopf); die **Kimura** braucht jetzt Arme +1 und Hüfte +2 (Hüfte ganz gekeilt, sonst dreht er sich ein) und öffnet als Dilemma den Kopf. Platz im Slot (max. 8): nahe und ferne Hüfte sind eine Karte („Beide Hüften keilen“), „Handgelenk auf die Matte“ ist jetzt die Americana selbst. Unten neu der Rahmen **„Arm nicht rüberlassen“** (scb_head_arm_def, Kopf) gegen den Würger; „Ellbogen nach innen“ steckt dafür in „Ellbogen an Knie“. | Aus der Seitkontrolle greifst du Kopf und Arm oder den Arm allein an – wehrt er das eine ab, öffnet sich das andere. |
| B12 | Half Guard oben hat einen zweiten Pass: **„Knie durchschieben“** (ht_knee_slide, Zone Hüfte, braucht Arme +1 und Hüfte 0, → Side Control, 3 Punkte). Ausgleich für B6: seit Gleichstände im Stand Gerangel bleiben, kam man sonst zu spät in dominante Positionen (Ø Runde 5,1). | Oben in der Half Guard passierst du mit Crossface oder mit Underhook – nimm, was er dir gibt. |

KI (keine Regel, aber Teil der Balance): Stufe 3 mischt zwischen fast gleich guten Karten (Softmax, kein perfekter Konter), erwartet Rahmen dort, wo sie selbst bedroht, und spielt dann Finten; ein Tap zählt mehr als ein Punktsieg; eine Leiste, gegen die der Gegner nächste Runde keinen Rahmen hat, zählt extra. Stufe 2 meidet Gerangel bei Gleichstand (baut die Zone erst auf) und wertet Aufgaben in offenen Zonen auf.

Geprüft und verworfen (kein messbarer Effekt oder schädlich): Rahmen hält eine Leiste ab Schritt 2 nur auf (kein Effekt), gestoppte Angriffe ungesperrt (Befreiungen zu leicht bzw. L2-Patt), Rahmen ohne Zonengewinn (mehr Remis), 10 Runden (Dominanz erst Ø Runde 5,2).

Ergebnis B1–B8 (4500 Matches): L3-gegen-L3-Remis 44,2 % → 0,2 %; Taps 0,1 % → 10,4 % (alle sieben Griffe, Kimura 45 %); Rücken erreicht 3,0 % → 6,0 %, Mount 8,5 % → 17,8 %; Dominanz (Side/Mount/Rücken/Turtle oben) Ø Runde 5,77 in 32 % → 4,95 in 68 % der Matches. Offen nach B1–B8: Kimura aus der Seitkontrolle ist der häufigste Tap (einziger Griff im Slot); bb_shrimp wird von der KI nicht mehr gespielt.

Ergebnis B9–B12 (Didaktik-Kritik „Hebel statt Kraft“, 4500 Matches): Taps 10,4 % → 11,6 %; Verteilung vorher Kimura 48,6 % (227 von 467), jetzt Americana 26,1 %, Kimura 25,6 %, Kopf-Arm-Würger 13,5 %, Guillotine 11,8 %, Armbar (Back) 7,3 %, RNC 6,9 %, Armbar 5,7 %, Triangle 3,1 %; L3-gegen-L3-Remis 0,2 %; Dominanz Ø Runde 4,97 in 79,4 % der Matches (vorher 4,95 in 68 %); Rücken 6,7 %, Mount 21,1 %. Befreiungen (Anteil der Slot-Entscheidungen, neue Ausgabe in simulate2): Side unten Shrimp 12,8 %, Underhook 7,9 %, Knie rein 3,9 %; Mount unten Upa 26,6 %, Elbow Escape 16,6 %; Rücken unten bb_shrimp 0 % → 15,6 %, Rausdrehen 14,4 %. Neue Ziele in simulate2: kein Griff > 35 % der Taps; jede Befreiung aus Side/Mount unten ≥ 2 % der Slot-Entscheidungen. Geprüft und verworfen: „Ellbogen an Knie“ mit Arme +1 (Kimura brach ein, Taps 6,9 %) bzw. Beine +1 (Half Guard unten zu zäh, Dominanz Ø 5,24); Gleichstand im Stand führt in den Clinch (widerspricht „Stand bleibt Gerangel“); Americana (Side) mit Arme 0 (Americana 39,6 %).

## Lernen
- Erklärung über das Brett: die entscheidende Zone leuchtet; ein Satz „warum“ (≤ 20 Wörter), Details nur auf Tippen.
- Tutorial nach Danaher: (1) Pin erkennen & befreien (Mount unten → Guard), (2) Keile bauen & passieren, (3) Abschluss schrittweise.

## Umsetzung
`src/core2/` (types, engine, data, ui), eigener Modus „Prototyp: Körperkarte“ unter „Mehr“. Kein Deckbau im Prototyp: Hand = alle Karten des Slots, abzüglich gesperrter. Kämpfer-Szenen um Half Guard und Turtle erweitert. Tests: Regeln, Simulation (KI vs. KI), Tutorials lösbar.
