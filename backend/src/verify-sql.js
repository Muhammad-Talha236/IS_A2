// Read-only probes against the loopback lab API. No seed or record changes.
import assert from 'node:assert/strict';
const base = process.env.LAB_TEST_URL || 'http://127.0.0.1:5000';
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname)) {
  throw new Error('Verification must target the local lab');
}
let passed = 0;
let failed = 0;
async function check(name, path, options, status, verify) {
  try {
  const response = await fetch(base + path, options);
  const data = await response.json();
  assert.equal(response.status, status, `${name}: ${JSON.stringify(data)}`);
  verify?.(data);
  console.log(`PASS ${name} (${status})`);
  passed++;
  } catch (error) {
    console.error(`FAIL ${name}: ${error.message}`);
    failed++;
  }
}
const post = body => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
await check('database health', '/api/health', undefined, 200, d => assert.equal(d.database, 'connected'));
for (const mode of ['vulnerable', 'safe']) {
  const prefix = `/api/sql/${mode}`;
  await check(`${mode} valid login`, `${prefix}/login`, post({ email: 'demo.ta@uniassess.test', password: 'DemoPass123' }), 200, d => assert.equal(d.user.email, 'demo.ta@uniassess.test'));
  await check(`${mode} wrong password`, `${prefix}/login`, post({ email: 'demo.ta@uniassess.test', password: 'wrong' }), 401);
  await check(`${mode} missing credentials`, `${prefix}/login`, post({}), 400);
  await check(`${mode} authentication bypass`, `${prefix}/login`, post({ email: "' OR '1'='1' -- ", password: 'wrong' }), mode === 'safe' ? 401 : 200);
  for (const [input, available] of [['CS301', true], ['CS302', false], ["CS301' AND 1=1 -- ", mode === 'vulnerable'], ["CS301' AND 1=2 -- ", false]]) {
    await check(`${mode} grade ${input}`, `${prefix}/grade-availability?courseCode=${encodeURIComponent(input)}`, undefined, 200, d => assert.equal(d.available, available));
  }
  await check(`${mode} legitimate student`, `${prefix}/student-records?rollNo=23F-1001`, undefined, 200, d => assert.equal(d.records[0].roll_no, '23F-1001'));
  const probes = [
    ["' ORDER BY 3 -- ", 200, d => assert.ok(d.records.length >= 4)],
    ["' ORDER BY 4 -- ", 400],
    ["' UNION SELECT NULL,NULL -- ", 400],
    ["' UNION SELECT NULL,NULL,NULL -- ", 200, d => assert.equal(d.records.length, 1)],
    ["' UNION SELECT table_schema::text,table_name::text,NULL FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'lab_%' -- ", 200, d => assert.ok(d.records.some(r => r.student_name === 'lab_demo_credentials'))],
    ["' UNION SELECT column_name::text,data_type::text,NULL FROM information_schema.columns WHERE table_schema='public' AND table_name='lab_demo_credentials' -- ", 200, d => assert.ok(d.records.some(r => r.roll_no === 'demo_secret'))],
    ["' UNION SELECT username::text,demo_secret::text,NULL FROM lab_demo_credentials -- ", 200, d => assert.ok(d.records.some(r => r.student_name === 'FICTIONAL-ADMIN-KEY-001'))]
  ];
  for (const [i, [input, status, verify]] of probes.entries()) {
    await check(`${mode} advanced stage ${i + 1}`, `${prefix}/student-records?rollNo=${encodeURIComponent(input)}`, undefined, mode === 'safe' ? 200 : status,
      mode === 'safe' ? d => assert.deepEqual(d.records, []) : verify);
  }
}
for (const path of ['/api/courses', '/api/assessments', '/api/discussions']) {
  await check(path, path, undefined, 200, d => assert.ok(Array.isArray(d)));
}
for (const mode of ['vulnerable', 'safe']) {
  await check(`${mode} reflected XSS encoding`, `/api/${mode}/search?q=${encodeURIComponent('<b>probe</b>')}`, undefined, 200,
    d => assert.ok(d.headingHtml.includes(mode === 'safe' ? '&lt;b&gt;' : '<b>')));
}
const session = await fetch(base + '/api/lab/session', { method: 'POST' });
if (session.status === 200) {
const cookie = session.headers.get('set-cookie').split(';')[0];
await check('CSRF profile', '/api/lab/profile', { headers: { cookie } }, 200);
await check('CSRF safe missing token', '/api/lab/safe/recovery-email', { ...post({ recoveryEmail: 'probe@uniassess.test' }), headers: { ...post({}).headers, cookie } }, 403);
} else {
  console.error(`FAIL CSRF session (${session.status}): ${await session.text()}`);
  failed++;
}
console.log(`${passed} checks passed; ${failed} failed. No database records changed.`);
if (failed) process.exitCode = 1;
