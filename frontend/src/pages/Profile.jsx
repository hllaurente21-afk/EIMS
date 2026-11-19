import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext.jsx';

export default function Profile() {
  const { user } = useAuth();
  const [emp, setEmp] = useState(null);
  const [pw, setPw] = useState({ current_password: '', new_password: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user.employeeId) api(`/employees/${user.employeeId}`).then(setEmp).catch(() => {});
  }, [user.employeeId]);

  async function changePassword(e) {
    e.preventDefault();
    try {
      await api('/auth/password', { method: 'PUT', body: pw });
      setMsg({ type: 'success', text: 'Password updated.' });
      setPw({ current_password: '', new_password: '' });
    } catch (err) { setMsg({ type: 'alert', text: err.message }); }
  }

  const rows = emp ? [
    ['Employee ID', emp.employee_code], ['Name', `${emp.first_name} ${emp.last_name}`],
    ['Department', emp.department], ['Position', emp.position], ['Email', emp.email],
    ['Phone', emp.phone], ['Date hired', emp.date_hired], ['Status', emp.status]
  ] : [];

  return (
    <>
      <div className="page-head"><h2>My Profile</h2></div>
      <div className="two-col">
        <div className="card pad">
          <h3>Account</h3>
          <p>Username: <b>{user.username}</b> <span className="badge">{user.role}</span></p>
          {emp ? (
            <table><tbody>{rows.map(([k, v]) => <tr key={k}><td className="muted">{k}</td><td>{v || '—'}</td></tr>)}</tbody></table>
          ) : <p className="muted">No employee record is linked to this account.</p>}
        </div>
        <form className="card pad" onSubmit={changePassword}>
          <h3>Change password</h3>
          {msg.text && <div className={msg.type === 'success' ? 'alert success' : 'alert'}>{msg.text}</div>}
          <label>Current password<input type="password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} required /></label>
          <label>New password (min 8)<input type="password" minLength="8" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} required /></label>
          <button className="btn primary">Update password</button>
        </form>
      </div>
    </>
  );
}
