/* Service worker di Bussola: rende l'app disponibile offline.
   Il nome della cache è scritto da ricomponi.py (versione + impronta del contenuto):
   a ogni nuova pubblicazione cambia da solo e i telefoni scaricano la versione nuova. */
const VERSIONE = "bussola-1.14-fcbb5c39";
/* motore di lettura dei documenti (qualche MB): cache a parte, resta tra una versione e l'altra */
const CACHE_OCR = "bussola-ocr-5.1.1";
/* documenti utili (doc-<impronta>.bin): il nome cambia se cambia il contenuto, quindi la copia salvata vale sempre */
const CACHE_DOC = "bussola-documenti";
const FILE = ["./", "./index.html", "./manifest.webmanifest", "./icona-v2-192.png", "./icona-v2-512.png", "./icona-v2-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSIONE).then(c => c.addAll(FILE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== VERSIONE && x !== CACHE_OCR && x !== CACHE_DOC).map(x => caches.delete(x)))).then(() => self.clients.claim()));
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
  if (/\/(tesseract[\w.-]*\.js|worker\.min\.js|(eng|mrz)\.traineddata\.gz)$/.test(url.pathname)) {
    e.respondWith(caches.open(CACHE_OCR).then(c => c.match(req).then(r => r || fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }))));
    return;
  }
  if (/\/doc-[0-9a-f]{12}\.bin$/.test(url.pathname)) {
    e.respondWith(caches.open(CACHE_DOC).then(c => c.match(req).then(r => r || fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }))));
    return;
  }
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
