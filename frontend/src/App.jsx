
import React, { useEffect, useState } from "react";
import {
  BookOpen,
  ShieldCheck,
  ShieldAlert,
  LayoutDashboard,
  Search,
  MessageSquare,
  Megaphone,
  GraduationCap,
  ClipboardList,
  Info,
  RefreshCw,
  UserRound,
  LogIn,
  Database,
  TableProperties,
} from "lucide-react";

const modes = ["vulnerable", "safe"];

async function fetchJSON(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

// ==========================================
// SHARED COMPONENTS
// ==========================================

function Heading({ tag, title, subtitle }) {
  return (
    <div className="section-heading">
      <div className="eyebrow">{tag}</div>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

function DemoNote({ text }) {
  return (
    <div className="demo-note">
      <Info size={18} />
      <span>{text}</span>
    </div>
  );
}

function HtmlOrText({ value, mode, className = "" }) {
  // Intentionally vulnerable rendering for isolated lab only.
  return mode === "vulnerable" ? (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: value }}
    />
  ) : (
    <div className={className}>{value}</div>
  );
}

// ==========================================
// 01 — REFLECTED XSS
// ==========================================

function SearchDemo({ mode }) {
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");

    try {
      setData(
        await fetchJSON(
          `/api/${mode}/search?q=${encodeURIComponent(q)}`
        )
      );
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    setData(null);
  }, [mode]);

  return (
    <>
      <Heading
        tag="01 / REFLECTED XSS"
        title="Course Search"
        subtitle="Compare reflected input handling in vulnerable and safe modes."
      />

      <form className="searchbar" onSubmit={submit}>
        <Search size={18} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search course code or title"
        />
        <button type="submit">Search</button>
      </form>

      {error && <p className="error">{error}</p>}

      {data && (
        <section className="panel">
          <HtmlOrText
            key={mode + data.query}
            value={
              mode === "vulnerable"
                ? data.headingHtml
                : `Search results for: ${data.query}`
            }
            mode={mode}
            className="search-result-heading"
          />

          <p className="muted">
            {data.courses.length} matching courses
          </p>

          <div className="course-list">
            {data.courses.map((c) => (
              <div className="course-row" key={c.id}>
                <span className="course-code">{c.code}</span>
                <b>{c.title}</b>
                <span className="muted">
                  {c.program} · Section {c.section}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <DemoNote text="Submit the same input in both modes and compare HTML execution with safe text rendering." />
    </>
  );
}

// ==========================================
// 02 — STORED XSS
// ==========================================

function Discussions({ mode, courses }) {
  const [posts, setPosts] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [author, setAuthor] = useState("Demo TA");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    try {
      setPosts(await fetchJSON("/api/discussions"));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (courses.length && !courseId) {
      setCourseId(String(courses[0].id));
    }
  }, [courses, courseId]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await fetchJSON("/api/discussions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: Number(courseId),
          author,
          body,
        }),
      });

      setBody("");
      setSuccess("Message saved in PostgreSQL.");
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <Heading
        tag="02 / STORED XSS"
        title="Course Discussions"
        subtitle="Test how stored discussion messages are rendered."
      />

      <div className="two-col">
        <form className="panel stack" onSubmit={submit}>
          <h3>New message</h3>

          <label>
            Course
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            Author
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              maxLength={80}
            />
          </label>

          <label>
            Message
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              required
              maxLength={3000}
            />
          </label>

          <button type="submit">Post message</button>

          {success && <p className="success">{success}</p>}
          {error && <p className="error">{error}</p>}
        </form>

        <div className="panel stack">
          <div className="panel-top">
            <h3>Recent messages</h3>
            <button
              type="button"
              className="subtle"
              onClick={load}
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>

          {posts.length === 0 ? (
            <p className="muted">No discussion messages yet.</p>
          ) : (
            posts.map((p) => (
              <article className="post" key={p.id}>
                <div className="post-head">
                  <b>{p.author}</b>
                  <span className="pill">{p.course_code}</span>
                </div>

                <HtmlOrText
                  value={p.body}
                  mode={mode}
                  className="post-body"
                />

                <small className="muted">
                  {new Date(p.created_at).toLocaleString()}
                </small>
              </article>
            ))
          )}
        </div>
      </div>

      <DemoNote text="Vulnerable mode interprets stored HTML; safe mode displays message content as text." />
    </>
  );
}

// ==========================================
// 03 — DOM-BASED XSS
// ==========================================

function DomDemo({ mode }) {
  const [fragment, setFragment] = useState("");
  const [typed, setTyped] = useState("");

  useEffect(() => {
    function update() {
      const raw = window.location.hash;
      const match = raw.match(/(?:^#|&)preview=([^&]*)/);

      if (!match) {
        setFragment("");
        return;
      }

      try {
        setFragment(decodeURIComponent(match[1]));
      } catch {
        setFragment(match[1]);
      }
    }

    update();

    window.addEventListener("hashchange", update);

    return () => {
      window.removeEventListener("hashchange", update);
    };
  }, []);

  function submit(e) {
    e.preventDefault();

    window.location.hash =
      `preview=${encodeURIComponent(typed)}`;
  }

  return (
    <>
      <Heading
        tag="03 / DOM-BASED XSS"
        title="Announcement Preview"
        subtitle="Compare unsafe and safe client-side DOM rendering."
      />

      <div className="two-col">
        <form className="panel stack" onSubmit={submit}>
          <h3>Preview builder</h3>

          <label>
            Announcement content
            <textarea
              rows={5}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
            />
          </label>

          <button type="submit">
            Preview announcement
          </button>
        </form>

        <div className="panel stack">
          <h3>Announcement preview</h3>

          {fragment ? (
            <HtmlOrText
              mode={mode}
              value={fragment}
              className="announcement-preview"
            />
          ) : (
            <p className="muted">
              No announcement preview yet.
            </p>
          )}
        </div>
      </div>

      <DemoNote text="The URL fragment is handled in the browser without sending it to the backend." />
    </>
  );
}

// ==========================================
// 04 — CSRF
// ==========================================

function ProfileDemo({ mode }) {
  const [profile, setProfile] = useState(null);
  const [csrfToken, setCsrfToken] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function startSession() {
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const data = await fetchJSON("/api/lab/session", {
        method: "POST",
        credentials: "include",
      });

      setProfile(data.profile);
      setRecoveryEmail(data.profile.recovery_email);
      setCsrfToken(data.csrfToken);
      setSuccess("Demo TA session created.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function loadProfile() {
    setError("");
    setSuccess("");

    try {
      const data = await fetchJSON("/api/lab/profile", {
        credentials: "include",
      });

      setProfile(data);
      setRecoveryEmail(data.recovery_email);
    } catch (e) {
      setError(e.message);
    }
  }

  async function updateEmail(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const headers = {
        "Content-Type": "application/json",
      };

      if (mode === "safe") {
        headers["x-csrf-token"] = csrfToken;
      }

      const result = await fetchJSON(
        `/api/lab/${mode}/recovery-email`,
        {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({ recoveryEmail }),
        }
      );

      setProfile(result.profile);
      setRecoveryEmail(result.profile.recovery_email);
      setSuccess("Recovery email updated successfully.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Heading
        tag="04 / CSRF"
        title="TA Profile & Recovery Email"
        subtitle="Demonstrate recovery-email changes using a fictional TA account."
      />

      <div className="two-col">
        <section className="panel stack">
          <h3>Demo TA session</h3>

          <button
            type="button"
            onClick={startSession}
            disabled={busy}
          >
            Start Demo Session
          </button>

          <button
            type="button"
            className="subtle"
            onClick={loadProfile}
          >
            <RefreshCw size={15} />
            Refresh profile
          </button>

          {profile ? (
            <div className="stack">
              <div><b>Name:</b> {profile.name}</div>
              <div><b>Email:</b> {profile.email}</div>
              <div>
                <b>Current recovery email:</b>{" "}
                {profile.recovery_email}
              </div>
            </div>
          ) : (
            <p className="muted">
              No demo profile loaded.
            </p>
          )}
        </section>

        <form className="panel stack" onSubmit={updateEmail}>
          <h3>Change recovery email</h3>

          <label>
            New recovery email
            <input
              type="email"
              value={recoveryEmail}
              onChange={(e) =>
                setRecoveryEmail(e.target.value)
              }
              required
              maxLength={150}
            />
          </label>

          <p className="muted">
            {mode === "safe"
              ? "Safe mode requires a valid CSRF token."
              : "Vulnerable mode does not validate a CSRF token."}
          </p>

          <button
            type="submit"
            disabled={
              busy ||
              !profile ||
              (mode === "safe" && !csrfToken)
            }
          >
            Update recovery email
          </button>

          {success && <p className="success">{success}</p>}
          {error && <p className="error">{error}</p>}
        </form>
      </div>

      <DemoNote text="CSRF testing requires the separate local attacker page. Compare unauthorized recovery-email changes in both modes." />
    </>
  );
}

// ==========================================
// 05 — EASY SQL INJECTION
// ==========================================

function EasySQLDemo({ mode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setResult(null);
    setError("");
  }, [mode]);

  async function submit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await fetchJSON(
        `/api/sql/${mode}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Heading
        tag="05 / SQL INJECTION — EASY"
        title="TA Login Security"
        subtitle="Compare vulnerable SQL query construction with parameterized login queries."
      />

      <div className="two-col">
        <form className="panel stack" onSubmit={submit}>
          <h3>TA Login</h3>

          <label>
            Email address
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
            />
          </label>

          <label>
            Password
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            <LogIn size={17} />
            {loading ? "Checking..." : "Sign In"}
          </button>

          {error && <p className="error">{error}</p>}
        </form>

        <section className="panel stack">
          <h3>Authentication Result</h3>

          {!result && !error && (
            <p className="muted">
              Submit credentials to check authentication.
            </p>
          )}

          {result?.authenticated && (
            <div className="stack">
              <p className="success">
                Authentication successful
              </p>
              <div><b>Name:</b> {result.user?.name}</div>
              <div><b>Email:</b> {result.user?.email}</div>
              <div><b>Role:</b> {result.user?.role}</div>
            </div>
          )}

          {error && (
            <p className="error">
              Authentication failed: {error}
            </p>
          )}
        </section>
      </div>

      <DemoNote text="The vulnerable login constructs SQL using input strings. Safe mode uses parameterized SQL so input cannot change query structure. Use only fictional lab credentials." />
    </>
  );
}

// ==========================================
// 06 — INTERMEDIATE SQL INJECTION
// ==========================================

function IntermediateSQLDemo({ mode }) {
  const [courseCode, setCourseCode] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setResult(null);
    setError("");
  }, [mode]);

  async function submit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await fetchJSON(
        `/api/sql/${mode}/grade-availability?courseCode=${encodeURIComponent(courseCode)}`
      );

      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Heading
        tag="06 / SQL INJECTION — INTERMEDIATE"
        title="Grade Availability"
        subtitle="Investigate boolean-based SQL injection through different query outcomes."
      />

      <div className="two-col">
        <form className="panel stack" onSubmit={submit}>
          <h3>Check Grade Availability</h3>

          <label>
            Course code
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="e.g. CS301"
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            <Search size={17} />
            {loading ? "Checking..." : "Check Availability"}
          </button>

          {error && <p className="error">{error}</p>}
        </form>

        <section className="panel stack">
          <h3>Availability Result</h3>

          {result ? (
            <>
              <p className={
                result.available ? "success" : "muted"
              }>
                {result.message}
              </p>

              <div>
                <b>Available:</b>{" "}
                {result.available ? "Yes" : "No"}
              </div>
            </>
          ) : (
            <p className="muted">
              Enter a course code to check its grade status.
            </p>
          )}
        </section>
      </div>

      <DemoNote text="Compare TRUE and FALSE query conditions in the isolated vulnerable lab. Parameterized queries prevent input from modifying SQL conditions." />
    </>
  );
}

// ==========================================
// 07 — ADVANCED SQL INJECTION
// ==========================================

function AdvancedSQLDemo({ mode }) {
  const [rollNo, setRollNo] = useState("");
  const [records, setRecords] = useState([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRecords([]);
    setError("");
    setSearched(false);
  }, [mode]);

  async function submit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setRecords([]);
    setSearched(false);

    try {
      const data = await fetchJSON(
        `/api/sql/${mode}/student-records?rollNo=${encodeURIComponent(rollNo)}`
      );

      setRecords(data.records || []);
      setSearched(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Heading
        tag="07 / SQL INJECTION — ADVANCED"
        title="Student Records Lookup"
        subtitle="Analyze multi-stage SQL injection against fictional records and database metadata."
      />

      <form className="searchbar" onSubmit={submit}>
        <Search size={18} />

        <input
          type="text"
          value={rollNo}
          onChange={(e) => setRollNo(e.target.value)}
          placeholder="Enter student roll number"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search Records"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <section className="panel stack">
        <h3>Database Query Results</h3>

        {!searched && !error && (
          <p className="muted">
            Enter a roll number to view fictional academic records.
          </p>
        )}

        {searched && records.length === 0 && (
          <p className="muted">
            No matching records found.
          </p>
        )}

        {records.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px" }}>Roll No</th>
                  <th style={{ padding: "12px" }}>Student Name</th>
                  <th style={{ padding: "12px" }}>Result</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record, index) => (
                  <tr key={index}>
                    <td style={{ padding: "12px" }}>
                      {record.roll_no}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {record.student_name}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {record.result}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <DemoNote text="Advanced lab stages cover query columns, schema metadata, table structure and fictional data. Safe mode treats the submitted roll number as a literal value." />
    </>
  );
}

// ==========================================
// DASHBOARD
// ==========================================

function Overview({ courses, assessments, onNavigate }) {
  const quickActions = [
    ["Course Search", "search"],
    ["Discussions", "discussions"],
    ["Announcements", "announcements"],
    ["TA Profile / CSRF", "profile"],
    ["SQLi Easy", "sql-easy"],
    ["SQLi Intermediate", "sql-intermediate"],
    ["SQLi Advanced", "sql-advanced"],
  ];

  return (
    <>
      <Heading
        tag="TA WORKSPACE / OVERVIEW"
        title="Academic workspace"
        subtitle="UniAssess teaching-assistant portal for controlled Information Security demonstrations."
      />

      <div className="stats">
        <div className="stat">
          <BookOpen />
          <span>Courses</span>
          <strong>{courses.length}</strong>
        </div>

        <div className="stat">
          <ClipboardList />
          <span>Assessments</span>
          <strong>{assessments.length}</strong>
        </div>

        <div className="stat">
          <ShieldCheck />
          <span>Security cases</span>
          <strong>7</strong>
        </div>
      </div>

      <section className="panel">
        <div className="panel-top">
          <h3>Course offerings</h3>
          <span className="muted">Demo academic data only</span>
        </div>

        <div className="course-list">
          {courses.map((c) => (
            <div className="course-row" key={c.id}>
              <span className="course-code">{c.code}</span>

              <div>
                <b>{c.title}</b>
                <div className="muted">{c.teacher_name}</div>
              </div>

              <span className="pill">
                {c.program} · {c.section}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel space-top">
        <h3>Security lab workflow</h3>

        <div className="quick-actions">
          {quickActions.map(([label, id]) => (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

// ==========================================
// SIDEBAR NAVIGATION
// ==========================================

const items = [
  ["overview", "Overview", LayoutDashboard],
  ["search", "Course Search", Search],
  ["discussions", "Discussions", MessageSquare],
  ["announcements", "Announcements", Megaphone],
  ["profile", "TA Profile / CSRF", UserRound],
  ["sql-easy", "SQLi — Easy", LogIn],
  ["sql-intermediate", "SQLi — Intermediate", Database],
  ["sql-advanced", "SQLi — Advanced", TableProperties],
];

// ==========================================
// MAIN APPLICATION
// ==========================================

export default function App() {
  const [mode, setMode] = useState("vulnerable");
  const [page, setPage] = useState("overview");
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    Promise.all([
      fetchJSON("/api/courses"),
      fetchJSON("/api/assessments"),
    ])
      .then(([coursesData, assessmentsData]) => {
        setCourses(coursesData);
        setAssessments(assessmentsData);
      })
      .catch((error) => {
        setServerError(
          error.message +
          " — Is the backend/database running?"
        );
      });
  }, []);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <GraduationCap />
          </div>

          <div>
            <strong>UniAssess</strong>
            <small>TA Portal / Security Lab</small>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav>
          {items.map(([id, label, Icon]) => (
            <button
              key={id}
              className={
                "nav-item " + (page === id ? "active" : "")
              }
              onClick={() => setPage(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <ShieldAlert size={16} />
          <span>
            Local demonstration only
            <br />
            No real student data
          </span>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="breadcrumbs">
            TA Workspace
            <span>/</span>
            {items.find((item) => item[0] === page)?.[1]}
          </div>

          <div className="user-chip">
            <span className="avatar">TA</span>
            Demo Teaching Assistant
          </div>
        </header>

        <main className="content">
          <div className="modebar">
            <div className="mode-description">
              <b>Security comparison mode</b>
              <span>
                Compare vulnerable and safe implementations.
              </span>
            </div>

            <div className="mode-toggle">
              {modes.map((currentMode) => (
                <button
                  key={currentMode}
                  className={
                    mode === currentMode
                      ? "selected " + currentMode
                      : ""
                  }
                  onClick={() => setMode(currentMode)}
                >
                  {currentMode === "vulnerable" ? (
                    <ShieldAlert size={16} />
                  ) : (
                    <ShieldCheck size={16} />
                  )}

                  {currentMode === "vulnerable"
                    ? "Vulnerable"
                    : "Safe"}
                </button>
              ))}
            </div>
          </div>

          {serverError && (
            <div className="error-banner">
              {serverError}
            </div>
          )}

          {page === "overview" && (
            <Overview
              courses={courses}
              assessments={assessments}
              onNavigate={setPage}
            />
          )}

          {page === "search" && (
            <SearchDemo mode={mode} />
          )}

          {page === "discussions" && (
            <Discussions
              mode={mode}
              courses={courses}
            />
          )}

          {page === "announcements" && (
            <DomDemo mode={mode} />
          )}

          {page === "profile" && (
            <ProfileDemo mode={mode} />
          )}

          {page === "sql-easy" && (
            <EasySQLDemo mode={mode} />
          )}

          {page === "sql-intermediate" && (
            <IntermediateSQLDemo mode={mode} />
          )}

          {page === "sql-advanced" && (
            <AdvancedSQLDemo mode={mode} />
          )}
        </main>
      </div>
    </div>
  );
}
