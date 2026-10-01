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
  /* quando arriva una versione nuova, si ricarica una volta da sola (solo se c'era già una versione installata) */
  const giaInstallata = !!navigator.serviceWorker.controller;
  let ricaricata = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (giaInstallata && !ricaricata) { ricaricata = true; location.reload(); } });
  navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(reg => reg.update()).catch(() => {});
}
