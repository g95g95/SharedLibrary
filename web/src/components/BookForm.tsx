import { useState } from 'react';
import { fetchJson } from '../api';

interface Props {
  disabled: boolean;
  selectedVillage?: number;
  onCreated: () => void;
}

function BookForm({ disabled, selectedVillage, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [genreName, setGenreName] = useState('');
  const [publicationYear, setPublicationYear] = useState('');
  const [publisher, setPublisher] = useState('');
  const [description, setDescription] = useState('');
  const [conditionId, setConditionId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function submit() {
    setError('');
    setSuccess('');
    try {
      await fetchJson('/api/books', {
        method: 'POST',
        body: JSON.stringify({
          title,
          authorName,
          genreName,
          publicationYear: publicationYear ? Number(publicationYear) : undefined,
          publisher,
          description,
          conditionId: conditionId ? Number(conditionId) : undefined,
          villageId: selectedVillage,
        }),
      });
      setSuccess('Libro inserito!');
      setTitle('');
      setAuthorName('');
      setGenreName('');
      setPublicationYear('');
      setPublisher('');
      setDescription('');
      setConditionId('');
      onCreated();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="stack">
      <input placeholder="Titolo" value={title} onChange={(e) => setTitle(e.target.value)} disabled={disabled} />
      <div className="two-columns">
        <input placeholder="Autore" value={authorName} onChange={(e) => setAuthorName(e.target.value)} disabled={disabled} />
        <input placeholder="Genere" value={genreName} onChange={(e) => setGenreName(e.target.value)} disabled={disabled} />
      </div>
      <div className="two-columns">
        <input
          placeholder="Anno di pubblicazione"
          value={publicationYear}
          onChange={(e) => setPublicationYear(e.target.value)}
          disabled={disabled}
        />
        <input placeholder="Editore" value={publisher} onChange={(e) => setPublisher(e.target.value)} disabled={disabled} />
      </div>
      <textarea
        placeholder="Descrizione"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={disabled}
      />
      <input
        placeholder="ID condizione (1-4)"
        value={conditionId}
        onChange={(e) => setConditionId(e.target.value)}
        disabled={disabled}
      />
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <button onClick={submit} disabled={disabled}>
        Pubblica libro
      </button>
    </div>
  );
}

export default BookForm;
