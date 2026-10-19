import React, { useState } from 'react';
import { GraduationCap, ArrowRight, ShieldCheck, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSecurityMode } from '../context/SecurityModeContext.jsx';
import ModeSwitcher from '../components/ui/ModeSwitcher.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
export default function Login() {
  const { login, error: sessionError } = useAuth();
  const { mode } = useSecurityMode();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { await login(email, password); } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <div className="login-shell"><aside className="login-story"><div className="brand"><div className="brand-icon"><GraduationCap /></div><div><strong>UniAssess</strong><small>TEACHING ASSISTANT PORTAL</small></div></div>
    <div className="login-intro"><span className="eyebrow">YOUR ACADEMIC WORKSPACE</span><h1>More time for<br />meaningful teaching.</h1><p>Courses, conversations and academic records.<br />One focused space for your teaching day.</p><div className="story-feature"><BookOpen /><span>Connected coursework<br /><small>Keep your academic responsibilities in view.</small></span></div><div className="story-feature"><ShieldCheck /><span>Learn by exploring<br /><small>A controlled lab with fictional university data.</small></span></div></div><small className="login-foot">UniAssess / Information Security Lab</small></aside>
    <main className="login-main"><form className="login-form stack" onSubmit={submit} key={mode}><span className="eyebrow">WELCOME BACK</span><h1>Sign in to your workspace</h1><p className="muted">Use your fictional teaching assistant account to continue.</p><ModeSwitcher />
      <label>Email address<Input type="text" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@uniassess.test" required maxLength={150} /></label>
      <label>Password<Input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required maxLength={150} /></label>
      <StatusMessage tone="error">{error || sessionError}</StatusMessage><Button type="submit" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}<ArrowRight size={17} /></Button>
      <div className="demo-credentials"><b>Explore the demo</b><code>demo.ta@uniassess.test</code><code>DemoPass123</code><Button className="subtle" onClick={() => { setEmail('demo.ta@uniassess.test'); setPassword('DemoPass123'); }}>Use demo credentials</Button></div>
      <p className="muted">{mode === 'safe' ? 'Safe mode uses parameterized authentication.' : 'Vulnerable mode intentionally permits SQL authentication bypass.'} Only fictional accounts are used.</p>
    </form></main></div>;
}
