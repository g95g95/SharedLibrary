# SharedLibrary

Una piattaforma per creare una piccola biblioteca diffusa in comunità e borghi, con interfacce moderne (Angular o React) e un backend che espone l'API sullo schema SQL proposto.

## Obiettivi
- Permettere a residenti e visitatori di trovare, offrire e prestare libri all'interno della comunità selezionata.
- Offrire una UI accattivante, mobile-first, con flussi chiari per registrazione, inserimento libri e ricerca.
- Integrare funzioni smart (riconoscimento ISBN da codice a barre, contatto rapido via email) per ridurre l'attrito.

## Modello dati di riferimento
Lo schema seguente (PostgreSQL) è la base del backend. Le tabelle chiave sono:
- `villages`: anagrafica delle comunità/borgate con coordinate opzionali.
- `authors`, `genres`, `books`: catalogo bibliografico con riferimenti a autore/genre, stato del libro e campo `whohasit` per tracciare il possessore.
- `conditions`: tabella di lookup con i possibili stati di conservazione.
- `library_users`: utenti registrati del sistema (estendibile con credenziali applicative).
- `loans`: storico dei prestiti con date di inizio/scadenza/restituzione.

Indice principali e trigger aggiornano i timestamp e ottimizzano le ricerche testuali sul titolo.

## Flusso utente previsto
1. **Selezione comunità**: la homepage mostra la lista dei `villages` (ricerca GIN sul nome). La scelta filtra l'intero catalogo sui libri disponibili in quella comunità.
2. **Registrazione / accesso**: form dedicato per creare o recuperare l'account (username/password da aggiungere a `library_users`). Dopo l'accesso sono disponibili le azioni di aggiunta/modifica libro.
3. **Inserimento libro**:
   - Form manuale con i campi di `books` (titolo, autore, genere, anno, editore, descrizione, condizione, possessore).
   - Upload/scatto foto del codice a barre ISBN con parsing client-side; tramite API esterna si precompilano titolo, autore, genere e anno.
4. **Catalogo e ricerca** (accessibile anche da utenti anonimi):
   - Filtri per titolo (ricerca full-text), autore, genere, anno e comunità.
   - Tabella/tiles con dettagli del libro, posizione geografica (dal `village` del possessore) e contatto dell'utente proprietario.
   - Click sull'email apre il client di posta precompilato con il messaggio: "Ciao, {nome}, ho visto che hai a disposizione il libro {titolo} dell'anno {anno}. Mi farebbe piacere prenderlo in prestito, va bene?".
5. **Prestiti**: da scheda libro un utente autenticato può avviare un prestito (`loans`) con data di scadenza e restituzione; aggiornamento dello stato libro e del possessore.

## Architettura applicativa
- **Frontend**: implementabile sia in Angular che in React; design moderno con palette chiara, card animate e layout responsive. Componenti chiave: selettore comunità, dashboard catalogo con filtri, form autenticazione, wizard di aggiunta libro con step per barcode.
- **Backend/API**: servizio REST/GraphQL su PostgreSQL con autenticazione (JWT/sessioni). Endpoints per CRUD di libri, gestione prestiti, lookup di autori/generi, caricamento immagini barcode e aggancio a servizi ISBN.
- **Integrazioni**: API ISBN (es. Open Library) per arricchire i metadati; geocoding per mostrare distanza tra utenti e biblioteca.

## UX e stile
- Layout split: a sinistra selezione comunità e filtri, a destra catalogo con infinite scroll.
- CTA evidenti per "Aggiungi libro" (solo autenticati) e "Contatta" (mailto precompilato).
- Microinterazioni (hover, skeleton loading) per rendere piacevole l'attesa.

## Estensioni future
- Notifiche email/push per scadenze dei prestiti.
- Gamification: badge per chi presta di più o mantiene i libri in ottime condizioni.
- Dashboard amministrativa per moderazione e statistiche per comunità.

Questo documento serve come base di lavoro per implementare la web app e il relativo backend seguendo lo schema fornito.
