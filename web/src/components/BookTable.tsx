import { ApiBook } from '../api';

interface Props {
  books: ApiBook[];
}

function BookTable({ books }: Props) {
  return (
    <div className="table">
      <div className="table-head">
        <span>Titolo</span>
        <span>Autore</span>
        <span>Genere</span>
        <span>Anno</span>
        <span>Contatto</span>
      </div>
      {books.map((book) => {
        const mailLink = `mailto:utente@example.com?subject=Richiesta%20${encodeURIComponent(
          book.title
        )}&body=Ciao,%20ho%20visto%20che%20hai%20a%20disposizione%20il%20libro%20${encodeURIComponent(
          book.title
        )}%20dell'anno%20${book.publication_year || ''}.%20Mi%20farebbe%20piacere%20prenderlo%20in%20prestito,%20va%20bene?`;
        return (
          <div className="table-row" key={book.id}>
            <div>
              <div className="title">{book.title}</div>
              <div className="muted">{book.publisher}</div>
            </div>
            <span>{book.author?.name || 'N/D'}</span>
            <span>{book.genre?.name || 'N/D'}</span>
            <span>{book.publication_year || '—'}</span>
            <a href={mailLink} className="pill">
              Contatta
            </a>
          </div>
        );
      })}
    </div>
  );
}

export default BookTable;
