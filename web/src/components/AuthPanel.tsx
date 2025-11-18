import { useState } from 'react';
import { ApiUser, fetchJson } from '../api';

interface Props {
  onAuthenticated: (user: ApiUser | null) => void;
  currentUser: ApiUser | null;
}

function AuthPanel({ onAuthenticated, currentUser }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = mode === 'login' ? { username, password } : { username, password, fullName, email };
      const res = await fetchJson(path, { method: 'POST', body: JSON.stringify(payload) });
      onAuthenticated(res.user);
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (currentUser) {
    return (
      <div className="card compact">
        <p className="eyebrow">Profilo</p>
        <h3>Ciao {currentUser.username}</h3>
        <p className="muted">{currentUser.email}</p>
        <button className="ghost" onClick={() => onAuthenticated(null)}>
          Esci
        </button>
      </div>
    );
  }

  return (
    <div className="card compact">
      <div className="tabs">
        <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
          Accedi
        </button>
        <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
          Registrati
        </button>
      </div>
      <div className="stack">
        <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {mode === 'register' && (
          <>
            <input placeholder="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </>
        )}
        {error && <p className="error">{error}</p>}
        <button onClick={submit}>{mode === 'login' ? 'Entra' : 'Crea account'}</button>
      </div>
    </div>
  );
}

export default AuthPanel;
