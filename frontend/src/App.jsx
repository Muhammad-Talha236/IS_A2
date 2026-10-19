import React from 'react';
import { SecurityModeProvider } from './context/SecurityModeContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Workspace from './components/layout/Workspace.jsx';
import StatusMessage from './components/ui/StatusMessage.jsx';
function SessionRouter() {
  const { session, loading } = useAuth();
  if (loading) return <div className="session-loading"><StatusMessage>Restoring your session...</StatusMessage></div>;
  return session ? <Workspace /> : <Login />;
}
export default function App() {
  return <SecurityModeProvider><AuthProvider><SessionRouter /></AuthProvider></SecurityModeProvider>;
}
