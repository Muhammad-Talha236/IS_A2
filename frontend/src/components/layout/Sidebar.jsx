import React from 'react';
import { GraduationCap, PanelLeftClose, ShieldCheck } from 'lucide-react';
import { navigation } from './navigation.js';
export default function Sidebar({ page, navigate, collapsed, toggle }) {
  return <aside className="sidebar"><div className="brand"><div className="brand-icon"><GraduationCap /></div><div><strong>UniAssess</strong><small>TA ACADEMIC PORTAL</small></div></div><button className="collapse-button" aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} onClick={toggle}><PanelLeftClose size={18} /></button><div className="nav-label">YOUR WORKSPACE</div><nav aria-label="Main navigation">{navigation.map(([id, label, Icon]) => <a href={`?page=${id}`} key={id} className={`nav-item ${page === id ? 'active' : ''}`} aria-current={page === id ? 'page' : undefined} title={label} onClick={event => { if (!event.ctrlKey && !event.metaKey) { event.preventDefault(); navigate(id); } }}><Icon size={18} /><span>{label}</span></a>)}</nav><div className="sidebar-foot"><ShieldCheck size={18} /><span>Learning environment<br />Fictional academic records</span></div></aside>;
}
