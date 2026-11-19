import { useEffect, useState } from 'react';
import { api, today, timeOf } from '../api';

export default function Dashboard() {
  const [date, setDate] = useState(today());
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/reports/daily', { params: { date } }).then(setReport).catch((e) => setError(e.message));
  }, [date]);

  const s = report?.summary;
  return (
    <>
      <div className="page-head">
        <h2>Dashboard</h2>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      {error && <div className="alert">{error}</div>}
      {s && (
        <div className="stats">
          <div className="stat"><span>Active employees</span><b>{s.total}</b></div>
          <div className="stat ok"><span>Present</span><b>{s.present}</b></div>
          <div className="stat bad"><span>Absent</span><b>{s.absent}</b></div>
        </div>
      )}
      <div className="card table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Department</th><th>In</th><th>Out</th><th>Hours</th><th>Status</th></tr></thead>
          <tbody>
            {report?.data.map((r) => (
              <tr key={r.employee_id}>
                <td>{r.employee_code}</td><td>{r.employee_name}</td><td>{r.department || '—'}</td>
                <td>{timeOf(r.time_in)}</td><td>{timeOf(r.time_out)}</td>
                <td>{r.hours_worked ?? '—'}</td>
                <td><span className={`pill ${r.status === 'Absent' ? 'bad' : r.status === 'Present' ? 'ok' : 'warn'}`}>{r.status}</span></td>
              </tr>
            ))}
            {report && !report.data.length && <tr><td colSpan="7" className="muted">No active employees yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
