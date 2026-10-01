#!/usr/bin/env python3
"""Genera src/15_dati_luoghi.js: codici catastali (comuni e stati esteri) -> nome e provincia.
Fonte: dati del pacchetto python-codicefiscale (licenza MIT), a loro volta da ISTAT/ANPR.
Per ogni codice tiene il nome più recente; esclude i comuni soppressi prima del 1920."""
import json, pathlib, sys
d = pathlib.Path(sys.argv[1])
m = json.load(open(d/'municipalities.json')) + json.load(open(d/'municipalities-patch.json'))
c = json.load(open(d/'countries.json')) + json.load(open(d/'countries-patch.json')) + json.load(open(d/'deleted-countries.json'))
best = {}
for x in m + c:
    dd = x.get('date_deleted') or ''
    if dd and dd[:4] < '1920': continue
    k = (dd or '9999', x.get('date_created') or '')
    if x['code'] not in best or k > best[x['code']][0]:
        best[x['code']] = (k, x['name'], x.get('province', ''))
s = ";".join(f"{k}{n}|{p}" for k, (_, n, p) in sorted(best.items()))
out = pathlib.Path(__file__).parent.parent / 'src' / '15_dati_luoghi.js'
out.write_text("/* Codici catastali -> luogo di nascita (generato da strumenti/genera_luoghi.py, non modificare a mano) */\n"
               "const LUOGHI_CF = " + json.dumps(s, ensure_ascii=False) + ";\n", encoding='utf-8')
print(f"{len(best)} codici, {out.stat().st_size/1024:.0f} KB")
