import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService.js';
import { useSecurityMode } from './SecurityModeContext.jsx';
const Context = createContext(null);
export function AuthProvider({ children }) {
  const { mode, setMode } = useSecurityMode();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    authService.session().then(data => { if (active) { setSession(data); setError(''); } })
      .catch(e => { if (active) { setSession(null); setError(e.status === 401 ? '' : e.message); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [mode]);
  useEffect(() => {
    const expire = () => setSession(null);
    window.addEventListener('session-expired', expire);
    return () => window.removeEventListener('session-expired', expire);
  }, []);
  async function login(email, password) {
    const data = await authService.login(mode, email, password);
    setSession(data);
    setError('');
  }
  async function logout() {
    if (session) await authService.logout(session.csrfToken);
    setSession(null);
  }
  async function changeMode(value) {
    if (value === mode) return;
    await logout();
    setMode(value);
  }
  return <Context.Provider value={{ session: session?.mode === mode ? session : null, loading, error, login, logout, changeMode }}>{children}</Context.Provider>;
}
export const useAuth = () => useContext(Context);
