import React from 'react';
import { BookOpen, ClipboardList, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Heading from '../components/ui/Heading.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import DataTable from '../components/ui/DataTable.jsx';
export default function Dashboard({ courses, assessments, onNavigate }) {
  const { session } = useAuth();
  return <><Heading tag="YOUR WORKSPACE / AT A GLANCE" title={`Welcome, ${session.user.name.split(' ')[0]}.`} subtitle="A clear view of your courses and teaching responsibilities." /><Card className="welcome-card"><div><span className="eyebrow">READY FOR YOUR NEXT CLASS</span><h3>Your teaching day, organized.</h3><p>Pick up a course conversation or check the latest grade availability.</p><Button onClick={() => onNavigate('courses')}>View my courses <ArrowRight size={16} /></Button></div><BookOpen size={84} strokeWidth={1} /></Card><div className="stats">{[[BookOpen,'Active courses',courses.length],[ClipboardList,'Assessments',assessments.length],[ShieldCheck,'Security comparisons',7]].map(([Icon,label,value]) => <Card className="stat" key={label}><Icon size={21} /><span>{label}</span><strong>{value}</strong></Card>)}</div><div className="two-col"><Card><div className="panel-top"><h3>My courses</h3><Button className="subtle" onClick={() => onNavigate('courses')}>View all</Button></div>{courses.map(c => <div className="course-row" key={c.id}><span className="course-code">{c.code}</span><div><b>{c.title}</b><p className="muted">{c.teacher_name}</p></div></div>)}</Card><Card><h3>Assessment overview</h3><DataTable columns={[{key:'course_code',label:'Course'},{key:'title',label:'Assessment'},{key:'max_marks',label:'Marks'}]} rows={assessments} /></Card></div><Card className="space-top"><h3>Continue your work</h3><div className="quick-actions"><Button onClick={() => onNavigate('discussions')}>Course discussions</Button><Button onClick={() => onNavigate('grades')}>Grade availability</Button><Button onClick={() => onNavigate('guide')}>Security lab guide</Button></div></Card></>;
}
