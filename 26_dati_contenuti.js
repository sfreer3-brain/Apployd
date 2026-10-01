/* =====================================================================
   CONTENUTI DI CONSULTAZIONE: Compliance e Guida dell'agenzia.
   BOZZA da validare con il responsabile compliance e con il backoffice:
   i testi sono schede di promemoria, non pareri.
   ===================================================================== */

const COMPLIANCE = [
  { titolo: "Prima di proporre un contratto", voci: [
    "Consegna il MUP (Modello Unico Precontrattuale) con le informazioni sull'intermediario, prima della sottoscrizione (Reg. IVASS 40/2018).",
    "Raccogli le esigenze del cliente e verifica che la proposta sia coerente con esse (demands & needs).",
    "Consegna il set informativo del prodotto: DIP, DIP aggiuntivo, condizioni di assicurazione (Reg. IVASS 41/2018).",
    "Fai firmare l'informativa privacy e i consensi; per i dati sanitari serve il consenso esplicito."
  ]},
  { titolo: "Prodotti vita e d'investimento (IBIP)", voci: [
    "Valutazione di adeguatezza con il questionario della compagnia, prima della proposta.",
    "Adeguata verifica antiriciclaggio del cliente e del titolare effettivo (D.Lgs. 231/2007).",
    "L'analisi patrimoniale dell'app è uno strumento orientativo: non sostituisce l'adeguatezza e non è una raccomandazione personalizzata."
  ]},
  { titolo: "Dati del cliente", voci: [
    "Le pratiche restano solo su questo dispositivo e si cancellano dopo l'invio o dopo 7 giorni.",
    "Non inoltrare le email della pratica a indirizzi diversi da quelli del backoffice.",
    "Documenti d'identità e dati sanitari: allegali solo alla pratica che li richiede."
  ]},
  { titolo: "Dopo la sottoscrizione", voci: [
    "Archivia proposta firmata, MUP, adeguatezza e privacy secondo le procedure dell'agenzia.",
    "Registra eventuali reclami nel registro reclami entro i tempi previsti."
  ]}
];

const GUIDA = [
  { titolo: "RC professionale (DUAL)", voci: [
    "Fatturato massimo per il modulo standard: 1 milione (tecnici, area economica), 500.000 (informatica, consulenza, ambiente e sicurezza), 200.000 (avvocati, agronomi, amministratori di condominio, mediatori creditizi, periti assicurativi), 100.000 (solo visto di conformità).",
    "Agenti immobiliari, società di revisione, enti di certificazione, OCC e organismi di mediazione vanno sempre su proposta completa: l'app chiede i dati in più.",
    "Un solo \"Non confermo\" nelle dichiarazioni porta alla proposta completa (tailor made).",
    "Architetti e ingegneri con fatturato oltre 100.000 €: massimale minimo 500.000 €.",
    "Commercialisti e avvocati: il fatturato da incarichi di sindaco, revisore o amministratore non deve superare il 35% del totale.",
    "Asseverazioni Superbonus, Ecobonus, Sismabonus: polizza dedicata, almeno 500.000 € per ogni professionista che assevera."
  ]},
  { titolo: "Altre RC per aziende ed enti", voci: [
    "D&O del singolo amministratore: fino a 3 società; revisori, sindaci e membri dell'OdV non sono assicurabili con questo prodotto.",
    "Dipendenti pubblici: con più incarichi conta quello di livello più alto; oltre 7 incarichi la compagnia valuta caso per caso.",
    "Strutture sanitarie: la legge Gelli fissa massimali minimi e 10 anni di retroattività; le case di cura con chirurgia richiedono la proposta completa."
  ]},
  { titolo: "Casa e Ufficio", voci: [
    "Il valore del fabbricato è quello di ricostruzione a nuovo, non quello di mercato.",
    "Case vuote o non utilizzate: molte compagnie limitano furto e acqua condotta.",
    "Ufficio in affitto: si assicura il contenuto e il rischio locativo, non il fabbricato."
  ]},
  { titolo: "Aziende: incendio, furto e catastrofali", voci: [
    "Una pratica per ogni ubicazione.",
    "Allega sempre planimetria e CPI o SCIA: senza, la compagnia dà un giudizio di carenza tecnica.",
    "Tetto in eternit, strutture combustibili, infiammabili nei reparti e impianti vetusti aggravano il rischio.",
    "Furto: verifica che fabbricato e serramenti rispettino lo standard richiesto, altrimenti descrivi le differenze."
  ]},
  { titolo: "Sinistri", voci: [
    "Denuncia entro 3 giorni da quando il cliente ne è venuto a conoscenza (art. 1913 c.c.).",
    "Furti e atti vandalici: senza denuncia alle autorità la compagnia non liquida.",
    "Il cliente non deve ammettere responsabilità né promettere risarcimenti.",
    "Prima di riparare, fotografa il danno e conserva le parti sostituite."
  ]}
];

/* Dati dell'agenzia mostrati nella Guida (il sito è pubblico: niente credenziali qui). */
const COORDINATE_AGENZIA = {
  intestatario: "Lloyd Varesino Srl",
  indirizzo: "Via Cavour 27, 21100 Varese (VA)",
  iban: "IT85U0840410801000000003944",
  bic: "ICRAITRRB80",
  banca: "Banca di Credito Cooperativo di Busto Garolfo e Buguggiate, filiale di Varese"
};

const DOC_POG = {
  titolo: "Presa visione della documentazione POG",
  testo: "Regolamento IVASS 45/2020: chi distribuisce i prodotti deve conoscere policy POG, target market e schede prodotto, procedure di vendita e aggiornamenti delle compagnie. Non si vendono prodotti fuori dal target market; per restringerlo serve una comunicazione scritta all'agenzia.",
  quando: ["all'ingresso in agenzia o all'inizio della collaborazione", "ogni 12 mesi", "entro 15 giorni dall'arrivo di un nuovo prodotto"],
  link: "https://cloud.lloydvaresino.it",
  accesso: "Si entra con le credenziali fornite dall'agenzia. Al primo accesso conviene reimpostare la password.",
  contatti: ["abianchi@lloydvaresino.it", "mcastoldi@lloydvaresino.it"],
  nota: "La presa visione non sostituisce la formazione obbligatoria sui prodotti."
};
