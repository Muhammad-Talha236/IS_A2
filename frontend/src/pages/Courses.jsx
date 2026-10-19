import React from 'react';
import { BookOpen, ArrowUpRight } from 'lucide-react';
import Heading from '../components/ui/Heading.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
export default function Courses({ courses, assessments, onNavigate }) {
  return <><Heading tag="ACADEMICS / COURSE DIRECTORY" title="My courses" subtitle="Your fictional course offerings and assessment responsibilities." /><div className="course-grid">{courses.map(c => <Card className="course-card" key={c.id}><div className="panel-top"><span className="course-code">{c.code}</span><BookOpen size={20} /></div><h3>{c.title}</h3><p className="muted">{c.teacher_name}</p><div className="course-meta"><span>{c.program}</span><span>Section {c.section}</span></div><p className="muted">{assessments.filter(a => a.course_code === c.code).length} assessments</p><Button className="subtle" onClick={() => onNavigate('discussions')}>Open discussions <ArrowUpRight size={15} /></Button></Card>)}</div>{!courses.length && <Card>No courses available.</Card>}</>;
}
