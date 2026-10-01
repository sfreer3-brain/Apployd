#!/usr/bin/env python3
"""Genera casi di prova per il codice fiscale usando python-codicefiscale come riferimento indipendente."""
import json, random
from codicefiscale import codicefiscale as C
from codicefiscale.data import get_municipalities_data, get_countries_data
random.seed(7)
nomi = ["Mario","Anna","Giuseppe","Francesca","Luca","Maria Grazia","Gian Luca","Eva","Ugo","Chiara","Alessandro","Bo","Andrea","Niccolò","Zoe"]
cogn = ["Rossi","Bianchi","D'Angelo","De Luca","Esposito","Fo","Russo","Colombo","Rè","Ferrari","Della Valle","Ai","Lo Bue","Brambilla"]
luoghi = [m for m in get_municipalities_data() if m["active"]] + [c for c in get_countries_data() if c["active"]]
casi = []
for i in range(3000):
    n, s = random.choice(nomi), random.choice(cogn)
    g = random.choice("MF"); y = random.randint(1925, 2008); mo = random.randint(1, 12); d = random.randint(1, 28)
    L = random.choice(luoghi)
    try:
        cf = C.encode(lastname=s, firstname=n, gender=g, birthdate=f"{d:02d}/{mo:02d}/{y}", birthplace=L["code"])
    except Exception as e:
        continue
    dec = C.decode(cf)
    om = random.choice(dec["omocodes"][1:]) if random.random() < 0.15 else cf
    casi.append({"cf": om, "nome": f"{n} {s}" if i % 2 else f"{s} {n}", "sesso": g, "data": f"{y}-{mo:02d}-{d:02d}", "cod": L["code"], "luogo": L["name"]})
json.dump(casi, open("strumenti/casi_cf.json", "w"), ensure_ascii=False)
print(len(casi), "casi, omocodici:", sum(c["cf"] != C.encode(lastname="x", firstname="x", gender="M", birthdate="01/01/2000", birthplace="H501") and not c["cf"][6:8].isdigit() for c in casi))
