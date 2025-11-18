export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export interface ApiUser {
  id: number;
  username: string;
  email?: string;
  full_name?: string;
}

export interface ApiVillage {
  id: number;
  name: string;
  province?: string;
  region?: string;
  country?: string;
  postal_code?: string;
}

export interface ApiBook {
  id: number;
  title: string;
  publication_year?: number;
  publisher?: string;
  description?: string;
  whohasit?: number;
  author?: { id: number; name: string };
  genre?: { id: number; name: string };
  village_id?: number;
  condition_id?: number;
}

export async function fetchJson(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || 'Errore di rete');
  }
  return res.json();
}
