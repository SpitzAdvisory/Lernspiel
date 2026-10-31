# -*- coding: utf-8 -*-
"""Baut 20261031_SPITZ-Lernen_Unterlagen_V1.html aus den drei Markdown-Dateien
und den sieben SVG-Zeichnungen dieses Ordners. Die Bilder werden eingebettet,
die Datei ist danach ohne Netz und ohne Beilagen lesbar.

Aufruf:  python3 bauen.py
Braucht: pip install markdown
"""
import io, re, markdown

ZIEL = '20261031_SPITZ-Lernen_Unterlagen_V1.html'
TEILE = [('20261031_SPITZ-Lernen_Stand-und-Sicherung_V1.md',   'Stand und Sicherung'),
         ('20261031_SPITZ-Lernen_Architektur-heute_V1.md',     'Architektur von heute'),
         ('20261031_SPITZ-Lernen_Architektur-kuenftig_V1.md',  'Architektur nach dem Umbau')]

GERUEST = """<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SPITZ Lernen — Unterlagen</title>
<style>
:root{--ink:#0A2D56;--mut:#5A6B7D;--mint:#4FB8B0;--line:#DCE4EC;--soft:#F4F7FA}
*{box-sizing:border-box}
body{margin:0;background:var(--soft);color:var(--ink);
 font:16px/1.65 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
header{background:var(--ink);color:#fff;padding:40px 24px}
header .w{max-width:980px;margin:0 auto}
header h1{margin:0;font-size:30px;letter-spacing:-.01em}
header p{margin:8px 0 0;opacity:.78;font-size:15px}
nav{max-width:980px;margin:28px auto 0;padding:0 24px}
nav ol{background:#fff;border:1px solid var(--line);border-radius:12px;margin:0;padding:18px 18px 18px 40px}
nav li{margin:4px 0}
nav a{color:var(--ink);text-decoration:none;border-bottom:1px solid var(--mint)}
main{max-width:980px;margin:0 auto;padding:28px 24px 72px}
section{background:#fff;border:1px solid var(--line);border-radius:14px;padding:32px 36px;margin:0 0 28px}
h1{font-size:25px;margin:0 0 6px;letter-spacing:-.01em}
h2{font-size:19px;margin:34px 0 10px;padding-top:14px;border-top:1px solid var(--line)}
h3{font-size:16px;margin:22px 0 6px}
section>h1+p{color:var(--mut);font-size:14px;margin-top:0}
p{margin:12px 0}
hr{border:0;border-top:1px solid var(--line);margin:26px 0}
table{border-collapse:collapse;width:100%;margin:16px 0;font-size:14.5px}
th,td{border:1px solid var(--line);padding:8px 11px;text-align:left;vertical-align:top}
th{background:var(--soft);font-weight:600}
code{background:var(--soft);padding:1px 5px;border-radius:4px;
 font:13.5px ui-monospace,SFMono-Regular,Menlo,monospace}
pre{background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:14px;overflow:auto}
pre code{background:none;padding:0}
figure{margin:22px 0;text-align:center}
figure svg{max-width:100%;height:auto;border:1px solid var(--line);border-radius:12px}
ul,ol{padding-left:22px}
li{margin:5px 0}
em{color:var(--mut);font-style:normal;font-size:14px}
@media print{body{background:#fff}section{break-inside:auto;border:0;padding:0;margin:0 0 20px}
 header{background:#fff;color:var(--ink);padding:0 0 16px}nav{display:none}figure svg{border:0}}
</style></head><body>
<header><div class="w"><h1>SPITZ Lernen — Unterlagen</h1>
<p>Stand 31. Oktober 2026 · Fassung V82 · drei Dokumente, sieben Zeichnungen</p></div></header>
<nav><ol>__NAV__</ol></nav>
<main>__BODY__</main></body></html>"""


def svg_einbetten(treffer):
    """Ersetzt ein <img src="...svg"> durch den Inhalt der Datei."""
    quelle = treffer.group(2)
    g = io.open(quelle, encoding='utf-8').read()
    g = re.sub(r"^<\?xml[^>]*\?>\s*", '', g)
    g = re.sub(r"width='\d+'", '', g, count=1)
    g = re.sub(r"height='\d+'", '', g, count=1)
    return '<figure>' + g + '</figure>'


def main():
    md = markdown.Markdown(extensions=['tables', 'sane_lists'])
    abschnitte = []
    for i, (datei, titel) in enumerate(TEILE, 1):
        md.reset()
        h = md.convert(io.open(datei, encoding='utf-8').read())
        h = re.sub(r'<img alt="([^"]*)" src="([^"]+\.svg)"\s*/?>', svg_einbetten, h)
        h = re.sub(r'<p>(<figure>)', r'\1', h)
        h = re.sub(r'(</figure>)</p>', r'\1', h)
        abschnitte.append((i, titel, h))

    nav = ''.join("<li><a href='#t%d'>%d. %s</a></li>" % (i, i, t) for i, t, _ in abschnitte)
    koerper = ''.join("<section id='t%d'>%s</section>" % (i, h) for i, _, h in abschnitte)
    doc = GERUEST.replace('__NAV__', nav).replace('__BODY__', koerper)
    io.open(ZIEL, 'w', encoding='utf-8').write(doc)
    print('%s geschrieben, %d Bytes, %d Zeichnungen eingebettet'
          % (ZIEL, len(doc.encode('utf-8')), doc.count('<figure>')))


if __name__ == '__main__':
    main()
