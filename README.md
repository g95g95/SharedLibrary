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
3. Avvia in sviluppo: `npm run dev` (porta di default 4000).

Endpoint principali:
- `POST /api/auth/register` e `POST /api/auth/login`
- `GET /api/villages`
- `GET /api/books` (filtri: `search`, `genreId`, `villageId`)
- `POST /api/books` (richiede titolo, autore, genere; upsert automatici di autore/genere)

### Frontend (`web`)
1. Copia `.env.example` in `.env` e imposta `VITE_API_BASE` (es: `http://localhost:4000`).
2. Installa le dipendenze: `npm install`.
3. Avvia in sviluppo: `npm run dev` (porta di default 5173).

Funzionalità già disponibili:
- Selettore di comunità/villaggio (filtra le query libro).
- Login/registrazione con username/password (tab nel pannello destro).
- Tabella libri con mailto precompilato per contattare il possessore.
- Form di inserimento libro (richiede login) con autore/genere upsert su Supabase.

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

## Estensioni future
- Integrazione API ISBN (Open Library/Google Books) per completare i metadati da barcode.
- Notifiche email/push per scadenze dei prestiti e richieste.
- Gamification e dashboard amministrativa.
