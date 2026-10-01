// Verifica che una nuova pubblicazione si veda alla prima apertura successiva (service worker).
// Uso: node prova_aggiornamento.js  (con il server locale attivo in dist/)
const { chromium } = require('playwright'); const { execSync } = require('child_process');
(async () => {
  const ctx = await chromium.launchPersistentContext('/tmp/claude-0/profilo-sw', { viewport: { width: 390, height: 844 } });
  const pg = await ctx.newPage(); const err = []; pg.on('pageerror', e => err.push(e.message));
  const versione = async () => (await pg.textContent('#vista')).match(/Bussola\s+(\d+\.\d+)/i)?.[1] || (await pg.evaluate(() => AGENZIA.versione));
  await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(1500);
  const prima = await versione();
  await pg.reload(); await pg.waitForTimeout(800);
  const controllata = await pg.evaluate(() => !!navigator.serviceWorker.controller);
  execSync(process.argv[2] || 'true');           // qui si pubblica la versione nuova
  await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(2500);
  const dopo = await versione();
  console.log(`prima ${prima} · service worker attivo ${controllata} · dopo la pubblicazione ${dopo} · errori ${err.length}`);
  await ctx.close();
})();
