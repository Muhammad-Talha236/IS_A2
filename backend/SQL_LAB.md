# SQL injection lab

Keep the API and Vite bound to loopback. Use a dedicated PostgreSQL database
containing fictional records only. The existing `.env` currently selects hosted
PostgreSQL; change `DATABASE_URL` to your local lab database before setup if you
require a fully local lab. Do not publish the vulnerable endpoints.

From `backend`, run:

```powershell
npm.cmd run db:setup
npm.cmd run test:sql
```

Setup loads both SQL files in one transaction. Existing rows are preserved by
the seed conflict checks. It also creates the fictional profile used by CSRF.
The test command targets `http://127.0.0.1:5000` by default. Set `LAB_TEST_URL`
to `http://127.0.0.1:5173` to repeat the checks through Vite.

Demo login: `demo.ta@uniassess.test` / `DemoPass123`.
Published course: `CS301`; unpublished course: `CS302`.
Student record: `23F-1001`.

The read-only verification script checks normal and invalid logins,
authentication bypass, boolean TRUE/FALSE results, three-column discovery,
table and column metadata, and fictional credential retrieval. Every injection
probe is also tested as ordinary input in Safe mode. It checks course,
assessment, discussion and reflected-search APIs, creates an in-memory CSRF
session, reads the profile, and checks rejection of a missing CSRF token.
It does not post discussions or change recovery emails.

The original Easy HTTP 500 was not reproducible during investigation: login
returned HTTP 200 directly and through Vite. Intermediate and Advanced returned
missing-table errors. The previous setup script loaded only `schema.sql`,
omitting all SQL-injection tables. SQL errors were silently returned as generic
400 responses. SQL routes now log the PostgreSQL error code and distinguish
invalid demo queries (400) from missing tables/database failures (503).

Browser rendering, DOM XSS execution, stored-XSS execution, and successful CSRF
updates require separate browser/write testing. Passing this API suite does
not establish those behaviors.
