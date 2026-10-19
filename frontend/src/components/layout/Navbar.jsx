import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSecurityMode } from '../../context/SecurityModeContext.jsx';
import { navigation } from './navigation.js';
import Button from '../ui/Button.jsx';
import StatusMessage from '../ui/StatusMessage.jsx';
export default function Navbar({ page }) {
  const { session, logout } = useAuth();
  const { mode } = useSecurityMode();
  const [error, setError] = useState('');
  async function signOut() { try { await logout(); } catch (e) { setError(e.message); } }
  return <><header className="topbar"><div className="breadcrumbs">Workspace<span>/</span><b>{navigation.find(item => item[0] === page)?.[1]}</b></div><div className="account-controls"><span className={`mode-badge ${mode}`}>{mode} mode</span><div className="user-chip"><span className="avatar">{session.user.name.slice(0, 2).toUpperCase()}</span><span>{session.user.name}<small>{session.user.role}</small></span></div><Button className="subtle" onClick={signOut} aria-label="Sign out"><LogOut size={16} /><span>Sign out</span></Button></div></header><StatusMessage tone="error">{error}</StatusMessage></>;
}
