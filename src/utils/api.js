const API_BASE = '/api';

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('zenith_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('zenith_token');
    localStorage.removeItem('zenith_user');
    window.location.href = '/';
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request gagal');
  return data;
}

export const api = {
  get: (url) => apiFetch(url),
  post: (url, body) => apiFetch(url, { method: 'POST', body: JSON.stringify(body) }),
  put: (url, body) => apiFetch(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (url) => apiFetch(url, { method: 'DELETE' }),
};
