# Bussola · Lloyd Varesino

**Versione 0.7** · strumento interno della rete commerciale

Bussola guida il commerciale nella raccolta dei dati per i preventivi, nella denuncia dei sinistri e negli adempimenti di compliance. Alla fine prepara un riepilogo in PDF da inviare al backoffice giusto.

L'app funziona da telefono, tablet, PC e Mac, anche senza connessione. Non ha un server: i dati restano sul dispositivo finché la pratica non viene inviata.

---

## Cosa fa

### Preventivi
La navigazione segue l'albero dei prodotti dell'agenzia: **Persona fisica / Azienda → area → prodotto**. I prodotti già disponibili sono:

| Area | Prodotto | Note |
|---|---|---|
| Persona fisica · Rami elementari | **Casa** | Questionario interno, neutro rispetto alle compagnie: ogni garanzia ha la spiegazione da dare al cliente ed è consigliata in base alle caratteristiche della casa |
| Persona fisica · Vita investimento | **Piano di accumulo**, **Fondo pensione** | Con l'analisi patrimoniale (Mini Family Office) integrata |
| Azienda · Rami elementari | **Commercio**, **Azienda**, **Industria** | Sezioni A–G (incendio, danni indiretti, furto, guasti macchine, assistenza informatica, RC, tutela legale), con garanzie aggiuntive consigliate |
| Azienda · Rami elementari | **Ufficio** | |
| Azienda · Rami elementari | **Cyber risk** | Il prodotto dipende dalla dimensione: professionisti, PMI, Midcorp |
| Azienda · Responsabilità civile | **RC professionale** | Si sceglie l'area (6 voci) e poi la professione: tecnici, area economica e visto di conformità, avvocati, mediazione e OCC, immobiliare e intermediazione, informatica e consulenza, certificazione, ambiente e sicurezza. Anche per un singolo progetto (opera pubblica, verifica, ATI) |
| Azienda · Responsabilità civile | **RC amministratori (D&O)** | Società, enti no profit, ordini professionali, singolo amministratore o dirigente |
| Azienda · Responsabilità civile | **RC enti pubblici e dipendenti** | Amministratori e dipendenti pubblici (singoli o in gruppo), enti, progettisti e verificatori interni |
| Azienda · Responsabilità civile | **RC strutture sanitarie** | RSA e strutture residenziali, poliambulatori e centri medici, case di cura |

Gli altri prodotti compaiono con l'etichetta *presto*.

**I questionari sono interni all'agenzia e neutri rispetto alle compagnie:** raccolgono l'unione delle garanzie viste nei documenti delle compagnie, con nomi nostri e una spiegazione da dire al cliente. Il commerciale costruisce la copertura sui bisogni del cliente; il backoffice riceve nel PDF, in una nota a parte, quali compagnie offrono ciascuna garanzia e quota su tutte. Le domande comuni a più moduli si fanno una volta sola. Le domande che non servono non compaiono. L'app segnala subito i casi fuori standard: dichiarazioni non confermate, soglie superate, rischi aggravati.

### Dati del cliente
- Partita IVA e codice fiscale sono alternativi: basta uno dei due.
- Dal codice fiscale l'app ricava sesso, data e luogo di nascita e controlla che corrisponda al nome.
- Email, telefono e documento d'identità sono obbligatori. Il documento si può anche fotografare.

### Sinistri
Il percorso è unico per tutti i rami. Per ogni tipo di evento l'app indica i documenti da raccogliere. Controlla l'IBAN e avvisa quando la denuncia è in ritardo rispetto ai 3 giorni previsti dall'art. 1913 del codice civile.

### Compliance e Guida
Contengono schede di promemoria (MUP, privacy, adeguatezza, antiriciclaggio) e regole operative per ramo. **Sono una bozza da validare in agenzia.**

La Guida contiene anche le coordinate bancarie dell'agenzia (con il tasto per copiare IBAN e BIC) e i **documenti utili**: la lettera di disdetta del cliente, che si compila e diventa un PDF da firmare (i dati non vengono salvati), e la procedura per la presa visione della documentazione POG con il collegamento al cloud dell'agenzia. Le credenziali di accesso al cloud non sono nell'app, perché il sito è pubblico.

### Invio al backoffice
1. Il commerciale controlla il riepilogo e sceglie il destinatario. L'app propone i destinatari a turno per distribuire il lavoro.
2. L'app crea il PDF con logo, dati, segnalazioni e allegati.
3. L'invio cambia in base al dispositivo:
   - **telefono e Mac:** si condividono PDF e allegati con l'app di posta;
   - **PC Windows:** si scaricano i file e si apre l'email già compilata.
4. Si tocca **Ho inviato**: la pratica e gli allegati vengono cancellati dal dispositivo.

Le pratiche non inviate si cancellano da sole dopo 7 giorni. Si possono eliminare prima con il cestino accanto alla pratica (due tocchi, per evitare errori) o con «Elimina questa pratica» in fondo al questionario. Il pulsante con la casetta, in alto a destra, riporta alla home: la pratica iniziata resta salvata, quella aperta e lasciata vuota non viene conservata.

---

## Installazione sui dispositivi

- **Android:** aprire l'indirizzo del sito in Chrome, poi menu ⋮ → *Installa app* (oppure installare l'APK generato con PWABuilder).
- **iPhone e iPad:** aprire l'indirizzo in Safari, poi *Condividi → Aggiungi a Home*.
- **PC e Mac:** aprire l'indirizzo in Chrome o Edge, poi l'icona di installazione nella barra dell'indirizzo. In alternativa basta usarla nel browser.

---

## Pubblicazione (GitHub Pages)

Nel repository vanno i file prodotti dalla composizione (cartella `dist/`):

```
index.html            l'app completa (un solo file)
manifest.webmanifest  nome, colori e icone per l'installazione
sw.js                 funzionamento offline
icona-192.png  icona-512.png  icona-maskable-512.png
README.md             questo documento
```

Per aggiornare si **estrae lo zip** e si caricano i 7 file al posto dei vecchi (**Add file → Upload files**, trascinando i file e non lo zip: GitHub non lo apre). Dopo il caricamento GitHub impiega uno o due minuti a pubblicare: lo si vede nella scheda **Actions** (pallino verde). Il nome della cache in `sw.js` cambia da solo a ogni composizione e l'app mostra la versione nuova alla prima apertura con rete.

Il repository e il sito sono **pubblici**: si vedono il codice, i questionari e gli indirizzi del backoffice. I dati dei clienti invece non passano mai da GitHub.

---

## Per chi sviluppa

Il codice sorgente è diviso in blocchi, che vengono ricomposti in un unico file.

| Blocco | Contenuto |
|---|---|
| `src/01_testa.html` | aspetto grafico e struttura della pagina |
| `src/10_dati_agenzia.js` | destinatari, albero dei prodotti, versione |
| `src/15_dati_luoghi.js` | codici catastali per il codice fiscale (generato) |
| `src/16_dati_mfo.js` | Mini Family Office adattato (generato) |
| `src/17_codice_fiscale.js` | controllo e decodifica del codice fiscale |
| `src/20…26_dati_*.js` | questionari e schede, **descritti come dati** (`21_dati_rc.js`: RC professionale, enti pubblici, strutture sanitarie) |
| `src/30_logica.js` | regole, controlli, memoria, allegati, IBAN |
| `src/35_riepilogo_pdf.js` | riepilogo, testo email, PDF |
| `src/40_interfaccia.js`, `src/50_avvio.js` | schermate ed eventi |

Per aggiungere un prodotto si aggiunge un questionario nei file `2x_dati_*.js` e il nodo corrispondente in `ALBERO` (`10_dati_agenzia.js`). Non serve toccare il resto.

### Comandi
```
python3 ricomponi.py              # ricompone dist/ con la versione attuale
python3 ricomponi.py --rilascio   # alza la versione (0.1 → 0.2) e ricompone
python3 strumenti/prepara_mfo.py  # riprepara il Mini Family Office dall'originale
python3 strumenti/genera_luoghi.py <cartella dati>   # rigenera i codici catastali
```

### Verifiche
```
node strumenti/test_logica.js          # regole senza interfaccia
node strumenti/prova_completa.js 1366  # percorsi completi, PC
node strumenti/prova_completa.js 390   # percorsi completi, telefono
node strumenti/prova_property.js 390   # percorso azienda completo
node strumenti/prova_casa.js 390       # percorso casa
node strumenti/prova_home.js 390       # home ed eliminazione delle pratiche
node strumenti/prova_aggiornamento.js "python3 ricomponi.py --rilascio"   # una nuova versione si vede alla prima apertura
```
Le prove nel browser richiedono Playwright e un server locale avviato dentro `dist/` (`python3 -m http.server 8765`).

---

## Versioni

### 0.7 — 01/10/2026
- Aggiornamenti visibili subito: la pagina si scarica prima dalla rete (dalla copia salvata solo se la rete manca) e, quando arriva una versione nuova, l'app si ricarica da sola una volta. Le pratiche in corso restano salvate.
- Chi aveva già installato la 0.6 o una versione precedente vede la nuova alla seconda apertura; dalla 0.7 in poi basta la prima.

### 0.6 — 01/10/2026
- Nuova voce **Responsabilità civile** sotto Azienda: RC professionale, RC amministratori (D&O), RC enti pubblici e dipendenti, RC strutture sanitarie.
- RC professionale: si sceglie l'area e poi la professione. Nuove professioni dai moduli DUAL: avvocati, organismi di mediazione, OCC, agenti immobiliari, amministratori di condominio, mediatori creditizi, periti assicurativi, informatica e web, consulenza aziendale, marketing e privacy, enti di certificazione, società di revisione, solo visto di conformità. Dichiarazioni, estensioni e massimali propri di ciascuna.
- RC professionale per un singolo progetto: progettazione di opere pubbliche, verifica di progetto, progetto in ATI.
- Asseverazioni Superbonus, Ecobonus, Sismabonus per i tecnici.
- Quando la compagnia vuole la proposta completa (professione, fatturato oltre soglia, una dichiarazione non confermata) compare un passo con i dati in più.
- D&O per il singolo amministratore o dirigente.
- RC enti pubblici e dipendenti: singolo, gruppo, ente (per dipendenti o retribuzioni), progetti di opere pubbliche.
- RC strutture sanitarie: residenziali, ambulatoriali, case di cura.
- Guida: coordinate bancarie dell'agenzia e sezione Documenti utili (lettera di disdetta in PDF, procedura POG).

### 0.5 — 01/10/2026
- Pulsante Home (casetta) in alto a destra in tutte le schermate interne: la pratica iniziata resta salvata, quella vuota non viene conservata.
- Eliminazione delle pratiche non completate: cestino nell'elenco della home e «Elimina questa pratica» in fondo al questionario e al riepilogo, sempre con conferma in due tocchi. Con la pratica si cancellano anche gli allegati.

### 0.4 — 01/10/2026
- Sinistro auto: nello scontro con un altro veicolo la targa della controparte è obbligatoria (avviso se non ha il formato delle targhe italiane, senza bloccare).
- Sinistri: IBAN obbligatorio. In alternativa il commerciale spunta l'impegno a consegnarlo entro 3 giorni; il backoffice lo trova tra le cose da verificare.

### 0.3 — 30/09/2026
- Casa neutra rispetto alle compagnie: niente nomi né codici di compagnia per il commerciale, garanzie con nomi dell'agenzia e spiegazione da dire al cliente, elenco a righe leggibile.
- Nel PDF una nota solo per il backoffice: per ogni garanzia scelta, le compagnie che la offrono (indicativo, dai DIP) e gli eventuali codici.
- Azienda: tolte lettere di sezione e codici di compagnia dalle voci (restano nella nota per il backoffice).

### 0.2 — 30/09/2026
- Casa costruita sui DIP aggiuntivi di AXA (Nuova Protezione Casa), Unipol e Helvetia: scelta delle compagnie da quotare, per ogni garanzia l'indicazione di chi la offre.
- Le caratteristiche della casa (animali, figli, colf, pannelli, cassaforte, allarme, giardino…) si raccolgono in una sola domanda a spunta; da lì sezioni e garanzie consigliate.
- Casa: proprietario o inquilino (rischio locativo), B&B e affittacamere, somma furto e massimale RC obbligatori.
- Azienda: sezioni A–G, somma furto, massimale RC 1/3/5 milioni, RCO, garanzie aggiuntive consigliate in automatico dal DIP.
- Analisi patrimoniale (vita) a tutta larghezza e con la stessa grafica dell'app.
- Numero di versione visibile nella home e nel PDF; cache offline aggiornata in automatico a ogni pubblicazione.

### 0.1 — 30/09/2026
Prima versione funzionante:
- preventivi Casa, Ufficio, RC professionale, Commercio/Azienda/Industria, D&O, Cyber risk, Piano di accumulo e Fondo pensione con analisi patrimoniale;
- sinistri per tutti i rami;
- schede di Compliance e Guida (bozza);
- riepilogo in PDF, invio al backoffice con destinatari a turno, cancellazione dopo l'invio;
- installabile e utilizzabile offline.
