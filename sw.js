/* Service worker di Bussola: rende l'app disponibile offline.
   Il nome della cache è scritto da ricomponi.py (versione + impronta del contenuto):
   a ogni nuova pubblicazione cambia da solo e i telefoni scaricano la versione nuova. */
const VERSIONE = "bussola-0.12-b5b56688";
const FILE = ["./", "./index.html", "./manifest.webmanifest", "./icona-192.png", "./icona-512.png", "./icona-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSIONE).then(c => c.addAll(FILE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== VERSIONE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  /* caratteri di Google: si salvano alla prima visita con rete */
  if (url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {
    e.respondWith(caches.open(VERSIONE).then(c => c.match(req).then(r => r || fetch(req).then(res => { c.put(req, res.clone()); return res; }).catch(() => r))));
    return;
  }
  if (url.origin !== location.origin) return;
  /* pagina dell'app: prima la rete (così una nuova versione si vede subito),
     la copia salvata se la rete manca o non risponde entro 4 secondi */
  if (req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith(".html")) {
    e.respondWith(caches.open(VERSIONE).then(c => {
      const rete = fetch(req, { cache: "no-cache" }).then(res => { if (res.ok) c.put(req, res.clone()); return res; });
      const attesa = new Promise(ok => setTimeout(ok, 4000)).then(() => c.match(req, { ignoreSearch: true }));
      return Promise.race([rete, attesa.then(r => r || rete)]).catch(() => c.match(req, { ignoreSearch: true }).then(r => r || c.match("./index.html")));
    }));
    return;
  }
  /* altri file (icone, manifest): prima la copia salvata, aggiornata in background */
  e.respondWith(caches.open(VERSIONE).then(c => c.match(req, { ignoreSearch: true }).then(salvata => {
    const rete = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => salvata);
    return salvata || rete;
  })));
});
