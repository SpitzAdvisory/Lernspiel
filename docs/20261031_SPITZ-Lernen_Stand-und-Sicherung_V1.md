# Stand und Sicherung

**SPITZ Lernen · 31. Oktober 2026 · V82**

Dieses Papier hält fest, was es gibt, wo es liegt, und wie sich jede frühere
Fassung zurückholen lässt. Alle Zahlen darin sind gemessen, nicht geschätzt.

---

## 1. Bestandsaufnahme

| Teil | Umfang | Ablage |
|---|---|---|
| Die App | eine Datei, 1,18 MB | `index.html` im Repository |
| Tondateien | 4857 Stück | `audio/` im Repository |
| Prüfungen | 26 Dateien, rund 480 Prüfungen | `tests/` im Repository |
| Vermittler | 1 Datei, 255 Zeilen | `worker/worker.js`, läuft bei Cloudflare |
| Sprachpartnerin | 2 Dateien | `agent/`, läuft bei ElevenLabs |
| Spielstände der Kinder | 161 Protokolle, 3 Profile | nur auf dem PC, jetzt auch im Archiv |

Die App ist **eine einzige HTML-Datei ohne Bauschritt**. Diese eine Datei ist die
ganze Anwendung: keine Abhängigkeiten, kein Übersetzen, kein Installieren.
Das ist die wichtigste Eigenschaft für die Wiederherstellung.

---

## 2. Die vier Sicherungsorte

**Vier Orte, drei davon unabhängig voneinander.**

| Ort | Inhalt | Reicht allein? |
|---|---|---|
| GitHub `SpitzAdvisory/Lernspiel` | alles ausser den Spielständen, ganze Geschichte | **ja** |
| Dropbox `usp\Lernspiel Source` | die letzten acht Masterdateien, Vermittler, Datendateien, französischer Ton | nein, nur jüngere Stände |
| OneDrive `Ablage\_Archive\Lernspiel` | 45 ältere Masterdateien ab V51, seit heute die Spielstände | nein, nur Momentaufnahmen |
| Dropbox `Apps\Lernspiel-Spitz` | die laufende Spielkopie samt Profilen und Protokollen | nein, das ist der Betrieb, keine Sicherung |

**Das Repository ist die eigentliche Sicherung.** Es enthält jede Fassung seit
dem 24. Oktober mit ihrer vollständigen Geschichte. Die anderen Orte sind
Bequemlichkeit und Rückfallebene.

### Neu gesichert am 31. Oktober

Die Spielstände der Kinder — 161 Protokolle seit dem 19. September und die
Profile — lagen bis heute **nur** im laufenden Spielordner. Sie sind das
Einzige, was sich nicht nachbauen lässt; alles andere entsteht notfalls neu.
Sie liegen jetzt als
`20261031_SPITZ-Lernen_Spielstaende_V1.zip` im privaten Archiv,
164 Dateien, 357 KB, fehlerfrei geprüft.

---

## 3. Eine frühere Fassung zurückholen

Jede Fassung ist über ihren Commit-Schlüssel erreichbar. Ein Befehl genügt:

```
git clone https://github.com/SpitzAdvisory/Lernspiel.git
cd Lernspiel
git archive 2244016 index.html | tar -x
```

Danach liegt `index.html` in der Fassung V79 im Ordner. Die Datei lässt sich
unverändert in den Spielordner kopieren — sie braucht nichts weiter.

Erprobt am 31. Oktober: V76, V79 und V80 wurden so zurückgeholt und trugen
die erwartete Grösse und Kennung.

### Eine Stolperstelle

Die Versionsangabe **in der Datei** ist als Schlüssel untauglich. Von V59 bis
V74 stand dort fälschlich `V58`; der Fehler wurde erst bei V75 bemerkt. Eine
Fassung aus diesem Bereich trägt in der Datei also die falsche Nummer. Verlässlich ist allein der Commit-Schlüssel aus der Tabelle unten.

### Versionsmarken

Marken (`git tag`) wären bequemer als Schlüssel, lassen sich aus dieser
Arbeitsumgebung aber nicht setzen: der Proxy weist sowohl `git push --tags`
als auch den Schreibzugriff auf die Markenschnittstelle mit 403 ab. Das ist
eine Schranke der Umgebung, keine Ihres Repositorys. Die Tabelle leistet
dasselbe.

---

## 4. Alle Fassungen

| Fassung | Commit | Datum | Was dazukam |
|---|---|---|---|
| — | `14dade8` | 2026-10-24 | Add files via upload |
| — | `428850b` | 2026-10-24 | Französische Aussprache: 1246 MP3-Dateien für den dis-donc-Wortschatz |
| — | `917a83c` | 2026-10-24 | Sprechaufgaben: Franzoesisch mit Spracherkennung |
| — | `bf1a028` | 2026-10-24 | Pruefungsaufgaben 3, 6, 7 und 10: ganze Bildfiguren pruefen |
| — | `ff1cb26` | 2026-10-24 | Pruefungsaufgabe 10: alle drei Figuren |
| — | `c7853ed` | 2026-10-24 | Pruefungsaufgabe 5b: Billard ueber zwei Banden |
| — | `193cb55` | 2026-10-25 | Fuenf Korrekturen am franzoesischen Teil und am Schreibblatt |
| — | `857c4e7` | 2026-10-25 | dis donc 7 und 8 nach Lernzielen gegliedert |
| — | `e9c889c` | 2026-10-25 | Sieben fehlende Aussprache-Clips ergaenzt |
| — | `5c46b4d` | 2026-10-25 | Zahlenstrahl wertete Nachbarzahlen als richtig; Zuhoeren auf Whisper |
| — | `65cfb27` | 2026-10-25 | Kein Ton mehr nach gesperrtem Autostart; Aussprache wird Pflicht |
| — | `9d50e78` | 2026-10-25 | Sprechen: Knopf halten statt Stille erraten |
| — | `1f7b38c` | 2026-10-25 | Richtig gesprochene Vokabeln wurden abgelehnt: qc und qn |
| — | `594f2cb` | 2026-10-25 | Eigene Tastatur fuer Schreibaufgaben; Systemtastatur blieb aus |
| V43 | `5879430` | 2026-10-25 | Aufnahmekette ohne MediaRecorder, Modell 22 MB, Fehlerursachen benannt |
| V44 | `876e630` | 2026-10-25 | Rueckfall auf die Erkennung des Browsers, Ueberspringen mit Preis |
| V45 | `101aa26` | 2026-10-25 | Widerspruch zwischen Gehoertem und Statuszeile behoben |
| V46 | `0fe74e1` | 2026-10-25 | Schreibaufgaben mit einem Ausdruck statt fuenf |
| V47 | `24aab76` | 2026-10-25 | Der Kasten mit dem Gehoerten steht immer da |
| V48 | `61f861b` | 2026-10-25 | Urteil in Worten, Versionsangabe, Sprachen ohne Schreibblatt |
| V49 | `cb9e4a7` | 2026-10-25 | Weiter nur bei richtiger Aussprache, keine Selbstbeurteilung |
| V50 | `6be8aa9` | 2026-10-25 | ElevenLabs Scribe, Handschrifterkennung, Mikrofon gegen Lautsprecher |
| V51 | `c4837e3` | 2026-10-25 | Vermittler statt Schluessel im Geraet |
| V52 | `30a5f36` | 2026-10-26 | Werkzeugwahl eindeutig, abgewiesener Finger nennt den Grund |
| V56 | `19480f0` | 2026-10-28 | schriftliches Rechnen mit Kaestchen (Addition, Subtraktion) |
| V57 | `4edf02d` | 2026-10-28 | Spielpause statt Scherzfragen, dazu die stehende Regressionspruefung |
| V58 | `52763d3` | 2026-10-30 | Tonschicht mit Sprache statt fest auf Franzoesisch |
| V59 | `f6f88de` | 2026-10-30 | Frag-Knopf - das Kind spricht, die Lernbegleitung antwortet |
| V60 | `3dd99ae` | 2026-10-30 | Vermittleradresse in der App statt auf jedem Geraet |
| V61 | `e726529` | 2026-10-30 | Lautsprecher auch auf der Muttersprachseite der Vokabelkarten |
| — | `66a261a` | 2026-10-30 | Deutsche Aussprache: 1567 Klaenge, gesprochen von Emilia |
| V62 | `dcceb2c` | 2026-10-30 | Abkuerzungen im gesprochenen Deutsch ausschreiben |
| V63 | `5b8fa2a` | 2026-10-30 | dis donc auch auf Englisch |
| V64 | `f63743b` | 2026-10-31 | drei Kampfspiele, steilere Stufung, englische Aussprache |
| V65 | `f63743b` | 2026-10-31 | drei Kampfspiele, steilere Stufung, englische Aussprache |
| V66 | `2979d92` | 2026-10-31 | schriftliches Malnehmen und Teilen im Kaestchengitter |
| V67 | `2979d92` | 2026-10-31 | schriftliches Malnehmen und Teilen im Kaestchengitter |
| V68 | `73d8554` | 2026-10-31 | Modul «Verben im Fokus» nach dem Flade-Dossier |
| V69 | `73d8554` | 2026-10-31 | Modul «Verben im Fokus» nach dem Flade-Dossier |
| — | `0e71896` | 2026-10-31 | Durchgang Mathematik 4-9 auf iPad-Breite als stehende Pruefung |
| V70 | `9e2969f` | 2026-10-31 | Modul «Open World 1» |
| V71 | `edb47ff` | 2026-10-31 | Kuerbisnacht und Klang in allen Spielen |
| V72 | `edb47ff` | 2026-10-31 | Kuerbisnacht und Klang in allen Spielen |
| V73 | `edb47ff` | 2026-10-31 | Kuerbisnacht und Klang in allen Spielen |
| V74 | `edb47ff` | 2026-10-31 | Kuerbisnacht und Klang in allen Spielen |
| V75 | `3cef2c9` | 2026-10-31 | mit Emilia sprechen - die Antwort zaehlt |
| V76 | `08c090f` | 2026-10-31 | die gesprochene Antwort darf in einem Satz stehen |
| V77 | `a2e2397` | 2026-10-31 | Nebengeraeusche sind keine Antwort |
| V78 | `359b57c` | 2026-10-31 | bei Schreibaufgaben zaehlt nur Getipptes |
| V79 | `2244016` | 2026-10-31 | lautgleiche Schreibungen zaehlen |
| V80 | `d9c037b` | 2026-10-31 | Vorlesen in allen Modulen, Modus «Nur Hoeren» |
| V81 | `d603afb` | 2026-10-31 | der Ton wird geholt, waehrend der Schirm entsteht |
| — | `b3a9332` | 2026-10-31 | Sprachagent Schritt 2: Sprachpartnerin angelegt und abgenommen |
| V82 | `f603464` | 2026-10-31 | der Bildschirm bleibt im Hoermodus wach |

Fassungen **V53 bis V55** haben das Repository nie erreicht; sie entstanden und
wurden überholt, bevor ein Commit fällig war. **V1 bis V42** liegen vor dem
Repository; Teile davon finden sich im OneDrive-Archiv ab V51.

---

## 5. Zwei Punkte, die eine Entscheidung brauchen

**Das Repository ist öffentlich.** Jeder kann es lesen. Darin stehen keine
Fortschrittsdaten und keine Profile, aber die Vornamen Felix, Valentin und
Johannes erscheinen in drei Kommentaren und Notizen. Zusammen mit dem
Kontonamen *SpitzAdvisory* sind sie zuordenbar. Zwei Wege: die Vornamen aus
den Kommentaren nehmen, oder das Repository auf privat stellen. Das ist Ihre
Entscheidung, nicht meine.

**Die Spielstände wachsen weiter.** Die heutige Sicherung ist eine
Momentaufnahme. Ohne Wiederholung veraltet sie. Eine wiederkehrende Aufgabe,
die den Ordner wöchentlich ins Archiv zieht, wäre der saubere Abschluss.

---

*Erstellt am 31. Oktober 2026. Alle Angaben am laufenden System gemessen.*
