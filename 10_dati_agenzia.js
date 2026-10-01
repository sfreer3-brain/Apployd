/* =====================================================================
   DATI DELL'AGENZIA: rami, destinatari, impostazioni generali.
   Per aggiungere un ramo o cambiare un indirizzo si modifica solo qui.
   ===================================================================== */

const AGENZIA = {
  nome: "Lloyd Varesino",
  app: "Bussola",
  versione: "{{VERSIONE}}",       // scritta da ricomponi.py (file VERSIONE)
  dataBuild: "{{DATA_BUILD}}",
  giorniConservazioneBozze: 7   // le bozze non inviate si cancellano da sole dopo N giorni
};

/* Gruppi di destinatari. "modo":
   - "scegli": il commerciale sceglie uno dei nomi (l'app propone quello a rotazione)
   - "tutti":  la pratica va a tutti gli indirizzi                                    */
/* Logo per il PDF (JPEG, inserito in fase di composizione) */
const LOGO_JPG = null /*{{LOGO_JPG}}*/;

const DESTINATARI = {
  danni:    { modo: "scegli", indirizzi: ["gscopacasa@lloydvaresino.it", "ctominovi@lloydvaresino.it", "bdelgrande@lloydvaresino.it"] },
  auto:     { modo: "scegli", indirizzi: ["sbreglia@lloydvaresino.it", "apalmieri@lloydvaresino.it", "sbellini@lloydvaresino.it"] },
  vita:     { modo: "tutti",  indirizzi: ["mcastoldi@lloydvaresino.it"] },
  sinistri: { modo: "tutti",  indirizzi: ["pzanzi@lloydvaresino.it"] }
};

/* Albero dei preventivi. Ogni nodo può avere "figli" oppure un "questionario".
   "invio" (gruppo di destinatari) si eredita dal nodo padre se non indicato.
   questionario: null = prodotto non ancora disponibile.                                */
const ALBERO = [
  { id: "pf", nome: "Persona fisica", nota: "Privati e famiglie", figli: [
    { id: "pf-auto", nome: "Auto", invio: "auto", questionario: null },
    { id: "pf-re", nome: "Rami elementari", nota: "Casa, persona, animali, viaggi", invio: "danni", figli: [
      { id: "casa",      nome: "Casa", questionario: "casa" },
      { id: "pf-inf",    nome: "Infortuni", questionario: null },
      { id: "salute",    nome: "Salute", questionario: null },
      { id: "tcm",       nome: "Caso morte", questionario: null },
      { id: "pet",       nome: "Pet", nota: "Cani e gatti", questionario: null },
      { id: "viaggio",   nome: "Viaggio", questionario: null } ] },
    { id: "pf-vita", nome: "Vita investimento", invio: "vita", figli: [
      { id: "pac",       nome: "Piano di accumulo", nota: "Con analisi patrimoniale", questionario: "vita" },
      { id: "fpens",     nome: "Fondo pensione", nota: "Con analisi patrimoniale", questionario: "vita" } ] } ] },
  { id: "az", nome: "Azienda", nota: "Imprese, professionisti, enti", figli: [
    { id: "az-auto", nome: "Auto", nota: "Veicoli aziendali e flotte", invio: "auto", questionario: null },
    { id: "az-re", nome: "Rami elementari", nota: "Patrimonio, cantieri, persone, cyber", invio: "danni", figli: [
      { id: "commercio", nome: "Commercio", nota: "Incendio, furto, catastrofali", questionario: "property" },
      { id: "azienda",   nome: "Azienda", nota: "Incendio, furto, catastrofali", questionario: "property" },
      { id: "industria", nome: "Industria", nota: "Incendio, furto, catastrofali", questionario: "property" },
      { id: "edile",     nome: "Impresa edile", nota: "RC, CAR, postuma", figli: [
        { id: "edile-rc",  nome: "RC", nota: "Responsabilità civile verso terzi e prestatori", questionario: null },
        { id: "car",       nome: "CAR", nota: "Tutti i rischi del cantiere", questionario: null },
        { id: "postuma",   nome: "Postuma", nota: "Decennale postuma", questionario: null } ] },
      { id: "az-inf",    nome: "Infortuni", questionario: null },
      { id: "welfare",   nome: "Welfare", questionario: null },
      { id: "ufficio",   nome: "Ufficio", questionario: "ufficio" },
      { id: "cyber",     nome: "Cyber risk", nota: "Studi professionali e società", questionario: "cyber" } ] },
    { id: "az-rc", nome: "Responsabilità civile", nota: "Professionisti, amministratori, enti pubblici, sanità", invio: "danni", figli: [
      { id: "rcprof",    nome: "RC professionale", nota: "Tutte le professioni, anche per un singolo progetto", questionario: "rcprof" },
      { id: "do",        nome: "RC amministratori (D&O)", nota: "Società, no profit, ordini, singolo amministratore", questionario: "do" },
      { id: "po",        nome: "RC enti pubblici e dipendenti", nota: "Amministratori e dipendenti pubblici, enti, opere pubbliche", questionario: "po" },
      { id: "sanita",    nome: "RC strutture sanitarie", nota: "RSA, poliambulatori, centri medici, case di cura", questionario: "sanita" } ] },
    { id: "az-vita", nome: "Vita", invio: "vita", figli: [
      { id: "ifm",       nome: "IFM / TFM", nota: "Indennità di fine mandato", questionario: null },
      { id: "tfr",       nome: "TFR", questionario: null } ] } ] }
];

/* Utilità sull'albero: percorso dalla radice a un nodo, gruppo di invio, prodotti pronti */
function percorsoNodo(id, nodi = ALBERO, strada = []) {
  for (const n of nodi) {
    const s = strada.concat(n);
    if (n.id === id) return s;
    if (n.figli) { const t = percorsoNodo(id, n.figli, s); if (t) return t; }
  }
  return null;
}
function invioPer(id) { const p = percorsoNodo(id) || []; for (let i = p.length - 1; i >= 0; i--) if (p[i].invio) return p[i].invio; return "danni"; }
function contaPronti(n) { return n.figli ? n.figli.reduce((a, f) => a + contaPronti(f), 0) : (n.questionario ? 1 : 0); }
function contaTotali(n) { return n.figli ? n.figli.reduce((a, f) => a + contaTotali(f), 0) : 1; }
