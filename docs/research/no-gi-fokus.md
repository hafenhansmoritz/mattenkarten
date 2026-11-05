# No-Gi Fokus für Mattenkarten (Kern 2, 7-Tage-Programm)

Stand: 2026-11-05. Recherche zu No-Gi-Curricula, Griffen, Stand, Submissions und Leg-Lock-Regeln, Escapes sowie ein Audit der Karten in `src/core2/data/cards.ts` und der Programmdateien `src/program/questions.ts` und `days.ts`.
Kennzeichnung: [Marketing] = Händler- oder Shopquelle (BJJ Fanatics, BJJ More). [ungeprüft] = kein Primärbeleg oder nur Sekundärquelle.

## 1. No-Gi-Curricula und Reihenfolge für Anfänger

### Takeaway
Respektierte No-Gi-Programme fangen mit **Haltung, Griffen, Grundpositionen und Escapes aus schlechten Positionen** an und bringen erst danach Takedowns, Clinch und einfache Submissions. Danahers „Go Further Faster" beginnt ausdrücklich mit Body Movements und Pin-Escapes. Das jetzige Mattenkarten-Gerüst (erst raus, dann Guard, dann Stand, dann Keile und Aufgabe) passt also auch für No-Gi. Ändern muss sich vor allem der Inhalt der Griffe.

### Cited Findings
- „Go Further Faster" (Danaher), Reihenfolge der Bände: 1) Escape-Grundlagen und Body Movements (Bridge, Shrimp, Schulterrolle), 2) Mount-Escapes (Upa, Elbow Escape), 3) Ankle-Trap-Mount-Escapes, Foot Fighting, Side-Control-Elbow-Escapes, 4) Knee Escapes aus Side Control, 5) Framing und Raum, … 8) Rückenescapes, Turtle-Escapes, Seatbelt kontern. — [BJJ Fanatics GFF](https://bjjfanatics.com/pages/go-further-faster-by-john-danaher) [Marketing]
- Laut derselben Seite baut die Serie auf „fifteen positional skill sets" auf, darunter Guard Retention, Passing und Beinbereiche. Ob die Inhalte Gi oder No-Gi sind, sagt die Seite nicht. — [BJJ Fanatics GFF](https://bjjfanatics.com/pages/go-further-faster-by-john-danaher) [Marketing]
- 10th Planet, Level 1 „No-Gi Fundamentals" (Seite eines Standorts in Van Nuys): „Stance, base, posture, and grips", „Core positions and bad-position escapes", „High-percentage submissions", „Beginner-friendly takedowns and clinch". Eine Reihenfolge wird nicht genannt. Leg Locks („heel hooks, kneebars, toe holds") stehen nur in der All-Levels-Klasse. — [10th Planet Van Nuys](https://10p-van-nuys.pages.dev/adult-jiu-jitsu) [ungeprüft: offenbar keine offizielle HQ-Seite, Domain weicht ab]
- Lachlan Giles (Absolute MMA): In seinem Gym sind Heel Hooks nur erlaubt, wenn beide mindestens Blaugurt haben. Weißgurte lernen die Technik nur, um den Druck zu spüren. — [FloGrappling](https://flograppling.com/articles/6158055-lachlan-giles-explains-the-true-danger-of-heel-hooks)
- Guards, die man zuerst lernt: Closed Guard („Start here"), danach Half Guard als die nachsichtigste offene Guard. Butterfly Guard sei „better in no-gi than most open guard systems". — [Gymdesk Guard Positions](https://gymdesk.com/blog/bjj-guard-positions)
- Danahers Takedown-Kriterien für BJJ (Rücken- und Nackenexposition, Sprawl-Risiko usw.) stehen schon in der Wissensbasis (`docs/knowledge-base.md`, Abschnitt Takedowns).

### Inferences
- **Empfohlene No-Gi-Reihenfolge für 7 Tage** (an `days.ts` angelehnt, gleiche Struktur):
  1. **Positionen, Abklopfen, Regeln** (inklusive „Leg Locks: sofort abklopfen, nicht wegdrehen").
  2. **Raus aus dem Mount** (Upa, Elbow Escape). Funktioniert ohne Gi gleich.
  3. **Raus aus Side Control** (Frame, Shrimp, Underhook auf die Knie). Hinweis: Durch Schweiß wird die Hüfte schneller frei, Pins sind schwerer zu halten.
  4. **Guard oben und unten, No-Gi**: Closed Guard unten mit Kopf- und Nackenkontrolle, Overhook und 2-on-1 statt Kragen und Ärmel. Butterfly Guard als zweite Guard. Oben: Haltung, Kopf hoch gegen die Guillotine. Dazu Technical Stand-up oder Wrestle-up.
  5. **Stand und Hand Fighting**: Auslage, Wrist Control, Collar Tie, Underhook, Snap Down zum Front Headlock, Sprawl. Shots nur als Solo-Drill.
  6. **Rücken und Front Headlock**: Seatbelt, Hooks, RNC (ansetzen und abwehren), Guillotine-Abwehr, Turtle.
  7. **Prüfung**, plus Ausblick auf Monat 1: Arm-Triangle, Kimura-System, Body-Lock-Pass, Leg-Lock-Defense, Straight Ankle Lock mit Trainer.
- In der Gi-Fassung kommen Rücken und Front Headlock nur am Rand vor. Für No-Gi und MMA sind sie zentral: RNC, Guillotine, Turtle und Wrestle-up. [Inferenz aus Abschnitt 5]
- **Kern für den ersten Monat** (Inferenz aus den Quellen oben): Positionen Stand, Clinch, Closed und Butterfly Guard, Half Guard, Side, Mount, Back, Turtle und Front Headlock. Griffe: Wrist Control, 2-on-1, Collar Tie, Underhook und Overhook, Body Lock, Seatbelt, Crossface. Submissions: RNC, Guillotine, Kimura, Armbar, Triangle, Arm-Triangle. Leg Locks nur als Abwehr, Straight Ankle Lock nur mit Trainer.

### Gaps
- Kein offizielles 10th-Planet-Curriculum gefunden (die Inhalte sind meist nur intern oder online für Mitglieder).
- Für Danahers „New Wave"-No-Gi-Fundamentals und Gordon Ryans Anfänger-Reihenfolge habe ich keine Primärquelle mit expliziter Reihenfolge abgerufen. Craig Jones' Anfängertipps wurden nicht geprüft.
- ADCC hat kein Anfänger-Curriculum, nur Regeln (siehe Abschnitt 4).

## 2. No-Gi-Griffe und Hand Fighting

### Takeaway
Ohne Gi greift man **Körperteile**: Handgelenk, Trizeps oder Bizeps, Nacken und Kopf, Unterhaken und Überhaken, Körper. Wichtig ist, **den ersten Griff nicht herzuschenken**, Griffe lösen zu können und lieber locker mitzugehen als fest zu klammern. Alles mit Kragen, Revers, Ärmel, Gürtel oder Hose fällt weg.

### Cited Findings
- Underhook: Anfänger sollen „always go for the underhook". Das öffnet Single und Double Leg und blockiert seinen Level Change. Die stärkere Variante ist der „power underhook" (Hand an seiner Schulter). — [Evolve MMA No-Gi Grip Fighting](https://evolve-mma.com/blog/heres-what-you-need-to-know-about-grip-fighting-in-no-gi-bjj/)
- Collar Tie: Wer ihn zuerst hat, ist im Vorteil. „The body follows wherever the head goes." — ebd.
- Overtie: ein Collar Tie von außen, wenn er schon einen Collar Tie hat. Damit kreist man in neue Winkel. — ebd.
- Wrist Control: am schmalsten Teil des Handgelenks greifen. Der Whizzer (Overhook-Abwehr) blockiert den Underhook. — ebd.
- 2-on-1: Alternative, wenn Einzelgriffe brechen. Stoppt Pässe und bereitet Arm Drag oder Guard-Einstiege vor. — ebd.
- Nicht zu fest greifen: Wer zu stark gegen einen Zug hält, macht es ihm leichter, sich zu lösen. — ebd.
- Grapplearts: Plan für die eigenen Griffe haben, „don't concede the initial grip" sinngemäß, Griffe leicht lösen können. Sequenz „offer the wrist": Er greift dein Handgelenk, du weißt, wo seine Hand ist, löst den Griff und gehst ins 2-on-1. — [Grapplearts No-Gi Gripfighting](https://www.grapplearts.com/no-gi-gripfighting-sequence/)
- Gi-spezialisierte Guards: Spider, Lasso und Worm sind „gi only". De La Riva ist laut Gymdesk „a gi-specialized guard", weil die Kontrolle ohne Ärmel- und Reversgriffe zusammenbricht. — [Gymdesk](https://gymdesk.com/blog/bjj-guard-positions)
- 2-on-1-No-Gi-System von Marcelo Garcia (Review). — [BJJ More](https://bjjmore.com/marcelo-garcia-2-on-1-no-gi/) [Marketing, nicht im Detail gelesen]

### Inferences
- **Fallen weg** (Gi-only): Kragengriffe (Cross Collar, Ezekiel im Gi, Bow and Arrow), Ärmelgriffe (Collar-Sleeve-Guard, Scissor Sweep mit Kragen und Ärmel, Hip Bump „Ärmel sichern"), Hosengriffe (Toreando „Hose greifen"), Gürtelgriffe („eigenen Gürtel greifen" in Side bottom), Spider, Lasso, De La Riva, Worm.
- **No-Gi-Ersatzgriffe** für das Spiel: Handgelenk (Wrist Control), Trizeps oder Ellbogen (Arm Drag), Nacken (Collar Tie), Overhook oder Clamp in der Closed Guard, Underhook, Body Lock (Hände hinter dem Rücken), Seatbelt, Crossface, Front Headlock oder Chin Strap, Knie und Schienbeine beim Passieren.
- Gameplay-Idee: eine Karte „Griff lösen" (Grip Break) als Rahmen-Karte, weil es in No-Gi ständig neue Griffwechsel gibt. [Inferenz]

### Gaps
- Für Seatbelt und Body Lock als No-Gi-Griffe habe ich keine eigene Primärquelle abgerufen. Die bestehenden Karten zitieren schon BJJ More (Back Attacks) und JitsuIQ (Body Lock).

## 3. Stand in No-Gi und MMA

### Takeaway
Für Anfänger sind sicher: **Auslage, Distanz, Hand Fighting, Level Change als Solo-Drill, Sprawl, Snap Down zum Front Headlock**. Echte Takedowns mit Partner (Double und Single Leg, Body Lock Trip, Hüftwürfe) gehören zum Trainer. Lift-and-Dump, Slams, Suplex und Kani Basami sind tabu.

### Cited Findings
- Wissensbasis (schon belegt): Evolve empfiehlt BJJ-Anfängern Ankle Pick, O-Goshi und Double Leg, den Double Leg langsam üben. Body Lock „Lift and Dump" kann ein Slam sein, deshalb als Trip darstellen. Ukemi vor jedem Wurf. — `docs/knowledge-base.md` §5.2 mit [Evolve](https://evolve-mma.com/blog/the-3-best-bjj-takedowns-for-beginners/) und [JitsuIQ Body Lock](https://jitsuiq.com/takedowns/body-lock-takedown.html)
- Slams sind laut IBJJF-Sekundärquelle auf allen Stufen verboten. „Jumping guard" (in die Closed Guard springen) ist für alle Gurte verboten, weil es den Gegner verletzen kann, besonders Anfänger. — [Jiu Jitsu News](https://jiujitsu-news.com/ibjjf-illegal-and-legal-submissions)
- Für Weißgurte nennt die Liste auch eine eingeschränkte Single-Leg-Variante (Text in der Quelle abgeschnitten). — ebd. [ungeprüft, Primärquelle nicht abrufbar]
- Collar Tie zum Kopf steuern („body follows the head") ist die Grundlage für Snap Downs. — [Evolve MMA](https://evolve-mma.com/blog/heres-what-you-need-to-know-about-grip-fighting-in-no-gi-bjj/)

### Inferences
- **Auslage**: Für MMA eher versetzt (staggered, Orthodox oder Southpaw). Im reinen Grappling eher tief und quadratischer, damit beide Beine weniger offen liegen. Die bestehende Karte `nd_outside_foot` (offene Auslage, Schlagvorteil) ist MMA-spezifisch. Für reines No-Gi-Grappling ist sie weniger relevant, aber ok, wenn das Spiel MMA-relevant bleibt. [ungeprüft, keine Primärquelle abgerufen]
- **Sichere Reihenfolge**: Auslage und Distanz → Hand Fighting (Wrist, Collar Tie) → Level Change und Penetration Step solo → Sprawl → Snap Down zum Front Headlock (Gegner landet vorn, du oben) → mit Trainer: Double Leg, Single Leg, Body Lock Trip → später: O-Goshi und andere Hüftwürfe.
- Die Guillotine im Stand oder beim Shot (wenn der Kopf beim Single Leg außen ist) ist das größte Risiko für den Angreifer. In No-Gi ist sie häufiger, weil der Hals frei liegt. Deshalb ist „Kopf innen, Kopf hoch" Pflichtwissen. [Inferenz, deckt sich mit Danahers Kriterium „Nackenexposition" in der KB]
- **Nur mit Trainer**: alle Takedowns mit Partner, Würfe (O-Goshi), Pull Guard (in MMA wegen Schlägen ohnehin schlecht), Guillotine aus dem Stand, Single Leg mit Kopf außen.

### Gaps
- Primärquelle für Stance square vs. staggered im Grappling (z. B. USA Wrestling oder Danaher) wurde nicht abgerufen.

## 4. Submissions für No-Gi-Anfänger und Leg-Lock-Regeln

### Takeaway
RNC, Guillotine, Arm-Triangle, Kimura, Armbar und Triangle sind für Weißgurte erlaubt und bilden den No-Gi-Kern. Für Weißgurte sind bei IBJJF (Gi **und** No-Gi gleich) Heel Hook, Kneebar, Toe Hold, Calf Slicer, Kniedrehhebel und Knee Reaping verboten. Erlaubt ist nur der **gerade Fußhebel (Straight Ankle Lock)**. Heel Hooks sind seit 2021 nur für Erwachsene ab Braungurt in No-Gi legal. Sie sind gefährlich, weil der Schaden schon nach wenigen Zentimetern eintritt, teils bevor es weh tut.

### Cited Findings
- IBJJF, Weißgurt (Gi und No-Gi identisch): verboten sind Kompressionshebel in der Closed Guard, Wristlock, Biceps und Calf Slicer, Kneebar, Toe Hold, Heel Hook, Kniedrehhebel, Knee Reaping, Slams, Wirbelsäulenhebel ohne Würgen, Scissor Takedown (Kani Basami), Fingerhebel, Suplex. Für Braun- und Schwarzgurt gelten Heel Hook, Kniedrehhebel und Reaping als „illegal in Gi, but legal in No-Gi". Der Straight Foot Lock ist für alle Gurte legal. — [Jiu Jitsu News](https://jiujitsu-news.com/ibjjf-illegal-and-legal-submissions) [ungeprüft: Artikel ohne Datum, Primär-PDF nicht abrufbar]
- Primärquelle: IBJJF „Golpes Proibidos" (PDF mit Datum 20240101, EN). Der Abruf ist fehlgeschlagen (Client Error). — [IBJJF Golpes Proibidos 2024](https://www.ibjjf.com/rails/active_storage/blobs/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBcE1WIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--e13c15f6e568323ecea8ef21a102b726067a4540/20240101_GolpesProibidos_EN.pdf) [ungeprüft, manuell prüfen]
- IBJJF-Änderung: ab 1. Januar 2021 dürfen Erwachsene mit Braun- und Schwarzgurt in No-Gi Heel Hooks und Reaping-Verschränkungen nutzen. Kesting: Heel Hooks greifen „the smaller ligaments of the foot and knee" an. — [Grapplearts](https://www.grapplearts.com/implications-of-the-ibjjf-legalising-heel-hooks-and-reaping/)
- Lachlan Giles: Die Folgen einer Knieverletzung sind „considerably worse" als beim Armbar. Für eine Verletzung reichen etwa 2 cm Bewegung der Ferse, beim Armbar sind es etwa 30 cm am Handgelenk. Ist die Ferse gefangen, entsteht Schaden womöglich „even if you decide to tap". Etwa die Hälfte der Heel Hooks, die er im Wettkampf sieht, verletze den Gegner. — [FloGrappling](https://flograppling.com/articles/6158055-lachlan-giles-explains-the-true-danger-of-heel-hooks) [Erfahrungswert, keine Studie]
- Gracie Barra: Leg Locks tun oft kaum weh, bevor ernster Schaden entsteht. Also früh abklopfen, nicht wild drehen oder herauswinden, langsam ansetzen. Anfänger fangen mit Achilles- oder Straight Foot Lock an, Weißgurte sollen keine Inverted Heel Hooks angreifen. — [Gracie Barra Leg Locks in Training](https://graciebarra.com/gb-news/leg-locks-in-training)
- BJJ Atlas: „Tap at 30% of pain threshold, not 80%". Bei Knieschmerz, Druck hinter dem Knie oder Drehgefühl sofort abklopfen. Kommt man in 2–3 Sekunden nicht raus, abklopfen. Verbal tappen, wenn die Hände gefangen sind. Die Boot Position verzögert den Ankle Lock nur. Bein nie isoliert und gestreckt lassen. ACL-Schäden können vor dem Schmerz kommen, Heilung 6–12+ Monate. — [BJJ Atlas Leg Lock Defense](https://bjj-atlas.pages.dev/leg-locks/leg-lock-defense) [Sekundärquelle, ungeprüft]
- Achtung, widersprüchlich: BJJ Atlas beschreibt in Escape-Schritten ein Drehen des Körpers zum Gegner hin, während Gracie Barra vor wildem Drehen warnt. → Für Anfänger gilt im Spiel: **nicht drehen, abklopfen**. Kontrolliertes Drehen bleibt Trainersache.
- Verletzungsepidemiologie: Hinz et al. 2021 (1.140 BJJ-Athleten): Submissions machen 29,7 % der Verletzungen aus, Heel Hook 11 % der Submission-Verletzungen, Knie 27,1 % aller Verletzungen. — [PMC8721390](https://pmc.ncbi.nlm.nih.gov/articles/PMC8721390) (aus der KB)
- Bell, Travis, Jones (2026), UK, 341 Grappler (BJJ, Judo, Catch, Sambo, MMA): Knie am häufigsten verletzt (24,5 %), Bänderzerrungen am häufigsten (24,3 %), 65,8 % im Sparring, vor allem durch Submissions und Takedowns. 49,5 % schwere Verletzungen (>28 Tage). Heel Hooks und Gi vs. No-Gi werden im Abstract nicht aufgeschlüsselt. — [IUSCA Journal](https://journal.iusca.org/index.php/Journal/article/view/537)
- Weitere Studie gefunden, aber nicht lesbar (Captcha): [PMC5954325](https://pmc.ncbi.nlm.nih.gov/articles/PMC5954325) [ungeprüft]

### Inferences
- **Erlaubte No-Gi-Kern-Submissions** (Weißgurt): RNC, Guillotine (frontal), Arm-Triangle, Kimura, Americana, Armbar, Triangle. Für D'Arce und Anaconda (Arm-Triangle-Varianten aus dem Front Headlock) habe ich kein ausdrückliches Weißgurt-Verbot gefunden. Wegen Nackendruck aber erst ab Monat 2 und mit Trainer. [ungeprüft]
- **Regelwerke unterscheiden sich**: Bei ADCC und vielen Submission-only-Events (EBI, 10th-Planet-Turniere) sind Heel Hooks oft schon in Anfängerdivisionen erlaubt. [ungeprüft, keine Primärquelle abgerufen] Das Spiel sollte deshalb die **strengste Regel** (IBJJF Weißgurt) als Standard nehmen und den Rest nur erklären.
- **Spielregeln für Leg Locks**: siehe Bericht, Abschnitt (c).

### Gaps
- Das aktuelle IBJJF-Regelbuch (Version 2025/2026) und das „Golpes Proibidos"-PDF konnte ich nicht abrufen. Vor dem Release manuell prüfen, besonders: Single-Leg-Regel für Weißgurte, Formulierung zur Jumping Guard und ob sich für No-Gi-Blaugurte seit 2024 etwas geändert hat.
- Keine peer-reviewte Studie gefunden, die Heel-Hook-Verletzungen gezielt für Anfänger oder No-Gi ausweist.
- ADCC-Regeln (2024/2026) nicht primär geprüft.

## 5. Escapes und Abwehr in No-Gi

### Takeaway
In No-Gi sind die **Rückenabwehr (RNC), die Front-Headlock- und Guillotine-Abwehr sowie das Aufstehen (Technical Stand-up, Wrestle-up)** wichtiger als im Gi. Ohne Reibung und mit Schweiß wird mehr gescrambelt, Pins halten schlechter, Positionen wechseln schneller. Leg-Lock-Abwehr heißt für Anfänger: Bein gebeugt, nicht isolieren lassen, früh abklopfen.

### Cited Findings
- Danaher GFF ordnet Rücken- und Turtle-Escapes sowie das Kontern des Seatbelts als eigenen Block ans Ende der Escape-Serie. — [BJJ Fanatics GFF](https://bjjfanatics.com/pages/go-further-faster-by-john-danaher) [Marketing]
- Guillotine-Abwehr, RNC-Prävention und Turtle-Escapes sind in den bestehenden Karten bereits mit Quellen belegt: Grapplearts RNC, BJJ More Guillotine, Evolve Turtle. — `cards.ts`, Objekt `K2`
- Bein nie gestreckt und isoliert lassen, Knie beugen, Ferse aus der Achsel ziehen. — [BJJ Atlas](https://bjj-atlas.pages.dev/leg-locks/leg-lock-defense) [ungeprüft]

### Inferences
- Weniger Reibung, schnellere Scrambles: Das ist eine allgemein geteilte Trainererfahrung, im Rahmen dieser Recherche aber nicht mit Studien belegt. [ungeprüft]
- **Abwehr-Prioritäten für das Spiel (No-Gi)**: 1) Hals schützen (Kinn rein, Hände am Hals, Handgelenk-Kontrolle gegen RNC), 2) Rücken nicht geben (Elbow-Knee-Verbindung), 3) Kopf hoch im Clinch und beim Shot (gegen Guillotine und Front Headlock), 4) aufstehen statt liegen (Technical Stand-up, Wrestle-up, wichtig für MMA), 5) Leg-Lock-Abwehr: Bein gebeugt, früh abklopfen.

### Gaps
- Keine Quelle abgerufen, die Escape-Raten Gi vs. No-Gi quantitativ vergleicht.

## 6. Audit: cards.ts, questions.ts, days.ts

### Takeaway
Von 115 Kern-2-Karten sind **8 Karten durch Gi-Griffe falsch beschrieben** (Kragen, Ärmel, Hose, Gürtel). Davon ist eine (Scissor Sweep) im Kern Gi-abhängig und sollte raus. Es fehlen No-Gi-Kernkarten: Butterfly Guard und Sweep, Body-Lock-Pass, Arm-Triangle, 2-on-1 und Arm Drag im Stand, Overhook in der Guard, Wrestle-up, Leg-Lock-Defense, später Straight Ankle Lock. `questions.ts` und `days.ts` sind fast frei von Gi-Inhalten.

### Cited Findings (direkt aus dem Code)
- `cl_collar_tie`: in No-Gi korrekt (Nackengriff, nicht Kragen), Begriff ok. — `cards.ts:144`
- `gt_toreando` keys: „Hosen oder Knie greifen". — `cards.ts:271`
- `gb_break_posture` keys: „Kopf oder Kragen nach unten". — `cards.ts:311`
- `gb_hip_frame` keys: „Hand am Kragen oder an der Schulter". — `cards.ts:329`
- `gb_hip_bump` keys: „Ärmel auf der Sweep-Seite sichern". — `cards.ts:382`
- `hb_back_take` why und keys: „sein Ärmel wird gezogen", „Ärmel über die Mitte ziehen". — `cards.ts:510–512`
- `hb_scissor` keys und mistakes: „Ärmel ziehen", „Ärmel loslassen". — `cards.ts:520ff`
- `scb_protect_arms` plainDo und keys: „Hand am eigenen Gürtel", „Eigenen Gürtel oder Hose greifen". — `cards.ts:678–681`
- `cl_pull_guard`: in No-Gi möglich, in MMA wegen Schlägen ungünstig. — `cards.ts:195`
- `questions.ts:374–376`: Heel-Hook-Frage („für Weißgurte verboten"). Das stimmt auch in No-Gi (IBJJF), sonst keine Gi-Inhalte gefunden.
- `days.ts`: keine Gi-Begriffe. Tag 4 („Guard oben & unten") und Tag 5 („Stand: Auslage, Distanz, Sprawl") sind neutral. Rücken, RNC und Front Headlock fehlen als eigener Tag.

### Inferences: Audit-Tabelle

**Entfernen oder ersetzen**

| Karte | Problem No-Gi | Aktion |
|---|---|---|
| `hb_scissor` Scissor Sweep (HALF_B, angriff, beine) | Klassischer Kragen-Ärmel-Sweep, ohne Gi schwach | **Entfernen**. Ersatz: „Old School Sweep" oder „Dogfight-Sweep" aus Underhook und Knöchelgriff (HALF_B, angriff, zone beine, to half/top oder side/top, 2 Punkte) [Quelle nötig] |

**Umschreiben (Gi-Griffe raus)**

| Karte | Alt | Neu (Vorschlag) |
|---|---|---|
| `gt_toreando` (GUARD_T) | „Hosen oder Knie greifen" | „Knie oder Schienbeine greifen, Beine zur Matte drücken" |
| `gb_break_posture` (GUARD_B) | „Kopf oder Kragen nach unten" | „Kopf oder Nacken runterziehen (Collar Tie), Overhook" |
| `gb_hip_frame` (GUARD_B) | „Hand am Kragen oder an der Schulter" | „Unterarm an Hals oder Schulter (Frame), Hand am Bizeps" |
| `gb_hip_bump` (GUARD_B) | „Ärmel auf der Sweep-Seite sichern" | „Arm auf der Sweep-Seite überhaken (Overhook) oder Handgelenk halten" |
| `hb_back_take` (HALF_B) | „Ärmel ziehen" | „Trizeps über die Mitte ziehen (Arm Drag)" |
| `scb_protect_arms` (SIDE_B) | „eigenen Gürtel oder Hose greifen" | „Hände an Hals oder Brust, Ellbogen zum Knie" |
| `nd_outside_foot` (STAND) | MMA-Schlagkontext, ok | Behalten, aber „im Grappling: tiefe Auslage, Hände vorn" ergänzen [ungeprüft] |
| `cl_pull_guard` (CLINCH) | In MMA riskant | Behalten mit Hinweis „im MMA nicht – dort wird geschlagen", keine Punkte |
| `cl_o_goshi` (CLINCH) | Ohne Gi mit Underhook oder Body Lock möglich | Behalten, keys: „Underhook oder Arm um die Taille" (passt schon), weiter nur mit Trainer |

**Hinzufügen** (Slot, Kind, Zone sind Vorschläge passend zum bestehenden Schema)

| Position | Neue Karte (term) | slot | kind | zone | Hinweis |
|---|---|---|---|---|---|
| stand | Hand Fighting / Wrist Control (Stand) | STAND | rahmen | arme | Griffe lösen, ersten Griff nicht herschenken (Grapplearts, Evolve) |
| stand | 2-on-1 / Arm Drag (Stand) | STAND | angriff | arme | to: back/top oder clinch. Ohne Punkte, solange keine Hooks drin sind |
| stand | Penetration Step | STAND | aufbauen | beine | Optional, mit Level Change zusammenlegbar |
| clinch | Overhook / Whizzer (Stand) | CLINCH | rahmen | arme | Abwehr gegen Underhook und Single Leg (Evolve) |
| clinch | Pummeling (Underhook-Kampf) | CLINCH | aufbauen | arme | Underhook zurückholen |
| clinch | Front Headlock aus dem Snap Down | CLINCH | angriff | kopf | `cl_snap_down` führt vermutlich schon zu turtle/top. Prüfen und so benennen |
| guard bottom | Butterfly Guard (Hooks innen) | GUARD_B | aufbauen | beine | Gymdesk: „better in no-gi" |
| guard bottom | Butterfly Sweep | GUARD_B | angriff | beine | to mount/side top, 2 Punkte (Sweep) |
| guard bottom | Overhook / Clamp | GUARD_B | aufbauen | arme | Ersatz für Ärmelgriff |
| guard bottom | Guillotine (Guard) | GUARD_B | angriff | kopf | submission guillotine. Gegen einen Gegner, der den Kopf senkt |
| guard bottom | Technical Stand-up / Wrestle-up | GUARD_B | rahmen | huefte | MMA-relevant. to: stand |
| guard top | Body Lock Pass | GUARD_T | angriff | huefte | No-Gi-Standardpass [Quelle nötig, z. B. Danaher GFF Passing, BJJ More] |
| guard top | Kopf hoch gegen die Guillotine | GUARD_T | rahmen | kopf | oder in `gt_posture` einbauen |
| guard top | Leg-Lock-Defense (Bein beugen) | GUARD_T | rahmen | beine | Monat 1. BJJ Atlas, Gracie Barra |
| half top | Front Headlock beim Aufkommen | HALF_T | angriff | kopf | Optional, Konter auf `hb_come_up` |
| side top | Arm-Triangle (Kata-Gatame) | SIDE_T | angriff | kopf | Kern-No-Gi-Würger. Auch aus dem Mount möglich |
| mount top | Arm-Triangle (Mount) | MOUNT_T | angriff | kopf | Alternative zu einer Mount-Karte |
| back top | Body Triangle | BACK_T | aufbauen | beine | [ungeprüft] IBJJF-Status prüfen. Erst später |
| back bottom | Zwei Hände am Würgearm (2-on-1) | BACK_B | rahmen | arme | Eventuell schon durch `bb_hand_fight` abgedeckt |
| turtle top | D'Arce / Anaconda | TURTLE_T | angriff | kopf | Nur mit Trainer, ab Monat 2 [ungeprüft: Weißgurt-Status] |
| turtle bottom | Wrestle-up / Hand fighting (Turtle) | TURTLE_B | rahmen | arme | `tb_stand_up` gibt es schon. Ok |
| guard bottom (später) | Straight Ankle Lock | GUARD_B | angriff | beine | Einzige Weißgurt-legale Leg-Lock-Karte. Nur mit Trainer, langsames Ansetzen erzwingen |

- Bei der Back-Punkte-Logik ändert sich in No-Gi nichts: IBJJF-Punkte gelten in Gi und No-Gi gleich [ungeprüft, Punkte stammen aus Sekundärquellen wie in `cards.ts:6`].
- Kommentar in `cards.ts:11` („Cross Collar (nur Gi)") bleibt korrekt. Er sollte um „No-Gi-Fokus: keine Kragen-, Ärmel-, Hosen- oder Gürtelgriffe" ergänzt werden.

### Gaps
- Für Body Lock Pass, Butterfly Sweep, Old School Sweep und Arm-Triangle habe ich keine einzelnen Technikquellen abgerufen. Laut Projektregel braucht jede neue Karte eine Quelle, bis dahin `check: true`.
- Die Zielpositionen (`to:`) von `cl_snap_down` habe ich nicht vollständig geprüft.
