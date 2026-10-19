import assert from 'node:assert/strict';
import app from '../src/app.js';
import { pool } from '../src/db.js';

// Actual HTTP and PostgreSQL integration, with narrowly scoped cleanup.
const server = await new Promise(resolve => {
  const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
});
const base = process.env.LAB_TEST_URL || `http://127.0.0.1:${server.address().port}`;
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname));
let passed = 0;
let failures = 0;
let unexpected500 = 0;
let discussionId;
const author = `Lab integration ${Date.now()}`;
const notice = '<div data-lab="notice" style="padding:18px;background:#fff1c2">Fictional academic notice</div>';
async function request(path, { cookie, mode, body, method, token, origin, form } = {}) {
  const headers = {};
  if (cookie) headers.cookie = cookie;
  if (mode) headers['x-security-mode'] = mode;
  if (token) headers['x-csrf-token'] = token;
  if (origin) headers.origin = origin;
  if (body !== undefined) headers['Content-Type'] = form ? 'application/x-www-form-urlencoded' : 'application/json';
  const response = await fetch(base + path, { method: method || (body === undefined ? 'GET' : 'POST'), headers, body: body === undefined ? undefined : form ? new URLSearchParams(body) : JSON.stringify(body) });
  if (response.status >= 500 && response.status !== 503) unexpected500++;
  return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
async function test(name, work) {
  try { await work(); passed++; console.log(`PASS ${name}`); }
  catch (error) { failures++; console.error(`FAIL ${name}: ${error.message}`); }
}
function status(response, expected) { assert.equal(response.status, expected, JSON.stringify(response.data)); return response.data; }
async function login(mode, email = 'demo.ta@uniassess.test', password = 'DemoPass123', cookie) {
  return request(`/api/sql/${mode}/login`, { body: { email, password }, cookie });
}
try {
  await test('PostgreSQL connectivity and all required tables', async () => {
    const tables = ['courses','assessments','discussions','lab_profiles','lab_users','lab_grade_availability','lab_student_records','lab_demo_credentials'];
    for (const table of tables) {
      const result = await pool.query('SELECT to_regclass($1) AS name', [table]);
      assert.equal(result.rows[0].name, table);
    }
    status(await request('/api/health'), 200);
  });
  for (const path of ['/api/courses', '/api/assessments', '/api/discussions', '/api/lab/profile', '/api/lab/session', '/api/sql/safe/student-records']) {
    await test(`protected ${path}`, async () => status(await request(path, { method: path.endsWith('/session') ? 'POST' : 'GET' }), 401));
  }
  await test('unknown login mode', async () => status(await login('invalid'), 404));
  await test('cross-origin login rejected', async () => status(await request('/api/sql/safe/login', { body: { email:'demo.ta@uniassess.test',password:'DemoPass123' }, origin:'http://127.0.0.1:4100' }), 403));
  for (const mode of ['vulnerable', 'safe']) {
    const other = mode === 'safe' ? 'vulnerable' : 'safe';
    const prefix = `/api/sql/${mode}`;
    await test(`${mode}: missing login fields`, async () => status(await request(`${prefix}/login`, { body: {} }), 400));
    await test(`${mode}: wrong password`, async () => status(await login(mode, undefined, 'wrong'), 401));
    const signedIn = await login(mode);
    const data = status(signedIn, 200);
    const context = { cookie: signedIn.cookie, mode };
    await test(`${mode}: valid login creates real session`, async () => {
      assert.ok(context.cookie);
      assert.equal(data.bypassed, false);
      assert.equal(data.user.email, 'demo.ta@uniassess.test');
      const current = status(await request('/api/auth/session', context), 200);
      assert.equal(current.user.id, data.user.id);
      assert.equal(current.mode, mode);
    });
    await test(`${mode}: opposite mode endpoint rejected`, async () => status(await request(`/api/sql/${other}/grade-availability?courseCode=CS301`, context), 401));
    await test(`${mode}: encoded opposite mode rejected`, async () => {
      const encoded = other === 'safe' ? '%73afe' : '%76ulnerable';
      status(await request(`/api/sql/${encoded}/grade-availability?courseCode=CS301`, context), 401);
    });
    await test(`${mode}: opposite mode header rejected`, async () => status(await request('/api/courses', { ...context, mode: other }), 401));
    await test(`${mode}: genuine authentication bypass comparison`, async () => {
      const bypass = await login(mode, "' OR '1'='1' -- ", 'wrong');
      if (mode === 'safe') { status(bypass, 401); assert.equal(bypass.cookie, undefined); }
      else {
        assert.equal(status(bypass, 200).bypassed, true);
        status(await request('/api/courses', { cookie: bypass.cookie, mode }), 200);
        status(await request('/api/auth/logout', { cookie: bypass.cookie, mode, token: bypass.data.csrfToken, body: {} }), 200);
        status(await request('/api/courses', { cookie: bypass.cookie, mode }), 401);
      }
    });
    for (const [course, available] of [['CS301', true], ['CS302', false], ["CS301' AND 1=1 -- ", mode === 'vulnerable'], ["CS301' AND 1=2 -- ", false]]) {
      await test(`${mode}: grade ${course}`, async () => assert.equal(status(await request(`${prefix}/grade-availability?courseCode=${encodeURIComponent(course)}`, context), 200).available, available));
    }
    await test(`${mode}: normal student lookup`, async () => assert.equal(status(await request(`${prefix}/student-records?rollNo=23F-1001`, context), 200).records[0].roll_no, '23F-1001'));
    const probes = [
      ["' ORDER BY 3 -- ", 200, d => assert.deepEqual(d.records, [])],
      ["' ORDER BY 4 -- ", 400],
      ["' UNION SELECT NULL,NULL -- ", 400],
      ["' UNION SELECT NULL,NULL,NULL -- ", 200, d => assert.equal(d.records.length, 1)],
      ["' UNION SELECT table_schema::text,table_name::text,NULL FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'lab_%' -- ", 200, d => assert.ok(d.records.some(r => r.student_name === 'lab_demo_credentials'))],
      ["' UNION SELECT column_name::text,data_type::text,NULL FROM information_schema.columns WHERE table_schema='public' AND table_name='lab_demo_credentials' -- ", 200, d => assert.ok(d.records.some(r => r.roll_no === 'demo_secret'))],
      ["' UNION SELECT username::text,demo_secret::text,NULL FROM lab_demo_credentials -- ", 200, d => assert.ok(d.records.some(r => r.student_name === 'FICTIONAL-ADMIN-KEY-001'))]
    ];
    for (const [i, [input, expected, verify]] of probes.entries()) {
      await test(`${mode}: advanced stage ${i + 1}`, async () => {
        const result = status(await request(`${prefix}/student-records?rollNo=${encodeURIComponent(input)}`, context), mode === 'safe' ? 200 : expected);
        if (mode === 'safe') assert.deepEqual(result.records, []); else verify?.(result);
      });
    }
    await test(`${mode}: malformed SQL handled`, async () => {
      const result = await request(`${prefix}/student-records?rollNo=${encodeURIComponent("'")}`, context);
      status(result, mode === 'safe' ? 200 : 400);
    });
    await test(`${mode}: reflected search visible markup versus escaped text`, async () => {
      const result = status(await request(`/api/${mode}/search?q=${encodeURIComponent(notice)}`, context), 200);
      assert.ok(result.headingHtml.includes(mode === 'safe' ? '&lt;div' : '<div'));
      assert.equal(result.query, notice);
    });
    for (const path of ['/api/courses', '/api/assessments', '/api/discussions']) {
      await test(`${mode}: ${path}`, async () => assert.ok(Array.isArray(status(await request(path, context), 200))));
    }
    await test(`${mode}: stored discussion round trip from PostgreSQL`, async () => {
      const courses = status(await request('/api/courses', context), 200);
      const created = status(await request('/api/discussions', { ...context, body: { courseId: courses[0].id, author, body: notice } }), 201);
      discussionId = created.id;
      const fromDb = await pool.query('SELECT body FROM discussions WHERE id=$1 AND author=$2', [discussionId, author]);
      assert.equal(fromDb.rows[0].body, notice);
      const reloaded = status(await request('/api/discussions', context), 200);
      assert.equal(reloaded.find(p => p.id === discussionId).body, notice);
      await pool.query('DELETE FROM discussions WHERE id=$1 AND author=$2', [discussionId, author]);
      discussionId = undefined;
    });
    const profile = status(await request('/api/lab/profile', context), 200);
    try {
      await test(`${mode}: profile session retains CSRF token`, async () => assert.equal(status(await request('/api/lab/session', { ...context, method: 'POST' }), 200).csrfToken, data.csrfToken));
      await test(`${mode}: forged form and persistent profile outcome`, async () => {
        const response = await request(`/api/lab/${mode}/recovery-email`, { ...context, mode: undefined, origin: 'http://127.0.0.1:4100', form: true, body: { recoveryEmail: 'forged.integration@uniassess.test' } });
        status(response, mode === 'safe' ? 403 : 200);
        const refreshed = status(await request('/api/lab/profile', context), 200);
        assert.equal(refreshed.recovery_email, mode === 'safe' ? profile.recovery_email : 'forged.integration@uniassess.test');
      });
      await test(`${mode}: legitimate profile update`, async () => {
        const updated = status(await request(`/api/lab/${mode}/recovery-email`, { ...context, token: data.csrfToken, body: { recoveryEmail: 'legitimate.integration@uniassess.test' } }), 200);
        assert.equal(updated.profile.recovery_email, 'legitimate.integration@uniassess.test');
      });
      await test(`${mode}: invalid recovery email`, async () => status(await request(`/api/lab/${mode}/recovery-email`, { ...context, token: data.csrfToken, body: { recoveryEmail:'invalid' } }), 400));
    } finally {
      // Restore the exact pre-test value, even when an assertion fails.
      await pool.query('UPDATE lab_profiles SET recovery_email=$1 WHERE id=$2', [profile.recovery_email, profile.id]);
    }
    await test(`${mode}: logout needs CSRF token`, async () => status(await request('/api/auth/logout', { ...context, body: {} }), 403));
    await test(`${mode}: session rotation invalidates previous cookie`, async () => {
      const rotated = await login(mode, undefined, undefined, context.cookie);
      status(rotated, 200);
      status(await request('/api/auth/session', context), 401);
      context.cookie = rotated.cookie;
      data.csrfToken = rotated.data.csrfToken;
    });
    await test(`${mode}: logout and revoked session`, async () => {
      status(await request('/api/auth/logout', { ...context, token: data.csrfToken, body: {} }), 200);
      status(await request('/api/courses', context), 401);
    });
  }
  await test('production guard rejects lab routes', async () => {
    if (process.env.LAB_TEST_URL) return;
    const original = process.env.NODE_ENV;
    try { process.env.NODE_ENV = 'production'; status(await request('/api/health'), 403); }
    finally { if (original === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = original; }
  });
  await test('no unexpected HTTP 500 responses', async () => assert.equal(unexpected500, 0));
} finally {
  if (discussionId) await pool.query('DELETE FROM discussions WHERE id=$1 AND author=$2', [discussionId, author]);
  await new Promise(resolve => server.close(resolve));
  await pool.end();
}
console.log(`${passed} passed; ${failures} failed. Temporary discussions removed; original recovery email restored.`);
if (failures) process.exitCode = 1;
