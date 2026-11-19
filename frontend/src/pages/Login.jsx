import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    setError(''); setBusy(true);
    try { await login(username, password); navigate('/'); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="login-wrap">
      <form className="card login" onSubmit={submit}>
        <h1>EIMS</h1>
        <p className="muted">Employee Information Management System</p>
        {error && <div className="alert">{error}</div>}
        <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        <button className="btn primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}
