#!/usr/bin/env python3
"""Prepara il Mini Family Office per l'inclusione nel file unico.
- adegua colori e carattere a quelli dell'agenzia
- corregge i testi sulla privacy (ora i dati possono essere inviati all'agenzia)
- nasconde l'intestazione (c'è già la barra dell'app)
- aggiunge un "ponte" per dialogare con l'app: salvare e ripristinare le risposte,
  ricavare riepilogo e risultati per il PDF, avvisare quando si arriva ai risultati
Scrive src/16_dati_mfo.js con la pagina come stringa."""
import json, pathlib, sys
base = pathlib.Path(__file__).parent.parent
s = (base / "risorse" / "mini_family_office_originale.html").read_text(encoding="utf-8")

def sostituisci(vecchio, nuovo, obbligatorio=True):
    global s
    if vecchio not in s:
        if obbligatorio: sys.exit(f"Testo non trovato nel Mini Family Office: {vecchio[:60]!r}")
        return
    s = s.replace(vecchio, nuovo)

sostituisci("Nessun dato viene salvato su server, inviato via email o condiviso. Chiudendo la pagina, i dati vengono persi. La pagina funziona anche offline.",
            "I calcoli avvengono sul dispositivo. Le risposte arrivano all'agenzia solo alla fine, se il cliente chiede di essere ricontattato. La pagina funziona anche offline.")
sostituisci("nessun dato lascia il tuo browser · non è consulenza personalizzata.",
            "i dati restano sul dispositivo fino all'invio all'agenzia · non è consulenza personalizzata.")
sostituisci("🔒 Promemoria privacy: nessun dato è stato salvato o inviato. Chiudendo la pagina tutto viene cancellato.",
            "🔒 Promemoria privacy: i dati restano su questo dispositivo finché non vengono inviati all'agenzia; dopo l'invio vengono cancellati.")
sostituisci("I dati restano nel tuo browser", "Lloyd Varesino")

stile = """
/* ---- adattamento Bussola: stessa grafica dell'app (colori, carattere, misure) ---- */
:root{ --brand:#294d95; --brand-2:#23507d; --accent:#1f7a4d; --ok:#1f7a4d; --ok-bg:#e5f3ec; --warn:#9a5b00; --warn-bg:#fdf1dc;
  --bad:#a3272b; --bad-bg:#fbe6e6; --bg:#f4f7fa; --card:#fff; --line:#d9e2ef; --ink:#282828; --ink-soft:#5b6573;
  --radius:14px; --shadow:none;
  --font:"Poppins",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif; }
html{font-size:17px} body{font-size:1rem;line-height:1.45;background:var(--bg)}
header.site{display:none}
.wrap{max-width:none;padding:0 0 8px}
.card{border:1px solid var(--line);border-radius:14px;box-shadow:none;padding:18px 16px;margin:0 0 12px}
.card h2{font-size:1.3rem;font-weight:700;color:var(--ink);margin-bottom:8px}
.card h3{font-size:1.05rem;color:var(--ink)}
.muted{font-size:.9rem}
.btn{min-height:52px;border-radius:12px;padding:0 20px;font-size:1rem;font-weight:600;display:inline-flex;align-items:center;justify-content:center;gap:8px}
.btn-primary{background:var(--brand)} .btn-primary:hover{filter:none;background:var(--brand-2)}
.btn-ghost{border:1px solid var(--line);color:var(--ink);background:#fff}
.btn-sm{min-height:40px;padding:0 12px;font-size:.85rem}
.wiznav{margin-top:16px} .wiznav .btn{flex:1}
#progressBarOuter{height:6px;background:var(--line)} #progressBarInner{background:var(--accent)}
.progress-meta{font-size:.85rem}
.stepchips{gap:6px} .stepchip{font-size:.8rem;padding:5px 12px;background:#fff}
.stepchip.active{background:var(--brand)} .stepchip.done{background:var(--ok-bg)}
.q{margin:0 0 12px;padding:14px;border:1px solid var(--line);border-radius:14px;background:#fff}
.q label.qlabel{font-size:1rem;font-weight:600;margin-bottom:8px}
.q .qhelp{font-size:.85rem}
.opts{gap:8px}
.opt{min-height:48px;padding:10px 14px;border:1px solid var(--line);border-radius:10px;background:#fbfcfd;font-size:.95rem;font-weight:500}
.opt:hover{border-color:var(--brand)}
.opt.checked{background:var(--brand);border-color:var(--brand);color:#fff;font-weight:600}
.opt.checked input{accent-color:#fff}
select.fsel,.precise input{min-height:50px;border:1px solid var(--line);border-radius:10px;font-size:1rem;background:#fbfcfd}
.precise input{width:200px}
.kpi{background:#fff;border-radius:14px} .kpi .v{font-size:1.25rem}
.light-card,.alloc-card,.tip,.badge-card,.mission{border-radius:14px}
.alert{border-radius:10px}
.resnav{background:rgba(244,247,250,.97)}
.resnav a{font-size:.85rem;padding:8px 14px}
#xpBar{background:var(--accent)}
footer.site{display:none}
@media (min-width:900px){ html{font-size:16px} .card{padding:22px 24px} .opts{display:grid;grid-template-columns:1fr 1fr} }
"""
sostituisci("</style>", stile + "</style>\n<link href=\"https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap\" rel=\"stylesheet\">", True)

ponte = r"""
/* ============ PONTE CON BUSSOLA (aggiunto in fase di composizione) ============ */
(function(){
  const avvisa = (evento, dati) => { try { parent.postMessage(Object.assign({ bussola: "mfo", evento }, dati || {}), "*"); } catch (e) {} };
  const pulisci = t => String(t == null ? "" : t).replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}️‍]/gu, "").replace(/\s+/g, " ").trim();
  /* dentro Bussola la pagina non scorre da sola: chiede all'app di tornare in cima */
  window.scrollTo = function(){ avvisa("inCima"); };
  const avvolgi = (nome, evento) => {
    const orig = window[nome]; if (typeof orig !== "function") return;
    window[nome] = function(){ const r = orig.apply(this, arguments); avvisa(evento); return r; };
  };
  ["setAnswer", "setPrecise", "toggleMulti", "nextStep", "prevStep", "gotoStep", "startWizard"].forEach(n => avvolgi(n, "cambio"));
  avvolgi("showResults", "risultati");
  avvolgi("restart", "ricomincia");

  window.__bussola = {
    stato(){ return { A: JSON.parse(JSON.stringify(A)), passo: currentStep, risultati: !byId("results").hidden, iniziato: byId("intro").hidden }; },
    ripristina(st){
      if (!st || !st.A) return;
      A = st.A;
      if (st.risultati) { try { showResults(); return; } catch (e) {} }
      if (st.iniziato) { byId("intro").hidden = true; byId("wizard").hidden = false; currentStep = Math.min(st.passo || 0, STEPS.length - 1); renderStep(); }
    },
    preimposta(d){
      if (d.eta != null && !A.eta) {
        const e = d.eta; A.eta = e < 30 ? "u30" : e < 40 ? "30_39" : e < 50 ? "40_49" : e < 60 ? "50_59" : e < 70 ? "60_69" : "70p";
      }
    },
    sintesi(){
      return QUESTIONS.filter(q => isVisible(q) && isAnswered(q))
        .map(q => ({ sez: pulisci(SECTION_TITLES[q.step] || q.step), dom: pulisci(q.label), risp: pulisci(labelOf(q.id)) }));
    },
    risultati(){
      const M = computeAll();
      const prof = { conservativo: "Prudente", bilanciato: "Bilanciato", dinamico: "Dinamico" }[M.risk.profile];
      return {
        punteggio: computeHealthScore(M.lights), percorso: M.tierLabel,
        patrimonioNetto: M.nw.netWorth, reddito: M.cf.income, risparmioAnno: M.cf.savingsY, tassoRisparmio: M.cf.savingsRate,
        mesiEmergenza: M.ef.months, rateSuReddito: M.debt.rateOnIncome, investibile: M.investable,
        profilo: prof, avvisiProfilo: (M.risk.warnings || []).map(pulisci),
        obiettivo: pulisci(M.goalLabel), importoObiettivo: M.goal, anni: M.years,
        proiezione: { prudente: M.projLow.final, base: M.projBase.final, favorevole: M.projHigh.final },
        semafori: M.lights.map(l => ({ nome: pulisci(l.name), livello: l.level, perche: pulisci(l.why) })),
        coperture: M.ins.gaps.map(g => ({ area: pulisci(g.area), livello: g.level, perche: pulisci(g.why) }))
      };
    }
  };
  /* comunica l'altezza della pagina, così l'app mostra tutto senza doppie barre di scorrimento */
  const misura = () => avvisa("altezza", { h: Math.ceil(document.documentElement.scrollHeight) });
  if (window.ResizeObserver) new ResizeObserver(misura).observe(document.body);
  window.addEventListener("load", misura);
  avvisa("pronto");
})();
"""
i = s.rindex("</script>")
s = s[:i] + ponte + s[i:]
out = base / "src" / "16_dati_mfo.js"
out.write_text("/* Mini Family Office preparato per Bussola (generato da strumenti/prepara_mfo.py, non modificare a mano) */\n"
               "const MFO_HTML = " + json.dumps(s, ensure_ascii=False).replace("</script", "<\\/script").replace("<!--", "<\\!--") + ";\n", encoding="utf-8")
print(f"MFO: {len(s)/1024:.0f} KB → {out.name}")
