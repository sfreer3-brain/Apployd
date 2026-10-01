/* =====================================================================
   LOGICA: memoria locale, pratiche, visibilità dei campi, controlli.
   Nessun riferimento all'interfaccia qui dentro.
   ===================================================================== */

/* ---------- memoria locale protetta: se il browser la blocca, si lavora in RAM ---------- */
const Memoria = (() => {
  let ok = false, ram = {};
  try { const k = "__prova__"; localStorage.setItem(k, "1"); localStorage.removeItem(k); ok = true; } catch (e) { ok = false; }
  return {
    disponibile: () => ok,
    leggi(chiave, predefinito) {
      try { const s = ok ? localStorage.getItem(chiave) : ram[chiave]; return s == null ? predefinito : JSON.parse(s); }
      catch (e) { return predefinito; }
    },
    scrivi(chiave, valore) {
      const s = JSON.stringify(valore);
      try { if (ok) localStorage.setItem(chiave, s); else ram[chiave] = s; } catch (e) { ram[chiave] = s; }
    },
    togli(chiave) { try { if (ok) localStorage.removeItem(chiave); } catch (e) {} delete ram[chiave]; }
  };
})();

/* ---------- pratiche (bozze non ancora inviate) ---------- */
const Pratiche = {
  tutte() { return Memoria.leggi("bussola.pratiche", []); },
  salva(p) {
    p.aggiornata = Date.now();
    const elenco = this.tutte().filter(x => x.id !== p.id);
    elenco.unshift(p);
    Memoria.scrivi("bussola.pratiche", elenco);
  },
  elimina(id) { Memoria.scrivi("bussola.pratiche", this.tutte().filter(x => x.id !== id)); Allegati.eliminaPratica(id); },
  pulisciVecchie() {
    const limite = Date.now() - AGENZIA.giorniConservazioneBozze * 864e5;
    const restano = this.tutte().filter(x => (x.aggiornata || 0) > limite);
    Memoria.scrivi("bussola.pratiche", restano);
    Allegati.tieniSolo(restano.map(x => x.id));   // cancella anche i file delle pratiche scadute
  },
  nuova(tipo, questionario) {
    return { id: "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), tipo, questionario, passo: 0, risposte: {}, creata: Date.now() };
  }
};

/* ---------- allegati (foto e file): nel database del browser, con ripiego in RAM ----------
   I file non stanno nella memoria semplice (troppo piccola): si usa IndexedDB, il database
   interno del browser. Se non è disponibile, restano solo finché la pagina è aperta.        */
const Allegati = (() => {
  const ram = new Map();
  let dbProm = null;
  function db() {
    if (dbProm) return dbProm;
    dbProm = new Promise(ok => {
      try {
        const req = indexedDB.open("bussola", 1);
        req.onupgradeneeded = () => req.result.createObjectStore("file", { keyPath: "id" });
        req.onsuccess = () => ok(req.result);
        req.onerror = () => ok(null);
      } catch (e) { ok(null); }
    });
    return dbProm;
  }
  async function op(modo, fn) {
    const d = await db(); if (!d) return null;
    return new Promise(ok => {
      try { const tx = d.transaction("file", modo); const r = fn(tx.objectStore("file")); tx.oncomplete = () => ok(r && r.result); tx.onerror = () => ok(null); }
      catch (e) { ok(null); }
    });
  }
  return {
    async salva(pratica, blob, nome) {
      const rec = { id: "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), pratica, blob, nome, tipo: blob.type, dim: blob.size };
      ram.set(rec.id, rec);
      await op("readwrite", st => st.put(rec));
      return { id: rec.id, nome, tipo: blob.type, dim: blob.size };
    },
    async leggi(id) { if (ram.has(id)) return ram.get(id).blob; const r = await op("readonly", st => st.get(id)); return r ? r.blob : null; },
    async elimina(id) { ram.delete(id); await op("readwrite", st => st.delete(id)); },
    async eliminaPratica(pratica) { return this.tieniSolo(Pratiche.tutte().map(x => x.id).filter(x => x !== pratica)); },
    async tieniSolo(praticheValide) {
      const ok = new Set(praticheValide);
      for (const [k, v] of ram) if (!ok.has(v.pratica)) ram.delete(k);
      const tutti = (await op("readonly", st => st.getAll())) || [];
      for (const f of tutti) if (!ok.has(f.pratica)) await op("readwrite", st => st.delete(f.id));
    }
  };
})();

/* Riduce le foto (max 1800 px, JPEG) per non appesantire le email; i PDF restano come sono. */
async function preparaFile(file) {
  const MAX_MB = 10;
  if (!/^image\//.test(file.type)) {
    if (file.type !== "application/pdf") throw new Error("Formato non supportato: usa una foto o un PDF");
    if (file.size > MAX_MB * 1048576) throw new Error(`Il PDF supera ${MAX_MB} MB`);
    return { blob: file, nome: file.name };
  }
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(ok => c.toBlob(ok, "image/jpeg", 0.82));
    if (blob && blob.size < file.size) return { blob, nome: file.name.replace(/\.[^.]+$/, "") + ".jpg" };
  } catch (e) { /* se il browser non sa ridurla, si tiene l'originale */ }
  if (file.size > MAX_MB * 1048576) throw new Error(`La foto supera ${MAX_MB} MB`);
  return { blob: file, nome: file.name };
}

/* ---------- questionario: valori calcolati ---------- */
function valore(x, r) { return typeof x === "function" ? x(r) : x; }

function figliAperti(c, r) {
  if (!c.figli) return false;
  const q = c.figli.quando, v = r[c.id];
  return typeof q === "function" ? !!q(v, r) : v === q;
}

function campoVisibile(c, r) { return !c.se || !!c.se(r); }

/* Campi di un passo effettivamente visibili, figli compresi (per controlli e riepilogo) */
function campiAttivi(passo, r) {
  const out = [];
  (function giro(lista) {
    for (const c of lista) {
      if (!campoVisibile(c, r)) continue;
      out.push(c);
      if (figliAperti(c, r)) giro(c.figli.campi);
    }
  })(passo.campi);
  return out;
}

function passiVisibili(q, r) { return q.passi.filter(p => (!p.se || p.se(r)) && campiAttivi(p, r).length > 0); }

function vuoto(v) { return v == null || v === "" || v === false || (Array.isArray(v) && v.length === 0); }

/* Restituisce { idCampo: "messaggio" } per i campi obbligatori mancanti o non validi */
function controllaPasso(passo, r) {
  const errori = {};
  for (const c of campiAttivi(passo, r)) {
    const v = r[c.id];
    if (valore(c.obbl, r) && vuoto(v)) { errori[c.id] = c.msgObbl || (c.tipo === "mfo" ? "Completa l'analisi fino alla pagina dei risultati" : "Risposta necessaria"); continue; }
    if (c.verifica && !vuoto(v)) { const m = c.verifica(v, r); if (m) { errori[c.id] = m; continue; } }
    if (!vuoto(v) && c.tipo === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) errori[c.id] = "Indirizzo non valido";
    if (!vuoto(v) && c.tipo === "tel") { const n = String(v).replace(/[\s\-\/.()]/g, ""); if (!/^\+?\d{6,15}$/.test(n)) errori[c.id] = "Numero non valido: solo cifre, eventualmente con + davanti"; }
    if (!vuoto(v) && c.id === "piva" && !/^\d{11}$/.test(String(v).replace(/\s/g, ""))) errori[c.id] = "La partita IVA ha 11 cifre";
    if (!vuoto(v) && c.id === "cf") { const e = analizzaCF(v); if (!e.valido) errori[c.id] = e.errore; }
    if (c.tipo === "scelta" && !vuoto(v)) {
      const opz = valore(c.opzioni, r) || [];
      if (!opz.some(o => o.v === v)) errori[c.id] = "Scelta non più valida: riseleziona";
    }
  }
  /* Gruppi "almeno uno": basta compilarne uno (es. partita IVA o codice fiscale) */
  const gruppi = {};
  for (const c of campiAttivi(passo, r)) if (c.almenoUno) (gruppi[c.almenoUno] = gruppi[c.almenoUno] || []).push(c);
  for (const lista of Object.values(gruppi)) {
    if (lista.every(c => vuoto(r[c.id]))) {
      for (const c of lista) errori[c.id] = errori[c.id] || "Compila almeno uno tra " + lista.map(x => valore(x.dom, r)).join(" e ");
    }
  }
  return errori;
}


/* Segnalazioni per il backoffice: dichiarazioni non confermate, fuori soglia, compliance */
function segnalazioni(q, r) {
  const out = [];
  for (const p of passiVisibili(q, r)) for (const c of campiAttivi(p, r)) {
    const v = r[c.id];
    if (c.tipo === "conferma" && v === "no") out.push({ livello: "rosso", testo: "Non confermato: " + valore(c.dom, r) });
    if (c.avviso && !vuoto(v)) { const a = c.avviso(c.tipo === "euro" ? Number(v) : v, r); if (a) out.push(a); }
    if (c.tipo === "sino" && v === "no" && c.avvisoNo) out.push({ livello: c.avvisoNo.livello, testo: c.avvisoNo.testo });
    if (c.avvisoSe) { const a = c.avvisoSe(v, r); if (a) out.push({ livello: a.livello, testo: valore(c.dom, r) + ": " + a.testo }); }
  }
  return out;
}

/* ---------- smistamento: rotazione semplice per gruppo di destinatari ---------- */
function destinatarioProposto(gruppo) {
  const d = DESTINATARI[gruppo];
  if (!d || d.modo === "tutti") return d ? d.indirizzi.slice() : [];
  const giri = Memoria.leggi("bussola.rotazione", {});
  const i = (giri[gruppo] || 0) % d.indirizzi.length;
  return [d.indirizzi[i]];
}
function avanzaRotazione(gruppo) {
  const giri = Memoria.leggi("bussola.rotazione", {});
  giri[gruppo] = (giri[gruppo] || 0) + 1;
  Memoria.scrivi("bussola.rotazione", giri);
}

/* IBAN: controllo internazionale (ISO 13616, resto della divisione per 97) */
function ibanValido(v) {
  const x = String(v || "").replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(x)) return false;
  if (x.startsWith("IT") && x.length !== 27) return false;
  const num = (x.slice(4) + x.slice(0, 4)).replace(/[A-Z]/g, c => String(c.charCodeAt(0) - 55));
  let resto = 0;
  for (const cifra of num) resto = (resto * 10 + Number(cifra)) % 97;
  return resto === 1;
}

/* Campi con valori "suggeriti" (es. garanzie consigliate in base alle risposte):
   si aggiornano da soli finché il commerciale non li modifica a mano. */
function stessoInsieme(a, b) { return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every(x => b.includes(x)); }
function applicaSuggeriti(passo, r) {
  r._sugg = r._sugg || {};
  /* più giri: un suggerimento può far comparire un altro campo suggerito (sezioni → garanzie) */
  const fatti = new Set();
  for (let giro = 0; giro < 4; giro++) {
    let nuoviCampi = false;
    for (const c of campiAttivi(passo, r)) {
      if (!c.suggerito || fatti.has(c.id)) continue;
      fatti.add(c.id); nuoviCampi = true;
      const nuovo = c.suggerito(r), prec = r._sugg[c.id];
      if (r[c.id] === undefined || stessoInsieme(r[c.id], prec)) r[c.id] = nuovo.slice();
      r._sugg[c.id] = nuovo;
    }
    if (!nuoviCampi) break;
  }
}
