# SQL lab investigation and verification

The initial Easy HTTP 500 could not be reproduced. At the start of investigation,
valid fictional credentials returned HTTP 200 directly through Express and through
Vite. Its historical cause therefore remains unconfirmed; no historical backend log
was available to attribute it reliably.

Intermediate and Advanced did fail against the configured database. PostgreSQL
error `42P01` identified missing tables. The setup script loaded only `schema.sql`
and never loaded `security_lab.sql`. SQL routes also swallowed diagnostics and
returned generic input errors for infrastructure failures.

Corrections:

- Setup loads both schema files in a transaction, with idempotent fictional seeds.
- The missing CSRF profile schema/seed is included for a fresh setup.
- On the user's authorization, setup was successfully executed against the existing
  Neon database. Existing records are preserved through conflict checks.
- Syntax/column errors return 400; missing schema/connection errors return 503.
  Backend logs contain PostgreSQL error codes without logging login credentials.
- Safe queries use PostgreSQL parameters. Vulnerable queries remain intentionally
  injectable but use single-statement, read-only transactions with a timeout.
- Login now establishes a genuine mode-bound session, with bypass detection from
  actual credential comparison and backend protection for portal APIs.

Demo inputs: `demo.ta@uniassess.test` / `DemoPass123`, `CS301`, `CS302`, `23F-1001`.
The in-app guide documents all advanced metadata/UNION stages.

Run `npm.cmd run test:sql` from backend. The integration suite starts its own
loopback Express server and uses the configured Neon database. It checks sessions,
mode isolation, all SQL stages, existing academic APIs, reflected output, persisted
discussions, real forged-form profile changes, safe rejection and legitimate updates.
Temporary discussions are removed and the pre-test recovery email is restored.

The final verification results are recorded in IMPLEMENTATION.md. Frontend markup
checks and a production build were also executed. Interactive browser layout,
console inspection, real browser form/cookie delivery and XSS event execution were
not tested because no controllable browser was connected. The HTTP forged-form and
actual database outcomes were tested; those do not establish browser delivery.

The API and frontend remain local. PostgreSQL is hosted Neon, as explicitly
selected by the user. No site was deployed or made public.
