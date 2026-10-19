import React, { createContext, useContext, useState } from 'react';
import { setApiMode } from '../services/api.js';
const Context = createContext(null);
export function SecurityModeProvider({ children }) {
  const [mode, updateMode] = useState(() => localStorage.getItem('uniassess-mode') === 'vulnerable' ? 'vulnerable' : 'safe');
  setApiMode(mode);
  function setMode(value) {
    if (!['safe', 'vulnerable'].includes(value)) return;
    setApiMode(value);
    localStorage.setItem('uniassess-mode', value);
    updateMode(value);
  }
  return <Context.Provider value={{ mode, setMode }}>{children}</Context.Provider>;
}
export const useSecurityMode = () => useContext(Context);
