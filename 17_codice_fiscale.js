/* =====================================================================
   CODICE FISCALE: controllo e dati ricavabili (sesso, data e luogo di nascita)
   e verifica di coerenza con nome e cognome.
   ===================================================================== */

const CF_OMOCODIA = "LMNPQRSTUV";          // cifre sostituite in caso di omocodia: L=0 … V=9
const CF_MESI = "ABCDEHLMPRST";            // A=gennaio … T=dicembre
const CF_POS_NUMERICHE = [6, 7, 9, 10, 12, 13, 14];

let _luoghi = null;
function luogoDaCodice(cod) {
  if (!_luoghi) {
    _luoghi = {};
    for (const x of LUOGHI_CF.split(";")) { const [n, p] = x.slice(4).split("|"); _luoghi[x.slice(0, 4)] = { nome: n, prov: p }; }
  }
  return _luoghi[cod] || null;
}

function cfPulito(v) { return String(v || "").replace(/\s/g, "").toUpperCase(); }

/* Riporta le cifre sostituite per omocodia alla forma normale */
function cfNormalizza(cf) {
  const a = cf.split("");
  for (const i of CF_POS_NUMERICHE) { const k = CF_OMOCODIA.indexOf(a[i]); if (k >= 0) a[i] = String(k); }
  return a.join("");
}

function cfCarattereControllo(primi15) {
  const DISP = { 0: 1, 1: 0, 2: 5, 3: 7, 4: 9, 5: 13, 6: 15, 7: 17, 8: 19, 9: 21, A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21, K: 2, L: 4, M: 18, N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14, U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23 };
  let s = 0;
  for (let i = 0; i < 15; i++) {
    const ch = primi15[i];
    if (i % 2 === 0) s += DISP[ch];
    else s += /\d/.test(ch) ? Number(ch) : ch.charCodeAt(0) - 65;
  }
  return String.fromCharCode(65 + (s % 26));
}

function cfFormaPersona(cf) {
  return /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/.test(cf);
}

/* Esito: { tipo: "persona"|"societa"|null, valido, errore, dati } */
function analizzaCF(valoreGrezzo, oggi) {
  const cf = cfPulito(valoreGrezzo);
  if (!cf) return { tipo: null, valido: false };
  if (/^\d{11}$/.test(cf)) return { tipo: "societa", valido: true };
  if (!cfFormaPersona(cf)) return { tipo: null, valido: false, errore: "Il codice fiscale ha 16 caratteri (persona) o 11 cifre (società)" };
  if (cfCarattereControllo(cf.slice(0, 15)) !== cf[15])
    return { tipo: "persona", valido: false, errore: "L'ultimo carattere non torna: probabilmente c'è un errore di battitura" };
  const n = cfNormalizza(cf);
  const aa = Number(n.slice(6, 8)), mese = CF_MESI.indexOf(n[8]) + 1;
  let gg = Number(n.slice(9, 11));
  const sesso = gg > 40 ? "F" : "M";
  if (gg > 40) gg -= 40;
  const ora = oggi || new Date();
  /* Il codice ha solo due cifre per l'anno: "25" può essere 1925 o 2025.
     Il cliente di una polizza è un adulto, quindi se nel 2000 avrebbe meno di 16 anni si sceglie il 1900. */
  const anno = (2000 + aa) <= ora.getFullYear() - 16 ? 2000 + aa : 1900 + aa;
  const d = new Date(Date.UTC(anno, mese - 1, gg));
  if (gg < 1 || d.getUTCMonth() !== mese - 1) return { tipo: "persona", valido: false, errore: "La data di nascita contenuta nel codice non esiste" };
  const codLuogo = n.slice(11, 15);
  const luogo = luogoDaCodice(codLuogo);
  const pad = x => String(x).padStart(2, "0");
  return {
    tipo: "persona", valido: true,
    dati: {
      sesso,
      dataNascita: `${anno}-${pad(mese)}-${pad(gg)}`,
      luogoNascita: luogo ? (luogo.prov === "EE" ? luogo.nome + " (estero)" : `${luogo.nome} (${luogo.prov})`) : "",
      codLuogo, luogoTrovato: !!luogo
    }
  };
}

/* ---------- coerenza con nome e cognome ---------- */
function cfLettere(s) { return s.toUpperCase().normalize("NFD").replace(/[^A-Z]/g, ""); }
function cfConsVoc(s) { const l = cfLettere(s); return [l.replace(/[AEIOU]/g, ""), l.replace(/[^AEIOU]/g, "")]; }
function cfParteCognome(s) { const [c, v] = cfConsVoc(s); return (c + v + "XXX").slice(0, 3); }
function cfParteNome(s) { const [c, v] = cfConsVoc(s); if (c.length >= 4) return c[0] + c[2] + c[3]; return (c + v + "XXX").slice(0, 3); }

/* Il campo contiene "nome cognome" o "cognome nome": prova tutte le divisioni.
   true = coerente, false = non coerente, null = impossibile dirlo */
function cfCoerenteConNome(cf, nomeCompleto) {
  const x = cfPulito(cf);
  const parole = String(nomeCompleto || "").trim().split(/\s+/).filter(Boolean);
  if (!cfFormaPersona(x) || parole.length < 2) return null;
  const atteso = x.slice(0, 6);
  for (let i = 1; i < parole.length; i++) {
    const a = parole.slice(0, i).join(""), b = parole.slice(i).join("");
    if (cfParteCognome(b) + cfParteNome(a) === atteso) return true;   // nome cognome
    if (cfParteCognome(a) + cfParteNome(b) === atteso) return true;   // cognome nome
  }
  return false;
}

/* Riempie i campi ricavabili senza sovrascrivere ciò che il commerciale ha corretto a mano */
function derivaDaCF(r) {
  const esito = analizzaCF(r.cf);
  const auto = r._auto || {};
  const campi = ["sesso", "dataNascita", "luogoNascita"];
  for (const k of campi) {
    const puoScrivere = r[k] == null || r[k] === "" || auto[k] === r[k];
    if (esito.valido && esito.tipo === "persona") {
      const nuovo = esito.dati[k];
      if (puoScrivere && nuovo) { r[k] = nuovo; auto[k] = nuovo; }
    } else if (puoScrivere && auto[k] !== undefined) { r[k] = ""; delete auto[k]; }
  }
  r._auto = auto;
  return esito;
}
