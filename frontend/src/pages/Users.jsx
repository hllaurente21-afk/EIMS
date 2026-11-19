import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext.jsx';
import Modal from '../components/Modal.jsx';

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => api('/auth/users').then(setUsers).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); api('/employees', { params: { status: 'active', limit: 100 } }).then((d) => setEmployees(d.data)).catch(() => {}); }, [load]);

  async function create(e) {
    e.preventDefault();
    try {
      await api('/auth/users', { method: 'POST', body: { username: form.username, password: form.password, role: form.role, employee_id: form.employee_id || null } });
      setForm(null); load();
    } catch (err) { setForm({ ...form, error: err.message }); }
  }

  async function toggle(u) {
    try { await api(`/auth/users/${u.id}`, { method: 'PUT', body: { is_active: !u.is_active } }); load(); } catch (e) { setError(e.message); }
  }

  async function resetPw(u) {
    const password = window.prompt(`New password for ${u.username} (min 8 characters):`);
    if (!password) return;
    try { await api(`/auth/users/${u.id}`, { method: 'PUT', body: { password } }); alert('Password reset.'); } catch (e) { setError(e.message); }
  }

  return (
    <>
      <div className="page-head">
        <h2>User Accounts</h2>
        <button className="btn primary" onClick={() => setForm({ username: '', password: '', role: 'employee', employee_id: '' })}>+ New account</button>
      </div>
      {error && <div className="alert">{error}</div>}
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Username</th><th>Role</th><th>Linked employee</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td><td><span className="badge">{u.role}</span></td><td>{u.employee_name || '—'}</td>
                <td><span className={`pill ${u.is_active ? 'ok' : 'bad'}`}>{u.is_active ? 'active' : 'disabled'}</span></td>
                <td className="actions">
                  <button className="btn small" onClick={() => resetPw(u)}>Reset password</button>
                  {u.id !== me.id && <button className="btn small danger" onClick={() => toggle(u)}>{u.is_active ? 'Disable' : 'Enable'}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal title="New user account" onClose={() => setForm(null)}>
          <form onSubmit={create} className="grid2">
            {form.error && <div className="alert full">{form.error}</div>}
            <label>Username *<input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></label>
            <label>Password * (min 8)<input type="password" minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
            <label>Role
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="employee">Employee</option><option value="hr">HR staff</option><option value="admin">Administrator</option>
              </select>
            </label>
            <label>Linked employee
              <select value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
                <option value="">— none —</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.last_name}, {e.first_name} ({e.employee_code})</option>)}
              </select>
            </label>
            <p className="muted full">Link the account to an employee so they can clock in/out and see their own records.</p>
            <div className="full right">
              <button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn primary">Create</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
