(async () => {
// Prove della logica senza interfaccia: carica i blocchi dati+logica e verifica le regole
const fs = require('fs'), vm = require('vm');
const ctx = { console, Blob, atob, localStorage: undefined }; vm.createContext(ctx);
for (const f of ['10_dati_agenzia.js', '15_dati_luoghi.js', '17_codice_fiscale.js', '20_dati_questionari.js', '21_dati_rc.js', '22_dati_property.js', '23_dati_vita.js', '24_dati_sinistri.js', '25_dati_do_cyber.js', '26_dati_contenuti.js', '30_logica.js', '35_riepilogo_pdf.js'])
  vm.runInContext(fs.readFileSync('src/' + f, 'utf8').replace(/^const |^function /gm, m => m === 'const ' ? 'var ' : m), ctx);
let ok = 0, ko = 0;
const stessi = (a, b) => a.length === b.length && a.every(x => b.includes(x));
const prova = (nome, cond) => { if (cond) ok++; else { ko++; console.log('FALLITA:', nome); } };
const passoCliente = vm.runInContext('QUESTIONARI.rcprof.passi.find(p => p.id === "cliente")', ctx);
const BASE = { email: 'mario@esempio.it', tel: '333 1234567', docTipo: 'no' };
const errori = r => vm.runInContext('controllaPasso', ctx)(passoCliente, Object.assign({}, BASE, r));
const erroriPuri = r => vm.runInContext('controllaPasso', ctx)(passoCliente, r);
prova('email e telefono mancanti → errore', (e => e.email && e.tel)(erroriPuri({ nome: 'X', piva: '01234567890', docTipo: 'no' })));
prova('telefono con lettere → errore', !!errori({ nome: 'X', piva: '01234567890', tel: '333abc' }).tel);
prova('telefono +39 con spazi e trattini → valido', !errori({ nome: 'X', piva: '01234567890', tel: '+39 0332-289520' }).tel);
prova('documento scelto → numero e scadenza obbligatori', (e => e.docNumero && e.docScadenza && !e.docFile)(errori({ nome: 'X', piva: '01234567890', docTipo: 'ci' })));
prova('documento "non disponibile" → nessun campo in più', Object.keys(errori({ nome: 'X', piva: '01234567890' })).length === 0);
const campoScad = passoCliente.campi.find(c => c.id === 'docTipo').figli.campi.find(c => c.id === 'docScadenza');
prova('documento scaduto → avviso rosso', (campoScad.avviso('2020-01-01') || {}).livello === 'rosso' && campoScad.avviso('2099-01-01') === null);
prova('nessuno dei due → errore su entrambi', (e => e.piva && e.cf)(errori({ nome: 'X' })));
prova('solo P.IVA valida → nessun errore', Object.keys(errori({ nome: 'X', piva: '01234567890' })).length === 0);
prova('solo C.F. persona valido → nessun errore', Object.keys(errori({ nome: 'X', cf: 'RSSMRA80A01L682N' })).length === 0);
prova('solo C.F. società (11 cifre) → nessun errore', Object.keys(errori({ nome: 'X', cf: '01234567890' })).length === 0);
prova('C.F. minuscolo con spazi → accettato', Object.keys(errori({ nome: 'X', cf: 'rssmra 80a01 l682n' })).length === 0);
prova('C.F. con carattere di controllo errato → errore', !!errori({ nome: 'X', cf: 'RSSMRA80A01L682K' }).cf);
prova('C.F. sbagliato → errore solo su cf', (e => e.cf && !e.piva)(errori({ nome: 'X', cf: 'ABC123' })));
prova('P.IVA di 10 cifre → errore', !!errori({ nome: 'X', piva: '0123456789' }).piva);
prova('entrambi validi → nessun errore', Object.keys(errori({ nome: 'X', piva: '01234567890', cf: 'RSSMRA80A01L682N' })).length === 0);
prova('nome mancante → errore', !!errori({ piva: '01234567890' }).nome);

/* ---- confronto con la libreria di riferimento su 3000 codici ---- */
const casi = JSON.parse(fs.readFileSync('strumenti/casi_cf.json', 'utf8'));
const analizza = vm.runInContext('analizzaCF', ctx), coerente = vm.runInContext('cfCoerenteConNome', ctx), deriva = vm.runInContext('derivaDaCF', ctx);
let cnt = { validi: 0, sesso: 0, data: 0, luogo: 0, nome: 0 }, diversi = [];
for (const k of casi) {
  const e = analizza(k.cf, new Date('2026-09-25'));
  if (e.valido) cnt.validi++; else { diversi.push(['non valido', k]); continue; }
  if (e.dati.sesso === k.sesso) cnt.sesso++; else diversi.push(['sesso', k, e.dati]);
  if (e.dati.dataNascita === k.data) cnt.data++; else diversi.push(['data', k, e.dati]);
  if (e.dati.codLuogo === k.cod && e.dati.luogoTrovato) cnt.luogo++; else diversi.push(['luogo', k, e.dati]);
  if (coerente(k.cf, k.nome) === true) cnt.nome++; else diversi.push(['nome', k]);
}
console.log(`Riferimento: ${casi.length} codici (${casi.filter(c => !/^\d{2}$/.test(c.cf.slice(6, 8))).length} con omocodia)`);
for (const [k, v] of Object.entries(cnt)) console.log(`  ${k.padEnd(7)} ${v}/${casi.length}`);
diversi.slice(0, 5).forEach(d => console.log('  DIVERSO', JSON.stringify(d)));
prova('tutti i codici di riferimento decodificati correttamente', Object.values(cnt).every(v => v === casi.length));
/* ---- codici con un carattere sbagliato: quanti vengono intercettati ---- */
let intercettati = 0, totaliErr = 0; const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const rnd = (() => { let x = 12345; return () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648; })();
for (const k of casi) {
  const i = Math.floor(rnd() * 15), a = k.cf.split(''); let nuovo;
  do { nuovo = A[Math.floor(rnd() * A.length)]; } while (nuovo === a[i]);
  a[i] = nuovo; totaliErr++;
  if (!analizza(a.join('')).valido) intercettati++;
}
console.log(`Errori di battitura intercettati: ${intercettati}/${totaliErr} (${(100 * intercettati / totaliErr).toFixed(1)}%)`);
/* ---- nome sbagliato: quante incoerenze segnalate ---- */
let segnalati = 0;
for (let i = 0; i < casi.length; i++) { const altro = casi[(i + 7) % casi.length].nome; if (coerente(casi[i].cf, altro) === false) segnalati++; }
console.log(`Nome di un'altra persona segnalato come incoerente: ${segnalati}/${casi.length}`);
/* ---- derivazione: non sovrascrive ciò che è stato corretto a mano ---- */
const r = { cf: 'RSSMRA80A01L682N' }; deriva(r);
prova('deriva compila i campi', r.sesso === 'M' && r.dataNascita === '1980-01-01' && r.luogoNascita === 'Varese (VA)');
r.luogoNascita = 'Varese'; r.cf = 'RSSMRA80A41H501Y'; deriva(r);
prova('deriva non sovrascrive una correzione manuale', r.luogoNascita === 'Varese' && r.sesso === 'F');
r.cf = '01234567890'; deriva(r);
prova('passando a C.F. di società si svuotano solo i campi automatici', r.sesso === '' && r.dataNascita === '' && r.luogoNascita === 'Varese');

/* ---- questionari Casa e Ufficio ---- */
const Q = vm.runInContext('QUESTIONARI', ctx), attivi = vm.runInContext('campiAttivi', ctx), passiVis = vm.runInContext('passiVisibili', ctx), ctrl = vm.runInContext('controllaPasso', ctx);
const tuttiIdVisibili = (q, r) => passiVis(q, r).flatMap(p => attivi(p, r).map(c => c.id));
for (const [nome, q] of Object.entries(Q)) {
  const ids = []; (function giro(l) { for (const c of l) { ids.push(c.id); if (c.figli) giro(c.figli.campi); } })(q.passi.flatMap(p => p.campi));
  const doppi = ids.filter((x, i) => ids.indexOf(x) !== i);
  prova(`${nome}: nessun campo con lo stesso identificativo`, doppi.length === 0) || doppi.length && console.log('  doppi:', doppi);
}
const cliCasa = Q.casa.passi[0];
prova('casa (persona fisica): la partita IVA non compare', !attivi(cliCasa, { _segmento: 'pf' }).some(c => c.id === 'piva'));
prova('casa: senza codice fiscale → errore', !!ctrl(cliCasa, { _segmento: 'pf', nome: 'Mario Rossi', email: 'a@b.it', tel: '3331234567', docTipo: 'no' }).cf);
prova('ufficio (azienda): compaiono partita IVA e referente', (ids => ids.includes('piva') && ids.includes('referente'))(attivi(Q.ufficio.passi[0], { _segmento: 'az', _prodotto: 'ufficio' }).map(c => c.id)));
prova('RC professionale: il referente non compare', !attivi(Q.rcprof.passi[1], { _segmento: 'az', _prodotto: 'rcprof' }).some(c => c.id === 'referente'));
const immCasa = Q.casa.passi[1], copCasa = Q.casa.passi[2], immUff = Q.ufficio.passi[1], copUff = Q.ufficio.passi[2];
prova('casa: il piano compare solo per gli appartamenti', attivi(immCasa, { immTipo: 'appartamento' }).some(c => c.id === 'piano') && !attivi(immCasa, { immTipo: 'villa' }).some(c => c.id === 'piano'));
prova('casa: valore fotovoltaico solo se scelta la copertura', attivi(copCasa, { coperture: ['fotov'] }).some(c => c.id === 'valFotov') && !attivi(copCasa, { coperture: ['incendio'] }).some(c => c.id === 'valFotov'));
prova('ufficio: valore fabbricato solo se di proprietà', attivi(copUff, { titolo: 'proprieta' }).some(c => c.id === 'valFabbricato') && !attivi(copUff, { titolo: 'affitto' }).some(c => c.id === 'valFabbricato'));
const campoCop = copCasa.campi.find(c => c.id === 'coperture'), campoGar = copCasa.campi.find(c => c.id === 'garCasa');
const V = vm.runInContext('valore', ctx), opzV = (c, r) => V(c.opzioni, r).map(o => o.v);
const tutteEtichette = [].concat(V(campoCop.opzioni, {}), V(campoGar.opzioni, { coperture: V(campoCop.opzioni, {}).map(o => o.v) }),
  V(Q.property.passi.find(p => p.id === 'garanzie').campi[0].opzioni, {}), vm.runInContext('GARANZIE_OPZ', ctx)).map(o => o.t + ' ' + (o.n || '') + ' ' + (o.g || ''));
prova('questionario neutro: nessuna compagnia né codice di compagnia nelle voci', !tutteEtichette.some(t => /AXA|Unipol|Helvetia|Confido|Pet Insurance|\b[A-Z]\d{3}\b|^[A-G] ·/.test(t)), tutteEtichette.filter(t => /AXA|Unipol|Helvetia|\b[A-Z]\d{3}\b/.test(t)).join(' | '));
prova('casa: ogni sezione ha la spiegazione per il cliente', V(campoCop.opzioni, {}).every(o => o.n && o.n.length > 10));
prova('casa: con cane e pannelli si consigliano Animali e Pannelli', (x => x.includes('animali') && x.includes('green'))(campoCop.suggerito({ caratteristiche: ['cane', 'pannelli'] })));
prova('casa: senza caratteristiche solo danni alla casa e RC', (x => x.length === 2 && x.includes('incendio') && x.includes('rc'))(campoCop.suggerito({ caratteristiche: [] })));
prova('casa data in affitto: perdita canoni e casa data in affitto (RC)', (x => x.includes('canoni') && x.includes('locata'))(campoGar.suggerito({ coperture: ['incendio', 'rc'], uso: 'affitto' })));
prova('casa: colf → collaboratori domestici; figli → sostegno ai figli', (x => x.includes('domestici') && x.includes('sostegnoFigli'))(campoGar.suggerito({ coperture: ['rc', 'persona'], caratteristiche: ['colf', 'figli'] })));
prova('casa: inquilino → rischio locativo al posto del fabbricato', (ids => ids.includes('valLocativo') && !ids.includes('valFabbricato'))(attivi(copCasa, { titoloCasa: 'inquilino', coperture: ['incendio'] }).map(c => c.id)));
prova('casa: animali senza RC → avviso', !!campoGar.avvisoSe([], { coperture: ['animali'] }));
prova('casa con opere d\'arte scelte: valore obbligatorio', !!ctrl(copCasa, { coperture: ['arte'], titoloCasa: 'proprietario', valContenuto: 1 }).valArte);
const rC = { caratteristiche: ['cane'], uso: 'principale', immTipo: 'villa' }; vm.runInContext('applicaSuggeriti', ctx)(copCasa, rC);
prova('casa: sezioni e poi garanzie consigliate compilate in un colpo solo', rC.coperture.includes('animali') && (rC.garCasa || []).includes('veterinario'));
const prC = { id: 'c1', tipo: 'preventivo', questionario: 'casa', prodotto: 'casa', risposte: { ...rC, coperture: ['incendio', 'rc', 'animali'], garCasa: ['acqua', 'veterinario'] } };
const RC = vm.runInContext('costruisciRiepilogo', ctx)(prC), ann = RC.sezioni.find(x => x.soloBackoffice);
prova('PDF: nota per il backoffice con le compagnie di ogni garanzia', !!ann && ann.righe.some(x => /Spese veterinarie/.test(x.dom) && /AXA, Helvetia/.test(x.risp)));
prova('ufficio: nessuna copertura vuota ammessa', !!ctrl(copUff, { titolo: 'affitto', coperture: [] }).coperture);
/* quante domande vede il commerciale in un caso tipico, contro le voci del modulo cartaceo */
const tipicoCasa = { _segmento: 'pf', _prodotto: 'casa', cf: 'RSSMRA80A01L682N', docTipo: 'ci', immStessoIndirizzo: 'si', immTipo: 'appartamento', uso: 'principale', titoloCasa: 'proprietario', caratteristiche: ['figli'], coperture: ['incendio', 'furto', 'rc'], sinistriPrec: 'no', altraPolizza: 'no' };
const tipicoUff = { _segmento: 'az', _prodotto: 'ufficio', piva: '01234567890', docTipo: 'ci', immStessoIndirizzo: 'si', immTipo: 'condominio', titolo: 'affitto', coperture: ['incendio', 'furto', 'rcTerzi'], sinistriPrec: 'no', altraPolizza: 'no' };
console.log(`Domande visibili in un caso tipico: casa ${tuttiIdVisibili(Q.casa, tipicoCasa).length}, ufficio ${tuttiIdVisibili(Q.ufficio, tipicoUff).length}`);

/* ---- Casa e Ufficio: somme furto e massimale RC ---- */
prova('casa con furto: somma furto obbligatoria', !!ctrl(copCasa, { coperture: ['furto'], valContenuto: 1 }).valFurto);
prova('casa con RC: massimale RC 1/3/5 mln obbligatorio', !!ctrl(copCasa, { coperture: ['rc'], valContenuto: 1 }).massimaleRCimm);
prova('casa senza furto né RC: nessuna somma in più', !attivi(copCasa, { coperture: ['incendio'] }).some(c => ['valFurto', 'massimaleRCimm'].includes(c.id)));
prova('ufficio con RC terzi e dipendenti: domanda RCO', attivi(copUff, { coperture: ['rcTerzi'], dipendenti: '4' }).some(c => c.id === 'rcoUff'));
/* ---- IBAN ---- */
const iban = vm.runInContext('ibanValido', ctx);
prova('IBAN italiano valido accettato (anche con spazi)', iban('IT60 X054 2811 1010 0000 0123 456'));
prova('IBAN con una cifra cambiata rifiutato', !iban('IT60X0542811101000000123457'));
prova('IBAN italiano troppo corto rifiutato', !iban('IT60X054281110100000012345'));
prova('IBAN tedesco valido accettato', iban('DE89370400440532013000'));
/* ---- Property: le sezioni seguono le garanzie ---- */
const QP = Q.property, visP = r => passiVis(QP, r).map(p => p.id);
const baseP = { _segmento: 'az', _prodotto: 'industria' };
prova('property, solo terremoto: niente passi Rischio incendio e Protezioni', (v => !v.includes('rischio') && !v.includes('protezioni') && v.includes('catastrofali'))(visP({ ...baseP, garanzie: ['terremoto'] })));
prova('property, solo furto: Protezioni sì, Rischio incendio e Catastrofali no', (v => v.includes('protezioni') && !v.includes('rischio') && !v.includes('catastrofali'))(visP({ ...baseP, garanzie: ['furto'] })));
const ubi = QP.passi.find(p => p.id === 'ubicazione');
prova('property, furto: domanda sul fabbricato tipo presente', attivi(ubi, { ...baseP, garanzie: ['furto'] }).some(c => c.id === 'fabbTipo'));
prova('property, commercio: niente turni e lavorazioni a caldo', !attivi(QP.passi.find(p => p.id === 'azienda'), { ...baseP, _prodotto: 'commercio' }).some(c => c.id === 'turni') && !attivi(QP.passi.find(p => p.id === 'rischio'), { _prodotto: 'commercio', garanzie: ['incendio'] }).some(c => c.id === 'caldo'));
prova('property, fabbricato in affitto: si chiede il rischio locativo e non il fabbricato', (ids => ids.includes('sLocativo') && !ids.includes('sFabbricato'))(attivi(QP.passi.find(p => p.id === 'garanzie'), { garanzie: ['incendio'], titoloFabb: 'affitto' }).map(c => c.id)));
/* ---- Property: garanzie aggiuntive consigliate ---- */
const aggP = QP.passi.find(p => p.id === 'aggiuntive'), garP = QP.passi.find(p => p.id === 'garanzie');
const rS = { garanzie: ['incendio', 'furto', 'rc'], fotovoltaico: 'tetto', altriRischi: ['tettoie'], attivitaTerzi: ['posa', 'installazione'], riscaldamento: 'assente' };
const sugg = aggP.campi[0].suggerito(rS);
prova('consigliate: fotovoltaico, eventi atmosferici su pannelli e tettoie', ['fotov', 'atmFotov', 'atmAperti', 'elettrico'].every(x => sugg.includes(x)));
prova('consigliate: lavori presso terzi, postuma, attrezzi trasportati', ['lavoriTerzi', 'postuma', 'attrezzi'].every(x => sugg.includes(x)));
prova('non consigliate senza motivo: refrigerazione, gelo, lavanderie', !['refrig', 'gelo', 'E445'].some(x => sugg.includes(x)));
const applica = vm.runInContext('applicaSuggeriti', ctx);
const rA = { ...rS }; applica(aggP, rA);
prova('le consigliate vengono spuntate in automatico', stessi(rA.garOpz, sugg));
rA.garOpz = rA.garOpz.filter(x => x !== 'postuma'); rA.altriRischi = ['tettoie', 'insegne']; applica(aggP, rA);
prova('una modifica a mano non viene più sovrascritta', !rA.garOpz.includes('postuma') && !rA.garOpz.includes('lastre'));
const rB = { ...rS }; applica(aggP, rB); rB.altriRischi = ['tettoie', 'insegne']; applica(aggP, rB);
prova('senza modifiche a mano le consigliate si aggiornano', rB.garOpz.includes('lastre'));
prova('furto: somma assicurata obbligatoria', !!ctrl(garP, { garanzie: ['furto'], titoloFabb: 'affitto', sMacchinari: 1000, altraPolizza: 'no' }).sFurto);
prova('RC: massimale da scegliere tra 1, 3 e 5 milioni', (o => o.join() === '1,3,5')(garP.campi.find(c => c.id === 'massimaleRC').opzioni.map(o => o.v)));
prova('valore fotovoltaico chiesto solo se la partita è scelta', attivi(aggP, { ...rS, garOpz: ['fotov'] }).some(c => c.id === 'vFotov') && !attivi(aggP, { ...rS, garOpz: [] }).some(c => c.id === 'vFotov'));
/* ---- Sinistri ---- */
const QS = Q.sinistro, evS = QS.passi.find(p => p.id === 'evento');
const oggi = new Date().toISOString().slice(0, 10), domani = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
prova('sinistro: data futura rifiutata', !!ctrl(evS, { ramoSin: 'casa', evento: 'acqua', dataSin: domani, luogoSin: 'x', descrizione: 'x' }).dataSin);
prova('sinistro: data di oggi accettata', !ctrl(evS, { ramoSin: 'casa', evento: 'acqua', dataSin: oggi, luogoSin: 'x', descrizione: 'x' }).dataSin);
const campoData = evS.campi.find(c => c.id === 'dataSin');
prova('sinistro: oltre 3 giorni compare l\'avviso art. 1913', !!campoData.avviso('2020-01-01') && campoData.avviso(oggi) === null);
prova('sinistro auto, scontro: si chiede il CAI', attivi(evS, { ramoSin: 'auto', evento: 'scontro', controparte: 'si' }).some(c => c.id === 'cai'));
const docS = vm.runInContext('docSinistro', ctx);
prova('sinistro furto: tra i documenti c\'è la denuncia', docS({ evento: 'furto' }).some(d => /denuncia/i.test(d)));
prova('sinistro: le opzioni di evento cambiano col ramo', vm.runInContext('valore', ctx)(evS.campi[0].opzioni, { ramoSin: 'auto' }).some(o => o.v === 'scontro') && !vm.runInContext('valore', ctx)(evS.campi[0].opzioni, { ramoSin: 'casa' }).some(o => o.v === 'scontro'));
const dannoS = QS.passi.find(p => p.id === 'danno');
prova('sinistro: senza IBAN né impegno la pratica si ferma', /impegno/.test(ctrl(dannoS, { ramoSin: 'casa' }).iban || ''));
prova('sinistro: con l\'impegno a consegnare l\'IBAN si prosegue', !ctrl(dannoS, { ramoSin: 'casa', ibanImpegno: true }).iban);
prova('sinistro: con l\'IBAN valido l\'impegno non serve e sparisce', !ctrl(dannoS, { ramoSin: 'casa', iban: 'IT60X0542811101000000123456' }).iban && !attivi(dannoS, { iban: 'IT60X0542811101000000123456' }).some(c => c.id === 'ibanImpegno'));
prova('sinistro: l\'impegno compare tra le cose da verificare del backoffice', vm.runInContext('segnalazioni', ctx)(QS, { ramoSin: 'casa', ibanImpegno: true }).some(x => /entro 3 giorni/.test(x.testo)));
prova('sinistro auto, scontro: targa della controparte obbligatoria', !!ctrl(evS, { ramoSin: 'auto', evento: 'scontro', dataSin: oggi, luogoSin: 'x', descrizione: 'x', controparte: 'si', contNome: 'Luigi', cai: 'si' }).contTarga);
prova('sinistro auto, urto contro cose: targa controparte non obbligatoria', !ctrl(evS, { ramoSin: 'auto', evento: 'urtoCose', dataSin: oggi, luogoSin: 'x', descrizione: 'x' }).contTarga);
/* ---- Vita: compliance specifica ---- */
const chiu = Q.vita.passi[Q.vita.passi.length - 1];
prova('vita: compaiono adeguatezza e antiriciclaggio', (ids => ids.includes('adeguatezza') && ids.includes('antiriciclaggio'))(attivi(chiu, { _prodotto: 'pac' }).map(c => c.id)));
prova('casa: adeguatezza e antiriciclaggio non compaiono', !attivi(chiu, { _prodotto: 'casa' }).some(c => c.id === 'adeguatezza'));
/* ---- D&O e Cyber ---- */
const QD = Q.do, visD = r => passiVis(QD, r).map(p => p.id);
const bil = QD.passi.find(p => p.id === 'bilancio');
prova('D&O ordine: niente fatturato, quotazione e fusioni', (ids => !ids.includes('fatturato') && !ids.includes('quotata'))(attivi(bil, { tipoEnte: 'ordine' }).map(c => c.id)) && !attivi(QD.passi.find(p => p.id === 'operazioni'), { tipoEnte: 'ordine' }).some(c => c.id === 'fusioni'));
prova('D&O ordine: responsabilità amministrativa sempre proposta', attivi(bil, { tipoEnte: 'ordine' }).some(c => c.id === 'respAmm'));
prova('D&O società: oltre 100 mln di attivo avviso', !!bil.campi.find(c => c.id === 'totAttivo').avviso(150e6, { tipoEnte: 'societa' }));
prova('D&O: con precedenti la descrizione diventa obbligatoria', !!ctrl(QD.passi.find(p => p.id === 'precedenti'), { tipoEnte: 'societa', eventiDo: ['penali'], altraPolizza: 'no' }).eventiDoDesc);
const QC = Q.cyber, dim = vm.runInContext('dimCyber', ctx);
prova('Cyber: dimensione dal fatturato', dim({ tipoCyber: 'studio', fatturato: 800000 }) === 'prof' && dim({ tipoCyber: 'societa', fatturato: 5e6 }) === 'pmi' && dim({ tipoCyber: 'societa', fatturato: 300e6 }) === 'midcorp' && dim({ tipoCyber: 'societa', fatturato: 50e6 }) === 'oltre');
prova('Cyber studio: niente passo Misure', !passiVis(QC, { tipoCyber: 'studio', fatturato: 500000 }).some(p => p.id === 'misure'));
prova('Cyber midcorp: domande aggiuntive (EDR)', attivi(QC.passi.find(p => p.id === 'misure'), { tipoCyber: 'societa', fatturato: 400e6 }).some(c => c.id === 'edr'));
const gar = QC.passi.find(p => p.id === 'garanzie'), opzMass = r => vm.runInContext('valore', ctx)(gar.campi[0].opzioni, r).map(o => o.v);
prova('Cyber: massimali oltre 1 mln esclusi sotto 1 mln di fatturato', !opzMass({ tipoCyber: 'societa', fatturato: 900000 }).includes('1500') && opzMass({ tipoCyber: 'societa', fatturato: 3e6 }).includes('3000'));
/* ---- RC: aree, professioni, percorsi nuovi (0.6) ---- */
const QR = Q.rcprof, visR = r => passiVis(QR, r).map(p => p.id), passoR = id => QR.passi.find(p => p.id === id);
const opzProf = area => V(passoR('prof').campi.find(c => c.id === 'professione').opzioni, { area }).map(o => o.v);
prova('RC: 6 aree e ogni professione in un\'area', vm.runInContext('AREE_PROF', ctx).length === 6 && Object.values(vm.runInContext('PROFESSIONI', ctx)).every(p => vm.runInContext('AREE_PROF', ctx).some(a => a.v === p.area)));
prova('RC: area immobiliare → 4 professioni', opzProf('immobiliare').length === 4);
prova('RC singolo progetto: niente attività/estensioni/massimale annuale, sì progetto', (ids => ids.includes('progetto') && !ids.includes('attivita') && !ids.includes('estensioni') && !ids.includes('garanzie'))(visR({ copertura: 'progetto' })));
prova('RC Merloni: data consegna obbligatoria', !!ctrl(passoR('progetto'), { copertura: 'progetto', tipoProgetto: 'merloni' }).consegnaProgetto);
prova('RC avvocato: dichiarazione procedure e certificazione tributaria', (ids => ids.includes('noProcedure') && ids.includes('noCertTributaria'))(attivi(passoR('precedenti'), { copertura: 'annuale', professione: 'avvocato' }).map(c => c.id)));
prova('RC IT: 5 dichiarazioni specifiche', attivi(passoR('precedenti'), { copertura: 'annuale', professione: 'it' }).filter(c => /^no(Medicale|Militare|Giochi|SwFinanza|Prodotti)$/.test(c.id)).length === 5);
prova('RC ingegnere dell\'informazione: danni materiali non proposti', !attivi(passoR('estensioni'), { copertura: 'annuale', professione: 'it', settoreIt: 'ingInfo' }).some(c => c.id === 'estMateriali'));
const mass = r => V(passoR('garanzie').campi[0].opzioni, r).map(o => o.v);
prova('RC mediatore: 500 fino a 100k, 750 oltre', mass({ professione: 'mediatore', fatturato: 80000 }).join() === '500' && mass({ professione: 'mediatore', fatturato: 150000 }).join() === '750');
prova('RC agente immobiliare: massimale dalla forma, con "Altro"', mass({ professione: 'agenteImm', forma: 'snc' }).join() === '520,altro');
prova('RC agente immobiliare: passo Proposta completa sempre presente', visR({ copertura: 'annuale', area: 'immobiliare', professione: 'agenteImm' }).includes('proposta'));
prova('RC avvocato oltre 200k: passo Proposta completa', visR({ copertura: 'annuale', professione: 'avvocato', fatturato: 250000 }).includes('proposta') && !visR({ copertura: 'annuale', professione: 'avvocato', fatturato: 150000 }).includes('proposta'));
prova('RC: un "Non confermo" porta al passo Proposta completa', visR({ copertura: 'annuale', professione: 'commerc', fatturato: 100000, noCircostanze: 'no' }).includes('proposta'));
prova('RC visto: niente estensioni, franchigia solo con 730', !visR({ copertura: 'annuale', professione: 'visto' }).includes('estensioni') && !attivi(passoR('garanzie'), { professione: 'visto', con730: 'no' }).some(c => c.id === 'franchigia') && attivi(passoR('garanzie'), { professione: 'visto', con730: 'si' }).some(c => c.id === 'franchigia'));
prova('RC tecnici: superbonus con fatturato asseverazioni obbligatorio', !!ctrl(passoR('estensioni'), { copertura: 'annuale', professione: 'architetto', forma: 'singolo', superbonus: 'si' }).sbFatturato);
/* ---- RC enti pubblici e strutture sanitarie, D&O singolo ---- */
const QPO = Q.po, visPO = r => passiVis(QPO, r).map(p => p.id);
prova('P&O persona: passi incarichi, niente ente', (ids => ids.includes('incarichi') && !ids.includes('ente'))(visPO({ poChi: 'persona' })));
prova('P&O ente: passo ente, niente incarichi', (ids => ids.includes('ente') && !ids.includes('incarichi'))(visPO({ poChi: 'ente' })));
const garPO = QPO.passi.find(p => p.id === 'garanziePO');
prova('P&O: danni per incarichi amministrativi solo per A1/A2', attivi(garPO, { poChi: 'persona', incarico: 'A1' }).some(c => c.id === 'estDanniAmm') && !attivi(garPO, { poChi: 'persona', incarico: 'T1' }).some(c => c.id === 'estDanniAmm'));
prova('P&O: rinuncia RC solo non apicali', attivi(garPO, { poChi: 'persona', incarico: 'T2' }).some(c => c.id === 'rinunciaRC') && !attivi(garPO, { poChi: 'persona', incarico: 'A1' }).some(c => c.id === 'rinunciaRC'));
prova('P&O: dichiarazioni sulle società solo se ci sono società', attivi(QPO.passi.find(p => p.id === 'incarichi'), { poChi: 'persona', tipoEntePO: 'societa' }).some(c => c.id === 'socBilancio') && !attivi(QPO.passi.find(p => p.id === 'incarichi'), { poChi: 'persona', tipoEntePO: 'pubblico' }).some(c => c.id === 'socBilancio'));
const QSan = Q.sanita, visS = r => passiVis(QSan, r).map(p => p.id);
prova('Sanità casa di cura: passo dedicato, niente dichiarazioni standard', (ids => ids.includes('casaCura') && !ids.includes('dichiarazioniSan') && !ids.includes('prestazioni'))(visS({ tipoSan: 'casacura' })));
prova('Sanità ambulatoriale: prestazioni senza posti letto', (ids => ids.some(x => x.startsWith('prest_')) && !ids.some(x => x.startsWith('letti_')))(attivi(QSan.passi.find(p => p.id === "prestazioni"), { tipoSan: 'ambulatoriale' }).map(c => c.id)));
const sirOpz = r => V(QSan.passi.find(p => p.id === "garanzieSan").campi.find(c => c.id === 'sir').opzioni, r).map(o => o.v);
prova('Sanità: SIR 2.500 solo per ambulatoriali', sirOpz({ tipoSan: 'ambulatoriale' }).includes('2500') && !sirOpz({ tipoSan: 'residenziale' }).includes('2500'));
prova('D&O singolo: passo incarichi, niente bilancio della società', (ids => ids.includes('incarichiDo') && !ids.includes('bilancio'))(passiVis(Q.do, { doChi: 'persona' }).map(p => p.id)));
prova('D&O singolo: avviso per sindaco/revisore', Q.do.passi.find(p => p.id === 'incarichiDo').campi.find(c => c.id === 'tipoIncDo').avviso(['sindaco'], {}).livello === 'rosso');
prova('Albero: RC professionale, D&O, enti pubblici, sanità sotto Responsabilità civile', (n => n && ['rcprof', 'do', 'po', 'sanita'].every(id => n.figli.some(f => f.id === id && Q[f.questionario])))(vm.runInContext('percorsoNodo', ctx)('az-rc').slice(-1)[0]));
/* ---- Guida: IBAN e lettera di disdetta ---- */
prova('Guida: IBAN dell\'agenzia valido', iban(vm.runInContext('COORDINATE_AGENZIA', ctx).iban));
prova('Guida: nessuna password nei contenuti', !/password\s*:/i.test(fs.readFileSync('src/26_dati_contenuti.js', 'utf8')));
/* ---- PDF: si genera ed è leggibile ---- */
const pratica = { id: 'p1', tipo: 'preventivo', questionario: 'rcprof', prodotto: 'rcprof', risposte: { _segmento: 'az', _prodotto: 'rcprof', copertura: 'annuale', area: 'tecnica', professione: 'architetto', forma: 'studio', nome: 'Studio Àlfa & Bèta', piva: '01234567890', email: 'a@b.it', tel: '333', docTipo: 'no', fatturato: 180000, altraPolizza: 'no', noRichieste: 'si', noCircostanze: 'no', circ_fatti: 'Contestazione (verbale) su un cantiere a Varese — importo stimato 20.000 €', massimale: '1000', mup: 'si', privacy: 'si' } };
const blob = vm.runInContext('creaPDF', ctx)(pratica, { nome: 'Andrea Commerciale', email: 'andrea@lloydvaresino.it', tel: '0332 289520' });
blob.arrayBuffer().then(async buf => {
  fs.writeFileSync('prove/prova.pdf', Buffer.from(buf));
  const { execSync } = require('child_process');
  let testo = ''; try { testo = execSync('pdftotext -layout prove/prova.pdf -').toString(); } catch (e) { testo = ''; }
  prova('PDF: leggibile e con i dati principali', /Studio Àlfa & Bèta/.test(testo) && /RC professionale/.test(testo) && /180\.000/.test(testo) && /€/.test(testo));
  prova('PDF: segnalazione della dichiarazione non confermata', /Non confermato/.test(testo));
  prova('PDF: parentesi e trattino lungo resi correttamente', /\(verbale\)/.test(testo) && /—/.test(testo));
  const info = execSync('pdfinfo prove/prova.pdf').toString();
  console.log('PDF:', (info.match(/Pages:\s+\d+/) || [''])[0].replace(/\s+/, ' '), '·', Math.round(buf.byteLength / 1024), 'KB');
  const dis = vm.runInContext('creaDisdettaPDF', ctx)({ nome: 'Mario Rossi', indirizzo: 'Via Roma 1, Varese', compagnia: 'Compagnia Prova', polizza: '123/45', scadenza: '2026-12-31', luogo: 'Varese', data: '2026-10-01' });
  await dis.arrayBuffer().then(b2 => fs.writeFileSync('prove/disdetta.pdf', Buffer.from(b2)));
  const tDis = execSync('pdftotext -layout prove/disdetta.pdf -').toString();
  prova('Disdetta: PDF con oggetto, scadenza e revoca consenso', /disdetta della polizza n\. 123\/45/.test(tDis) && /31\/12\/2026/.test(tDis) && /Revoco/.test(tDis));
  const email = vm.runInContext('testoEmail', ctx)(pratica, { nome: 'Andrea' }, 1700);
  prova('testo email entro il limite di lunghezza', email.length <= 1700);
  console.log(`${ok} prove superate, ${ko} fallite`);
  process.exit(ko ? 1 : 0);
});
return;
console.log(`${ok} prove superate, ${ko} fallite`);
process.exit(ko ? 1 : 0);

})();
