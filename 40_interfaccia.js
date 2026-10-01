/* =====================================================================
   INTERFACCIA: schermate, disegno dei campi, navigazione.
   ===================================================================== */

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const ICONE = {
  preventivo: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
  sinistro:   '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/></svg>',
  compliance: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  guida:      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M9 7h6"/></svg>',
  freccia:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  attenzione: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>'
};

/* ---------- stato di navigazione ---------- */
const Stato = { pila: [], pratica: null, errori: {} };

function vai(schermo, dati) {
  Stato.pila.push({ schermo, dati: dati || {} });
  try { history.pushState({ n: Stato.pila.length }, ""); } catch (e) {}
  disegna();
}
function indietro() {
  if (Stato.schermo() === "questionario" && Stato.pratica && Stato.pratica.passo > 0) {
    Stato.pratica.passo--; Stato.errori = {}; Pratiche.salva(Stato.pratica); disegna(); window.scrollTo(0, 0); return;
  }
  if (Stato.pila.length > 1) { Stato.pila.pop(); disegna(); }
}
Stato.schermo = () => Stato.pila[Stato.pila.length - 1].schermo;
Stato.dati = () => Stato.pila[Stato.pila.length - 1].dati;

/* ---------- misura reale delle barre: niente altezze supposte ---------- */
function misura() {
  const r = document.documentElement.style;
  r.setProperty("--h-barra", $("#barra").offsetHeight + "px");
  const az = $("#azioni");
  r.setProperty("--h-azioni", az.hidden ? "0px" : az.offsetHeight + "px");
}

function impostaBarra(titolo, sotto, conIndietro, progresso) {
  $("#titolo").textContent = titolo;
  $("#sottotitolo").textContent = sotto || "";
  $("#btnIndietro").hidden = !conIndietro;
  $("#btnHome").hidden = !conIndietro;
  document.body.classList.toggle("interno", !!conIndietro);
  const p = $("#progresso");
  if (progresso) {
    p.hidden = false;
    p.innerHTML = Array.from({ length: progresso.totale }, (_, i) => `<i class="${i < progresso.ora ? "fatto" : i === progresso.ora ? "ora" : ""}"></i>`).join("");
  } else { p.hidden = true; p.innerHTML = ""; }
}
function impostaAzioni(html) {
  const az = $("#azioni");
  if (html) { az.hidden = false; $("#azioniRiga").innerHTML = html; } else { az.hidden = true; $("#azioniRiga").innerHTML = ""; }
}

function disegna() {
  const s = Stato.schermo();
  ({ home: vistaHome, albero: vistaAlbero, questionario: vistaQuestionario, riepilogo: vistaRiepilogo, schede: vistaSchede })[s]();
  misura();
}

/* ================= HOME ================= */
function vistaHome() {
  impostaBarra(AGENZIA.app, "", false, null);
  impostaAzioni(null);
  Pratiche.tutte().filter(praticaVuota).forEach(p => Pratiche.elimina(p.id));   /* aperte e lasciate vuote: non servono */
  const bozze = Pratiche.tutte();
  setTimeout(() => { Stato.messaggio = null; }, 0);
  $("#vista").innerHTML = `
    ${Stato.messaggio ? `<div class="avviso verde" style="margin-bottom:14px">✓ <span>${esc(Stato.messaggio)}</span></div>` : ""}
    <div class="saluto"><h2>Cosa devi fare?</h2><p>Scegli un'attività: ti guido passo per passo.</p></div>
    <div class="griglia">
      <button class="tessera grande" data-az="preventivo">
        <span class="ico">${ICONE.preventivo}</span>
        <span style="flex:1"><b>Nuovo preventivo</b><small>Questionario guidato e invio al backoffice</small></span>
        ${ICONE.freccia}
      </button>
      <button class="tessera" data-az="sinistro"><span class="ico rosso">${ICONE.sinistro}</span><span><b>Sinistro</b><small>Dati per aprire la pratica</small></span></button>
      <button class="tessera" data-az="compliance"><span class="ico verde">${ICONE.compliance}</span><span><b>Compliance</b><small>MUP, privacy, adeguatezza</small></span></button>
      <button class="tessera" data-az="guida" style="grid-column:1 / -1;min-height:0;flex-direction:row;align-items:center">
        <span class="ico ambra">${ICONE.guida}</span><span style="flex:1"><b>Guida dell'agenzia</b><small>Procedure e schede per ramo</small></span>${ICONE.freccia}</button>
    </div>
    <div class="sezione-titolo">Pratiche da completare</div>
    ${bozze.length ? bozze.map(p => {
      const q = QUESTIONARI[p.questionario];
      const nome = p.risposte.nome || "Cliente senza nome";
      const tot = passiVisibili(q, p.risposte).length;
      return `<div class="riga-pratica"><button class="pratica" data-apri="${p.id}"><span class="ico blu" style="width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center">${p.tipo === "sinistro" ? ICONE.sinistro : ICONE.preventivo}</span>
        <div><b>${esc(nome)}</b><small>${esc((percorsoNodo(p.prodotto) || [{ nome: q.titolo }]).map(n => n.nome).join(" › "))} · passo ${Math.min(p.passo + 1, tot)} di ${tot}</small></div>${ICONE.freccia}</button>
        <button class="elimina" data-elimina="${p.id}" aria-label="Elimina la pratica di ${esc(nome)}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button></div>`;
    }).join("") : `<div class="vuoto">Nessuna pratica in sospeso.<br>Le pratiche inviate vengono cancellate da questo dispositivo.</div>`}
    <p class="nota-piccola">${esc(AGENZIA.app)} versione ${esc(AGENZIA.versione)} · ${esc(AGENZIA.dataBuild)}</p>
    ${Memoria.disponibile() ? "" : `<div class="avviso ambra" style="margin-top:12px">${ICONE.attenzione}<span>Questo browser non permette di salvare: se chiudi la pagina perdi la pratica in corso.</span></div>`}
  `;
}

/* ================= ALBERO DEI PRODOTTI ================= */
function vistaAlbero() {
  const id = Stato.dati().nodo;
  const strada = id ? percorsoNodo(id) : [];
  const nodo = strada[strada.length - 1];
  const figli = nodo ? nodo.figli : ALBERO;
  impostaBarra(nodo ? nodo.nome : "Nuovo preventivo", "", true, null);
  impostaAzioni(null);
  const domanda = !nodo ? "Per chi è il preventivo?" : strada.length === 1 ? "Quale area?" : "Quale prodotto?";
  $("#vista").innerHTML = `
    ${strada.length ? `<div class="briciole">${strada.map(n => esc(n.nome)).join(" › ")}</div>` : ""}
    <div class="passo-titolo">${domanda}</div>
    <p class="passo-sotto">${!nodo ? "Da qui dipendono le domande sui dati del cliente." : "I prodotti con l'etichetta «presto» arriveranno nelle prossime versioni."}</p>
    <div class="elenco albero">
      ${figli.map(n => {
        if (n.figli) {
          const pronti = contaPronti(n), tot = contaTotali(n);
          return `<button class="voce" data-nodo="${n.id}"><div><b>${esc(n.nome)}</b><small>${esc(n.nota || n.figli.map(f => f.nome).join(", "))}</small></div>
            <span class="etichetta-presto ${pronti ? "pronti" : ""}">${pronti}/${tot} pronti</span>${ICONE.freccia}</button>`;
        }
        return `<button class="voce" data-prodotto="${n.id}" ${n.questionario ? "" : "disabled"}>
          <div><b>${esc(n.nome)}</b>${n.nota ? `<small>${esc(n.nota)}</small>` : ""}</div>
          ${n.questionario ? ICONE.freccia : '<span class="etichetta-presto">presto</span>'}</button>`;
      }).join("")}
    </div>`;
}

/* ================= QUESTIONARIO ================= */
/* Anteprime delle foto allegate, caricate dopo il disegno della pagina */
async function caricaAnteprime() {
  for (const el of document.querySelectorAll("[data-anteprima]")) {
    if (!/^image\//.test(el.dataset.tipo) || el.firstChild) continue;
    const blob = await Allegati.leggi(el.dataset.anteprima);
    if (!blob) { el.textContent = "?"; el.title = "File non più disponibile: ricaricalo"; continue; }
    const img = new Image(); img.alt = ""; img.src = URL.createObjectURL(blob); img.onload = () => URL.revokeObjectURL(img.src);
    el.appendChild(img);
  }
}

async function aggiungiFile(idCampo, files) {
  const stato = document.querySelector(`[data-stato-file="${idCampo}"]`);
  const lista = (Stato.pratica.risposte[idCampo] || []).slice();
  const problemi = [];
  for (const f of files) {
    if (stato) stato.textContent = `Preparo ${f.name}…`;
    try { const { blob, nome } = await preparaFile(f); lista.push(await Allegati.salva(Stato.pratica.id, blob, nome)); }
    catch (e) { problemi.push(`${f.name}: ${e.message}`); }
  }
  rispondi(idCampo, lista, true);
  const st2 = document.querySelector(`[data-stato-file="${idCampo}"]`);
  if (st2 && problemi.length) { st2.textContent = problemi.join(" · "); st2.classList.add("errore"); }
}

function vistaQuestionario() {
  const p = Stato.pratica, q = QUESTIONARI[p.questionario], r = p.risposte;
  const passi = passiVisibili(q, r);
  if (p.passo >= passi.length) p.passo = passi.length - 1;
  const passo = passi[p.passo];
  applicaSuggeriti(passo, r);
  impostaBarra(titoloPratica(p), `${p.passo + 1} di ${passi.length}`, true, { totale: passi.length, ora: p.passo });
  const ultimo = p.passo === passi.length - 1;
  const passoMFO = passo.campi.some(c => c.tipo === "mfo");
  impostaAzioni(`${p.passo > 0 ? '<button class="btn secondario-largo" data-az="indietro">Indietro</button>' : ""}<button class="btn primario" data-az="avanti" ${passoMFO && !r.mfo ? "disabled" : ""}>${
    passoMFO ? (r.mfo ? "Avanti: documenti e compliance" : "Completa l'analisi per proseguire") : ultimo ? "Vai al riepilogo" : "Avanti"}</button>`);
  p.massimo = Math.max(p.massimo || 0, p.passo);
  const lato = passi.map((x, i) => `<button data-passo="${i}" class="${i === p.passo ? "ora" : i < p.passo ? "fatto" : ""}" ${i <= p.massimo ? "" : "disabled"}>
      <span class="n">${i < p.passo ? "✓" : i + 1}</span>${esc(x.titolo)}</button>`).join("");
  $("#vista").innerHTML = `<div class="layout-q"><nav class="passi-lato" aria-label="Passi">${lato}</nav><div>
    <div class="passo-titolo">${esc(passo.titolo)}</div>
    <p class="passo-sotto">${esc(passo.sotto || "")}</p>
    <div id="campi">${disegnaCampi(passo.campi, r)}</div>
    <button class="elimina-pratica" data-elimina="${p.id}" data-dentro="1">Elimina questa pratica</button></div></div>`;
  caricaAnteprime();
  avviaMFO();
}

function disegnaCampi(lista, r) { return lista.filter(c => campoVisibile(c, r)).map(c => disegnaCampo(c, r)).join(""); }

function disegnaCampo(c, r) {
  const v = r[c.id], dom = valore(c.dom, r), err = Stato.errori[c.id];
  const aiuto = c.aiuto ? `<div class="aiuto">${esc(valore(c.aiuto, r))}</div>` : "";
  let corpo = "";
  switch (c.tipo) {
    case "testo": case "email": case "tel":
      corpo = `<input type="${c.tipo === "testo" ? "text" : c.tipo}" id="f_${c.id}" data-campo="${c.id}" value="${esc(v)}"
        ${c.tastiera ? `inputmode="${c.tastiera}"` : ""} ${c.maiuscolo ? 'style="text-transform:uppercase"' : ""} autocomplete="off">`; break;
    case "data":
      corpo = `<input type="date" id="f_${c.id}" data-campo="${c.id}" value="${esc(v)}">`; break;
    case "nota":
      corpo = `<textarea id="f_${c.id}" data-campo="${c.id}">${esc(v)}</textarea>`; break;
    case "euro":
      corpo = `<div class="euro"><input type="text" inputmode="numeric" id="f_${c.id}" data-campo="${c.id}" data-euro="1"
        value="${v ? Number(v).toLocaleString("it-IT") : ""}" placeholder="0"></div>`; break;
    case "sino":
      corpo = `<div class="scelte due">${pill(c.id, "si", "Sì", v, "")}${pill(c.id, "no", "No", v, "")}</div>`; break;
    case "conferma":
      corpo = `<div class="scelte due">${pill(c.id, "si", "Confermo", v, "si")}${pill(c.id, "no", "Non confermo", v, "no")}</div>`; break;
    case "scelta": {
      const opz = valore(c.opzioni, r) || [];
      corpo = `<div class="${c.verticale ? "elenco" : "scelte"}">${opz.map(o => c.verticale
        ? `<button class="voce" data-campo="${c.id}" data-v="${esc(o.v)}" aria-pressed="${v === o.v}" style="${v === o.v ? "border-color:var(--blu);box-shadow:inset 0 0 0 1px var(--blu);background:var(--blu-chiaro)" : ""}">
             <div><b style="font-size:16px">${esc(o.t)}</b>${o.n ? `<small>${esc(o.n)}</small>` : ""}</div>${v === o.v ? "✓" : ""}</button>`
        : pill(c.id, o.v, o.t, v, "")).join("")}</div>`; break;
    }
    case "allegato": {
      const lista = Array.isArray(v) ? v : [];
      corpo = `<div class="allegati">${lista.map(f => `<div class="allegato">
          <span class="anteprima" data-anteprima="${esc(f.id)}" data-tipo="${esc(f.tipo)}">${f.tipo === "application/pdf" ? "PDF" : ""}</span>
          <div><b>${esc(f.nome)}</b><small>${(f.dim / 1024 < 1000 ? Math.max(1, Math.round(f.dim / 1024)) + " KB" : (f.dim / 1048576).toFixed(1) + " MB")}</small></div>
          <button class="btn piccolo" data-togli="${esc(c.id)}|${esc(f.id)}" aria-label="Rimuovi ${esc(f.nome)}">Rimuovi</button></div>`).join("")}
        <div class="stato-file" data-stato-file="${c.id}"></div>
        <label class="btn aggiungi"><input type="file" multiple accept="image/*,application/pdf" data-allegato="${c.id}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          ${lista.length ? "Aggiungi altro" : "Scatta una foto o scegli un file"}</label></div>`; break;
    }
    case "flag":
      return `<div class="campo" data-box="${c.id}"><button class="spunta impegno" data-flag="${c.id}" aria-pressed="${v === true}">
          <span class="casella">${v === true ? "✓" : ""}</span><span class="testo-spunta"><b>${esc(dom)}</b></span></button>
        <div data-avviso="${c.id}">${htmlAvviso(c, r)}</div>${err ? `<div class="errore">${esc(err)}</div>` : ""}</div>`;
    case "info": {
      corpo = `<ul class="lista-schede">${(valore(c.elenco, r) || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul>`; break;
    }
    case "mfo":
      /* l'analisi occupa tutto lo spazio, senza la cornice degli altri campi */
      return `<div data-box="mfo" class="mfo-campo">
        <div id="mfoEsito">${htmlEsitoMFO(r)}</div>${err ? `<div class="errore">${esc(err)}</div>` : ""}
        <iframe id="mfoFrame" title="Analisi patrimoniale" style="height:900px"></iframe></div>`;
    case "multipla": {
      const sel = Array.isArray(v) ? v : [];
      const consigliate = c.suggerito ? c.suggerito(r) : [];
      let gruppoPrec = null;
      const etichetta = o => consigliate.includes(o.v) ? ' <span class="consigliata">consigliata</span>' : "";
      const gruppo = o => o.g && o.g !== gruppoPrec ? `<div class="gruppo-opz">${esc(gruppoPrec = o.g)}</div>` : "";
      corpo = c.verticale
        /* elenco a righe: titolo, spiegazione da dire al cliente, spunta */
        ? `<div class="elenco-spunte">${(valore(c.opzioni, r) || []).map(o => gruppo(o) +
            `<button class="spunta" data-campo="${c.id}" data-multi="${esc(o.v)}" aria-pressed="${sel.includes(o.v)}">
              <span class="casella">${sel.includes(o.v) ? "✓" : ""}</span>
              <span class="testo-spunta"><b>${esc(o.t)}${etichetta(o)}</b>${o.n ? `<small>${esc(o.n)}</small>` : ""}</span></button>`).join("")}</div>`
        : `<div class="scelte">${(valore(c.opzioni, r) || []).map(o => gruppo(o) +
            `<button class="pill lunga" data-campo="${c.id}" data-multi="${esc(o.v)}" aria-pressed="${sel.includes(o.v)}">${sel.includes(o.v) ? "✓ " : ""}${esc(o.t)}${o.n ? ` <span class="comp">${esc(o.n)}</span>` : ""}${etichetta(o)}</button>`).join("")}</div>`;
      break;
    }
  }
  const daCF = r._auto && r._auto[c.id] !== undefined && r._auto[c.id] === v;
  if (daCF) corpo += `<div class="aiuto" style="margin:6px 0 0">Ricavato dal codice fiscale</div>`;
  const elenco = c.elenco && c.tipo !== "info" ? `<ul>${c.elenco.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
  let figli = "";
  if (figliAperti(c, r)) figli = `<div class="sottocampi">${disegnaCampi(c.figli.campi, r)}</div>`;
  const corto = c.corto || !c.largo && ["testo", "email", "tel", "data", "euro"].includes(c.tipo) || (c.tipo === "sino" && !c.figli && !c.aiuto);
  const cls = (c.tipo === "conferma" ? "campo dichiarazione" : "campo") + (corto ? " corto" : "");
  const titolo = c.tipo === "conferma" ? `<div class="testo">${esc(dom)}</div>` : `<label for="f_${c.id}" class="dom">${esc(dom)}${valore(c.obbl, r) || c.tipo === "info" ? "" : ` <span style="font-weight:400;color:var(--testo-2);font-size:14px">(${c.almenoUno ? "basta uno tra P. IVA e C.F." : "facoltativo"})</span>`}</label>`;
  return `<div class="${cls}" data-box="${c.id}">${titolo}${elenco}${aiuto}${corpo}
    <div data-avviso="${c.id}">${htmlAvviso(c, r)}</div>${err ? `<div class="errore">${esc(err)}</div>` : ""}${figli}</div>`;
}

function pill(id, val, testo, attuale, tono) {
  return `<button class="pill ${tono}" data-campo="${id}" data-v="${esc(val)}" aria-pressed="${attuale === val}">${esc(testo)}</button>`;
}

function htmlAvviso(c, r) {
  const v = r[c.id]; let a = null;
  if (c.avvisoNo && v === "no") a = c.avvisoNo;
  if (!a && c.avviso && !vuoto(v)) a = c.avviso(c.tipo === "euro" ? Number(v) : v, r);
  if (!a && c.avvisoSe) a = c.avvisoSe(v, r);
  if (!a && c.avvisoVuoto && vuoto(v)) a = c.avvisoVuoto(r);
  return a ? `<div class="avviso ${a.livello}">${ICONE.attenzione}<span>${esc(a.testo)}</span></div>` : "";
}

/* "Firma" di ciò che è visibile: se cambia dopo una risposta, si ridisegna il passo */
function firmaPasso() {
  const p = Stato.pratica, q = QUESTIONARI[p.questionario], r = p.risposte;
  const passi = passiVisibili(q, r), passo = passi[Math.min(p.passo, passi.length - 1)];
  return passi.length + "|" + campiAttivi(passo, r).map(c => c.id + (c.tipo === "scelta" ? ":" + (valore(c.opzioni, r) || []).map(o => o.v).join(",") : "")).join(";");
}

function rispondi(id, val, ridisegnaSempre) {
  const prima = firmaPasso();
  Stato.pratica.risposte[id] = val;
  const cDer = trovaCampo(id);
  if (cDer && cDer.deriva) cDer.deriva(Stato.pratica.risposte);
  delete Stato.errori[id];
  const c0 = trovaCampo(id);
  if (c0 && c0.almenoUno && !vuoto(val)) for (const k of Object.keys(Stato.errori)) { const x = trovaCampo(k); if (x && x.almenoUno === c0.almenoUno) delete Stato.errori[k]; }
  Pratiche.salva(Stato.pratica);
  if (ridisegnaSempre || (cDer && cDer.deriva) || firmaPasso() !== prima) {
    /* Si ridisegna subito dopo che il cursore si è spostato sul campo successivo,
       poi gli si ridà il fuoco: così chi passa da un campo all'altro non perde il punto. */
    setTimeout(() => {
      if (Stato.schermo() !== "questionario") return;
      const att = document.activeElement, idAtt = att && att.id, sel = att && "selectionStart" in att ? [att.selectionStart, att.selectionEnd] : null;
      const y = window.scrollY; vistaQuestionario(); misura(); window.scrollTo(0, y);
      const nuovo = idAtt && document.getElementById(idAtt);
      if (nuovo && nuovo !== document.body) { nuovo.focus({ preventScroll: true }); try { if (sel) nuovo.setSelectionRange(sel[0], sel[1]); } catch (e) {} }
    }, 0);
  } else {
    /* gli avvisi possono dipendere da altri campi (es. codice fiscale e nome): si aggiornano tutti */
    document.querySelectorAll("[data-avviso]").forEach(box => { const c = trovaCampo(box.dataset.avviso); if (c) box.innerHTML = htmlAvviso(c, Stato.pratica.risposte); });
  }
}

function trovaCampo(id) {
  const q = QUESTIONARI[Stato.pratica.questionario];
  let trovato = null;
  (function giro(l) { for (const c of l) { if (c.id === id) trovato = c; if (c.figli) giro(c.figli.campi); } })(q.passi.flatMap(p => p.campi));
  return trovato;
}

function avanti() {
  const p = Stato.pratica, q = QUESTIONARI[p.questionario];
  const passi = passiVisibili(q, p.risposte);
  const err = controllaPasso(passi[p.passo], p.risposte);
  Stato.errori = err;
  if (Object.keys(err).length) {
    vistaQuestionario(); misura();
    const primo = document.querySelector(`[data-box="${Object.keys(err)[0]}"]`);
    if (primo) primo.scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }
  if (p.passo < passi.length - 1) { p.passo++; Pratiche.salva(p); try { history.pushState({}, ""); } catch (e) {} disegna(); window.scrollTo(0, 0); }
  else vai("riepilogo");
}

/* ================= RIEPILOGO (bozza) ================= */
function vistaRiepilogo() {
  const p = Stato.pratica, q = QUESTIONARI[p.questionario], r = p.risposte;
  const R = costruisciRiepilogo(p);
  const gruppo = p.tipo === "sinistro" ? "sinistri" : invioPer(p.prodotto);
  const D = DESTINATARI[gruppo];
  if (!p.destinatari) p.destinatari = destinatarioProposto(gruppo);
  const prof = Memoria.leggi("bussola.profilo", {});
  const condivisione = puoCondividereFile();
  impostaBarra("Riepilogo e invio", titoloPratica(p), true, null);
  impostaAzioni(`<button class="btn secondario-largo" data-az="anteprima">Anteprima PDF</button>
    <button class="btn primario" data-az="inviato" ${p.invioTentato ? "" : "disabled"}>Ho inviato: chiudi la pratica</button>`);
  const passi = passiVisibili(q, r);
  const indicePasso = titolo => passi.findIndex(x => x.titolo === titolo);
  $("#vista").innerHTML = `
    <div class="briciole">${esc(R.tipo)}${R.strada ? " · " + esc(R.strada) : ""}</div>
    <div class="passo-titolo">${esc(R.cliente)}</div>
    <p class="passo-sotto">Controlla i dati, poi invia al backoffice.</p>
    ${R.segnalazioni.length ? `<div class="campo"><div class="dom">Da verificare (${R.segnalazioni.length})</div>
      ${R.segnalazioni.map(a => `<div class="avviso ${a.livello}">${ICONE.attenzione}<span>${esc(a.testo)}</span></div>`).join("")}</div>` : ""}
    <div class="riepilogo">
    ${R.sezioni.filter(sz => !sz.soloBackoffice).map(sz => { const k = indicePasso(sz.titolo.replace(/^Analisi patrimoniale.*$/, "Analisi patrimoniale"));
      return `<div class="campo sezione-riep"><div class="riga-titolo"><div class="dom">${esc(sz.titolo)}</div>
        ${k >= 0 ? `<button class="btn piccolo" data-vai-passo="${k}">Modifica</button>` : ""}</div>
        <dl>${sz.righe.map(x => `<dt>${esc(x.dom)}</dt><dd class="${x.grave ? "grave" : ""}">${esc(x.risp)}</dd>`).join("")}</dl></div>`; }).join("")}
    ${R.allegati.length ? `<div class="campo"><div class="dom">Allegati (${R.allegati.length})</div>
      <dl>${R.allegati.map(a => `<dt>${esc(a.voce)}</dt><dd>${esc(a.nome)}</dd>`).join("")}</dl></div>` : ""}
    </div>

    <div class="sezione-titolo">Invio</div>
    <div class="campo">
      <div class="dom">Destinatario</div>
      ${D.modo === "scegli"
        ? `<div class="aiuto">Proposto a turno per distribuire il lavoro; puoi cambiarlo.</div><div class="scelte">${D.indirizzi.map(x =>
            `<button class="pill" data-dest="${esc(x)}" aria-pressed="${p.destinatari.includes(x)}">${esc(x.split("@")[0])}</button>`).join("")}</div>`
        : `<div>${D.indirizzi.map(esc).join(", ")}</div>`}
    </div>
    <div class="campo">
      <div class="dom">I tuoi dati (commerciale)</div>
      <div class="aiuto">Restano salvati su questo dispositivo e compaiono nel PDF.</div>
      <div class="griglia-2">
        <input type="text" data-profilo="nome" placeholder="Nome e cognome" value="${esc(prof.nome)}">
        <input type="email" data-profilo="email" placeholder="Email" value="${esc(prof.email)}">
        <input type="tel" data-profilo="tel" placeholder="Telefono" value="${esc(prof.tel)}">
      </div>
      <div class="errore" id="erroreProfilo"></div>
    </div>
    <div class="campo">
      <div class="dom">Come inviare</div>
      ${condivisione
        ? `<ol class="passi-invio"><li><b>Condividi</b> PDF e allegati e scegli la tua app di posta: l'indirizzo del backoffice viene copiato, incollalo nel destinatario.</li>
             <li>Poi torna qui e tocca <b>Ho inviato</b>: la pratica si cancella dal dispositivo.</li></ol>
           <div class="bottoni-invio"><button class="btn primario" data-az="condividi">Condividi PDF e allegati</button>
             <button class="btn" data-az="email">Solo email con il testo</button></div>`
        : `<ol class="passi-invio"><li><b>Scarica</b> il PDF${R.allegati.length ? " e gli allegati" : ""}.</li>
             <li><b>Apri l'email</b> già compilata (destinatario, oggetto, testo) e trascina dentro i file scaricati.</li>
             <li>Invia e torna qui: <b>Ho inviato</b> cancella la pratica dal dispositivo.</li></ol>
           <div class="bottoni-invio"><button class="btn primario" data-az="scarica">Scarica PDF${R.allegati.length ? ` e ${R.allegati.length} allegat${R.allegati.length === 1 ? "o" : "i"}` : ""}</button>
             <button class="btn" data-az="email">Apri email già compilata</button></div>`}
      <div class="stato-file" id="statoInvio"></div>
    </div>
    <button class="elimina-pratica" data-elimina="${p.id}" data-dentro="1">Elimina questa pratica</button>`;
}

function puoCondividereFile() {
  try { return !!(navigator.canShare && navigator.canShare({ files: [new File(["x"], "x.pdf", { type: "application/pdf" })] })); } catch (e) { return false; }
}
function profiloValido() {
  const pr = Memoria.leggi("bussola.profilo", {});
  const err = !pr.nome ? "Inserisci il tuo nome: il backoffice deve sapere chi ha mandato la pratica."
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pr.email || "") ? "Inserisci la tua email." : "";
  const box = $("#erroreProfilo"); if (box) box.textContent = err;
  if (err) { const el = document.querySelector('[data-profilo="' + (!pr.nome ? "nome" : "email") + '"]'); if (el) { el.focus(); el.scrollIntoView({ block: "center" }); } }
  return err ? null : pr;
}
function oggettoEmail(p) { return `[${p.tipo === "sinistro" ? "Sinistro" : "Preventivo"}] ${titoloPratica(p)} - ${p.risposte.nome || "cliente"}`; }
function segnaInviato(msg) {
  Stato.pratica.invioTentato = true; Pratiche.salva(Stato.pratica);
  const b = document.querySelector('[data-az="inviato"]'); if (b) b.disabled = false;
  const st = $("#statoInvio"); if (st) st.textContent = msg;
}
function scaricaBlob(blob, nome) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nome;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}
async function fileAllegati(p) {
  const out = [];
  for (const a of costruisciRiepilogo(p).allegati) {
    const b = await Allegati.leggi(a.id);
    if (b) out.push(new File([b], a.nome, { type: b.type || a.tipo }));
  }
  return out;
}
async function azioneInvio(tipo) {
  const p = Stato.pratica, pr = profiloValido(); if (!pr) return;
  const to = p.destinatari.join(",");
  if (tipo === "email") {
    const url = `mailto:${to}?subject=${encodeURIComponent(oggettoEmail(p))}&body=${encodeURIComponent(testoEmail(p, pr, 1700))}`;
    location.href = url;
    return segnaInviato("Email aperta nel programma di posta. Ricorda di allegare il PDF se l'hai scaricato.");
  }
  const pdf = new File([creaPDF(p, pr)], nomeFile(p, "pdf"), { type: "application/pdf" });
  const allegati = await fileAllegati(p);
  if (tipo === "scarica") {
    scaricaBlob(pdf, pdf.name);
    allegati.forEach((f, i) => setTimeout(() => scaricaBlob(f, f.name), 400 * (i + 1)));
    return segnaInviato(`Scaricati: ${[pdf.name].concat(allegati.map(f => f.name)).join(", ")}. Ora apri l'email già compilata.`);
  }
  if (tipo === "condividi") {
    try { await navigator.clipboard.writeText(to); } catch (e) {}
    try {
      await navigator.share({ files: [pdf].concat(allegati), title: oggettoEmail(p), text: `${oggettoEmail(p)}\nDestinatario: ${to}` });
      segnaInviato(`Condiviso. Indirizzo copiato: ${to}`);
    } catch (e) { if (e && e.name !== "AbortError") { const st = $("#statoInvio"); if (st) st.textContent = "Condivisione non riuscita: usa «Solo email» e allega il PDF a mano."; } }
  }
}
function chiudiPratica() {
  const p = Stato.pratica, gruppo = p.tipo === "sinistro" ? "sinistri" : invioPer(p.prodotto);
  if (DESTINATARI[gruppo] && DESTINATARI[gruppo].modo === "scegli") avanzaRotazione(gruppo);
  Pratiche.elimina(p.id);
  Stato.pratica = null; Stato.messaggio = `Pratica di ${p.risposte.nome || "cliente"} chiusa e cancellata da questo dispositivo.`;
  Stato.pila = [{ schermo: "home", dati: {} }];
  try { history.replaceState({ n: 1 }, ""); } catch (e) {}
  disegna(); window.scrollTo(0, 0);
}

/* ================= HOME ED ELIMINAZIONE ================= */
function praticaVuota(p) { return !Object.keys(p.risposte || {}).some(k => !k.startsWith("_") && !vuoto(p.risposte[k])); }
function vaiHome(messaggio) {
  const p = Stato.pratica;
  if (p && !praticaVuota(p)) { Pratiche.salva(p); messaggio = messaggio || `La pratica di ${p.risposte.nome || "cliente senza nome"} è salvata tra quelle da completare.`; }
  Stato.pratica = null; Stato.errori = {}; Stato.messaggio = messaggio || null;
  Stato.pila = [{ schermo: "home", dati: {} }];
  try { history.replaceState({ n: 1 }, ""); } catch (e) {}
  disegna(); window.scrollTo(0, 0);
}
/* Eliminazione in due tocchi (niente finestre di conferma del browser): il primo chiede conferma, il secondo elimina */
function chiediElimina(b) {
  const id = b.dataset.elimina;
  if (!b.classList.contains("conferma")) {
    document.querySelectorAll(".conferma[data-elimina]").forEach(x => x.classList.remove("conferma"));
    document.querySelectorAll(".avviso-elimina").forEach(x => x.remove());
    b.classList.add("conferma"); b.dataset.testo = b.innerHTML;
    let nota = null;
    if (b.dataset.dentro) b.textContent = "Tocca di nuovo per eliminare la pratica";
    else { nota = document.createElement("div"); nota.className = "avviso-elimina"; nota.textContent = "Tocca di nuovo il cestino rosso per eliminare la pratica";
           b.closest(".riga-pratica").after(nota); }
    setTimeout(() => { if (b.isConnected && b.classList.contains("conferma")) { b.classList.remove("conferma"); b.innerHTML = b.dataset.testo; if (nota) nota.remove(); } }, 4000);
    return;
  }
  const p = Pratiche.tutte().find(x => x.id === id) || Stato.pratica;
  const nome = (p && p.risposte.nome) || "cliente senza nome";
  Pratiche.elimina(id);
  if (b.dataset.dentro) { Stato.pratica = null; return vaiHome(`Pratica di ${nome} eliminata.`); }
  Stato.messaggio = `Pratica di ${nome} eliminata.`; disegna();
}

/* ================= COMPLIANCE E GUIDA ================= */
function vistaSchede() {
  const d = Stato.dati(), schede = d.tipo === "compliance" ? COMPLIANCE : GUIDA;
  impostaBarra(d.tipo === "compliance" ? "Compliance" : "Guida dell'agenzia", "", true, null);
  impostaAzioni(null);
  $("#vista").innerHTML = `
    <div class="passo-titolo">${d.tipo === "compliance" ? "Adempimenti dell'intermediario" : "Regole e buone pratiche"}</div>
    <p class="passo-sotto">Bozza da validare in agenzia: sono promemoria, non pareri.</p>
    <div class="schede">${d.tipo === "guida" ? htmlAgenzia() : ""}${schede.map(s => `<div class="campo"><div class="dom">${esc(s.titolo)}</div>
      <ul class="lista-schede">${s.voci.map(v => `<li>${esc(v)}</li>`).join("")}</ul></div>`).join("")}</div>`;
}

/* Guida: coordinate bancarie e documenti utili */
/* IBAN italiano diviso come sui documenti bancari: paese+controllo, CIN, ABI, CAB, conto */
const ibanLeggibile = x => /^IT\w{25}$/.test(x) ? [x.slice(0, 4), x[4], x.slice(5, 10), x.slice(10, 15), x.slice(15)].join(" ") : x.replace(/(.{4})/g, "$1 ").trim();
function htmlAgenzia() {
  const C = COORDINATE_AGENZIA, P = DOC_POG, D = Stato.disdetta || (Stato.disdetta = { data: new Date().toISOString().slice(0, 10) });
  const riga = (t, v, copia) => `<div class="riga-dato"><span>${esc(t)}</span><b>${esc(v)}</b>${copia ? `<button class="btn piccolo" data-copia="${esc(copia)}">Copia</button>` : ""}</div>`;
  const campo = (id, t, tipo, obbl) => `<label class="dis-campo"><span>${esc(t)}${obbl ? "" : " <small>(facoltativo)</small>"}</span>
      <input type="${tipo || "text"}" data-dis="${id}" value="${esc(D[id] || "")}" autocomplete="off"></label>`;
  return `<div class="campo"><div class="dom">Coordinate bancarie dell'agenzia</div>
      ${riga("Intestatario", C.intestatario)}${riga("IBAN", ibanLeggibile(C.iban), C.iban)}${riga("BIC", C.bic, C.bic)}
      ${riga("Banca", C.banca)}${riga("Sede", C.indirizzo)}
      <div data-esito-copia class="aiuto" style="min-height:1.2em;margin:6px 0 0"></div></div>
    <div class="campo"><div class="dom">Documenti utili</div>
      <details class="doc-utile"><summary>Lettera di disdetta del cliente</summary>
        <p class="aiuto">Compila e scarica il PDF: il cliente lo firma e lo invia alla compagnia con raccomandata A/R o PEC, rispettando il preavviso scritto nelle condizioni di polizza. I dati non vengono salvati.</p>
        <div class="dis-griglia">${campo("nome", "Nome e cognome del cliente", "", true)}${campo("cf", "Codice fiscale")}
          ${campo("indirizzo", "Indirizzo del cliente")}${campo("compagnia", "Compagnia", "", true)}
          ${campo("indComp", "Indirizzo o PEC della compagnia")}${campo("polizza", "Numero di polizza", "", true)}
          ${campo("scadenza", "Scadenza della polizza", "date", true)}${campo("luogo", "Luogo")}${campo("data", "Data", "date", true)}</div>
        <div class="errore" data-dis-errore></div>
        <button class="btn primario" data-az="disdettaPDF">Crea il PDF</button></details>
      <details class="doc-utile"><summary>${esc(P.titolo)}</summary>
        <p>${esc(P.testo)}</p>
        <p class="aiuto" style="margin-bottom:4px">Quando va fatta:</p>
        <ul class="lista-schede">${P.quando.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
        <p>${esc(P.accesso)} ${esc(P.nota)}</p>
        <p><a class="btn link" href="${esc(P.link)}" target="_blank" rel="noopener">Apri il cloud dell'agenzia</a></p>
        <p class="aiuto">Problemi di accesso: ${P.contatti.map(esc).join(" o ")}</p></details></div>`;
}
async function creaDisdetta() {
  const D = Stato.disdetta || {}, box = document.querySelector("[data-dis-errore]");
  const mancano = [["nome", "nome del cliente"], ["compagnia", "compagnia"], ["polizza", "numero di polizza"], ["scadenza", "scadenza"], ["data", "data"]].filter(([k]) => !String(D[k] || "").trim()).map(([, t]) => t);
  if (mancano.length) { box.textContent = "Manca: " + mancano.join(", "); return; }
  box.textContent = "";
  const blob = creaDisdettaPDF(D), nome = `Disdetta ${D.polizza} ${D.nome}`.replace(/[\\/:*?"<>|]/g, "").trim() + ".pdf";
  const file = new File([blob], nome, { type: "application/pdf" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: nome }); return; } catch (e) { if (e.name === "AbortError") return; } }
  scaricaBlob(blob, nome);
}

/* ================= ANALISI PATRIMONIALE (Mini Family Office in un riquadro) ================= */
function htmlEsitoMFO(r) {
  if (!r.mfo) return `<div class="avviso blu">${ICONE.attenzione}<span>Compila l'analisi con il cliente fino alla pagina dei risultati: poi si prosegue con documenti e compliance.</span></div>`;
  const M = r.mfo.risultati;
  return `<div class="avviso verde">✓ <span>Analisi completata: indice ${M.punteggio}/100, profilo ${esc(M.profilo)}. Puoi proseguire.</span></div>`;
}
function aggiornaEsitoMFO() {
  const r = Stato.pratica.risposte, box = $("#mfoEsito"), b = document.querySelector('[data-az="avanti"]');
  if (box) box.innerHTML = htmlEsitoMFO(r);
  if (b) { b.disabled = !r.mfo; b.textContent = r.mfo ? "Avanti: documenti e compliance" : "Completa l'analisi per proseguire"; }
}

function avviaMFO() {
  const fr = $("#mfoFrame"); if (!fr || fr.dataset.avviato) return;
  fr.dataset.avviato = "1";
  fr.srcdoc = MFO_HTML;   /* all'avvio il riquadro manda "pronto": lì si passano età e risposte salvate */
}
window.addEventListener("message", e => {
  const d = e.data; if (!d || d.bussola !== "mfo") return;
  const fr = $("#mfoFrame"); if (!fr || !Stato.pratica || e.source !== fr.contentWindow) return;
  const B = fr.contentWindow.__bussola, r = Stato.pratica.risposte;
  if (d.evento === "altezza") { fr.style.height = Math.max(600, d.h + 20) + "px"; return; }
  if (d.evento === "inCima") { const y = fr.getBoundingClientRect().top + window.scrollY - $("#barra").offsetHeight - 12; window.scrollTo({ top: Math.max(0, y) }); return; }
  if (!B) return;
  if (d.evento === "pronto") {
    if (r.dataNascita) B.preimposta({ eta: Math.floor((Date.now() - new Date(r.dataNascita)) / 31557600000) });
    if (r.mfoStato) B.ripristina(r.mfoStato);
    return;
  }
  r.mfoStato = B.stato();
  if (d.evento === "risultati") {
    r.mfo = { sintesi: B.sintesi(), risultati: B.risultati() };
    aggiornaEsitoMFO();
    delete Stato.errori.mfo; const err = document.querySelector('[data-box="mfo"] .errore'); if (err) err.remove();
  } else if ((d.evento === "ricomincia" || (d.evento === "cambio" && !r.mfoStato.risultati)) && r.mfo) { r.mfo = null; aggiornaEsitoMFO(); }
  Pratiche.salva(Stato.pratica);
});

/* ================= EVENTI ================= */
function collegaEventi() {
  $("#btnIndietro").addEventListener("click", () => { try { history.back(); } catch (e) { indietro(); } });
  window.addEventListener("popstate", () => indietro());

  document.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.az === "preventivo") return vai("albero", {});
    if (b.dataset.az === "sinistro") { Stato.pratica = Pratiche.nuova("sinistro", "sinistro"); Stato.errori = {}; return vai("questionario"); }
    if (b.dataset.az === "compliance") return vai("schede", { tipo: "compliance" });
    if (b.dataset.az === "guida") return vai("schede", { tipo: "guida" });
    if (b.dataset.az === "anteprima") { const pr = Memoria.leggi("bussola.profilo", {}); const w = window.open(URL.createObjectURL(creaPDF(Stato.pratica, pr)), "_blank"); if (!w) scaricaBlob(creaPDF(Stato.pratica, pr), nomeFile(Stato.pratica, "pdf")); return; }
    if (["condividi", "scarica", "email"].includes(b.dataset.az)) return azioneInvio(b.dataset.az);
    if (b.dataset.az === "inviato") return chiudiPratica();
    if (b.dataset.dest) { Stato.pratica.destinatari = [b.dataset.dest]; Pratiche.salva(Stato.pratica); document.querySelectorAll("[data-dest]").forEach(x => x.setAttribute("aria-pressed", x === b)); return; }
    if (b.dataset.vaiPasso !== undefined) { Stato.pratica.passo = Number(b.dataset.vaiPasso); Stato.errori = {}; Pratiche.salva(Stato.pratica); history.back(); window.scrollTo(0, 0); return; }
    if (b.id === "btnHome") return vaiHome();
    if (b.dataset.elimina) return chiediElimina(b);
    if (b.dataset.az === "disdettaPDF") return creaDisdetta();
    if (b.dataset.copia) {
      const out = document.querySelector("[data-esito-copia]");
      (navigator.clipboard ? navigator.clipboard.writeText(b.dataset.copia) : Promise.reject()).then(
        () => { if (out) out.textContent = "Copiato: " + b.dataset.copia; }, () => { if (out) out.textContent = "Copia non riuscita: selezionalo a mano."; });
      return;
    }
    if (b.dataset.az === "avanti") return avanti();
    if (b.dataset.az === "indietro") return $("#btnIndietro").click();
    if (b.dataset.passo !== undefined) { Stato.pratica.passo = Number(b.dataset.passo); Stato.errori = {}; Pratiche.salva(Stato.pratica); disegna(); window.scrollTo(0, 0); return; }
    if (b.dataset.nodo) return vai("albero", { nodo: b.dataset.nodo });
    if (b.dataset.prodotto) {
      const strada = percorsoNodo(b.dataset.prodotto), prod = strada[strada.length - 1];
      Stato.pratica = Pratiche.nuova("preventivo", prod.questionario);
      Stato.pratica.prodotto = prod.id;
      Stato.pratica.risposte._segmento = strada[0].id;      // "pf" persona fisica, "az" azienda
      Stato.pratica.risposte._prodotto = prod.id;
      Stato.errori = {};
      return vai("questionario");
    }
    if (b.dataset.apri) {
      Stato.pratica = Pratiche.tutte().find(x => x.id === b.dataset.apri); Stato.errori = {};
      return vai("questionario");
    }
    if (b.dataset.campo && b.dataset.multi !== undefined) {
      const att = Stato.pratica.risposte[b.dataset.campo] || [];
      const v = b.dataset.multi;
      return rispondi(b.dataset.campo, att.includes(v) ? att.filter(x => x !== v) : att.concat(v), true);
    }
    if (b.dataset.campo && b.dataset.v !== undefined) return rispondi(b.dataset.campo, b.dataset.v, true);
    if (b.dataset.flag) { const id = b.dataset.flag; delete Stato.errori.iban; return rispondi(id, Stato.pratica.risposte[id] !== true, true); }
    if (b.dataset.togli) {
      const [campo, idf] = b.dataset.togli.split("|");
      Allegati.elimina(idf);
      return rispondi(campo, (Stato.pratica.risposte[campo] || []).filter(f => f.id !== idf), true);
    }
  });

  document.addEventListener("input", e => {
    const t = e.target;
    if (t.dataset && t.dataset.dis) { (Stato.disdetta = Stato.disdetta || {})[t.dataset.dis] = t.value; return; }
    if (t.dataset && t.dataset.profilo) { const pr = Memoria.leggi("bussola.profilo", {}); pr[t.dataset.profilo] = t.value.trim(); Memoria.scrivi("bussola.profilo", pr); return; } if (!t.dataset || !t.dataset.campo) return;
    if (t.dataset.euro) {
      const n = t.value.replace(/\D/g, "");
      Stato.pratica.risposte[t.dataset.campo] = n ? Number(n) : "";
      Pratiche.salva(Stato.pratica);
      const box = document.querySelector(`[data-avviso="${t.dataset.campo}"]`), c = trovaCampo(t.dataset.campo);
      if (box && c) box.innerHTML = htmlAvviso(c, Stato.pratica.risposte);
    } else { Stato.pratica.risposte[t.dataset.campo] = t.value; Pratiche.salva(Stato.pratica); }
  });
  document.addEventListener("change", e => {
    const t = e.target;
    if (t.dataset && t.dataset.allegato) { const fl = Array.from(t.files || []); t.value = ""; if (fl.length) aggiungiFile(t.dataset.allegato, fl); return; } if (!t.dataset || !t.dataset.campo) return;
    if (t.dataset.euro) { const n = t.value.replace(/\D/g, ""); t.value = n ? Number(n).toLocaleString("it-IT") : ""; rispondi(t.dataset.campo, n ? Number(n) : ""); }
    else rispondi(t.dataset.campo, t.value);
  });

  window.addEventListener("resize", misura);
  if (window.ResizeObserver) { const ro = new ResizeObserver(misura); ro.observe($("#barra")); ro.observe($("#azioni")); }
}
