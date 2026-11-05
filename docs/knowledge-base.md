# Mattenkarten – Wissensbasis

Stand: 2026-11-05 · Status: zentrale Referenz für Karten- und Regeldesign · Grundlage: Recherchenotizen „Kampfkette und Spielmechanik“ (3 Dateien), „Kampfsport Lernkartenspiel Grundlagen“ (4 Dateien), Bericht „Kampfsport Lernkartenspiel Grundlagen“, „Neulinge und Lernen pro Runde“ (2 Dateien) und die Design-Spec `docs/superpowers/specs/2026-11-05-mattenkarten-battle-design.md`.

---

## 1. Zweck und Pflegeregeln

Dieses Dokument ist die **einzige verbindliche Wissensquelle** für Mattenkarten. Jede Karte (Beschreibung, Schlüsselpunkte, Fehler, Sicherheit, Konter) und jede Regel, die sich auf echtes Grappling beruft, muss sich auf einen Eintrag hier zurückführen lassen. Die Spec verweist ausdrücklich auf diese Datei als Inhaltsquelle für die rund 45 Karten.

### 1.1 Markierungen

| Marker | Bedeutung | Darf in eine Karte? |
|---|---|---|
| **belegt** | Aussage steht in einer abgerufenen Quelle (Link in der Zeile oder im Abschnitt) | ja |
| **[Sekundär]** | nur über Blog/Medienbericht belegt, Originalquelle (z. B. Instagram-Post, Video, Regelwerk-PDF) nicht selbst geprüft | ja, mit Feld `check` |
| **[ungeprüft]** | in der Recherche genannt, aber ohne abgerufene Quelle (z. B. erinnerte Zahlen) | nur mit Feld `check` und Eintrag in Abschnitt 9 |
| **[FW]** | Fachwissen/Trainerwissen, nicht gegen eine Quelle geprüft | nur mit Feld `check`; vor Release Trainer-Review |
| **[Design]** | eigene Ableitung für das Spiel, keine Tatsachenbehauptung über Kampfsport | ja, aber nie als Fakt formulieren |

### 1.2 Regeln für Änderungen

1. **Recherche vor Inhalt.** Bevor eine Technik, ein Konter oder eine Sicherheitsangabe neu aufgenommen oder geändert wird, wird sie recherchiert und mit URL belegt. Ohne Beleg erhält sie den Marker [ungeprüft] oder [FW] und einen Eintrag in Abschnitt 9.
2. **Jede Aussage hat eine Quelle.** Quellen stehen in der Tabellenzeile oder direkt hinter dem Absatz; alle URLs zusätzlich in Abschnitt 10.
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

Abweichung: Gracie Barra stellt Knee on Belly **über** Side Control und nennt Turtle und Half Mount gesondert. — [Gracie Barra](https://graciebarra.com/2015/03/the-positional-hierarchy). Für das Spiel ist die Reihenfolge Side/KOB gleichwertig zu behandeln, bis ein Trainer entscheidet (Abschnitt 9).

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

### 4.7 Content-Paket 2 (Erweiterungskarten, Stand 2026-11-05)

Karten in `src/data/expansion.ts`. Nur bestehende Positionen und Tags. Spalten wie oben, zusätzlich die Karten-ID.

| Karte (ID) | Aktion | typische Reaktion | Re-Attack/Folge | Quelle | Status |
|---|---|---|---|---|---|
| `jab_cross` | Jab-Cross (1-2): Jab öffnet die Deckung, Cross mit der hinteren Hand durch die Mitte | Slip/Parry | Einzelschläge sind „too predictable“, darum Kombination | [Evolve MMA Combinations](https://evolve-mma.com/blog/the-5-basic-yet-effective-combinations-all-boxers-need-to-know/) | belegt |
| `feint_shot` | Shot-Finte: Level Change oder Schritt vor, ohne zu schießen | Gegner senkt die Hände, macht den Stand breit oder weicht zurück | Schlag oder echter Takedown; Jab-Cross → Finte | [Evolve MMA Takedown Feints](https://evolve-mma.com/blog/the-art-of-takedown-feints-in-mma/), [Evolve University Level Changes](https://evolve-university.com/blog/how-to-use-level-changes-to-set-up-strikes-and-takedowns/) | belegt (schließt Prüfpunkt 8 teilweise: Jab-Cross → Duck → Shot belegt) |
| `slip_parry` | Parry (Hand lenkt den Jab ab) / Slip (Kopf neben den Schlag) | – | sofort kontern | [Evolve MMA Jab Defense](https://evolve-mma.com/blog/heres-how-to-defend-the-jab-in-muay-thai/) | belegt; dass Slip/Parry Beinangriffe nicht stoppt, ist [Design] |
| `cage_press` | Gegner an Käfig/Wand pinnen: Kopf unter sein Kinn, Underhook, Kopf und Hüfte kontrollieren | Underhook erkämpfen, Wrist Control, Whizzer, zur Seite drehen | Single, Double, Trips, High Crotch, Hüftwürfe | [Evolve MMA Cage](https://evolve-mma.com/blog/heres-how-to-use-the-cage-in-mma/), [Evolve MMA Cage Escape](https://evolve-mma.com/blog/how-to-use-the-cage-wall-to-escape-takedowns-in-mma/) | belegt (Prüfpunkt 17 teilweise geschlossen); Sicherheitshinweis „gepolsterte Wand“ [FW] |
| `double_unders` | Double Underhooks: zweiten Underhook erkämpfen | Overhook als übliche Defensivreaktion | Single/Double, Trips, Würfe; Body Lock | [Evolve MMA Underhooks](https://evolve-mma.com/blog/understanding-underhooks-and-overhooks-in-mma/) | belegt; Öffnung für Body Lock/Trip zusätzlich über [JitsuIQ Body Lock](https://jitsuiq.com/takedowns/body-lock-takedown.html) |
| `wrist_control` | Handgelenk kontrollieren | verhindert, dass er die Hände für den Takedown verschließt | Underhook auf der anderen Seite | [Evolve MMA Cage Escape](https://evolve-mma.com/blog/how-to-use-the-cage-wall-to-escape-takedowns-in-mma/), [Evolve MMA Clinch](https://evolve-mma.com/blog/5-areas-to-improve-in-your-mma-clinch-game/) | belegt (kontert `bodylock`) |
| `butterfly_sweep` | Butterfly Sweep: Haken innen, Gewicht nach vorn laden, zur Seite fallen und heben | Hand posten („the sweep fails the moment a hand hits the mat“), zurückweichen | X-Guard Sweep; Ende Mount oder Side Control | [BJJ Atlas Butterfly](https://bjj-atlas.pages.dev/sweeps/butterfly-sweep) | belegt (Konter im Spiel: `base_post` kontert `sweep`) |
| `knee_shield` | Knee Shield: Knie gegen Schulter/Brust, Fuß hakt den Knöchel, Frames als zweite Linie | Crossface, Switch Base; gegen Knee Cut: Backstep | Cross-Sleeve-Back-Take, Scissor Sweep | [Evolve MMA Knee Shield](https://evolve-mma.com/blog/bjj-101-knee-shield-half-guard/), [BJJ Atlas Knee Cut](https://bjj-atlas.pages.dev/guard-passing/knee-cut) | belegt (blockt Knee Cut laut BJJ Atlas); dass er auch Toreando/Stack stoppt, ist [Design] |
| `toreando` | Toreando: Beine zur einen Seite werfen, zur anderen herumlaufen | Gegner folgt und baut die Guard neu auf; halbe Erholung → Half Guard | Knee Cut, Leg Drag; Side Control oder Knee on Belly | [BJJ Atlas Toreando](https://bjj-atlas.pages.dev/guard-passing/toreando) | belegt; Dilemma Toreando ↔ Knee Slice über „If they block one path, another opens“ ([BJJ Atlas Knee Cut](https://bjj-atlas.pages.dev/guard-passing/knee-cut)) |
| `knee_on_belly` | Knee on Belly aus Side Control: Knie auf Bauch/unteres Brustbein, fernes Bein weit | Gegner framt, drückt das Knie weg, dreht sich | Armbar, Kimura/Americana, Mount, Rücken, Kragenwürger | [BJJ Atlas Knee on Belly](https://bjj-atlas.pages.dev/immobilizations/knee-on-belly) | belegt; Knie nicht auf die Rippen (Quelle) – schließt Prüfpunkt 22 für KOB teilweise. Punkte im Spiel bewusst nicht vergeben [Design] |
| `cross_collar` | Cross Collar aus dem Mount (nur Gi): erster Griff sehr tief, Daumen innen/außen, Ellbogen runter, Brust vor | Arme hochdrücken, Griffe früh bekämpfen | Armbar; Ezekiel als Alternative | [BJJ Atlas Cross Collar](https://bjj-atlas.pages.dev/submissions/cross-collar-choke) | belegt; Kragenwürger stehen nicht unter den Weißgurt-Verboten bei [BJJ Fanatics Illegal Moves](https://bjjfanatics.com/blogs/news/illegal-moves-in-bjj) (nennt dort Jumping Guard und Wrist Locks) [Sekundär] – IBJJF-Liste selbst prüfen (Prüfpunkt 1) |
| `collar_defense` | Kragengriffe abwehren: ersten Griff verhindern, zweiten blocken, zuletzt gegen die Ellbogen drücken | – | Bridge zur Seite des Angriffsarms | [Submission Shark](https://submissionshark.com/blogs/bjj-for-begginers/how-to-defend-yourself-from-cross-collar-chokes-in-jiu-jitsu-bjj), [JitsuIQ Cross Collar](https://jitsuiq.com/submissions/chokes/cross-collar-choke.html) | belegt (Händlerblog + JitsuIQ, beide schwach → Trainer-Review empfohlen) |
| `back_armbar` | Armbar vom Rücken, wenn er den Würger mit beiden Händen verteidigt und die Arme streckt | Arme eng halten | zurück zum RNC (Paar RNC ↔ Armbar, 4.6) | [BJJ Atlas RNC](https://bjj-atlas.pages.dev/submissions/rear-naked-choke), [JitsuIQ Back Control](https://jitsuiq.com/positions/back/back-control.html) | belegt; Gegenkarte `hand_defense` kontert `armlock` ebenfalls – Dilemma hebelt den `choke`-Konter aus |
| `shrimp_back_escape` | Shrimp-Escape vom Rücken: Hände hoch in Gebetshaltung, Schultern auf die Matte, Hüfte weg | Gegner folgt mit Hooks | Guard (oben oder unten); bei starken Hooks andere Escapes | [Evolve MMA Back Escapes](https://evolve-mma.com/blog/3-back-mount-escapes-you-need-to-know-in-bjj/), [BJJ Atlas Back](https://bjj-atlas.pages.dev/escapes/back-escapes) | belegt; Ergebnis im Spiel: Guard unten [Design-Vereinfachung] |

Bewusst **nicht** aufgenommen: Clinch-Knie (Evolve nennt nur Knie zum Kopf – für Neulinge ungeeignet, kein passender Tag), Kick Catch (eigener Tag fehlt), Bow-and-Arrow und Ezekiel (nur Gi, Quellen zu dünn), Leg-Lock-Escape vom Rücken (führt zu Heel-Hook-Positionen), Ghost Escape (laut BJJ Atlas nicht für Anfänger).

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
- 12-Karten-Decks, ein Kartentyp, Match unter 5 Minuten; Spieler lesen höchstens etwa 8 Wörter pro Screen (Snap im Schnitt 11). — ebd. **[ungeprüft]:** Die Nachrecherche vom 2026-11-05 fand dafür bei gezielter Suche keinen Beleg; die Zuordnung zu diesem Artikel ist am Text erneut zu prüfen. Belegt ist nur „höchstens etwa 2 Zeilen Kartentext“ (siehe 8.2, Prüfpunkt 31).
- Kein Mulligan, weil er Neulinge überfordert; Systemprobleme lieber über Kartendesign lösen. — [mobilegamer.biz Onboarding](https://mobilegamer.biz/second-dinner-reveals-the-secrets-of-marvel-snaps-onboarding-and-card-design/)
- Man sieht die Vorrundenkarten des Gegners; Runden höchstens 35–40 s. — [Game Developer](https://www.gamedeveloper.com/game-platforms/designers-don-t-sleep-on-marvel-snap-s-simultaneous-turns)
- Erste Prototypen auf Visitenkarten erzwangen kurze Texte; VFX sollen „guide the player in what the card does“. — [Game Developer Prototyping](https://www.gamedeveloper.com/design/why-second-dinner-first-prototyped-marvel-snap-using-physical-cards)

**Mapping:** Tap-Moment als „ehrenvoller Ausstieg“ mit Ehren-XP; Kartentexte kurz (höchstens 2 Zeilen belegt; Richtwert 8–11 Wörter nur als Design-Ziel); Grundtechniken pro Position als immer verfügbare Option lösen das „keine spielbare Karte“-Problem über Design statt Mulligan.

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

## 8. Neulinge & Lernen in jeder Runde

Grundlage: Recherchenotizen „Neulinge und Lernen pro Runde“ (`onboarding.md`, `lernen_pro_runde.md`, Stand 2026-11-05). Bezug ist die Rundenschleife der Spec: eine Karte wählen, beide decken auf, Auflösung („Sprawl kontert den Beinangriff“), Positionswechsel. Zielgruppe sind Menschen ohne Kampfsporterfahrung. Aufbau je Unterabschnitt: erst **Befund** mit Quelle und Marker, dann **So setzt Mattenkarten das um** (immer [Design], also Ableitung und keine Tatsachenbehauptung). Abschnitt 7.8 bleibt die Kurzfassung zum Tutorial; hier stehen Details und Lernwirkung.

### 8.1 Onboarding-Muster

**Befund**
- **Hearthstone:** Das Tutorial besteht seit dem Rework (Patch 27.6, Oktober 2023) aus drei geskripteten Bossmissionen statt sechs. In Mission 1 kosten Karten kein Mana; gelehrt werden nur Ausspielen, Angreifen, Angriff und Leben. Mana, Hero Power und Keywords (Battlecry) kommen erst in Mission 2. Mission 1 startet ohne Starthand, Mission 2 und 3 mit nur drei Karten; Münzwurf und Deckreihenfolge sind festgelegt. — [Hearthstone Wiki: Tutorial](https://hearthstone.wiki.gg/wiki/Tutorial) · belegt
- **Hearthstone-Leitplanken:** Der Zug lässt sich nicht beenden, solange Mana oder Angriffe übrig sind; eigene Figuren können nicht mit Zaubern anvisiert werden; Verlieren und Aufgeben sind nicht möglich. Mission 3 garantiert die passende Lösungskarte (Flamestrike). Das Tutorial ist seit 2022 überspringbar und seit 2023 wiederholbar; danach folgen fünf Quests und kontextuelle Hinweise auf neuen Screens. — ebd.; [Hearthstone Wiki: New player experience](https://hearthstone.wiki.gg/wiki/New_player_experience) · belegt
- **Marvel Snap, gestaffelte Mechaniken:** Das erste Match ist geskriptet und hat zunächst nur eine Location; man spielt sofort, „without explaining moves or costs“. Freischalt-Reihenfolge: eine Location, dann drei Locations mit Siegbedingung „2 von 3“, das Energiesystem erst nach dem ersten Sieg, danach Karten- und Location-Fähigkeiten, Snap-Wetten erst nach einigen Stunden. Starterkarten haben keinen Fähigkeitstext. — [Deconstructor of Fun](https://www.deconstructoroffun.com/blog/2023/5/23/marvel-snap-the-definitive-deconstruction) · belegt
- **Marvel Snap, Lehren über Karten:** Neue Mechaniken kommen über die Reihenfolge freigeschalteter Karten (erst Ongoing-Karten, dann On-Reveal-Ketten). Gegen „kein spielbarer Zug in Runde 1“ gibt es keinen Mulligan, sondern eine garantierte Karte in der Starthand (Quicksilver). — [mobilegamer.biz Onboarding](https://mobilegamer.biz/second-dinner-reveals-the-secrets-of-marvel-snaps-onboarding-and-card-design/) · belegt
- **Wahlmöglichkeiten begrenzen:** Choice Overload gilt als Daumenregel ab etwa sieben Optionen (Miller 1956, keine getestete Schwelle); Neulinge profitieren von kleinen, kategorisierten Mengen, Experten eher von großen (Chernev 2003; Mogilner et al. 2008). Iyengar und Lepper (2000): sechs statt 24 Marmeladen ergaben eine höhere Kaufrate. — [Game Developer: Spoiled for choice](https://www.gamedeveloper.com/design/spoiled-for-choice-the-psychology-of-choice-overload-in-games-and-how-to-avoid-it) · belegt (Sekundärdarstellung der Studien). NN/g empfiehlt Progressive Disclosure mit höchstens zwei Ebenen. — [NN/g Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) · belegt
- **Überspringbar, Schritt für Schritt:** Apple empfiehlt eine aktive Rolle ab dem Start, kurze Anweisungen „one step at a time“, Kompetenz vor der nächsten Stufe, kein vorausgesetztes Wissen, überspringbare Tutorials (Carcassonne: „Go ahead“/„Later“), Nicht-Essenzielles erst nach dem Onboarding sowie einen Referenzbereich mit kontextuellen Tipps. Clash Royale nutzt fünf kurze, progressive Tutorials. — [Apple Developer: Onboarding for Games](https://developer.apple.com/app-store/onboarding-for-games/) · belegt
- **Coach-Figur und gerichtete Aufgaben:** Duolingo Chess besteht zu etwa 75 % aus Puzzles mit Coach-Figur (Oscar); frühe Aufgaben sind direktiv, spätere offen; erst Regeln und Figurenbewegung, Eröffnungen später. Der Bot passt sich an Siege und Niederlagen an. — [Duolingo Blog: Chess](https://blog.duolingo.com/chess-course), [Fast Company](https://www.fastcompany.com/91317214/duolingo-will-start-teaching-chess-soon) · belegt

**So setzt Mattenkarten das um** [Design]
- **Kampf 1 zeigt nur eine Phase** der Kette (z. B. nur Distanz/Stand), ohne Gas und Kontrolle; Ressourcen erscheinen erst ab Kampf 2 bis 3 (Hearthstone ohne Mana, Snap-Energie erst nach dem ersten Sieg).
- **Dreieck erleben statt erklären:** In Kampf 1 kündigt der Gegner seinen Zug an, der Spieler hat genau eine passende Konterkarte. Das ergibt den ersten Aha-Moment ohne Regeltext.
- **Optionen begrenzen:** 2–3 wählbare Karten in Kampf 1, 3–4 in frühen Kämpfen, höchstens etwa 5 später. Unspielbare Karten werden ausgegraut oder in frühen Phasen gar nicht gezogen; eine spielbare Karte ist garantiert (Quicksilver-Prinzip; die immer verfügbare Grundtechnik der Spec erfüllt das bereits). **Widerspruch zur Spec:** Die Spec zieht immer auf 5 Handkarten; für die Tutorial-Kämpfe ist eine kleinere Hand zu prüfen (Abschnitt 9).
- **Leitplanken:** Die ersten 1–3 Kämpfe sind nicht verlierbar, unsinnige Züge sind gesperrt statt erklärt; danach passt sich die KI-Stärke an (Duolingo-Prinzip).
- **Neue Technik = neue Karte:** Techniken kommen über die Freischalt-Reihenfolge ins Spiel, jede neue Karte trägt genau eine neue Idee (Reihenfolge siehe 8.10).
- **Überspringen und Nachschlagen:** Das Tutorial ist überspringbar (mit kurzem Einstufungstest für Spieler mit Vorwissen, siehe 8.3) und wiederholbar. Ein Lexikon dient als Nachschlagewerk, nie als Pflichtlektüre.
- **Coach Marks:** Pro Hinweisblase genau eine Aussage, etwa eine Zeile, direkt am betroffenen Element (Karte, Kettenleiste, Gas-Anzeige). Hinweise erscheinen erst, wenn das Element zum ersten Mal relevant wird.

### 8.2 Klartext und Icons

**Befund**
- Icons sind ohne Kontext mehrdeutig; ein Text-Label muss „present alongside an icon“ sein und dauerhaft sichtbar bleiben, weil Hover auf Touch-Geräten nicht funktioniert. Nur wenige Icons sind universell verständlich. Faustregel: Fällt einem in etwa fünf Sekunden kein passendes Icon ein, kommuniziert es vermutlich nicht. Erkennung und Erinnerung (nach etwa zwei Wochen) mit Nutzern testen. — [NN/g Icon Usability](https://www.nngroup.com/articles/icon-usability/) · belegt
- Marvel Snap begrenzt Kartentext möglichst auf zwei Zeilen, mit den strengsten Limits für Neulingskarten; Fähigkeiten stehen in „short, snappy sentences“ mit klarer Wenn-dann-Logik. — [Marvel Snap Zone (Entwicklerantwort)](https://marvelsnapzone.com/answers/text-per-card/), [Game Developer Prototyping](https://www.gamedeveloper.com/design/why-second-dinner-first-prototyped-marvel-snap-using-physical-cards) · belegt
- **„8 Wörter pro Screen“ [ungeprüft]:** Eine gezielte Suche fand für diese Marvel-Snap-Regel keinen Beleg; belegt ist nur die Zwei-Zeilen-Grenze. Die Angabe in 7.3 ist deshalb ebenfalls als [ungeprüft] markiert und darf nur als Design-Ziel verwendet werden (Abschnitt 9).
- Hearthstone führt Keywords erst in Mission 2 ein, also nachdem die Grundhandlung sitzt; Duolingo Chess lehrt erst Regeln, dann Fachwissen. — [Hearthstone Wiki](https://hearthstone.wiki.gg/wiki/Tutorial), [Duolingo Blog](https://blog.duolingo.com/chess-course) · belegt
- Glossare und Erklärnotizen helfen Novizen, werden für Fortgeschrittene aber redundant (Expertise Reversal). — [Kalyuga 2007 (PDF)](https://www.uky.edu/~gmswan3/EDC608/Kalyuga2007_Article_ExpertiseReversalEffectAndItsI.pdf) · belegt
- Ein Doppel-Label (Alltagssprache groß, Fachbegriff klein) ist eine begründete Ableitung, aber in keinem untersuchten Spiel als evaluierte Praxis belegt. · [ungeprüft]

**So setzt Mattenkarten das um** [Design]
- **Icons nie allein:** Jedes Icon steht mit sichtbarem Wort daneben, auch auf dem Handy, z. B. Lunge plus „Puste“ für Gas, Hand plus „Kontrolle“ für Kontrolle. Abstrakte Ressourcen fehlen in Kampf 1 ganz.
- **Doppel-Label:** Titel in Alltagssprache („Quer auf ihm liegen“), Fachbegriff klein darunter („Side Control“). Nach mehreren erfolgreichen Begegnungen dreht sich die Gewichtung um: Fachbegriff groß, Erklärung klein (passt zum Ausblenden nach Expertise).
- **Rollen als Verben:** Setup, Reaktion und Angriff erscheinen als Wirkung („Täuschen“, „Kontern“, „Zugreifen“), dazu ein dauerhaft sichtbares Mini-Dreieck am Rand.
- **Kartentext:** eine „Was passiert?“-Zeile in Wenn-dann-Form, höchstens zwei Zeilen auf dem Handy; interne Tags wie `shot` erscheinen nicht auf der Karte. Der Richtwert „8–11 Wörter“ aus 7.3 gilt nur als Ziel, nicht als belegte Regel.
- **Fachbegriffe später:** Englische BJJ-Begriffe werden erst eingeblendet, wenn die Handlung verstanden ist; korrekte Schreibweise nach 1.2 (Southpaw, Orthodox/Regular).

### 8.3 Ausblendende Hinweise

**Befund**
- **Chess.com Coach** gibt in Puzzles gestufte Hinweise: Stufe 1 ein gesprochener verbaler Hinweis, Stufe 2 die Figur markieren, Stufe 3 den nächsten Zug zeigen. Dazu kommen optionale „Puzzle Goals“ (Ziel sofort nennen, „especially useful for new players“) und Fehler-Feedback; alles ist einzeln abschaltbar. — [Chess.com Announcement](https://www.chess.com/announcements/view/level-up-your-puzzle-practice-with-coach) · belegt. Ob Chess.com Hinweise automatisch reduziert, ist nicht dokumentiert; das Ausblenden ist dort nutzergesteuert. · [ungeprüft]
- **Expertise Reversal:** Methoden, die Novizen helfen, verlieren mit wachsender Expertise ihren Nutzen oder schaden, weil sie zum Vorwissen redundant werden. Berichtete Effektgrößen-Differenzen 0,45–2,99. Novizen profitieren von langsamem Ausblenden, Fortgeschrittene von schnellem (Reisslein 2005). Adaptive Tutorials erzielen bessere Lerngewinne als nicht-adaptive (Effekt etwa 0,46–0,69); schnelle Diagnose gelingt über „first-step“-Tests. Lernerkontrolle hilft nur mit genug Vorwissen; Novizen brauchen Systemführung. — [Kalyuga 2007 (PDF)](https://www.uky.edu/~gmswan3/EDC608/Kalyuga2007_Article_ExpertiseReversalEffectAndItsI.pdf) · belegt
- Ausgeblendete Hilfen schlugen dauerhafte Prompts (Nückles et al. 2010, über Kalyuga-Artikel). — [Chartered College](https://my.chartered.college/impact_article/expertise-reversal-effect-and-its-instructional-implications/) · [Sekundär]
- **Element Interactivity:** Bei vielen gleichzeitig zu verarbeitenden Elementen sind Worked Examples besser als freies Problemlösen; dieselbe Aufgabe ist für Experten durch Chunking leicht. — [Chen, Castro-Alonso, Paas & Sweller 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6099118) · belegt

**So setzt Mattenkarten das um** [Design]
- **Dreistufiger Coach-Knopf** (Chess.com-Muster): (1) Ziel in Alltagssprache („Er wird gleich nach vorn stürmen. Was stoppt das?“), (2) passende Kartenrolle hervorheben, (3) konkrete Karte leuchten lassen.
- **Ausblend-Regel:** Stufe 3 erscheint automatisch nur in den ersten Kämpfen, danach nur auf Anfrage. Hat ein Spieler eine Situationsart 2–3-mal richtig gelöst, verschwindet der Hinweis für genau diese Situation. Diese Schwelle ist eine Hypothese für den Playtest.
- **Telegrafieren** der Gegnerabsicht senkt die Elementinteraktivität beim gleichzeitigen Aufdecken und wird mit steigendem Gürtel seltener (Spec `telegraph`, siehe 7.8).
- **Erst zeigen, dann selbst spielen:** Der erste Zug eines neuen Konzepts ist ein kommentierter Demo-Zug des Coachs (Example vor Problem für Novizen).
- **Einstufung:** Spieler mit Vorwissen beantworten 2–3 Schnellsituationen und überspringen damit Hinweisstufen.

### 8.4 Feedback nach jeder Auflösung

**Befund**
- **Shute 2008** (Review of Educational Research, DOI [10.3102/0034654307313795](https://doi.org/10.3102/0034654307313795)): Empfehlung „Provide elaborated feedback to enhance learning“; Feedback soll Was, Wie und Warum beschreiben. Reines Richtig/Falsch „does not have much utility for learning“. Zu langes Feedback wird ignoriert, Leitlinie „as simple as possible but no simpler“. Bei schwierigen Aufgaben „immediate feedback, at least initially“; bei einfachen Aufgaben verzögern, um Unterbrechungen zu vermeiden. Für frühe Lernphasen: „Directive feedback may be most helpful during the early stages of learning“. — [Shute 2008 (PDF)](https://myweb.fsu.edu/vshute/pdf/shute%202008_b.pdf) · belegt
- **Hattie & Timperley 2007** (Review of Educational Research 77(1), 81–112, DOI [10.3102/003465430298487](https://doi.org/10.3102/003465430298487)): vier Ebenen (Aufgabe, Prozess, Selbstregulation, Person). Die ersten drei gelten als lernwirksam, Lob der Person nicht. — [BERA Blog](https://www.bera.ac.uk/blog/how-to-optimise-the-use-of-hattie-and-timperleys-feedback-levels-for-student-learning) · [Sekundär]
- **Wouters & van Oostendorp 2013** (Computers & Education 60(1), 412–425): Meta-Analyse zu Instruktionsunterstützung in Lernspielen, 29 Studien, 107 Vergleiche, Gesamteffekt d = 0,34. Unterstützung zur Auswahl relevanter Information (u. a. Feedback, Modeling, Hinweise) d = 0,46; Unterstützung zur Organisation und Integration (u. a. Reflexion, Selbsterklärung) nur d = 0,14. Effekt auf kognitive Fertigkeiten/Transfer d = 0,62, auf die Spielleistung selbst nur d = 0,19. Modeling d = 0,46. — [TUM Clearinghouse Kurzreview (PDF)](https://www.clearinghouse.edu.tum.de/wp-content/uploads/2018/12/CHU_KR-2_Wouters1_2013_Spielbasiertes-Lernen.pdf), [dblp](https://dblp.uni-trier.de/rec/journals/ce/WoutersO13.html) · belegt über Kurzreview; der isolierte Feedback-Effekt und die DOI sind [ungeprüft]
- **Clark, Tanner-Smith & Killingsworth 2016** (Review of Educational Research 86(1), 79–122, DOI [10.3102/0034654315582065](https://doi.org/10.3102/0034654315582065)): Spiele gegen Nicht-Spiel-Bedingungen 0,33 [0,19; 0,48], k = 57; erweiterte gegen Standard-Spieldesigns (z. B. mehr Scaffolding) 0,34 [0,17; 0,51], k = 20. Die Effekte variierten mit Spielmechanik, Gestaltung und Studienqualität. — [Open Development & Education Library](https://docs.opendeved.net/lib/YHX5ZVR8), [SRI Brief](https://www.sri.com/publication/education-learning-pubs/digital-learning-pubs/digital-games-design-and-learning-a-systematic-review-and-meta-analysis-brief/) · belegt (Abstract)

**So setzt Mattenkarten das um** [Design]
- **Jede Auflösung bekommt einen Warum-Satz**, nicht nur Gewonnen/Verloren: „Sprawl: Hüfte nach hinten, Gewicht auf seinen Rücken. Der Beinangriff findet keine Beine.“ Richtwert 15–20 Wörter (Hypothese), sofort nach dem Aufdecken, weil Anfänger prozedurales Wissen lernen.
- **Prozess statt Person:** „Gegen einen tiefen Angriff hilft Hüfte weg“ statt „Super gemacht!“. Konfetti und Lob sind Spielbelohnung, nicht Lerninhalt.
- **Direktiv am Anfang:** Bei einem Fehler nennt das Feedback in frühen Kämpfen die bessere Karte; später nur den Grund.
- **Später kürzen oder verschieben:** Für Fortgeschrittene wandern Erklärungen in die Kampf-Zusammenfassung (verzögertes Feedback, weniger Unterbrechung).
- **Siegquote ist kein Lernmaß:** Weil die Spielleistung nur schwach mit Lernen zusammenhängt (d = 0,19 gegenüber 0,62), braucht das Spiel ein eigenes Verständnis-Signal, z. B. die Trefferquote der Vorhersage aus 8.5.

### 8.5 Vorhersage vor dem Aufdecken

**Befund**
- **Brod, Hasselhorn & Bunge 2018** (Learning and Instruction 55, 22–31, DOI [10.1016/j.learninstruc.2018.01.013](https://doi.org/10.1016/j.learninstruc.2018.01.013)): Inhalte, zu denen vorher eine Vorhersage abgegeben wurde, wurden besser gelernt als nur gezeigte. Vor allem falsche Vorhersagen trugen dazu bei; die Pupillenerweiterung (Überraschung) hing mit dem Lerngewinn zusammen. N = 36; eine ursächliche Rolle der Überraschung ist nicht belegt. — [idw-Pressemitteilung DIPF](https://idw-online.de/en/news693157) · [Sekundär]

**So setzt Mattenkarten das um** [Design]
- **Die Kartenwahl ist schon eine Vorhersage** („Er greift die Beine an, also Sprawl“). Zusätzlich gibt es einen optionalen Tipp „Ich erwarte …“: ein Tap auf die vermutete Gegnerrolle vor dem Aufdecken, mit kleinem Bonus bei Treffer.
- **Überraschung nutzen:** War die Vorhersage falsch, wird die Erklärung prominenter gezeigt (kurze Animation plus Satz); bei richtiger Vorhersage genügt ein Bestätigungssatz.
- Die Vorhersage-Trefferquote pro Kampf dient als Lernkurve (siehe 8.4).

### 8.6 Selbsterklärung sparsam

**Befund**
- **Bisra et al. 2018** (Educational Psychology Review, DOI [10.1007/s10648-018-9434-x](https://doi.org/10.1007/s10648-018-9434-x)): 64 Studien, etwa 6.000 Teilnehmende, g = 0,55. Selbsterklärung wirkte besser als Erklärung durch Lehrende und besser als keine Erklärung. Selbsterklärung per Auswahlmenü war die schwächste Form; der Zeitpunkt des Prompts machte wenig Unterschied; die passende Führung hängt vom Kenntnisstand ab. — [BPS Research Digest](https://bps.org.uk/research-digest/self-explanation-powerful-learning-technique-according-meta-analysis-64-studies) · [Sekundär]
- In Lernspielen zeigte Reflexions- und Integrationsunterstützung (darunter Selbsterklärung) nur d = 0,14, Auswahlunterstützung wie Feedback d = 0,46 (Wouters & van Oostendorp 2013, siehe 8.4). Eigene Literatur zu Selbsterklärung in Spielen (ter Vrugte, de Jong u. a.) wurde nicht ausgewertet. — [Universität Twente](https://research.utwente.nl/en/publications/self-explanations-in-game-based-learning-from-tacit-to-transferab/)

**So setzt Mattenkarten das um** [Design]
- **Frequenz:** Vorhersage in jeder Runde (ist Mechanik), Warum-Satz in jeder Runde kurz, aktive Selbsterklärung höchstens 1–2-mal pro Kampf und optional, meist in der Zusammenfassung.
- **Format:** „Wähle den Grund“ (Auswahl) nur als Einstieg, weil am schwächsten belegt; später freie Antwort oder Sprachantwort, die der optionale KI-Coach (`api/coach.ts`) bewertet. Die Wirksamkeit dieser KI-Bewertung ist eine Hypothese.

### 8.7 Lerninhalt ist die Mechanik

**Befund**
- **Habgood & Ainsworth 2011** (Journal of the Learning Sciences, DOI [10.1080/10508406.2010.508029](https://doi.org/10.1080/10508406.2010.508029)): Studie 1 mit 58 Kindern (7–11 Jahre) verglich eine intrinsische, eine extrinsische (Quiz angehängt) und eine Kontrollversion von „Zombie Division“. Bei fester Spielzeit lernten Kinder mit der intrinsischen Version mehr. In Studie 2 (16 Kinder, freie Wahl) spielten sie die intrinsische Version „7 times longer“. — [Nottingham Repository](https://nottingham-repository.worktribe.com/output/23577510/motivating-children-to-learn-effectively-exploring-the-value-of-intrinsic-integration-in-educational-games) · belegt (Abstract). Getestet mit Mathematik und Kindern; die Übertragung auf Kampfsport ist nicht untersucht.
- Clark et al. 2016: Die Effekte hingen von der Spielmechanik ab, nicht vom Medium Spiel an sich (siehe 8.4).

**So setzt Mattenkarten das um** [Design]
- **Die Konter-Matrix ist der Lerninhalt:** Sprawl schlägt Double Leg, Guillotine bestraft den Shot mit gesenktem Kopf, Upa gegen Mount (Katalog in Abschnitt 4). Wer gewinnt, hat die Logik verstanden. Keine Quizfragen zwischen den Runden ohne Bezug zur Kartenwahl.
- **Positionsabhängige Hände:** In Mount unten stehen nur Flucht- und Schutzkarten zur Wahl. So lernt man die Ziele jeder Position ohne Text.
- **Risiko Schere-Stein-Papier:** Ist der Konter abstrakt, lernt man das Spiel und nicht den Sport. Jede Konterbeziehung braucht deshalb ein Bewegungsprinzip im Warum-Satz und eine Quelle aus Abschnitt 4.
- Die bestehende Freischalt-Lektion mit Kontrollfrage (Abschnitt 6) bleibt als Ergänzung in der Bibliothek, nicht im Kampf.

### 8.8 Multimedia-Prinzipien nach Mayer

**Befund**
- Mayer beschreibt u. a. **Pre-Training** (wer Namen und Eigenschaften der Hauptkonzepte vorab kennt, lernt besser), **Signaling** (das Wesentliche hervorheben), **Coherence** (Überflüssiges weglassen), **Spatial Contiguity** (Wort und Bild nah beieinander), **Segmenting** (in nutzergesteuerte Häppchen teilen), **Redundancy** (gedruckter Text zu Grafik plus Sprache hilft nicht) und **Personalization** (Gesprächston). — [Mayer 2020, Multimedia Principles (PDF)](https://ugc.futurelearn.com/uploads/files/7d/d6/7dd6188d-c343-4311-b064-ac98d2c95abc/Multimedia_Principles._R._E._Mayer__2020.pdf) · belegt
- **Multimedia-Prinzip:** Wort plus Grafik schlägt Wort allein, Median-Effektgröße über 1 in 13 Experimenten (Mayer im Interview). — [Torkar 2022, CEPS Journal, DOI 10.26529/cepsj.1238](https://cepsj.si/index.php/cepsj/article/download/1238/595) · belegt. Effektgrößen der einzelnen Prinzipien (Signaling, Segmenting, Coherence) wurden nicht abgerufen. · [ungeprüft]
- **Concreteness Fading** (Fyfe, McNeil, Son & Goldstone 2014, Educational Psychology Review 26, 9–25): konkret beginnen, dann schrittweise und ausdrücklich zur abstrakten Darstellung übergehen. — [DOI 10.1007/s10648-014-9249-3](https://www.doi.org/10.1007/S10648-014-9249-3) · belegt; untersucht vor allem in Mathematik und Naturwissenschaften.

**So setzt Mattenkarten das um** [Design]
- **Pre-Training:** Vor Kampf 1 ein Tipp-Durchlauf von 10–20 Sekunden „Lerne die 3 Lagen“ (Stehen, Klammern, Boden) mit Bildern zum Antippen statt Text.
- **Ein Konzept pro Runde (Segmenting):** Jede Auflösung transportiert genau ein Prinzip.
- **Bild direkt am Satz (Spatial Contiguity):** kurze Loop-Animation oder Skelett-Pose der Aktion neben dem Warum-Satz; der entscheidende Körperteil leuchtet (Signaling, z. B. die Hüfte beim Sprawl).
- **Weglassen (Coherence):** kein Deko-Text, keine Erklärung, die schon im Bild steckt; die Kettenleiste zeigt nur die aktuelle Phase hervorgehoben.
- **Gesprächston:** Coach spricht in der Du-Form und kurz.
- **Concreteness Fading:** konkret („Er schießt auf deine Beine, Hüfte zurück“), dann Symbol („Ebenenwechsel“), dann Prinzip („Wer tiefer ist, kontrolliert“). Prinzipienkarten erst in höheren Gürteln.

### 8.9 Fehler gezielt wiederholen

**Befund**
- Duolingo übt Fehler einer Lektion am Lektionsende erneut, wiederholt falsch beantwortete Inhalte früher und richtige später und kombiniert Abstände mit aktivem Abruf. — [Duolingo Blog: Spaced repetition](https://blog.duolingo.com/spaced-repetition-for-learning) · belegt. Das Schätzmodell „Birdbrain“ wurde nicht im Detail geprüft. — [Duolingo Blog: Birdbrain](https://blog.duolingo.com/learning-how-to-help-you-learn-introducing-birdbrain)
- Adesope, Trevisan & Sundararajan 2017 (Review of Educational Research, DOI [10.3102/0034654316689306](https://journals.sagepub.com/doi/10.3102/0034654316689306)): Meta-Analyse zum Übungstesten; Adesope betont niedrigschwellige Tests mit Feedback. — [WSU News](https://news.wsu.edu/news/2018/01/09/educational-psychology-article-among-nations-most-read/) · [Sekundär]; Gesamteffekt siehe Prüfpunkt 25.
- Testing-Effekt und Spacing sind in Abschnitt 6 belegt (Dunlosky et al. 2013, Roediger & Karpicke 2006, Cepeda et al. 2008).

**So setzt Mattenkarten das um** [Design]
- **Kampf-Zusammenfassung (höchstens etwa 30 s):** 1–3 Schlüsselmomente, vor allem die Runde mit Positionsverlust: „Du warst in der Guard unten und hast X gewählt. Was hätte besser gepasst?“ Erst abrufen, dann Erklärung.
- **Fehler-Deck:** Falsch gekonterte Situationen kommen im nächsten Kampf gezielt wieder, weil die KI die Karte erneut spielt. Die Wiederholung ist als Gegnerverhalten getarnt (passt zu 8.7).
- **Tägliche Mattenrunde:** drei Situationen aus früheren Fehlern, wachsende Abstände für Gemeistertes; Planung über die Leitner-Stufen aus Abschnitt 6.

### 8.10 Lernreihenfolge für Kampfsport-Neulinge

**Befund**
- **Gracie Barra:** Positionshierarchie von dominant bis unterlegen (siehe 3.2). Anfänger sollen für jede Hauptposition oben und unten wissen, was zu tun ist: oben erkennen, kontrollieren, finishen, hineinkommen; unten erkennen, entkommen, Submissions verteidigen, sich hocharbeiten. Warnung sinngemäß: Viele Omoplata-Varianten nützen nichts ohne Mount-Flucht. — [Gracie Barra: The Positional Hierarchy](https://graciebarra.com/2015/03/the-positional-hierarchy) · belegt
- **Danaher** (über Händlerblog): Der Elbow Escape sei „one of the most important techniques in BJJ“; Reihenfolge erst defensiv, dann offensiv (Fluchten, dann Guard zum Rücken, dann Würger); Grundbewegungen (Hüftflucht, Brücke) und Frames vor der Anwendung gegen Widerstand; Techniken als System. — [BJJ Fanatics: Three techniques for beginners](https://bjjfanatics.com/blogs/news/three-techniques-for-beginners-with-john-danaher) · [Sekundär]. Deckt sich mit 2.4.
- **Gracie Combatives:** 36 Kerntechniken in 23 einstündigen Lektionen, je eine Stand- und eine Bodentechnik in vereinfachten Drill-Abschnitten; Lektionen in beliebiger Reihenfolge; danach „Reflex Development“-Klassen, die Techniken kombinieren; kein Wettkampf-Sparring. Die Begründung (häufigste und erfolgreichste Techniken in realen Kämpfen) ist eine Eigenangabe. — [Gracie University: Gracie Combatives](https://www.gracieuniversity.com/pages/public/information?ip=96) · belegt als Selbstbeschreibung
- Eine Studie, die Reihenfolgen im BJJ-Anfängerunterricht empirisch vergleicht, wurde nicht gefunden. · Lücke

**So setzt Mattenkarten das um** [Design, Synthese aus Quellen und Lernwissenschaft]
1. **Positionen und Ziele zuerst:** Lagen erkennen und einordnen („Wer ist oben, wer hat Vorteil?“); jede Position zeigt ihr Ziel-Icon mit Wort (oben: kontrollieren; unten: entkommen oder Guard herstellen).
2. **Fluchten:** Brücke/Upa und Hüftflucht/Elbow Escape; Reihenfolge Frame, Bridge, Shrimp nach 4.5.
3. **Takedown gegen Sprawl** als erstes Konterpaar im Stand, mit Stance (Orthodox/Southpaw) und Distanz als Rahmen.
4. **Transitions:** Guard, Pass, Side Control, Mount, Rücken.
5. **Submissions zuletzt** und nur aus dominanter Position (BJJ-Grundsatz „Position before submission“, siehe 2.8).
- Gracie-Muster „eine Stand- plus eine Bodenidee pro Lektion“ passt zu einem Konzept pro Kampf; „Reflex Development“ entspricht späteren gemischten Kämpfen nach geblockter Einführung (vgl. Interleaving und Brady 2004 in Abschnitt 6).
- **Widerspruch zur Spec (nach Regel 6 dokumentiert, nicht aufgelöst):** Das Spec-Tutorial führt (1) Dreieck und Takedown, (2) Reaktion und Sprawl, (3) Kontrolle und Submission ein; die Quellen empfehlen Positionen, Ziele und Fluchten vor Takedowns und Submissions. Entscheidung siehe Abschnitt 9.

---

### 8.11 7-Tage-Startprogramm (Recherche 2026-11-05)
- Realistisch in 7 Tagen: Wissen & Entscheidungen, keine Motorik. Gracie Combatives ≈ 23 Lektionen à 1 h, je 3× besucht + 12 Reflex-Klassen (≈ 80 h, eigene Rechnung); GB Fundamentals 16 Wochen; GB: Live-Sparring erst ab 3. Streifen.
- Viel Video → höhere Selbsteinschätzung ohne Leistungsgewinn → App zeigt „Wissen geprüft“ getrennt von „Können: Matte“.
- Reihenfolge Danaher „Go Further Faster“: Pin-Befreiungen zuerst (Mount, Side, Frames, KoB/N-S, dann Rücken/Turtle).
- Abstand Wiederholung ≈ 20–40 % der Behaltenszeit (Cepeda 2008) → bei 1 Woche: 1, 2, 4 Tage.
- Streaks (Silverman & Barasch): intakt motiviert (66 vs. 58 %), Bruch schadet v. a. bei Selbstschuld → keine Bruch-Benachrichtigung, Pause statt Rückstufung.
- Solo-Drills: Brücke, Shrimp, Technical Stand-up, Fallen aus dem Sitz, Sprawl, Guard-Haltung. Nicht allein: Würfe/Takedowns mit Partner, Rollen über Kopf, Aufgaben bis Druck, Sparring, Beinhebel, Fallen aus dem Stand [eigene Zusammenstellung, ungeprüft].
- Lücken: Roy Dean-Lehrplan, optimale Sitzungslänge, Mastery-Schwelle (80 % = Hypothese), Hautinfektionen.
- Details: research_notes/7 Tage Startprogramm/notes.md · Spec: docs/superpowers/specs/2026-11-05-7-tage-startprogramm-design.md
- **Umsetzung 2026-11-05 (Schritte 9, 56, 57, 61, 62):**
  - Schutzhaltung (Tag 2, `src/program/concepts.ts`): Ellbogen eng, Kinn unten (nicht verkrampft), Hände vorn am Hals, Rücken nie zeigen. Beleg: [Cursa](https://cursa.app/en/page/bjj-starter-guide-safety-tapping-and-positional-priorities) („Reconnect elbows to ribs … to prevent arm isolation“, „hands to defend the space around your neck“, „Keep chin neutral (not cranked)“, „don't turn away and give your back“); Danaher 2.4; Priit Mihkelson „Grilled Chicken“ (Ellbogen-Knie-Verbindung, „Protect your spine first“) nur über [BJJ More](https://bjjmore.com/grilled-chicken-guard-retention-system/) [Marketing: Affiliate].
  - Drill-Timer und Aufwärmen (5 × 45 s, 15 s Pause): Format nach Grapplearts (3 × 1 min, 1 min Pause). Signale nur Vibration + Ton, Wake Lock API mit Fallback.
  - Hygiene: Kleidung nach jeder Einheit waschen, Wunden abdecken, Hautinfekt melden ([CDC MRSA Athletes](https://www.cdc.gov/mrsa/prevention/athletes.html)); Athleten mit infektiöser Hauterkrankung bis zur Heilung ohne Kontakt ([USA Wrestling Health Watch](https://content.usawmembership.com/articles/17425)); No-Gi-Shorts ohne Taschen, Reißverschluss, Knöpfe ([IBJJF Uniform](https://ibjjf.com/uniform)). „Bei offener Wunde aussetzen“ ist strenger als die Quellen (dort: abdecken) → check.
  - Wissen vs. Mattenpraxis getrennt anzeigen (Begründung oben: Video hebt Selbsteinschätzung ohne Leistungsgewinn). Mattenpraxis-Richtwert 20 Einheiten = eigene Setzung.

### 8.12 No-Gi-Fokus (Recherche 2026-11-05)
- Entscheidung Nutzer: Mattenkarten fokussiert No-Gi (Grappling ohne Anzug, MMA-nah). Standard-Regelwerk im Spiel: IBJJF Weißgurt (strengste Regel).
- Reihenfolge bleibt (Danaher „Go Further Faster“: Body Movements + Pin-Escapes zuerst, Rücken/Turtle am Ende). Neu für No-Gi: Tag „Rücken & Front Headlock“ (Seatbelt, RNC- und Guillotine-Abwehr).
- Griffe statt Kragen/Ärmel: Handgelenk, 2-gegen-1, Underhook, Overhook/Whizzer, Collar Tie, Bodylock, Seatbelt. Butterfly gilt als „better in no-gi“ (Gymdesk); Spider/Lasso/Worm/DLR = Gi-Guards.
- Beinhebel: Heel Hook, Kneebar, Toe Hold, Calf Slicer, Kniedrehhebel, Reaping für Weißgurte verboten (Gi und No-Gi); Heel Hook/Reaping in No-Gi erst ab Braungurt. **Primär belegt am 2026-11-05** (IBJJF-Tabelle, siehe 8.12.2). „Seit 1.1.2021“ nur Sekundärquelle (Grapplearts). Gerader Fußhebel = einziger Weißgurt-Beinhebel, nur mit Trainer.
- Warum Vorsicht: ca. 2 cm Fersenbewegung reichen für Verletzung, Armbar ca. 30 cm (Lachlan Giles); Heel Hooks 11 % der Submission-Verletzungen, Knie 27,1 % aller Verletzungen (Hinz 2021); Knie 24,5 % (Bell et al. 2026, 341 Grappler).
- Abklopfen: früh, bei Leg Locks nicht herausdrehen; verbal tappen, wenn Hände gefangen.
- Karten-Audit: hb_scissor raus; 6 Karten mit Gi-Griffen umschreiben; fehlend u. a. Arm-Triangle (Side/Mount), Butterfly + Sweep, Body Lock Pass, Guillotine aus Guard, Hand Fighting, Overhook/Whizzer, Pummeling, Wrestle-up.
- Details: docs/research/no-gi-fokus.md

#### 8.12.1 Umsetzung im Spiel (Kern 2, 2026-11-05)
- **Raus:** `hb_scissor` (Kragen-Ärmel-Sweep) → `hb_old_school` Old School Sweep (Underhook + Knöchel, → Side Control oben, 2 Punkte; [JitsuIQ](https://jitsuiq.com/sweeps/old-school-sweep.html)). Guard unten ohne `gb_kimura`, `gb_hip_bump` (Ärmelgriff) und `gb_arm_drag` (Arm Drag jetzt im Stand). Stand ohne `nd_jab_feint` (MMA-Schlag). Mount ohne `mt_head` (Inhalt in `mt_heavy_hips`). Halb vorbei `gt_half_pass` → Body Lock Pass.
- **Neu:** Stand `nd_hand_fight` (Wrist Control, ersten Griff nicht herschenken, kein Todesgriff; ersetzt „Abstand halten“; [Evolve MMA No-Gi Grips](https://evolve-mma.com/blog/heres-what-you-need-to-know-about-grip-fighting-in-no-gi-bjj/)) und `nd_arm_drag` (2-on-1 & Arm Drag → Rücken, check; [Evolve Arm Drags](https://evolve-mma.com/blog/38-arm-drag-techniques-for-bjj/), [FanaticWrestling Heflin](https://fanaticwrestling.com/blogs/news/learn-the-2-on-1-tie-to-arm-drag-from-nick-heflin)). Guard unten `gb_butterfly_sweep` (Butterfly Guard & Sweep, Underhooks, → Mount 2 Punkte; [BJJ Atlas](https://bjj-atlas.pages.dev/sweeps/butterfly-sweep)), `gb_guillotine` ([BJJ Atlas](https://bjj-atlas.pages.dev/submissions/guillotine)), `gb_wrestle_up` (Technical Stand-up/Wrestle-up → Stand; [Evolve Wrestle-Ups](https://evolve-mma.com/blog/improving-your-bjj-with-wrestle-ups/), [JitsuIQ](https://jitsuiq.com/movement-mechanics/technical-stand-up.html)). Guard oben `gt_body_lock` (Body Lock Pass → Half Guard oben, Spiel-Vereinfachung, check; [BJJ Atlas](https://bjj-atlas.pages.dev/guard-passing/body-lock-pass)). Kopf-Arm-Würger `sct_arm_triangle` jetzt auch im Mount.
- **Zusammengelegt (max. 8 Karten je Slot):** Pummeling in `cl_underhook` ([Evolve Pummeling](https://evolve-mma.com/blog/what-is-pummeling-and-how-to-do-it-correctly-for-mma-training/)); Overhook/Whizzer in `cl_hips_back`; „Kopf hoch gegen die Guillotine“ in `gt_both_arms` („Hals schützen“: am Handgelenk drücken, nicht am Ellbogen, Hüfte gerade; [BJJ More](https://bjjmore.com/how-to-escape-a-guillotine/)); Collar Tie und Overhook in `gb_break_posture`; 2-on-1 in `gb_wrist_control`.
- **Umgeschrieben (Gi-Griffe raus):** `gt_toreando` (Knie/Schienbeine), `gb_break_posture` (Nacken), `gb_hip_frame` (Unterarm-Frame, Bizeps), `hb_back_take` (Trizeps, Arm Drag), `scb_protect_arms` (Hände an Hals/Brust). MMA-Hinweise als Schlüssel: `cl_pull_guard` („MMA: lieber nicht – unten wirst du geschlagen“), `nd_outside_foot` (No-Gi tiefer stehen, check).
- **Mount aus der Seitkontrolle (B14):** `sct_to_mount` braucht Hüfte +1 (statt +2) und öffnet als Dilemma die Arme. Beleg: Hüfte blocken und Knie über den Bauch schieben ([JitsuIQ Side Control](https://jitsuiq.com/positions/side-control/side-control.html): „Slide your knee over their torso, pinning their hips“; [Evolve MMA BJJ 101: Side Control](https://evolve-mma.com/blog/bjj-101-side-control/): „Blocking the hip is essential“, Knee on Belly „often used as a pathway to full mount“); rahmt der Untere, pinnt man die rahmende Hand ([Evolve MMA BJJ 101: The Americana](https://evolve-mma.com/blog/bjj-101-the-americana/): „The natural reaction of the opponent is to create a frame … pin down his framing hand“). Grund: ohne Hip Bump und Scissor Sweep (Gi/Ärmel) kam man kaum noch in den Mount.
- **Bewusst nicht:** keine Beinhebel-Karte (Heel Hook, Kneebar, Toe Hold, Calf Slicer verboten; Straight Ankle Lock erst nach Woche 1 mit Trainer). Test „No-Gi: keine Kragen-, Ärmel-, Hosen- oder Gürtelgriffe“ in `cards.test.ts`.
- **Programm:** Tag 4 „Guard in No-Gi“, Tag 5 „Stand & Hand Fighting“, Tag 6 „Rücken & Front Headlock“ (neue Lektion „Rücken schützen“ + „Erst Griff, dann beenden“). Neue Fragen zu No-Gi-Griffen, Guillotine-Abwehr, Rücken/Turtle und Beinhebeln („Heel Hook für Weißgurte verboten; bei Beinhebel früh abklopfen, nie rausdrehen“). Checkliste und „Nicht allein üben“ um Beinhebel-Sicherheit ergänzt. Alte Kampagne: Bibliothek markiert Gi-Karten (`GI_ONLY`: Cross Collar, Kragengriffe abwehren, Scissor Sweep) und blendet sie mit „Nur No-Gi“ aus.

#### 8.12.2 Regelprüfung und Woche 2 „Beinhebel sicher“ (Schritte 43–48, 2026-11-05)
**Verifiziert (Primärquelle, abgerufen 2026-11-05)**
- IBJJF „Technical Fouls & Illegal Moves“ VRS 4.0 (01.01.2024), auf [ibjjf.com/rules](https://ibjjf.com/rules) verlinkt: [PDF](https://ibjjf.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBcE1WIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--e13c15f6e568323ecea8ef21a102b726067a4540/20240101_GolpesProibidos_EN.pdf). Spalte „16 & 17 years old (all ranks) and white belts (Adult to Master 7)“: verboten u. a. Calf Slicer, Knee Bar, Toe Hold, Drehen zur Seite des freien Fußes beim Straight Foot Lock, Heel Hook, „Locks twisting the knees“, Knee Reaping, Wrist Lock, Slam, Scissor Takedown. **Straight Foot Lock** nur bis 15 Jahre verboten → für Weißgurte erlaubt. Gi/No-Gi-Trennung erst bei Braun/Schwarz (Heel Hook, Kniedrehhebel, Reaping, Toe Hold nach außen dort in No-Gi erlaubt). Jumping Guard für Weißgurte verboten.
- IBJJF Rules Book Version 6.1 (Juni 2024): [PDF](https://ibjjf.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBbTRaIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--c53798f1b94f5ebc202702cb44e9428a7606a19b/2024JUN_IBJJF_Rules_EN.pdf). 2.1.2 Fußklopfen zweimal, wenn die Arme gefangen sind; 2.1.3 verbale Aufgabe; 6.2.3 M verbotener Griff = Severe Foul.
- ADCC Opens Legal Techniques by Division, Stand 20.07.2026: [PDF](https://cdn.shopify.com/s/files/1/0679/7950/9959/files/2026_Grid_ADCC_Legal_Techs_720_26.pdf). Erwachsene Beg/Int dürfen Heel Hooks, Knee Bar, Toe Hold, Locked Reaping, Straight Ankle Lock; Masters Beg/Int keine Heel Hooks.
- Lachlan Giles (FloGrappling, 28.03.2018): ca. 2 cm Fersenbewegung vs. ca. 30 cm Armbar – Wortlaut bestätigt, Erfahrungswert.

**Weiter [ungeprüft]**
- Neuere IBJJF-Liste als 2024 nicht gefunden (Seite verlinkt am 2026-11-05 die 2024er Dateien). Vor Release erneut prüfen.
- Deutsche Turniere/Verbände, EBI, NAGA, Grappling Industries: keine Primärquelle → in der App „Regel deines Turniers/Gyms prüfen.“
- Verteidigungsdetails (Knie-Linie, Zehen anziehen, Beine nicht kreuzen lassen, Ferse aus der Achsel): nur BJJ Atlas (sekundär) → App-Hinweis „Technik-Detail: Dein Trainer zeigt dir, wie es richtig geht.“

**Umsetzung** `src/leglock/` – „Woche 2: Beinhebel sicher“, frei nach Tag 7 des 7-Tage-Starts (liest `mk.program.v1` nur lesend), eigener Speicher `mk.leglock.v1`. Keine spielbaren Beinhebel-Angriffskarten. 4 Lektionen: (43) Regelkunde mit Sortierspiel „Erlaubt oder verboten?“, (45) Erst Verteidigung mit 4× „Was ist hier gefährlich?“ an eigenen SVG-Skizzen, (46) Gerader Fußhebel nur erkennen + „nur mit Trainer, langsam ansetzen“, (47/48) Sicherheitskarte „Früh abklopfen – nie rausdrehen“ (Flip-Karte, Abklopfen-Übung, 2 cm vs. 30 cm, Fuß-/Wort-Aufgabe). Abschluss-Check 20 Fragen, je Bereich ≥ 80 %, Abzeichen „Beinhebel-Sicherheit: Wissen geprüft“ mit Hinweis „Üb Beinhebel nur mit Trainer“. Tests: `src/leglock/leglock.test.ts` (Regelaussagen belegt oder markiert, ≤ 20 Wörter pro Satz, Freischaltung, 80-%-Regel).

#### 8.12.2 Front Headlock, Stand-Tiefe, Turtle, MMA-Hinweise (Kern 2, B16–B20, 2026-11-05)
- **Front Headlock als Position:** Oben hält den Kopf: Hand am Kinn (Chin Strap), Schulter auf seinem Nacken, die andere Hand zieht seinen Ellbogen weg vom Knie; Angriffe Guillotine und Go-Behind ([Evolve MMA – 3 Attacks From The Front Headlock](https://evolve-mma.com/blog/3-ways-to-use-the-front-headlock-in-bjj/)). Snap Down aus dem Nackengriff, Kopf unter den eigenen bringen, Kinngriff; für ältere/weniger bewegliche Grappler empfohlen ([Evolve MMA – Snap Down](https://evolve-mma.com/blog/bjj-takedown-101-the-snap-down/)). Go-Behind: Gewicht auf seine Hände/Ellbogen, dann vorziehen, Arm blockt die Achsel ([FanaticWrestling – Snap and Go Behind](https://fanaticwrestling.com/blogs/news/master-snap-and-go-behind-drills-with-dan-vallimont)). Nach dem Sprawl Front Headlock fassen; der Sprawl ist kein stabiler Platz ([Evolve MMA – Counter Takedowns No-Gi](https://evolve-mma.com/blog/5-ways-to-counter-takedowns-in-no-gi-bjj/); [FanaticWrestling – Wrestling Moves](https://fanaticwrestling.com/blogs/news/wrestling-moves): „sprawls and quickly wraps their arm around their opponent's head“).
- **Unten im Front Headlock:** Kopf aufrecht, Blick zum Gegner; ein tiefer Kopf lädt zu Guillotine, Snap Down und Front Headlock ein ([Grapplearts – Standing Guillotine Escapes](https://www.grapplearts.com/standing-guillotine-choke-escapes/)); am Handgelenk statt am Ellbogen arbeiten ([BJJ More](https://bjjmore.com/how-to-escape-a-guillotine/)); Aufstehen mit Handkontrolle ([FanaticWrestling – Wrestling Moves](https://fanaticwrestling.com/blogs/news/wrestling-moves)). „Kopf raus“ zur Seite und „Durchschießen“ (Re-Shot) ohne Primärquelle → Trainer prüfen.
- **Stand:** Southpaw = rechter Fuß vorn; gegen Orthodox kämpfen beide um die Außenposition des Vorderfußes ([Evolve MMA – Southpaw Stance](https://evolve-mma.com/blog/a-guide-to-the-southpaw-stance-in-mma/)). Gleiche Auslage (Vorderfüße schräg, kein Kampf um außen) ist didaktische Ableitung [ungeprüft]. Penetration Step: tief aus den Knien, Schritt zwischen seine Füße, hinteres Knie fast auf der Matte, Rücken gerade, Kopf hoch; Fehler: aus der Taille bücken, zu weiter Schritt, Kopf unten ([Evolve MMA – Penetration Step](https://evolve-mma.com/blog/mastering-the-penetration-step-for-better-takedowns-in-mma-and-bjj/)). Whizzer gegen das Single Leg, Schienbein außen, Kopf auf seiner Höhe ([FanaticWrestling – Single Leg Defense, Cejudo](https://fanaticwrestling.com/blogs/news/single-leg-defense-with-henry-cejudo)). Underhook-Kampf/Pummeling bleibt in `cl_underhook`.
- **Sicherheit:** jede Karte, die aus Stand/Clinch zu Boden führt (Double/Single Leg, Snap Down, Arm Drag, Body Lock, Guard ziehen) und der Shot aus dem Front Headlock: „Nur mit Trainer üben“ (Test in `cards.test.ts`). Granby-Rolle nur mit Trainer, keine Karte.
- **MMA-Hinweis je Karte** (`mma` ok/riskant/nein + Satz): Guard ziehen = nein, Armbar aus dem Mount, Butterfly-Sweep, volle Guard/Half Guard unten, Turtle-Panzer, Toreando, Guard öffnen, Durchschießen = riskant; Einstufung didaktisch nach KB 8.12 [Trainer prüfen].
- **Glossar:** deutsch auf der Karte, No-Gi-Begriff als Fachwort, eine Schreibweise (Spec B19, `TERMS2`).

## 9. Offene Prüfpunkte

Alles hier muss ein Trainer (BJJ, Judo, Ringen) oder die Primärquelle bestätigen, bevor es ohne `check`-Feld in Karten erscheint.

**Regeln und Punkte**
1. ~~Offizielle IBJJF-Liste verbotener Techniken~~ erledigt 2026-11-05 (8.12.2): Single Leg mit Kopf außen ist für Weißgurte verboten, wird aber nicht bestraft; Jumping Guard für alle Weißgurte verboten. Offen: Gibt es eine neuere Liste als VRS 4.0 (2024)?
2. IBJJF-Punkte, 3-Sekunden-Regel und Kettenregel am aktuellen Regelwerk; „Sweep direkt in Mount = 6“; Änderungen 2025/26.
3. ~~Straight Ankle Lock für alle Gurte erlaubt~~ belegt 2026-11-05 für Erwachsene und 16/17-Jährige; bis 15 Jahre verboten (8.12.2).
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

**Neulinge und Lernen pro Runde (Abschnitt 8)**
31. „8 Wörter pro Screen“ (Marvel Snap, in 7.3): gezielte Suche ohne Treffer; nur „höchstens 2 Zeilen Kartentext“ ist belegt. Bis zur Primärquelle (z. B. GDC-Talk „Designing MARVEL SNAP“) nur als Design-Ziel verwenden.
32. Wouters & van Oostendorp 2013: isolierter Effekt von Feedback und die DOI am Volltext prüfen (bisher nur TUM-Kurzreview).
33. Clark et al. 2016: Werte zu mehreren Sitzungen und „enhanced scaffolding“ aus dem Volltext.
34. Brod et al. 2018 und Bisra et al. 2018 nur über Pressemitteilung bzw. Research Digest belegt; Kernaussagen am Original prüfen.
35. Habgood & Ainsworth 2011: Effektgrößen aus dem Volltext; Übertragbarkeit von Mathematik und Kindern auf Kampfsport und Erwachsene ist ungetestet.
36. Effektgrößen der einzelnen Mayer-Prinzipien (Signaling, Segmenting, Coherence) aus Mayer, *Multimedia Learning*, 3. Aufl.
37. Doppel-Label (Alltagssprache plus Fachbegriff): keine Evaluation gefunden; im Playtest mit Nicht-Kampfsportlern prüfen („Was macht diese Karte?“) und Icon-Erkennung nach NN/g testen.
38. Design-Schwellen ohne Beleg: Warum-Satz 15–20 Wörter, 2–3 Optionen in Kampf 1, Hinweis-Ausblendung nach 2–3 richtigen Lösungen, Zusammenfassung ≤ 30 s, Selbsterklärung höchstens 1–2-mal pro Kampf. Im Playtest messen.
39. Spec-Konflikt Handgröße: Die Spec zieht immer auf 5 Handkarten; für die Tutorial-Kämpfe 2–3 wählbare Karten entscheiden.
40. Spec-Konflikt Tutorial-Reihenfolge: Spec beginnt mit Dreieck und Takedown, die Quellen (Gracie Barra, Danaher [Sekundär]) mit Positionen, Zielen und Fluchten. Entscheidung durch Trainer und Playtest.
41. Danaher-Aussagen zur Anfänger-Reihenfolge (Elbow Escape, defensiv vor offensiv) nur über Händlerblog; Primärquelle (Video/Instructional) fehlt.
42. Chess.com: Werden Hinweise je Lernpfad automatisch reduziert oder nur vom Nutzer abgeschaltet?
43. Adesope et al. 2017: Moderatoren (Feedback, Format) zusätzlich zu Prüfpunkt 25; Cepeda et al. 2006 nicht abgerufen.
44. Lichess-Learn-Details (Sterne, Ablauf) auf der Seite nicht bestätigt; Slay-the-Spire-Onboarding nur über schwache Sekundärquelle.

---

## 10. Quellenverzeichnis

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

**Content-Paket 2 (Abschnitt 4.7)**
- https://evolve-mma.com/blog/the-5-basic-yet-effective-combinations-all-boxers-need-to-know/
- https://evolve-mma.com/blog/the-art-of-takedown-feints-in-mma/
- https://evolve-university.com/blog/how-to-use-level-changes-to-set-up-strikes-and-takedowns/
- https://evolve-mma.com/blog/heres-how-to-defend-the-jab-in-muay-thai/
- https://evolve-mma.com/blog/heres-how-to-use-the-cage-in-mma/
- https://evolve-mma.com/blog/how-to-use-the-cage-wall-to-escape-takedowns-in-mma/
- https://evolve-mma.com/blog/bjj-101-knee-shield-half-guard/
- https://evolve-mma.com/blog/3-back-mount-escapes-you-need-to-know-in-bjj/
- https://bjj-atlas.pages.dev/immobilizations/knee-on-belly
- https://bjj-atlas.pages.dev/submissions/cross-collar-choke
- https://jitsuiq.com/submissions/chokes/cross-collar-choke.html
- https://jitsuiq.com/positions/back/back-control.html
- https://submissionshark.com/blogs/bjj-for-begginers/how-to-defend-yourself-from-cross-collar-chokes-in-jiu-jitsu-bjj

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

**Neulinge, Onboarding, Lernen pro Runde (Abschnitt 8)**
- https://hearthstone.wiki.gg/wiki/New_player_experience
- https://www.deconstructoroffun.com/blog/2023/5/23/marvel-snap-the-definitive-deconstruction
- https://marvelsnapzone.com/answers/text-per-card/
- https://www.pockettactics.com/marvel-snap/ben-brode-gdc
- https://gdcvault.com/play/1029024/Designing-MARVEL-SNAP (nicht ausgewertet)
- https://developer.apple.com/app-store/onboarding-for-games/
- https://www.pocketgamer.biz/ftue-clash-royale/
- https://blog.duolingo.com/chess-course
- https://www.fastcompany.com/91317214/duolingo-will-start-teaching-chess-soon
- https://en.lichess.org/blog/V5EX3CgAAIoE7aBR/something-for-the-beginners
- https://www.gamedeveloper.com/design/spoiled-for-choice-the-psychology-of-choice-overload-in-games-and-how-to-avoid-it
- https://www.nngroup.com/articles/progressive-disclosure/
- https://www.nngroup.com/articles/icon-usability/
- https://ugc.futurelearn.com/uploads/files/7d/d6/7dd6188d-c343-4311-b064-ac98d2c95abc/Multimedia_Principles._R._E._Mayer__2020.pdf
- https://www.uky.edu/~gmswan3/EDC608/Kalyuga2007_Article_ExpertiseReversalEffectAndItsI.pdf
- https://ro.uow.edu.au/edupapers/140
- https://pmc.ncbi.nlm.nih.gov/articles/PMC6099118
- https://www.chess.com/announcements/view/level-up-your-puzzle-practice-with-coach
- https://www.chess.com/announcements/view/update-game-reviews-coach-now-with-more-in-depth-line-explanation (nicht im Detail abgerufen)
- https://create.roblox.com/docs/production/game-design/onboarding.md
- https://medium.com/googleplaydev/why-the-first-ten-minutes-is-crucial-if-you-want-to-keep-players-coming-back-to-your-mobile-game-4a89031b6308
- https://www.devtodev.com/resources/articles/main-metrics-ftue
- https://saschb2b.github.io/game-mechanics/games/slay-the-spire/design-tensions (schwache Sekundärquelle)
- https://myweb.fsu.edu/vshute/pdf/shute%202008_b.pdf (Shute 2008, DOI 10.3102/0034654307313795)
- https://www.bera.ac.uk/blog/how-to-optimise-the-use-of-hattie-and-timperleys-feedback-levels-for-student-learning (Hattie & Timperley 2007, DOI 10.3102/003465430298487)
- https://www.clearinghouse.edu.tum.de/wp-content/uploads/2018/12/CHU_KR-2_Wouters1_2013_Spielbasiertes-Lernen.pdf
- https://dblp.uni-trier.de/rec/journals/ce/WoutersO13.html
- https://docs.opendeved.net/lib/YHX5ZVR8 (Clark et al. 2016, DOI 10.3102/0034654315582065)
- https://www.sri.com/publication/education-learning-pubs/digital-learning-pubs/digital-games-design-and-learning-a-systematic-review-and-meta-analysis-brief/
- https://idw-online.de/en/news693157 (Brod et al. 2018, DOI 10.1016/j.learninstruc.2018.01.013)
- https://bps.org.uk/research-digest/self-explanation-powerful-learning-technique-according-meta-analysis-64-studies (Bisra et al. 2018, DOI 10.1007/s10648-018-9434-x)
- https://research.utwente.nl/en/publications/self-explanations-in-game-based-learning-from-tacit-to-transferab/ (nicht im Detail eingesehen)
- https://nottingham-repository.worktribe.com/output/23577510/motivating-children-to-learn-effectively-exploring-the-value-of-intrinsic-integration-in-educational-games (Habgood & Ainsworth 2011, DOI 10.1080/10508406.2010.508029)
- https://www.doi.org/10.1007/S10648-014-9249-3 (Fyfe et al. 2014, Concreteness Fading)
- https://cepsj.si/index.php/cepsj/article/download/1238/595 (Torkar 2022, DOI 10.26529/cepsj.1238)
- https://blog.duolingo.com/spaced-repetition-for-learning
- https://blog.duolingo.com/learning-how-to-help-you-learn-introducing-birdbrain
- https://journals.sagepub.com/doi/10.3102/0034654316689306 (Adesope et al. 2017)
- https://news.wsu.edu/news/2018/01/09/educational-psychology-article-among-nations-most-read/
- https://bjjfanatics.com/blogs/news/three-techniques-for-beginners-with-john-danaher
- https://www.gracieuniversity.com/pages/public/information?ip=96
