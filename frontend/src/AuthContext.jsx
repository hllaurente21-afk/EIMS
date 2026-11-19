import { createContext, useContext, useState } from 'react';
import { api } from './api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('eims_user')); } catch { return null; }
  });

  async function login(username, password) {
    const d = await api('/auth/login', { method: 'POST', body: { username, password } });
    localStorage.setItem('eims_token', d.token);
    localStorage.setItem('eims_user', JSON.stringify(d.user));
    setUser(d.user);
    return d.user;
  }

  function logout() {
    localStorage.removeItem('eims_token');
    localStorage.removeItem('eims_user');
    setUser(null);
  }

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}
