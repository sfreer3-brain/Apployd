// Percorso Casa nel browser: consigli automatici di sezioni e garanzie. Uso: node prova_casa.js [larghezza]
const { chromium } = require('playwright');
const LARG = Number(process.argv[2] || 1366), MOBILE = LARG < 900, DIR = MOBILE ? 'prove/tel' : 'prove/pc';
(async () => {
  const b = await chromium.launch();
  const pg = await (await b.newContext({ viewport: { width: LARG, height: MOBILE ? 844 : 860 }, deviceScaleFactor: MOBILE ? 2 : 1, isMobile: MOBILE, hasTouch: MOBILE, locale: 'it-IT' })).newPage();
  const err = []; pg.on('pageerror', e => err.push(e.message));
  await pg.goto('http://localhost:8765/index.html'); await pg.evaluate(() => Pratiche.tutte().forEach(p => Pratiche.elimina(p.id))); await pg.reload();
  const sc = (c, v) => pg.click(`[data-campo=${c}][data-v="${v}"]`);
  const fill = async (id, v) => { await pg.fill('#f_' + id, v); await pg.locator('#f_' + id).blur(); await pg.waitForTimeout(30); };
  const av = async () => { await pg.click('[data-az=avanti]'); await pg.waitForTimeout(80); };
  await pg.click('[data-az=preventivo]'); await pg.click('[data-nodo=pf]'); await pg.click('[data-nodo=pf-re]'); await pg.click('[data-prodotto=casa]');
  await fill('nome', 'Maria Rossi'); await fill('cf', 'RSSMRA80A41H501Y'); await fill('email', 'maria@esempio.it'); await fill('tel', '3331234567'); await sc('docTipo', 'no'); await av();
  await sc('immStessoIndirizzo', 'si'); await sc('immTipo', 'villa'); await fill('mq', '160'); await fill('anno', '2005');
  await sc('titoloCasa', 'proprietario'); await sc('uso', 'affitto'); for (const c of ['cane', 'pannelli', 'cassaforte', 'colf']) await pg.click(`[data-multi="${c}"]`); await av();
  await pg.waitForTimeout(100);
  const sez = await pg.$$eval('[data-box=coperture] [aria-pressed=true]', e => e.map(x => x.innerText.replace(/\s*consigliata/, '').replace('✓ ', '')));
  console.log('sezioni spuntate:', sez.join(' | '));
  await pg.waitForTimeout(100);
  const gar = await pg.$$eval('[data-box=garCasa] [aria-pressed=true]', e => e.map(x => x.innerText.replace(/\s*consigliata/, '').replace('✓ ', '')));
  console.log('garanzie spuntate:', gar.join(' | '));
  const campi = await pg.$$eval('#campi [data-box]', e => e.map(x => x.dataset.box));
  console.log('somme chieste:', campi.filter(x => /^val|massimale/.test(x)).join(', '));
  await pg.evaluate(() => scrollTo(0, 0)); await pg.screenshot({ path: `${DIR}/casa-sezioni.png`, fullPage: !MOBILE });
  console.log('larghezza:', await pg.evaluate(() => document.documentElement.scrollWidth), '| errori:', err);
  await b.close();
})();
