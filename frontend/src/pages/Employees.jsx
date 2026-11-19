import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import Modal from '../components/Modal.jsx';

const EMPTY = { employee_code: '', first_name: '', last_name: '', department_id: '', position: '', email: '', phone: '', date_hired: '', status: 'active' };
const LIMIT = 10;

export default function Employees() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('');
  const [status, setStatus] = useState('');
  const [depts, setDepts] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await api('/employees', { params: { q, department_id: dept, status, page, limit: LIMIT } });
      setRows(d.data); setTotal(d.total); setError('');
    } catch (e) { setError(e.message); }
  }, [q, dept, status, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api('/employees/departments').then(setDepts).catch(() => {}); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setFormError('');
    const body = Object.fromEntries(Object.keys(EMPTY).map((k) => [k, form[k] ?? '']));
    try {
      if (form.id) await api(`/employees/${form.id}`, { method: 'PUT', body });
      else await api('/employees', { method: 'POST', body });
      setForm(null); load();
    } catch (err) { setFormError(err.message); }
  }

  async function deactivate(emp) {
    if (!window.confirm(`Set ${emp.first_name} ${emp.last_name} as inactive?`)) return;
    try { await api(`/employees/${emp.id}`, { method: 'DELETE' }); load(); } catch (e) { setError(e.message); }
  }

  const pages = Math.max(Math.ceil(total / LIMIT), 1);

  return (
    <>
      <div className="page-head">
        <h2>Employees</h2>
        <button className="btn primary" onClick={() => { setFormError(''); setForm({ ...EMPTY }); }}>+ Add employee</button>
      </div>

      <div className="filters">
        <input placeholder="Search name, ID, position, email…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <select value={dept} onChange={(e) => { setDept(e.target.value); setPage(1); }}>
          <option value="">All departments</option>
          {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All status</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </select>
      </div>

      {error && <div className="alert">{error}</div>}
      <div className="card table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Department</th><th>Position</th><th>Contact</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.employee_code}</td>
                <td>{r.last_name}, {r.first_name}</td>
                <td>{r.department || '—'}</td>
                <td>{r.position || '—'}</td>
                <td>{r.email || '—'}<br /><small className="muted">{r.phone}</small></td>
                <td><span className={`pill ${r.status === 'active' ? 'ok' : 'bad'}`}>{r.status}</span></td>
                <td className="actions">
                  <button className="btn small" onClick={() => { setFormError(''); setForm({ ...r }); }}>Edit</button>
                  {r.status === 'active' && <button className="btn small danger" onClick={() => deactivate(r)}>Deactivate</button>}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan="7" className="muted">No employees found.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <button className="btn small" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Prev</button>
        <span>Page {page} of {pages} · {total} employees</span>
        <button className="btn small" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next ›</button>
      </div>

      {form && (
        <Modal title={form.id ? 'Edit employee' : 'Add employee'} onClose={() => setForm(null)}>
          <form onSubmit={save} className="grid2">
            {formError && <div className="alert full">{formError}</div>}
            <label>Employee ID *<input value={form.employee_code} onChange={set('employee_code')} required /></label>
            <label>Status<select value={form.status} onChange={set('status')}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
            <label>First name *<input value={form.first_name} onChange={set('first_name')} required /></label>
            <label>Last name *<input value={form.last_name} onChange={set('last_name')} required /></label>
            <label>Department
              <select value={form.department_id ?? ''} onChange={set('department_id')}>
                <option value="">— none —</option>
                {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
            <label>Position<input value={form.position ?? ''} onChange={set('position')} /></label>
            <label>Email<input type="email" value={form.email ?? ''} onChange={set('email')} /></label>
            <label>Phone<input value={form.phone ?? ''} onChange={set('phone')} /></label>
            <label>Date hired<input type="date" value={form.date_hired ?? ''} onChange={set('date_hired')} /></label>
            <div className="full right">
              <button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn primary">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
