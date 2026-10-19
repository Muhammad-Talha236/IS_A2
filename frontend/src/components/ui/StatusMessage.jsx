import React from 'react';
export default function StatusMessage({ children, tone = 'info' }) {
  if (!children) return null;
  return <div className={`status-message ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>;
}
