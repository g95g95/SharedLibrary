# SharedLibrary

Una piattaforma per creare una piccola biblioteca diffusa in comunità e borghi, con interfacce moderne (Angular o React) e un backend che espone l'API sullo schema SQL proposto.

## Obiettivi
- Permettere a residenti e visitatori di trovare, offrire e prestare libri all'interno della comunità selezionata.
- Offrire una UI accattivante, mobile-first, con flussi chiari per registrazione, inserimento libri e ricerca.
- Integrare funzioni smart (riconoscimento ISBN da codice a barre, contatto rapido via email) per ridurre l'attrito.

## Struttura del repository
- `database/schema.sql`: script PostgreSQL pronto per Supabase (istanza "Local_Library_Project"), include tabelle per utenti applicativi (`app_users`) con password hash.
- `server/`: backend Express + Supabase con endpoint REST per autenticazione, villaggi e libri.
- `web/`: front-end React (Vite) con layout moderno per selezione comunità, login/registrazione, ricerca e inserimento libri.

## Setup rapido
### Backend (`server`)
1. Copia `.env.example` in `.env` e imposta le variabili di Supabase (URL e Service Role Key).
2. Installa le dipendenze: `npm install`.
3. Avvia in sviluppo: `npm run dev` (porta di default 4000). Lo script usa `tsx watch`, che supporta ESM/TypeScript senza flag aggiuntivi anche su Windows; non è più necessario `--esm`, che causava l'errore `node.exe: bad option: --esm` in alcuni ambienti.

Endpoint principali:
- `POST /api/auth/register` e `POST /api/auth/login`
- `GET /api/villages`
- `GET /api/books` (filtri: `search`, `genreId`, `villageId`)
- `POST /api/books` (richiede titolo, autore, genere; upsert automatici di autore/genere)

### Frontend (`web`)
1. Copia `.env.example` in `.env` e imposta `VITE_API_BASE` (es: `http://localhost:4000`). Se vuoi testare il path di GitHub Pages in locale, imposta anche `VITE_BASE_PATH` (es: `/Local_Library_Project/`).
2. Installa le dipendenze: `npm install`.
3. Avvia in sviluppo: `npm run dev` (porta di default 5173).

Funzionalità già disponibili:
- Selettore di comunità/villaggio (filtra le query libro).
- Login/registrazione con username/password (tab nel pannello destro).
- Tabella libri con mailto precompilato per contattare il possessore.
- Form di inserimento libro (richiede login) con autore/genere upsert su Supabase.

### Test locali end-to-end
Per provare l'app completa su `localhost`:
1. **Database:** assicurati che l'istanza Supabase ("Local_Library_Project") abbia caricato `database/schema.sql`.
2. **Backend:**
   - `cd server`
   - `cp .env.example .env` e compila `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
   - `npm install`
   - `npm run dev`
3. **Frontend:**
   - In un altro terminale `cd web`
   - `cp .env.example .env` e imposta `VITE_API_BASE=http://localhost:4000`.
   - `npm install`
   - `npm run dev`
4. Apri `http://localhost:5173` e prova: seleziona un villaggio, registra/login, inserisci un libro e fai ricerche.

> Nota: se vuoi simulare il path di GitHub Pages in locale, imposta `VITE_BASE_PATH=/Local_Library_Project/` (o il nome del repo) nel `.env` del frontend.

## Deploy su GitHub Pages
La UI React è statica e viene distribuita automaticamente dal workflow GitHub Actions `Deploy web to GitHub Pages` quando si effettua un push su `main` **o** `work`.

1. Attiva GitHub Pages dalle impostazioni del repository selezionando **GitHub Actions** come sorgente e il branch `gh-pages` pubblicato dal workflow (non il branch `main`, che mostrerebbe solo il README).
2. Configura l'URL pubblico della tua API come variabile `VITE_API_BASE` nelle Repository Variables (Settings → Secrets and variables → Actions → Variables). Se non impostato, la build userà `http://localhost:4000` come fallback.
3. Il base path è impostato automaticamente sul nome del repository (`/${repo}/`); non serve aggiornarlo manualmente dopo un rename, ma puoi sovrascriverlo via `VITE_BASE_PATH` se necessario.
4. Il workflow builda `web/` con Vite, carica l'artefatto `web/dist` e lo pubblica su `gh-pages` usando `actions/deploy-pages` e `actions/configure-pages`.

## Deploy del backend su Render
Render ha un free tier per i servizi web hobby (risorse limitate e avvio a freddo), sufficiente per test e demo.

1. Accedi a [Render](https://dashboard.render.com/) e scegli **New → Web Service** collegando questo repository.
2. **Root directory:** `server`
3. **Runtime:** Node.js 18+ (seleziona la versione supportata da Render più vicina).
4. **Build command:** `npm install && npm run build`
5. **Start command:** `npm run start`
6. **Env Vars:** aggiungi `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT` (opzionale, Render fornisce `PORT` automaticamente), `NODE_ENV=production`.
7. Deploya: Render installerà le dipendenze, compila TypeScript e avvierà `dist/server.js`. Copia l'URL pubblico del servizio e usalo come `VITE_API_BASE` nel frontend (Pages).
8. (Opzionale) Abilita i log persistenti e health checks per monitorare uptime e errori.

## Modello dati di riferimento
Lo schema seguente (PostgreSQL) è la base del backend. Le tabelle chiave sono:
- `villages`: anagrafica delle comunità/borgate con coordinate opzionali.
- `authors`, `genres`, `books`: catalogo bibliografico con riferimenti a autore/genre, stato del libro e campo `whohasit` per tracciare il possessore.
- `conditions`: tabella di lookup con i possibili stati di conservazione.
- `library_users`: utenti registrati del sistema.
- `app_users`: credenziali applicative con password hash (Bcrypt) per login/registrazione.
- `loans`: storico dei prestiti con date di inizio/scadenza/restituzione.

Indice principali e trigger aggiornano i timestamp e ottimizzano le ricerche testuali sul titolo.

## Note di sicurezza
- Non committare la Service Role Key di Supabase; usa le variabili d'ambiente.
- Le password sono salvate con Bcrypt nel campo `password_hash`.

## Risoluzione errori comuni
- **Errore "Could not find the table `public.app_users` in the schema cache"**: capita quando il database Supabase è vuoto o non ha caricato `database/schema.sql`. PostgREST legge una cache dello schema: finché la tabella non esiste, l'API rifiuta le chiamate di login/registrazione. Per risolvere:
  1. Apri la console di Supabase → **SQL** → incolla e lancia `database/schema.sql` (oppure `supabase db push --db-url "$SUPABASE_DB_URL"`).
  2. Attendi qualche secondo che la cache si aggiorni (oppure riavvia il servizio PostgREST da **Database → Rest** se necessario).
  3. Riprova il login/registrazione: la tabella `app_users` sarà presente e l'API tornerà a rispondere.

## Estensioni future
- Integrazione API ISBN (Open Library/Google Books) per completare i metadati da barcode.
- Notifiche email/push per scadenze dei prestiti e richieste.
- Gamification e dashboard amministrativa.
