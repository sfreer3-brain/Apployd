/* Service worker di Bussola: rende l'app disponibile offline.
   OGNI VOLTA che cambiano index.html, manifest o icone, alzare VERSIONE:
   i telefoni scaricano la nuova versione al successivo avvio con rete. */
const VERSIONE = "bussola-v2";
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
  /* file dell'app: prima la copia salvata (funziona offline), aggiornata in background */
  e.respondWith(caches.open(VERSIONE).then(c => c.match(req, { ignoreSearch: true }).then(salvata => {
    const rete = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => salvata);
    return salvata || rete;
  })));
});
