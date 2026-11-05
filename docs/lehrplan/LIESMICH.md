# Lehrplan-Grundlagen für die Module

Hier liegen die Erhebungen aus dem St. Galler Lehrplan Volksschule, auf
denen die Fachmodule aufbauen. Stand der Website: August 2025, erhoben am
5. November 2026.

## 20261105_Lehrplan21-SG_NMG-Kompetenzstufen.json

351 Kompetenzstufen des Fachbereichs Natur, Mensch, Gesellschaft, erhoben
aus `sg.lehrplan.ch`. Felder je Stufe:

| Feld | Inhalt |
|---|---|
| `kb` | Nummer des Kompetenzbereichs, 1 bis 12 |
| `kn` | Nummer der Kompetenz innerhalb des Bereichs |
| `komp` | Code der Kompetenz, etwa `NMG.1.3` |
| `ktitle` | Titel der Kompetenz |
| `stufe` | Code der Kompetenzstufe, etwa `NMG.1.3.f` |
| `lit` | Buchstabe der Stufe |
| `zyklus` | 1, 2 oder 3 |
| `text` | Wortlaut der Stufe |
| `begriffe` | verbindliche Inhalte, sofern vorhanden |
| `grundanspruch` | ob die Stufe als Grundanspruch gilt |

79 Stufen tragen verbindliche Inhalte, 95 sind Grundanspruch.

## Die Unterscheidung, auf die es ankommt

Der Lehrplan trennt zwei Arten von Inhalten, und die Trennung entscheidet,
welche Aufgaben lehrplanverbindlich sind:

- Mit einem Symbol aufgezählte Inhalte sind **verbindlich** zu bearbeiten.
  Im JSON stehen sie im Feld `begriffe`.
- Mit «z.B.» eingeleitete Inhalte sind eine **Auswahl zur Illustration**.
  Die Lehrperson legt sie selber fest.

Eine Aufgabe auf einem «z.B.»-Inhalt ist lehrplankonform, aber nicht
lehrplanverbindlich. Beides ist brauchbar; der Unterschied gehört nur
offengelegt.

## Was der Lehrplan NICHT vorgibt

Die Zuordnung einer Kompetenzstufe zu einem einzelnen Schuljahr. Der
Lehrplan ordnet nach Zyklen: Zyklus 1 umfasst Kindergarten bis 2. Klasse,
Zyklus 2 die 3. bis 6., Zyklus 3 die Oberstufe. Jede Klassenangabe in den
Modulen ist darum eine Empfehlung, abgeleitet aus verbreiteten
Lehrmitteln, und als solche gekennzeichnet.

## Codes in den Modulen

Ein Lehrplan-Code steht an einem Thema nur, wenn sein Wortlaut belegt ist.
Wo kein Code belegt werden konnte, nennt das Thema den Zyklus. Die
Prüfdatei `tests/deutsch1.js` erzwingt das mit einer Liste der belegten
Codes.

## 20261105_Lehrplan21-SG_NT-RZG-Kompetenzstufen.txt

Die 53 Kompetenzen der Fachbereiche Natur und Technik sowie Räume, Zeiten,
Gesellschaften (3. Zyklus), je Kompetenzstufe mit Code, Wortlaut,
Grundanspruch-Markierung und verbindlichen Inhalten.

## Zwei Befunde zur kantonalen Fassung

Ein maschineller Vergleich aller 53 Kompetenzen zwischen `sg.lehrplan.ch`
und der Referenzfassung `v-fe.lehrplan.ch` ergab null Unterschiede. Die
St. Galler Fassung von NT und RZG ist auf Stufenebene mit der Vorlage
identisch.

Die kantonalen Verschiebungen, die der Kanton selbst ausweist, sind genau
zwei: Ethik, Religionen, Gemeinschaft stützt sich in der Primarschule auf
NMG.10 bis NMG.12, und die drei Kompetenzen WAH.1.1, WAH.1.2 und WAH.5.2
werden im Fach Berufliche Orientierung unterrichtet.

## Der Kanton als Lerninhalt

Der Lehrplan nennt den Kanton St. Gallen an keiner Stelle als Lerninhalt.
Es gibt keine kantonsspezifischen Zusatzkompetenzen und keine St. Galler
Beispiele. Der kantonale Bezug entsteht ausschliesslich über offene
Formulierungen wie «eigene Umgebung», «Schulgemeinde», «Orts- und
Regionalgeschichte» sowie über die Kantonsebene in RZG.8.1.b.

Folge für die Module: St. Galler Aufgaben — Säntis, Churfirsten,
Stiftsbezirk, Kantonsrat — sind anschlussfähig und sinnvoll, aber sie
erfüllen eine offene Stelle des Lehrplans und sind keine Vorgabe. Auch
das gehört gekennzeichnet.

## Die übrigen Fachbereiche

Kompetenzaufbauten aus `sg.lehrplan.ch`, Stand August 2025:

| Datei | Fachbereich |
|---|---|
| `…_mu_all.txt` | Musik, alle Zyklen |
| `…_bg_all.txt` | Bildnerisches Gestalten, alle Zyklen |
| `…_ttg_all.txt` | Textiles und Technisches Gestalten, alle Zyklen |
| `…_bs_all.txt` | Bewegung und Sport, alle Zyklen |
| `…_nmg_f3_z3.txt` | Wirtschaft, Arbeit, Haushalt, 3. Zyklus |
| `…_nmg_f5_z3.txt` | Ethik, Religionen, Gemeinschaft, 3. Zyklus |

Zur Eignung für automatisch geprüfte Aufgaben: Musik trägt mit `MU.6`
(Praxis des musikalischen Wissens), `MU.4.C` (Instrumentenkunde) und
`MU.6.B` (Notation) einen vollwertigen Aufgabenpool. Bildnerisches
Gestalten hat keinen einzigen gut abprüfbaren Kompetenzbereich, Bewegung
und Sport nur `BS.6.C` (Sicherheit im Wasser). Textiles und Technisches
Gestalten trägt `TTG.2.E` (Werkstoffe, Werkzeuge, Maschinen).

Zwei Vorbehalte aus dem Lehrplanwortlaut, die für die Modulgestaltung
zählen: die Musiklehre soll nicht isoliert erworben werden, und die
Religionen sind «nicht enzyklopädisch zu behandeln», wobei die Verteilung
auf die einzelnen Religionen ausdrücklich offen bleibt. Ein Modul ist in
beiden Fällen Übungshilfe zum gewählten Unterrichtsstoff, nicht dessen
Abbild.

## Hinweis zu den Druckansichten

Der Kompetenzaufbau liegt unter
`lehrplan_printout.php?k=1&ekalias=0&fb_id=<N>`, nicht unter `?e=1&…`;
letzteres liefert nur die einleitenden Kapitel. Die Nummern: 6 = Natur,
Mensch, Gesellschaft (mit f_id 2 = NT, 3 = WAH, 4 = RZG, 5 = ERG),
7 = Gestalten (f_id 1 = BG, 2 = TTG), 8 = Musik, 9 = Bewegung und Sport.
