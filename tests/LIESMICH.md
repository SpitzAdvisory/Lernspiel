# Regressionspruefung

Vor jeder Auslieferung:

```
cp ../index.html app.html      # die zu pruefende Fassung
node alles.js                  # alle Pruefdateien
node alles.js stellen          # nur eine Gruppe
```

`alles.js` meldet eine Zeile je Datei und endet mit Rueckgabewert 1,
sobald eine Datei faellt. Die Pruefungen laufen gegen `app.html` in
diesem Ordner, nicht gegen die ausgelieferte Seite.

Playwright mit Chromium wird vorausgesetzt.
