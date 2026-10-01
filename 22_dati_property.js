/* =====================================================================
   PROPERTY AZIENDE: Incendio, Eventi catastrofali, Furto e rapina.
   Accorpa tre moduli (Dati generali Mod. 2040 + Property Mod. 2095,
   Eventi catastrofali Mod. 2096, Scheda furto Mod. 2532).
   Le domande presenti in più moduli si chiedono una volta sola:
   ubicazione, fabbricato, anno di costruzione, sorveglianza e allarme,
   storia sinistri, altre polizze.
   Le sezioni compaiono solo per le garanzie scelte al passo "Garanzie".
   Usato da Commercio, Azienda e Industria: cambia qualche domanda.
   ===================================================================== */

const haG = (r, ...x) => (r.garanzie || []).some(v => x.includes(v));
const inc = r => haG(r, "incendio");
const rc = r => haG(r, "rc");
const gua = r => haG(r, "guasti");
const cat = r => haG(r, "terremoto", "alluvione");
const fur = r => haG(r, "furto");
const produttivo = r => r._prodotto === "industria" || r._prodotto === "azienda";

const ATTIVITA_TERZI = [
  { v: "posa", t: "Lavori o posa in opera presso i clienti" },
  { v: "installazione", t: "Installazione, montaggio o riparazione" },
  { v: "subappalto", t: "Cessione di lavori in subappalto" },
  { v: "movimentazione", t: "Carico, scarico o movimentazione di cose dei clienti" },
  { v: "fuoriLocali", t: "Vendita fuori dai locali (mercati, fiere, consegne)" },
  { v: "beniClienti", t: "Clienti che lasciano oggetti nei locali (guardaroba, riparazioni)" },
  { v: "lavanderia", t: "Lavanderia o tintoria" },
  { v: "veicoliClienti", t: "Veicoli o natanti di clienti in custodia o riparazione" },
  { v: "stazione", t: "Stazione di servizio o autolavaggio" },
  { v: "trasporto", t: "Trasporto di attrezzi o merci propri" }
];
const at = (r, x) => (r.attivitaTerzi || []).includes(x);
const ar = (r, ...x) => (r.altriRischi || []).some(v => x.includes(v));
const opz = (r, x) => (r.garOpz || []).includes(x);

/* Garanzie opzionali (dal DIP aggiuntivo): "sez" = quando è proponibile, "se" = quando la consigliamo */
const GARANZIE_OPZ = [
  { v: "gelo",        t: "Pacchetto incendio: gelo", g: "Incendio", sez: inc, se: r => r.riscaldamento && r.riscaldamento !== "assente" },
  { v: "elettrico",   t: "Fenomeno elettrico", g: "Incendio", sez: inc, se: r => true },
  { v: "refrig",      t: "Merci in refrigerazione", g: "Incendio", sez: inc, se: r => r.refrigerate === "si" },
  { v: "aumento",     t: "Merci in aumento", g: "Incendio", sez: inc, se: r => r.stagionali === "si" },
  { v: "veicoliRip",  t: "Veicoli / natanti in riparazione o manutenzione", g: "Incendio", sez: inc, se: r => at(r, "veicoliClienti") },
  { v: "lastre",      t: "Lastre e insegne in aumento", g: "Incendio", sez: inc, se: r => ar(r, "insegne") },
  { v: "arredo",      t: "Arredamento e giochi all'aperto", g: "Incendio", sez: inc, se: r => ar(r, "arredoAperto") },
  { v: "fotov",       t: "Pannelli solari / fotovoltaici", g: "Incendio", sez: r => inc(r) || cat(r), se: r => r.fotovoltaico && r.fotovoltaico !== "no" },
  { v: "atmFotov",    t: "Eventi atmosferici sui pannelli", g: "Incendio", sez: inc, se: r => r.fotovoltaico && r.fotovoltaico !== "no" },
  { v: "grandine",    t: "Grandine sui fragili in aumento", g: "Incendio", sez: inc, se: r => ar(r, "fragili") || r.lucernari === "molti" },
  { v: "bagnamento",  t: "Integrazione danni da bagnamento / allagamento", g: "Incendio", sez: inc, se: r => r.interrati === "si" || r.bancali === "no" },
  { v: "atmAperti",   t: "Eventi atmosferici a fabbricati aperti, tettoie, tende", g: "Incendio", sez: inc, se: r => ar(r, "aperti", "tettoie", "tende", "tenso") },
  { v: "stazioni",    t: "Furto: stazioni di servizio / autolavaggi", g: "Furto e rapina", sez: fur, se: r => at(r, "stazione") },
  { v: "furtoVeicoli",t: "Furto veicoli / natanti all'aperto", g: "Furto e rapina", sez: fur, se: r => r.veicoli === "si" || at(r, "veicoliClienti") },
  { v: "attrezzi",    t: "Furto di attrezzi e merci trasportate", g: "Furto e rapina", sez: fur, se: r => at(r, "trasporto") || at(r, "posa") },
  { v: "lavoriTerzi", t: "Lavori presso terzi", g: "Responsabilità civile", sez: rc, se: r => at(r, "posa") || at(r, "installazione") },
  { v: "postuma",     t: "RC postuma (installazione, montaggio, riparazione)", g: "Responsabilità civile", sez: rc, se: r => at(r, "installazione") },
  { v: "A900",        t: "Subappalto senza limiti", rif: "AXA A900", g: "Responsabilità civile", sez: rc, se: r => at(r, "subappalto") },
  { v: "E707",        t: "Danni a cose di terzi movimentate", rif: "AXA E707", g: "Responsabilità civile", sez: rc, se: r => at(r, "movimentazione") },
  { v: "E708",        t: "Smercio fuori dai locali", rif: "AXA E708", g: "Responsabilità civile", sez: rc, se: r => at(r, "fuoriLocali") },
  { v: "E444",        t: "Cose portate dai clienti", rif: "AXA E444", g: "Responsabilità civile", sez: rc, se: r => at(r, "beniClienti") },
  { v: "E445",        t: "Cose consegnate dai clienti – lavanderie", rif: "AXA E445", g: "Responsabilità civile", sez: rc, se: r => at(r, "lavanderia") }
];

QUESTIONARI.property = {
  titolo: "Incendio, furto e catastrofali",
  passi: [
    PASSO_CLIENTE,

    { id: "azienda", titolo: "Azienda", sotto: "Chi è e cosa fa l'impresa.", campi: [
      { id: "attivita", tipo: "nota", obbl: true, dom: r => r._prodotto === "commercio" ? "Attività svolta e merci trattate" : "Attività svolta e fasi di lavorazione",
        aiuto: r => r._prodotto === "commercio" ? "Cosa vende, se ha magazzino, se fa consegne." : "Materie prime, semilavorati, prodotto finito; trattamenti termici, verniciatura, lavorazioni presso terzi." },
      { id: "ateco", tipo: "testo", dom: "Codice ATECO" },
      { id: "annoCost", tipo: "testo", obbl: true, tastiera: "numeric", dom: "Anno di costituzione" },
      { id: "addetti", tipo: "testo", obbl: true, tastiera: "numeric", dom: "Numero di addetti" },
      { id: "fatturato", tipo: "euro", obbl: true, dom: "Fatturato dell'ultimo esercizio" },
      { id: "retribuzioni", tipo: "euro", se: r => produttivo(r) || rc(r), obbl: false, dom: "Retribuzioni dell'ultimo esercizio", aiuto: "Serve alla compagnia per calcolare la RCO." },
      { id: "turni", tipo: "scelta", se: produttivo, dom: "Turni di lavoro", opzioni: [{ v: "1", t: "1 turno" }, { v: "2", t: "2 turni" }, { v: "3", t: "3 turni / ciclo continuo" }] },
      { id: "controllata", tipo: "sino", obbl: true, dom: "L'impresa è controllata da un'altra società o ente?",
        figli: { quando: "si", campi: [{ id: "controllante", tipo: "testo", obbl: true, largo: true, dom: "Denominazione, paese e % di capitale del controllante" }] } },
      { id: "controlla", tipo: "sino", obbl: true, dom: "L'impresa controlla altre società?",
        figli: { quando: "si", campi: [{ id: "controllate", tipo: "nota", obbl: true, dom: "Elenco controllate: denominazione, attività, paese, % capitale" }] } },
      { id: "estero", tipo: "sino", obbl: true, dom: "Lavora per clienti fuori dall'Italia?",
        figli: { quando: "si", campi: [{ id: "esteroDesc", tipo: "nota", obbl: true, dom: "Quali paesi e che attività" }] } },
      { id: "noSanzioni", tipo: "conferma", obbl: true,
        dom: "L'impresa non ha rapporti commerciali con soggetti di paesi soggetti a embargo o sanzioni internazionali (ONU, UE, Regno Unito, USA).",
        avvisoNo: { livello: "rosso", testo: "Rapporti con paesi sotto sanzione: la compagnia potrebbe non assumere il rischio. Descrivi i rapporti nelle note." } }
    ]},

    { id: "garanzie", titolo: "Garanzie e somme", sotto: "Cosa assicurare e per quanto.", campi: [
      { id: "garanzie", tipo: "multipla", obbl: true, dom: "Garanzie richieste",
        opzioni: [{ v: "incendio", t: "Incendio" }, { v: "terremoto", t: "Terremoto" }, { v: "alluvione", t: "Inondazione e alluvione" }, { v: "terrorismo", t: "Atti di terrorismo" },
                  { v: "indiretti", t: "Danni indiretti (fermo attività)" }, { v: "furto", t: "Furto e rapina" }, { v: "guasti", t: "Guasti macchine" },
                  { v: "informatica", t: "Assistenza informatica" }, { v: "rc", t: "Responsabilità civile" }, { v: "tutela", t: "Tutela legale" }],
        aiuto: "Le domande dei passi successivi compaiono solo per le sezioni scelte." },
      { id: "titoloFabb", tipo: "scelta", obbl: true, dom: "Il fabbricato è", opzioni: [{ v: "proprieta", t: "Di proprietà" }, { v: "affitto", t: "In affitto" }] },
      { id: "sFabbricato", tipo: "euro", obbl: true, se: r => r.titoloFabb === "proprieta" && (inc(r) || cat(r)), dom: "Fabbricato", aiuto: "Valore di ricostruzione a nuovo." },
      { id: "sLocativo", tipo: "euro", se: r => r.titoloFabb === "affitto" && inc(r), dom: "Rischio locativo", aiuto: "Danni al fabbricato di cui l'impresa risponde verso il proprietario." },
      { id: "sMacchinari", tipo: "euro", obbl: true, se: r => inc(r) || cat(r) || fur(r), dom: "Macchinari, attrezzature, arredamento" },
      { id: "sMerci", tipo: "euro", se: r => inc(r) || cat(r) || fur(r), dom: "Merci" },
      { id: "sMaggiori", tipo: "euro", se: inc, dom: "Maggiori spese" },
      { id: "sRicorso", tipo: "euro", se: inc, dom: "Ricorso terzi" },
      { id: "sDemolizione", tipo: "euro", se: inc, dom: "Demolizione e sgombero" },
      { id: "sFurto", tipo: "euro", obbl: true, se: fur, dom: "Furto: somma assicurata sul contenuto",
        aiuto: "A primo rischio assoluto: il valore massimo che realisticamente può essere rubato in un colpo, non il valore di tutto il contenuto." },
      { id: "furtoFormula", tipo: "scelta", se: fur, dom: "Formula furto", opzioni: [{ v: "completa", t: "Contenuto completo" }, { v: "limitata", t: "Contenuto furto – formula limitata (con sconto)" }] },
      { id: "sValori", tipo: "euro", se: fur, dom: "Denaro e valori (furto e rapina)" },
      { id: "indirettiForma", tipo: "scelta", obbl: true, se: r => haG(r, "indiretti"), dom: "Danni indiretti: forma", opzioni: [{ v: "percentuale", t: "Percentuale sull'indennizzo" }, { v: "diaria", t: "Diaria giornaliera" }],
        figli: { quando: v => !!v, campi: [{ id: "indirettiValore", tipo: "testo", obbl: true, dom: r => r.indirettiForma === "diaria" ? "Diaria richiesta (€ al giorno)" : "Percentuale richiesta (%)" }] } },
      { id: "sGuasti", tipo: "euro", obbl: true, se: gua, dom: "Guasti macchine: valore dei macchinari da assicurare" },
      { id: "sInformatica", tipo: "euro", obbl: true, se: r => haG(r, "informatica"), dom: "Assistenza informatica: valore delle apparecchiature elettroniche" },
      { id: "massimaleRC", tipo: "scelta", obbl: true, se: rc, dom: "Responsabilità civile: massimale", opzioni: [{ v: "1", t: "1 milione" }, { v: "3", t: "3 milioni" }, { v: "5", t: "5 milioni" }] },
      { id: "rco", tipo: "sino", obbl: true, se: rc, dom: "Anche RC verso i dipendenti (RCO)?",
        avvisoSe: (v, r) => v === "no" && Number(r.addetti) > 0 ? { livello: "ambra", testo: "L'impresa ha addetti ma non chiede la RCO: verificare con il cliente." } : null },
      DOMANDA_ALTRA_POLIZZA
    ]},

    { id: "ubicazione", titolo: "Ubicazione e fabbricato", sotto: "Una pratica per ogni ubicazione.", campi: [
      { id: "piuUbicazioni", tipo: "sino", obbl: true, dom: "L'impresa lavora in più ubicazioni?",
        avvisoSe: v => v === "si" ? { livello: "blu", testo: "Le compagnie vogliono un questionario per ogni ubicazione: finita questa pratica, aprine una per ciascuna delle altre." } : null },
      { id: "ubStessoIndirizzo", tipo: "sino", obbl: true, dom: "Il rischio è all'indirizzo della sede?" },
      { id: "ubIndirizzo", tipo: "testo", obbl: true, largo: true, se: r => r.ubStessoIndirizzo === "no", dom: "Indirizzo del rischio" },
      { id: "zona", tipo: "scelta", obbl: true, dom: "Zona", opzioni: [{ v: "centro", t: "Urbana centrale" }, { v: "periferia", t: "Periferica" }, { v: "industriale", t: "Zona industriale" }, { v: "isolata", t: "Isolata" }, { v: "degrado", t: "Zona degradata" }] },
      { id: "configurazione", tipo: "scelta", verticale: true, obbl: true, dom: "Com'è fatto l'insediamento",
        opzioni: [{ v: "unico", t: "Un unico fabbricato, tutto dell'impresa" }, { v: "separati", t: "Più fabbricati separati dell'impresa" }, { v: "separatiUffici", t: "Fabbricati separati più palazzina uffici" }, { v: "condiviso", t: "Locali in un fabbricato con altre attività" }] },
      { id: "annoFabb", tipo: "testo", obbl: true, tastiera: "numeric", dom: "Anno di costruzione del fabbricato" },
      { id: "supTot", tipo: "testo", tastiera: "numeric", se: r => inc(r) || cat(r), dom: "Superficie totale (mq)" },
      { id: "supCoperta", tipo: "testo", obbl: true, tastiera: "numeric", dom: "Superficie coperta (mq)" },
      { id: "piani", tipo: "scelta", obbl: true, dom: "Piani fuori terra", opzioni: [{ v: "1-3", t: "Da 1 a 3" }, { v: "4-7", t: "Da 4 a 7" }, { v: "8-14", t: "Da 8 a 14" }, { v: "15+", t: "15 o più" }] },
      { id: "interrati", tipo: "sino", obbl: true, dom: "Ci sono piani interrati o seminterrati?",
        figli: { quando: "si", campi: [{ id: "interratiUso", tipo: "testo", obbl: true, largo: true, dom: "A cosa servono e che merci contengono" }] } },
      { id: "struttura", tipo: "scelta", verticale: true, obbl: true, se: r => inc(r) || cat(r), dom: "Strutture portanti",
        opzioni: [{ v: "ca", t: "Cemento armato" }, { v: "laterizi", t: "Laterizi / muratura" }, { v: "metallo", t: "Metallo" }, { v: "legno", t: "Legno lamellare" }, { v: "sandwich", t: "Pannelli sandwich" }, { v: "combustibili", t: "Altri materiali combustibili" }],
        avvisoSe: v => v === "combustibili" ? { livello: "ambra", testo: "Strutture combustibili: rischio incendio aggravato, la compagnia potrebbe chiedere un sopralluogo." } : null },
      { id: "antisismico", tipo: "sino", se: r => haG(r, "terremoto"), dom: "Il fabbricato è antisismico?",
        avvisoSe: v => v === "si" ? { livello: "blu", testo: "Allega il certificato antisismico all'ultimo passo." } : null },
      { id: "tetto", tipo: "scelta", obbl: true, se: inc, dom: "Copertura del tetto",
        opzioni: [{ v: "guaina", t: "Guaina bituminosa" }, { v: "tegole", t: "Lamiera o tegole" }, { v: "fibrocemento", t: "Fibrocemento" }, { v: "sandwich", t: "Pannelli sandwich" }, { v: "eternit", t: "Eternit" }],
        avvisoSe: v => v === "eternit" ? { livello: "ambra", testo: "Copertura in eternit (amianto): segnalalo, molte compagnie escludono o limitano i danni al tetto." } : null },
      { id: "coibentazioni", tipo: "sino", se: inc, dom: "Ci sono molte coibentazioni in plastica espansa (pareti, tetto, controsoffitti)?" },
      { id: "lucernari", tipo: "scelta", se: inc, dom: "Lucernari", opzioni: [{ v: "assenti", t: "Assenti" }, { v: "pochi", t: "Fino al 10% del tetto" }, { v: "molti", t: "Oltre il 10% del tetto" }] },
      { id: "fabbTipo", tipo: "sino", obbl: true, se: fur, dom: "Pareti e tetto sono in muratura, cemento, pannelli sandwich o vetro antisfondamento, con gronda sopra i 4 metri?",
        aiuto: "È il «fabbricato tipo» richiesto dalla garanzia furto.",
        figli: { quando: "no", campi: [{ id: "fabbTipoDiff", tipo: "nota", obbl: true, dom: "Descrivi le differenze (es. gronda a 3,80 m, pareti in legno)" }] } },
      { id: "abitaVicino", tipo: "sino", se: fur, dom: "Il titolare abita sopra o accanto ai locali?" },
      { id: "fotovoltaico", tipo: "scelta", obbl: true, se: r => inc(r) || cat(r), dom: "Ci sono pannelli solari o fotovoltaici?",
        opzioni: [{ v: "no", t: "No" }, { v: "tetto", t: "Sì, sul tetto" }, { v: "terra", t: "Sì, a terra" }] }
    ]},

    { id: "rischio", titolo: "Rischio incendio", sotto: "Lavorazioni, impianti e merci.", campi: [
      { id: "infiammabili", tipo: "scelta", obbl: true, dom: "Infiammabili", opzioni: [{ v: "assenti", t: "Assenti" }, { v: "meno500", t: "Meno di 500 kg" }, { v: "piu500", t: "Oltre 500 kg" }],
        figli: { quando: v => v && v !== "assenti", campi: [
          { id: "infiammabiliDove", tipo: "scelta", obbl: true, dom: "Dove sono tenuti", opzioni: [{ v: "esterno", t: "Deposito a più di 20 m" }, { v: "dedicato", t: "Locale dedicato" }, { v: "reparti", t: "Nei reparti" }],
            avvisoSe: v => v === "reparti" ? { livello: "ambra", testo: "Infiammabili nei reparti: aggravamento del rischio." } : null } ] } },
      { id: "caldo", tipo: "sino", obbl: true, se: produttivo, dom: "Ci sono lavorazioni a caldo (forni, cotture, saldature)?",
        figli: { quando: "si", campi: [{ id: "caldoDesc", tipo: "testo", obbl: true, largo: true, dom: "Quali" }] } },
      { id: "impElettrici", tipo: "scelta", obbl: true, dom: "Impianti elettrici", opzioni: [{ v: "nuovi", t: "Nuovi o certificati di recente" }, { v: "buoni", t: "Buone condizioni" }, { v: "vetusti", t: "Mediocri o vecchi" }],
        avvisoSe: v => v === "vetusti" ? { livello: "ambra", testo: "Impianti vetusti: probabile richiesta di adeguamento." } : null },
      { id: "riscaldamento", tipo: "scelta", dom: "Alimentazione impianti termici", opzioni: [{ v: "assente", t: "Assente" }, { v: "metano", t: "Metano" }, { v: "gasolio", t: "Gasolio / GPL" }, { v: "biomassa", t: "Truciolo / biomassa" }, { v: "altro", t: "Olio denso / altro" }] },
      { id: "muletti", tipo: "scelta", se: produttivo, dom: "Muletti", opzioni: [{ v: "assenti", t: "Assenti" }, { v: "gasolio", t: "A gasolio / GPL" }, { v: "elettriciDedicato", t: "Elettrici, ricarica in locale dedicato" }, { v: "elettriciReparto", t: "Elettrici, ricarica nei reparti" }] },
      { id: "impilamento", tipo: "scelta", se: produttivo, dom: "Altezza di impilamento merci", opzioni: [{ v: "<4", t: "Meno di 4 m" }, { v: "4-6", t: "Tra 4 e 6 m" }, { v: ">6", t: "Oltre 6 m" }] },
      { id: "imballaggi", tipo: "scelta", dom: "Imballaggi", opzioni: [{ v: "no", t: "Assenti o incombustibili" }, { v: "cartone", t: "Combustibili (cartone)" }, { v: "plastica", t: "Anche plastica espansa" }] },
      { id: "altriRischi", tipo: "multipla", dom: "Sono presenti (lascia vuoto se niente)",
        opzioni: [{ v: "aperti", t: "Fabbricati aperti su uno o più lati" }, { v: "tettoie", t: "Tettoie" }, { v: "tende", t: "Tende all'aperto" }, { v: "tenso", t: "Tensostrutture" },
                  { v: "aperto", t: "Macchinari all'aperto (silos, impianti)" }, { v: "fragili", t: "Vetrate, lucernari o altri elementi fragili" },
                  { v: "insegne", t: "Insegne e lastre di vetro grandi" }, { v: "arredoAperto", t: "Arredi o giochi all'aperto (dehors, giardino)" }] },
      { id: "refrigerate", tipo: "sino", obbl: true, dom: "Ci sono merci in celle frigorifere o banchi refrigerati?" },
      { id: "stagionali", tipo: "sino", obbl: true, dom: "Le merci aumentano molto in alcuni periodi dell'anno?",
        figli: { quando: "si", campi: [{ id: "stagionaliPeriodo", tipo: "testo", obbl: true, dom: "In quali mesi" }] } },
      { id: "vicinanze", tipo: "multipla", dom: "Nelle vicinanze", opzioni: [{ v: "pericolose", t: "Aziende con attività pericolose" }, { v: "tralicci", t: "Linee elettriche / tralicci" }, { v: "infrastrutture", t: "Autostrade, ferrovie, aeroporti (< 10 km)" }] }
    ]},

    { id: "protezioni", titolo: "Protezioni", sotto: "Antincendio, sorveglianza e antifurto.", campi: [
      { id: "estintori", tipo: "sino", obbl: true, se: inc, dom: "Estintori segnalati e con manutenzione regolare?" },
      { id: "idranti", tipo: "scelta", se: inc, dom: "Rete idranti", opzioni: [{ v: "assenti", t: "Assenti" }, { v: "esterni", t: "Esterni" }, { v: "interni", t: "Interni" }, { v: "anello", t: "Ad anello" }] },
      { id: "rilevazione", tipo: "scelta", se: inc, dom: "Rilevazione automatica incendi", opzioni: [{ v: "assente", t: "Assente" }, { v: "sirena", t: "Con allarme sonoro" }, { v: "remota", t: "Segnalata a vigilanza o titolare" }] },
      { id: "sprinkler", tipo: "scelta", se: inc, dom: "Spegnimento automatico", opzioni: [{ v: "assente", t: "Assente" }, { v: "locale", t: "Su alcuni macchinari" }, { v: "sprinkler", t: "Sprinkler in reparti o depositi" }] },
      { id: "cpi", tipo: "scelta", verticale: true, obbl: true, se: inc, dom: "Prevenzione incendi (CPI / SCIA)",
        opzioni: [{ v: "ok", t: "In possesso di SCIA, CPI o rinnovo" }, { v: "nonSoggetta", t: "Attività non soggetta" }, { v: "mancante", t: "Soggetta ma senza certificazione" }],
        avvisoSe: v => v === "mancante" ? { livello: "rosso", testo: "Attività soggetta senza CPI/SCIA: la compagnia può rifiutare il rischio." } : null },
      { id: "vvf", tipo: "testo", tastiera: "numeric", se: inc, dom: "Distanza dai Vigili del Fuoco (km)" },
      { id: "conduzione", tipo: "multipla", se: inc, dom: "Organizzazione",
        opzioni: [{ v: "dvr", t: "Piano sicurezza D.Lgs. 81/2008" }, { v: "rspp", t: "RSPP" }, { v: "formazione", t: "Formazione periodica" }, { v: "squadra", t: "Squadra antincendio" }, { v: "ordine", t: "Buon ordine e pulizia" }, { v: "iso", t: "Certificazioni ISO" }] },
      { id: "recinzione", se: r => inc(r) || fur(r), tipo: "scelta", obbl: true, dom: "Recinzione", opzioni: [{ v: "totale", t: "Totale" }, { v: "parziale", t: "Parziale" }, { v: "assente", t: "Assente" }] },
      { id: "allarme", se: r => inc(r) || fur(r), tipo: "sino", obbl: true, dom: "C'è un impianto di allarme antintrusione?",
        figli: { quando: "si", campi: [
          { id: "allarmeColl", tipo: "scelta", obbl: true, dom: "L'allarme avvisa", opzioni: [{ v: "sirena", t: "Solo sirena" }, { v: "titolare", t: "Il titolare" }, { v: "vigilanza", t: "Vigilanza presidiata 24 ore" }] },
          { id: "allarmeCaratt", tipo: "multipla", se: fur, dom: "Caratteristiche dell'impianto",
            opzioni: [{ v: "autoprotetto", t: "Centralina autoprotetta" }, { v: "volumetrici", t: "Volumetrici senza zone d'ombra" }, { v: "perimetrali", t: "Perimetrali sotto i 4 m" }, { v: "vetri", t: "Sensori sui vetri" }, { v: "registro", t: "Registra gli eventi" }, { v: "bidirezionale", t: "Trasmissione bidirezionale" }, { v: "imq", t: "Installatore IMQ" }, { v: "collaudo", t: "Certificato di collaudo" }, { v: "manutenzione", t: "Manutenzione semestrale" }, { v: "antirapina", t: "Antirapina" }] } ] } },
      { id: "video", se: r => inc(r) || fur(r), tipo: "sino", obbl: true, dom: "C'è videosorveglianza?",
        figli: { quando: "si", campi: [{ id: "videoCaratt", tipo: "multipla", dom: "Videosorveglianza", opzioni: [{ v: "registra", t: "Registra 24 ore su 24" }, { v: "collegata", t: "Collegata a vigilanza o titolare" }] }] } },
      { id: "vigilanza", se: r => inc(r) || fur(r), tipo: "sino", obbl: true, dom: "C'è un servizio di vigilanza (ronde)?",
        figli: { quando: "si", campi: [{ id: "vigilanzaDesc", tipo: "testo", largo: true, dom: "Istituto e frequenza delle ronde (ore tra un passaggio e l'altro)" }] } },
      { id: "custode", se: r => inc(r) || fur(r), tipo: "sino", obbl: true, dom: "C'è un custode che abita nell'insediamento?" },
      { id: "chiusure", tipo: "scelta", verticale: true, obbl: true, se: fur, dom: "Porte e finestre sotto i 4 metri",
        opzioni: [{ v: "rafforzati", t: "Rafforzati", n: "serramenti pieni con serrature di sicurezza o inferriate da 15 mm" }, { v: "standard", t: "Standard", n: "serramenti robusti chiusi dall'interno o inferriate" }, { v: "inferiori", t: "Inferiori allo standard" }],
        figli: { quando: "inferiori", campi: [{ id: "chiusureDesc", tipo: "nota", obbl: true, dom: "Descrivi i punti deboli" }] } },
      { id: "presenza", tipo: "testo", se: fur, largo: true, dom: "Orari di presenza del personale e giorni lavorativi" },
      { id: "custodia", tipo: "sino", se: fur, dom: "Ci sono casseforti, armadi o porte corazzate?",
        figli: { quando: "si", campi: [{ id: "custodiaDesc", tipo: "nota", obbl: true, dom: "Per ciascuno: tipo, grado di resistenza (EN 1143-1 / EN 14450), contenuto e valore" }] } },
      { id: "rischioParticolare", tipo: "scelta", se: fur, dom: "L'attività rientra tra i rischi particolari?",
        opzioni: [{ v: "no", t: "No" }, { v: "gioielleria", t: "Gioielleria / orefice" }, { v: "pellicceria", t: "Pellicceria" }, { v: "portavalori", t: "Trasporto valori" }],
        avvisoSe: v => v && v !== "no" ? { livello: "ambra", testo: "Rischio particolare: serve la valutazione della direzione della compagnia." } : null },
      { id: "veicoli", tipo: "sino", se: fur, dom: "Ci sono abitualmente veicoli nei locali o nell'area?",
        figli: { quando: "si", campi: [{ id: "veicoliAntifurto", tipo: "sino", dom: "Hanno l'antifurto?" }] } }
    ]},

    { id: "terzi", titolo: "Attività e clienti", sotto: "Serve a capire quali estensioni proporre.", se: r => rc(r) || fur(r), campi: [
      { id: "attivitaTerzi", tipo: "multipla", dom: "L'attività prevede (barra quello che fa l'impresa)", opzioni: ATTIVITA_TERZI }
    ]},

    { id: "catastrofali", titolo: "Eventi catastrofali", sotto: "Terremoto e alluvione.", campi: [
      { id: "destinazione", tipo: "scelta", obbl: true, dom: "Uso prevalente", opzioni: [{ v: "produzione", t: "Produzione" }, { v: "commercio", t: "Commercio / deposito" }, { v: "residenziale", t: "Residenziale" }] },
      { id: "acqua2km", tipo: "sino", obbl: true, se: r => haG(r, "alluvione"), dom: "Ci sono fiumi, torrenti, canali, laghi o mare entro 2 km?",
        figli: { quando: "si", campi: [{ id: "acquaDesc", tipo: "nota", obbl: true, dom: "Nome, distanza e, se noto, dislivello tra alveo e insediamento" }] } },
      { id: "bancali", tipo: "sino", se: r => haG(r, "alluvione") && Number(r.sMerci) > 0, dom: "Le merci stanno su bancali ad almeno 10 cm da terra?" },
      { id: "eventi10", tipo: "multipla", dom: "Negli ultimi 10 anni ci sono stati", opzioni: [
        { v: "terrAz", t: "Terremoti che hanno colpito l'azienda" }, { v: "terrZona", t: "Terremoti in zona" },
        { v: "allAz", t: "Alluvioni che hanno colpito l'azienda" }, { v: "allZona", t: "Alluvioni in zona" }] }
    ]},

    { id: "aggiuntive", titolo: "Garanzie aggiuntive", sotto: "Spuntate in automatico in base alle risposte: controlla e correggi.", campi: [
      { id: "garOpz", tipo: "multipla", dom: "Garanzie e partite da quotare", se: r => GARANZIE_OPZ.some(g => g.sez(r)),
        opzioni: r => GARANZIE_OPZ.filter(g => g.sez(r)),
        suggerito: r => GARANZIE_OPZ.filter(g => g.sez(r) && g.se(r)).map(g => g.v),
        aiuto: "Le voci con l'etichetta «consigliata» derivano da quello che hai risposto; puoi togliere o aggiungere.",
        avvisoSe: (v, r) => fur(r) && (r.chiusure === "rafforzati" || r.allarme === "si")
          ? { livello: "blu", testo: "Sconti furto applicabili: " + [r.chiusure === "rafforzati" ? "mezzi di chiusura rafforzati" : "", r.allarme === "si" ? "impianto d'allarme" : "", r.furtoFormula === "limitata" ? "formula limitata" : ""].filter(Boolean).join(", ") + "." } : null },
      { id: "vFotov", tipo: "euro", obbl: true, se: r => opz(r, "fotov"), dom: "Valore dei pannelli solari / fotovoltaici" },
      { id: "vRefrig", tipo: "euro", obbl: true, se: r => opz(r, "refrig"), dom: "Valore delle merci in refrigerazione" },
      { id: "vAumento", tipo: "euro", obbl: true, se: r => opz(r, "aumento"), dom: "Merci in aumento: importo in più nel periodo di picco" },
      { id: "vLastre", tipo: "euro", se: r => opz(r, "lastre"), dom: "Lastre e insegne: valore" },
      { id: "vArredo", tipo: "euro", se: r => opz(r, "arredo"), dom: "Arredi e giochi all'aperto: valore" },
      { id: "vVeicoli", tipo: "euro", se: r => opz(r, "veicoliRip"), dom: "Veicoli / natanti di clienti presenti al massimo: valore" },
      { id: "vAttrezzi", tipo: "euro", se: r => opz(r, "attrezzi"), dom: "Attrezzi e merci trasportati: valore" }
    ]},

    { id: "storia", titolo: "Precedenti", sotto: "Sinistri e situazione dell'impresa.", campi: [
      { id: "sinistri5", tipo: "sino", obbl: true, dom: "Sinistri negli ultimi 5 anni (incendio, furto, eventi naturali)?",
        figli: { quando: "si", campi: [
          { id: "sinistri5Desc", tipo: "nota", obbl: true, dom: "Per ciascuno: data, tipo di evento, importo pagato o riservato" },
          { id: "migliorie", tipo: "nota", dom: "Migliorie fatte dopo i sinistri (il semplice ripristino non conta)" } ] } },
      { id: "stornate", tipo: "sino", se: fur, dom: "Ha avuto polizze furto disdette da una compagnia dopo un sinistro?",
        avvisoSe: v => v === "si" ? { livello: "ambra", testo: "Precedente disdetta per sinistro: la compagnia lo valuterà." } : null },
      { id: "procedure", tipo: "scelta", obbl: true, dom: "Procedure concorsuali", opzioni: [{ v: "no", t: "Nessuna" }, { v: "concordato", t: "Concordato preventivo" }, { v: "amministrazione", t: "Amministrazione controllata" }, { v: "lca", t: "Liquidazione coatta" }],
        avvisoSe: v => v && v !== "no" ? { livello: "rosso", testo: "Impresa in procedura concorsuale: rischio difficilmente assumibile." } : null },
      { id: "cig", tipo: "scelta", dom: "Cassa integrazione", opzioni: [{ v: "no", t: "Mai" }, { v: "passato", t: "In passato" }, { v: "corso", t: "In corso" }, { v: "previsione", t: "In previsione" }] },
      { id: "segnalato", tipo: "sino", dom: "È stato segnalato da un altro cliente dell'agenzia?" }
    ]},

    PASSO_CHIUSURA
  ]
};

/* Il passo "Rischio incendio" serve solo se c'è la garanzia incendio; "Eventi catastrofali" solo con terremoto o alluvione */
QUESTIONARI.property.passi.find(p => p.id === "rischio").se = inc;
QUESTIONARI.property.passi.find(p => p.id === "catastrofali").se = cat;
DOC_UTILI.commercio = DOC_UTILI.azienda = DOC_UTILI.industria =
  "Planimetria, CPI o SCIA, certificazioni degli impianti, certificato antisismico, polizza in corso, visura camerale";
GARANZIE_OPZ.forEach(g => { g.comp = g.comp || ["AXA"]; });   /* ricavate dal DIP aggiuntivo AXA: da estendere con le altre compagnie */
