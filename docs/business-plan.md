# Mattenkarten – Business-Recherche und 90-Tage-Plan

Stand: 2026-11-05 · Sprache: Deutsch · Gründer-Standort: Deutschland
Rohnotizen mit allen Quellen: `/home/claude/research_notes/Business Mattenkarten/notes.md`

**Kennzeichnung:** [belegt] = Primär- oder Firmenquelle · [Sekundär] = Blog oder Aggregator · [Schätzung] = Hochrechnung · [ungeprüft] = nicht verifiziert. Alle Umsatzmodelle sind Szenarien mit offengelegten Annahmen, keine Prognosen.

---

## 0. Kurzfazit

1. **Kleiner, gut erreichbarer Markt.** Weltweit trainieren 3 bis 6 Millionen Menschen BJJ (beide Zahlen sind Schätzungen), in DACH grob 30.000 bis 90.000. Die Zielgruppe kauft schon heute Lerninhalte: Gym-Beiträge in Europa liegen im Schnitt bei etwa 100 $ pro Monat, bei BJJ Fanatics kostet ein Instructional im Schnitt etwa 131 $.
2. **Das Kernproblem ist der Anfänger-Churn.** Laut Gymdesk kündigt fast jedes fünfte neue Mitglied in den ersten 90 Tagen. Für Gyms bedeutet das direkten Umsatzverlust. Hier liegt der stärkste B2B-Hebel.
3. **Wettbewerb:** Die Nische „gamifiziertes BJJ-Lernen“ ist 2026 belegt, aber von kleinen Anbietern. Underhook (Szenarioquiz, Streaks, 49,99 $ pro Jahr) ist der engste Wettbewerber. BeJJ, ein BJJ-Kartenspiel, hat seit 2021 nur 4.700 Installationen und 3,5 Sterne. **Ein deutschsprachiges Produkt, ein Battle-Card-Spiel mit korrekter Positionslogik inklusive Standkampf oder ein Trainer-/Gym-Modus wurde nicht gefunden.**
4. **Realistisch für Jahr 1:** ein vier- bis niedriger fünfstelliger Euro-Betrag (Szenarien: ca. 2.000 € konservativ, 15.000 € mittel, 55.000 € optimistisch; siehe Abschnitt 7), davon am ehesten Gym-Lizenzen und Partnerschaften, nicht B2C-Abos. Mattenkarten ist zunächst ein Nebenprojekt oder ein Portfolio-Produkt, keine Vollzeit-Finanzierung.
5. **Empfehlung:** PWA zuerst, kostenlos und ohne Paywall bis zur Aktivierung. In 90 Tagen 10 Pilot-Gyms in DACH gewinnen und die Zahlungsbereitschaft testen, bevor Abo und App-Store kommen.

---

## 1. Markt und Zielgruppe

### 1.1 Praktizierende

| Segment | Zahl | Quelle / Datum | Qualität |
|---|---|---|---|
| BJJ weltweit | ca. 6 Mio. | [Gold BJJ](https://goldbjj.com/blogs/roll/statistics), 2025/26 | [Schätzung], ohne Methode |
| BJJ weltweit (konservativ) | ca. 2,9 Mio. | [AskWonder](https://askwonder.com/research/people-practice-brazilian-jiu-jitsu-grappling-globally-zk9hgvroz), Hochrechnung über IBJJF-Schwarzgurte, undatiert | [Schätzung], laut Autor „a little high“ |
| BJJ USA | ca. 750.000 bzw. 500.000–1 Mio. | Gold BJJ; [BJJ More](https://bjjmore.com/bjj-statistics/) (Gyms × 50–100 Mitglieder) | [Schätzung] |
| Kampfsport USA gesamt | 6,61 Mio. (2023, +4 %) | SFIA 2024, zitiert bei [Gymdesk](https://gymdesk.com/blog/martial-arts-industry-statistics) | [Sekundär] |
| MMA (Wettkampf) USA | 1,16 Mio. | SFIA 2024 via Gymdesk | [Sekundär] |
| Boxen/MMA Fitness USA | 8,4 Mio. (2023, −14 %) | SFIA 2024 via Gymdesk | [Sekundär] |
| Kampfsport DE (mind. gelegentlich) | 6 % der Befragten | [Statista](https://de.statista.com/infografik/amp/30656/umfrage-zu-interesse-und-ausuebung-von-mixed-martial-arts), Aug. 2023 | [belegt], aber Umfrage |
| Vergleich DE-Verbände | Judo 129.703, Karate 155.335 (2025); Ringen 70.204, Ju-Jutsu 49.909 (2024) | [DOSB-Spitzenverbandszahlen 2025](https://www.basketball-bund.de/wp-content/uploads/sites/2/2025/11/spitzenverbaendezahlen2025.pdf) | [belegt] |

**DACH-BJJ, eigene Herleitung [Schätzung]:** Das Verzeichnis Rollbook indexiert 440 Gyms in Deutschland, 138 in der Schweiz und 49 in Österreich, zusammen 627 ([Rollbook](https://rollbook-web-86q.pages.dev/gyms/)). Der Index ist sichtbar unvollständig (Rheinland-Pfalz hat nur 2 Gyms) und daher eine Untergrenze. Mit der Annahme von 800–1.200 BJJ-anbietenden Gyms und Abteilungen und 40–80 aktiven Mitgliedern je Gym ergeben sich **etwa 30.000–90.000 BJJ-Praktizierende in DACH**. MMA-only und Kampfsport-Interessierte ohne Gym (die eigentliche Zielgruppe „vor dem ersten Training“) kommen hinzu. Eine amtliche Zahl gibt es nicht, weil BJJ in Deutschland nicht über den DOSB organisiert ist. Der deutsche Verband (BJJBD) ist zudem umstritten, etwa durch den Checkmat-Boykott ([BJJ Heroes](https://www.bjjheroes.com/bjj-news/checkmat-vetoes-german-bjj-federation)).

### 1.2 Gyms und Affiliations

- **USA:** 76.364 Kampfsportstudios im Jahr 2026, ein Plus von 6 % gegenüber 2025 (IBISWorld via [Gymdesk](https://gymdesk.com/blog/martial-arts-industry-statistics)). Davon sind etwa 10.000 BJJ-Gyms (Schätzung von [BJJ More](https://bjjmore.com/bjj-statistics/), leicht überhöht).
- **Rollbook-Index:** 8.323 Gyms in 12 Ländern (US 4.030, BR 1.180, UK 445, DE 440).
- **Affiliations** (Gymdesk-Blog, März 2026, Zahlen ohne Stichtag): Gracie Barra 700+, Alliance 300+, Carlson Gracie Team 323, Gracie Humaitá 200+, Gracie Academy 150+ ([Gymdesk](https://gymdesk.com/ja/blog/bjj-organizations)). Diese Netzwerke sind die Hebel für White-Label.
- **Preise:** Der Beitrag liegt in den USA im Schnitt bei 146 $, in Europa bei 101 $ pro Monat ([Gold BJJ](https://goldbjj.com/blogs/roll/statistics)). Für Bayern nennt Rollbook im Schnitt 73 € pro Monat.
- **Gym-Umsatz:** Ein Gym mit 50–99 Mitgliedern setzt im Schnitt etwa 6.900 $ pro Monat um ([Gymdesk Benchmark 2026](https://gymdesk.com/gym-benchmark-report), 4.594 Gyms).

### 1.3 Anfänger-Churn: das Problem, das Mattenkarten lösen kann

| Kennzahl | Wert | Quelle | Qualität |
|---|---|---|---|
| Kündigungen in den ersten 90 Tagen | „nearly one in five“ | [Gymdesk Benchmark 2026](https://gymdesk.com/gym-benchmark-report) | [belegt], Firmendaten |
| Laufender Churn | 2–3,5 % pro Monat, Spitze im Januar | ebd. | [belegt] |
| Kündigung über 24 Monate | 44,2 % bei Seltentrainierenden vs. 23,2 % bei 3×/Woche | ebd. | [belegt] |
| Kündigungen in 90 Tagen (Praxiswert) | ~50 % | [Gymdesk-Blog](https://gymdesk.com/blog/bjj-student-onboarding) | [ungeprüft], ohne Quelle |
| Weißgurte, die nie Blau erreichen | 70–90 % | ebd., Rener Gracie zugeschrieben | [ungeprüft], anekdotisch |
| Onboarding-Effekt | 4+ Touchpoints → 87 % nach 6 Monaten aktiv | Bedford, zitiert bei Gymdesk | [Sekundär] |

**Lesart:** Zwischen „Vertrag gekündigt“ (etwa 20 % in 90 Tagen) und „nie Blaugurt“ (70–90 %) liegt ein großer Unterschied, je nachdem wie gemessen wird. Für das Verkaufsargument an Gyms zählt die belegte Zahl. Rechenbeispiel [Schätzung]: Ein Gym mit 15 Neuanmeldungen pro Quartal verliert davon etwa 3. Bei 80 € Beitrag und 12 weiteren Monaten Verweildauer sind das rund 2.900 € Umsatz. Hält Mattenkarten **ein einziges** Mitglied pro Jahr, ist eine Lizenz für 20 € pro Monat bezahlt. Ob die App diesen Effekt wirklich hat, ist unbelegt und muss im Pilot gemessen werden.

### 1.4 App-Markt

- „Martial Arts Software“ ist 2025 etwa 1,8 Mrd. $ groß, mit 11 % jährlichem Wachstum ([Dataintelo](https://dataintelo.com/report/martial-arts-software-market)). Die Zahl stammt aus einem Marktforschungs-Standardbericht, ist mit Vorsicht zu lesen und umfasst vor allem Gym-Verwaltungssoftware.
- Für einen „BJJ-Lern-App-Markt“ gibt es keine belastbare Zahl. Als Ersatzindikator für die Zahlungsbereitschaft dient BJJ Fanatics: Laut [EcomScout](https://ecomscout.com/stores/bjjfanatics.com) (Juni 2026, Drittschätzung) setzt die Plattform 3,1–7,5 Mio. $ pro Monat um.
- Reichweite der Community: r/bjj hat etwa 939.000 Mitglieder ([Hive Index](https://thehiveindex.com/communities/r-bjj/), Okt. 2026). B-Team hat 491.000 YouTube-Abonnenten ([CreatorDB](https://creatordb.app/creatorstats/bteamjiujitsu/), Sept. 2026).

---

## 2. Wettbewerber und Vergleichsprodukte (2025/2026)

### 2.1 Lernplattformen für Videos und Inhalte

| Anbieter | Modell | Preis | Positionierung | Lücke für Mattenkarten |
|---|---|---|---|---|
| **BJJ Fanatics** | Einzelkauf (MP4), Insiders Club | Ø 131 $ pro Titel, Club 9,99–19,99 $/Monat; 3.393+ Titel ([BJJ More, März 2026](https://bjjmore.com/bjj-fanatics-vs-submeta-vs-grapplers-guide/)) | Marktführer, Fortgeschrittene, Star-Instruktoren | Für absolute Anfänger zu viel, kein Spiel, Englisch |
| **Submeta** | Abo pro Instruktor | Lachlan Giles 25 $/Monat bzw. 239,40 $/Jahr; B-Team 12,99 $/Monat | Systematik für Ambitionierte | wie oben |
| **Grapplers Guide** | Einmalzahlung | 297 $ | Bibliothek | Veraltet, kein Spiel |
| **Gracie University** | Gratis-Basis, bezahlte Programme, Video-Evaluation; Gürtel nur in Certified Centers | aktuelle Preise [ungeprüft] ([bjjee, 2018](https://www.bjjee.com/gear-review/gracie-university-review-pros-cons-online-academy/)) | Curriculum (Combatives), Selbstverteidigung | Video-lastig, kein Spiel, markenrechtlich geschützt |
| **BJJ Roadmap** (Grapplearts) | Free + IAP | 3,99 $ je Position, 13,99 $ alles; 3,9 Sterne (62 Bewertungen); letztes Update Juli 2024 ([App Store](https://apps.apple.com/us/app/bjj-roadmap/id864289023?l=en)) | Anfänger-Positionsguide | Statisch, kaum gepflegt |

### 2.2 KI- und Lern-Apps (direkte Wettbewerber)

| App | Modell | Preis | Traktion | Bewertung |
|---|---|---|---|---|
| **Underhook** | Freemium, Szenarioquiz Weiß→Blau, Streaks, Stamina, 12 Gym-Rivalen, KI-Rivale | Pro 7,99 $/Monat, 49,99 $/Jahr, 99,99 $ Lifetime; 3 Tage Pro gratis ([App Store](https://apps.apple.com/app/id6760555653)) | 9 Bewertungen, 5,0 Sterne | **Engster Wettbewerber.** Das „Duolingo für BJJ“-Konzept ist also schon besetzt. Abgrenzung über Battle-Card-Spielgefühl, Standkampf, Deutsch und Gym-Modus |
| **SmartBJJ** | KI-Videoanalyse eigener Rolls | Pro 9,99 $/Monat; Master 24,99 $; **Coach 99,99 $/Monat bzw. 929,99 $/Jahr**; Credits 2,99–12,99 $ ([App Store](https://apps.apple.com/us/app/smartbjj/id6760728034)) | 4 Bewertungen | Zielt auf Fortgeschrittene, die filmen. Der Coach-Preis zeigt, dass B2B-Preise im dreistelligen Bereich verlangt werden |
| **Ground CTRL: BJJ** | iOS, KI-Coach-Fragen | [ungeprüft], Store-Seite nicht abrufbar | – | Laut Projekt-Recherche: „Fragen an deinen Coach“ |
| **Brain-Jiu-Jitsu**, **Grapla**, **Jiujify** | Mind Map/Knowledge Graph, Journal, Streaks | kostenlos bzw. Bezahlmodell | jeweils unter 1.000 Downloads bzw. 5–19 Bewertungen | Viele Ein-Personen-Apps, wenig Traktion |

### 2.3 Spiele

| Produkt | Fakten | Lehre |
|---|---|---|
| **BeJJ: Jiu-Jitsu Game** (Smash Mountain, BR) | Kartenspiel mit Technikkarten, Online-PvP, Free + Werbung + IAP, Early Access seit 2021; 4.700 Installationen, 3,47 Sterne (93 Bewertungen) ([AppGoblin](https://appgoblin.info/apps/1352005603)) | Ein „BJJ-Kartenspiel“ allein trägt nicht. Ohne Didaktik und Pflege bleibt es eine Nische |
| **GrappleApp** (Android 2018–2021) | 3,0 Sterne, nicht mehr im Store ([Skich](https://skich.app/games/grappleapp-the-jiu-jitsu-gam)) | Kurzlebig |
| Physische Decks (Kickstarter „Open Mat“, „Laundry Pile BJJ Cards“, „Let's Roll Combat Training Deck“, „Roll N' Pin“) | Merch-Nische | Möglicher Print-Ableger, kein Kerngeschäft |
| **EA UFC / EA Mobile Sports** | EA-Mobile-Sporttitel über 1 Mrd. $ Lifetime-Umsatz ([Sensor Tower](https://sensortower.com/blog/ea-sports-mobile-revenue-1-billion)) | Unterhaltung mit Lizenzbudget, kein didaktischer Wettbewerber |

### 2.4 Das Modell Duolingo

Duolingo kam im dritten Quartal 2025 auf 50,5 Mio. tägliche und 135,3 Mio. monatliche Nutzer, 11,5 Mio. Zahlende, **9,0 % Zahlungsquote** und 271,7 Mio. $ Quartalsumsatz ([SEC 8-K](https://www.sec.gov/Archives/edgar/data/1562088/000162828025049514/q3fy25duolingo9-30x25share.htm)). Die 9 % sind ein Spitzenwert nach mehr als zehn Jahren Optimierung. Für eine Nischen-App sind 2–5 % realistisch [Schätzung].

### 2.5 Positionierung und Lücken

Kein gefundenes Produkt kombiniert diese fünf Punkte:
1. echtes **Battle-Card-Spielgefühl** (gleichzeitiges Aufdecken, Deckbau, Gürtel-Kampagne),
2. **korrekte Kampfkette inklusive Standkampf** (Stances, Distanz, Clinch, Takedown, Sprawl),
3. **Sicherheit als Spielmechanik** (Tap- und Loslass-Moment, verbotene Techniken als Regel-Lektion),
4. **Deutsch und einfache Sprache**,
5. einen **Trainer-/Gym-Modus** (Hot-Seat, Hausaufgaben, Gym-Liga).

**Positionierungssatz (Vorschlag):** „Mattenkarten ist das Vorbereitungsspiel fürs erste Training. Du lernst die Kampfkette, bevor du sie auf der Matte spürst, und dein Gym sieht, wer dranbleibt.“

---

## 3. Monetarisierung: Optionen, Vor- und Nachteile, Benchmarks

| # | Option | Benchmark | Pro | Contra | Einschätzung |
|---|---|---|---|---|---|
| A | **Freemium + Premium-Inhalte** (Weißgurt gratis, ab Blau, Puzzle-Packs, MMA-Modul) | BJJ Roadmap 3,99 $ je Paket, 13,99 $ alles | einfach, fair, kein Abo-Frust | geringer Kundenwert, braucht Volumen | gut als Einstieg |
| B | **Abo** (Premium plus KI-Coach-Kontingent) | Underhook 7,99 $/Monat bzw. 49,99 $/Jahr; SmartBJJ 9,99 $/Monat bzw. 93,99 $/Jahr; Submeta 12,99–25 $/Monat | wiederkehrend, deckt KI-Kosten | Abo-Müdigkeit, Wettbewerber billig, kleiner DACH-Markt | ab Monat 4–6 testen: 3,99 €/Monat bzw. 29–39 €/Jahr |
| C | **Gym-/Trainer-Lizenz (B2B)** | Gymdesk 75–200 $/Monat, White-Label-App +100 $; Zen Planner Branded App +39 $ ([Gymdesk, Aug. 2026](https://gymdesk.com/blog/zen-planner-review)); SmartBJJ Coach 99,99 $/Monat | belegter Schmerz (Churn), höherer Kundenwert, Gyms bringen Endnutzer mit | lange Sales-Zyklen, Support, Gym-Inhaber sind preissensibel | **stärkster Pfad**: 15–39 €/Monat pro Gym |
| D | **White-Label für Affiliations/Instruktoren** (eigenes Branding, eigenes Curriculum als Kartenset) | Gracie Barra 700+ Schulen, Alliance 300+ | großer Hebel je Abschluss | wenige Entscheider, Markenrecht, Individualisierungsaufwand | ab Monat 6+, opportunistisch |
| E | **Kosmetische Skins** (Kartenrahmen, Matten-Themes, Gi-Farben) | – | passt zum Spiel, kein Pay-to-win | geringer Umsatz bei kleiner Basis; **rechtliche Leitplanken** (s. u.) | nur Direktkauf, kleiner Zusatz |
| F | **Sponsoring durch Gi-/Equipment-Marken** (Sponsored Card Set, Gi-Skin der Marke X) | keine belastbaren Preisdaten gefunden | passt zur Community, keine Nutzerkosten | erst ab Reichweite (≥ 5.000 MAU) interessant; Glaubwürdigkeit | ab Monat 6+, in Naturalien oder kleinem Budget |
| G | **Instruktoren-Partnerschaften / Affiliate** (Link „Vertiefe das bei Instruktor X“, Rev-Share) | BJJ Fanatics: Instruktoren-Split geschätzt 40–60 % für Top-Namen ([BJJ More, Mai 2026](https://bjjmore.com/bjj-net-worth/), unbestätigt); Affiliate-Raten [ungeprüft] | Glaubwürdigkeit (Coach-Validierung) plus Reichweite | Abhängigkeit, Markenfreigaben nötig | lokale DACH-Schwarzgurte als Validierer und Ko-Autoren |
| H | **Turniere/Events** (Gym-Liga, Event-Challenge am Turnierstand) | – | Community-Effekt, Sichtbarkeit | kaum direkter Umsatz | Marketing, kein Erlös |

### 3.1 Leitplanken für Kosmetik und Käufe (EU/DE)

- **Belgien:** Die Glücksspielkommission stuft bezahlte Lootboxen seit 2018 als illegales Glücksspiel ein. **Niederlande:** Verbot 2018 bei übertragbaren Items. Die Rechtslage wurde später teils relativiert, die NL drängt auf ein EU-Verbot ([Programming Insider, 2026](https://programminginsider.com/loot-boxes-regulation-and-where-the-line-sits-in-2026/)). Die Quellen sind in den Details nicht einheitlich.
- **Deutschland:** Seit der JuSchG-Novelle von 2021 berücksichtigt die USK seit dem 1.1.2023 Kaufmöglichkeiten bei der Altersfreigabe und vergibt Hinweise wie „In-Game-Käufe“ ([mobiFlip](https://www.mobiflip.de/shortnews/in-game-kaeufe-und-lootboxen-usk-erweitert-pruefkriterien/)).
- **EU:** Das CPC-Netzwerk hat im Oktober 2026 eine koordinierte Aktion gegen neun Spielefirmen gestartet. Die „Key Principles“ verlangen unter anderem Echtgeldpreise, keine verschleiernden Mehrfachwährungen und 14 Tage Widerruf ([Lewis Silkin, 15.10.2026](https://www.lewissilkin.com/insights/2026/10/15/eu-consumer-protection-network-launches-action-involving-nine-video-games-compani-102o5do)). Der **Digital Fairness Act** soll im 4. Quartal 2026 vorgeschlagen werden, ein Entwurf lag im August 2026 noch nicht vor ([Heuking, 5.8.2026](https://www.heuking.de/en/news-events/newsletter-articles/detail/digital-fairness-act-implementation-obligations-companies-need-to-prepare-for.html)).
- **Konsequenz für Mattenkarten:** keine Zufallsbelohnungen gegen Geld, keine Zwischenwährung, Preise in Euro, benannte Items im Direktkauf, Kündigung mit einem Klick, keine FOMO-Timer für Minderjährige. Das deckt sich mit der Design-Spec („Belohnungen deterministisch … keine Lootboxen“).

### 3.2 Store-Gebühren

Apple (Small Business Program) und Google Play nehmen für kleine Entwickler und Abos jeweils 15 % ([MacRumors](https://www.macrumors.com/2020/11/18/apple-drops-app-store-fees/)). Eine PWA mit Web-Checkout (z. B. Stripe oder Paddle als Merchant of Record) spart diese Gebühr, verzichtet aber auf die Store-Auffindbarkeit.

---

## 4. Go-to-Market

### 4.1 Kanäle (Reihenfolge nach erwartetem Aufwand-Nutzen-Verhältnis)

1. **Gyms in DACH (direkt).** 627 indexierte Adressen bei Rollbook. Die Ansprache läuft über die Probetrainings-Strecke: „Schick Neulingen nach dem Probetraining diesen Link.“ Ein QR-Code-Poster an der Matte, Hot-Seat-Modus für Kids- und Anfängerkurse. Ziel: 10 Pilot-Gyms.
2. **Lokale Coaches als Validierer.** 2–3 Schwarz- oder Braungurte prüfen die Karteninhalte. Sie stehen namentlich als Fachprüfer in der App und teilen das Spiel. Das schafft Glaubwürdigkeit und Reichweite zugleich.
3. **Instagram Reels / TikTok** mit Formaten wie „Welche Karte spielst du?“ (Puzzle aus einer Position, Auflösung im nächsten Clip) und „Fehlerkarte der Woche“. Deutschsprachige BJJ- und MMA-Creator im Mikrosegment (5.000–50.000 Follower) machen Kooperationen gegen Freizugang oder kleine Fixbeträge.
4. **Reddit r/bjj (rund 939.000 Mitglieder)**: nur mit englischer Version, als „Show & Tell“ eines Indie-Projekts mit Bitte um Feedback, nicht als Werbung. Die Subreddit-Regeln vorab prüfen.
5. **YouTube**: Devlog oder Erklärvideo „Die Kampfkette in 5 Minuten“ als Evergreen-Inhalt.
6. **Turniere** (z. B. Stände bei regionalen Opens, ADCC German Open 2026): QR-Challenge „Schlag den Weißgurt-Boss“.

### 4.2 App-Store vs. PWA

| | PWA (Start) | Store-App (später) |
|---|---|---|
| Kosten/Gebühren | keine Review-Hürde, 0 % Store-Gebühr | 15 % Gebühr, Review-Aufwand |
| iOS-Push | erst ab iOS 16.4 und nur nach „Zum Home-Bildschirm“ ([edana, März 2026](https://edana.ch/en/2026/03/19/push-notifications-on-web-applications-pwa-is-it-really-reliable-on-ios-and-android/)) | nativ |
| Auffindbarkeit | über Link, QR-Code und Gym | Store-Suche |
| Risiko | Reibung bei der Installation | Apple 4.2 lehnt reine Web-Wrapper ab; nötig sind Offline-Fähigkeit und native Navigation ([technetexperts, Juli 2026](https://www.technetexperts.com/guideline-4-2-minimum-functionality/)) |

**Empfehlung:** In den ersten 90 Tagen nur PWA, mit Offline-Kartenset, damit sich ein späterer Wrapper (Capacitor) gegen 4.2 behaupten kann. Die Store-Version erst, wenn D7 ≥ 12 % erreicht und ein Abo-Test positiv ist.

### 4.3 Preisexperimente

1. **Woche 6–10:** Fake-Door-Test mit dem Button „Blaugurt-Kampagne freischalten“, der zu einer Warteliste und Preisfrage führt (3,99 €/Monat vs. 29 €/Jahr vs. 9,99 € einmalig).
2. **Gyms:** drei Preisanker im Gespräch (0 € Pilot → 19 €/Monat → 39 €/Monat mit Gym-Branding und Statistik). Gemessen wird, wer nach 30 Tagen Pilot eine Absichtserklärung (Letter of Intent) unterschreibt.
3. Van-Westendorp-Kurzumfrage unter aktiven Nutzern ab 200 Antworten.

### 4.4 Kennzahlen

| Kennzahl | Definition | Ziel nach 90 Tagen | Benchmark |
|---|---|---|---|
| **Aktivierung** | Anteil neuer Nutzer, die **Tutorial 3 abschließen** | ≥ 40 % | eigener Zielwert |
| D1-Retention | an Tag 1 zurück | ≥ 30 % | Mobile-Games-Median etwa 22 %, Top 10 % etwa 40 % ([GameAnalytics via InvestGame, 2026](https://investgame.net/wp-content/uploads/2026/01/2026-01-20-Mobile_retention_benchmarks_2026.pdf)) |
| D7-Retention | an Tag 7 zurück | ≥ 10 % | Median etwa 4 %, Top 10 % etwa 12 % |
| D30-Retention | an Tag 30 zurück | ≥ 3 % | Median etwa 0,7 %, Top 10 % etwa 4 % |
| Mattentransfer | Anteil, der eine Matten-Aufgabe als „erledigt“ markiert | ≥ 15 % der Aktiven | eigener Zielwert |
| Gym-Aktivierung | Pilot-Gyms mit ≥ 5 aktiven Schülern | 6 von 10 | eigener Zielwert |
| Zahlungsabsicht | Klickrate auf den Fake-Door-Button | ≥ 5 % der Aktiven | eigener Zielwert |
| KI-Kosten | € je aktivem Nutzer und Monat | ≤ 0,10 € | Kostendeckel |

Für die Messung ist cookielose, selbst gehostete Statistik ohne Drittanbieter-Profil vorzuziehen (siehe 5.5).

---

## 5. Risiken

### 5.1 Haftung und Sicherheit
- **Risiko:** Ein Nutzer probiert eine Technik ohne Aufsicht aus und verletzt sich oder andere.
- **Maßnahmen:** Ein Hinweis bei jedem Start und vor jeder Matten-Aufgabe: „Ersetzt kein Training mit qualifiziertem Coach.“ Matten-Aufgaben nur als „im Training mit Partner und Coach“ formulieren. Gefährliche Techniken (Slam, Neck Crank, Heel Hook, Kani Basami) erscheinen nur als Regel-Lektion, wie in der Spec vorgesehen. Würgegriffe werden nie mit „bis zum Ende ausführen“ beschrieben. Tap und Loslassen sind Pflichtmechaniken. SmartBJJ verwendet einen vergleichbaren Hinweis („not a replacement for qualified instruction“).
- **Rechtlich:** Haftung für leichte Fahrlässigkeit lässt sich gegenüber Verbrauchern nur begrenzt ausschließen (AGB-Recht). Für Körperschäden ist ein Ausschluss unwirksam [Eigenwissen, anwaltlich prüfen]. Ein kostenloses Angebot senkt das Risiko, hebt es aber nicht auf. Ab Bezahlmodell eine Betriebshaftpflicht- bzw. Vermögensschadenversicherung prüfen.

### 5.2 Marken und geistiges Eigentum
- „Gracie“ und „Gracie Jiu-Jitsu“ sind markenrechtlich umkämpft ([Gracie-Markenstreit](https://www.iptrademarkattorney.com/trademark-attorney-rorion-gracie-jiu-jitsu-trademark-infringement-black-silver-mma/)). Daher keine Namen von Instruktoren oder Teams, keine Logos von IBJJF, UFC, ADCC und keine Begriffe wie „Gracie Combatives“ in Kartentiteln oder im Marketing ohne Lizenz.
- Gattungsbegriffe für Techniken (Armbar, Kimura, Triangle) sind frei. Für Punktwerte nur die neutrale Formulierung „nach gängigem Wettkampf-Regelwerk“ verwenden und das IBJJF-Logo vermeiden.
- Die In-App-Gürtel klar als **Spielränge, keine echte Graduierung** ausweisen (die IBJJF hat kein verbindliches Weißgurt-Curriculum; graduiert wird durch den Lehrer).
- Die eigene Marke „Mattenkarten“ vor Launch im DPMA/EUIPO-Register recherchieren und Domains sichern.

### 5.3 App-Store-Richtlinien
- Apple 4.2 (Minimum Functionality) betrifft Web-Wrapper (siehe 4.2). Für kostenpflichtige Inhalte in der Store-App greift die Pflicht zur In-App-Purchase-Abrechnung nach Apple-Richtlinie 3.1.1 [Eigenwissen]. Altersfreigabe ehrlich angeben (Kampfsport-Inhalte, KI-Chat).

### 5.4 Fachliche Richtigkeit
- Fehler in Technikbeschreibungen kosten bei der Zielgruppe sofort Glaubwürdigkeit (Coaches sind die Multiplikatoren).
- **Maßnahmen:** Jede Karte trägt Quelle und Fachprüfer. Der vorhandene `check`-Status wird sichtbar gemacht. Pro Release prüfen zwei unabhängige Coaches. In-App-Button „Fehler melden“. Der KI-Coach antwortet nur aus der geprüften Wissensbasis (Retrieval mit Leitplanken; vgl. die Projekt-Recherche zu Bastani et al. 2025).

### 5.5 Recht in Deutschland und der EU
- **Impressum:** Pflicht nach § 5 DDG (seit Mai 2024 statt § 5 TMG) [Eigenwissen]. Bei Einzelunternehmer ladungsfähige Anschrift angeben, ggf. eine Geschäftsadresse nutzen.
- **DSGVO und TDDDG:** Endgerätezugriffe (Cookies, localStorage für Tracking) brauchen eine Einwilligung, außer sie sind unbedingt erforderlich (§ 25 TDDDG). Spielstand im localStorage ist erforderlich, Tracking nicht. Selbst gehostete, cookielose Statistik ohne Drittanbieter kann ohne Einwilligung zulässig sein; die Aufsichtsbehörden bewerten das aber uneinheitlich ([Dr. Datenschutz](https://www.dr-datenschutz.de/webanalyse-datenschutz-nutzerstatistiken-ohne-einwilligung/)). Dazu gehören eine Datenschutzerklärung und ein Verzeichnis der Verarbeitungstätigkeiten.
- **KI-Coach:** Wer einen US-LLM-Anbieter nutzt, braucht einen Auftragsverarbeitungsvertrag, einen Drittlandtransfer über das EU-US Data Privacy Framework oder Standardvertragsklauseln und muss Datenminimierung beachten (keine Namen oder Gesundheitsdaten in Prompts). Der **EU AI Act Art. 50** gilt seit dem 2.8.2026: Nutzer müssen erkennen, dass sie mit einer KI interagieren ([Baker Botts, Sept. 2026](https://www.bakerbotts.com/thought-leadership/publications/2026/september/eu-ai-act-article-50-transparency-obligations-go-live)). Das ist mit dem Label „KI-Coach“ und einem kurzen Hinweis lösbar.
- **Minderjährige:** Trainer-/Hot-Seat-Modus in Kids-Kursen ohne Konten für Kinder, ohne Chat und ohne Käufe. Einwilligungsfähigkeit für Datenverarbeitung nach Art. 8 DSGVO in Deutschland erst ab 16 Jahren [Eigenwissen].
- **Verbraucherrecht bei Abos:** Kündigungsbutton (§ 312k BGB), Widerrufsbelehrung für digitale Inhalte [Eigenwissen]. Ein Merchant of Record (Paddle o. ä.) übernimmt die Umsatzsteuer-Abwicklung (OSS).
- **Steuer/Gewerbe:** Gewerbeanmeldung ab Umsatzabsicht. Kleinunternehmerregelung bis 25.000 € Vorjahresumsatz (seit 2025) [Eigenwissen, steuerlich prüfen].

### 5.6 Marktrisiken
- **Kleiner DACH-Markt:** Für nennenswerten B2C-Umsatz ist Englisch nötig. Dort konkurriert Mattenkarten mit Underhook und Co.
- **Kopierbarkeit:** Ein Quiz- oder Streak-Konzept ist leicht nachzubauen. Der Burggraben liegt in Spielmechanik, geprüften Inhalten und Gym-Beziehungen.
- **Kompetenzillusion:** Wenn Gyms Mattenkarten als Ersatz fürs Training wahrnehmen, empfehlen sie es nicht. Deshalb konsequent als Ergänzung positionieren, mit der Matten-Aufgabe als Brücke.

---

## 6. 90-Tage-Plan

**Annahmen:** ein Gründer, etwa 10–15 Stunden pro Woche, Budget unter 1.500 € (Domain, Hosting, LLM-API, Rechtstexte-Generator, Druck von QR-Postern, eventuell Markenrecherche). Start am 10.11.2026.

### Phase 1: Fundament (Tag 1–30, bis ca. 10.12.2026)
- [ ] Weißgurt-Kampagne mit Tutorial 1–3 spielbar als PWA, offline-fähig, Deutsch.
- [ ] Rechtliches Minimum: Impressum, Datenschutzerklärung, Sicherheitshinweis, KI-Kennzeichnung, cookielose Statistik. Kennzahlen-Ereignisse: Tutorial 1/2/3 abgeschlossen, D1/D7, Matten-Aufgabe erledigt.
- [ ] Markenrecherche „Mattenkarten“ bei DPMA/EUIPO, Domains sichern.
- [ ] 2 Coaches (Braun-/Schwarzgurt) als Fachprüfer gewinnen; Kartenset Weißgurt prüfen lassen.
- [ ] Liste von 50 DACH-Gyms (Rollbook plus eigenes Netzwerk), 20 persönlich anschreiben.
- **Meilenstein M1:** 50 Testnutzer, Aktivierung (Tutorial 3) gemessen, 2 Coaches namentlich in der App.

### Phase 2: Pilot (Tag 31–60, bis ca. 9.1.2027)
- [ ] Trainer-/Hot-Seat-Modus minimal: Gym-Code, Klassen-Challenge, Übersicht „wer hat welche Lektion gespielt“ (ohne personenbezogene Details über das Nötige hinaus).
- [ ] 10 Pilot-Gyms onboarden: QR-Poster, 15-Minuten-Einweisung, gratis für 60 Tage.
- [ ] Content-Rhythmus: 3 Reels pro Woche („Welche Karte spielst du?“), 1 Puzzle der Woche.
- [ ] Den Januar-Peak nutzen (Gymdesk: Churn- und Anmeldespitze im Januar) mit dem Angebot „Neujahrs-Anfänger-Challenge“ für Gyms.
- [ ] Fake-Door-Test Blaugurt-Kampagne mit Preisfrage.
- **Meilenstein M2:** 300–500 Nutzer, D7 ≥ 10 %, 6 von 10 Gyms mit ≥ 5 aktiven Schülern.

### Phase 3: Zahlungsbereitschaft (Tag 61–90, bis ca. 8.2.2027)
- [ ] Gym-Preisgespräche (19 € vs. 39 €/Monat), Ziel: 3 Absichtserklärungen oder erste Zahlungen.
- [ ] Englische Version der Weißgurt-Kampagne, „Show & Tell“-Post auf r/bjj.
- [ ] Erstes Bezahlangebot: Blaugurt-Kampagne als Einmalkauf oder Jahresabo über einen Merchant of Record.
- [ ] Ein Gespräch mit einer Affiliation (DACH-Regionalleitung) oder einer Gi-Marke über ein Sponsored Card Set.
- [ ] Entscheidung am Tag 90 anhand der Kennzahlen: (a) B2B-Ausbau, (b) B2C-Abo plus Store-App, (c) als Open-Source- oder Portfolio-Projekt einfrieren.
- **Meilenstein M3:** 1.000 Nutzer gesamt, ≥ 3 zahlende oder zugesagte Gyms, ≥ 20 B2C-Käufe oder ≥ 5 % Fake-Door-Klickrate.

**Abbruchkriterium:** Liegt die Aktivierung nach Tag 60 unter 20 % und D7 unter 5 % trotz zweier Iterationen, wird das Onboarding neu gestaltet, bevor Monetarisierung weiterverfolgt wird.

---

## 7. Die drei vielversprechendsten Erlöspfade

Alle Zahlen sind **Jahr-1-Szenarien nach Launch** (ab etwa Februar 2027), in Euro, vor Steuern, nach Zahlungsgebühren grob gerechnet. Die Spannen sind bewusst weit gewählt.

### Pfad 1: Gym-/Trainer-Lizenz (B2B), Priorität 1

**Angebot:** Gym-Code, Klassen-Challenges, Hot-Seat-Modus, Fortschrittsübersicht, eigenes Logo auf der Kartenrückseite, Onboarding-Strecke „erste 90 Tage“.
**Preis:** 19 €/Monat (Basis) bzw. 39 €/Monat (Branding plus Statistik), Jahrespreis mit 2 Gratismonaten.

| Annahme | konservativ | mittel | optimistisch |
|---|---|---|---|
| Erreichbare Gyms DACH | 800 | 1.000 | 1.200 |
| Zahlende Gyms Ende Jahr 1 | 10 (1,2 %) | 30 (3 %) | 60 (5 %) |
| Ø Preis pro Monat | 19 € | 25 € | 30 € |
| Ø zahlende Monate im Jahr 1 (Hochlauf) | 6 | 6 | 7 |
| **Umsatz Jahr 1** | **ca. 1.100 €** | **ca. 4.500 €** | **ca. 12.600 €** |

Herleitung: Gyms × Preis × Monate. Begründung: Ein gehaltenes Mitglied (rund 900–1.000 € Jahresbeitrag) bezahlt die Lizenz mehrfach. Benchmarks: Branded-App-Add-ons kosten 39–100 $/Monat, SmartBJJ Coach 99,99 $. Mit einer englischen Version und Affiliations außerhalb von DACH skaliert dieser Pfad. Das größte Risiko ist der Vertriebsaufwand pro Gym.

### Pfad 2: Freemium-Premium (B2C): Blaugurt+ Kampagne, Puzzle-Packs, KI-Coach-Kontingent

**Angebot:** Weißgurt komplett gratis. Premium kostet 29–39 € pro Jahr oder 3,99 € pro Monat, alternativ 9,99 € einmalig für die Blaugurt-Kampagne.

| Annahme | konservativ | mittel | optimistisch |
|---|---|---|---|
| Ø MAU im Jahr 1 (DE + EN) | 1.500 | 5.000 | 15.000 |
| Zahlungsquote (MAU → zahlend) | 1,5 % | 3 % | 5 % |
| Zahlende Kunden | ca. 23 | 150 | 750 |
| Ø Netto-Erlös je Zahlendem und Jahr (nach Gebühren 5–15 %) | 25 € | 28 € | 30 € |
| **Umsatz Jahr 1** | **ca. 600 €** | **ca. 4.200 €** | **ca. 22.500 €** |
| KI-Kosten (0,05–0,10 € je MAU und Monat, gedeckelt) | −900 bis −1.800 € | −3.000 bis −6.000 € | −9.000 bis −18.000 € |

**Wichtig:** Ohne Deckel kann der KI-Coach die B2C-Marge auffressen. Er gehört deshalb in Premium oder bekommt ein kleines Gratis-Kontingent mit gecachten Standardantworten. Benchmarks: Underhook 49,99 $ pro Jahr, Duolingo 9 % Zahlungsquote als Obergrenze. Volumen kommt fast nur über die englische Version.

### Pfad 3: Partnerschaften (Instruktoren, Affiliations, Marken): Sponsored oder White-Label Card Sets

**Angebot:** (a) Instruktor oder Affiliation bekommt ein eigenes Kartenset („Curriculum von Gym X“) mit Branding für die eigenen Schüler. (b) Eine Gi- oder Equipment-Marke sponsert ein Kartenset oder einen Gi-Skin (klar als Werbung gekennzeichnet).

| Annahme | konservativ | mittel | optimistisch |
|---|---|---|---|
| Abschlüsse im Jahr 1 | 0–1 | 2 | 4 |
| Ø Wert je Abschluss (Setup plus 12 Monate Lizenz bzw. Sponsoring) | 1.500 € | 3.000 € | 5.000 € |
| **Umsatz Jahr 1** | **0–1.500 €** | **ca. 6.000 €** | **ca. 20.000 €** |

Die Annahmen sind Schätzungen. Für BJJ-Brand-Deals wurden keine öffentlichen Benchmarks gefunden. Die Werte orientieren sich an kleinen Sponsoring- und Agentur-Pauschalen. Vorteil: hoher Wert je Abschluss, eingebaute Fachvalidierung. Risiko: wenige Entscheider, Markenfreigaben, Individualisierungsaufwand.

### Zusammenfassung Jahr 1

| | konservativ | mittel | optimistisch |
|---|---|---|---|
| Pfad 1 Gym-Lizenz | 1.100 € | 4.500 € | 12.600 € |
| Pfad 2 Freemium (vor KI-Kosten) | 600 € | 4.200 € | 22.500 € |
| Pfad 3 Partnerschaften | 0–1.500 € | 6.000 € | 20.000 € |
| **Summe Umsatz** | **ca. 2.000–3.000 €** | **ca. 15.000 €** | **ca. 55.000 €** |

Kosmetik-Direktkauf, physische Decks und Turnier-Aktivierungen sind Zusätze im niedrigen dreistelligen Bereich und wurden nicht eingerechnet.

**Ehrliche Einordnung:** Selbst das optimistische Szenario finanziert keine Vollzeitstelle. Der Wert von Jahr 1 liegt darin, zu belegen, dass Mattenkarten die Anfängerbindung in Gyms verbessert. Mit diesem Nachweis werden Affiliations-Deals (Gracie Barra 700+ Schulen, Alliance 300+) und eine englische Skalierung realistisch. Dann sind fünf- bis niedrig sechsstellige Jahresumsätze plausibel, aber nicht garantiert.

---

## 8. Offene Punkte und nächste Recherchen
- Belastbare DACH-Praktizierendenzahl (eventuell Umfrage über Pilot-Gyms oder Smoothcomp-Teilnehmerzahlen DACH).
- Aktuelle Preise von Ground CTRL und Gracie University, Status von Roll Model und BJJ Graph (nicht verifiziert).
- Affiliate-Konditionen von BJJ Fanatics und Sponsoring-Preise von Gi-Marken.
- Anwaltliche Prüfung: Haftungshinweis, AGB, Minderjährige im Trainer-Modus, Auftragsverarbeitung für den KI-Coach.
