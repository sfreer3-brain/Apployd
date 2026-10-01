/* =====================================================================
   AVVIO
   ===================================================================== */
Pratiche.pulisciVecchie();
Stato.pila.push({ schermo: "home", dati: {} });
try { history.replaceState({ n: 1 }, ""); } catch (e) {}
collegaEventi();
disegna();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(misura);
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
