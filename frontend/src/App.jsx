import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Employees from './pages/Employees.jsx';
import Attendance from './pages/Attendance.jsx';
import Reports from './pages/Reports.jsx';
import Users from './pages/Users.jsx';
import Profile from './pages/Profile.jsx';

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'employee' ? '/attendance' : '/dashboard'} replace />;
}

const staff = ['admin', 'hr'];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<ProtectedRoute roles={staff}><Dashboard /></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute roles={staff}><Employees /></ProtectedRoute>} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/reports" element={<ProtectedRoute roles={staff}><Reports /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
