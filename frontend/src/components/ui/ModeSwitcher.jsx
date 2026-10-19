import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useSecurityMode } from '../../context/SecurityModeContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import StatusMessage from './StatusMessage.jsx';
export default function ModeSwitcher() {
  const { mode } = useSecurityMode();
  const { changeMode, session } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function change(value) {
    setBusy(true); setError('');
    try { await changeMode(value); } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <div><div className="mode-toggle" aria-label="Security mode">{['vulnerable', 'safe'].map(value => <button type="button" disabled={busy} key={value} aria-pressed={mode === value} className={mode === value ? `selected ${value}` : ''} onClick={() => change(value)}>{value === 'safe' ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}{value === 'safe' ? 'Safe' : 'Vulnerable'}</button>)}</div>
  {session && <small className="mode-help">Changing mode signs you out.</small>}<StatusMessage tone="error">{error}</StatusMessage></div>;
}
