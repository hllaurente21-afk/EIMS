import { useEffect, useState } from 'react';
import { api, today, downloadCSV } from '../api';

export default function Reports() {
  const [tab, setTab] = useState('daily');
  const [date, setDate] = useState(today());
  const [month, setMonth] = useState(today().slice(0, 7));
  const [dept, setDept] = useState('');
  const [depts, setDepts] = useState([]);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api('/employees/departments').then(setDepts).catch(() => {}); }, []);

  useEffect(() => {
    setError('');
    const req = tab === 'daily'
      ? api('/reports/daily', { params: { date } })
      : api('/reports/monthly', { params: { month, department_id: dept } });
    req.then((d) => { setRows(d.data); setSummary(d.summary || null); }).catch((e) => setError(e.message));
  }, [tab, date, month, dept]);

  const exportCsv = () => downloadCSV(`eims-${tab}-${tab === 'daily' ? date : month}.csv`, rows);

  return (
    <>
      <div className="page-head">
        <h2>Reports</h2>
        <div className="actions">
          <button className="btn" onClick={exportCsv} disabled={!rows.length}>Export CSV</button>
          <button className="btn" onClick={() => window.print()}>Print</button>
        </div>
      </div>

      <div className="tabs">
        <button className={tab === 'daily' ? 'active' : ''} onClick={() => setTab('daily')}>Daily attendance</button>
        <button className={tab === 'monthly' ? 'active' : ''} onClick={() => setTab('monthly')}>Monthly working hours</button>
      </div>

      <div className="filters">
        {tab === 'daily'
          ? <label>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          : (
            <>
              <label>Month<input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label>
              <label>Department
                <select value={dept} onChange={(e) => setDept(e.target.value)}>
                  <option value="">All</option>
                  {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </label>
            </>
          )}
        {summary && <div className="total">Present: <b>{summary.present}</b> · Absent: <b>{summary.absent}</b></div>}
      </div>

      {error && <div className="alert">{error}</div>}
      <div className="card table-wrap">
        {tab === 'daily' ? (
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Department</th><th>Time in</th><th>Time out</th><th>Break</th><th>Hours</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.employee_id}>
                  <td>{r.employee_code}</td><td>{r.employee_name}</td><td>{r.department || '—'}</td>
                  <td>{r.time_in?.slice(11, 16) || '—'}</td><td>{r.time_out?.slice(11, 16) || '—'}</td>
                  <td>{r.break_minutes ?? '—'}</td><td>{r.hours_worked ?? '—'}</td><td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Department</th><th>Days present</th><th>Total hours</th><th>Avg hrs/day</th><th>Incomplete</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.employee_id}>
                  <td>{r.employee_code}</td><td>{r.employee_name}</td><td>{r.department || '—'}</td>
                  <td>{r.days_present}</td><td><b>{r.total_hours}</b></td><td>{r.avg_hours_per_day}</td>
                  <td>{Number(r.incomplete_records) > 0 ? <span className="pill warn">{r.incomplete_records}</span> : 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!rows.length && <p className="muted pad">No data for this period.</p>}
      </div>
    </>
  );
}
