// Apre l'app in un browser senza interfaccia, esegue un percorso e salva screenshot + errori console
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || 'prove';
  const larg = Number(process.argv[3] || 390), alt = Number(process.argv[4] || 844), mobile = larg < 900;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: larg, height: alt }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const pg = await ctx.newPage();
  const errori = [];
  pg.on('console', m => { if (m.type() === 'error') errori.push(m.text()); });
  pg.on('pageerror', e => errori.push('PAGEERROR ' + e.message));
  await pg.goto('file://' + path.resolve('dist/index.html'));
  await pg.waitForTimeout(800);
  const shot = n => pg.screenshot({ path: `${out}/${n}.png` });
  await shot('1-home');
  await pg.click('[data-az=preventivo]'); await shot('2-rami');
  await pg.click('[data-nodo=az]'); await pg.click('[data-nodo=az-rc]'); await pg.click('[data-prodotto=rcprof]'); await pg.click('[data-campo=copertura][data-v=annuale]'); await pg.click('[data-campo=area][data-v=tecnica]');
  await pg.click('[data-campo=professione][data-v=architetto]');
  await pg.click('[data-campo=forma][data-v=studio]');
  await shot('3-professione');
  await pg.click('[data-az=avanti]');
  await pg.fill('#f_nome', 'Studio Rossi & Bianchi'); await pg.fill('#f_piva', '01234567890');
  await shot('3b-cliente');
  await pg.click('[data-az=avanti]');
  await pg.fill('#f_fatturato', '180000'); await pg.locator('#f_fatturato').blur();
  await pg.click('[data-campo=altraPolizza][data-v=no]');
  await pg.click('[data-az=avanti]');
  await pg.click('[data-campo=noRichieste][data-v=si]');
  await pg.click('[data-campo=noCircostanze][data-v=no]');
  await pg.evaluate(() => window.scrollTo(0, 0));
  await shot('4-precedenti');
  // misure: la barra in basso non deve coprire il contenuto
  const m = await pg.evaluate(() => ({
    barra: document.querySelector('#barra').getBoundingClientRect().height,
    azioni: document.querySelector('#azioni').getBoundingClientRect().height,
    padTop: getComputedStyle(document.querySelector('#vista')).paddingTop,
    padBot: getComputedStyle(document.querySelector('#vista')).paddingBottom,
    largPagina: document.documentElement.scrollWidth
  }));
  console.log(JSON.stringify(m));
  console.log('ERRORI CONSOLE:', errori.length ? errori : 'nessuno');
  await b.close();
})();
