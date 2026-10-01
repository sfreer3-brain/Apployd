// Home ed eliminazione pratiche nel browser. Uso: node prova_home.js [larghezza]
const { chromium } = require('playwright');
const LARG = Number(process.argv[2] || 1366), MOBILE = LARG < 900, DIR = MOBILE ? 'prove/tel' : 'prove/pc';
const esiti = []; const ok = (n, c, x) => { esiti.push(!!c); console.log((c ? 'OK   ' : 'KO   ') + n + (x ? ' — ' + x : '')); };
(async () => {
  const b = await chromium.launch();
  const pg = await (await b.newContext({ viewport: { width: LARG, height: MOBILE ? 844 : 860 }, deviceScaleFactor: MOBILE ? 2 : 1, isMobile: MOBILE, hasTouch: MOBILE })).newPage();
  const err = []; pg.on('pageerror', e => err.push(e.message));
  await pg.goto('http://localhost:8765/index.html'); await pg.evaluate(() => Pratiche.tutte().forEach(p => Pratiche.elimina(p.id))); await pg.reload();
  const bozze = () => pg.$$eval('[data-apri]', e => e.length);
  // 1. pratica aperta e lasciata vuota: non resta in elenco
  await pg.click('[data-az=preventivo]'); await pg.click('[data-nodo=pf]'); await pg.click('[data-nodo=pf-re]'); await pg.click('[data-prodotto=casa]');
  ok('pulsante Home visibile nel questionario', await pg.isVisible('#btnHome'));
  await pg.click('#btnHome');
  ok('Home: si torna alla pagina iniziale', /Cosa devi fare/.test(await pg.textContent('#vista')));
  ok('pratica aperta e lasciata vuota non resta tra quelle da completare', (await bozze()) === 0);
  // 2. pratica iniziata: resta salvata
  await pg.click('[data-az=sinistro]'); await pg.fill('#f_nome', 'Mario Rossi'); await pg.locator('#f_nome').blur(); await pg.waitForTimeout(100);
  await pg.click('#btnHome');
  ok('pratica iniziata salvata, con messaggio', (await bozze()) === 1 && /salvata/.test(await pg.textContent('#vista')));
  await pg.click('[data-az=preventivo]'); await pg.click('[data-nodo=az]'); await pg.click('[data-nodo=az-re]'); await pg.click('[data-prodotto=cyber]');
  await pg.fill('#f_nome', 'Alfa Srl'); await pg.locator('#f_nome').blur(); await pg.waitForTimeout(100);
  // Home anche dal riepilogo dei passi più avanti: dalla pratica si torna con il pulsante
  await pg.click('#btnHome');
  ok('due pratiche in elenco', (await bozze()) === 2);
  await pg.screenshot({ path: `${DIR}/home-pratiche.png` });
  // 3. eliminazione dall'elenco in due tocchi
  await pg.click('[data-elimina] >> nth=0');
  ok('primo tocco: chiede conferma, non elimina', (await bozze()) === 2 && /di nuovo/.test(await pg.textContent('.avviso-elimina')));
  await pg.screenshot({ path: `${DIR}/home-conferma.png` });
  await pg.click('.elimina.conferma');
  ok('secondo tocco: pratica eliminata', (await bozze()) === 1 && /eliminata/.test(await pg.textContent('#vista')));
  // la conferma scade da sola
  await pg.click('[data-elimina] >> nth=0'); await pg.waitForTimeout(4300);
  ok('la richiesta di conferma scade dopo 4 secondi', (await pg.$$('.elimina.conferma')).length === 0 && (await bozze()) === 1);
  // 4. eliminazione dall'interno della pratica
  await pg.click('[data-apri]'); await pg.click('.elimina-pratica'); await pg.click('.elimina-pratica.conferma');
  ok('eliminata dall\'interno: si torna alla home', /Cosa devi fare/.test(await pg.textContent('#vista')) && (await bozze()) === 0);
  const fileRimasti = await pg.evaluate(() => new Promise(ok => { const r = indexedDB.open('bussola'); r.onsuccess = () => { try { const q = r.result.transaction('file').objectStore('file').getAll(); q.onsuccess = () => ok(q.result.length); } catch (e) { ok(0); } }; r.onerror = () => ok(0); }));
  ok('nessun allegato rimasto nel dispositivo', fileRimasti === 0);
  // 5. dopo Home, il tasto indietro del browser non riapre pratiche cancellate né dà errori
  await pg.goBack().catch(() => {}); await pg.waitForTimeout(200);
  ok('indietro dopo la Home: nessun errore', err.length === 0, err.join(' | '));
  console.log(`\n${esiti.filter(Boolean).length}/${esiti.length} verifiche superate (${MOBILE ? 'telefono' : 'PC'})`);
  await b.close();
})();
