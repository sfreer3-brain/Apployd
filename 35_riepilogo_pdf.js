/* =====================================================================
   RIEPILOGO, TESTO EMAIL E PDF
   Il PDF è scritto da zero (nessuna libreria): carattere Helvetica
   standard, testo a capo automatico, più pagine, logo in testa.
   ===================================================================== */

/* ---------- riepilogo strutturato: sezioni con domanda e risposta ---------- */
function testoRisposta(c, v, r) {
  if (vuoto(v)) return "";
  switch (c.tipo) {
    case "sino": return v === "si" ? "Sì" : "No";
    case "flag": return v === true ? "Sì" : "No";
    case "conferma": return v === "si" ? "Confermo" : "NON CONFERMO";
    case "euro": return euro(v);
    case "data": { const [a, m, g] = String(v).split("-"); return g ? `${g}/${m}/${a}` : v; }
    case "scelta": { const o = (valore(c.opzioni, r) || []).find(x => x.v === v); return o ? o.t : v; }
    case "multipla": { const o = valore(c.opzioni, r) || []; return v.map(x => (o.find(z => z.v === x) || { t: x }).t).join(", "); }
    case "allegato": return v.map(f => f.nome).join(", ");
    default: return String(v);
  }
}

function titoloPratica(p) {
  const s = p.prodotto && percorsoNodo(p.prodotto);
  return s ? s[s.length - 1].nome : QUESTIONARI[p.questionario].titolo;
}

function costruisciRiepilogo(p) {
  const q = QUESTIONARI[p.questionario], r = p.risposte;
  const sezioni = passiVisibili(q, r).map(passo => ({
    titolo: passo.titolo,
    righe: campiAttivi(passo, r).filter(c => (c.tipo === "info") || (!["allegato", "mfo"].includes(c.tipo) && !vuoto(r[c.id])))
      .map(c => c.tipo === "info"
        ? { dom: valore(c.dom, r), risp: (valore(c.elenco, r) || []).join("; ") }
        : { dom: valore(c.dom, r), risp: testoRisposta(c, r[c.id], r), grave: c.tipo === "conferma" && r[c.id] === "no" })
  })).filter(s => s.righe.length);
  /* Analisi patrimoniale: risposte raggruppate e risultati principali */
  if (r.mfo && passiVisibili(q, r).some(x => x.campi.some(c => c.tipo === "mfo"))) {
    const k = sezioni.findIndex(x => x.titolo === "Cliente") + 1;
    const M = r.mfo.risultati, pct = x => Math.round((x || 0) * 100) + "%";
    const livello = l => l === "r" ? "Critico" : l === "y" ? "Da migliorare" : "Buono";
    const extra = [{
      titolo: "Analisi patrimoniale: risultati",
      righe: [
        { dom: "Indice di salute finanziaria", risp: M.punteggio + "/100" },
        { dom: "Patrimonio netto stimato", risp: euro(Math.round(M.patrimonioNetto)) },
        { dom: "Reddito annuo netto", risp: euro(Math.round(M.reddito)) },
        { dom: "Risparmio annuo", risp: `${euro(Math.round(M.risparmioAnno))} (${pct(M.tassoRisparmio)})` },
        { dom: "Liquidità di emergenza", risp: Math.round(M.mesiEmergenza) + " mesi di spese" },
        { dom: "Rate sul reddito", risp: pct(M.rateSuReddito) },
        { dom: "Profilo di rischio", risp: M.profilo + (M.avvisiProfilo.length ? " — " + M.avvisiProfilo.join(" ") : "") },
        { dom: "Obiettivo", risp: `${M.obiettivo}: ${euro(Math.round(M.importoObiettivo))} in ${M.anni} anni` },
        { dom: "Proiezione (prudente / base / favorevole)", risp: [M.proiezione.prudente, M.proiezione.base, M.proiezione.favorevole].map(x => euro(Math.round(x))).join(" / ") },
        { dom: "Percorso di analisi", risp: M.percorso }
      ].concat(M.semafori.map(l => ({ dom: l.nome, risp: `${livello(l.livello)}: ${l.perche}`, grave: l.livello === "r" })))
    }, {
      titolo: "Analisi patrimoniale: coperture da valutare",
      righe: M.coperture.filter(g => g.livello !== "g").map(g => ({ dom: g.area, risp: `${livello(g.livello)}: ${g.perche}`, grave: g.livello === "r" }))
    }];
    const gruppi = {};
    for (const x of r.mfo.sintesi) (gruppi[x.sez] = gruppi[x.sez] || []).push({ dom: x.dom, risp: x.risp });
    Object.entries(gruppi).forEach(([sez, righe]) => extra.push({ titolo: "Analisi patrimoniale: " + sez.toLowerCase(), righe }));
    sezioni.splice(k, 0, ...extra.filter(x => x.righe.length));
  }
  /* Nota per il backoffice: per ogni garanzia scelta, quali compagnie la offrono (dai DIP) */
  const mappa = [];
  for (const passo of passiVisibili(q, r)) for (const c of campiAttivi(passo, r)) {
    if (c.tipo !== "multipla" || !Array.isArray(r[c.id])) continue;
    for (const v of r[c.id]) {
      const o = (valore(c.opzioni, r) || []).find(x => x.v === v);
      if (o && (o.comp || o.rif)) mappa.push({ dom: (o.g ? o.g + " · " : "") + o.t, risp: [(o.comp || []).map(x => NOME_COMP[x] || x).join(", "), o.rif].filter(Boolean).join(" — ") });
    }
  }
  if (mappa.length) sezioni.push({ titolo: "Per il backoffice: compagnie che offrono le garanzie scelte (indicativo, dai DIP)", righe: mappa, soloBackoffice: true });
  const allegati = [];
  for (const passo of passiVisibili(q, r)) for (const c of campiAttivi(passo, r))
    if (c.tipo === "allegato" && Array.isArray(r[c.id])) for (const f of r[c.id]) allegati.push({ ...f, voce: valore(c.dom, r) });
  const strada = p.prodotto ? (percorsoNodo(p.prodotto) || []).map(n => n.nome).join(" › ") : "";
  return {
    tipo: p.tipo === "sinistro" ? "Denuncia di sinistro" : "Richiesta di preventivo",
    prodotto: titoloPratica(p), strada,
    cliente: r.nome || "Cliente senza nome",
    data: new Date(),
    segnalazioni: segnalazioni(q, r),
    sezioni, allegati
  };
}

function nomeFile(p, est) {
  const pul = s => String(s).normalize("NFD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
  const oggi = new Date().toISOString().slice(0, 10);
  return `${p.tipo === "sinistro" ? "Sinistro" : "Preventivo"}_${pul(titoloPratica(p))}_${pul(p.risposte.nome || "cliente")}_${oggi}.${est}`;
}

/* ---------- testo per l'email (versione compatta del riepilogo) ---------- */
function testoEmail(p, commerciale, maxCaratteri) {
  const R = costruisciRiepilogo(p);
  const righe = [`${R.tipo}: ${R.prodotto}${R.strada ? " (" + R.strada + ")" : ""}`, `Cliente: ${R.cliente}`, `Inviata da: ${commerciale.nome || "-"}${commerciale.tel ? " · " + commerciale.tel : ""}`, ""];
  if (R.segnalazioni.length) { righe.push("DA VERIFICARE:"); R.segnalazioni.forEach(s => righe.push("- " + s.testo)); righe.push(""); }
  for (const s of R.sezioni) { righe.push(s.titolo.toUpperCase()); s.righe.forEach(x => righe.push(`${x.dom}: ${x.risp}`)); righe.push(""); }
  if (R.allegati.length) righe.push("Allegati: " + R.allegati.map(a => a.nome).join(", "));
  let t = righe.join("\n");
  if (maxCaratteri && t.length > maxCaratteri) t = t.slice(0, maxCaratteri - 80) + "\n…\n[Testo abbreviato: il dettaglio completo è nel PDF allegato]";
  return t;
}

/* ================= PDF ================= */
const PDF_LARG = {
  n: [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584],
  b: [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584]
};
const PDF_SPECIALI = { "€": 0x80, "‚": 0x82, "„": 0x84, "…": 0x85, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97, "›": 0x9B, "‹": 0x8B, "™": 0x99 };

/* Converte il testo nella codifica del carattere PDF (WinAnsi); lettere accentate comprese */
function pdfCodifica(s) {
  let out = "";
  for (const ch of String(s)) {
    const c = ch.charCodeAt(0), cp = ch.codePointAt(0);
    if (cp > 0xFFFF || (cp >= 0x2190 && cp <= 0x2BFF && !PDF_SPECIALI[ch]) || cp === 0xFE0F || cp === 0x200D) continue;   // emoji e simboli: non stampabili in Helvetica
    if (PDF_SPECIALI[ch]) out += String.fromCharCode(PDF_SPECIALI[ch]);
    else if (c >= 32 && c < 127) out += ch;
    else if (c >= 160 && c < 256) out += ch;
    else if (ch === "\t") out += " ";
    else { const base = ch.normalize("NFD")[0]; out += base.charCodeAt(0) < 127 ? base : "?"; }
  }
  return out;
}
function pdfLarghezza(s, grassetto, corpo) {
  const t = grassetto ? PDF_LARG.b : PDF_LARG.n; let w = 0;
  for (const ch of pdfCodifica(s)) {
    let c = ch.charCodeAt(0);
    if (c >= 192) c = ch.normalize("NFD").charCodeAt(0);         // accentate: larghezza della lettera base
    w += (c >= 32 && c <= 126) ? t[c - 32] : 556;
  }
  return w * corpo / 1000;
}
function pdfACapo(testo, larghezza, grassetto, corpo) {
  const righe = [];
  for (const paragrafo of String(testo).split("\n")) {
    let riga = "";
    for (const parola of paragrafo.split(/\s+/)) {
      if (!parola) continue;
      const prova = riga ? riga + " " + parola : parola;
      if (pdfLarghezza(prova, grassetto, corpo) <= larghezza) { riga = prova; continue; }
      if (riga) righe.push(riga);
      /* parola più lunga della riga (es. un indirizzo email): si spezza a forza */
      let pz = parola;
      while (pdfLarghezza(pz, grassetto, corpo) > larghezza) {
        let k = pz.length; while (k > 1 && pdfLarghezza(pz.slice(0, k), grassetto, corpo) > larghezza) k--;
        righe.push(pz.slice(0, k)); pz = pz.slice(k);
      }
      riga = pz;
    }
    righe.push(riga);
  }
  return righe;
}
const pdfEsc = s => pdfCodifica(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

/* Crea il PDF del riepilogo. Restituisce un Blob "application/pdf". */
function creaPDF(p, commerciale) {
  const R = costruisciRiepilogo(p);
  const W = 595.28, H = 841.89, M = 42, LARGH = W - 2 * M;
  const BLU = "0.161 0.302 0.584", GRIGIO = "0.36 0.40 0.45", NERO = "0.16 0.16 0.16";
  const pagine = []; let ops = [], y = 0;

  function nuovaPagina() {
    ops = []; pagine.push(ops); y = H - M;
    if (pagine.length === 1) {
      if (LOGO_JPG) ops.push(`q 96 0 0 60 ${M} ${y - 60} cm /Logo Do Q`);
      testo(R.tipo.toUpperCase(), M + 112, y - 16, true, 9, BLU);
      testo(R.prodotto, M + 112, y - 36, true, 18, NERO);
      testo(R.strada, M + 112, y - 52, false, 9, GRIGIO);
      y -= 76;
      linea(M, y, W - M, y, "0.85 0.89 0.94", 1);
      y -= 18;
      const dataTxt = R.data.toLocaleDateString("it-IT") + " " + R.data.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
      coppia("Cliente", R.cliente, true);
      coppia("Data", dataTxt);
      coppia("Commerciale", [commerciale.nome, commerciale.email, commerciale.tel].filter(Boolean).join(" · ") || "-");
      y -= 6;
    } else {
      testo(`${R.prodotto} · ${R.cliente}`, M, y - 8, false, 8, GRIGIO); y -= 24;
    }
  }
  function testo(t, x, yy, b, corpo, colore) { if (t) ops.push(`BT /${b ? "F2" : "F1"} ${corpo} Tf ${colore || NERO} rg ${x.toFixed(2)} ${yy.toFixed(2)} Td (${pdfEsc(t)}) Tj ET`); }
  function linea(x1, y1, x2, y2, colore, sp) { ops.push(`${colore} RG ${sp} w ${x1} ${y1.toFixed(2)} m ${x2} ${y2.toFixed(2)} l S`); }
  function rett(x, yy, w, h, colore) { ops.push(`${colore} rg ${x} ${yy.toFixed(2)} ${w} ${h.toFixed(2)} re f`); }
  function spazio(h) { if (y - h < M + 20) nuovaPagina(); }
  function coppia(dom, risp, grassetto) {
    const colDom = 150, righeR = pdfACapo(risp, LARGH - colDom - 8, !!grassetto, 10), righeD = pdfACapo(dom, colDom - 8, false, 9);
    const h = Math.max(righeR.length * 13, righeD.length * 11.5) + 5;
    spazio(h);
    righeD.forEach((t, i) => testo(t, M, y - 10 - i * 11.5, false, 9, GRIGIO));
    righeR.forEach((t, i) => testo(t, M + colDom, y - 10 - i * 13, !!grassetto, 10, NERO));
    y -= h;
  }
  function titoloSezione(t) {
    spazio(75); y -= 10;   /* il titolo non resta mai da solo in fondo alla pagina */
    rett(M, y - 20, LARGH, 20, "0.914 0.933 0.969");
    testo(t, M + 8, y - 14, true, 11, BLU); y -= 28;
  }

  nuovaPagina();
  if (R.segnalazioni.length) {
    titoloSezione("Da verificare");
    for (const s of R.segnalazioni) {
      const righe = pdfACapo(s.testo, LARGH - 16, false, 9.5), h = righe.length * 12.5 + 6;
      spazio(h);
      const col = s.livello === "rosso" ? "0.64 0.15 0.17" : s.livello === "ambra" ? "0.60 0.36 0" : BLU;
      rett(M, y - h + 3, 3, h - 4, col);
      righe.forEach((t, i) => testo(t, M + 10, y - 10 - i * 12.5, false, 9.5, col));
      y -= h;
    }
  }
  for (const s of R.sezioni) {
    titoloSezione(s.titolo);
    for (const x of s.righe) coppia(x.dom, x.risp, x.grave);
  }
  if (R.allegati.length) {
    titoloSezione(`Allegati (${R.allegati.length})`);
    for (const a of R.allegati) coppia(a.voce, `${a.nome} · ${Math.max(1, Math.round(a.dim / 1024))} KB`);
  }
  spazio(40); y -= 14;
  for (const t of pdfACapo("Documento generato dall'app Bussola per uso interno dell'agenzia. Dopo l'invio la pratica viene cancellata dal dispositivo del commerciale.", LARGH, false, 8))
    { testo(t, M, y, false, 8, GRIGIO); y -= 10; }

  /* piè di pagina con numerazione */
  pagine.forEach((o, i) => {
    o.push(`0.85 0.89 0.94 RG 0.6 w ${M} ${M - 6} m ${W - M} ${M - 6} l S`);
    o.push(`BT /F1 8 Tf ${GRIGIO} rg ${M} ${M - 18} Td (${pdfEsc(AGENZIA.nome + " · " + R.cliente + " · " + AGENZIA.app + " " + AGENZIA.versione)}) Tj ET`);
    const n = `Pagina ${i + 1} di ${pagine.length}`;
    o.push(`BT /F1 8 Tf ${GRIGIO} rg ${(W - M - pdfLarghezza(n, false, 8)).toFixed(2)} ${M - 18} Td (${n}) Tj ET`);
  });

  return scriviPDF(pagine, `${R.tipo} - ${R.prodotto} - ${R.cliente}`, W, H);
}

/* ---- scrittura del file: oggetti, tabella xref, trailer ---- */
function scriviPDF(pagine, titolo, W, H) {
  const oggetti = [];
  const agg = s => { oggetti.push(s); return oggetti.length; };
  const idCatalogo = agg(null), idPagine = agg(null);
  const idF1 = agg("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const idF2 = agg("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  let idLogo = 0;
  if (LOGO_JPG && pagine.some(o => o.some(x => x.includes("/Logo Do")))) {
    const bin = atob(LOGO_JPG.dati);
    idLogo = agg(`<< /Type /XObject /Subtype /Image /Width ${LOGO_JPG.l} /Height ${LOGO_JPG.a} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bin.length} >>\nstream\n${bin}\nendstream`);
  }
  const idsPagina = pagine.map(o => {
    const flusso = o.join("\n");
    const idC = agg(`<< /Length ${flusso.length} >>\nstream\n${flusso}\nendstream`);
    return agg(`<< /Type /Page /Parent ${idPagine} 0 R /MediaBox [0 0 ${W} ${H}] /Contents ${idC} 0 R /Resources << /Font << /F1 ${idF1} 0 R /F2 ${idF2} 0 R >>${idLogo ? ` /XObject << /Logo ${idLogo} 0 R >>` : ""} >> >>`);
  });
  oggetti[idCatalogo - 1] = `<< /Type /Catalog /Pages ${idPagine} 0 R >>`;
  oggetti[idPagine - 1] = `<< /Type /Pages /Kids [${idsPagina.map(i => i + " 0 R").join(" ")}] /Count ${idsPagina.length} >>`;
  const idInfo = agg(`<< /Title (${pdfEsc(titolo)}) /Producer (Bussola) /CreationDate (D:${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)}) >>`);
  let out = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const pos = [];
  oggetti.forEach((o, i) => { pos.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${oggetti.length + 1}\n0000000000 65535 f \n` + pos.map(n => String(n).padStart(10, "0") + " 00000 n \n").join("");
  out += `trailer\n<< /Size ${oggetti.length + 1} /Root ${idCatalogo} 0 R /Info ${idInfo} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  const byte = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) byte[i] = out.charCodeAt(i) & 255;
  return new Blob([byte], { type: "application/pdf" });
}

/* ---- lettera di disdetta del cliente (Documenti utili della Guida) ---- */
const TESTO_DISDETTA = [
  "Con la presente intendo presentare disdetta, a termine delle Condizioni Generali di assicurazione della polizza in oggetto, comprese eventuali successive sostituzioni della medesima.",
  "Revoco inoltre il consenso all'utilizzo dei miei dati personali, ad eccezione dei dati personali che il titolare è obbligato a conservare al fine di adempiere a un obbligo legale."
];
function dataIt(v) { const [a, m, g] = String(v || "").split("-"); return g ? `${g}/${m}/${a}` : (v || ""); }
function creaDisdettaPDF(d) {
  const W = 595.28, H = 841.89, M = 64, LARGH = W - 2 * M, NERO = "0.1 0.1 0.1";
  const ops = []; let y = H - 80;
  const testo = (t, x, yy, b, corpo) => { if (t) ops.push(`BT /${b ? "F2" : "F1"} ${corpo} Tf ${NERO} rg ${x.toFixed(2)} ${yy.toFixed(2)} Td (${pdfEsc(t)}) Tj ET`); };
  const blocco = (righe, x, larg, b) => { for (const riga of righe) for (const t of pdfACapo(riga, larg, b, 11)) { testo(t, x, y, b, 11); y -= 15; } };
  blocco([d.nome, d.indirizzo, d.cf ? "Codice fiscale: " + d.cf : ""].filter(Boolean), M, 260, false);
  y -= 22;
  const xDest = M + LARGH / 2;
  testo("Spett.le", xDest, y, false, 11); y -= 15;
  blocco([d.compagnia, d.indComp].filter(Boolean), xDest, LARGH / 2, true);
  y -= 30;
  testo(`${d.luogo || ""}${d.luogo ? ", " : ""}${dataIt(d.data)}`, M, y, false, 11); y -= 34;
  blocco([`Oggetto: disdetta della polizza n. ${d.polizza} alla prossima scadenza del ${dataIt(d.scadenza)}`], M, LARGH, true);
  y -= 16;
  for (const par of TESTO_DISDETTA) { blocco([par], M, LARGH, false); y -= 10; }
  y -= 14; testo("Distinti saluti.", M, y, false, 11); y -= 60;
  testo("Firma", xDest, y, false, 11); y -= 26;
  ops.push(`0.4 0.4 0.4 RG 0.6 w ${xDest} ${y.toFixed(2)} m ${W - M} ${y.toFixed(2)} l S`);
  return scriviPDF([ops], `Disdetta polizza ${d.polizza}`, W, H);
}
