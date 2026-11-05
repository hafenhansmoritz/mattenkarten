# Mattenkarten – Wissensbasis

Stand: 2026-11-05 · Status: zentrale Referenz für Karten- und Regeldesign · Grundlage: Recherchenotizen „Kampfkette und Spielmechanik“ (3 Dateien), „Kampfsport Lernkartenspiel Grundlagen“ (4 Dateien), Bericht „Kampfsport Lernkartenspiel Grundlagen“ und die Design-Spec `docs/superpowers/specs/2026-11-05-mattenkarten-battle-design.md`.

---

## 1. Zweck und Pflegeregeln

Dieses Dokument ist die **einzige verbindliche Wissensquelle** für Mattenkarten. Jede Karte (Beschreibung, Schlüsselpunkte, Fehler, Sicherheit, Konter) und jede Regel, die sich auf echtes Grappling beruft, muss sich auf einen Eintrag hier zurückführen lassen. Die Spec verweist ausdrücklich auf diese Datei als Inhaltsquelle für die rund 45 Karten.

### 1.1 Markierungen

| Marker | Bedeutung | Darf in eine Karte? |
|---|---|---|
| **belegt** | Aussage steht in einer abgerufenen Quelle (Link in der Zeile oder im Abschnitt) | ja |
| **[Sekundär]** | nur über Blog/Medienbericht belegt, Originalquelle (z. B. Instagram-Post, Video, Regelwerk-PDF) nicht selbst geprüft | ja, mit Feld `check` |
| **[ungeprüft]** | in der Recherche genannt, aber ohne abgerufene Quelle (z. B. erinnerte Zahlen) | nur mit Feld `check` und Eintrag in Abschnitt 8 |
| **[FW]** | Fachwissen/Trainerwissen, nicht gegen eine Quelle geprüft | nur mit Feld `check`; vor Release Trainer-Review |
| **[Design]** | eigene Ableitung für das Spiel, keine Tatsachenbehauptung über Kampfsport | ja, aber nie als Fakt formulieren |

### 1.2 Regeln für Änderungen

1. **Recherche vor Inhalt.** Bevor eine Technik, ein Konter oder eine Sicherheitsangabe neu aufgenommen oder geändert wird, wird sie recherchiert und mit URL belegt. Ohne Beleg erhält sie den Marker [ungeprüft] oder [FW] und einen Eintrag in Abschnitt 8.
2. **Jede Aussage hat eine Quelle.** Quellen stehen in der Tabellenzeile oder direkt hinter dem Absatz; alle URLs zusätzlich in Abschnitt 9.
3. **Zitate kurz halten.** Wörtliche Zitate bleiben unter 15 Wörtern, stehen in Anführungszeichen und in Originalsprache. Alles andere wird paraphrasiert.
4. **Zitat, Paraphrase und Zuschreibung trennen.** Insbesondere bei John Danaher: Was nicht wörtlich belegt ist, wird nicht als Danaher-Zitat ausgegeben (siehe 2.7).
5. **Keine erfundenen Quellen.** Lieber eine Lücke offen dokumentieren als eine Quelle vermuten.
6. **Widersprüche dokumentieren**, nicht still auflösen (Beispiel: Reihenfolge Side Control/Knee on Belly in 3.2).
7. Fachbegriffe korrekt schreiben: **Southpaw** (nicht „South Paul“), Orthodox/Regular, Kuzushi, Ashi Garami.

---

## 2. Danaher- und Gracie-Prinzipien

Legende in diesem Abschnitt: **[Zitat]** wörtlich laut Quelle, **[Paraphrase]** sinngemäß, **[Sekundär]** nur über Bericht belegt. Die meisten Danaher-Aussagen stammen aus Instagram-Posts, die über BJJEE, War Tribe Gear oder Senso wiedergegeben werden; die Posts selbst wurden nicht direkt abgerufen.

### 2.1 Kontrolle führt zur Submission

- [Zitat, Instagram 1.7.2019, über War Tribe Gear] Danaher beschreibt Jiu-Jitsu als „the art and science of control that leads to submission“. — [War Tribe Gear](https://wartribegear.com/blogs/jiu-jitsu-mindset/john-danahers-philosophy-on-approaching-submission)
- [Paraphrase] Derselbe Post nennt zwei Wege zur Submission: (1) den Gegner in einem verwundbaren Moment erwischen, bevor er seine Verteidigung aufbaut; (2) zuerst eine vollständige dominante Position erreichen („get to a completed dominant position first“) und dann die Verteidigung schrittweise abbauen. Wer Submissions maximal nutzen will, braucht beide Wege. — ebd.
- [Sekundär] Ein New-Yorker-Profil (2017) beschreibt die Arbeit des „Danaher Death Squad“ als Systematisierung dieser Kontrolle und betont Systemdenken: Fällt ein Teil aus, kompensieren andere. — [BJJEE-Bericht](https://www.bjjee.com/articles/newyorker-profiles-danaher-death-squad/); Original nicht abgerufen.

**Mattenkarten-Bezug:** Ressource **Kontrolle** (0–5), Submissions mit Mindest-Kontrolle; Weg (1) ist als riskante Ausnahme denkbar (Schnellangriff ohne volle Kontrolle mit Malus) [Design].

### 2.2 Der Pin als Mittel, nicht als Ziel

- [Zitat] „The pin is a means to an end – not the end itself.“ — [Senso/BJJEE-Repost, 17.8.2023](https://sensobjj.com/blogs/graciemag-1/bjj-advice-don-t-focus-just-on-pinning-people-but-on-actually-submitting-them)
- [Zitat] „Without immobilizing first it's very hard to consistently enter into submissions.“ — ebd.
- [Paraphrase] Jede Bewegung Richtung Submission lockert die Kontrolle; man muss lernen, dieses Risiko für die höchste Belohnung einzugehen. — ebd.

**Mattenkarten-Bezug:** Eine gekonterte Submission setzt die Kontrolle auf 0 und kann die Position kosten (Spec 2.3). Siegbedingung bleibt die Submission, Punkte sind nur Tiebreak.

### 2.3 Dilemmas: Angriffe in Paaren

- [Zitat] „attack in pairs of moves rather than a single move.“ — [BJJEE, 25.7.2023](https://www.bjjee.com/articles/dilemmas-the-secret-to-success-in-jiu-jitsu/)
- [Zitat] „as opponent defends one he walks into the other.“ Paare möglichst in entgegengesetzte Richtungen wählen. — ebd.
- [Zitat] „This foundational principle is at the heart of all good Jiu-Jitsu.“ — ebd.
- [Paraphrase] Je mehr der Gegner in die Abwehr von Angriff A investiert, desto verwundbarer wird er für Angriff B. — ebd.

**Mattenkarten-Bezug:** Mechanik **Dilemma** (Spec 2.3): Wurde die Partnerkarte im letzten Zug gekontert, ignoriert die zweite Karte genau diese Reaktion. Jede Angriffskarte sollte ihre Paarkarte nennen. Belegte Paare siehe 4.6.

### 2.4 Verteidigung zuerst

- [Zitat] „the pathway to attack is through your confidence in your defense.“ — [BJJEE, 1.6.2022](https://www.bjjee.com/articles/john-danaher-the-pathway-to-attack-is-through-confidence-in-your-defense/)
- [Zitat] „So your first skill is: never let people control you.“ — ebd.
- [Zitat] „You got to be able to get out of any pin.“ (sinngemäß weiter: aus jeder Submission und jedem Kontrollgriff). — ebd.
- [Paraphrase, „New Wave“-Escapes, 3.2.2021] Klassisch führt ein Escape zurück in eine neutrale Position (Guard). Danahers neue Variante geht direkt aus dem Escape in einen Angriff (z. B. Ashi Garami), weil der Energieaufwand vergleichbar sei. — [Grappling Insider via Senso](https://sensobjj.com/blogs/graciemag-1/john-danaher-shares-philosophy-behind-new-wave-positional-escapes)
- [Paraphrase] Gracie Barra: erst die ganze Positionshierarchie lernen, bevor man sich spezialisiert; an jeder Position fragen, ob man sie erkennt, hält, verlässt und was droht. — [Gracie Barra](https://graciebarra.com/2015/03/the-positional-hierarchy)
- [Paraphrase] Cursa: aus unterlegener Position zuerst überleben, Hals und Arme schützen, Frames aufbauen, entkommen; Escapes kommen vor Submissions. — [Cursa](https://cursa.app/en/page/bjj-starter-guide-safety-tapping-and-positional-priorities)

**Mattenkarten-Bezug:** Escape-Karten gleichwertig zu Angriffskarten; Tutorial führt Reaktionen früh ein (Kampf 2: Sprawl). Optionale Escape-Karten mit direktem Gegenangriff („New Wave“) [Design].

### 2.5 Systeme statt Einzeltricks

- [Paraphrase, Produkttext] „Back Attacks: Enter the System“ ist ein strukturierter Lehrplan mit Hauptsystem („Straitjacket System“), Hilfssystemen und „10 Critical Principles“. — [BJJ Fanatics](https://bjjfanatics.com/pages/back-attacks-enter-the-system-by-john-danaher-product)
- [Zitat, Werbetext] „Back Mount is largely considered the best position.“ — ebd. Die Behauptung einer Finish-Rate über 80 % ist reiner Verkaufstext und **nicht verwenden**.
- [Paraphrase, Produkttext „Go Further Faster“] Vier Säulen (Bewegung, Technik, Konzeptwissen, Pareto-Prinzip) und 15 Kernfertigkeiten in drei Domänen: Stand (Stance, Motion, Grip, Kuzushi, Übergang zum Boden), Unten (Pin-Escapes, Guard Retention, Guard-Offense, Half-Guard-Offense, Turtle-Defense), Oben (Closed Guard öffnen, Guard passieren, Pin halten, Turtle-Breakdowns). — [BJJ Fanatics GFF](https://bjjfanatics.com/pages/go-further-faster-by-john-danaher)
- [Zitat-Begriffe, über BJJEE] Vier mechanische Prinzipien: Hebel und Drehpunkt, Keil, Kraftrichtung, Kuzushi (Gleichgewicht brechen). — [BJJEE, 7.6.2020](https://www.bjjee.com/articles/danaher-outlines-4-mechanical-principles-need-understand-vastly-improve-bjj/)

**Mattenkarten-Bezug:** Pareto-Kartenset (wenige, wirksame Basistechniken), Deck-Archetypen als „Systeme“ [Design].

### 2.6 Takedowns nach Risiko wählen („Feet to Floor“)

- [Paraphrase] Danaher nennt sechs Kriterien für BJJ-taugliche Takedowns: **Rückenexposition, Nackenexposition (Guillotine), Gürtelzugang, Gewichtsexposition (Sprawl), Roll-through-Gefahr, Schwierigkeitsgrad**. Bevorzugt werden Ankle Pick, Collar Drag und Sasae Tsurikomi Ashi; riskanter sind Drop Seoi Nage sowie Single und Double Leg. — [BJJ Fanatics Blog](https://bjjfanatics.com/blogs/news/feet-to-floor-bridging-the-takedown-gap-in-bjj-with-john-danaher)
- [Paraphrase] „Overlap principle“: Bewegungen, die Stand und Boden teilen (Sweep ähnlich Ankle Pick), beschleunigen das Lernen. — ebd.
- Evolve MMA empfiehlt BJJ-Anfängern **Ankle Pick, O-Goshi und Double Leg**. — [Evolve MMA](https://evolve-mma.com/blog/the-3-best-bjj-takedowns-for-beginners/)

**Mattenkarten-Bezug:** Takedown-Karten tragen Risiko-Attribute aus den sechs Kriterien (z. B. Double Leg: Nackenexposition hoch → Guillotine-Konter möglich) [Design].

### 2.7 Drei-Phasen-Modell (Renzo Gracie und Danaher)

- [Paraphrase/Zitat] *Mastering Jujitsu*: (1) freie Bewegung ohne Griff (Schläge, Ausweichen, Shoot), (2) Clinch, beschrieben als „a tight, controlling grip on each other in a standing position“, (3) Bodenkampf. Kernstrategie: den Kampf in die Phase bringen, in der der Gegner „least skilled“ ist. — [Human Kinetics](https://us.humankinetics.com/blogs/excerpt/understand-the-three-phases-of-combat)
- [Paraphrase] Gracie University: zwei sichere Distanzen, „all the way out or all the way in“; Mitteldistanz gegen größere Gegner ist sehr riskant. Ein ausdrücklich benanntes Rener-Gracie-Phasenmodell wurde nicht gefunden. — [Gracie University Lesson 7](https://www.gracieuniversity.com/Pages/Public/Lesson.aspx?sh=232)
- [Paraphrase] Grapplearts: fünf Distanzen (Projektil, Handwaffe, Schlag, Clinch, Boden) bzw. MMA in drei Phasen (Striking, Standing Grappling, Groundfighting). — [Grapplearts Ranges](https://www.grapplearts.com/grappling-range-of-fighting/), [Grapplearts MMA Formula](https://www.grapplearts.com/the-mma-formula-striking-takedowns-groundwork/)

**Mattenkarten-Bezug:** Archetypen mit Phasenstärken (Striker in Distanz, Ringer bei Shots, Guard-Spieler am Boden) [Design].

### 2.8 Was belegt ist und was nur zirkuliert

| Aussage | Status | Verwendung |
|---|---|---|
| „control that leads to submission“ | Danaher-Zitat [Sekundär] | ja |
| „attack in pairs …“ | Danaher-Zitat [Sekundär] | ja |
| „The pin is a means to an end …“ | Danaher-Zitat [Sekundär] | ja |
| „Position before submission“ | **allgemeiner BJJ-/Gracie-Grundsatz**, kein wörtliches Danaher-Zitat gefunden | als „BJJ-Grundsatz“ formulieren, nie als Danaher-Zitat |
| „control is the heart of jiu-jitsu“ | nicht belegt | nicht verwenden |
| „Beginners chase submission. Experts chase control …“ (BJJDOC-Sammlung) | keine Originalquelle | nicht verwenden — [BJJDOC](https://bjjdoc.com/?p=20322) |
| Back-Finish-Rate über 80 % | Werbebehauptung | nicht verwenden |

Danahers eigene Fassung ist differenzierter als der Slogan: erst immobilisieren, aber nicht im Pin verharren.

---

## 3. Die Kampfkette

Die Spec definiert die Kette **Distanz → Clinch → Takedown → Kontrolle → Submission**, bei Misserfolg **Repeat** (Scramble zurück auf neutral oder Stand). Sie deckt sich mit dem Drei-Phasen-Modell aus 2.7 und den Phasenmodellen von Grapplearts.

### 3.1 Die Glieder

| Glied | Spiel-Knoten (Spec) | Inhalt | Wichtigste Quellen |
|---|---|---|---|
| 1 Distanz | `dist` | Stand (Orthodox/Southpaw), Fußarbeit, Hand Fighting, Level Change hinter Schlägen, Kick Catch | [Evolve University](https://evolve-university.com/blog/orthodox-vs-southpaw-what-you-need-to-know/), [Evolve MMA Closing Distance](https://evolve-mma.com/blog/the-art-of-closing-distance-tips-for-grapplers-facing-strikers/) |
| 2 Clinch | `clinch` | Collar Tie, 2-on-1, Underhook/Overhook, Over-Under, Body Lock, Pummeling | [Evolve MMA Underhooks](https://evolve-mma.com/blog/understanding-underhooks-and-overhooks-in-mma/), [Black Belt Mag](https://www.blackbeltmag.com/evaluating-the-4-major-clinches) |
| 3 Takedown | `fhl`, `guard` (Landung) | Double/Single Leg, Ankle Pick, Snap Down, Body Lock, Judo-Würfe; Abwehr Sprawl/Whizzer | Abschnitt 4.3 |
| 4 Kontrolle | `side`, `mount`, `back` | Pass, Sweep, Positionsaufstieg, Escapes | [BJJ Atlas](https://bjj-atlas.pages.dev/escapes), [Gymdesk](https://gymdesk.com/blog/jiu-jitsu-point-system) |
| 5 Submission | – | RNC, Armbar, Kimura, Americana, Triangle, Guillotine, Cross Collar | Abschnitt 4.5 |
| Repeat | `dist`/`guard` | Escape oder gekonterte Submission führt zurück | [Design] |

Grundlagen Stand: **Orthodox** = linker Fuß und linke Hand vorn, Power-Hand hinten; **Southpaw** = Spiegelbild. Gleiche Auslage heißt „geschlossen“ (Brust an Brust), gegensätzliche „offen“ (Schulter an Schulter); dann kämpfen beide um die Außenposition des vorderen Fußes. — [Evolve University](https://evolve-university.com/blog/orthodox-vs-southpaw-what-you-need-to-know/). Der aufrechte Thai-Stand ist anfälliger für Takedowns, der tiefe Ringerstand eignet sich zum Shooten und Abwehren. — [Lowkick MMA](https://www.lowkickmma.com/mma-stances-an-explainer-and-finding-whats-best/). USA Wrestling definiert sieben Basic Skills: Stance, Motion, Level Change, Penetration, Lifting, Sprawl, Back Step. — [USA Wrestling](https://content.usawmembership.com/articles/2175)

### 3.2 Positionshierarchie

Verbreitete Ordnung von oben nach unten (allgemeine BJJ-Lehre, nicht Danaher-spezifisch):

**Back Control > Mount > Side Control / Knee on Belly > Guard (neutral) > Half Guard > Side Control unten > Mount unten > Back unten.** — [JitsuIQ](https://jitsuiq.com/concepts/positional-hierarchy.html)

Abweichung: Gracie Barra stellt Knee on Belly **über** Side Control und nennt Turtle und Half Mount gesondert. — [Gracie Barra](https://graciebarra.com/2015/03/the-positional-hierarchy). Für das Spiel ist die Reihenfolge Side/KOB gleichwertig zu behandeln, bis ein Trainer entscheidet (Abschnitt 8).

Positionsprioritäten laut Cursa: dominant = stabilisieren, Escapes verhindern, aufsteigen, dann finishen; neutral = Inside Position gewinnen, Winkel, Kontrolle; unterlegen = überleben, schützen, Frames, entkommen. — [Cursa](https://cursa.app/en/page/bjj-starter-guide-safety-tapping-and-positional-priorities). Kesting rät Anfängern zu 2–3 Angriffen je Top-Position und 2–3 Escapes oder Sweeps je Bottom-Position. — [Grapplearts Roadmap](https://www.grapplearts.com/a-roadmap-for-grappling/)

### 3.3 IBJJF-Punkte

| Aktion | Punkte | Bedingung |
|---|---|---|
| Takedown | 2 | Position 3 s halten |
| Sweep | 2 | 3 s halten |
| Knee on Belly | 2 | Knie/Schienbein auf Rumpf, anderes Knie hoch, Gegner auf Rücken/Seite; Kniewechsel zählt nicht erneut |
| Guard Pass | 3 | 3 s halten |
| Mount | 4 | oben, frei von Half Guard, auf dem Rumpf, Blick zum Kopf; über beiden Armen nur Vorteil |
| Back Control | 4 | Hooks drin, **Füße nicht gekreuzt**, höchstens ein Arm gefangen; Body Triangle oder gekreuzte Füße nur Vorteil |

Quellen: [FloGrappling 2025](https://www.flograppling.com/articles/13493486-how-does-the-2025-ibjjf-point-system-work), [Gymdesk (Regelwerk v6.1, Juni 2024)](https://gymdesk.com/blog/jiu-jitsu-point-system). Beides Sekundärquellen; das offizielle Regelwerk war nicht abrufbar.

Weitere Regeln laut Gymdesk: In einer durchgehenden Kette zählt die Endposition (Pass plus Mount = 7). Vorteil für nicht gehaltene Position oder gefährlichen Submission-Versuch. Strafen: 1. markiert, 2. Vorteil Gegner, 3. zwei Punkte Gegner, 4. Disqualifikation. Tiebreak: Punkte, Vorteile, weniger Strafen, Kampfrichter. „Sweep direkt in Mount = 6“ ist **abgeleitet** und zu prüfen.

**Mattenkarten-Bezug:** Spec 2.4 nutzt Takedown 2, Sweep 2, Pass 3, Mount 4, Back 4; Back-Punkte erst mit Hooks-Setup (entspricht der Hooks-Bedingung). Knee on Belly fehlt in der Spec, weil KOB kein Spielknoten ist. Die 3-Sekunden-Regel lässt sich als „eine Runde halten“ abbilden [Design]. Fehlerkarte „gekreuzte Füße im Back = keine Punkte“ ist belegt.

---

## 4. Aktion–Reaktion-Katalog

Spalten: **Aktion | typische Reaktion | Re-Attack/Folge | Quelle | Status**. „belegt“ heißt: in der Quelle im Volltext gefunden. Die Tags in der Spec (`counters` ∩ `tags`) sollen sich an diesen Zeilen orientieren.

### 4.1 Phase Distanz und Hand Fighting

| Aktion | typische Reaktion | Re-Attack/Folge | Quelle | Status |
|---|---|---|---|---|
| Handgelenk-/Ellbogenkontrolle vor dem Single Leg (Inside Position) | Griff lösen | Single Leg mit Penetration Step | [Keep Kids Wrestling PDF](https://www.keepkidswrestling.com/_files/ugd/7ebc08_98c5824d637040fa9c7202f7fa8d4a65.pdf) | belegt |
| 2-on-1 (aus dem Collar Tie des Gegners) | Gegner richtet sich frontal auf, postet Arm auf die Schulter | Arm Drag am fernen Arm → Taille → Takedown; öffnet Outside Single | [FanaticWrestling (Heflin)](https://fanaticwrestling.com/blogs/news/learn-the-2-on-1-tie-to-arm-drag-from-nick-heflin) | belegt |
| Collar-and-Elbow Tie | Gegner liest und lenkt Shots ab | Leg Shots, Duck Under, Go-Behind | [Black Belt Mag](https://www.blackbeltmag.com/evaluating-the-4-major-clinches) | belegt |
| Fake Shot / Druck | Kopf hoch, nach vorn | Snap Down | [USA Wrestling Snapdowns](https://content.usawmembership.com/articles/3711) | belegt |
| Draw-in-Schritt rückwärts | Gegner steppt nach | Fireman's Carry aus Inside Control | [Wikibooks Folkstyle](https://en.wikibooks.org/wiki/Folkstyle_Wrestling/Advanced_Offensive_Moves_From_Neutral) | belegt |
| Kick des Gegners | Kick Catch (seitlich steppen, scoopen) | Single oder Double Leg | [Dynamic Striking (Cejudo)](https://dynamicstriking.com/blogs/news/catching-kicks-to-set-up-a-takedown-with-henry-cejudo) | belegt |
| Jab → Level Change → Double Leg | Sprawl, Stand halten, Distanz | – | MMA-Standard | [ungeprüft] |
| Gegen Southpaw: zur Außenseite des Führfußes kreisen | Gegner kreist zurück | Power-Hand auf die Mittellinie | [Evolve University](https://evolve-university.com/blog/orthodox-vs-southpaw-what-you-need-to-know/) | belegt |

Hand-Fight-Karten wirken als Enabler (Setups), die Angriffe freischalten [Design]. Für Frames gegen Clinch-Eingänge, Inside Tie und Kick-Catch-Konter des Kickers fehlen Quellen.

### 4.2 Phase Clinch

| Aktion | typische Reaktion | Re-Attack/Folge | Quelle | Status |
|---|---|---|---|---|
| Underhook | Overhook/Whizzer (laut Quelle die übliche Defensivreaktion) | Pummeln zurück zum Underhook; Single/Double, Tai Otoshi, Osoto Gari | [Evolve MMA Underhooks](https://evolve-mma.com/blog/understanding-underhooks-and-overhooks-in-mma/) | belegt |
| Overhook/Whizzer | – | Fireman's Carry, Uchi Mata; Whizzer → Front Headlock → Sumi Gaeshi | ebd. | belegt |
| Pummeling (Swim nach innen) | Gegner pummelt zurück | Inside Position | ebd. | belegt |
| Over-Under (neutral) | – | Oberkörper-Takedowns, Judo-Trips | [Black Belt Mag](https://www.blackbeltmag.com/evaluating-the-4-major-clinches) | belegt |
| Plum-Clinch gegen Ringer | Shrug heraus („high percentage“ laut Quelle) | – | ebd. | belegt |
| Double Underhooks/Body Lock | Hüfte zurück, Frames, Griff brechen, Winkel | Sprawl, Snap Down → Front Headlock oder Double Leg | [JitsuIQ Body Lock](https://jitsuiq.com/takedowns/body-lock-takedown.html) | belegt |
| Body Lock: Angreifer lehnt zu weit vor | – | Uchi Mata / Hip Toss für den Verteidiger | ebd. | belegt |
| Wrist-/Bizepskontrolle | verhindert Underhook | – | [Evolve MMA Clinch](https://evolve-mma.com/blog/5-areas-to-improve-in-your-mma-clinch-game/) | belegt |

Underhook ↔ Overhook ↔ Pummeln ist ein natürlicher Schere-Stein-Papier-Kern der Clinch-Phase [Design].

### 4.3 Phase Takedown

| Aktion | typische Reaktion | Re-Attack/Folge | Quelle | Status |
|---|---|---|---|---|
| Double Leg | Sprawl (Hüfte runter/zurück) | Verteidiger: Front Headlock, Turtle-Kontrolle; Guillotine, Darce, Anaconda | [JitsuIQ Sprawl](https://jitsuiq.com/movement-mechanics/sprawl.html) | belegt |
| Double Leg | Hüfte früh entgegen, Hand vom Knie lösen | zwingt Angreifer zum Single → Go-Behind; Kopfposition entscheidet | [FanaticWrestling (Dake)](https://fanaticwrestling.com/blogs/news/the-science-of-stopping-the-double-leg-with-kyle-dake) | belegt |
| Single Leg | Whizzer (wenn der Sprawl verpasst wurde) | Angreifer: Brust hoch, in die ferne Hüfte, rückwärts laufen, Limp Arm | [LowKick MMA](https://lowkickmma.com/wrestling-whizzer), [Keep Kids Wrestling PDF](https://www.keepkidswrestling.com/_files/ugd/7ebc08_98c5824d637040fa9c7202f7fa8d4a65.pdf) | belegt |
| Single Leg | Sprawl | Corner Cut oder Ankle Pick, sobald der Druck nachlässt | Keep Kids Wrestling PDF | belegt |
| Single Leg | Crossface | Kopf in die Rippen drehen; Inside Trip oder Bear Hug | ebd. | belegt |
| Snap Down | Kopf hoch, Rücken gerade, Collar Tie brechen, wegkreisen | Go-Behind; Guillotine bei freiem Hals; gegen Vorwärtsdruck Double/Single | [JitsuIQ Snap Down](https://jitsuiq.com/takedowns/snap-down-to-front-headlock.html) | belegt |
| Sprawling Snapdown | Gegner drückt zurück | voller Sprawl → Go-Behind | [USA Wrestling](https://content.usawmembership.com/articles/3711) | belegt |
| Arm Chop Snapdown | Gegner postet Hand | Go-Behind auf Chop-Seite | ebd. | belegt |
| Ankle Pick (Gegner steppt nach Snap vor) | gleichmäßige Gewichtsverteilung erschwert ihn | Side Control/Mount, Straight Ankle Lock, Kimura | [JitsuIQ Ankle Pick](https://jitsuiq.com/takedowns/ankle-pick.html) | belegt |
| Ankle Pick | Bein zurückziehen, Sprawl, Kick-Out | Front Headlock bei schlechter Kopfposition | [Keep Kids Wrestling](https://www.keepkidswrestling.com/post/the-ankle-pick-a-beginner-friendly-guide) | belegt |
| Penetration Step mit Kopf unten | Guillotine | – | [Evolve MMA](https://evolve-mma.com/blog/mastering-the-penetration-step-for-better-takedowns-in-mma-and-bjj/) | belegt (Fehler); Bedingung „Kopf außen/unten“ als Auslöser nur indirekt |
| Judo-Konter (Kaeshi Waza) | z. B. Osoto-gari → Harai-goshi, Kosoto-gari → Tai-otoshi, Ouchi-gari → Ushiro-goshi | Kaeshi-no-Kata ist keine anerkannte Kodokan-Kata | [Judo Info](https://judoinfo.com/?p=259) | belegt |
| Hüftwurf (O-Goshi, Seoi-Nage) | Hüftblock, herumsteigen | – | Judo-Standard | [FW] |

Wurf-Grundlage: Kuzushi, Tsukuri, Kake (brechen, eindrehen, ausführen). — [Wikipedia Kuzushi](https://en.wikipedia.org/wiki/Kuzushi). Ukemi vor jedem Wurftraining. — [Elite Sports](https://www.elitesports.com/blogs/news/basic-judo-throws)

### 4.4 Der Front Headlock als Hub

Über viele Quellen hinweg münden Sprawl, Snap Down und Whizzer im **Front Headlock** (Spec-Knoten `fhl`). Er ist der zentrale Scramble-Knoten.

| Eingang | Quelle |
|---|---|
| Sprawl gegen Double/Single Leg | [JitsuIQ Sprawl](https://jitsuiq.com/movement-mechanics/sprawl.html), [Keep Kids Wrestling Sprawl](https://www.keepkidswrestling.com/post/mastering-the-sprawl-in-neutral-position) |
| Snap Down aus Collar Tie | [JitsuIQ Snap Down](https://jitsuiq.com/takedowns/snap-down-to-front-headlock.html) |
| Whizzer gegen Single Leg | [USA Wrestling Whizzer](https://content.usawmembership.com/articles/2131), [Evolve MMA Underhooks](https://evolve-mma.com/blog/understanding-underhooks-and-overhooks-in-mma/) |
| Konter auf Body Lock (Snap Down) | [JitsuIQ Body Lock](https://jitsuiq.com/takedowns/body-lock-takedown.html) |

Kontrolle laut Evolve: Kinn greifen, Schulter auf den Nackenansatz, andere Hand zieht den gleichseitigen Ellbogen weg, Knie vom Boden, Gewicht auf den Nacken. — [Evolve MMA Front Headlock](https://evolve-mma.com/blog/3-ways-to-use-the-front-headlock-in-bjj/)

| Ausgang aus `fhl` (top) | Bedingung | Quelle | Status |
|---|---|---|---|
| Guillotine | Hals frei; laut Quelle die populärste Submission aus dieser Position | Evolve MMA | belegt |
| Go-Behind → Back | Ellbogen wegziehen, dahinter spinnen | Evolve MMA; USA Wrestling (Re-Snap lässt Ellbogen los) | belegt |
| Turn-over → Top Control | – | Evolve MMA | belegt |
| Darce, Anaconda | nach Sprawl | JitsuIQ Sprawl | belegt (nur genannt) |
| Bottom: Kopf hoch, Hüfte unter Körper, Hände an seine Handgelenke | Snap-Down-Konter | – | [FW] |

### 4.5 Phase Kontrolle und Submission (Boden)

| Aktion | typische Reaktion | Re-Attack/Folge | Quelle | Status |
|---|---|---|---|---|
| Hip Bump Sweep (Gegner sitzt aufrecht/stützt) | Arm wegziehen | Kimura | [JitsuIQ Hip Bump](https://jitsuiq.com/sweeps/hip-bump-sweep.html) | belegt |
| Hip Bump Sweep | nach vorn lehnen | Guillotine | ebd. | belegt |
| Armbar aus Guard | Arm herausziehen | andere Hand gestreckt → Omoplata, gebeugt → Triangle | [Evolve University](https://evolve-university.com/blog/basic-bjj-combinations-triangle-choke-omoplata-and-armbar/) | belegt |
| Omoplata | aufposten | Triangle | ebd. | belegt |
| Triangle | Stacking/Posture | Armbar, Omoplata | ebd.; [BJJ Atlas Triangle](https://bjj-atlas.pages.dev/submissions/triangle) | belegt |
| Kimura aus Guard | Widerstand | Sweep nach oben | [BJJ Atlas Kimura](https://bjj-atlas.pages.dev/submissions/kimura) | belegt |
| RNC | Zwei-Hand-Hand-Fighting, Kinn runter | Armbar | [BJJ Atlas RNC](https://bjj-atlas.pages.dev/submissions/rear-naked-choke), [Evolve MMA RNC](https://evolve-mma.com/blog/how-to-escape-the-rear-naked-choke/) | belegt |
| Cross Collar (nur Gi) | Arme hochdrücken | Armbar | [BJJ Atlas Cross Collar](https://bjj-atlas.pages.dev/submissions/cross-collar-choke) | belegt |
| Knee Slice Pass | Knee Shield / Z-Guard | Backstep; bei Hüftflucht Leg Drag | [BJJ Atlas Knee Cut](https://bjj-atlas.pages.dev/guard-passing/knee-cut), [Gracie Barra](https://graciebarra.com/gb-news/gb-technique-troubleshooting-the-knee-slice-pass) | belegt |
| Stack Pass | Triangle-Drohung, Frames, Inversion | Seite weit rausstellen, Haltung | [BJJ Atlas Stack Pass](https://bjj-atlas.pages.dev/guard-passing/stack-pass) | belegt |
| Butterfly Sweep | Hand posten, zurückweichen | X-Guard | [BJJ Atlas Butterfly](https://bjj-atlas.pages.dev/sweeps/butterfly-sweep) | belegt |
| Side Control (unten): Frame Escape | Gegner folgt mit Druck | Seite wechseln; „Frame first, THEN bridge, THEN shrimp“ | [BJJ Atlas Side Control](https://bjj-atlas.pages.dev/escapes/side-control-escapes) | belegt |
| Side Control (unten): Underhook Escape | Guillotine beim Hochkommen | Turtle/Knie | ebd. | belegt |
| Mount (unten): Upa | Gegner basiert breit/postet | Elbow-Knee Escape | [BJJ Atlas Mount](https://bjj-atlas.pages.dev/escapes/mount-escapes) | Upa belegt; Konter und Wechsel [FW] |
| Back (unten): Hände zuerst, dann unteren Hook lösen | – | Side Control unten gilt als Erfolg | [BJJ Atlas Back](https://bjj-atlas.pages.dev/escapes/back-escapes) | belegt |

Escape-Reihenfolgen sind belegt und eignen sich als Sequenz-Voraussetzung: Frame → Bridge → Shrimp; im Back Hände → unterer Hook → Schulter auf die Matte. Upa-Fehler laut Grapplearts: zu früh (bevor eine Hand des Gegners am Boden ist), zu lange in der Bridge, Arm und Bein nicht auf derselben Seite, rollen vor voller Hüftstreckung. — [Grapplearts Upa](https://www.grapplearts.com/the-4-most-common-errors-for-the-upa-mount-escape/). Teilerfolge zählen ausdrücklich („Mount to side control is progress“, BJJ Atlas).

**Submission-Vorbedingungen** (für die Kontroll-Regel):

| Submission | Positionen | Schlüsselrisiko | Quelle |
|---|---|---|---|
| RNC | Back | Hals | BJJ Atlas RNC |
| Armbar | Mount, KOB, Closed Guard | Ellbogen; häufigste Submission-Verletzung | [BJJ Atlas Armbar](https://bjj-atlas.pages.dev/submissions/armbar) |
| Kimura | Closed Guard, Side Control, North-South | Schulter | BJJ Atlas Kimura |
| Americana | Mount, Side Control, KOB | Schulter; Richtung zur Hüfte (Kimura zum Rücken) | [BJJ Atlas Americana](https://bjj-atlas.pages.dev/submissions/americana) |
| Triangle | Closed Guard, Mount | Hals | BJJ Atlas Triangle |
| Guillotine | Stand, Closed Guard, Front Headlock, Konter auf Takedown | Hals; würgen, nicht kurbeln [FW] | [BJJ Atlas Guillotine](https://bjj-atlas.pages.dev/submissions/guillotine) |
| Cross Collar | Mount, Closed Guard (nur Gi) | Hals | BJJ Atlas Cross Collar |

### 4.6 Klassische Dilemma-Paare

| Paar | Mechanik | Status |
|---|---|---|
| Hip Bump ↔ Kimura ↔ Guillotine | Abwehr gegen den Sweep öffnet die Submission | belegt (JitsuIQ) |
| Armbar ↔ Triangle ↔ Omoplata | Dreieckszyklus aus der Guard | belegt (Evolve University) |
| Snap Down ↔ Shot | Snap gegen Vorwärtsdruck, Shot gegen Kopf hoch | belegt (JitsuIQ, USA Wrestling) |
| Single Leg ↔ Corner Cut / Ankle Pick / Inside Trip | Wechsel je nach Abwehr (Sprawl, Crossface) | belegt (Keep Kids Wrestling) |
| Sprawl → Front Headlock → Guillotine ↔ Go-Behind | Hals schützen öffnet den Rücken | belegt (Evolve MMA) |
| Kimura ↔ Sweep | Submission verteidigen oder gesweept werden | belegt (BJJ Atlas) |
| RNC ↔ Armbar | Zwei-Hand-Abwehr öffnet den Arm | belegt (BJJ Atlas) |
| Double ↔ Single | nur indirekt: Hand vom Knie zwingt zum Single | teilweise belegt (Dake) |

---

## 5. Sicherheit und Regeln

### 5.1 Abklopfen und Loslassen

- Früh abklopfen, sobald sich ein Hebel festzieht, nicht erst am Endpunkt; wer nicht innerhalb etwa einer Sekunde sicher entkommt, klopft ab. Deutlich und wiederholt (ein leichter Tap zählt nicht). Methoden: Hand am Partner, Fuß auf der Matte, laut „Tap“/„Stop“, wenn Gliedmaßen eingeklemmt sind. Schwindel, Sternchen oder verändertes Hören bedeuten sofortiges Abklopfen. — [Cursa](https://cursa.app/en/page/bjj-starter-guide-safety-tapping-and-positional-priorities)
- Ansetzen: Kontrolle, dann Druck, dann Finish, mit Pause am Kontrollpunkt, damit der Partner Zeit zum Abklopfen hat; beim Tap sofort loslassen, auch verbale Taps respektieren. — ebd.
- Hinz et al. empfehlen, Zeit für den Tap zu lassen und Lernen über Gewinnen zu stellen. — [Hinz et al. 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8721390)

**Mattenkarten-Bezug:** Tap-Moment (3,5 s) und Loslassen-Moment aus der Spec 2.4; Tap = Ehren-XP, nicht Niederlage. Marvel Snaps „Retreat als kleiner Sieg“ (7.3) stützt diese Rahmung.

### 5.2 Intensität und Etikette

- Anfänger beginnen mit etwa 60–70 % Intensität, Kontrolle vor Tempo, sagen, dass sie neu sind, und rufen Stopp bei Nacken- oder Knieschmerz. — [Cursa](https://cursa.app/en/page/bjj-starter-guide-safety-tapping-and-positional-priorities)
- Nach harten Submissions beim Partner nachfragen; Hygiene (saubere Gis, Schweiß aufwischen); vor dem Drillen fragen. — [Gracie Barra Etikette](https://graciebarra.com/gb-news/etiquettes-beginners)
- Body Lock: „Lift and Dump“ kann je nach Regelwerk ein Slam sein; im Spiel als Trip/kontrollierte Variante darstellen. — [JitsuIQ Body Lock](https://jitsuiq.com/takedowns/body-lock-takedown.html), [BJJ Fanatics](https://bjjfanatics.com/blogs/news/illegal-moves-in-bjj)
- Ukemi kommt vor jedem Wurf; Würfe nur auf Matten und mit Trainer. DJB verlangt Fallschule ab dem 7. Kyu. — [Elite Sports](https://www.elitesports.com/blogs/news/basic-judo-throws), [DJB](https://judobund.de/fileadmin/user_upload/judobund.de/Downloads/Downloadcenter/Kyu-Graduierungen/Anforderungen_fuer_Kyu-Grade_2024.pdf)
- Double Leg beim Lernen langsam ausführen, damit der Partner abfallen kann. — [Evolve MMA](https://evolve-mma.com/blog/the-3-best-bjj-takedowns-for-beginners/)
- Ghost Escape ist laut BJJ Atlas „Not for beginners“. — [BJJ Atlas](https://bjj-atlas.pages.dev/escapes/side-control-escapes)

### 5.3 Verbotene Techniken für Weißgurte (IBJJF)

Laut Sekundärquellen verboten für Erwachsene im Weißgurt: Wristlocks, Kompressionshebel in der Closed Guard (Nieren/Rippen), Bizeps- und Wadenquetscher, Kneebar, Toe Hold, Heel Hook, Kniedrehhebel und Knee Reaping, Slams, Wirbelsäulenhebel ohne Würgen, Kani Basami, Fingerhebel, Suplex. Neck Cranks verbieten IBJJF und UAEJJF grundsätzlich. — [Jiu Jitsu News](https://jiujitsu-news.com/ibjjf-illegal-and-legal-submissions), [BJJ Fanatics Illegal Moves](https://bjjfanatics.com/blogs/news/illegal-moves-in-bjj), [BJJ Fanatics Neck Cranks](https://bjjfanatics.com/blogs/news/are-neck-cranks-legal-in-bjj)

- Slams sind laut BJJ Fanatics „illegal at all levels“, inklusive Suplex.
- Erlaubt für Weißgurte laut Jiu Jitsu News: Straight Foot Lock, Ezekiel, frontale Guillotine, Omoplata, Triangle, Arm Triangle. Alle Kern-Submissions aus 4.5 sind erlaubt.
- Unklar: eine abgeschnittene Single-Leg-Einschränkung und die Formulierung „jumping guard“. Druck auf das Gesicht beim Side-Control-Escape gilt laut BJJ Atlas im Gi als illegal.
- Primärquelle „Golpes Proibidos“ (IBJJF-PDF) wurde nicht abgerufen.

**Mattenkarten-Bezug:** Slam, Neck Crank, Heel Hook und Kani Basami erscheinen nicht als spielbare Karten, sondern als Regel-Lektion in Weiß (Spec 3).

### 5.4 Verletzungsdaten

| Befund | Wert | Quelle |
|---|---|---|
| Stichprobe | 1.140 BJJ-Athleten, 1.052 Verletzungen, 308 pro 1.000 Athleten/Jahr | [Hinz et al. 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8721390) |
| Kontext | Sparring 77,6 %, Techniktraining 11,4 %, Wettkampf 9,6 % | ebd. |
| Mechanismus | Submissions 29,7 %, Takedowns 26,4 %, Guard Passing 24,0 % | ebd. |
| Wer wird verletzt | 78,9 % der Submission-Verletzungen beim Unterlegenen | ebd. |
| Häufigste Submissions | Armbar 22,4 %, Kimura 12,6 %, Heel Hook 11 % | ebd. |
| Körperregion | Knie 27,1 %, Schulter 14,6 % | ebd. |
| Gurte | Weißgurte im Mittel am wenigsten (0,73), Braungurte am meisten (1,22) | ebd. |
| Review | Knie und Brust/Rippen am häufigsten, dann Schulter; überwiegend Anfänger | [SciELO/PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11193589/) |
| Judo Japan 2003–2010 | 30 schwere Kopfverletzungen, Ø 16,5 Jahre, etwa die Hälfte Anfänger, meist akutes Subduralhämatom | [PubMed 22128268](https://pubmed.ncbi.nlm.nih.gov/22128268/) |

Hinz et al. sind selbstberichtet (mögliche Selektionsverzerrung). Welche Würfe die Judo-Kopfverletzungen verursachten, nennt der Abstract **nicht**; die Aussage „O-Soto-Gari ist Hauptrisiko“ ist nicht belegt und wird nicht verwendet.

### 5.5 Disclaimer

Die App ersetzt weder Coach noch Mattentraining; Techniken nur unter Aufsicht üben (Konsens aus Elite Sports, Gracie Barra, Cursa; vgl. SmartBJJ-Disclaimer). In-App-Gürtel sind Spielränge, keine Graduierung: Über BJJ-Graduierungen entscheidet der Lehrer, ein verbindliches IBJJF-Technikcurriculum gibt es nicht. — [IBJJF](https://ibjjf.com/graduation-system), [BJJ More](https://bjjmore.com/bjj-belt-requirements-and-curriculum/)

---

## 6. Didaktik (kurz)

| Prinzip | Befund | Quelle | Konsequenz für Mattenkarten |
|---|---|---|---|
| Retrieval Practice | Nur Practice Testing und Distributed Practice erhalten „high utility“; Wiederlesen „low utility“ | [Dunlosky et al. 2013 (APS)](https://www.psychologicalscience.org/news/releases/which-study-strategies-make-the-grade.html) | Freischalt-Lektion mit Kontrollfrage (Spec 4); Karte erst raten, dann umdrehen |
| Testing-Effekt und Illusion | Nach 2 Tagen/1 Woche behalten Getestete mehr; Wiederlesende fühlen sich sicherer | [Roediger & Karpicke 2006](https://profiles.wustl.edu/en/publications/test-enhanced-learning-taking-memory-tests-improves-long-term-ret/) | erklären, warum Abruf schwerer wirkt |
| Spacing | Optimaler Abstand ca. 20–40 % bei 1 Woche Behaltenszeit, 5–10 % bei 1 Jahr | [Cepeda et al. 2008](https://pubmed.ncbi.nlm.nih.gov/19076480/) | Bibliotheks-Quiz mit Leitner-Stufen; später FSRS |
| Scheduler | FSRS-6 hat bei 99,6 % der Nutzer niedrigeren Log-Loss als SM-2 (Vorhersage, nicht Lernzuwachs; Community-Benchmark) | [Expertium](https://expertium.github.io/Benchmark.html) | Leitner reicht für MVP |
| Interleaving | g = 0,42, visuelles Material g = 0,67, stärker bei ähnlichen Kategorien | [Brunmair & Richter 2019](https://pubmed.ncbi.nlm.nih.gov/31556629/) | Mount/Side/KOB gemischt abfragen |
| Novizen motorisch | Contextual-Interference-Effekt bei Unerfahrenen klein (~.10); geblockt beginnen | [Brady 2004](https://www.gwern.net/docs/spaced-repetition/2004-brady.pdf) | Neues geblockt einführen (Tutorial), danach mischen |
| Expertise Reversal | Hilfen für Novizen schaden Fortgeschrittenen; Hilfen leistungsabhängig ausblenden | [Chartered College](https://my.chartered.college/impact_article/expertise-reversal-effect-and-its-instructional-implications/) | Telegraph/Hinweise mit steigendem Gürtel reduzieren (Spec 4) |
| Video/Modelling | Form d = 0,77, Ergebnis nur d = 0,17 | [Ashford et al. 2006](https://e-space.mmu.ac.uk/84598) | App trainiert Wissen und Entscheidung, nicht Ausführung |
| Entscheidungstraining | Labor g = 1,51, Feld g = 0,65; Teamsport, hohes Bias-Risiko | [Zhu et al. 2024](https://www.mdpi.com/2076-328x/14/10/919) | ehrliche Erwartung |
| CLA / Ecological Dynamics | Positionelles Sparring mit Startposition, Rollen, Win-Condition, skalierenden Constraints; erste BJJ-Studie (n = 60) misst nur Physis/Distress | [Coaching-Substack](https://acoatofredpaintinhell.substack.com/p/how-to-design-an-ecological-dynamics), [Giardullo et al. 2026](https://iris.univr.it/handle/11562/1195070) | Szenario-Starts, mehrere richtige Lösungen; digitale CLA ist Hypothese |
| Kompetenzillusion | Häufiges Video-Schauen erhöht Selbstvorhersage, nicht Leistung | [Kardas & O'Brien 2018](https://www.chicagobooth.edu/media-relations-and-communications/press-releases/easier-seen-than-done-watching-how-to-videos-on-youtube-gives-people-false-sense-of-expertise) | Wissen und Können getrennt ausweisen; Matten-Aufgaben in der Bibliothek |
| Gamification | Kognitiver Effekt robust (Sailer & Homner 2020); Leaderboard/Badges senkten Motivation und Prüfungsleistung (Hanus & Fox 2015) | [gamification-research.org](https://gamification-research.org/2019/08/does-gamification-of-learning-work/), [Hanus & Fox](https://ersearch2.cvtisr.sk/vufind/SummonRecord/FETCH-LOGICAL-c408t-d82df39d2133f93d47d3d98f9c9aadee3039f9f89021367e6820fad79509cf9e3/Details?lng=en) | Narrativ (Gürtel-Kampagne) ja, globale Rangliste nein |

Nach jedem Reveal sollte ein kurzer Lerntext sagen, *warum* eine Aktion gewonnen hat (z. B. „Sprawl stoppt Double Leg“) [Design].

---

## 7. Spielmechaniken, die funktionieren

### 7.1 Yomi-Dreieck und ungleiche Auszahlungen

- Bei Yomi legen beide gleichzeitig verdeckt: Attack schlägt Throw, Throw schlägt Block, Dodge kontert Attack, gleiche Attacks entscheidet die Geschwindigkeit. — [Sirlin: Designing Yomi](https://www.sirlin.net/articles/designing-yomi)
- Entscheidend sind **ungleiche Auszahlungen**: Attack erlaubt eine Kombo, Throw eine schwächere und ist die einzige Strafe für Block, Dodge erlaubt einen Konter ohne Kombo, Block holt die Karte zurück und zieht eine Extrakarte (Erholung). — ebd.
- Sirlin: Schere-Stein-Papier ist in Ordnung, wenn jede Option einen Konter hat; verdeckte Information verhindert Lösbarkeit; 3–4 Fähigkeiten pro Charakter reichen. — ebd.
- [Paraphrase] Yomi-Ebenen: Konter, Konter auf den Konter usw.; laut Sirlin genügen drei Ebenen, weil die vierte zur ersten zurückführt. — [Sirlin: Playing to Win](https://www.sirlin.net/ptw-book/7-spies-of-the-mind)

**Mapping:** Spec-Dreieck Angriff > Setup > Reaktion > Angriff (nur mit passendem Tag). Ungleiche Auszahlungen sind schon angelegt: Setup gegen Reaktion kostet Gas und gibt Öffnung, Reaktion gegen Reaktion gibt +1 Gas (analog Yomis Block-Erholung), Tag-Matching macht Reaktionen spezifisch. Öffentliche Information: zuletzt gespielte Karten, bekannte Deck-Größe 20.

### 7.2 Exceed: Speed und deterministische Auflösung

- Exceed-Normals haben Range, Power, Speed; höherer Speed trifft zuerst, Trades kosten beide Leben, Advantage gibt den nächsten Zug. Boosts wie „Reading“ zwingen den Gegner, eine benannte Karte zu spielen oder die Hand zu zeigen. — [Level 99: Normals](https://www.level99store.com/blogs/exceed-fighter-reveals/normals-a-guide-to-exceeds-basic-options)

**Mapping:** Spec „Angriff gegen Angriff: niedrigeres Tempo gewinnt, Gleichstand = Scramble“ ist eine Exceed-artige, vorab einschätzbare Auflösung. „Reading“-artige Karten wären ein Kandidat für Scouting- oder Coach-Tipp-Karten [Design].

### 7.3 Marvel Snap

- Zutaten: gleichzeitiges Aufdecken und Mind Games; Snap-Verdoppeln nach dem Backgammon-Doppelwürfel; aus neun Prototyp-Varianten die einfachste gewählt. — [mobilegamer.biz Recipe](https://mobilegamer.biz/second-dinners-ben-brode-reveals-marvel-snaps-recipe-for-success-literally/)
- Retreat zeigt „Escaped!“ statt einer Niederlage; Brode: „It made losing feel like victory.“ — ebd.
- 12-Karten-Decks, ein Kartentyp, Match unter 5 Minuten; Spieler lesen höchstens etwa 8 Wörter pro Screen (Snap im Schnitt 11). — ebd.
- Kein Mulligan, weil er Neulinge überfordert; Systemprobleme lieber über Kartendesign lösen. — [mobilegamer.biz Onboarding](https://mobilegamer.biz/second-dinner-reveals-the-secrets-of-marvel-snaps-onboarding-and-card-design/)
- Man sieht die Vorrundenkarten des Gegners; Runden höchstens 35–40 s. — [Game Developer](https://www.gamedeveloper.com/game-platforms/designers-don-t-sleep-on-marvel-snap-s-simultaneous-turns)
- Erste Prototypen auf Visitenkarten erzwangen kurze Texte; VFX sollen „guide the player in what the card does“. — [Game Developer Prototyping](https://www.gamedeveloper.com/design/why-second-dinner-first-prototyped-marvel-snap-using-physical-cards)

**Mapping:** Tap-Moment als „ehrenvoller Ausstieg“ mit Ehren-XP; Kartentexte kurz (Richtwert 8–11 Wörter); Grundtechniken pro Position als immer verfügbare Option lösen das „keine spielbare Karte“-Problem über Design statt Mulligan.

### 7.4 Comeback-Regeln

- Explizites Rubber-Banding verhindert „lame duck“-Phasen, erzeugt aber billige Upsets; Effekte schwach oder temporär halten. Fighting Games vermeiden Slippery Slopes, weil niedrige Lebenspunkte die Fähigkeit, Austausche zu gewinnen, nicht verringern. — [critpoints: Comeback Mechanics](https://critpoints.net/2017/04/01/comeback-mechanics-2/)
- Yomi: defensive Karten bauen die Hand wieder auf. — [Sirlin](https://www.sirlin.net/articles/designing-yomi)

**Mapping:** Gas-Regeneration (+1/Zug), Reaktion-gegen-Reaktion +1 Gas und Rückfall auf neutral nach Escape wirken als milde Erholung. Prüfen: Die Spec-Regel „Gas ≤ 2 macht Angriffe langsamer“ ist eine kleine Slippery Slope und sollte im Playtest beobachtet werden [Design].

### 7.5 Ethische Progression

- Marvel Snap: Freischaltpfad als Lehrpfad für Synergien funktionierte; extrem langsame Progression und teure Bundles kosteten Vertrauen. — [mobilegamer.biz Onboarding](https://mobilegamer.biz/second-dinner-reveals-the-secrets-of-marvel-snaps-onboarding-and-card-design/), [PC Gamer](https://www.pcgamer.com/the-state-of-marvel-snap-in-2023-super-quick-card-battles-super-slow-progression), [Dot Esports](https://dotesports.com/marvel/news/breaking-big-changes-coming-to-how-marvel-snap-cards-are-acquired)
- Belgien verbietet Lootboxen seit 2018, Durchsetzung lückenhaft. — [MCV/Develop](https://www.mcvuk.com/business-news/belgium-isnt-enforcing-loot-box-ban-claims-research-study/), [Xiao (ITU)](https://pure.itu.dk/en/publications/breaking-ban-belgiums-ineffective-gambling-law-regulation-of-vide/)
- Duolingo: zwei Streak-Freezes schlagen einen, „Earn back“ hält Nutzer; ein Energiesystem, das auch bei richtigen Antworten abfließt, löste Proteste aus. — [recall.it](https://www.recall.it/summary/lennys-podcast/behind-the-product-duolingo-streaks-or-jackson-shuttleworth-group-pm-retention-team), [Android Authority](https://www.androidauthority.com/quitting-duolingo-energy-system-3599842/)

**Mapping:** Deterministische Belohnungen, keine Lootboxen, keine Käufe, Meisterschaft nur kosmetisch (Foil-Stufen), Gas nur als Kampflogik im Match, nie als Zugangssperre zum Lernen (Spec 4).

### 7.6 Game-Feel-Werte

| Element | Wert | Quelle | Status |
|---|---|---|---|
| Hitstop | 0,08 s (~5 Frames), Time-Scale 0,05; Flash 0,15 s; Shake-Abklingen ~0,23 s; alle im selben Frame starten | [uhiyama-lab](https://uhiyama-lab.com/en/notes/godot/hit-feedback-hitstop/) | belegt |
| Hitstop SF2 | etwa 10 Frames (~167 ms); verlängert auch das Cancel-Fenster | [critpoints Hitstop](https://critpoints.net/2017/05/17/hitstophitfreezehitlaghitpausehitshit/) | belegt |
| Juice-Grundlagen | Easing, Squash/Stretch, Shake, Partikel, Sound; harte Materialien nicht wabbeln lassen | [GDC Vault](https://gdcvault.com/play/1016487/Juice-It-or-Lose-It), [RPG Playground](https://rpgplayground.com/research-making-a-juicy-game/) | belegt (Zusammenfassung) |
| Hover | `translateY(-12px) scale(1.05)`, 0,15 s ease-out | [Blake Crosley (Balatro)](https://blakecrosley.com/guides/design/balatro) | Rekonstruktion, nicht offiziell |
| Overshoot-Easing | `cubic-bezier(0.34, 1.56, 0.64, 1)`, 0,4 s, 50 ms Versatz je Ziffer | ebd. | Rekonstruktion |
| Shake skaliert | klein 0,2 s ±1–2 px; mittel 0,3 s ±3–4 px; groß 0,5 s ±6–8 px plus ±1° | ebd. | Rekonstruktion |
| Ton | ansteigende Tonhöhe pro Kettenglied | ebd. | Rekonstruktion |
| UI-Dauern | Mobile ~300 ms, Eintreten 225 ms, Austreten 195 ms; ab ~400 ms zu langsam; Standard-Easing `cubic-bezier(0.4,0,0.2,1)` | [Material Design v1](https://m1.material.io/motion/duration-easing.html) | belegt (veraltete Richtlinie) |

**Mapping (Spec 5):** Hover −12 px bei scale 1.05 in 150 ms; Karten fliegen 250 ms, Flip 350 ms, Hitstop 80 ms (Submission bis ~160 ms [Design]), Shake je Ereignis, vertikal beim Takedown. Submission nicht schütteln, sondern Druck aufbauen (Vignette) [Design, gestützt auf „Don't Juice It“]. Tilt und Shake unter `prefers-reduced-motion` abschalten [ungeprüft als Quelle, allgemeine Praxis].

### 7.7 Holo-Technik in CSS

Vorlage: [simeydotme/pokemon-cards-css](https://github.com/simeydotme/pokemon-cards-css), Analyse auf [DeepWiki](https://deepwiki.com/simeydotme/pokemon-cards-css/4.1-standard-holo-cards).

- Custom Properties `--pointer-x/--pointer-y`, normalisiert als `--pointer-from-left/-top/-center`, dazu `--background-x/-y` und `--card-opacity`.
- Übergroße Hintergründe (z. B. `400% 400%`), per `calc()` verschoben; unterschiedliche Faktoren auf `:before`/`:after` erzeugen Parallaxe.
- Schichten: Regenbogen-Repeating-Gradient (110°) mit `mix-blend-mode: color-dodge` und Filter für Helligkeit/Kontrast/Sättigung; Scanlines; Glare als `radial-gradient` am Zeiger mit `overlay` oder `soft-light`; Clip-Paths begrenzen den Effekt.
- Spring-Parameter des Repos wurden nicht verifiziert.

**Mapping:** Common flach, ab Rare Foil, legendäre Karten Holo; Tilt und Glare nach Zeigerposition (Spec 5).

### 7.8 Onboarding-Muster

- Hearthstone: drei geskriptete Bossmissionen, je neue Mechanik, nicht verlierbar, feste Reihenfolge, kein Mulligan; Bossdecks klein, Start-LP steigen (10, 20, 30); jede Belohnung bereitet den nächsten Gegner vor. — [Hearthstone Wiki](https://hearthstone.wiki.gg/wiki/Tutorial)
- Brode räumt Schwächen nach dem Tutorial ein; eigene Matchmaking-Pools für Neulinge hoben deren Gewinnrate um etwa 15 %. — [TouchArcade](https://toucharcade.com/2017/01/05/ben-brode-talks-hearthstone-new-player-experience)

**Mapping:** Spec-Tutorial mit drei geführten Weiß-Kämpfen: (1) Dreieck und Takedown, (2) Reaktion und Tags (Sprawl), (3) Kontrolle und Submission. Danach Starterdeck, deterministische Freischaltungen, die den nächsten Archetyp kontern (z. B. Sprawl gegen den Ringer). KI-Intent-Andeutungen („Gegner fixiert dein Bein“) senken Frust und werden mit steigendem Gürtel seltener (`telegraph`) [Design; Intent-Quelle zu Slay the Spire ungeprüft].

---

## 8. Offene Prüfpunkte

Alles hier muss ein Trainer (BJJ, Judo, Ringen) oder die Primärquelle bestätigen, bevor es ohne `check`-Feld in Karten erscheint.

**Regeln und Punkte**
1. Offizielle IBJJF-Liste verbotener Techniken („Golpes Proibidos“), inklusive Single-Leg-Einschränkung und „jumping guard“-Formulierung.
2. IBJJF-Punkte, 3-Sekunden-Regel und Kettenregel am aktuellen Regelwerk; „Sweep direkt in Mount = 6“; Änderungen 2025/26.
3. Straight Ankle Lock für alle Gurte erlaubt (nur Sekundärquelle).
4. Kinderregeln (Guillotine/Würgen) und Wrestling-/Judo-Wettkampfregeln (Slams, Beingreifen) nicht recherchiert.

**Danaher und Prinzipien**
5. New-Yorker-Profil (Autor, Datum, Wortlaut) und die Instagram-Originalposts.
6. Danahers eigene Positionsrangliste; Inhalt von „The 2 Elements of Pinning“.
7. Reihenfolge Side Control vs. Knee on Belly in der Hierarchie (JitsuIQ vs. Gracie Barra).

**Aktion–Reaktion**
8. Jab → Level Change → Double Leg und dessen Konter.
9. Guillotine als Konter auf einen Shot mit gesenktem Kopf (Bedingung nur indirekt belegt).
10. Hüftblock gegen O-Goshi/Seoi-Nage; alle Wurf-Konter und Folgepositionen der Würfe.
11. Ankle Pick ↔ „Step back“; Double ↔ Single als echtes Dilemma.
12. Konter gegen Double Underhooks; Body Lock ↔ Whizzer.
13. Upa-Konter des Top-Spielers und Wechsel zum Elbow-Knee Escape.
14. Guard-Passing-Ketten jenseits von Knee Slice; Posture Break in der Closed Guard.
15. Back Escape: auf welche Seite drehen.
16. Front Headlock unten: Verteidigung (Kopf hoch, Hüfte unter Körper).
17. Käfig-/Wandarbeit, Kick-Catch-Konter, Ground-and-Pound.
18. Underhooks, Pummeling und Hand Fighting im Grappling (D3 komplett [FW]); Inside Tie, Frames gegen Clinch-Eingang.

**Technikdetails**
19. Alle [FW]-Felder zu Orthodox/Southpaw-Details, Step-Drag, Pivot, Ukemi-Ausführung.
20. Ko-Uchi-Gari: Fußrichtung bei AKBAN widerspricht dem üblichen Lehrbild.
21. North-South: Schlüsselpunkte, Fehler, Konter; Turtle-Escapes; Elevator- und Double-Ankle-Sweep.
22. Sicherheitsinferenzen: Stack Pass (Halswirbelsäule), Knee on Belly (Rippen), Guillotine (Kurbeleffekt), Snap Down (Nacken), Whizzer (Schulter), Sprawl (Landung).
23. Schwierigkeitsgrade 1–3 und deutsche Begriffe (Design-Ableitung).
24. „O-Soto-Gari als Hauptrisiko für Kopfverletzungen“: nicht belegt, nicht verwenden; ggf. Volltext PubMed 22128268.

**Didaktik und Mechanik**
25. Effektstärken Sailer & Homner (g ≈ .49/.36/.25) und Adesope et al. (g ≈ 0,61) aus den Original-PDFs.
26. FSRS-Wunsch-Retention 90 % als Default.
27. Slay-the-Spire-Intent als Tutorial-Mittel (Quelle fehlt).
28. Balatro-Werte sind Rekonstruktionen; Spring-Parameter von pokemon-cards-css nicht verifiziert.
29. Wirkung der App selbst: keine Studie, dass Lern-Apps BJJ-Leistung verbessern; digitale CLA ungetestet. Eigene Messung (Positionserkennung auf der Matte) einplanen.
30. Hat Duolingo das Energiesystem nach dem Protest geändert?

---

## 9. Quellenverzeichnis

**Danaher, Gracie, Phasenmodelle**
- https://wartribegear.com/blogs/jiu-jitsu-mindset/john-danahers-philosophy-on-approaching-submission
- https://www.bjjee.com/articles/newyorker-profiles-danaher-death-squad/
- http://www.newyorker.com/culture/persons-of-interest/the-jujitsu-master-turning-an-ancient-art-into-a-modern-science (nicht abgerufen)
- https://sensobjj.com/blogs/graciemag-1/bjj-advice-don-t-focus-just-on-pinning-people-but-on-actually-submitting-them
- https://www.bjjee.com/articles/dilemmas-the-secret-to-success-in-jiu-jitsu/
- https://www.bjjee.com/articles/danaher-outlines-4-mechanical-principles-need-understand-vastly-improve-bjj/
- https://www.bjjee.com/articles/john-danaher-the-pathway-to-attack-is-through-confidence-in-your-defense/
- https://sensobjj.com/blogs/graciemag-1/john-danaher-shares-philosophy-behind-new-wave-positional-escapes
- https://bjjfanatics.com/pages/back-attacks-enter-the-system-by-john-danaher-product
- https://www.bjjee.com/bjj-news/danaher-presents-leglock-system-detailed-diagram/
- https://bjjfanatics.com/pages/go-further-faster-by-john-danaher
- https://bjjfanatics.com/blogs/news/feet-to-floor-bridging-the-takedown-gap-in-bjj-with-john-danaher
- https://bjjcoach.substack.com/p/foundations-of-wrestling-and-takedowns
- https://bjjdoc.com/?p=20322 (unzuverlässige Zitatsammlung)
- https://us.humankinetics.com/blogs/excerpt/understand-the-three-phases-of-combat
- https://www.gracieuniversity.com/Pages/Public/Lesson.aspx?sh=232
- https://www.gracieuniversity.com/UploadsFiles/Documents/UploadsConvert/lc59_it2620_e8ecae35_GC.pdf
- https://www.grapplearts.com/grappling-range-of-fighting/
- https://www.grapplearts.com/the-mma-formula-striking-takedowns-groundwork/
- https://www.grapplearts.com/a-roadmap-for-grappling/
- https://www.grapplearts.com/wp-content/uploads/2018/03/Roadmap-for-BJJ-1.5-1.pdf
- https://evolve-mma.com/blog/the-art-of-closing-distance-tips-for-grapplers-facing-strikers/
- https://graciebarra.com/2015/03/the-positional-hierarchy
- https://jitsuiq.com/concepts/positional-hierarchy.html

**Regeln, Punkte, Sicherheit, Verletzungen**
- https://www.flograppling.com/articles/13493486-how-does-the-2025-ibjjf-point-system-work
- https://www.flograppling.com/articles/11794759-ibjjf-updates-rules-around-5050-lapel-foot-locks-more
- https://gymdesk.com/blog/jiu-jitsu-point-system
- https://bjjfanatics.com/blogs/news/illegal-moves-in-bjj
- https://bjjfanatics.com/blogs/news/are-neck-cranks-legal-in-bjj
- https://jiujitsu-news.com/ibjjf-illegal-and-legal-submissions
- https://Www.Ibjjf.com/rails/active_storage/blobs/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBcE1WIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--e13c15f6e568323ecea8ef21a102b726067a4540/20240101_GolpesProibidos_EN.pdf (nicht abgerufen)
- https://ibjjf.com/books-videos
- https://ibjjf.com/graduation-system
- https://bjjmore.com/bjj-belt-requirements-and-curriculum/
- https://cursa.app/en/page/bjj-starter-guide-safety-tapping-and-positional-priorities
- https://graciebarra.com/gb-news/etiquettes-beginners
- https://pmc.ncbi.nlm.nih.gov/articles/PMC8721390
- https://www.scielo.br/j/rbort/a/RDCRjTpRtPrKbZP4G4L3fWN/abstract/?lang=en
- https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11193589/
- https://blogs.uoregon.edu/articles/2025/10/30/brazilian-jiu-jitsu-study-reports-30-of-athletes-experienced-knee-injury-in-past-year
- https://pubmed.ncbi.nlm.nih.gov/22128268/

**Techniken: Stand, Clinch, Takedowns, Würfe**
- https://evolve-university.com/blog/orthodox-vs-southpaw-what-you-need-to-know/
- https://www.lowkickmma.com/mma-stances-an-explainer-and-finding-whats-best/
- https://www.grapplearts.com/whats-right-stance-mma/
- https://content.usawmembership.com/articles/2175
- https://content.usawmembership.com/articles/2131
- https://content.usawmembership.com/articles/3711
- https://evolve-mma.com/blog/everything-you-need-to-know-about-the-double-leg-takedown/
- https://evolve-mma.com/blog/mastering-the-penetration-step-for-better-takedowns-in-mma-and-bjj/
- https://evolve-mma.com/blog/the-3-best-bjj-takedowns-for-beginners/
- https://evolve-mma.com/blog/10-wrestling-moves-and-techniques-you-should-master/
- https://evolve-mma.com/blog/how-to-use-the-body-lock-takedown-in-bjj-and-wrestling/
- https://evolve-mma.com/blog/understanding-underhooks-and-overhooks-in-mma/
- https://evolve-mma.com/blog/5-areas-to-improve-in-your-mma-clinch-game/
- https://evolve-mma.com/blog/what-is-pummeling-and-how-to-do-it-correctly-for-mma-training/ (nicht im Volltext)
- https://evolve-mma.com/blog/3-ways-to-use-the-front-headlock-in-bjj/
- https://www.keepkidswrestling.com/_files/ugd/7ebc08_98c5824d637040fa9c7202f7fa8d4a65.pdf
- https://www.keepkidswrestling.com/post/the-ankle-pick-a-beginner-friendly-guide
- https://www.keepkidswrestling.com/post/mastering-the-sprawl-in-neutral-position
- https://fanaticwrestling.com/blogs/news/learn-the-2-on-1-tie-to-arm-drag-from-nick-heflin
- https://fanaticwrestling.com/blogs/news/the-science-of-stopping-the-double-leg-with-kyle-dake
- https://www.blackbeltmag.com/evaluating-the-4-major-clinches
- https://dynamicstriking.com/blogs/news/catching-kicks-to-set-up-a-takedown-with-henry-cejudo
- https://en.wikibooks.org/wiki/Folkstyle_Wrestling/Advanced_Offensive_Moves_From_Neutral
- https://lowkickmma.com/wrestling-whizzer
- https://jitsuiq.com/movement-mechanics/sprawl.html
- https://jitsuiq.com/movement-mechanics/snap-down.html
- https://jitsuiq.com/takedowns/body-lock-takedown.html
- https://jitsuiq.com/takedowns/snap-down-to-front-headlock.html
- https://jitsuiq.com/takedowns/ankle-pick.html
- https://www.akban.org/wiki/Counter_to_double_leg_takedown
- https://www.akban.org/wiki/Kouchi_gari_-_Small_inner_reap
- https://judoinfo.com/?p=259
- https://judoinfo.com/?p=42
- https://judoinfo.com/?p=41
- https://judoinfo.com/?p=180
- https://en.wikipedia.org/wiki/Kuzushi
- https://en.wikipedia.org/wiki/Tai_otoshi
- https://en.wikipedia.org/wiki/Kouchi_gari
- https://fightingarts.com/happo-no-kuzushi-destroying-your-opponents-balance/
- https://www.elitesports.com/blogs/news/basic-judo-throws
- https://thedifficultway.blogspot.com/2011/05/tai-otoshi.html
- https://students.washington.edu/judouw/dojo/gokyu.html
- https://judobund.de/fileadmin/user_upload/judobund.de/Downloads/Downloadcenter/Kyu-Graduierungen/Anforderungen_fuer_Kyu-Grade_2024.pdf

**Techniken: Boden, Escapes, Submissions**
- https://evolve-mma.com/blog/the-complete-brazilian-jiu-jitsu-beginners-guide/
- https://evolve-mma.com/blog/the-first-3-sweeps-you-should-master-in-bjj/
- https://evolve-mma.com/blog/how-to-escape-the-rear-naked-choke/
- https://evolve-university.com/blog/basic-bjj-combinations-triangle-choke-omoplata-and-armbar/
- https://jitsuiq.com/sweeps/hip-bump-sweep.html
- https://www.grapplearts.com/hip-bump-sweep-from-closed-guard
- https://www.grapplearts.com/the-4-most-common-errors-for-the-upa-mount-escape/
- https://bjj-atlas.pages.dev/escapes
- https://bjj-atlas.pages.dev/escapes/side-control-escapes
- https://bjj-atlas.pages.dev/escapes/mount-escapes
- https://bjj-atlas.pages.dev/escapes/back-escapes
- https://bjj-atlas.pages.dev/guard-passing/knee-cut
- https://bjj-atlas.pages.dev/guard-passing/toreando
- https://bjj-atlas.pages.dev/guard-passing/stack-pass
- https://bjj-atlas.pages.dev/sweeps
- https://bjj-atlas.pages.dev/sweeps/butterfly-sweep
- https://bjj-atlas.pages.dev/turtle/turtle-attacks
- https://bjj-atlas.pages.dev/submissions/rear-naked-choke
- https://bjj-atlas.pages.dev/submissions/armbar
- https://bjj-atlas.pages.dev/submissions/kimura
- https://bjj-atlas.pages.dev/submissions/americana
- https://bjj-atlas.pages.dev/submissions/triangle
- https://bjj-atlas.pages.dev/submissions/guillotine
- https://bjj-atlas.pages.dev/submissions/cross-collar-choke
- https://graciebarra.com/gb-news/gb-technique-troubleshooting-the-knee-slice-pass

**Didaktik**
- https://www.psychologicalscience.org/news/releases/which-study-strategies-make-the-grade.html
- https://www.citedrive.com/en/discovery/improving-students-learning-with-effective-learning-techniques
- https://profiles.wustl.edu/en/publications/test-enhanced-learning-taking-memory-tests-improves-long-term-ret/
- https://psychology.ecu.edu/wp-content/pv-uploads/sites/216/2019/03/Roediger-Karpicke-2006.pdf
- https://rex.libraries.wsu.edu/esploro/outputs/journalArticle/Rethinking-the-Use-of-Tests-A/99900601154801842
- https://pubmed.ncbi.nlm.nih.gov/19076480/
- https://expertium.github.io/Benchmark.html
- https://github.com/open-spaced-repetition/fsrs4anki/wiki/ABC-of-FSRS
- https://e-space.mmu.ac.uk/84598
- https://pure.ul.ie/en/publications/does-mental-practice-still-enhance-performance-a-24-year-follow-u/
- https://lida.sport-iat.de/ta/Record/4075347?lng=en
- https://lida.sport-iat.de/dbv/Record/4015898
- https://www.mdpi.com/2076-328x/14/10/919
- https://iris.univr.it/handle/11562/1195070
- https://doaj.org/article/29969cbccca646d3a8e8bb9fac71494a
- https://acoatofredpaintinhell.substack.com/p/how-to-design-an-ecological-dynamics
- https://www.sonnybrown.net/5y8l
- https://letsroll.co/seminars/ecological-dynamics-constraints-led-approach-to-bjj-defens-2026-10
- https://www.judoscotland.com/event/ecological-dynamics-and-the-constraints-led-approach-for-judo-coaches/
- https://www.buzzsprout.com/2120258/episodes/16478972-57-kyvann-gonzalez-ecological-dynamics-for-bjj-explained-without-scientific-jargon
- https://shura.shu.ac.uk/22691
- https://pubmed.ncbi.nlm.nih.gov/31556629/
- https://www.gwern.net/docs/spaced-repetition/2004-brady.pdf
- https://my.chartered.college/impact_article/expertise-reversal-effect-and-its-instructional-implications/
- https://www.chicagobooth.edu/media-relations-and-communications/press-releases/easier-seen-than-done-watching-how-to-videos-on-youtube-gives-people-false-sense-of-expertise
- https://gwern.net/doc/psychology/cognitive-bias/illusion-of-depth/2018-kardas.pdf

**Gamification, Markt, KI**
- https://gamification-research.org/2019/08/does-gamification-of-learning-work/
- https://opus.bibliothek.uni-augsburg.de/opus4/frontdoor/index/index/docId/109056
- https://ersearch2.cvtisr.sk/vufind/SummonRecord/FETCH-LOGICAL-c408t-d82df39d2133f93d47d3d98f9c9aadee3039f9f89021367e6820fad79509cf9e3/Details?lng=en
- https://www.recall.it/summary/lennys-podcast/behind-the-product-duolingo-streaks-or-jackson-shuttleworth-group-pm-retention-team
- https://www.androidauthority.com/quitting-duolingo-energy-system-3599842/
- https://www.change.org/p/duolingo-hearts-not-energy
- https://nuclearmonster.com/2025/05/duolingo-switches-from-hearts-to-energy-adds-chess
- https://gamesbeat.com/ben-brode-bets-super-speed-will-make-marvel-snap-stand-out/
- https://gamedeveloper.com/game-platforms/road-to-the-igf-mega-crit-games-i-slay-the-spire-i-
- https://www.pcgamer.com/games/roguelike/slay-the-spire-2-dev-says-an-early-idea-was-to-actually-reduce-the-card-pool-but-players-hated-it-we-need-new-stuff/
- https://bjjgraph.org/
- https://knowledge.wharton.upenn.edu/article/without-guardrails-generative-ai-can-harm-education
- https://ideas.repec.org/a/nas/journl/v122y2025pe2422633122.html
- https://arxiv.org/abs/2603.17373
- https://apps.apple.com/us/app/smartbjj/id6760728034
- https://apps.apple.com/sr/app/id6763345915
- https://apps.apple.com/app/id864289023
- https://www.bjjee.com/articles/submission-card-game-shows-how-bjj-culture-keeps-growing-beyond-the-mat/
- https://www.analog.games//gameItem/show/419cd83f9654fe4b019655b0d12c57da?lang=EN
- https://tabletopia.com/games/king-of-the-roll
- https://thegamecrafter.com/games/uncaged:-training-gym-deck-building-essentials-
- https://skich.app/games/grappleapp-the-jiu-jitsu-gam

**Spielmechanik und Game Feel**
- https://www.sirlin.net/articles/designing-yomi
- https://www.sirlin.net/ptw-book/7-spies-of-the-mind
- https://geekdad.com/2014/07/yomi/
- https://tvtropes.org/pmwiki/pmwiki.php/TabletopGame/Yomi
- https://www.level99store.com/blogs/exceed-fighter-reveals/normals-a-guide-to-exceeds-basic-options
- https://cdn.shopify.com/s/files/1/0277/6724/2855/files/BattleCON-Web-Rulebook-v4.pdf
- https://c.tabletopia.com/games/exceed-red-horizon/rules/exceedseason4rulebook/en
- https://mobilegamer.biz/second-dinners-ben-brode-reveals-marvel-snaps-recipe-for-success-literally/
- https://mobilegamer.biz/second-dinner-reveals-the-secrets-of-marvel-snaps-onboarding-and-card-design/
- https://www.gamedeveloper.com/game-platforms/designers-don-t-sleep-on-marvel-snap-s-simultaneous-turns
- https://www.gamedeveloper.com/design/why-second-dinner-first-prototyped-marvel-snap-using-physical-cards
- https://www.pcgamer.com/the-state-of-marvel-snap-in-2023-super-quick-card-battles-super-slow-progression
- https://dotesports.com/marvel/news/breaking-big-changes-coming-to-how-marvel-snap-cards-are-acquired
- https://toucharcade.com/2017/01/05/ben-brode-talks-hearthstone-new-player-experience
- https://hearthstone.wiki.gg/wiki/Tutorial
- https://www.mcvuk.com/business-news/belgium-isnt-enforcing-loot-box-ban-claims-research-study/
- https://pure.itu.dk/en/publications/breaking-ban-belgiums-ineffective-gambling-law-regulation-of-vide/
- https://critpoints.net/2017/05/17/hitstophitfreezehitlaghitpausehitshit/
- https://critpoints.net/2017/04/01/comeback-mechanics-2/
- https://gdcvault.com/play/1016487/Juice-It-or-Lose-It
- https://rpgplayground.com/research-making-a-juicy-game/
- https://uhiyama-lab.com/en/notes/godot/hit-feedback-hitstop/
- https://blakecrosley.com/guides/design/balatro
- https://github.com/simeydotme/pokemon-cards-css
- https://deepwiki.com/simeydotme/pokemon-cards-css/4.1-standard-holo-cards
- https://www.npmjs.com/package/vue-pokemon-cards-css
- https://m1.material.io/motion/duration-easing.html
- https://blog.playtestcloud.com/first-time-user-experience-can-make-or-break-your-game/
