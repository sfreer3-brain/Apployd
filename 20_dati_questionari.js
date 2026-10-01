/* =====================================================================
   QUESTIONARI: descritti come dati.
   Un questionario è una sequenza di passi; ogni passo elenca campi.
   Un campo compare solo se la sua condizione "se" è vera, così un unico
   questionario copre più moduli della compagnia (domande accorpate).

   Tipi di campo:
     testo, email, tel, data, nota (testo lungo), euro,
     sino (Sì / No), conferma (Confermo / Non confermo), allegato (foto o file),
     scelta (una opzione), multipla (più opzioni)
   ===================================================================== */

const SOGGETTI_DICH = ["il cliente e i soci, passati e presenti", "i collaboratori, passati e presenti", "ogni singolo professionista, anche per attività con propria partita IVA"];

/* Sotto-domande riusate quando una dichiarazione NON è confermata */
const DETTAGLIO_EVENTO = [
  { id: "data",   tipo: "data",  dom: "Data dell'evento" },
  { id: "chi",    tipo: "testo", dom: "Chi ha avanzato la richiesta" },
  { id: "importo",tipo: "euro",  dom: "Importo richiesto o stimato" },
  { id: "fatti",  tipo: "nota",  dom: "Breve descrizione dei fatti" }
];

const AVVISO_TAILOR = { livello: "rosso", testo: "Con una risposta \"Non confermo\" il modulo standard non basta: serve la proposta tailor made, che la compagnia valuta caso per caso. Compila i dettagli sotto, il backoffice riceverà la pratica già segnalata." };

const personaDaCF = r => { const e = analizzaCF(r.cf); return e.tipo === "persona" && e.valido; };


/* =====================================================================
   BLOCCHI COMUNI: usati da tutti i questionari (domande accorpate)
   ===================================================================== */
const PASSO_CLIENTE = { id: "cliente", titolo: "Cliente", sotto: "Dati di chi chiede la polizza.", campi: [
        { id: "nome", tipo: "testo", obbl: true, largo: true, dom: r => r._segmento === "pf" || r.poChi === "persona" || r.doChi === "persona" ? "Nome e cognome" : r.poChi === "gruppo" ? "Mandatario: nome e cognome o ente" : "Ragione sociale o nome e cognome" },
        { id: "referente", tipo: "testo", se: r => r._segmento === "az" && r._prodotto !== "rcprof" && r.poChi !== "persona" && r.doChi !== "persona", dom: "Referente in azienda" },
        { id: "piva", tipo: "testo", almenoUno: "idFiscale", se: r => r._segmento !== "pf", dom: "Partita IVA", tastiera: "numeric" },
        { id: "cf", tipo: "testo", almenoUno: "idFiscale", dom: "Codice fiscale", maiuscolo: true, deriva: derivaDaCF,
          avviso: (v, r) => {
            const e = analizzaCF(v);
            if (!e.valido || e.tipo !== "persona") return null;
            if (cfCoerenteConNome(v, r.nome) === false) return { livello: "ambra", testo: "Il codice fiscale non corrisponde al nome indicato: ricontrolla nome, cognome o codice." };
            if (!e.dati.luogoTrovato) return { livello: "blu", testo: `Luogo di nascita non riconosciuto (codice ${e.dati.codLuogo}): inseriscilo a mano.` };
            return null;
          } },
        { id: "sesso", tipo: "scelta", corto: true, se: personaDaCF, dom: "Sesso", opzioni: [{ v: "M", t: "Maschio" }, { v: "F", t: "Femmina" }] },
        { id: "dataNascita", tipo: "data", se: personaDaCF, dom: "Data di nascita" },
        { id: "luogoNascita", tipo: "testo", se: personaDaCF, dom: "Luogo di nascita" },
        { id: "indirizzo", tipo: "testo", dom: r => r._segmento === "pf" ? "Indirizzo di residenza" : "Indirizzo della sede" },
        { id: "citta", tipo: "testo", dom: "CAP e città" },
        { id: "email", tipo: "email", obbl: true, dom: "Email" },
        { id: "tel", tipo: "tel", obbl: true, dom: "Telefono" },
        { id: "pec", tipo: "email", dom: "PEC" },
        { id: "docTipo", tipo: "scelta", obbl: true, dom: "Documento d'identità",
          aiuto: "Del cliente o, per studi e società, del legale rappresentante.",
          opzioni: [{ v: "ci", t: "Carta d'identità" }, { v: "patente", t: "Patente" }, { v: "passaporto", t: "Passaporto" }, { v: "no", t: "Non disponibile ora" }],
          avvisoSe: v => v === "no" ? { livello: "ambra", testo: "Il backoffice ne avrà bisogno prima dell'emissione: fallo avere appena puoi." } : null,
          figli: { quando: v => v && v !== "no", campi: [
            { id: "docNumero", tipo: "testo", obbl: true, maiuscolo: true, dom: "Numero del documento" },
            { id: "docScadenza", tipo: "data", obbl: true, dom: "Scadenza",
              avviso: v => v && v < new Date().toISOString().slice(0, 10) ? { livello: "rosso", testo: "Il documento è scaduto: chiedine uno valido al cliente." } : null },
            { id: "docFile", tipo: "allegato", dom: "Foto o scansione, fronte e retro",
              avvisoVuoto: () => ({ livello: "blu", testo: "Se il cliente ce l'ha a portata di mano, fotografalo adesso: evita una richiesta successiva." }) } ] } }
      ]};

const DOMANDA_ALTRA_POLIZZA = { id: "altraPolizza", tipo: "sino", obbl: true, dom: "Ha già un'altra polizza che copre, anche in parte, gli stessi rischi?",
          figli: { quando: "si", campi: [
            { id: "altraCompagnia", tipo: "testo", dom: "Compagnia" },
            { id: "altraScadenza", tipo: "data", dom: "Scadenza" },
            { id: "altraMassimale", tipo: "euro", dom: "Massimale o somma assicurata" } ] } };

const DOC_UTILI = {
  rcprof: r => r.copertura === "progetto" ? "Delibera o lettera d'incarico, bando di gara, relazione sul progetto" : "Polizza in corso, visura camerale, dichiarazione IVA o Modello Unico",
  do: r => r.doChi === "persona" ? "Ultimo bilancio delle società in cui ha incarichi, polizza in corso" : "Ultimo bilancio approvato, visura camerale, polizza in corso",
  po: r => r.poChi === "ente" ? "Elenco dei dipendenti da assicurare, polizza in corso" : r.poChi === "progetto" ? "Delibera d'incarico, bando, relazione sul progetto" : "Atto di nomina o incarico, polizza in corso",
  sanita: r => r.tipoSan === "casacura" ? "Proposta DUAL case di cura compilata, ultimo bilancio, polizza RC sanitaria in corso, statistica sinistri" : "Polizza RC sanitaria in corso, autorizzazione o accreditamento, elenco delle sedi, ultimo bilancio",
  casa: "Polizza in corso, planimetria o visura catastale, foto dell'immobile",
  ufficio: "Polizza in corso, visura camerale, planimetria, contratto d'affitto"
};

const PASSO_CHIUSURA = { id: "chiusura", titolo: "Documenti e compliance", sotto: "Ultimi controlli prima dell'invio.", campi: [
        { id: "altriDoc", tipo: "allegato", dom: "Altri documenti utili",
          aiuto: r => (valore(DOC_UTILI[r._prodotto], r) || "Polizza in corso e altri documenti utili") + ". Non obbligatori, ma se ci sono allegali.",
          avvisoVuoto: r => r.altraPolizza === "si"
            ? { livello: "ambra", testo: "Hai indicato che il cliente ha già un'altra polizza: se puoi, allegala." }
            : { livello: "blu", testo: "Nessun documento allegato. Se ne hai, aggiungili: il backoffice risparmia una richiesta al cliente." } },
        { id: "mup", tipo: "sino", obbl: true, dom: "MUP consegnato al cliente?",
          avvisoNo: { livello: "ambra", testo: "Il MUP va consegnato prima della sottoscrizione. Puoi inviare la richiesta, ma ricordalo." } },
        { id: "privacy", tipo: "sino", obbl: true, dom: "Informativa privacy firmata?",
          avvisoNo: { livello: "ambra", testo: "Senza consenso privacy il backoffice non può trattare i dati." } },
        { id: "adeguatezza", tipo: "sino", obbl: true, se: r => invioPer(r._prodotto) === "vita", dom: "Questionario di adeguatezza (IBIP) compilato con il cliente?",
          aiuto: "L'analisi patrimoniale è uno strumento orientativo: non sostituisce la valutazione di adeguatezza prevista per i prodotti d'investimento assicurativi.",
          avvisoNo: { livello: "ambra", testo: "Senza valutazione di adeguatezza il prodotto non può essere proposto: va completata prima della sottoscrizione." } },
        { id: "antiriciclaggio", tipo: "sino", obbl: true, se: r => invioPer(r._prodotto) === "vita", dom: "Adeguata verifica antiriciclaggio fatta?",
          avvisoNo: { livello: "ambra", testo: "L'adeguata verifica (D.Lgs. 231/2007) è obbligatoria per i contratti vita: va completata prima dell'emissione." } },
        { id: "urgenza", tipo: "scelta", dom: "Urgenza", opzioni: [{ v: "normale", t: "Normale" }, { v: "alta", t: "Entro 48 ore" }] },
        { id: "note", tipo: "nota", dom: "Note per il backoffice" }
      ]};

const QUESTIONARI = {};   /* RC professionale e altre RC: 21_dati_rc.js */

/* =====================================================================
   IMMOBILI: Casa (persona fisica) e Ufficio (azienda).
   Un solo modello per i due questionari: cambiano tipologie, coperture e valori.
   Il valore del fabbricato si chiede una volta sola (nei moduli cartacei era ripetuto).
   ===================================================================== */
const COPERTURE_IMMOBILE = [
  { v: "incendio",   t: "Incendio e scoppio" },
  { v: "atmosferici",t: "Eventi atmosferici" },
  { v: "elettrico",  t: "Fenomeno elettrico" },
  { v: "acqua",      t: "Ricerca guasti e acqua condotta" },
  { v: "furto",      t: "Furto e rapina" },
  { v: "rcFabb",     t: "RC del fabbricato" },
  { v: "rcTerzi",    t: "RC verso terzi (clienti, visitatori)", solo: "ufficio" },
  { v: "rcAnimali",  t: "RC per animali domestici", solo: "casa" },
  { v: "impianti",   t: "Danni a impianti elettrici ed elettronici", solo: "ufficio" },
  { v: "fotov",      t: "Fotovoltaico e batterie di accumulo" },
  { v: "tutela",     t: "Tutela legale" },
  { v: "assistenza", t: "Assistenza", solo: "casa" },
  { v: "altro",      t: "Altro" }
];

/* =====================================================================
   CASA: questionario INTERNO dell'agenzia, neutro rispetto alle compagnie.
   Le garanzie sono l'unione di quelle viste nei DIP aggiuntivi (AXA Nuova
   Protezione Casa, Unipol, Helvetia), con nomi nostri e una spiegazione da
   dire al cliente. Il commerciale non vede compagnie: costruisce la copertura
   sui bisogni del cliente. Il backoffice riceve nel PDF, a parte, quali
   compagnie offrono ciascuna garanzia (indicativo, dai DIP).
   ===================================================================== */
const NOME_COMP = { AXA: "AXA", UNI: "Unipol", HEL: "Helvetia" };

const CARATTERISTICHE_CASA = [
  { v: "cane", t: "Cane" }, { v: "gatto", t: "Gatto" }, { v: "figli", t: "Figli a carico" }, { v: "colf", t: "Colf, badante o baby sitter" },
  { v: "dipendente", t: "Il cliente è lavoratore dipendente" }, { v: "bici", t: "Si usa la bicicletta" },
  { v: "pannelli", t: "Pannelli solari o fotovoltaici" }, { v: "colonnina", t: "Colonnina di ricarica auto" },
  { v: "giardino", t: "Giardino con alberi" }, { v: "cassaforte", t: "Cassaforte" }, { v: "allarme", t: "Impianto d'allarme" },
  { v: "arte", t: "Opere d'arte, antiquariato, strumenti musicali di valore" }, { v: "lavori", t: "Lavori di manutenzione in programma" }
];
const ha = (r, x) => (r.caratteristiche || []).includes(x);
const sezC = (r, x) => (r.coperture || []).includes(x);

/* n = come spiegarlo al cliente; comp = compagnie che la offrono (solo per il backoffice) */
const SEZIONI_CASA = [
  { v: "incendio", t: "Danni alla casa e al contenuto", n: "Incendio, fulmine, esplosione e danni alle cose di casa", comp: ["AXA", "UNI", "HEL"] },
  { v: "furto", t: "Furto e rapina", n: "Quello che viene rubato in casa, e i danni fatti dai ladri", comp: ["AXA", "UNI", "HEL"] },
  { v: "rc", t: "Responsabilità civile della famiglia", n: "Danni involontari causati ad altri da lei, dai familiari o dalla casa", comp: ["AXA", "UNI", "HEL"] },
  { v: "tutela", t: "Tutela legale", n: "Avvocato e spese legali nelle controversie della vita privata", comp: ["AXA", "UNI", "HEL"] },
  { v: "assistenza", t: "Assistenza h24", n: "Idraulico, elettricista, fabbro quando serve, a qualsiasi ora", comp: ["AXA", "UNI", "HEL"] },
  { v: "animali", t: "Animali domestici", n: "Danni causati dal cane o dal gatto e spese veterinarie", comp: ["AXA", "HEL"] },
  { v: "digitale", t: "Protezione digitale", n: "Furto d'identità, frodi online, cyberbullismo", comp: ["AXA", "UNI", "HEL"] },
  { v: "arte", t: "Opere d'arte e strumenti musicali", n: "Quadri, antiquariato, strumenti di valore", comp: ["AXA"] },
  { v: "green", t: "Pannelli solari e colonnina di ricarica", n: "Danni e furto dell'impianto fotovoltaico e della colonnina", comp: ["AXA", "UNI"] },
  { v: "persona", t: "Protezione della persona e della famiglia", n: "Aiuti economici in caso di infortunio, perdita del lavoro, imprevisti", comp: ["UNI"] }
];
const SUGGERISCI_SEZIONI_CASA = r => ["incendio", "rc",
  ha(r, "cane") || ha(r, "gatto") ? "animali" : null,
  ha(r, "pannelli") || ha(r, "colonnina") ? "green" : null,
  ha(r, "arte") ? "arte" : null,
  ha(r, "cassaforte") || ha(r, "allarme") ? "furto" : null,
  ha(r, "figli") ? "persona" : null
].filter(Boolean);

const G = (v, t, n, g, sez, comp, se) => ({ v, t, n, g, sez: r => sezC(r, sez), comp, se });
const nonAppartamento = r => r.immTipo !== "appartamento";
const GC = { inc: "Danni alla casa", fur: "Furto", rc: "Responsabilità civile", tut: "Tutela legale", ass: "Assistenza", ani: "Animali", per: "Persona e famiglia" };
const GARANZIE_CASA = [
  G("elettrico", "Fenomeno elettrico", "Elettrodomestici e impianti bruciati da sbalzi di corrente o fulmini", GC.inc, "incendio", ["AXA", "UNI"], r => true),
  G("elettricoCons", "Danni conseguenti al fenomeno elettrico", "Es. il cibo perso se si guasta il frigorifero", GC.inc, "incendio", ["AXA"], r => false),
  G("acqua", "Acqua condotta", "Danni da un tubo rotto, a casa sua o dei vicini", GC.inc, "incendio", ["AXA", "UNI"], r => true),
  G("ricercaGuasto", "Ricerca del guasto", "Le spese per rompere e rifare muri e pavimenti per trovare la perdita", GC.inc, "incendio", ["UNI"], r => true),
  G("perditeOcculte", "Perdite occulte d'acqua", "La bolletta dell'acqua in più per una perdita nascosta", GC.inc, "incendio", ["UNI"], r => false),
  G("atmosferici", "Eventi atmosferici", "Vento, grandine, tempeste su tetto, finestre, persiane", GC.inc, "incendio", ["AXA", "UNI"], nonAppartamento),
  G("piovana", "Acqua piovana", "Infiltrazioni di pioggia dal tetto o dalle pareti", GC.inc, "incendio", ["AXA"], nonAppartamento),
  G("vetri", "Vetri e cristalli", "Rottura di vetrate, specchi, piani in cristallo", GC.inc, "incendio", ["UNI"], r => false),
  G("alberi", "Caduta di alberi", "Un albero che cade sulla casa o sulla recinzione", GC.inc, "incendio", ["UNI"], r => ha(r, "giardino")),
  G("canoni", "Perdita dei canoni di affitto", "Gli affitti persi se la casa data in locazione diventa inagibile", GC.inc, "incendio", ["AXA"], r => r.uso === "affitto"),
  G("terremoto", "Terremoto", "", GC.inc, "incendio", ["AXA", "UNI"], r => false),
  G("alluvione", "Alluvione e allagamento", "", GC.inc, "incendio", ["AXA", "UNI"], r => false),
  G("guastiLadri", "Guasti causati dai ladri", "Porte, finestre e serrature da riparare dopo un furto", GC.fur, "furto", ["AXA"], r => true),
  G("gioielli", "Gioielli e valori", "Gioielli e denaro, in cassaforte o in casa", GC.fur, "furto", ["AXA", "UNI"], r => ha(r, "cassaforte")),
  G("scippo", "Scippo e rapina fuori casa", "Borsa o portafoglio rubati per strada", GC.fur, "furto", ["UNI", "HEL"], r => false),
  G("furtoSociopol", "Furto durante disordini", "Saccheggi durante scioperi o tumulti", GC.fur, "furto", ["UNI"], r => false),
  G("rcFabb", "RC della proprietà della casa", "Danni ad altri causati dalla casa: una tegola che cade, un'infiltrazione al vicino", GC.rc, "rc", ["AXA", "UNI", "HEL"], r => r.titoloCasa !== "inquilino"),
  G("domestici", "Collaboratori domestici", "Infortuni e danni che riguardano colf e badanti", GC.rc, "rc", ["UNI"], r => ha(r, "colf")),
  G("lavori", "Lavori in casa", "Danni ad altri durante lavori di manutenzione commissionati dal cliente", GC.rc, "rc", ["AXA"], r => ha(r, "lavori")),
  G("bici", "Bicicletta", "Danni causati ad altri andando in bici", GC.rc, "rc", ["AXA"], r => ha(r, "bici")),
  G("locata", "Casa data in affitto", "La responsabilità del proprietario verso l'inquilino e i terzi", GC.rc, "rc", ["UNI"], r => r.uso === "affitto"),
  G("bb", "B&B e affittacamere", "La responsabilità verso gli ospiti", GC.rc, "rc", ["UNI"], r => r.uso === "bb"),
  G("stage", "Stage e tirocini", "Danni causati dai figli durante stage e tirocini", GC.rc, "rc", ["UNI"], r => false),
  G("tutelaLavoro", "Tutela anche sul lavoro", "Controversie con il datore di lavoro", GC.tut, "tutela", ["HEL"], r => ha(r, "dipendente")),
  G("separazione", "Separazione e divorzio", "Spese legali in caso di separazione", GC.tut, "tutela", ["UNI"], r => false),
  G("elettrodomestici", "Estensione di garanzia elettrodomestici", "Riparazione di elettrodomestici e TV oltre la garanzia del produttore", GC.ass, "assistenza", ["AXA", "HEL"], r => false),
  G("veterinario", "Spese veterinarie", "Cure, interventi e ricoveri per malattia o infortunio dell'animale", GC.ani, "animali", ["AXA", "HEL"], r => ha(r, "cane") || ha(r, "gatto")),
  G("smarrimento", "Smarrimento dell'animale", "Spese di ricerca se l'animale si perde", GC.ani, "animali", ["HEL"], r => false),
  G("imprevisti", "Spese impreviste dopo un danno", "Un contributo per le spese extra dopo un sinistro in casa", GC.per, "persona", ["UNI"], r => false),
  G("infortunioLavoro", "Infortunio o perdita del lavoro", "Un indennizzo se si fa male o perde l'impiego", GC.per, "persona", ["UNI"], r => ha(r, "dipendente")),
  G("sostegnoFigli", "Sostegno ai figli", "Un aiuto ai figli in caso di morte o invalidità del genitore", GC.per, "persona", ["UNI"], r => ha(r, "figli"))
];

function questionarioImmobile(tipo) {
  const casa = tipo === "casa";
  const proprietario = r => casa ? r.titoloCasa !== "inquilino" : r.titolo === "proprieta";
  return {
    titolo: casa ? "Casa" : "Ufficio",
    passi: [
      PASSO_CLIENTE,
      { id: "immobile", titolo: casa ? "Immobile" : "Immobile e attività", sotto: "Cosa assicuriamo e dove.", campi: [
        { id: "immStessoIndirizzo", tipo: "sino", obbl: true, dom: casa ? "L'immobile è all'indirizzo di residenza?" : "L'ufficio è all'indirizzo della sede?" },
        { id: "immIndirizzo", tipo: "testo", obbl: true, largo: true, se: r => r.immStessoIndirizzo === "no", dom: "Indirizzo dell'immobile" },
        { id: "immTipo", tipo: "scelta", obbl: true, dom: "Tipologia",
          opzioni: casa
            ? [{ v: "appartamento", t: "Appartamento" }, { v: "villa", t: "Villa" }, { v: "schiera", t: "Villetta a schiera" }, { v: "altro", t: "Altro" }]
            : [{ v: "condominio", t: "Ufficio in condominio" }, { v: "indipendente", t: "Ufficio indipendente" }, { v: "abitazione", t: "Studio in abitazione" }, { v: "altro", t: "Altro" }] },
        { id: "immTipoAltro", tipo: "testo", obbl: true, se: r => r.immTipo === "altro", dom: "Specifica la tipologia" },
        { id: "piano", tipo: "testo", se: r => casa && r.immTipo === "appartamento", dom: "Piano", tastiera: "numeric" },
        { id: "mq", tipo: "testo", obbl: true, dom: "Superficie (mq)", tastiera: "numeric" },
        { id: "anno", tipo: "testo", obbl: true, dom: "Anno di costruzione o ultima ristrutturazione", tastiera: "numeric",
          avviso: v => /^\d{4}$/.test(v) && (Number(v) < 1800 || Number(v) > new Date().getFullYear()) ? { livello: "ambra", testo: "Anno poco plausibile: ricontrolla." } : null },
        { id: "titolo", tipo: "scelta", obbl: true, se: () => !casa, dom: "L'immobile è", opzioni: [{ v: "proprieta", t: "Di proprietà" }, { v: "affitto", t: "In affitto" }] },
        { id: "titoloCasa", tipo: "scelta", obbl: true, se: () => casa, dom: "Il cliente è", opzioni: [{ v: "proprietario", t: "Proprietario" }, { v: "inquilino", t: "Inquilino" }] },
        { id: "uso", tipo: "scelta", obbl: true, se: () => casa, dom: "Destinazione d'uso",
          opzioni: [{ v: "principale", t: "Abitazione principale" }, { v: "seconda", t: "Seconda casa" }, { v: "affitto", t: "Data in affitto" }, { v: "bb", t: "B&B o affittacamere" }, { v: "vuota", t: "Vuota o non utilizzata" }, { v: "altro", t: "Altro" }],
          avvisoSe: v => v === "vuota" ? { livello: "ambra", testo: "Per le case vuote molte compagnie limitano furto e acqua condotta: segnalalo al backoffice." } : null },
        { id: "usoAltro", tipo: "testo", obbl: true, se: r => casa && r.uso === "altro", dom: "Specifica l'uso" },
        { id: "caratteristiche", tipo: "multipla", se: () => casa, dom: "Barra quello che c'è (lascia vuoto se niente)", opzioni: CARATTERISTICHE_CASA,
          aiuto: "Una sola domanda: da qui l'app ricava le sezioni e le garanzie da consigliare." },
        { id: "attivitaUff", tipo: "testo", obbl: true, largo: true, se: () => !casa, dom: "Attività svolta" },
        { id: "dipendenti", tipo: "testo", obbl: true, se: () => !casa, dom: "Numero di dipendenti, compresi i soci che lavorano", tastiera: "numeric" }
      ]},
      { id: "coperture", titolo: "Coperture e valori", sotto: "Cosa vuole assicurare il cliente e per quanto.", campi: [
        casa
          ? { id: "coperture", tipo: "multipla", verticale: true, obbl: true, dom: "Cosa vuole proteggere il cliente?",
              opzioni: SEZIONI_CASA, suggerito: SUGGERISCI_SEZIONI_CASA,
              aiuto: "Sotto ogni voce c'è come spiegarla al cliente. Le «consigliate» derivano da quello che ha raccontato della casa." }
          : { id: "coperture", tipo: "multipla", obbl: true, dom: "Coperture desiderate",
              opzioni: COPERTURE_IMMOBILE.filter(o => !o.solo || o.solo === tipo) },
        { id: "garCasa", tipo: "multipla", verticale: true, se: r => casa && GARANZIE_CASA.some(g => g.sez(r)), dom: "In più, per le sezioni scelte",
          opzioni: r => GARANZIE_CASA.filter(g => g.sez(r)),
          suggerito: r => GARANZIE_CASA.filter(g => g.sez(r) && g.se(r)).map(g => g.v),
          avvisoSe: (v, r) => sezC(r, "animali") && !sezC(r, "rc")
            ? { livello: "ambra", testo: "Per gli animali conviene aggiungere anche la responsabilità civile: i danni causati dal cane o dal gatto rientrano lì (e alcune compagnie la richiedono)." }
            : sezC(r, "furto") && ha(r, "allarme") ? { livello: "blu", testo: "Casa con allarme: su alcune compagnie dà diritto a uno sconto sul furto." } : null },
        { id: "copAltro", tipo: "testo", obbl: true, largo: true, se: r => (r.coperture || []).includes("altro"), dom: "Altra copertura richiesta" },
        { id: "valLocativo", tipo: "euro", obbl: true, se: r => casa && r.titoloCasa === "inquilino" && sezC(r, "incendio"), dom: "Rischio locativo: valore del fabbricato",
          aiuto: "Copre i danni all'abitazione di cui l'inquilino risponde verso il proprietario." },
        { id: "valFabbricato", tipo: "euro", obbl: true, se: r => proprietario(r) && (!casa || sezC(r, "incendio")), dom: "Valore stimato del fabbricato",
          aiuto: "Costo per ricostruirlo a nuovo, non il valore di mercato." },
        { id: "valContenuto", tipo: "euro", obbl: true, dom: casa ? "Valore del contenuto" : "Valore del contenuto (arredi, attrezzature, elettronica)" },
        { id: "valFotov", tipo: "euro", obbl: true, se: r => (r.coperture || []).some(x => x === "fotov" || x === "green") || false, dom: r => casa && ha(r, "colonnina") ? "Valore di fotovoltaico, batterie e colonnina" : "Valore di fotovoltaico e batterie" },
        { id: "valArte", tipo: "euro", obbl: true, se: r => casa && sezC(r, "arte"), dom: "Opere d'arte e strumenti musicali: valore" },
        { id: "valGioielli", tipo: "euro", obbl: true, se: r => casa && (r.garCasa || []).includes("gioielli"), dom: "Gioielli e valori: valore" },
        { id: "valCanone", tipo: "euro", obbl: true, se: r => casa && (r.garCasa || []).includes("canoni"), dom: "Canone di locazione annuo" },
        { id: "valParticolari", tipo: "euro", dom: casa ? "Valori particolari (gioielli, elettronica, ecc.)" : "Valori particolari (informatica, archivi, ecc.)" },
        { id: "valMerce", tipo: "euro", se: () => !casa, dom: "Merce presente in ufficio" },
        { id: "valFurto", tipo: "euro", obbl: true, se: r => (r.coperture || []).includes("furto"), dom: "Furto: somma assicurata",
          aiuto: "A primo rischio assoluto: il valore massimo che realisticamente può essere rubato, non il valore di tutto il contenuto." },
        { id: "massimaleRCimm", tipo: "scelta", obbl: true, se: r => (r.coperture || []).some(x => ["rcFabb", "rcTerzi", "rcAnimali", "rc"].includes(x)),
          dom: "Responsabilità civile: massimale", opzioni: [{ v: "1", t: "1 milione" }, { v: "3", t: "3 milioni" }, { v: "5", t: "5 milioni" }] },
        { id: "rcoUff", tipo: "sino", obbl: true, se: r => !casa && (r.coperture || []).includes("rcTerzi") && Number(r.dipendenti) > 0, dom: "Anche RC verso i dipendenti (RCO)?" }
      ]},
      { id: "storia", titolo: "Precedenti", sotto: "Sinistri passati e altre polizze.", campi: [
        { id: "sinistriPrec", tipo: "sino", obbl: true, dom: "Ci sono stati sinistri negli ultimi anni?",
          figli: { quando: "si", campi: [{ id: "sinistriDesc", tipo: "nota", obbl: true, dom: "Quando, cosa è successo e quanto è stato pagato" }] } },
        DOMANDA_ALTRA_POLIZZA
      ]},
      PASSO_CHIUSURA
    ]
  };
}
QUESTIONARI.casa = questionarioImmobile("casa");
QUESTIONARI.ufficio = questionarioImmobile("ufficio");

function euro(n) { return "€ " + Number(n).toLocaleString("it-IT"); }
