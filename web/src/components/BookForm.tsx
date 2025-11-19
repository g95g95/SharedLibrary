import { useEffect, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { ApiUser, fetchJson } from '../api';

type BarcodeDetectorWindow = Window & { BarcodeDetector?: typeof BarcodeDetector };

interface Props {
  disabled: boolean;
  selectedVillage?: number;
  currentUser: ApiUser | null;
  onCreated: () => void;
}

async function detectWithNativeBarcodeDetector(file: File) {
  if (typeof window === 'undefined') return null;
  const detectorCtor = (window as BarcodeDetectorWindow).BarcodeDetector;
  if (!detectorCtor || typeof createImageBitmap !== 'function') return null;

  try {
    const detector = new detectorCtor({ formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a'] });
    const bitmap = await createImageBitmap(file);
    const results = await detector.detect(bitmap);
    bitmap.close?.();
    return results[0]?.rawValue || null;
  } catch (err) {
    console.warn('Native barcode detection failed', err);
    return null;
  }
}

async function decodeWithZxing(file: File) {
  const reader = new BrowserMultiFormatReader();
  const objectUrl = URL.createObjectURL(file);
  try {
    const result = await reader.decodeFromImageUrl(objectUrl);
    return result.getText();
  } finally {
    reader.reset();
    URL.revokeObjectURL(objectUrl);
  }
}

function BookForm({ disabled, selectedVillage, currentUser, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [genreName, setGenreName] = useState('');
  const [publicationYear, setPublicationYear] = useState('');
  const [publisher, setPublisher] = useState('');
  const [description, setDescription] = useState('');
  const [conditionId, setConditionId] = useState('');
  const [language, setLanguage] = useState('italiano');
  const [villageIdInput, setVillageIdInput] = useState(selectedVillage ? String(selectedVillage) : '');
  const [barcodeFile, setBarcodeFile] = useState<File | null>(null);
  const [barcodeStatus, setBarcodeStatus] = useState('');
  const [detectedIsbn, setDetectedIsbn] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (selectedVillage) {
      setVillageIdInput(String(selectedVillage));
      return;
    }
    if (currentUser?.village) {
      setVillageIdInput(String(currentUser.village));
      return;
    }
    setVillageIdInput('');
  }, [selectedVillage, currentUser?.village]);

  function parseYear(raw?: string) {
    if (!raw) return '';
    const match = raw.match(/\d{4}/);
    return match ? match[0] : '';
  }

  async function populateFromIsbn(isbn: string) {
    const cleanIsbn = isbn.replace(/[^0-9X]/gi, '');
    if (!cleanIsbn) return;

    try {
      const response = await fetch(`https://openlibrary.org/isbn/${cleanIsbn}.json`);
      if (!response.ok) {
        setBarcodeStatus('Barcode letto, ma non sono riuscito a recuperare i dettagli dal catalogo.');
        return;
      }

      const bookData = await response.json();
      if (bookData.title && !title) setTitle(bookData.title);
      if (bookData.publish_date && !publicationYear) setPublicationYear(parseYear(bookData.publish_date));
      if (bookData.publishers?.length && !publisher) setPublisher(bookData.publishers[0]);

      if (bookData.authors?.length && !authorName) {
        const authorKey = bookData.authors[0]?.key;
        if (authorKey) {
          const authorRes = await fetch(`https://openlibrary.org${authorKey}.json`).catch(() => null);
          const authorJson = await authorRes?.json().catch(() => null);
          if (authorJson?.name) setAuthorName(authorJson.name);
        }
      }

      if (bookData.languages?.length && !language) {
        const langKey = bookData.languages[0]?.key as string;
        if (langKey?.toLowerCase().includes('ita')) setLanguage('italiano');
        else if (langKey?.toLowerCase().includes('eng')) setLanguage('inglese');
      }

      setBarcodeStatus('Dati libro aggiornati dal codice a barre.');
    } catch (err: any) {
      setBarcodeStatus(`Barcode letto (${cleanIsbn}), ma non sono riuscito a completare l\'autocompilazione: ${err.message}`);
    }
  }

  async function recognizeBarcode() {
    if (!barcodeFile) {
      setBarcodeStatus('Seleziona o scatta prima una foto del codice a barre.');
      return;
    }

    setBarcodeStatus('Cerco di leggere il codice a barre...');
    setError('');

    try {
      const text =
        (await detectWithNativeBarcodeDetector(barcodeFile)) ?? (await decodeWithZxing(barcodeFile));
      if (!text) {
        setBarcodeStatus('Non sono riuscito a leggere il codice a barre. Prova con una foto più nitida.');
        return;
      }
      setDetectedIsbn(text);
      setBarcodeStatus(`Codice letto: ${text}. Sto recuperando i dettagli...`);
      await populateFromIsbn(text);
    } catch (err: any) {
      setBarcodeStatus('Non sono riuscito a leggere il codice a barre. Prova con una foto più nitida.');
      setError(err?.message || 'Errore durante la lettura del codice.');
    }
  }

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
          language,
          villageId: villageIdInput ? Number(villageIdInput) : selectedVillage,
          ownerId: currentUser?.id,
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
      setLanguage('italiano');
      setVillageIdInput(selectedVillage ? String(selectedVillage) : currentUser?.village ? String(currentUser.village) : '');
      setBarcodeFile(null);
      setBarcodeStatus('');
      setDetectedIsbn('');
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
      <input
        placeholder="Lingua (default italiano)"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        disabled={disabled}
      />
      <input
        placeholder="ID villaggio"
        value={villageIdInput}
        onChange={(e) => setVillageIdInput(e.target.value)}
        disabled={disabled}
      />
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
      <div className="card subtle">
        <p className="muted">Acquisisci dal codice a barre (ISBN)</p>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setBarcodeFile(e.target.files?.[0] || null)}
        />
        <button onClick={recognizeBarcode} disabled={!barcodeFile}>
          Leggi codice a barre e autocompila
        </button>
        {barcodeStatus && <p className="muted">{barcodeStatus}</p>}
        {detectedIsbn && <p className="muted">ISBN rilevato: {detectedIsbn}</p>}
      </div>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <button onClick={submit} disabled={disabled}>
        Pubblica libro
      </button>
    </div>
  );
}

export default BookForm;
