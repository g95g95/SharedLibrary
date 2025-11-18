import { useEffect, useRef, useState } from 'react';
import { BrowserBarcodeReader } from '@zxing/browser';
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
  const [language, setLanguage] = useState('italiano');
  const [barcodeFile, setBarcodeFile] = useState<File | null>(null);
  const [barcodeStatus, setBarcodeStatus] = useState('');
  const [detectedIsbn, setDetectedIsbn] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserBarcodeReader | null>(null);
  const stopControlsRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    readerRef.current = new BrowserBarcodeReader();
    return () => {
      stopLiveScan();
    };
  }, []);

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
    if (!readerRef.current) return;
    if (!barcodeFile) {
      setBarcodeStatus('Seleziona o scatta prima una foto del codice a barre.');
      return;
    }

    setBarcodeStatus('Cerco di leggere il codice a barre...');
    setError('');

    const objectUrl = URL.createObjectURL(barcodeFile);

    try {
      const result = await readerRef.current.decodeFromImageUrl(objectUrl);
      await handleDecodedText(result.getText());
    } catch (err: any) {
      setBarcodeStatus('Non sono riuscito a leggere il codice a barre. Prova con una foto più nitida.');
      setError(err?.message || 'Errore durante la lettura del codice.');
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function handleDecodedText(text: string) {
    if (!text) return;
    setDetectedIsbn(text);
    setBarcodeStatus(`Codice letto: ${text}. Sto recuperando i dettagli...`);
    await populateFromIsbn(text);
  }

  async function startLiveScan() {
    if (!readerRef.current || !videoRef.current) return;
    setError('');
    setBarcodeStatus('Avvio scanner...');
    setIsScanning(true);

    try {
      const controls = await readerRef.current.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
        if (result) {
          stopControlsRef.current?.();
          setIsScanning(false);
          handleDecodedText(result.getText());
        } else if (err) {
          setBarcodeStatus('Inquadra il codice a barre: ' + err.message);
        }
      });

      stopControlsRef.current = () => {
        controls.stop();
        if (videoRef.current?.srcObject) {
          (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
          videoRef.current.srcObject = null;
        }
      };

      setBarcodeStatus('Scanner attivo: inquadra il codice a barre.');
    } catch (err: any) {
      setIsScanning(false);
      setBarcodeStatus('Non sono riuscito ad attivare la fotocamera.');
      setError(err?.message || 'Errore durante l\'avvio dello scanner.');
      stopLiveScan();
    }
  }

  function stopLiveScan() {
    stopControlsRef.current?.();
    stopControlsRef.current = null;
    setIsScanning(false);
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
      setLanguage('italiano');
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
          disabled={disabled}
        />
        <button onClick={recognizeBarcode} disabled={disabled}>
          Leggi codice a barre da foto
        </button>
        <div className="scanner-row">
          <button onClick={isScanning ? stopLiveScan : startLiveScan} disabled={disabled}>
            {isScanning ? 'Ferma scanner' : 'Scansiona con fotocamera'}
          </button>
          <video ref={videoRef} className="preview" autoPlay muted playsInline />
        </div>
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
