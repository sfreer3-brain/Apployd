// Prova completa nel browser senza interfaccia: percorsi RC professionale, Vita con analisi,
// Sinistro, Property; riepilogo, PDF scaricato, chiusura pratica. Uso: node prova_completa.js [larghezza]
const { chromium } = require('playwright');
const fs = require('fs'), { execSync } = require('child_process');
const LARG = Number(process.argv[2] || 1366), MOBILE = LARG < 900, DIR = MOBILE ? 'prove/tel' : 'prove/pc';
const esiti = []; const ok = (n, c, extra) => { esiti.push([n, !!c]); console.log((c ? 'OK   ' : 'KO   ') + n + (extra ? ' — ' + extra : '')); };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: LARG, height: MOBILE ? 844 : 860 }, deviceScaleFactor: MOBILE ? 2 : 1, isMobile: MOBILE, hasTouch: MOBILE, locale: 'it-IT', acceptDownloads: true });
  const pg = await ctx.newPage(); const err = [];
  pg.on('pageerror', e => err.push(e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_TUNNEL|ERR_NAME|net::/.test(m.text())) err.push(m.text()); });
  await pg.goto('http://localhost:8765/index.html');
  const shot = n => pg.screenshot({ path: `${DIR}/${n}.png` });
  const avanti = () => pg.click('[data-az=avanti]');
  const scegli = (c, v) => pg.click(`[data-campo=${c}][data-v="${v}"]`);
  const titolo = () => pg.textContent('.passo-titolo');

  // ---------- 1. RC professionale fino all'invio ----------
  await pg.click('[data-az=preventivo]'); await pg.click('[data-nodo=az]'); await pg.click('[data-nodo=az-rc]'); await pg.click('[data-prodotto=rcprof]');
  await scegli('copertura', 'annuale'); await scegli('area', 'economica'); await scegli('professione', 'commerc'); await scegli('forma', 'studio'); await avanti();
  await pg.fill('#f_nome', 'Studio Bianchi Associati'); await pg.fill('#f_piva', '01234567890');
  await pg.fill('#f_email', 'info@bianchi.it'); await pg.fill('#f_tel', '0332 123456'); await pg.locator('#f_tel').blur();
  await scegli('docTipo', 'no'); await avanti();
  await pg.fill('#f_fatturato', '420000'); await pg.locator('#f_fatturato').blur(); await avanti();
  for (const c of ['noRichieste', 'noCircostanze', 'noProcedure', 'noPerdite25']) await scegli(c, 'si');
  await scegli('altraPolizza', 'no');
  await avanti();
  await scegli('estSindaco', 'si'); await scegli('quota35', 'si'); await scegli('estVisto', '730'); await avanti();
  await scegli('massimale', '1000'); await avanti();
  await scegli('mup', 'si'); await scegli('privacy', 'no'); await avanti();
  ok('RC: arrivo al riepilogo', (await titolo()).includes('Studio Bianchi'));
  ok('RC: segnalazione privacy mancante nel riepilogo', /privacy/i.test(await pg.textContent('#vista')));
  await shot('riepilogo');
  // senza nome del commerciale non si scarica
  const bottone = MOBILE ? '[data-az=scarica], [data-az=condividi]' : '[data-az=scarica]';
  await pg.click(bottone);
  ok('RC: senza dati del commerciale l\'invio si ferma', ((await pg.textContent('#erroreProfilo')) || '').length > 0);
  await pg.fill('[data-profilo=nome]', 'Andrea Prova'); await pg.fill('[data-profilo=email]', 'andrea@lloydvaresino.it'); await pg.fill('[data-profilo=tel]', '0332 289520');
  if (!MOBILE) {
    const [dl] = await Promise.all([pg.waitForEvent('download'), pg.click('[data-az=scarica]')]);
    await dl.saveAs('prove/scaricato.pdf');
    const testo = execSync('pdftotext -layout prove/scaricato.pdf -').toString();
    const imm = execSync('pdfimages -list prove/scaricato.pdf').toString().split('\n').length - 3;
    ok('RC: PDF scaricato valido (qpdf)', /No syntax or stream encoding errors/.test(execSync('qpdf --check prove/scaricato.pdf || true').toString()));
    ok('RC: PDF con cliente, commerciale e visto 730', /Studio Bianchi Associati/.test(testo) && /Andrea Prova/.test(testo) && /Ordinario \+ 730/.test(testo), dl.suggestedFilename());
    ok('RC: PDF con il logo', imm === 1, imm + ' immagini');
    execSync(`pdftoppm -r 70 -png -f 1 -l 1 prove/scaricato.pdf ${DIR}/pdf-rc`);
    // email già compilata: controllo l'indirizzo mailto senza aprirlo
    await pg.evaluate(() => { window.__mailto = null; const d = Object.getOwnPropertyDescriptor(Location.prototype, 'href'); });
  }
  const dest = await pg.$$eval('[data-dest][aria-pressed=true]', e => e.map(x => x.textContent));
  ok('RC: destinatario proposto a turno (gruppo danni)', dest.length === 1 && ['gscopacasa', 'ctominovi', 'bdelgrande'].includes(dest[0]), dest.join());
  await pg.click('[data-dest="bdelgrande@lloydvaresino.it"]');
  const abilitato = await pg.isEnabled('[data-az=inviato]');
  if (!abilitato) await pg.evaluate(() => segnaInviato('prova'));
  await pg.click('[data-az=inviato]');
  ok('RC: pratica chiusa, messaggio in home', /chiusa e cancellata/.test(await pg.textContent('#vista')));
  ok('RC: nessuna pratica rimasta', (await pg.$$('[data-apri]')).length === 0);

  // ---------- 2. Sinistro auto ----------
  await pg.click('[data-az=sinistro]');
  await pg.fill('#f_nome', 'Mario Rossi'); await pg.fill('#f_cf', 'RSSMRA80A01L682N'); await pg.fill('#f_tel', '3331234567'); await pg.fill('#f_email', 'mario@esempio.it'); await pg.locator('#f_email').blur();
  await scegli('denunciante', 'assicurato'); await avanti();
  await scegli('ramoSin', 'auto'); await pg.fill('#f_targa', 'ab123cd'); await avanti();
  await scegli('evento', 'scontro');
  const tre = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
  await pg.fill('#f_dataSin', tre); await pg.locator('#f_dataSin').blur();
  ok('Sinistro: avviso oltre 3 giorni', /1913/.test(await pg.textContent('[data-avviso=dataSin]')));
  await pg.fill('#f_luogoSin', 'Via Milano 10, Varese'); await pg.fill('#f_descrizione', 'Tamponamento al semaforo.'); await pg.locator('#f_descrizione').blur();
  await scegli('controparte', 'si'); await pg.fill('#f_contNome', 'Luigi Verdi'); await pg.locator('#f_contNome').blur(); await pg.fill('#f_contTarga', 'ef456gh'); await pg.locator('#f_contTarga').blur(); await scegli('cai', 'si'); await scegli('testimoni', 'no'); await avanti();
  await avanti();
  ok('Sinistro: senza IBAN né impegno non si prosegue', /impegno/.test(await pg.textContent('[data-box=iban]')));
  await pg.click('[data-flag=ibanImpegno]'); await pg.waitForTimeout(100); await avanti();
  ok('Sinistro: con l\'impegno sull\'IBAN si prosegue', /Documenti/.test(await pg.textContent('.passo-titolo')));
  await pg.click('[data-vai-passo], [data-passo="3"]').catch(() => {}); await pg.evaluate(() => { Stato.pratica.passo = 3; disegna(); }); await pg.waitForTimeout(100);
  await pg.fill('#f_iban', 'IT60X0542811101000000123457'); await pg.locator('#f_iban').blur(); await pg.waitForTimeout(100); await avanti();
  ok('Sinistro: IBAN sbagliato bloccato', /IBAN non valido/.test(await pg.textContent('#vista')));
  await pg.fill('#f_iban', 'IT60X0542811101000000123456'); await pg.locator('#f_iban').blur(); await avanti();
  ok('Sinistro: elenco documenti con il CAI', /CAI/.test(await pg.textContent('[data-box=docElenco]')));
  await shot('sinistro-documenti');
  await scegli('privacySin', 'si'); await avanti();
  const dSin = await pg.$$eval('.campo', e => e.map(x => x.innerText).join(' '));
  ok('Sinistro: destinatario pzanzi', /pzanzi@lloydvaresino\.it/.test(dSin));
  await pg.evaluate(() => segnaInviato('prova')); await pg.click('[data-az=inviato]');

  // ---------- 3. Vita con analisi patrimoniale ----------
  await pg.click('[data-az=preventivo]'); await pg.click('[data-nodo=pf]'); await pg.click('[data-nodo=pf-vita]'); await pg.click('[data-prodotto=pac]');
  await pg.fill('#f_nome', 'Maria Rossi'); await pg.fill('#f_cf', 'RSSMRA80A41H501Y'); await pg.locator('#f_cf').blur();
  await pg.fill('#f_email', 'maria@esempio.it'); await pg.fill('#f_tel', '3331234567'); await pg.locator('#f_tel').blur();
  await scegli('docTipo', 'no'); await avanti();
  ok('Vita: passo analisi patrimoniale', /Analisi patrimoniale/.test(await titolo()));
  ok('Vita: senza analisi completa il pulsante Avanti è bloccato', await pg.isDisabled('[data-az=avanti]'));
  const fr = pg.frameLocator('#mfoFrame');
  await fr.locator('text=Inizia l').first().click();
  const frame = pg.frames().find(f => f !== pg.mainFrame());
  const eta = await frame.evaluate(() => A.eta);
  ok('Vita: età passata dal codice fiscale all\'analisi', eta === '40_49', eta);
  await shot('vita-analisi');
  /* risponde a una domanda alla volta (ogni risposta ridisegna la pagina), poi passa alla successiva */
  for (let giro = 0; giro < 120; giro++) {
    if (await frame.evaluate(() => !document.getElementById('results').hidden)) break;
    await frame.evaluate(() => {
      const q = [...document.querySelectorAll('#stepBody .q')].find(q => !q.querySelector('input:checked') && !(q.querySelector('select') && q.querySelector('select').value));
      if (!q) { document.getElementById('btnNext').click(); return; }
      const sel = q.querySelector('select'); if (sel) { sel.value = sel.options[2] ? sel.options[2].value : sel.options[1].value; sel.dispatchEvent(new Event('change', { bubbles: true })); return; }
      const r = q.querySelectorAll('input[type=radio]'); if (r.length) { r[Math.min(1, r.length - 1)].click(); return; }
      const m = q.querySelector('input[type=checkbox]'); if (m) { m.click(); return; }
      document.getElementById('btnNext').click();
    });
  }
  await pg.waitForTimeout(400);
  const stato = await pg.evaluate(() => Stato.pratica.risposte.mfo && Stato.pratica.risposte.mfo.risultati);
  ok('Vita: risultati dell\'analisi ricevuti dall\'app', !!stato, stato ? `punteggio ${stato.punteggio}, profilo ${stato.profilo}` : '');
  const hIframe = await pg.$eval('#mfoFrame', f => f.getBoundingClientRect().height);
  ok('Vita: il riquadro si adatta al contenuto', hIframe > 1000, Math.round(hIframe) + ' px');
  await avanti();
  ok('Vita: adeguatezza IBIP richiesta nell\'ultimo passo', (await pg.$$('[data-box=adeguatezza]')).length === 1);
  await scegli('adeguatezza', 'si'); await scegli('antiriciclaggio', 'si'); await scegli('mup', 'si'); await scegli('privacy', 'si'); await avanti();
  const testoRiep = await pg.textContent('#vista');
  ok('Vita: riepilogo con risultati e coperture da valutare', /Indice di salute finanziaria/.test(testoRiep) && /coperture da valutare/i.test(testoRiep));
  ok('Vita: destinatario mcastoldi', /mcastoldi@lloydvaresino\.it/.test(testoRiep));
  if (!MOBILE) {
    const [dl] = await Promise.all([pg.waitForEvent('download'), pg.click('[data-az=scarica]')]);
    await dl.saveAs('prove/vita.pdf');
    const t = execSync('pdftotext -layout prove/vita.pdf -').toString();
    ok('Vita: PDF con analisi e senza simboli illeggibili', /Indice di salute finanziaria/.test(t) && !/\?\?/.test(t), execSync('pdfinfo prove/vita.pdf').toString().match(/Pages:\s+\d+/)[0]);
    execSync(`pdftoppm -r 70 -png -f 1 -l 2 prove/vita.pdf ${DIR}/pdf-vita`);
  }
  // ricarico a metà: l'analisi deve ripristinarsi
  await pg.click('[data-vai-passo="1"]'); await pg.waitForTimeout(300);
  await pg.reload(); await pg.waitForTimeout(400); await pg.click('[data-apri]'); await pg.waitForTimeout(1200);
  const fr2 = pg.frames().find(f => f !== pg.mainFrame());
  const ripristinato = fr2 && await fr2.evaluate(() => !document.getElementById('results').hidden && Object.keys(A).length);
  ok('Vita: dopo la ricarica l\'analisi riparte dai risultati', !!ripristinato, ripristinato + ' risposte');
  await pg.goto('http://localhost:8765/index.html'); await pg.evaluate(() => { Pratiche.tutte().forEach(p => Pratiche.elimina(p.id)); });

  // ---------- 4. Property industria ----------
  await pg.reload();
  await pg.click('[data-az=preventivo]'); await pg.click('[data-nodo=az]'); await pg.click('[data-nodo=az-re]'); await pg.click('[data-prodotto=industria]');
  const passiIniz = await pg.evaluate(() => passiVisibili(QUESTIONARI.property, Stato.pratica.risposte).map(p => p.titolo));
  await pg.evaluate(() => { Stato.pratica.risposte.garanzie = ['incendio', 'furto', 'alluvione']; });
  const passiDopo = await pg.evaluate(() => passiVisibili(QUESTIONARI.property, Stato.pratica.risposte).map(p => p.titolo));
  ok('Property: con incendio, furto e alluvione compaiono tutti i passi', passiDopo.includes('Rischio incendio') && passiDopo.includes('Eventi catastrofali') && passiDopo.length > passiIniz.length, passiDopo.join(' / '));
  await pg.evaluate(() => { Stato.pratica.passo = 4; disegna(); }); await shot('property-ubicazione');

  // ---------- 4b. Cyber e D&O ----------
  await pg.goto('http://localhost:8765/index.html');
  await pg.click('[data-az=preventivo]'); await pg.click('[data-nodo=az]'); await pg.click('[data-nodo=az-re]'); await pg.click('[data-prodotto=cyber]');
  await pg.evaluate(() => { Object.assign(Stato.pratica.risposte, { nome: 'Alfa Srl', piva: '01234567890', email: 'a@alfa.it', tel: '0332111222', docTipo: 'no' }); Stato.pratica.passo = 1; disegna(); });
  await scegli('tipoCyber', 'societa'); await pg.fill('#f_fatturato', '4500000'); await pg.locator('#f_fatturato').blur(); await pg.waitForTimeout(100);
  ok('Cyber: prodotto di riferimento indicato', /Cyber Smart Plus società/.test(await pg.textContent('[data-avviso=fatturato]')));
  await shot('cyber');
  await pg.goto('http://localhost:8765/index.html'); await pg.evaluate(() => Pratiche.tutte().forEach(p => Pratiche.elimina(p.id)));
  await pg.reload();
  await pg.click('[data-az=preventivo]'); await pg.click('[data-nodo=az]'); await pg.click('[data-nodo=az-rc]'); await pg.click('[data-prodotto=do]');
  await pg.evaluate(() => { Object.assign(Stato.pratica.risposte, { doChi: 'societa', nome: 'Ordine degli Architetti di Varese', piva: '01234567890', email: 'a@ordine.it', tel: '0332111222', docTipo: 'no' }); Stato.pratica.passo = 2; disegna(); });
  await scegli('tipoEnte', 'ordine');
  const passiDO = await pg.evaluate(() => passiVisibili(QUESTIONARI.do, Stato.pratica.risposte).map(p => p.titolo));
  ok('D&O ordine: percorso senza passo Garanzie opzioni A/B ma con massimali', passiDO.includes('Garanzie'), passiDO.join(' / '));
  await pg.goto('http://localhost:8765/index.html'); await pg.evaluate(() => Pratiche.tutte().forEach(p => Pratiche.elimina(p.id)));


  // ---------- 4b. Nuove RC: singolo progetto, enti pubblici, sanità, D&O singolo ----------
  const pulisci = async () => { await pg.goto('http://localhost:8765/index.html'); await pg.evaluate(() => Pratiche.tutte().forEach(p => Pratiche.elimina(p.id))); await pg.reload(); };
  const apri = async prod => { await pg.click('[data-az=preventivo]'); await pg.click('[data-nodo=az]'); await pg.click('[data-nodo=az-rc]'); await pg.click(`[data-prodotto=${prod}]`); };
  const cliente = async () => { await pg.fill('#f_nome', "Maria Grazia D'Angelo"); await pg.fill('#f_cf', 'DNGMGR08A43I727O'); await pg.fill('#f_email', 'p@prova.it'); await pg.fill('#f_tel', '0332111222'); await pg.locator('#f_tel').blur(); await pg.waitForTimeout(80); await scegli('docTipo', 'no'); };
  const conta = async sel => { await pg.waitForTimeout(150); return (await pg.$$(sel)).length; };
  const larg = async n => { const w = await pg.evaluate(() => document.documentElement.scrollWidth); if (w > LARG) ok(n + ': niente scorrimento laterale', false, w + ' px'); };
  await pulisci(); await apri('rcprof');
  ok('RC: 2 scelte iniziali poi 6 aree', (await conta('[data-campo=copertura]')) === 2);
  await scegli('copertura', 'annuale'); ok('RC: 6 aree', (await conta('[data-campo=area]')) === 6);
  await scegli('area', 'immobiliare'); ok('RC: area immobiliare con 4 professioni', (await conta('[data-campo=professione]')) === 4);
  await shot('rc-aree'); await larg('RC aree');
  await scegli('copertura', 'progetto'); await avanti(); await cliente(); await avanti();
  await pg.waitForTimeout(150); ok('RC singolo progetto: passo Progetto', (await titolo()) === 'Progetto', await titolo());
  await scegli('tipoProgetto', 'merloni'); await shot('rc-progetto'); await larg('RC progetto');
  await avanti(); ok('RC progetto: si ferma sui campi obbligatori', (await conta('.errore')) >= 5);
  await pulisci(); await apri('po');
  await scegli('poChi', 'persona'); await avanti(); await cliente(); await avanti();
  await pg.waitForTimeout(150); ok('Enti pubblici: passo Incarichi', (await titolo()) === 'Incarichi', await titolo());
  await scegli('incarico', 'A2'); await scegli('tipoEntePO', 'entrambi'); await scegli('entePub', 'comune5');
  await pg.fill('#f_elencoIncarichi', 'Comune di Prova: consigliere'); await scegli('attivoSoc', '50');
  for (const c of ['socBilancio', 'socInsolvenza', 'socSettori', 'noCaricheStato', 'max7']) await scegli(c, 'si');
  await shot('po-incarichi'); await larg('P&O'); await avanti();
  for (const c of ['noRichieste', 'noCircostanze']) await scegli(c, 'si'); await avanti();
  ok('Enti pubblici: garanzie con rinuncia RC (non apicale) e danni amministrativi', !!(await pg.$('[data-box=rinunciaRC]')) && !!(await pg.$('[data-box=estDanniAmm]')));
  await scegli('massimalePO', '1000'); await avanti(); await scegli('mup', 'si'); await scegli('privacy', 'si'); await avanti();
  ok('Enti pubblici: arrivo al riepilogo', /Incarichi/.test(await pg.textContent('#vista')));
  await pulisci(); await apri('sanita'); await cliente(); await avanti();
  await scegli('tipoSan', 'ambulatoriale'); await scegli('prevAmb', 'Centro medico');
  ok('Sanità: niente attività residenziale per un ambulatorio', !(await pg.$('[data-box=prevRes]')));
  await shot('sanita'); await larg('Sanità');
  await scegli('tipoSan', 'casacura'); await pg.waitForTimeout(150); ok('Sanità casa di cura: avviso proposta completa', /proposta completa/.test(await pg.textContent('[data-avviso=tipoSan]')));
  await pulisci(); await apri('do');
  await scegli('doChi', 'persona'); await avanti(); await cliente(); await avanti();
  await pg.waitForTimeout(150); ok('D&O singolo: passo Incarichi', (await titolo()) === 'Incarichi', await titolo());
  await pg.click('[data-campo=tipoIncDo][data-multi=sindaco]'); await pg.waitForTimeout(150);
  ok('D&O singolo: sindaco segnalato', /non sono assicurabili/.test(await pg.textContent('[data-avviso=tipoIncDo]')));
  await shot('do-singolo'); await larg('D&O singolo');
  await pulisci();
  // ---------- 5. Compliance e guida, pagina ----------
  await pg.goto('http://localhost:8765/index.html'); await pg.click('[data-az=compliance]');
  ok('Compliance: schede presenti', (await pg.$$('.schede .campo')).length >= 4);
  await pg.goBack(); await pg.click('[data-az=guida]'); ok('Guida: schede presenti', (await pg.$$('.schede .campo')).length >= 4);
  ok('Guida: IBAN dell\'agenzia', /IT85 U 08404 10801 000000003944/.test((await pg.textContent('#vista')).replace(/\s+/g, ' ')) || /IT85U0840410801000000003944/.test(await pg.textContent('#vista')));
  await pg.click('.doc-utile summary'); await pg.click('[data-az=disdettaPDF]');
  ok('Guida: disdetta senza dati si ferma', /Manca/.test(await pg.textContent('[data-dis-errore]')));
  for (const [k, v] of [['nome', 'Mario Rossi'], ['compagnia', 'Compagnia Prova'], ['polizza', '123/45']]) await pg.fill(`[data-dis=${k}]`, v);
  await pg.fill('[data-dis=scadenza]', '2026-12-31');
  await shot('guida');
  if (!MOBILE) {
    const [dl2] = await Promise.all([pg.waitForEvent('download'), pg.click('[data-az=disdettaPDF]')]);
    await dl2.saveAs('prove/disdetta-browser.pdf');
    ok('Guida: PDF disdetta scaricato', /123\/45/.test(execSync('pdftotext prove/disdetta-browser.pdf -').toString()), dl2.suggestedFilename());
  }
  const larghezza = await pg.evaluate(() => document.documentElement.scrollWidth);
  ok('Pagina: niente scorrimento laterale', larghezza <= LARG, larghezza + ' px');
  const sw = await pg.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return !!r; });
  ok('Offline: service worker registrato', sw);
  ok('Nessun errore JavaScript', err.length === 0, err.slice(0, 3).join(' | '));
  const ko = esiti.filter(x => !x[1]).length;
  console.log(`\n${esiti.length - ko}/${esiti.length} verifiche superate (${MOBILE ? 'telefono' : 'PC'})`);
  await b.close(); process.exit(ko ? 1 : 0);
})().catch(e => { console.error('ERRORE', e.message); process.exit(2); });
