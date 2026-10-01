/* =====================================================================
   VITA INVESTIMENTO (persona fisica): Piano di accumulo e Fondo pensione.
   Il cuore è il Mini Family Office, incluso così com'è in un riquadro:
   i dati del cliente si chiedono una volta sola nel passo Cliente e l'età
   passa in automatico all'analisi.
   ===================================================================== */
QUESTIONARI.vita = {
  titolo: "Vita investimento",
  passi: [
    PASSO_CLIENTE,
    { id: "analisi", titolo: "Analisi patrimoniale", sotto: "Mini Family Office: completala fino ai risultati.", pieno: true, campi: [
      { id: "mfo", tipo: "mfo", obbl: true, dom: "Analisi patrimoniale" }
    ]},
    PASSO_CHIUSURA
  ]
};
DOC_UTILI.pac = DOC_UTILI.fpens = "Estratti conto o polizze vita in essere, ultima dichiarazione dei redditi, eventuale posizione di previdenza complementare";
