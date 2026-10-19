import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';
import ModeSwitcher from '../ui/ModeSwitcher.jsx';
import StatusMessage from '../ui/StatusMessage.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
export default function AppLayout({ page, navigate, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { session } = useAuth();
  return <div className={`app ${collapsed ? 'sidebar-collapsed' : ''}`}><a className="skip-link" href="#workspace">Skip to content</a><Sidebar page={page} navigate={navigate} collapsed={collapsed} toggle={() => setCollapsed(!collapsed)} /><div className="main"><Navbar page={page} /><main className="content" id="workspace"><div className="modebar"><div className="mode-description"><b>Security comparison</b><span>The same academic workflow, with different security controls.</span></div><ModeSwitcher /></div>{session.bypassed && <StatusMessage tone="warning">Authentication was bypassed: PostgreSQL returned this account even though the submitted credentials did not match. This is a vulnerable demo session.</StatusMessage>}{children}</main></div></div>;
}
