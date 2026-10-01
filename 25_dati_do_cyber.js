/* =====================================================================
   D&O e CYBER RISK (aziende) — prodotti DUAL.
   D&O accorpa: D&O Plus Corporate Protection (modulo e proposta),
   versione No Profit, Corporate Protection Ordini Professionali.
   Cyber accorpa: Cyber Smart Plus società (fatturato fino a 10 mln),
   Cyber Smart Plus professionisti (fino a 2,5 mln), Cyber Corporate
   Midcorp (fatturato da 250 mln a 1 mld). La dimensione decide le domande.
   ===================================================================== */

const ente = (r, ...x) => x.includes(r.tipoEnte);

const EVENTI_DO = [
  { v: "richieste", t: "Richieste di risarcimento (anche di lavoro o per infortuni)" },
  { v: "circostanze", t: "Fatti o circostanze che potrebbero portare a richieste o procedimenti" },
  { v: "penali", t: "Procedimenti penali per incarichi aziendali" },
  { v: "infedelta", t: "Perdite per infedeltà di dipendenti" },
  { v: "indagini", t: "Indagini di autorità (Entrate, GdF, INPS…) con esborso" },
  { v: "annullate", t: "Polizze analoghe annullate dagli assicuratori" }
];
const MASSIMALI_DO = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 7500, 10000];
const FRANCHIGIE_DO = [{ v: "0", t: "Nessuna" }, { v: "2500", t: "€ 2.500" }, { v: "5000", t: "€ 5.000" }, { v: "7500", t: "€ 7.500" }, { v: "10000", t: "€ 10.000" }];
const migliaia = m => m >= 1000 ? (m / 1000).toLocaleString("it-IT") + " mln" : m + " mila";

const societaDo = r => r.doChi !== "persona";
const personaDo = r => r.doChi === "persona";
const INCARICHI_DO = [
  { v: "consigliere", t: "Consigliere di amministrazione" }, { v: "dirigente", t: "Dirigente" }, { v: "quadro", t: "Quadro o funzionario" },
  { v: "legale", t: "Rappresentante legale" }, { v: "unico", t: "Amministratore unico" }, { v: "revisore", t: "Revisore legale dei conti" },
  { v: "sindaco", t: "Sindaco (collegio sindacale)" }, { v: "odv", t: "Membro dell'organismo di vigilanza" }, { v: "altro", t: "Altro" }];

QUESTIONARI.do = {
  titolo: "RC amministratori (D&O)",
  passi: [
    { id: "chiDo", titolo: "Chi assicurare", sotto: "Da qui dipendono le domande successive.", campi: [
      { id: "doChi", tipo: "scelta", verticale: true, obbl: true, dom: "Chi va assicurato?",
        opzioni: [{ v: "societa", t: "La società o l'ente", n: "copre tutti gli amministratori e i dirigenti" },
                  { v: "persona", t: "Un singolo amministratore o dirigente", n: "copertura personale, per incarichi fino a 3 società" }] }
    ]},
    PASSO_CLIENTE,
    { id: "incarichiDo", titolo: "Incarichi", sotto: "Società in cui ha incarichi.", se: personaDo, campi: [
      { id: "elencoIncDo", tipo: "nota", obbl: true, dom: "Per ogni società: nome, P. IVA, totale attivo, incarico, settore di attività",
        aiuto: "Il prodotto standard copre fino a 3 società." },
      { id: "tipoIncDo", tipo: "multipla", obbl: true, dom: "Incarichi da coprire", opzioni: INCARICHI_DO,
        avviso: v => v.some(x => ["revisore", "sindaco", "odv"].includes(x)) ? { livello: "rosso", testo: "Revisore, sindaco e membro dell'OdV non sono assicurabili con questo prodotto: valuta la RC professionale." }
          : v.some(x => ["unico", "altro"].includes(x)) ? { livello: "ambra", testo: "Amministratore unico e altri incarichi: la compagnia valuta caso per caso." } : null },
      { id: "incDoAltro", tipo: "testo", obbl: true, se: r => (r.tipoIncDo || []).includes("altro"), dom: "Quale altro incarico" },
      { id: "totAttivoInd", tipo: "euro", obbl: true, dom: "Totale attivo dall'ultimo bilancio (somma delle società)",
        aiuto: "Senza bilancio: il totale delle entrate dal rendiconto o dalla dichiarazione IRAP.",
        avviso: v => v > 100e6 ? { livello: "ambra", testo: "Oltre 100 milioni il prodotto standard non si applica." } : null },
      { id: "partecipataInd", tipo: "sino", obbl: true, dom: "Qualche società è partecipata da enti pubblici?",
        figli: { quando: "si", campi: [{ id: "respAmmInd", tipo: "sino", dom: "Estensione alla responsabilità amministrativo-contabile (colpa grave)?", aiuto: "Aumenta il premio del 20%." }] } },
      { id: "neoInd", tipo: "sino", obbl: true, dom: "Qualche società è stata costituita da meno di 12 mesi?",
        avvisoSe: v => v === "si" ? { livello: "blu", testo: "Si emette lo stesso, ma senza copertura per insolvenza e procedure concorsuali della società." } : null },
      { id: "indSettoriRef", tipo: "conferma", obbl: true, dom: "Nessun incarico in società di questi settori:",
        elenco: ["edilizia, costruzioni e impianti", "energia", "rifiuti, fognature, risanamento", "sindacati e rappresentanza di interessi", "partiti e movimenti politici", "sanità e sociosanitario", "tecnologia, media e telecomunicazioni"],
        avvisoNo: { livello: "ambra", testo: "Settore da valutare: la compagnia quota caso per caso." } },
      { id: "indSettoriEsc", tipo: "conferma", obbl: true, avvisoNo: AVVISO_TAILOR, dom: "Le società non operano in questi settori:",
        elenco: ["tabacco, amianto", "revisione e certificazione di bilanci", "fondi pensione, assicurazioni", "sport professionistico", "servizi finanziari", "gioco d'azzardo, pornografia, armi e nucleare"] },
      { id: "indItalia", tipo: "conferma", obbl: true, avvisoNo: AVVISO_TAILOR, dom: "Nessun incarico in società con sede legale fuori dall'Italia." },
      { id: "indBilancio", tipo: "conferma", obbl: true, avvisoNo: AVVISO_TAILOR,
        dom: "Nessun incarico in società con perdita oltre il 25% del patrimonio netto o patrimonio netto negativo, né in società insolventi o in procedure concorsuali o di composizione negoziata della crisi." },
      { id: "indOfferta", tipo: "conferma", obbl: true, avvisoNo: AVVISO_TAILOR, dom: "Nessun incarico in società che hanno deliberato un'offerta al pubblico di azioni." },
      { id: "indPrecedenti", tipo: "conferma", obbl: true, avvisoNo: AVVISO_TAILOR, dom: "Negli ultimi 5 anni, per le società e per il cliente:",
        elenco: ["nessuna richiesta di risarcimento, anche di lavoro, per infortuni o per danni a persone e cose", "nessun fatto o circostanza noti che possano portarne", "nessun procedimento penale per incarichi aziendali"],
        figli: { quando: "no", campi: DETTAGLIO_EVENTO.map(c => ({ ...c, id: "ind_" + c.id })) } },
      { id: "massimaleInd", tipo: "scelta", obbl: true, dom: "Massimale", opzioni: [500, 1000, 1500, 2000, 2500].map(m => ({ v: String(m), t: migliaia(m) })) }
    ]},
    { id: "ente", titolo: "Ente", sotto: "Che tipo di organizzazione è.", se: societaDo, campi: [
      { id: "tipoEnte", tipo: "scelta", verticale: true, obbl: true, dom: "Tipo di ente",
        opzioni: [{ v: "societa", t: "Società" }, { v: "noprofit", t: "Ente no profit", n: "associazioni, fondazioni, cooperative sociali" }, { v: "ordine", t: "Ordine o collegio professionale" }] },
      { id: "dataCost", tipo: "data", obbl: true, dom: "Data di costituzione",
        avviso: v => (Date.now() - new Date(v)) < 365 * 864e5 ? { livello: "ambra", testo: "Costituito da meno di 12 mesi: la compagnia chiede informazioni aggiuntive." } : null },
      { id: "settore", tipo: "nota", obbl: true, se: r => !ente(r, "ordine"), dom: "Settore e descrizione dell'attività" },
      { id: "dipendenti", tipo: "testo", obbl: true, tastiera: "numeric", dom: r => ente(r, "ordine") ? "Numero di dipendenti (esclusi i dirigenti)" : "Numero di dipendenti" },
      { id: "finanziario", tipo: "sino", obbl: true, se: r => ente(r, "societa"), dom: "Opera in ambito finanziario o gestisce fondi d'investimento?",
        avvisoSe: v => v === "si" ? { livello: "ambra", testo: "Società finanziaria: serve anche il questionario istituti finanziari della compagnia." } : null,
        figli: { quando: "si", campi: [
          { id: "finDesc", tipo: "nota", obbl: true, dom: "Tipi di investimento, strategie, prodotti e fondi gestiti" },
          { id: "lehman", tipo: "sino", obbl: true, dom: "Esposizione a titoli Lehman Brothers o fondi Madoff / Stanford?",
            avvisoSe: v => v === "si" ? { livello: "rosso", testo: "Esposizione a Lehman / Madoff / Stanford: la compagnia valuterà caso per caso." } : null } ] } },
      { id: "agevolateNP", tipo: "sino", se: r => ente(r, "noprofit"), dom: "Si vogliono le condizioni agevolate per enti no profit?" }
    ]},
    { id: "bilancio", titolo: "Bilancio", sotto: "Dall'ultimo bilancio approvato (o rendiconto).", se: societaDo, campi: [
      { id: "chiusuraBil", tipo: "data", dom: "Data di chiusura del bilancio" },
      { id: "totAttivo", tipo: "euro", obbl: true, dom: r => ente(r, "ordine") ? "Totale attivo o totale delle entrate" : "Totale attivo",
        aiuto: "Dallo stato patrimoniale. Per gli ordini senza bilancio: totale entrate del rendiconto.",
        avviso: (v, r) => ente(r, "societa", "noprofit") && v > 100e6 ? { livello: "ambra", testo: "Oltre 100 milioni di totale attivo il prodotto standard non si applica: serve una quotazione su misura." } : null },
      { id: "patrimonio", tipo: "euro", dom: "Patrimonio netto" },
      { id: "risultato", tipo: "scelta", dom: "Risultato dell'esercizio", opzioni: [{ v: "utile", t: "Utile" }, { v: "perdita", t: "Perdita" }],
        figli: { quando: v => !!v, campi: [{ id: "risultatoImp", tipo: "euro", dom: "Importo" }] } },
      { id: "fatturato", tipo: "euro", se: r => !ente(r, "ordine"), dom: "Fatturato / valore della produzione" },
      { id: "circolante", tipo: "euro", dom: "Attivo circolante" },
      { id: "debitiBreve", tipo: "euro", dom: "Debiti entro 12 mesi" },
      { id: "debitiLungo", tipo: "euro", dom: "Debiti oltre 12 mesi" },
      { id: "perdita25", tipo: "sino", obbl: true, se: r => !ente(r, "ordine"), dom: "Nell'ultimo bilancio c'è una perdita oltre il 25% del patrimonio netto, o patrimonio netto negativo?",
        avvisoSe: v => v === "si" ? { livello: "rosso", testo: "Perdita rilevante o patrimonio negativo: rischio di norma non assumibile con il prodotto standard." } : null },
      { id: "revisore", tipo: "sino", obbl: true, dom: "Il revisore ha certificato il bilancio con rilievi o commenti?",
        figli: { quando: "si", campi: [{ id: "revisoreDesc", tipo: "nota", obbl: true, dom: "Quali" }] } },
      { id: "quotata", tipo: "sino", obbl: true, se: r => ente(r, "societa"), dom: "La società ha titoli negoziati in mercati (regolamentati o no)?",
        avvisoSe: v => v === "si" ? { livello: "rosso", testo: "Società con titoli negoziati: fuori dal prodotto standard." } : null },
      { id: "partecipataPA", tipo: "sino", obbl: true, se: r => !ente(r, "ordine"), dom: "È partecipata da enti pubblici?",
        figli: { quando: "si", campi: [{ id: "tacitoRinnovo", tipo: "sino", dom: "Si chiede il tacito rinnovo?" }] } },
      { id: "respAmm", tipo: "sino", se: r => ente(r, "ordine") || r.partecipataPA === "si", dom: "Estensione alla responsabilità amministrativa e amministrativo-contabile (colpa grave)?" }
    ]},
    { id: "operazioni", titolo: "Operazioni e personale", sotto: "Ultimi 3 anni e prossimi 12 mesi.", se: societaDo, campi: [
      { id: "fusioni", tipo: "sino", obbl: true, se: r => !ente(r, "ordine"), dom: "Fusioni, acquisizioni o cambi di ragione sociale?",
        figli: { quando: "si", campi: [{ id: "fusioniDesc", tipo: "nota", obbl: true, dom: "Tipo di operazione, società coinvolte, data e motivazioni" }] } },
      { id: "personale", tipo: "sino", obbl: true, dom: "Licenziamenti, prepensionamenti o variazioni del personale oltre il 25% in un anno?",
        figli: { quando: "si", campi: [{ id: "personaleDesc", tipo: "nota", obbl: true, dom: "Dettagli" }] } },
      { id: "russia", tipo: "sino", obbl: true, se: r => ente(r, "societa"), dom: "Lavora per clienti in Russia o Bielorussia?",
        avvisoSe: v => v === "si" ? { livello: "rosso", testo: "Attività con Russia o Bielorussia: la compagnia potrebbe non assumere il rischio." } : null },
      { id: "controllate", tipo: "sino", obbl: true, se: r => !ente(r, "ordine"), dom: "Ha partecipazioni o società controllate?",
        figli: { quando: "si", campi: [
          { id: "controllateDesc", tipo: "nota", obbl: true, dom: "Elenco: nome, paese, attività, % di partecipazione" },
          { id: "controllateUSA", tipo: "sino", obbl: true, dom: "Qualcuna ha sede in USA o Canada?",
            avvisoSe: v => v === "si" ? { livello: "ambra", testo: "Controllate in Nord America: servono totale attivo e quotazione di ciascuna." } : null } ] } }
    ]},
    { id: "precedenti", titolo: "Precedenti e altre polizze", sotto: "Ultimi 5 anni e coperture in corso.", campi: [
      { id: "eventiDo", tipo: "multipla", se: societaDo, dom: "Barra ciò che si è verificato (lascia vuoto se niente)",
        opzioni: r => EVENTI_DO.filter(o => o.v !== "annullate" || ente(r, "ordine")),
        avviso: v => v && v.length ? { livello: "rosso", testo: "Con precedenti la compagnia valuta caso per caso: descrivi ogni evento sotto." } : null },
      { id: "eventiDoDesc", tipo: "nota", obbl: true, se: r => societaDo(r) && (r.eventiDo || []).length > 0, dom: "Per ciascun evento: data, chi ha reclamato, importo (anche stimato), breve descrizione" },
      DOMANDA_ALTRA_POLIZZA,
      { id: "cyberInCorso", tipo: "sino", se: r => societaDo(r) && !ente(r, "ordine"), dom: "Ha già una polizza cyber?",
        figli: { quando: "si", campi: [{ id: "cyberAss", tipo: "testo", dom: "Assicuratore e scadenza" }] } },
      { id: "vuoleCyber", tipo: "sino", se: r => societaDo(r) && !ente(r, "ordine") && r.cyberInCorso !== "si", dom: "Il cliente vuole anche un preventivo Cyber?",
        avvisoSe: v => v === "si" ? { livello: "blu", testo: "Ricordati di aprire anche una pratica Cyber risk." } : null }
    ]},
    { id: "garanzie", titolo: "Garanzie", sotto: "Massimali e opzioni.", se: societaDo, campi: [
      { id: "massimaliDo", tipo: "multipla", obbl: true, dom: "Massimali da quotare (anche più di uno)",
        opzioni: MASSIMALI_DO.map(m => ({ v: String(m), t: migliaia(m) })).concat({ v: "altro", t: "Altro" }) },
      { id: "massimaleAltro", tipo: "testo", obbl: true, se: r => (r.massimaliDo || []).includes("altro"), dom: "Altro massimale" },
      { id: "opzA", tipo: "sino", obbl: true, se: r => !ente(r, "ordine"), dom: "Opzione A: responsabilità civile della società?",
        figli: { quando: "si", campi: [{ id: "franchA", tipo: "multipla", dom: "Franchigie da quotare", opzioni: FRANCHIGIE_DO }] } },
      { id: "opzB", tipo: "sino", obbl: true, se: r => !ente(r, "ordine"), dom: "Opzione B: azioni in materia di lavoro contro la società?",
        figli: { quando: "si", campi: [{ id: "franchB", tipo: "multipla", dom: "Franchigie da quotare", opzioni: FRANCHIGIE_DO }] } }
    ]},
    PASSO_CHIUSURA
  ]
};

/* ------------------------------ CYBER ------------------------------ */
const dimCyber = r => {
  const f = Number(r.fatturato) || 0;
  if (!f) return null;
  if (r.tipoCyber === "studio") return f <= 2.5e6 ? "prof" : "oltre";
  if (f <= 10e6) return "pmi";
  if (f >= 250e6 && f <= 1e9) return "midcorp";
  return "oltre";
};
const DIM_TESTO = { prof: "Cyber Smart Plus professionisti", pmi: "Cyber Smart Plus società", midcorp: "Cyber Corporate Midcorp", oltre: "fuori dai prodotti standard" };

const MISURE_CYBER = [
  { v: "policy", t: "Policy formale di sicurezza" }, { v: "responsabile", t: "Responsabile della sicurezza IT" },
  { v: "inventario", t: "Inventario aggiornato di hardware e software" }, { v: "classifica", t: "Classificazione delle informazioni" },
  { v: "accessi", t: "Controllo accessi (need to know)" }, { v: "revoca", t: "Revoca accessi a fine rapporto" },
  { v: "noAdmin", t: "Niente diritti di amministratore agli utenti" }, { v: "mfa", t: "Autenticazione a più fattori (MFA)" },
  { v: "cifratura", t: "Cifratura delle comunicazioni" }, { v: "cambi", t: "Gestione controllata delle modifiche" },
  { v: "rete", t: "Controllo degli accessi alla rete" }, { v: "hardening", t: "Sistemi configurati in sicurezza" },
  { v: "fornitori", t: "Valutazione di sicurezza dei fornitori" }, { v: "incidenti", t: "Piano di risposta agli incidenti testato ogni anno" },
  { v: "bcdr", t: "Continuità operativa e disaster recovery aggiornati" }, { v: "fisica", t: "Protezione fisica dei locali IT" },
  { v: "dpo", t: "Responsabile protezione dati (DPO)" }, { v: "pentest", t: "Vulnerability assessment e penetration test" }
];
const GARANZIE_CYBER = [
  { v: "multimediale", t: "Attività multimediale" }, { v: "crime", t: "Cyber crime e telephone hacking" }, { v: "frode", t: "Frode informatica" },
  { v: "pci", t: "PCI DSS (pagamenti con carta)" }, { v: "biAttacco", t: "Interruzione di attività da attacco" },
  { v: "biFornitore", t: "Interruzione da indisponibilità del fornitore" }, { v: "arrestoVol", t: "Arresto volontario" }, { v: "arrestoObb", t: "Arresto obbligatorio" }
];
const MASSIMALI_CYBER = [25, 50, 100, 250, 500, 1000, 1500, 2000, 2500, 3000];

QUESTIONARI.cyber = {
  titolo: "Cyber risk",
  passi: [
    PASSO_CLIENTE,
    { id: "profilo", titolo: "Azienda e dati", sotto: "Dalla dimensione dipende il prodotto.", campi: [
      { id: "tipoCyber", tipo: "scelta", obbl: true, dom: "Il cliente è", opzioni: [{ v: "studio", t: "Studio professionale" }, { v: "societa", t: "Società" }] },
      { id: "fatturato", tipo: "euro", obbl: true, dom: "Fatturato consolidato dell'ultimo anno",
        avviso: (v, r) => { const d = dimCyber(r); return d === "oltre" ? { livello: "ambra", testo: "Questo fatturato è fuori dai prodotti standard: il backoffice chiederà una quotazione su misura." } : d ? { livello: "blu", testo: "Prodotto di riferimento: " + DIM_TESTO[d] + "." } : null; } },
      { id: "sito", tipo: "testo", dom: "Sito internet" },
      { id: "annoFond", tipo: "testo", tastiera: "numeric", dom: "Anno di fondazione" },
      { id: "dipendenti", tipo: "testo", obbl: true, tastiera: "numeric", dom: "Numero di dipendenti" },
      { id: "postazioni", tipo: "testo", tastiera: "numeric", se: r => dimCyber(r) === "midcorp", dom: "Postazioni IT" },
      { id: "adminSistema", tipo: "testo", tastiera: "numeric", se: r => dimCyber(r) === "midcorp", dom: "Amministratori di sistema" },
      { id: "itSec", tipo: "testo", tastiera: "numeric", se: r => dimCyber(r) === "midcorp", dom: "Dipendenti dedicati alla sicurezza informatica" },
      { id: "datiPersonali", tipo: "scelta", dom: "Dati personali trattati (numero di persone)", opzioni: [{ v: "<10k", t: "Meno di 10.000" }, { v: "10-100k", t: "10.000 – 100.000" }, { v: "100k-1M", t: "100.000 – 1 milione" }, { v: ">1M", t: "Oltre 1 milione" }] },
      { id: "carte", tipo: "scelta", dom: "Accetta pagamenti con carta?", opzioni: [{ v: "no", t: "No" }, { v: "si", t: "Sì, gestiti internamente" }, { v: "esterno", t: "Sì, servizio esterno" }] },
      { id: "ecommerce", tipo: "testo", tastiera: "numeric", dom: "Quota di fatturato da e-commerce (%)" },
      { id: "usaCyber", tipo: "sino", obbl: true, dom: "Ha fatturato in USA o Canada?",
        figli: { quando: "si", campi: [{ id: "usaCyberImp", tipo: "euro", obbl: true, dom: "Fatturato USA/Canada" }] } }
    ]},
    { id: "base", titolo: "Sicurezza di base", sotto: "Dichiarazioni che finiscono in polizza.", campi: [
      { id: "cAntimalware", tipo: "conferma", obbl: true, avvisoNo: AVVISO_TAILOR, dom: "Protezione anti-malware aggiornata su tutti i computer, server e portatili." },
      { id: "cBackup", tipo: "conferma", obbl: true, avvisoNo: AVVISO_TAILOR,
        dom: r => r.tipoCyber === "studio" ? "Backup dei dati importanti almeno ogni 2 settimane." : "Backup dei dati critici almeno settimanale, conservato separato dai sistemi (fuori sede o in cloud)." },
      { id: "cSoftware", tipo: "conferma", obbl: true, avvisoNo: AVVISO_TAILOR, dom: "Gli utenti non possono installare software non autorizzati." },
      { id: "cFirewall", tipo: "conferma", obbl: true, avvisoNo: AVVISO_TAILOR, dom: "Tutti gli accessi a internet sono protetti da firewall configurati." },
      { id: "cFormazione", tipo: "conferma", obbl: true, avvisoNo: AVVISO_TAILOR, se: r => r.tipoCyber === "societa", dom: "Formazione obbligatoria sulla sicurezza (phishing, privacy) almeno una volta l'anno." },
      { id: "cPatch", tipo: "conferma", obbl: true, avvisoNo: AVVISO_TAILOR, se: r => r.tipoCyber === "societa", dom: "Aggiornamenti di sicurezza installati regolarmente su tutti i sistemi." }
    ]},
    { id: "misure", titolo: "Misure di sicurezza", sotto: "Cosa è già in atto.", se: r => r.tipoCyber === "societa", campi: [
      { id: "misure", tipo: "multipla", dom: "Misure presenti (barra quelle attive)", opzioni: MISURE_CYBER,
        avviso: v => v && !v.includes("mfa") ? { livello: "ambra", testo: "Senza autenticazione a più fattori molte compagnie limitano o escludono il ransomware." } : null },
      { id: "automazione", tipo: "scelta", se: r => dimCyber(r) === "midcorp", dom: "Livello di automazione di produzione e logistica", opzioni: [1, 2, 3, 4, 5].map(n => ({ v: String(n), t: n === 1 ? "1 · nessuna" : n === 5 ? "5 · totale" : String(n) })) },
      { id: "manuale", tipo: "sino", se: r => dimCyber(r) === "midcorp", dom: "Se i sistemi si fermano, la produzione può continuare a mano?" },
      { id: "patchCritiche", tipo: "scelta", se: r => dimCyber(r) === "midcorp", dom: "Tempi di installazione delle patch critiche", opzioni: [{ v: "24h", t: "Entro 24 ore" }, { v: "72h", t: "Entro 72 ore" }, { v: "5g", t: "Entro 5 giorni" }, { v: "oltre", t: "Oltre" }] },
      { id: "legacy", tipo: "testo", tastiera: "numeric", se: r => dimCyber(r) === "midcorp", dom: "Sistemi obsoleti o non più supportati (numero)" },
      { id: "edr", tipo: "sino", se: r => dimCyber(r) === "midcorp", dom: "Soluzione EDR (endpoint detection & response) su tutti gli endpoint?" },
      { id: "backupImm", tipo: "sino", se: r => dimCyber(r) === "midcorp", dom: "Backup protetti da manipolazione (offline o immutabili)?" },
      { id: "ripristino", tipo: "scelta", se: r => dimCyber(r) === "midcorp", dom: "Dopo quanto un fermo dei sistemi blocca l'attività?", opzioni: [{ v: "<12h", t: "Meno di 12 ore" }, { v: "12-48h", t: "12 – 48 ore" }, { v: ">48h", t: "Oltre 48 ore" }] },
      { id: "fornitoriIT", tipo: "nota", se: r => dimCyber(r) === "midcorp", dom: "Principali fornitori IT e cloud" }
    ]},
    { id: "precedenti", titolo: "Precedenti", sotto: "Richieste e circostanze.", campi: [
      { id: "noRichieste", tipo: "conferma", obbl: true, avvisoNo: AVVISO_TAILOR, dom: "Negli ultimi 5 anni non ci sono state richieste di risarcimento né incidenti informatici rilevanti.",
        figli: { quando: "no", campi: DETTAGLIO_EVENTO.map(c => ({ ...c, id: "ric_" + c.id })) } },
      { id: "noCircostanze", tipo: "conferma", obbl: true, avvisoNo: AVVISO_TAILOR, dom: "Non ci sono circostanze note che possano portare a una perdita o a una richiesta di risarcimento.",
        figli: { quando: "no", campi: DETTAGLIO_EVENTO.map(c => ({ ...c, id: "circ_" + c.id })) } },
      DOMANDA_ALTRA_POLIZZA,
      { id: "vuoleDo", tipo: "sino", dom: "Il cliente vuole anche un preventivo D&O?",
        avvisoSe: v => v === "si" ? { livello: "blu", testo: "Ricordati di aprire anche una pratica D&O." } : null }
    ]},
    { id: "garanzie", titolo: "Garanzie", sotto: "Massimale, franchigia e opzioni.", campi: [
      { id: "massimaleCy", tipo: "scelta", obbl: true, se: r => ["prof", "pmi"].includes(dimCyber(r)), dom: "Massimale",
        opzioni: r => MASSIMALI_CYBER.filter(m => dimCyber(r) === "prof" ? m <= 1000 : !(Number(r.fatturato) <= 1e6 && m > 1000)).map(m => ({ v: String(m), t: migliaia(m) })),
        aiuto: "Compaiono solo i massimali ammessi per il fatturato indicato." },
      { id: "massimaleCyLibero", tipo: "testo", obbl: true, se: r => ["midcorp", "oltre"].includes(dimCyber(r)), dom: "Massimale richiesto" },
      { id: "franchCy", tipo: "scelta", se: r => ["prof", "pmi"].includes(dimCyber(r)), dom: "Franchigia", opzioni: [{ v: "0", t: "Nessuna" }, { v: "250", t: "€ 250" }, { v: "500", t: "€ 500" }, { v: "1000", t: "€ 1.000" }] },
      { id: "garanzieCy", tipo: "multipla", dom: "Garanzie aggiuntive", opzioni: GARANZIE_CYBER,
        avviso: (v, r) => r.carte && r.carte !== "no" && !(v || []).includes("pci") ? { livello: "blu", testo: "Il cliente accetta carte di pagamento: valuta la garanzia PCI DSS." } : null }
    ]},
    PASSO_CHIUSURA
  ]
};

DOC_UTILI.do = "Ultimo bilancio approvato con relazione, visura camerale, polizza D&O in corso";
DOC_UTILI.cyber = "Polizza cyber in corso, certificazioni (es. ISO 27001), ultimo report di vulnerability assessment";
