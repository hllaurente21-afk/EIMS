import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', roles: ['admin', 'hr'] },
  { to: '/employees', label: 'Employees', roles: ['admin', 'hr'] },
  { to: '/attendance', label: 'Attendance', roles: ['admin', 'hr', 'employee'] },
  { to: '/reports', label: 'Reports', roles: ['admin', 'hr'] },
  { to: '/users', label: 'User Accounts', roles: ['admin'] },
  { to: '/profile', label: 'My Profile', roles: ['admin', 'hr', 'employee'] }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">EIMS<small>Employee Information Management</small></div>
        <nav>
          {NAV.filter((n) => n.roles.includes(user.role)).map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="who">
          <strong>{user.username}</strong>
          <span className="badge">{user.role}</span>
          <button className="btn ghost" onClick={() => { logout(); navigate('/login'); }}>Sign out</button>
        </div>
      </aside>
      <main className="content"><Outlet /></main>
    </div>
  );
}
