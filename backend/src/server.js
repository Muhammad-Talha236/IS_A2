import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './db.js';

const app = express();
const allowedOrigins = new Set(['http://localhost:5173','http://127.0.0.1:5173']);
app.use(cors({ origin(origin, callback) { if (!origin || allowedOrigins.has(origin)) return callback(null, true); return callback(new Error('Origin not allowed')); } }));
app.use(express.json({limit:'12kb'}));

// DELIBERATE VULNERABLE ROUTES: LOCAL CLASSROOM LAB ONLY.
// Never deploy this server or connect it to real student records.
const isMode = (mode) => ['vulnerable','safe'].includes(mode);
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

app.get('/api/health',async(_req,res)=>{
  try { await pool.query('SELECT 1'); res.json({status:'ok',database:'connected'}); }
  catch { res.status(503).json({status:'error',message:'Database unavailable'}); }
});

app.get('/api/courses',async(_req,res,next)=>{
  try { const {rows}=await pool.query('SELECT * FROM courses ORDER BY code'); res.json(rows); } catch(e){next(e);}
});
app.get('/api/assessments',async(_req,res,next)=>{
  try { const {rows}=await pool.query('SELECT a.id,a.title,a.max_marks,c.code AS course_code FROM assessments a JOIN courses c ON c.id=a.course_id ORDER BY a.id'); res.json(rows); } catch(e){next(e);}
});

// Reflected XSS: untrusted request parameter is put directly into an HTML response field.
// Safe mode HTML-encodes it. The React frontend demonstrates the resulting render behavior.
app.get('/api/:mode/search',async(req,res,next)=>{
  const {mode}=req.params; if(!isMode(mode)) return res.status(404).json({error:'Unknown mode'});
  const q=String(req.query.q??'').slice(0,500);
  try {
    const {rows}=await pool.query('SELECT * FROM courses WHERE code ILIKE $1 OR title ILIKE $1 ORDER BY code', [`%${q}%`]);
    const shown=mode==='vulnerable' ? q : escapeHTML(q);
    res.json({query:q, headingHtml:`Search results for: ${shown}`,courses:rows});
  }catch(e){ next(e); }
});

// Stored XSS: comments are stored as real DB records in both modes.
// Vulnerability is in how the frontend renders the stored content.
app.get('/api/discussions',async(req,res,next)=>{
  try { const {rows}=await pool.query('SELECT d.id,d.author,d.body,d.created_at,c.code AS course_code FROM discussions d JOIN courses c ON c.id=d.course_id ORDER BY d.id DESC LIMIT 100'); res.json(rows); }
  catch(e){next(e);}
});
app.post('/api/discussions',async(req,res,next)=>{
  const author=String(req.body?.author??'').trim();
  const body=String(req.body?.body??'').trim();
  const courseId=Number(req.body?.courseId);
  if(!author || author.length>80 || !body || body.length>3000 || !Number.isInteger(courseId)) return res.status(400).json({error:'Author, course and message required.'});
  try { const {rows}=await pool.query('INSERT INTO discussions(course_id,author,body) VALUES ($1,$2,$3) RETURNING id,author,body,created_at',[courseId,author,body]);res.status(201).json(rows[0]); }
  catch(e){ if(e.code==='23503') return res.status(400).json({error:'Invalid course'}); next(e);}
});

app.use((err,req,res,next)=>{ console.error(err.message); res.status(500).json({error:'Server error'}); });
// Bind to loopback only: this vulnerable demo is not accessible from other machines.
const port=Number(process.env.PORT||5000);
app.listen(port,'127.0.0.1',()=>console.log(`UniAssess security lab: http://127.0.0.1:${port}`));
