import { useEffect, useState } from 'react';
import { fetchJson, ApiUser, ApiBook, ApiVillage } from './api';
import AuthPanel from './components/AuthPanel';
import BookForm from './components/BookForm';
import BookTable from './components/BookTable';
import VillageSelector from './components/VillageSelector';

function App() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [villages, setVillages] = useState<ApiVillage[]>([]);
  const [selectedVillage, setSelectedVillage] = useState<number | undefined>();
  const [books, setBooks] = useState<ApiBook[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchJson('/api/villages').then((res) => setVillages(res.villages || []));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedVillage) params.set('villageId', String(selectedVillage));
    fetchJson(`/api/books?${params.toString()}`).then((res) => setBooks(res.books || []));
  }, [search, selectedVillage]);

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Local Library Project</p>
          <h1>Libri condivisi tra borghi e comunità</h1>
          <p className="lede">
            Scegli la tua comunità, registra un account e aggiungi i libri che vuoi condividere. Chiunque può cercare e contattare
            il proprietario in un click.
          </p>
          <div className="hero-actions">
            <VillageSelector villages={villages} value={selectedVillage} onChange={setSelectedVillage} />
            <input
              placeholder="Cerca per titolo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search"
            />
          </div>
        </div>
        <AuthPanel onAuthenticated={setUser} currentUser={user} />
      </header>

      <main className="grid">
        <section className="card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Catalogo</p>
              <h2>Libri disponibili</h2>
            </div>
            <span className="pill">{books.length} risultati</span>
          </div>
          <BookTable books={books} />
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Contribuisci</p>
              <h2>Aggiungi un libro</h2>
            </div>
            <span className="pill muted">Richiede login</span>
          </div>
          <BookForm disabled={!user} selectedVillage={selectedVillage} onCreated={() => setSearch('')} />
        </section>
      </main>
    </div>
  );
}

export default App;
