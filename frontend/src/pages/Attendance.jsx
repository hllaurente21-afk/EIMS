import { useCallback, useEffect, useState } from 'react';
import { api, today, timeOf, toSqlDateTime, toInputDateTime } from '../api';
import { useAuth } from '../AuthContext.jsx';
import Modal from '../components/Modal.jsx';

export default function Attendance() {
  const { user } = useAuth();
  const isStaff = user.role !== 'employee';
  const monthStart = today().slice(0, 8) + '01';

  const [rows, setRows] = useState([]);
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today());
  const [empFilter, setEmpFilter] = useState('');
  const [employees, setEmployees] = useState([]);
  const [todayRec, setTodayRec] = useState(null);
  const [breakMin, setBreakMin] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [form, setForm] = useState(null);

  const load = useCallback(async () => {
    try { setRows(await api('/attendance', { params: { employee_id: empFilter, from, to } })); }
    catch (e) { setMsg({ type: 'alert', text: e.message }); }
  }, [empFilter, from, to]);

  const loadToday = useCallback(async () => {
    if (!user.employeeId) return;
    const r = await api('/attendance', { params: { employee_id: user.employeeId, from: today(), to: today() } }).catch(() => []);
    setTodayRec(r[0] || null);
  }, [user.employeeId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadToday(); }, [loadToday]);
  useEffect(() => {
    if (isStaff) api('/employees', { params: { status: 'active', limit: 100 } }).then((d) => setEmployees(d.data)).catch(() => {});
  }, [isStaff]);

  async function clock(kind) {
    setMsg({ type: '', text: '' });
    try {
      const body = kind === 'out' && breakMin !== '' ? { break_minutes: Number(breakMin) } : {};
      await api(`/attendance/clock-${kind}`, { method: 'POST', body });
      setMsg({ type: 'success', text: kind === 'in' ? 'Time-in recorded.' : 'Time-out recorded.' });
      setBreakMin(''); load(); loadToday();
    } catch (e) { setMsg({ type: 'alert', text: e.message }); }
  }

  async function saveManual(e) {
    e.preventDefault();
    try {
      const body = { time_in: toSqlDateTime(form.time_in), time_out: toSqlDateTime(form.time_out), break_minutes: Number(form.break_minutes || 0), remarks: form.remarks || null };
      if (form.id) await api(`/attendance/${form.id}`, { method: 'PUT', body });
      else await api('/attendance/manual', { method: 'POST', body: { ...body, employee_id: form.employee_id, work_date: form.work_date } });
      setForm(null); load(); loadToday();
    } catch (err) { setForm({ ...form, error: err.message }); }
  }

  async function remove(id) {
    if (!window.confirm('Delete this attendance record?')) return;
    try { await api(`/attendance/${id}`, { method: 'DELETE' }); load(); loadToday(); } catch (e) { setMsg({ type: 'alert', text: e.message }); }
  }

  const totalHours = rows.reduce((s, r) => s + Number(r.hours_worked || 0), 0).toFixed(2);
  const clockedIn = todayRec && !todayRec.time_out;
  const done = todayRec && todayRec.time_out;

  return (
    <>
      <div className="page-head">
        <h2>Attendance</h2>
        {isStaff && <button className="btn primary" onClick={() => setForm({ employee_id: '', work_date: today(), time_in: '', time_out: '', break_minutes: 0, remarks: '' })}>+ Manual entry</button>}
      </div>

      {user.employeeId && (
        <div className="card clockbox">
          <div>
            <h3>Today · {today()}</h3>
            <p className="muted">
              {!todayRec && 'You have not clocked in yet.'}
              {clockedIn && `Clocked in at ${timeOf(todayRec.time_in)}.`}
              {done && `In ${timeOf(todayRec.time_in)} · Out ${timeOf(todayRec.time_out)} · ${todayRec.hours_worked ?? ''} hrs`}
            </p>
          </div>
          <div className="clock-actions">
            {!todayRec && <button className="btn primary big" onClick={() => clock('in')}>Time In</button>}
            {clockedIn && (
              <>
                <input type="number" min="0" placeholder="Break (min) – optional" value={breakMin} onChange={(e) => setBreakMin(e.target.value)} />
                <button className="btn danger big" onClick={() => clock('out')}>Time Out</button>
              </>
            )}
          </div>
        </div>
      )}
      {!user.employeeId && isStaff && <div className="alert info">Your account is not linked to an employee record, so clock in/out is hidden. Use “Manual entry” to record attendance for employees.</div>}
      {msg.text && <div className={msg.type === 'success' ? 'alert success' : 'alert'}>{msg.text}</div>}

      <div className="filters">
        <label>From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label>To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        {isStaff && (
          <label>Employee
            <select value={empFilter} onChange={(e) => setEmpFilter(e.target.value)}>
              <option value="">All employees</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.last_name}, {e.first_name}</option>)}
            </select>
          </label>
        )}
        <div className="total">Total hours: <b>{totalHours}</b></div>
      </div>

      <div className="card table-wrap">
        <table>
          <thead><tr><th>Date</th>{isStaff && <th>Employee</th>}<th>In</th><th>Out</th><th>Break</th><th>Hours</th><th>Remarks</th>{isStaff && <th></th>}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.work_date}</td>
                {isStaff && <td>{r.employee_name}<br /><small className="muted">{r.employee_code}</small></td>}
                <td>{timeOf(r.time_in)}</td>
                <td>{r.time_out ? timeOf(r.time_out) : <span className="pill warn">open</span>}</td>
                <td>{r.break_minutes} min</td>
                <td>{r.hours_worked ?? '—'}</td>
                <td>{r.remarks || ''}</td>
                {isStaff && (
                  <td className="actions">
                    <button className="btn small" onClick={() => setForm({ ...r, time_in: toInputDateTime(r.time_in), time_out: toInputDateTime(r.time_out), remarks: r.remarks || '' })}>Edit</button>
                    {user.role === 'admin' && <button className="btn small danger" onClick={() => remove(r.id)}>Delete</button>}
                  </td>
                )}
              </tr>
            ))}
            {!rows.length && <tr><td colSpan="8" className="muted">No attendance records in this range.</td></tr>}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal title={form.id ? 'Edit attendance' : 'Manual attendance entry'} onClose={() => setForm(null)}>
          <form onSubmit={saveManual} className="grid2">
            {form.error && <div className="alert full">{form.error}</div>}
            {!form.id && (
              <>
                <label>Employee *
                  <select value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} required>
                    <option value="">Select…</option>
                    {employees.map((e) => <option key={e.id} value={e.id}>{e.last_name}, {e.first_name}</option>)}
                  </select>
                </label>
                <label>Work date *<input type="date" value={form.work_date} onChange={(e) => setForm({ ...form, work_date: e.target.value })} required /></label>
              </>
            )}
            <label>Time in *<input type="datetime-local" value={form.time_in} onChange={(e) => setForm({ ...form, time_in: e.target.value })} required /></label>
            <label>Time out<input type="datetime-local" value={form.time_out} onChange={(e) => setForm({ ...form, time_out: e.target.value })} /></label>
            <label>Break (minutes)<input type="number" min="0" value={form.break_minutes} onChange={(e) => setForm({ ...form, break_minutes: e.target.value })} /></label>
            <label>Remarks<input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></label>
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
