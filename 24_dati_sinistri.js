/* =====================================================================
   SINISTRI: un unico percorso per tutti i rami.
   Il ramo e il tipo di evento decidono le domande in più e l'elenco dei
   documenti da raccogliere (primo pezzo del know-how dell'agenzia:
   da rivedere e completare insieme al backoffice sinistri).
   ===================================================================== */

const RAMI_SINISTRO = [
  { v: "auto", t: "Auto" },
  { v: "casa", t: "Casa" },
  { v: "azienda", t: "Azienda, negozio, ufficio" },
  { v: "rc", t: "Responsabilità civile verso terzi" },
  { v: "rcprof", t: "RC professionale" },
  { v: "infortuni", t: "Infortuni" },
  { v: "salute", t: "Salute" },
  { v: "altro", t: "Altro" }
];

const EVENTI_SINISTRO = {
  auto: [{ v: "scontro", t: "Scontro con un altro veicolo" }, { v: "urtoCose", t: "Urto contro cose o animali" }, { v: "furtoAuto", t: "Furto o tentato furto" }, { v: "cristalli", t: "Rottura cristalli" }, { v: "atmosferici", t: "Grandine o eventi atmosferici" }, { v: "vandalici", t: "Atti vandalici" }, { v: "incendio", t: "Incendio" }],
  casa: [{ v: "acqua", t: "Perdita d'acqua / acqua condotta" }, { v: "incendio", t: "Incendio" }, { v: "furto", t: "Furto o rapina" }, { v: "atmosferici", t: "Eventi atmosferici" }, { v: "elettrico", t: "Fenomeno elettrico" }, { v: "cristalli", t: "Rottura lastre" }, { v: "rcTerzi", t: "Danno causato a terzi" }],
  azienda: [{ v: "acqua", t: "Perdita d'acqua / acqua condotta" }, { v: "incendio", t: "Incendio" }, { v: "furto", t: "Furto o rapina" }, { v: "atmosferici", t: "Eventi atmosferici" }, { v: "elettrico", t: "Fenomeno elettrico / guasto macchinari" }, { v: "rcTerzi", t: "Danno causato a terzi" }],
  rc: [{ v: "rcTerzi", t: "Danno a persone" }, { v: "rcCose", t: "Danno a cose" }],
  rcprof: [{ v: "richiesta", t: "Richiesta di risarcimento ricevuta" }, { v: "circostanza", t: "Circostanza che potrebbe portare a una richiesta" }],
  infortuni: [{ v: "infortunio", t: "Infortunio" }],
  salute: [{ v: "ricovero", t: "Ricovero o intervento" }, { v: "visite", t: "Visite, esami, cure" }],
  altro: [{ v: "altro", t: "Altro" }]
};

/* Documenti da raccogliere per tipo di evento */
const DOC_SINISTRO = {
  scontro: ["Modulo CAI (constatazione amichevole) firmato da entrambi", "Foto dei veicoli e del luogo", "Libretto di circolazione e patente del conducente", "Dati e assicurazione della controparte", "Verbale delle autorità, se intervenute"],
  urtoCose: ["Foto del veicolo e dell'oggetto urtato", "Libretto e patente", "Verbale delle autorità, se intervenute"],
  furtoAuto: ["Denuncia alle autorità", "Tutte le chiavi del veicolo", "Libretto e certificato di proprietà", "In caso di furto totale: estratto cronologico PRA"],
  cristalli: ["Foto del cristallo danneggiato", "Preventivo o fattura del riparatore"],
  atmosferici: ["Foto dei danni", "Preventivo di riparazione", "Eventuale bollettino meteo della zona"],
  vandalici: ["Denuncia alle autorità", "Foto dei danni", "Preventivo di riparazione"],
  incendio: ["Foto dei danni", "Rapporto dei Vigili del Fuoco", "Elenco dei beni danneggiati con valore", "Preventivi di ripristino"],
  acqua: ["Foto dei danni e del punto di rottura", "Fattura della ricerca guasto", "Preventivo di riparazione", "Dati dell'amministratore, se in condominio", "Dati dei vicini danneggiati, se ce ne sono"],
  furto: ["Denuncia alle autorità", "Elenco dei beni sottratti con valore e prove di acquisto", "Foto dell'effrazione", "Preventivo per ripristinare porte e finestre"],
  elettrico: ["Relazione del tecnico sulla causa del guasto", "Preventivo o fattura di riparazione", "Elenco degli apparecchi danneggiati"],
  rcTerzi: ["Richiesta di risarcimento del danneggiato, se arrivata", "Dati del danneggiato", "Foto del danno", "Nomi dei testimoni"],
  rcCose: ["Richiesta di risarcimento del danneggiato, se arrivata", "Dati del danneggiato", "Foto del danno", "Preventivo o fattura della riparazione"],
  richiesta: ["Lettera di richiesta di risarcimento (o dell'avvocato)", "Lettera d'incarico e documenti della pratica contestata", "Cronologia dei fatti"],
  circostanza: ["Descrizione della circostanza con date", "Documenti della pratica interessata"],
  infortunio: ["Certificato del pronto soccorso o del medico", "Referti ed esami", "Certificato di guarigione, quando disponibile", "Fatture delle spese mediche"],
  ricovero: ["Cartella clinica", "Fatture delle spese", "Prescrizione medica"],
  visite: ["Prescrizione medica", "Fatture delle spese", "Referti"],
  altro: ["Foto e documenti utili a descrivere il danno"]
};
const DOC_SINISTRO_SEMPRE = ["Documento d'identità e codice fiscale del denunciante", "IBAN per il pagamento"];
const docSinistro = r => (DOC_SINISTRO[r.evento] || []).concat(DOC_SINISTRO_SEMPRE);

const ramoS = (r, ...x) => x.includes(r.ramoSin);
const eventoS = (r, ...x) => x.includes(r.evento);

QUESTIONARI.sinistro = {
  titolo: "Sinistro",
  passi: [
    { id: "assicurato", titolo: "Assicurato", sotto: "Chi ha la polizza e come contattarlo.", campi: [
      { id: "nome", tipo: "testo", obbl: true, largo: true, dom: "Nome e cognome o ragione sociale dell'assicurato" },
      { id: "cf", tipo: "testo", almenoUno: "idFiscale", dom: "Codice fiscale", maiuscolo: true, deriva: derivaDaCF },
      { id: "piva", tipo: "testo", almenoUno: "idFiscale", dom: "Partita IVA", tastiera: "numeric" },
      { id: "tel", tipo: "tel", obbl: true, dom: "Telefono" },
      { id: "email", tipo: "email", obbl: true, dom: "Email" },
      { id: "denunciante", tipo: "scelta", obbl: true, dom: "Chi denuncia il sinistro?", opzioni: [{ v: "assicurato", t: "L'assicurato" }, { v: "altro", t: "Un'altra persona" }],
        figli: { quando: "altro", campi: [{ id: "denuncianteNome", tipo: "testo", obbl: true, dom: "Nome e cognome" }, { id: "denuncianteRuolo", tipo: "testo", obbl: true, dom: "Rapporto con l'assicurato" }] } }
    ]},
    { id: "polizza", titolo: "Polizza", sotto: "Quale contratto è coinvolto.", campi: [
      { id: "ramoSin", tipo: "scelta", verticale: true, obbl: true, dom: "Ramo", opzioni: RAMI_SINISTRO },
      { id: "compagnia", tipo: "testo", dom: "Compagnia" },
      { id: "numPolizza", tipo: "testo", dom: "Numero di polizza", maiuscolo: true,
        avvisoVuoto: () => ({ livello: "blu", testo: "Se non lo sai, il backoffice lo ricava dal nome: ma con il numero la pratica parte prima." }) },
      { id: "targa", tipo: "testo", obbl: true, maiuscolo: true, se: r => ramoS(r, "auto"), dom: "Targa del veicolo assicurato" }
    ]},
    { id: "evento", titolo: "Evento", sotto: "Cosa è successo, quando e dove.", campi: [
      { id: "evento", tipo: "scelta", verticale: true, obbl: true, dom: "Tipo di evento", opzioni: r => EVENTI_SINISTRO[r.ramoSin] || EVENTI_SINISTRO.altro },
      { id: "dataSin", tipo: "data", obbl: true, dom: "Data dell'evento",
        verifica: v => v > new Date().toISOString().slice(0, 10) ? "La data non può essere nel futuro" : null,
        avviso: v => { const g = Math.floor((Date.now() - new Date(v)) / 864e5); return g > 3 ? { livello: "ambra", testo: `Sono passati ${g} giorni: il codice civile (art. 1913) prevede la denuncia entro 3 giorni. Invia subito la pratica.` } : null; } },
      { id: "oraSin", tipo: "testo", dom: "Ora (circa)" },
      { id: "luogoSin", tipo: "testo", obbl: true, largo: true, dom: "Luogo (indirizzo o località)" },
      { id: "descrizione", tipo: "nota", obbl: true, dom: "Descrizione dei fatti", aiuto: "Con parole semplici: cosa è successo, chi era presente, come si è accorto del danno." },
      { id: "autorita", tipo: "scelta", dom: "Sono intervenute le autorità?", opzioni: [{ v: "no", t: "No" }, { v: "polizia", t: "Polizia o Carabinieri" }, { v: "locale", t: "Polizia locale" }, { v: "vvf", t: "Vigili del Fuoco" }],
        avvisoSe: (v, r) => eventoS(r, "furto", "furtoAuto", "vandalici") && v !== "polizia" ? { livello: "ambra", testo: "Per furti e atti vandalici serve la denuncia alle autorità: senza, la compagnia non liquida." } : null },
      { id: "controparte", tipo: "sino", obbl: true, se: r => eventoS(r, "scontro", "rcTerzi", "rcCose", "richiesta"), dom: "C'è una controparte (altro veicolo o danneggiato)?",
        figli: { quando: "si", campi: [
          { id: "contNome", tipo: "testo", obbl: true, dom: "Nome della controparte" },
          { id: "contTarga", tipo: "testo", maiuscolo: true, se: r => ramoS(r, "auto"), obbl: r => eventoS(r, "scontro"), dom: "Targa della controparte",
            avviso: v => /^[A-Z]{2}\s?\d{3}\s?[A-Z]{2}$/i.test(String(v).trim()) ? null : { livello: "blu", testo: "Non è una targa italiana del tipo AB123CD: va bene se è estera o di una moto, altrimenti ricontrolla." } },
          { id: "contAss", tipo: "testo", se: r => ramoS(r, "auto"), dom: "Assicurazione della controparte" },
          { id: "cai", tipo: "sino", obbl: true, se: r => eventoS(r, "scontro"), dom: "Il modulo CAI è stato firmato da entrambi?",
            avvisoSe: v => v === "no" ? { livello: "ambra", testo: "Senza CAI firmato da entrambi i tempi di liquidazione si allungano: raccogli testimoni e foto." } : null } ] } },
      { id: "feriti", tipo: "sino", se: r => ramoS(r, "auto", "rc"), dom: "Ci sono persone ferite?",
        avvisoSe: v => v === "si" ? { livello: "rosso", testo: "Sinistro con feriti: il backoffice va avvisato subito anche per telefono." } : null },
      { id: "testimoni", tipo: "sino", dom: "Ci sono testimoni?",
        figli: { quando: "si", campi: [{ id: "testimoniDesc", tipo: "nota", obbl: true, dom: "Nomi e recapiti dei testimoni" }] } },
      { id: "ammissione", tipo: "sino", se: r => ramoS(r, "rc", "rcprof"), dom: "L'assicurato ha già ammesso la propria responsabilità?",
        avvisoSe: v => v === "si" ? { livello: "ambra", testo: "Ricorda al cliente di non ammettere responsabilità né promettere risarcimenti: può compromettere la copertura." } : null },
      { id: "pronto", tipo: "sino", se: r => ramoS(r, "infortuni"), dom: "È andato al pronto soccorso o dal medico?" },
      { id: "lesioni", tipo: "nota", se: r => ramoS(r, "infortuni"), dom: "Lesioni riportate (come da certificato)" }
    ]},
    { id: "danno", titolo: "Danno e pagamento", sotto: "Quanto vale il danno e dove pagare.", campi: [
      { id: "beni", tipo: "nota", se: r => !ramoS(r, "infortuni", "salute", "rcprof"), dom: "Cosa è stato danneggiato" },
      { id: "stima", tipo: "euro", dom: "Stima del danno" },
      { id: "riparato", tipo: "sino", se: r => !ramoS(r, "infortuni", "salute", "rcprof"), dom: "Il danno è già stato riparato?",
        avvisoSe: v => v === "si" ? { livello: "ambra", testo: "Se è già riparato servono foto del prima e fattura: la compagnia potrebbe non poter periziare." } : null },
      { id: "iban", tipo: "testo", maiuscolo: true, largo: true, dom: "IBAN per il pagamento",
        obbl: r => r.ibanImpegno !== true, msgObbl: "Inserisci l'IBAN oppure spunta l'impegno qui sotto",
        verifica: v => ibanValido(v) ? null : "IBAN non valido: controlla le cifre" },
      { id: "ibanImpegno", tipo: "flag", se: r => vuoto(r.iban),
        dom: "Mi impegno a consegnare l'IBAN entro 3 giorni. So che senza IBAN l'indennizzo al cliente può subire ritardi.",
        avvisoSe: v => v === true ? { livello: "ambra", testo: "IBAN non ancora fornito: il commerciale si è impegnato a consegnarlo entro 3 giorni." } : null },
      { id: "ibanIntestatario", tipo: "testo", se: r => !vuoto(r.iban), dom: "Intestatario del conto" }
    ]},
    { id: "documenti", titolo: "Documenti", sotto: "Cosa serve per istruire la pratica.", campi: [
      { id: "docElenco", tipo: "info", dom: "Documenti da raccogliere", elenco: docSinistro },
      { id: "docSinistro", tipo: "allegato", dom: "Foto e documenti",
        avvisoVuoto: () => ({ livello: "ambra", testo: "Nessun documento allegato: almeno le foto del danno aiutano il perito." }) },
      { id: "privacySin", tipo: "sino", obbl: true, dom: "Il cliente ha firmato l'informativa privacy per la gestione del sinistro?",
        avvisoNo: { livello: "ambra", testo: "Serve il consenso al trattamento dei dati, anche sanitari se ci sono lesioni." } },
      { id: "urgenza", tipo: "scelta", dom: "Urgenza", opzioni: [{ v: "normale", t: "Normale" }, { v: "alta", t: "Urgente" }] },
      { id: "note", tipo: "nota", dom: "Note per il backoffice sinistri" }
    ]}
  ]
};
