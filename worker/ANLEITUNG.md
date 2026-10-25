# Vermittler einrichten

Der Vermittler hält die Schlüssel für ElevenLabs und Anthropic. Die App auf
dem iPad bekommt nur seine Adresse. Ein Schlüssel liegt danach nie mehr in
einem Browser.

Alles unten geschieht einmal. Danach ändert sich nichts mehr.

---

## Teil 1 — Cloudflare-Konto

1. Die Seite `https://dash.cloudflare.com/sign-up` ist in Deinem Chrome offen.
2. «Continue with GitHub» anklicken. Damit entfällt ein neues Passwort.
3. GitHub fragt nach Erlaubnis. Bestätigen.
4. Cloudflare schickt eine Bestätigungsmail. Den Link darin anklicken.
5. Nach der Anmeldung steht links eine Leiste. Dort «Compute (Workers)» wählen.

Fertig, sobald Du die Übersicht «Workers & Pages» siehst.

---

## Teil 2 — Worker anlegen

6. Auf «Create» klicken.
7. «Start with Hello World!» wählen, dann «Get started».
8. Als Namen `spitz-lernen` eintragen.
9. Auf «Deploy» klicken. Cloudflare legt den Worker mit einem Beispielinhalt an.
10. Die Adresse notieren, die danach erscheint. Sie sieht so aus:
    `https://spitz-lernen.<dein-name>.workers.dev`

---

## Teil 3 — Inhalt einsetzen

11. Auf «Edit code» klicken. Ein Editor öffnet sich.
12. Den gesamten Beispielinhalt markieren und löschen.
13. Den Inhalt der Datei `worker.js` vollständig einfügen.
14. Auf «Deploy» klicken.

---

## Teil 4 — Schlüssel hinterlegen

Die Schlüssel kommen als «Secret» ins Konto, nie in den Code.

15. Zurück zur Übersicht des Workers, Reiter «Settings».
16. Abschnitt «Variables and Secrets», dann «Add».
17. Typ «Secret» wählen.
18. Name: `ELEVEN_KEY`. Wert: Dein Schlüssel von ElevenLabs.
19. Speichern.
20. Schritte 16 bis 19 wiederholen mit Name `ANTHROPIC_KEY` und Deinem
    Schlüssel von Anthropic.

---

## Teil 5 — Tagesgrenze (empfohlen, aber nicht zwingend)

Ohne diesen Teil läuft alles; es fehlt nur die Obergrenze je Tag.

21. In der linken Leiste «Storage & Databases», dann «KV».
22. «Create Instance» anklicken, Name `spitz-zaehler`, anlegen.
23. Zurück zum Worker, «Settings», Abschnitt «Bindings», «Add».
24. Typ «KV Namespace» wählen.
25. Variablenname: `ZAEHLER`. Namensraum: `spitz-zaehler`.
26. Speichern.
27. Unter «Variables and Secrets» eine Variable vom Typ «Text» anlegen:
    Name `TAGESGRENZE`, Wert `500`.

---

## Teil 6 — App verbinden

28. Auf dem iPad die App öffnen, oben rechts das Schloss, Passwort eingeben.
29. Reiter «Einstellungen».
30. Bei «Adresse des Vermittlers» die Adresse aus Schritt 10 eintragen,
    ohne Schrägstrich am Ende.
31. Speichern.
32. Die beiden Schlüsselfelder darunter leer lassen. Stehen dort noch
    Schlüssel, jetzt löschen und erneut speichern.

---

## Prüfen

33. Eine Vokabellektion starten und eine Sprechaufgabe abwarten.
34. Unter dem Kasten muss «Das Zuhören übernimmt ElevenLabs» stehen.
35. Den Ausdruck sprechen. Das Verstandene erscheint im Kasten, grün oder rot.

Geht etwas schief, nennt die App die Ursache in der Zeile unter dem Kasten.
Diese Meldung brauche ich, falls ich nachbessern soll.

---

## Was der Vermittler zulässt

- Anfragen nur von `https://spitzadvisory.github.io`.
- Nur zwei Pfade: `/stt` für das Zuhören, `/ocr` für die Handschrift.
- Mit Teil 5: höchstens so viele Anfragen je Tag wie in `TAGESGRENZE`.

Die verbleibende Schwäche bleibt bestehen und sei offen genannt: der
Herkunftsnachweis eines Browsers lässt sich fälschen. Wer die Adresse kennt,
kann den Vermittler nutzen. Die Tagesgrenze begrenzt den Schaden; die
Schlüssel selbst bleiben unerreichbar.
