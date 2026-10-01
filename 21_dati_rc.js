/* =====================================================================
   RC PROFESSIONALE — moduli e proposte DUAL accorpati in un solo questionario.
   Il commerciale sceglie prima l'area (6 voci), poi la professione:
   così l'elenco resta corto e le domande specifiche compaiono da sole.
   Un "singolo progetto" (opere pubbliche, verifica, ATI) usa lo stesso
   questionario con un percorso dedicato.
   ===================================================================== */

const AREE_PROF = [
  { v: "tecnica",     t: "Area tecnica", n: "architetti, ingegneri, geometri, geologi, periti, agronomi" },
  { v: "economica",   t: "Area economica e fiscale", n: "commercialisti, tributaristi, EDP, consulenti del lavoro, revisione, visto di conformità" },
  { v: "legale",      t: "Area legale", n: "avvocati, organismi di mediazione, OCC" },
  { v: "immobiliare", t: "Immobiliare e intermediazione", n: "agenti immobiliari, amministratori di condominio, mediatori creditizi, periti assicurativi" },
  { v: "consulenza",  t: "Consulenza, informatica e certificazione", n: "IT e web, consulenza aziendale, marketing, privacy, enti di certificazione" },
  { v: "ambiente",    t: "Ambiente e sicurezza", n: "consulenti ambientali, sicurezza sul lavoro, servizi tecnici senza albo" }
];

/* gruppo: decide le domande specifiche. proposta: per la compagnia serve la proposta completa. */
const PROFESSIONI = {
  architetto:    { area: "tecnica", nome: "Architetto", gruppo: "tecnici" },
  ingegnere:     { area: "tecnica", nome: "Ingegnere", gruppo: "tecnici", nota: "escluso l'ingegnere dell'informazione: è in Consulenza e informatica" },
  geometra:      { area: "tecnica", nome: "Geometra", gruppo: "tecnici" },
  geologo:       { area: "tecnica", nome: "Geologo", gruppo: "tecnici" },
  perito:        { area: "tecnica", nome: "Perito industriale", gruppo: "tecnici" },
  agro:          { area: "tecnica", nome: "Agronomo, agrotecnico, perito agrario", gruppo: "agro" },
  commerc:       { area: "economica", nome: "Commercialista, tributarista, EDP", gruppo: "economica" },
  cdl:           { area: "economica", nome: "Consulente del lavoro", gruppo: "economica" },
  visto:         { area: "economica", nome: "Solo visto di conformità", gruppo: "visto", nota: "polizza a sé, per chi ha già la RC professionale" },
  revisione:     { area: "economica", nome: "Società di revisione", gruppo: "revisione", proposta: true },
  avvocato:      { area: "legale", nome: "Avvocato", gruppo: "avvocati" },
  conciliazione: { area: "legale", nome: "Organismo di mediazione o conciliazione", gruppo: "conciliazione", proposta: true },
  occ:           { area: "legale", nome: "Organismo di composizione della crisi (OCC)", gruppo: "occ", proposta: true },
  agenteImm:     { area: "immobiliare", nome: "Agente immobiliare", gruppo: "agenteImm", proposta: true },
  ammCond:       { area: "immobiliare", nome: "Amministratore di condominio", gruppo: "immobiliare" },
  mediatore:     { area: "immobiliare", nome: "Mediatore creditizio", gruppo: "immobiliare" },
  peritoAss:     { area: "immobiliare", nome: "Perito assicurativo", gruppo: "immobiliare" },
  it:            { area: "consulenza", nome: "Informatica e web", gruppo: "digitale", nota: "consulenza IT, software, siti, ingegneri dell'informazione" },
  consulenza:    { area: "consulenza", nome: "Consulenza aziendale, marketing, privacy", gruppo: "digitale" },
  certificazione:{ area: "consulenza", nome: "Ente di certificazione", gruppo: "certificazione", proposta: true },
  ambiente:      { area: "ambiente", nome: "Ambiente, sicurezza, tecnici non iscritti ad albi", gruppo: "ambiente" }
};
const P_ = r => PROFESSIONI[r.professione];
const g = (r, ...gruppi) => !!P_(r) && gruppi.includes(P_(r).gruppo);
const prof = (r, ...nomi) => nomi.includes(r.professione);
const annuale = r => r.copertura === "annuale";
const progetto = r => r.copertura === "progetto";

/* Regole per professione: fatturato massimo del modulo standard, massimali
   (migliaia di €), opzioni di franchigia. "altro": si può chiedere un massimale diverso. */
const REGOLE_RC = {
  architetto: { fattMax: 1000000, massimali: [250,500,1000,1500,2000,2500,3000], franchigie: ["1.000 (+20% premio, solo massimali fino a 1,5 mln)","5.000 (−15% premio)","10.000 (−25%, fatturato > 150.000)","25.000 (−35%, fatturato > 150.000)"] },
  ingegnere:  "architetto", geometra: "architetto", geologo: "architetto",
  perito:     { fattMax: 1000000, massimali: [250,500,1000,1500,2000,2500,3000], franchigie: ["2.500 (−10% premio)","5.000 (−20% premio)","10.000 (−25%, fatturato > 150.000)","25.000 (−35%, fatturato > 150.000)"] },
  agro:       { fattMax: 200000,  massimali: [250,500,1000,1500], franchigie: [] },
  commerc:    { fattMax: 1000000, massimali: [500,1000,1500,2000,2500,3000], franchigie: ["2.500 (−10% premio)","5.000 (−25% premio)"] },
  cdl:        { fattMax: 1000000, massimali: [500,1000,1500,2000,2500,3000], franchigie: ["1.000 (+15% premio)","5.000 (−30% premio)"] },
  visto:      { fattMax: 100000,  massimali: [3000], franchigie: ["500 invece di 1.000 (+30% premio, con 730)"] },
  revisione:  { massimali: [250,500,1000,1500,2000], franchigie: [], altro: true },
  avvocato:   { fattMax: 200000,  massimali: [350,500,1000,1500,2000,2500,3000], franchigie: ["Abbattimento della franchigia di 1.000 (+10% premio)"] },
  conciliazione: { massimali: [500,1000,1500], franchigie: [], altro: true },
  occ:        { massimali: [1000,2000,3000], franchigie: [], altro: true },
  agenteImm:  { massimali: [260,520,1550], franchigie: [], altro: true },
  ammCond:    { fattMax: 200000,  massimali: [500,1000,1500], franchigie: [] },
  mediatore:  { fattMax: 200000,  massimali: [500,750], franchigie: [] },
  peritoAss:  { fattMax: 200000,  massimali: [500,1000,1500], franchigie: [] },
  it:         { fattMax: 500000,  massimali: [250,500,1000,1500,2000,2500,3000], franchigie: [] },
  consulenza: "it",
  certificazione: { massimali: [250,500,1000,1500,2000], franchigie: [], altro: true },
  ambiente:   { fattMax: 500000,  massimali: [250,500,1000,1500,2000,2500,3000], franchigie: [] }
};
function regoleRC(p) { let r = REGOLE_RC[p]; return typeof r === "string" ? REGOLE_RC[r] : r; }

/* Massimali non disponibili (RD nei moduli) in base al fatturato e alla forma. */
function massimaleAmmesso(p, fatt, m, forma) {
  if (p === "mediatore") return !fatt || (fatt <= 100000 ? m === 500 : m === 750);
  if (p === "agenteImm" && forma) return m === { singolo: 260, snc: 520, srl: 1550 }[forma];
  const grp = PROFESSIONI[p] && PROFESSIONI[p].gruppo;
  if (grp !== "tecnici" || !fatt) return true;
  if (p === "perito") return !(m === 250 && fatt > 150000);
  if (m === 250 && fatt > 100000) return false;
  if (m === 250 && fatt > 50000 && p !== "geometra") return false;
  if (m === 500 && fatt > 500000) return false;
  return true;
}
const etichettaMassimale = m => m >= 1000 ? (m / 1000).toLocaleString("it-IT") + " mln" : m + " mila";

/* Quando la compagnia vuole la proposta completa (tailor made) */
function motiviProposta(r) {
  const out = [], p = P_(r), R = regoleRC(r.professione);
  if (!p) return out;
  if (p.proposta) out.push(`Per ${p.nome.toLowerCase()} la compagnia valuta sempre su proposta completa.`);
  if (R && R.fattMax && Number(r.fatturato) > R.fattMax) out.push(`Il fatturato supera ${euro(R.fattMax)}, il limite del modulo standard.`);
  const nonConf = QUESTIONARI.rcprof.passi.filter(x => x.id !== "proposta" && (!x.se || x.se(r)))
    .some(x => campiAttivi(x, r).some(c => c.tipo === "conferma" && r[c.id] === "no"));
  if (nonConf) out.push("C'è almeno una dichiarazione non confermata.");
  return out;
}

const CONF_IT = [
  ["noMedicale", "Il cliente e i collaboratori non lavorano per servizi medici, biomedici, bioingegneristici, di ricerca medica o nel settore sanitario."],
  ["noMilitare", "Non lavorano nel settore militare."],
  ["noGiochi", "Non lavorano per giochi a premi in denaro, lotterie, lotto o scommesse."],
  ["noSwFinanza", "Non si occupano di software per bilanci, per il calcolo delle imposte o per pagamenti (carte, bancomat, PayPal e simili)."],
  ["noProdotti", "Non fabbricano, costruiscono, modificano, riparano, vendono o forniscono prodotti."]
];
const CONF_CONSULENZA = [
  ["noInvestimenti", "Il cliente e i collaboratori non fanno consulenza sugli investimenti finanziari."],
  ["noPromotori", "Non sono iscritti all'albo dei consulenti finanziari né abilitati TUF o Consob."],
  ["noSanitario", "Non lavorano nel settore medico, paramedico, sanitario o della ricerca sperimentale."],
  ["noFormMedica", "Non si occupano di formazione in campo medico."],
  ["noTraduzioni", "Non traducono testi medici, sanitari, scientifici, finanziari, bancari, assicurativi o giuridici."]
];
const confermaRC = (id, dom, se) => ({ id, tipo: "conferma", obbl: true, se, avvisoNo: AVVISO_TAILOR, dom });

const ATTIVITA_PROGETTO = [{ v: "preliminare", t: "Progettazione di fattibilità o preliminare" }, { v: "definitiva", t: "Progettazione definitiva" }, { v: "esecutiva", t: "Progettazione esecutiva" }];

QUESTIONARI.rcprof = {
  titolo: "RC Professionale",
  ramo: "rcprof",
  passi: [
    { id: "prof", titolo: "Professione", sotto: "Da qui dipendono le domande successive.", campi: [
      { id: "copertura", tipo: "scelta", verticale: true, obbl: true, dom: "Cosa vuole assicurare?",
        opzioni: [{ v: "annuale", t: "Tutta l'attività professionale", n: "polizza annuale: il caso più comune" },
                  { v: "progetto", t: "Un singolo progetto o incarico", n: "opera pubblica (progettista), verifica di un progetto, progetto in ATI" }] },
      { id: "area", tipo: "scelta", verticale: true, obbl: true, se: annuale, dom: "In che area lavora?", opzioni: AREE_PROF },
      { id: "professione", tipo: "scelta", verticale: true, obbl: true, se: r => annuale(r) && !!r.area, dom: "Professione",
        opzioni: r => Object.entries(PROFESSIONI).filter(([, p]) => p.area === r.area).map(([v, p]) => ({ v, t: p.nome, n: p.nota })) },
      { id: "forma", tipo: "scelta", obbl: true, se: r => annuale(r) && !!P_(r), dom: "In che forma lavora?",
        opzioni: r => prof(r, "agenteImm")
          ? [{ v: "singolo", t: "Ditta individuale" }, { v: "snc", t: "Snc o Sas" }, { v: "srl", t: "Srl o Spa" }]
          : [{ v: "singolo", t: "Singolo professionista" }, { v: "studio", t: "Studio associato" }, { v: "societa", t: "Società" }] },
      { id: "settoreAmb", tipo: "scelta", verticale: true, obbl: true, se: r => annuale(r) && g(r, "ambiente"), dom: "Settore di attività",
        opzioni: [{ v: "tecnici", t: "Servizi tecnici", n: "disegno meccanico, grafica, project management edile, prove materiali, messe a terra, EGE, rilievi, interior design" },
                  { v: "ambiente", t: "Consulenza ambientale" },
                  { v: "sicurezza", t: "D.Lgs. 81/2008 e sicurezza cantieri" },
                  { v: "altro", t: "Altro" }] },
      { id: "settoreIt", tipo: "scelta", verticale: true, obbl: true, se: r => annuale(r) && prof(r, "it"), dom: "Settore di attività",
        opzioni: [{ v: "consulenza", t: "Consulenza informatica e sviluppo software" }, { v: "web", t: "Web design e siti internet" },
                  { v: "ingInfo", t: "Ingegnere dell'informazione", n: "iscritto all'albo: i danni materiali sono già compresi" }, { v: "altro", t: "Altro" }] },
      { id: "settoreCons", tipo: "multipla", obbl: true, se: r => annuale(r) && prof(r, "consulenza"), dom: "Di cosa si occupa? (anche più voci)",
        opzioni: [{ v: "aziendale", t: "Consulenza aziendale e direzione" }, { v: "agevolata", t: "Finanza agevolata, bandi e gare" },
                  { v: "privacy", t: "Privacy e DPO" }, { v: "crediti", t: "Recupero crediti" }, { v: "formazione", t: "Formazione" },
                  { v: "traduzioni", t: "Traduzioni" }, { v: "selezione", t: "Selezione del personale" }, { v: "odv", t: "Organismo di vigilanza (OdV)" },
                  { v: "marketing", t: "Marketing, comunicazione, eventi" }, { v: "ricerche", t: "Ricerche di mercato" }, { v: "altro", t: "Altro" }] },
      { id: "settoreAltro", tipo: "testo", obbl: true, largo: true, dom: "Descrivi l'attività",
        se: r => annuale(r) && ((g(r, "ambiente") && r.settoreAmb === "altro") || (prof(r, "it") && r.settoreIt === "altro") || (prof(r, "consulenza") && (r.settoreCons || []).includes("altro"))) }
    ]},
    PASSO_CLIENTE,

    /* ---------- singolo progetto ---------- */
    { id: "progetto", titolo: "Progetto", sotto: "La copertura vale per questa opera, per tutta la sua durata.", se: progetto, campi: [
      { id: "tipoProgetto", tipo: "scelta", verticale: true, obbl: true, dom: "Di che incarico si tratta?",
        opzioni: [{ v: "merloni", t: "Progettazione di un'opera pubblica", n: "la polizza del progettista chiesta dalla stazione appaltante" },
                  { v: "verifica", t: "Verifica di un progetto", n: "verificatore esterno incaricato dalla stazione appaltante" },
                  { v: "ati", t: "Progetto singolo, anche in ATI", n: "copertura dedicata a un'opera, pubblica o privata" }] },
      { id: "raggruppamento", tipo: "nota", obbl: r => r.tipoProgetto === "ati", dom: "Componenti del raggruppamento (ATI, RTP): nome, codice fiscale o P. IVA, ruolo nel progetto",
        aiuto: "Se il cliente lavora da solo, lascia vuoto." },
      { id: "committente", tipo: "testo", obbl: true, largo: true, dom: r => r.tipoProgetto === "ati" ? "Committente" : "Stazione appaltante o committente" },
      { id: "sedeCommittente", tipo: "testo", dom: "Sede del committente" },
      { id: "descrProgetto", tipo: "nota", obbl: true, dom: "Descrizione dell'opera e luogo di realizzazione" },
      { id: "attivitaProgetto", tipo: "multipla", obbl: true, se: r => r.tipoProgetto === "merloni", dom: "Attività affidata", opzioni: ATTIVITA_PROGETTO },
      { id: "valoreOpere", tipo: "euro", obbl: true, dom: r => r.tipoProgetto === "verifica" ? "Valore complessivo del progetto" : "Valore delle opere" },
      { id: "parcella", tipo: "euro", obbl: true, dom: r => r.tipoProgetto === "verifica" ? "Compenso per la verifica" : r.tipoProgetto === "ati" ? "Fatturato dall'opera" : "Importo della parcella" },
      { id: "dataIncarico", tipo: "data", se: r => r.tipoProgetto === "verifica", dom: "Data di accettazione dell'incarico" },
      { id: "verificaDal", tipo: "data", obbl: true, se: r => r.tipoProgetto === "verifica", dom: "Verifica: dal" },
      { id: "verificaAl", tipo: "data", obbl: true, se: r => r.tipoProgetto === "verifica", dom: "Verifica: al" },
      { id: "inizioLavori", tipo: "data", obbl: true, dom: "Inizio lavori previsto" },
      { id: "fineLavori", tipo: "data", obbl: true, dom: "Fine lavori prevista",
        verifica: (v, r) => r.inizioLavori && v < r.inizioLavori ? "La fine dei lavori è prima dell'inizio" : null },
      { id: "consegnaProgetto", tipo: "data", obbl: true, se: r => r.tipoProgetto === "merloni", dom: "Consegna prevista del progetto" },
      { id: "interruzioni", tipo: "sino", se: r => r.tipoProgetto === "merloni", dom: "Sono previste interruzioni dei lavori?",
        figli: { quando: "si", campi: [{ id: "interruzioniDesc", tipo: "nota", obbl: true, dom: "Quando e per quanto" }] } },
      { id: "letteraImpegno", tipo: "sino", se: r => r.tipoProgetto === "merloni", dom: "Serve la lettera di impegno della compagnia per la gara?",
        figli: { quando: "si", campi: [{ id: "letteraEntro", tipo: "data", obbl: true, dom: "Da presentare entro il" }] } },
      { id: "ripartizioneAti", tipo: "nota", se: r => r.tipoProgetto === "ati", dom: "Fatturato diviso per attività",
        aiuto: "Per esempio: direzione lavori, progettazione architettonica, strutture, impianti, sicurezza, acustica ed energia." },
      { id: "massimaleProgetto", tipo: "euro", obbl: true, dom: "Massimale richiesto", aiuto: "Di solito lo indicano il bando o il contratto d'incarico." }
    ]},

    /* ---------- attività (polizza annuale) ---------- */
    { id: "attivita", titolo: "Attività", sotto: "Fatturato e altre coperture.", se: annuale, campi: [
      { id: "neo", tipo: "sino", dom: "Attività avviata da meno di un anno?" },
      { id: "fatturato", tipo: "euro", obbl: true,
        dom: r => g(r, "visto") ? "Fatturato dal solo visto di conformità" : r.neo === "si" ? "Fatturato previsto per il primo anno" : "Fatturato dell'ultimo anno",
        aiuto: "Volume d'affari dall'ultimo Modello Unico o dall'ultima Comunicazione Dati IVA. Includi anche il fatturato delle estensioni che chiederai.",
        avviso: (v, r) => { const R = regoleRC(r.professione); return R && R.fattMax && v > R.fattMax ? { livello: "ambra", testo: `Oltre ${euro(R.fattMax)} il modulo standard non si applica: la pratica va come proposta completa.` } : null; } },
      { id: "fattCorrente", tipo: "euro", se: r => !!P_(r) && P_(r).proposta && r.neo !== "si", dom: "Fatturato stimato per l'anno in corso" },
      { id: "con730", tipo: "sino", obbl: true, se: r => g(r, "visto"), dom: "Comprende anche l'assistenza sui modelli 730?" }
    ]},

    { id: "precedenti", titolo: "Precedenti", sotto: "Dichiarazioni che finiscono in polizza: leggile al cliente.", campi: [
      { id: "noRichieste", tipo: "conferma", obbl: true, dom: "Negli ultimi 5 anni non sono mai state avanzate richieste di risarcimento nei confronti di:",
        elenco: SOGGETTI_DICH, avvisoNo: AVVISO_TAILOR, figli: { quando: "no", campi: DETTAGLIO_EVENTO.map(c => ({ ...c, id: "ric_" + c.id })) } },
      { id: "noCircostanze", tipo: "conferma", obbl: true, dom: "Non ci sono circostanze note che possano portare a una perdita o a una richiesta di risarcimento nei confronti di:",
        elenco: SOGGETTI_DICH, avvisoNo: AVVISO_TAILOR, figli: { quando: "no", campi: DETTAGLIO_EVENTO.map(c => ({ ...c, id: "circ_" + c.id, dom: c.id === "importo" ? "Danno potenziale stimato" : c.dom })) } },
      confermaRC("noProcedure", "Né il cliente né i collaboratori sono o sono stati sindaci, revisori, membri di OdV, attestatori o amministratori di società o enti in procedura concorsuale, insolvenza, crisi d'impresa o liquidazione.",
        r => annuale(r) && g(r, "economica", "avvocati")),
      confermaRC("noPerdite25", "Il cliente non è sindaco o revisore di società o enti con perdita ante imposte superiore al 25% del patrimonio netto nell'ultimo bilancio.", r => annuale(r) && g(r, "economica")),
      confermaRC("noCertTributaria", "Il cliente non svolge certificazione tributaria (il cosiddetto visto pesante).", r => annuale(r) && g(r, "avvocati")),
      confermaRC("noIndagini", "Il cliente non è mai stato sottoposto a indagini, verifiche, contestazioni o sanzioni da parte di autorità di vigilanza o dell'autorità giudiziaria.", r => annuale(r) && prof(r, "mediatore")),
      confermaRC("noAutonomia25", "Il cliente non ha autonomia di liquidazione dei danni oltre 25.000 €.", r => annuale(r) && prof(r, "peritoAss")),
      confermaRC("noPrivati35", "Gli incarichi da privati o società diverse dalle compagnie non superano il 35% del fatturato.", r => annuale(r) && prof(r, "peritoAss")),
      ...CONF_IT.map(([id, dom]) => confermaRC(id, dom, r => annuale(r) && prof(r, "it"))),
      ...CONF_CONSULENZA.map(([id, dom]) => confermaRC(id, dom, r => annuale(r) && prof(r, "consulenza"))),
      confermaRC("noAlbo", "Il cliente e i collaboratori non sono iscritti ad albi professionali (salvo l'albo degli Esperti in Innovazione Tecnologica).", r => annuale(r) && g(r, "ambiente")),
      confermaRC("noCostruzione", "Non sono coinvolti in processi di costruzione.", r => annuale(r) && g(r, "ambiente")),
      confermaRC("noTrasporti", "Non progettano in ambito navale, aeronautico, automotive, ferroviario, autostradale (gallerie e ponti compresi).", r => annuale(r) && g(r, "ambiente")),
      confermaRC("noSorveglianza", "Non si occupano di sorveglianza sanitaria (art. 41 D.Lgs. 81/2008).", r => annuale(r) && g(r, "ambiente")),
      confermaRC("noPrototipi", "L'opera non prevede prototipi né materiali o tecniche costruttive sperimentali.", r => progetto(r) && r.tipoProgetto === "ati"),
      confermaRC("subappaltatoriRC", "Ai subappaltatori, se previsti, si chiede una propria polizza di RC professionale.", r => progetto(r) && r.tipoProgetto === "ati"),
      confermaRC("noVertenze", "Nessun componente dell'ATI ha vertenze in corso con la stazione appaltante.", r => progetto(r) && r.tipoProgetto === "ati"),
      { id: "annullata", tipo: "sino", obbl: true, se: r => progetto(r) || (!!P_(r) && P_(r).proposta), dom: "Negli ultimi 5 anni una compagnia ha annullato, rifiutato o non rinnovato la sua RC professionale?",
        avvisoSe: v => v === "si" ? { livello: "ambra", testo: "La compagnia vorrà sapere perché: descrivi sotto." } : null,
        figli: { quando: "si", campi: [{ id: "annullataDesc", tipo: "nota", obbl: true, dom: "Compagnia, anno e motivo" }] } },
      DOMANDA_ALTRA_POLIZZA
    ]},

    { id: "estensioni", titolo: "Estensioni", sotto: "Attiva solo quelle incluse nel fatturato dichiarato.", se: r => annuale(r) && !g(r, "visto"), campi: [
      { id: "estPersonale", tipo: "sino", se: r => r.forma !== "singolo" && g(r, "tecnici", "economica", "avvocati", "immobiliare", "digitale", "ambiente"), dom: "Attività personale dei singoli professionisti",
        aiuto: "Senza costo in più, ma il loro fatturato va sommato a quello dichiarato." },
      { id: "estAssociati", tipo: "sino", se: r => g(r, "agro"), dom: "Studi associati o società" },
      { id: "estCondominio", tipo: "sino", se: r => g(r, "agro", "avvocati") || prof(r, "mediatore", "peritoAss"), dom: "Amministratore condominiale" },
      { id: "escDL", tipo: "sino", se: r => g(r, "tecnici"), dom: "Esclusione della direzione lavori", aiuto: "Riduce il premio del 25%." },
      { id: "chiaviMano", tipo: "sino", se: r => g(r, "tecnici"), dom: "Incarichi \"chiavi in mano\"" },
      { id: "superbonus", tipo: "sino", se: r => g(r, "tecnici"), dom: "Rilascia asseverazioni per Superbonus, Ecobonus o Sismabonus (art. 119 DL 34/2020)?",
        aiuto: "Serve una polizza dedicata, oltre alla RC professionale.",
        figli: { quando: "si", campi: [
          { id: "sbFatturato", tipo: "euro", obbl: true, dom: "Fatturato dalle sole asseverazioni",
            avviso: v => v > 200000 ? { livello: "ambra", testo: "Oltre 200.000 € la polizza asseverazioni va su proposta completa." } : null },
          { id: "sbAsseveratori", tipo: "nota", obbl: true, se: r => r.forma !== "singolo", dom: "Nomi dei professionisti che asseverano" },
          { id: "sbMassimale", tipo: "scelta", obbl: true, dom: "Massimale della polizza asseverazioni",
            aiuto: "Con più professionisti assicurati, almeno 500.000 € per ciascuno.",
            opzioni: [500,1000,1500,2000,2500,3000].map(m => ({ v: String(m), t: etichettaMassimale(m) })) } ] } },
      { id: "estSindaco", tipo: "sino", se: r => g(r, "economica", "avvocati"), dom: "Revisore, sindaco, OdV, attestatore, amministratore",
        figli: { quando: "si", campi: [{ id: "quota35", tipo: "conferma", obbl: true, avvisoNo: AVVISO_TAILOR, dom: "Il fatturato da queste attività non supera il 35% del totale." }] } },
      { id: "estOdv", tipo: "sino", se: r => g(r, "economica"), dom: "Organismo di vigilanza (OdV)" },
      { id: "estEdp", tipo: "sino", se: r => g(r, "economica"), dom: "Società di servizi contabili (EDP)" },
      { id: "estVisto", tipo: "scelta", se: r => g(r, "economica"), dom: "Visto di conformità",
        opzioni: [{ v: "no", t: "No" }, { v: "ordinario", t: "Ordinario" }, { v: "730", t: "Ordinario + 730" }, { v: "pesante", t: "Certificazione tributaria" }] },
      { id: "estCollabOAM", tipo: "sino", se: r => prof(r, "mediatore"), dom: "Collaboratori iscritti all'OAM con lo stesso massimale",
        aiuto: "Aumenta il premio del 30%, qualunque sia il numero dei collaboratori.",
        figli: { quando: "si", campi: [{ id: "collabOAMNomi", tipo: "nota", obbl: true, dom: "Nomi dei collaboratori" }] } },
      { id: "estRct", tipo: "sino", se: r => g(r, "ambiente"), dom: "Estensione RC verso terzi", aiuto: "Aumenta il premio del 15%." },
      { id: "estDanni", tipo: "sino", se: r => g(r, "digitale"), dom: "Pacchetto danni: RC verso terzi e verso dipendenti (RCT/RCO)", aiuto: "Aumenta il premio del 15%." },
      { id: "estMateriali", tipo: "sino", se: r => prof(r, "it") && r.settoreIt !== "ingInfo", dom: "Danni materiali", aiuto: "Aumenta il premio del 10%." },
      { id: "estUsa", tipo: "sino", se: r => g(r, "tecnici", "economica", "ambiente", "digitale", "certificazione"),
        dom: r => g(r, "certificazione") ? "Lavora anche per clienti in USA o Canada?" : "Attività nel mondo intero, compresi USA e Canada",
        figli: { quando: "si", campi: [
          { id: "usaFatt", tipo: "euro", obbl: true, dom: "Fatturato USA e Canada" },
          { id: "usaAtt", tipo: "testo", dom: "Attività svolta all'estero" },
          { id: "usaClienti", tipo: "testo", dom: "Clienti principali" } ] } }
    ]},

    /* ---------- dati in più quando serve la proposta completa ---------- */
    { id: "proposta", titolo: "Proposta completa", sotto: "La compagnia valuta caso per caso: questi dati evitano una seconda richiesta al cliente.",
      se: r => annuale(r) && motiviProposta(r).length > 0, campi: [
      { id: "motiviProposta", tipo: "info", dom: "Perché servono", elenco: motiviProposta },
      { id: "soci", tipo: "nota", obbl: true, dom: "Soci, professionisti associati e collaboratori: quanti sono e come si chiamano" },
      { id: "clientiPrincipali", tipo: "nota", obbl: true, dom: "I tre clienti principali e il fatturato da ciascuno" },
      { id: "ripartizione", tipo: "nota", se: r => !prof(r, "agenteImm"), dom: "Fatturato diviso per tipo di attività",
        aiuto: r => g(r, "tecnici") ? "Per esempio: direzione lavori, progettazione architettonica, strutture, impianti, sicurezza, acustica ed energia." : "Le attività principali e la quota di fatturato di ciascuna." },
      { id: "quotate", tipo: "sino", obbl: true, se: r => prof(r, "revisione"), dom: "Tra i clienti ci sono società quotate in borsa?" },
      { id: "accreditamento", tipo: "sino", obbl: true, se: r => prof(r, "certificazione"), dom: "È accreditato presso un organismo di accreditamento?",
        figli: { quando: "si", campi: [{ id: "accreditamentoDa", tipo: "testo", dom: "Quale (es. Accredia)" }] } },
      { id: "laboratori", tipo: "sino", obbl: true, se: r => prof(r, "certificazione"), dom: "Si avvale di laboratori per i test sui prodotti?" },
      { id: "schemiCert", tipo: "nota", obbl: true, se: r => prof(r, "certificazione"), dom: "Schemi di certificazione e fatturato per ciascuno",
        aiuto: "Per esempio: ISO 9001, ISO 14001, ISO 45001, prodotti (DOP, IGP, BRC-IFS, HACCP), direttive CE." },
      { id: "occIscrizione", tipo: "data", obbl: true, se: r => prof(r, "occ"), dom: "Data di iscrizione al registro degli OCC" },
      { id: "occReferente", tipo: "testo", obbl: true, se: r => prof(r, "occ"), dom: "Referente dell'organismo" },
      { id: "occGestori", tipo: "testo", obbl: true, tastiera: "numeric", se: r => prof(r, "occ"), dom: "Numero dei gestori della crisi" },
      { id: "occEstGestori", tipo: "sino", obbl: true, se: r => prof(r, "occ"), dom: "Si vuole estendere la copertura ai gestori della crisi?" },
      { id: "occProcedure", tipo: "nota", se: r => prof(r, "occ"), dom: "Tipi di procedure gestite (consumatori, professionisti, piccoli imprenditori…) e compensi" },
      { id: "concMediatori", tipo: "testo", obbl: true, tastiera: "numeric", se: r => prof(r, "conciliazione"), dom: "Numero dei mediatori" },
      { id: "concPerConto", tipo: "scelta", obbl: true, se: r => prof(r, "conciliazione"), dom: "Attività svolta per conto di", opzioni: [{ v: "privato", t: "Ente privato" }, { v: "pubblico", t: "Ente pubblico" }] },
      { id: "concMaterie", tipo: "nota", se: r => prof(r, "conciliazione"), dom: "Materie e tipi di mediazione" }
    ]},

    { id: "garanzie", titolo: "Massimale", sotto: "Scelta del limite di indennizzo e della franchigia.", se: annuale, campi: [
      { id: "massimale", tipo: "scelta", obbl: true, dom: "Massimale richiesto",
        opzioni: r => { const R = regoleRC(r.professione); if (!R) return [];
          return R.massimali.filter(m => massimaleAmmesso(r.professione, Number(r.fatturato), m, r.forma))
                            .map(m => ({ v: String(m), t: etichettaMassimale(m) }))
                            .concat(R.altro ? [{ v: "altro", t: "Altro" }] : []); },
        aiuto: r => g(r, "visto") ? "Il visto di conformità ha un massimale unico di 3 milioni." : "Compaiono solo i massimali ammessi per la professione e il fatturato indicati.",
        figli: { quando: "altro", campi: [{ id: "massimaleAltro", tipo: "euro", obbl: true, dom: "Massimale desiderato" }] } },
      { id: "altroMassimale", tipo: "sino", se: r => !g(r, "visto"), dom: "Il cliente vuole anche un preventivo con un secondo massimale?",
        figli: { quando: "si", campi: [{ id: "massimale2", tipo: "testo", dom: "Secondo massimale" }] } },
      { id: "franchigia", tipo: "scelta", verticale: true,
        se: r => { const R = regoleRC(r.professione); return R && R.franchigie.length && (!g(r, "visto") || r.con730 === "si"); },
        dom: "Franchigia", opzioni: r => [{ v: "standard", t: "Standard" }].concat(regoleRC(r.professione).franchigie.map(f => ({ v: f, t: /^\d/.test(f) ? "€ " + f : f }))) }
    ]},
    PASSO_CHIUSURA
  ]
};


/* =====================================================================
   RC ENTI PUBBLICI E DIPENDENTI (DUAL P.O.): accorpa P.O. Plus Individual,
   P.O. Plus Group, P.O. Ente (per dipendenti o per retribuzioni),
   Merloni e Verificatore di progetto per i dipendenti pubblici.
   ===================================================================== */
const poChi = (r, ...x) => x.includes(r.poChi);
const INCARICHI_PO = [
  { v: "A1", t: "Amministrativo con ruolo apicale", n: "sindaco, vicesindaco, segretario, direttore, dirigente, funzionario, RUP, OIV, responsabile anticorruzione; in società: amministratore, consigliere, membro del CdA" },
  { v: "A2", t: "Amministrativo non apicale", n: "assessore, consigliere, istruttore direttivo, impiegato amministrativo o di polizia municipale, capoufficio" },
  { v: "T1", t: "Tecnico con ruolo apicale", n: "direttore, dirigente, funzionario tecnico, responsabile unico del progetto, elevata qualificazione tecnica" },
  { v: "T2", t: "Tecnico non apicale", n: "istruttore direttivo tecnico, dipendente tecnico, capoufficio" }
];
const ENTI_PO = [["comune5", "Comune fino a 5.000 abitanti"], ["comune", "Comune oltre 5.000 abitanti"], ["provincia", "Provincia"], ["regione", "Regione"],
  ["ministero", "Ministero"], ["universita", "Università"], ["istruzione", "Istruzione (non universitaria)"], ["sanita", "Settore sanitario"],
  ["idrici", "Servizi idrici"], ["rifiuti", "Rifiuti"], ["strade", "Strade e autostrade"], ["trasporti", "Trasporti"], ["aero", "Aeronautico"],
  ["porti", "Portuale"], ["forze", "Forze armate e di polizia"], ["vvf", "Vigili del fuoco"], ["altro", "Altro"]].map(([v, t]) => ({ v, t }));
const SETTORI_ESCLUSI = ["tabacco, amianto", "revisione e certificazione di bilanci", "fondi pensione, assicurazioni", "sport professionistico",
  "servizi finanziari (banche, gestione del risparmio, intermediazione, credito, leasing)", "telecomunicazioni", "gioco d'azzardo, pornografia, armi nucleari"];
const conSocieta = r => ["societa", "entrambi"].includes(r.tipoEntePO);
const amministrativo = r => poChi(r, "persona") ? ["A1", "A2"].includes(r.incarico) : Number(r.numAmm) > 0;
const nonApicale = r => poChi(r, "persona") ? ["A2", "T2"].includes(r.incarico) : true;

QUESTIONARI.po = {
  titolo: "RC enti pubblici e dipendenti",
  passi: [
    { id: "chi", titolo: "Chi assicurare", sotto: "Da qui dipendono le domande successive.", campi: [
      { id: "poChi", tipo: "scelta", verticale: true, obbl: true, dom: "Chi va assicurato?",
        opzioni: [{ v: "persona", t: "Un amministratore o dipendente pubblico", n: "copertura personale, anche per colpa grave davanti alla Corte dei conti" },
                  { v: "gruppo", t: "Più dipendenti dello stesso ente", n: "adesione collettiva tramite un mandatario" },
                  { v: "ente", t: "L'ente, per i propri dipendenti", n: "a premio per numero di dipendenti o per retribuzioni" },
                  { v: "progetto", t: "Un progetto di opera pubblica", n: "progettista o verificatore interno, dipendente dell'ente" }] }
    ]},
    PASSO_CLIENTE,
    { id: "incarichi", titolo: "Incarichi", sotto: "Dove lavora e con che ruolo.", se: r => poChi(r, "persona", "gruppo"), campi: [
      { id: "incarico", tipo: "scelta", verticale: true, obbl: true, se: r => poChi(r, "persona"), dom: "Tipo di incarico",
        aiuto: "Con più incarichi scegli quello di livello più alto.", opzioni: INCARICHI_PO },
      { id: "numAderenti", tipo: "testo", obbl: true, tastiera: "numeric", se: r => poChi(r, "gruppo"), dom: "Numero di aderenti" },
      { id: "numAmm", tipo: "testo", obbl: true, tastiera: "numeric", se: r => poChi(r, "gruppo"), dom: "Di cui con incarichi amministrativi" },
      { id: "numTec", tipo: "testo", obbl: true, tastiera: "numeric", se: r => poChi(r, "gruppo"), dom: "Di cui con incarichi tecnici" },
      { id: "tipoEntePO", tipo: "scelta", verticale: true, obbl: true, dom: "Presso chi svolge gli incarichi?",
        opzioni: [{ v: "pubblico", t: "Ente pubblico", n: "di costituzione interamente pubblica" },
                  { v: "societa", t: "Società", n: "anche se di proprietà interamente pubblica" },
                  { v: "entrambi", t: "Sia enti pubblici sia società" }] },
      { id: "entePub", tipo: "scelta", obbl: true, se: r => ["pubblico", "entrambi"].includes(r.tipoEntePO), dom: "Tipo di ente pubblico",
        aiuto: "Con più enti scegli quello a rischio più alto (di solito il più grande).", opzioni: ENTI_PO,
        figli: { quando: "altro", campi: [{ id: "entePubAltro", tipo: "testo", obbl: true, dom: "Quale" }] } },
      { id: "elencoIncarichi", tipo: "nota", obbl: true,
        dom: r => poChi(r, "gruppo") ? "Ente o società presso cui lavorano gli aderenti" : "Enti e società in cui ha incarichi, con l'incarico svolto",
        aiuto: r => conSocieta(r) ? "Per le società indica anche partita IVA e settore di attività." : "" },
      { id: "attivoSoc", tipo: "scelta", obbl: true, se: conSocieta, dom: "Totale attivo della società (il più alto, se più di una)",
        opzioni: [{ v: "50", t: "Fino a 50 mln" }, { v: "100", t: "Da 50 a 100 mln" }, { v: "oltre", t: "Oltre 100 mln" }],
        avvisoSe: v => v === "oltre" ? { livello: "ambra", testo: "Oltre 100 milioni la compagnia valuta caso per caso." } : null },
      { id: "socBilancio", tipo: "conferma", obbl: true, se: conSocieta, avvisoNo: AVVISO_TAILOR,
        dom: "Nell'ultimo bilancio delle società: totale attivo non oltre 100 milioni, nessuna perdita ante imposte oltre il 25% del patrimonio netto, patrimonio netto non negativo." },
      { id: "socInsolvenza", tipo: "conferma", obbl: true, se: conSocieta, avvisoNo: AVVISO_TAILOR,
        dom: "Le società non sono insolventi né in procedure concorsuali, liquidazione, commissariamento o composizione negoziata della crisi." },
      { id: "socSettori", tipo: "conferma", obbl: true, se: conSocieta, avvisoNo: AVVISO_TAILOR, dom: "Le società non operano in questi settori:", elenco: SETTORI_ESCLUSI },
      { id: "noCaricheStato", tipo: "conferma", obbl: true, se: r => poChi(r, "persona"), avvisoNo: AVVISO_TAILOR,
        dom: "Non ricopre le massime cariche dello Stato (Presidente della Repubblica o del Consiglio, ministri, parlamentari, presidenti delle Camere, giudici delle giurisdizioni superiori)." },
      { id: "max7", tipo: "conferma", obbl: true, se: r => poChi(r, "persona"), avvisoNo: AVVISO_TAILOR, dom: "Non ha più di 7 incarichi." }
    ]},
    { id: "ente", titolo: "Ente", sotto: "Dati dell'ente da assicurare.", se: r => poChi(r, "ente"), campi: [
      { id: "enteTipo", tipo: "scelta", obbl: true, dom: "Tipo di ente", opzioni: ENTI_PO,
        figli: { quando: "altro", campi: [{ id: "enteTipoAltro", tipo: "testo", obbl: true, dom: "Quale" }] } },
      { id: "abitanti", tipo: "scelta", obbl: true, se: r => ["comune5", "comune"].includes(r.enteTipo), dom: "Abitanti del Comune",
        opzioni: r => r.enteTipo === "comune5" ? [{ v: "5", t: "Fino a 5.000" }] : [{ v: "60", t: "Da 5.000 a 60.000" }, { v: "oltre", t: "Oltre 60.000" }] },
      { id: "fusioniPassate", tipo: "sino", obbl: true, dom: "Fusioni o incorporazioni con altri enti negli ultimi 5 anni?",
        figli: { quando: "si", campi: [{ id: "fusioniPassateDesc", tipo: "nota", obbl: true, dom: "Dettagli" }] } },
      { id: "fusioniFuture", tipo: "sino", obbl: true, dom: "Fusioni o incorporazioni in programma?",
        figli: { quando: "si", campi: [{ id: "fusioniFutureDesc", tipo: "nota", obbl: true, dom: "Dettagli" }] } },
      { id: "criterio", tipo: "scelta", obbl: true, dom: "Il premio si calcola su", opzioni: [{ v: "dipendenti", t: "Numero di dipendenti" }, { v: "retribuzioni", t: "Retribuzioni annue" }] },
      { id: "retribuzioni", tipo: "euro", obbl: true, se: r => r.criterio === "retribuzioni", dom: "Retribuzioni annue totali" },
      { id: "elencoDip", tipo: "nota", obbl: true, dom: "Dipendenti da assicurare: nome, mansione, eventuali altre mansioni",
        aiuto: "Se è lungo, scrivi il numero e allega l'elenco nell'ultimo passo." }
    ]},
    { id: "progettoPO", titolo: "Progetto", sotto: "Opera pubblica progettata o verificata da dipendenti dell'ente.", se: r => poChi(r, "progetto"), campi: [
      { id: "tipoProgettoPO", tipo: "scelta", verticale: true, obbl: true, dom: "Chi va assicurato?",
        opzioni: [{ v: "merloni", t: "I progettisti interni" }, { v: "verifica", t: "Il verificatore interno del progetto" }] },
      { id: "committente", tipo: "testo", obbl: true, largo: true, dom: "Stazione appaltante" },
      { id: "assicuratiProg", tipo: "nota", obbl: true, dom: r => r.tipoProgettoPO === "verifica" ? "Verificatore interno: nome, qualifica, codice fiscale" : "Progettisti da assicurare: nome e codice fiscale" },
      { id: "descrProgetto", tipo: "nota", obbl: true, dom: "Descrizione dell'opera e luogo di realizzazione",
        aiuto: "Allega nell'ultimo passo la delibera d'incarico della stazione appaltante." },
      { id: "attivitaProgetto", tipo: "multipla", obbl: true, se: r => r.tipoProgettoPO === "merloni", dom: "Attività affidata", opzioni: ATTIVITA_PROGETTO },
      { id: "valoreOpere", tipo: "euro", obbl: true, dom: "Valore delle opere" },
      { id: "dataIncarico", tipo: "data", se: r => r.tipoProgettoPO === "verifica", dom: "Data di accettazione dell'incarico di verifica" },
      { id: "verificaDal", tipo: "data", obbl: true, se: r => r.tipoProgettoPO === "verifica", dom: "Verifica: dal" },
      { id: "verificaAl", tipo: "data", obbl: true, se: r => r.tipoProgettoPO === "verifica", dom: "Verifica: al" },
      { id: "inizioLavori", tipo: "data", obbl: true, dom: "Inizio lavori previsto" },
      { id: "fineLavori", tipo: "data", obbl: true, dom: "Fine lavori prevista",
        verifica: (v, r) => r.inizioLavori && v < r.inizioLavori ? "La fine dei lavori è prima dell'inizio" : null },
      { id: "consegnaProgetto", tipo: "data", se: r => r.tipoProgettoPO === "merloni", dom: "Consegna prevista del progetto" },
      { id: "interruzioni", tipo: "sino", se: r => r.tipoProgettoPO === "merloni", dom: "Sono previste interruzioni dei lavori?",
        figli: { quando: "si", campi: [{ id: "interruzioniDesc", tipo: "nota", obbl: true, dom: "Quando e per quanto" }] } }
    ]},
    { id: "precedentiPO", titolo: "Precedenti", sotto: "Ultimi 5 anni. Dichiarazioni che finiscono in polizza.", campi: [
      { id: "noRichieste", tipo: "conferma", obbl: true, avvisoNo: AVVISO_TAILOR,
        dom: r => poChi(r, "ente") ? "Negli ultimi 5 anni non ci sono state perdite né richieste di risarcimento verso l'ente o i dipendenti da assicurare." : "Negli ultimi 5 anni non ci sono state richieste di risarcimento verso gli assicurati.",
        figli: { quando: "no", campi: DETTAGLIO_EVENTO.map(c => ({ ...c, id: "ric_" + c.id })) } },
      { id: "noCircostanze", tipo: "conferma", obbl: true, avvisoNo: AVVISO_TAILOR,
        dom: "Non ci sono fatti o circostanze note che possano portare a una perdita o a una richiesta di risarcimento.",
        figli: { quando: "no", campi: DETTAGLIO_EVENTO.map(c => ({ ...c, id: "circ_" + c.id, dom: c.id === "importo" ? "Danno potenziale stimato" : c.dom })) } },
      { id: "annullata", tipo: "sino", obbl: true, se: r => poChi(r, "ente"), dom: "Negli ultimi 5 anni una compagnia ha annullato, rifiutato o non rinnovato la copertura?",
        figli: { quando: "si", campi: [{ id: "annullataDesc", tipo: "nota", obbl: true, dom: "Compagnia, anno e motivo" }] } },
      { ...DOMANDA_ALTRA_POLIZZA, se: r => poChi(r, "ente", "progetto") },
      { id: "giaRcEnte", tipo: "sino", se: r => poChi(r, "persona", "gruppo"), dom: "L'ente o la società ha già una polizza RC patrimoniale o D&O?",
        figli: { quando: "si", campi: [{ id: "giaRcEnteComp", tipo: "testo", dom: "Con quale compagnia" }] } }
    ]},
    { id: "garanziePO", titolo: "Garanzie", sotto: "Estensioni e massimale.", campi: [
      { id: "estCessati", tipo: "sino", se: r => poChi(r, "persona"), dom: "Estensione agli incarichi cessati nel periodo di retroattività", aiuto: "Aumenta il premio del 20%." },
      { id: "estDanniAmm", tipo: "sino", se: r => poChi(r, "persona", "gruppo") && amministrativo(r), dom: "Danni materiali e corporali per incarichi amministrativi",
        aiuto: r => poChi(r, "persona") ? "Aumenta il premio del 20%." : "" },
      { id: "estVeicoli", tipo: "sino", se: r => poChi(r, "persona", "gruppo"), dom: "Danni materiali ai veicoli in uso all'assicurato",
        aiuto: r => poChi(r, "persona") ? "Aumenta il premio del 20%." : "" },
      { id: "rinunciaRC", tipo: "sino", se: r => poChi(r, "persona", "gruppo") && nonApicale(r), dom: "Rinuncia alla RC davanti al giudice ordinario?",
        aiuto: "Resta solo la responsabilità amministrativa e contabile davanti alla Corte dei conti. Solo per incarichi non apicali." },
      { id: "massimalePO", tipo: "scelta", obbl: true, se: r => poChi(r, "persona"), dom: "Massimale",
        opzioni: [500,1000,1500,2000,2500,3000,3500,4000,4500,5000].map(m => ({ v: String(m), t: etichettaMassimale(m) })) },
      { id: "massimaliGruppo", tipo: "multipla", obbl: true, se: r => poChi(r, "gruppo"), dom: "Massimali per sinistro da quotare (anche più di uno)",
        opzioni: [500,1000,1500,2000,2500,3000,3500,4000,4500,5000].map(m => ({ v: String(m), t: etichettaMassimale(m) })) },
      { id: "aggregatoGruppo", tipo: "multipla", obbl: true, se: r => poChi(r, "gruppo"), dom: "Massimali annui complessivi da quotare",
        opzioni: [1000,2000,3000,4000,5000].map(m => ({ v: String(m), t: etichettaMassimale(m) })) },
      { id: "massimaleEnte", tipo: "scelta", obbl: true, se: r => poChi(r, "ente"), dom: "Massimale",
        opzioni: [250,500,1000,1500,2000,2500].map(m => ({ v: String(m), t: etichettaMassimale(m) })).concat({ v: "altro", t: "Altro" }),
        figli: { quando: "altro", campi: [{ id: "massimaleEnteAltro", tipo: "euro", obbl: true, dom: "Massimale desiderato" }] } },
      { id: "aggregatoEnte", tipo: "euro", se: r => poChi(r, "ente") && r.criterio === "retribuzioni", dom: "Massimale annuo complessivo" },
      { id: "corresponsabilita", tipo: "euro", se: r => poChi(r, "ente") && r.criterio === "retribuzioni", dom: "Massimale per corresponsabilità" },
      { id: "massimaleProgetto", tipo: "euro", obbl: true, se: r => poChi(r, "progetto"), dom: "Massimale richiesto", aiuto: "Di solito lo indicano il bando o la delibera." }
    ]},
    PASSO_CHIUSURA
  ]
};


/* =====================================================================
   RC STRUTTURE SANITARIE (DUAL Healthcare): accorpa il modulo per
   strutture sanitarie private (residenziali e ambulatoriali) e la proposta
   per case di cura. Per le case di cura con chirurgia si raccolgono i dati
   principali e si allega la proposta completa.
   ===================================================================== */
const san = (r, ...x) => x.includes(r.tipoSan);
const ambulatoriale = r => san(r, "ambulatoriale", "entrambe");
const residenziale = r => san(r, "residenziale", "entrambe");
const standardSan = r => !!r.tipoSan && !san(r, "casacura");
const PRESTAZIONI_AMB = [
  ["visite", "Visite specialistiche (non invasive)"], ["chirAmb", "Chirurgia ambulatoriale e attività invasiva"], ["medEst", "Medicina estetica"],
  ["chirEst", "Chirurgia estetica"], ["pma", "Procreazione medicalmente assistita"], ["fisio", "Fisioterapia e riabilitazione"],
  ["immagini", "Diagnostica per immagini e radiologia"], ["laboratorio", "Laboratorio analisi"], ["nucleare", "Medicina nucleare"],
  ["prenatale", "Diagnostica prenatale"], ["odonto", "Odontoiatria e igiene (senza implantologia)"], ["implanto", "Implantologia"],
  ["psico", "Psicologia e psicoterapia"], ["dipendenze", "Trattamento delle dipendenze"]];
const POSTI_RES = [["intensive", "Cure intensive e centri specializzati"], ["nonAuto", "Pazienti non autosufficienti"], ["auto", "Autosufficienti, casa di riposo"], ["diurno", "Centro diurno"]];
const confSan = (id, dom, elenco) => ({ id, tipo: "conferma", obbl: true, se: standardSan, avvisoNo: AVVISO_TAILOR, dom, elenco });

QUESTIONARI.sanita = {
  titolo: "RC strutture sanitarie",
  passi: [
    PASSO_CLIENTE,
    { id: "struttura", titolo: "Struttura", sotto: "Che attività svolge.", campi: [
      { id: "nomeStruttura", tipo: "testo", largo: true, dom: "Nome della struttura, se diverso dalla ragione sociale" },
      { id: "tipoSan", tipo: "scelta", verticale: true, obbl: true, dom: "Tipo di struttura",
        opzioni: [{ v: "residenziale", t: "Residenziale, con posti letto", n: "RSA, RSD, hospice, riabilitazione, centri Alzheimer" },
                  { v: "ambulatoriale", t: "Ambulatoriale", n: "poliambulatori, centri medici, odontoiatria, diagnostica, analisi, prelievi" },
                  { v: "entrambe", t: "Residenziale e ambulatoriale" },
                  { v: "casacura", t: "Casa di cura o clinica con ricovero", n: "con attività chirurgica, anestesiologica o punto nascita" }],
        avvisoSe: v => v === "casacura" ? { livello: "ambra", testo: "Per le case di cura la compagnia vuole la proposta completa (reparti, sale operatorie, gestione del rischio): raccogli qui i dati principali e allega la proposta compilata." } : null },
      { id: "prevRes", tipo: "scelta", obbl: true, se: residenziale, dom: "Attività residenziale prevalente",
        opzioni: ["RSA", "RSD", "Hospice", "Lungodegenza psichiatrica", "Riabilitazione", "Centro Alzheimer", "Centro specializzato", "Cooperativa", "Onlus", "Altro"].map(t => ({ v: t, t })) },
      { id: "prevAmb", tipo: "scelta", obbl: true, se: ambulatoriale, dom: "Attività ambulatoriale prevalente",
        opzioni: ["Ambulatorio o poliambulatorio", "Centro medico", "Studio o centro odontoiatrico", "Studio medico associato", "Centro diagnostico", "Centro analisi", "Centro prelievi", "Altro"].map(t => ({ v: t, t })) },
      { id: "prevAltro", tipo: "testo", obbl: true, largo: true, se: r => (residenziale(r) && r.prevRes === "Altro") || (ambulatoriale(r) && r.prevAmb === "Altro"), dom: "Descrivi struttura e attività" },
      { id: "ssn", tipo: "sino", obbl: true, dom: "È accreditata con il Servizio sanitario nazionale?" },
      { id: "fatturato", tipo: "euro", obbl: true, dom: "Fatturato dell'ultimo anno completo", aiuto: "Se è un gruppo con più sedi, il totale." },
      { id: "piuSedi", tipo: "sino", obbl: true, dom: "Ha più strutture o sedi operative?",
        figli: { quando: "si", campi: [{ id: "sediElenco", tipo: "nota", obbl: true, dom: "Per ogni sede: nome, indirizzo, P. IVA, tipo, fatturato" }] } },
      { id: "dipSanitari", tipo: "scelta", obbl: true, dom: "Dipendenti che esercitano una professione sanitaria", opzioni: [{ v: "20", t: "Fino a 20" }, { v: "50", t: "Da 21 a 50" }, { v: "oltre", t: "Oltre 50" }] },
      { id: "liberiProf", tipo: "scelta", obbl: true, dom: "Medici strutturati e liberi professionisti", opzioni: [{ v: "50", t: "Fino a 50" }, { v: "oltre", t: "Oltre 50" }] }
    ]},
    { id: "casaCura", titolo: "Casa di cura", sotto: "Dati principali: il resto è nella proposta completa da allegare.", se: r => san(r, "casacura"), campi: [
      { id: "ccPostiLetto", tipo: "testo", obbl: true, tastiera: "numeric", dom: "Posti letto" },
      { id: "ccOccupazione", tipo: "testo", tastiera: "numeric", dom: "Occupazione media dei posti letto (%)" },
      { id: "ccAree", tipo: "nota", obbl: true, dom: "Le 5 aree principali (chirurgia generale, ortopedia, cardiologia…) e la quota di fatturato di ciascuna" },
      { id: "ccSale", tipo: "testo", tastiera: "numeric", dom: "Sale operatorie" },
      { id: "ccInterventi", tipo: "testo", tastiera: "numeric", dom: "Interventi chirurgici nell'ultimo anno" },
      { id: "ccProntoSoccorso", tipo: "sino", obbl: true, dom: "Ha un pronto soccorso o un reparto di urgenza?" },
      { id: "ccPuntoNascita", tipo: "sino", obbl: true, dom: "Ha un punto nascita?",
        figli: { quando: "si", campi: [{ id: "ccParti", tipo: "testo", tastiera: "numeric", dom: "Parti nell'ultimo anno" }] } },
      { id: "ccRiskManager", tipo: "sino", obbl: true, dom: "C'è un risk manager a tempo pieno?" },
      { id: "ccUfficioSinistri", tipo: "sino", obbl: true, dom: "C'è un ufficio interno che gestisce i sinistri?" },
      { id: "ccCoperture", tipo: "nota", obbl: true, dom: "Coperture RC sanitaria degli ultimi 5 anni: compagnia, massimale, franchigia, premio" },
      { id: "ccSinistri", tipo: "nota", obbl: true, dom: "Sinistri degli ultimi 5 anni: numero, importi pagati e riservati" },
      { id: "ccProposta", tipo: "allegato", dom: "Proposta DUAL case di cura compilata",
        avvisoVuoto: () => ({ livello: "ambra", testo: "Senza la proposta completa la compagnia non quota: allegala appena il cliente la compila." }) }
    ]},
    { id: "dichiarazioniSan", titolo: "Dichiarazioni", sotto: "Finiscono in polizza: leggile al cliente.", se: standardSan, campi: [
      confSan("noRevoca", "Negli ultimi 10 anni la struttura non ha mai avuto la revoca dell'accreditamento al Servizio sanitario nazionale."),
      confSan("costituita12", "La struttura esiste da più di 12 mesi."),
      confSan("noVeterinaria", "Non è una struttura veterinaria."),
      confSan("noAumento30", "Il fatturato non è cresciuto più del 30% rispetto all'anno prima."),
      confSan("noCambiamenti", "Non sono previsti cambiamenti strutturali nei prossimi 24 mesi."),
      confSan("noFusioni", "Negli ultimi 5 anni non ci sono state fusioni, scissioni, acquisizioni o cessioni di ramo d'azienda."),
      confSan("nonSanitarie25", "Le attività non sanitarie (asilo, trasporto pazienti, mensa, bar e simili) non superano il 25% del fatturato."),
      confSan("assicurata3", "Negli ultimi 3 anni la struttura è stata assicurata per la RC sanitaria senza interruzioni."),
      { ...confSan("noRichieste", "Negli ultimi 5 anni non sono mai state avanzate richieste di risarcimento."), figli: { quando: "no", campi: DETTAGLIO_EVENTO.map(c => ({ ...c, id: "ric_" + c.id })) } },
      confSan("noRicoveroChir", "Non svolge prestazioni in ricovero di tipo chirurgico, anestesiologico o legate al parto."),
      confSan("noBariatrica", "Non svolge chirurgia bariatrica né camera iperbarica."),
      confSan("incidenze", "Sul fatturato, queste attività rispettano i limiti:", ["medicina o chirurgia estetica, diagnostica prenatale, trattamento delle dipendenze: non oltre il 30%", "procreazione medicalmente assistita, telemedicina: non oltre il 10%"]),
      { ...DOMANDA_ALTRA_POLIZZA, se: standardSan }
    ]},
    { id: "prestazioni", titolo: "Prestazioni", sotto: "Ultimo anno completo, tutte le sedi insieme. Lascia vuoto ciò che non fanno.", se: r => standardSan(r) && (ambulatoriale(r) || residenziale(r)), campi: [
      ...PRESTAZIONI_AMB.map(([k, t]) => ({ id: "prest_" + k, tipo: "testo", tastiera: "numeric", se: ambulatoriale, dom: t, corto: true })),
      ...POSTI_RES.map(([k, t]) => ({ id: "letti_" + k, tipo: "testo", tastiera: "numeric", se: residenziale, dom: "Posti letto: " + t.toLowerCase(), corto: true })),
      { id: "occupazione", tipo: "testo", tastiera: "numeric", se: residenziale, dom: "Occupazione media dei posti letto (%)" },
      { id: "noPostiSpeciali", tipo: "conferma", obbl: true, se: residenziale, avvisoNo: AVVISO_TAILOR, dom: "Non ha posti letto per:", elenco: ["pazienti disabili", "pazienti psichiatrici", "riabilitazione (lungodegenza)"] },
      { id: "covid", tipo: "conferma", obbl: true, se: residenziale, avvisoNo: AVVISO_TAILOR, dom: "Dal 2020 i casi di Covid-19 registrati non hanno superato 10 tra i dipendenti e 10 tra i pazienti." }
    ]},
    { id: "garanzieSan", titolo: "Garanzie", sotto: "Massimale, retroattività e franchigia.", campi: [
      { id: "massimaleSan", tipo: "scelta", verticale: true, obbl: true, dom: "Massimale",
        opzioni: [{ v: "1-3", t: "1 mln per sinistro, 3 mln all'anno", n: "minimo di legge per chi non esegue prestazioni da ambulatorio protetto, laboratori compresi" },
                  { v: "2-6", t: "2 mln per sinistro, 6 mln all'anno", n: "minimo di legge per strutture residenziali, odontoiatria, ambulatori protetti, sociosanitarie" },
                  { v: "altro", t: "Altro" }],
        figli: { quando: "altro", campi: [{ id: "massimaleSanAltro", tipo: "testo", obbl: true, dom: "Massimale desiderato (per sinistro e annuo)" }] } },
      { id: "retroattivita", tipo: "sino", obbl: true, dom: "Retroattività oltre i 10 anni previsti dalla legge Gelli?",
        figli: { quando: "si", campi: [{ id: "retroattivitaDal", tipo: "data", obbl: true, dom: "Dal" }] } },
      { id: "sir", tipo: "scelta", obbl: true, dom: "Franchigia a carico della struttura (SIR)",
        aiuto: "Parte di ogni danno che la struttura paga da sé: più è alta, più scende il premio.",
        opzioni: r => (san(r, "ambulatoriale") ? [{ v: "2500", t: "€ 2.500" }] : []).concat([5000, 10000, 25000, 50000].map(n => ({ v: String(n), t: euro(n) }))) },
      { id: "estetica", tipo: "sino", se: r => Number(r.prest_medEst) > 0 || Number(r.prest_chirEst) > 0, dom: "Estensione a medicina e chirurgia estetica" }
    ]},
    PASSO_CHIUSURA
  ]
};
