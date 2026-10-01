#!/usr/bin/env python3
"""Ricompone i blocchi di src/ nel file unico dist/index.html e prepara i file da pubblicare.

Uso:
  python3 ricomponi.py              ricompone con la versione attuale (file VERSIONE)
  python3 ricomponi.py --rilascio   alza la versione (0.1 -> 0.2) e poi ricompone

La cache del service worker prende il nome da versione + impronta del contenuto,
quindi cambia da sola a ogni modifica: i telefoni scaricano sempre la versione nuova."""
import pathlib, shutil, sys, hashlib, datetime

base = pathlib.Path(__file__).parent
fv = base / "VERSIONE"
versione = fv.read_text().strip()
if "--rilascio" in sys.argv:
    maggiore, minore = versione.split(".")
    versione = f"{maggiore}.{int(minore) + 1}"
    fv.write_text(versione + "\n")
oggi = datetime.date.today().strftime("%d/%m/%Y")

src = sorted((base / "src").iterdir())
html = [f.read_text(encoding="utf-8") for f in src if f.suffix == ".html"]
js = [f"/* ---- {f.name} ---- */\n" + f.read_text(encoding="utf-8") for f in src if f.suffix == ".js"]
out = html[0] + "<script>\n\"use strict\";\n" + "\n".join(js) + "\n</script>\n" + html[-1]
out = out.replace("null /*{{LOGO_JPG}}*/", (base / "risorse" / "logo-pdf.json").read_text().strip())
out = out.replace("{{LOGO}}", (base / "risorse" / "logo-barra.b64").read_text().strip())
out = out.replace("{{VERSIONE}}", versione).replace("{{DATA_BUILD}}", oggi)

dist = base / "dist"
dist.mkdir(exist_ok=True)
(dist / "index.html").write_text(out, encoding="utf-8")

# file per l'installazione (manifest, service worker, icone, README) accanto a index.html
impronta = hashlib.sha256(out.encode("utf-8"))
for f in sorted((base / "pwa").iterdir()):
    dati = f.read_bytes()
    impronta.update(dati)
    shutil.copy(f, dist / f.name)
cache = f"bussola-{versione}-{impronta.hexdigest()[:8]}"
sw = (dist / "sw.js").read_text(encoding="utf-8").replace("{{CACHE}}", cache)
(dist / "sw.js").write_text(sw, encoding="utf-8")
print(f"Bussola {versione} ({oggi}) · index.html {len(out)/1024:.0f} KB da {len(src)} blocchi · cache {cache}")
