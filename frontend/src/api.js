const BASE = import.meta.env.VITE_API_URL || '/api';

export async function api(path, { method = 'GET', body, params } = {}) {
  const token = localStorage.getItem('eims_token');
  const clean = params ? Object.entries(params).filter(([, v]) => v !== '' && v != null) : [];
  const qs = clean.length ? '?' + new URLSearchParams(clean).toString() : '';

  const res = await fetch(BASE + path + qs, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && token && !path.startsWith('/auth/login')) {
    localStorage.removeItem('eims_token');
    localStorage.removeItem('eims_user');
    window.location.href = '/login';
  }
  if (!res.ok) throw new Error(data.message || 'Request failed.');
  return data;
}

// Helpers shared by pages
export const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
export const timeOf = (dt) => (dt ? dt.slice(11, 16) : '—');
export const toSqlDateTime = (v) => (v ? v.replace('T', ' ') + ':00' : null);
export const toInputDateTime = (v) => (v ? v.slice(0, 16).replace(' ', 'T') : '');

export function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
}
