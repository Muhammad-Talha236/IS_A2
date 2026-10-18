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
} from "lucide-react";

const modes = ["vulnerable", "safe"];
async function fetchJSON(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}
function Heading({ tag, title, subtitle }) {
  return (
    <div className="section-heading">
      <div className="eyebrow">{tag}</div>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}
function HtmlOrText({ value, mode, className = "" }) {
  // ONLY for an isolated intentionally insecure classroom application.
  // Dangerous mode is never appropriate for actual academic records.
  return mode === "vulnerable" ? (
    <div className={className} dangerouslySetInnerHTML={{ __html: value }} />
  ) : (
    <div className={className}>{value}</div>
  );
}
function SearchDemo({ mode, courses }) {
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      setData(
        await fetchJSON(`/api/${mode}/search?q=${encodeURIComponent(q)}`),
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
        subtitle="Search for a course. Vulnerable mode renders reflected input as HTML; safe mode renders it as text."
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
          <p className="muted">{data.courses.length} matching courses</p>
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
      <DemoNote text="Proof: submit the same harmless demonstration payload in both modes; compare browser execution versus literal text." />
    </>
  );
}
function Discussions({ mode, courses }) {
  const [posts, setPosts] = useState([]),
    [courseId, setCourseId] = useState(""),
    [author, setAuthor] = useState("Demo TA"),
    [body, setBody] = useState(""),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
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
    if (courses.length && !courseId) setCourseId(String(courses[0].id));
  }, [courses, courseId]);
  async function submit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await fetchJSON("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: Number(courseId), author, body }),
      });
      setBody("");
      setSuccess(
        "Message saved in PostgreSQL. Refresh or switch modes to test persistence.",
      );
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
        subtitle="Create a discussion message and reload the page to check database persistence."
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
              required
              rows={5}
              maxLength={3000}
              placeholder="Write a class discussion..."
            />
          </label>
          <button type="submit">Post message</button>
          {success && <p className="success">{success}</p>}
          {error && <p className="error">{error}</p>}
        </form>
        <div className="panel stack">
          <div className="panel-top">
            <h3>Recent messages</h3>
            <button className="subtle" onClick={load} type="button">
              <RefreshCw size={15} /> Refresh
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
                <HtmlOrText value={p.body} mode={mode} className="post-body" />
                <small className="muted">
                  {new Date(p.created_at).toLocaleString()}
                </small>
              </article>
            ))
          )}
        </div>
      </div>
      <DemoNote text="Both modes use the same database. Vulnerable mode interprets a stored message as HTML; safe mode displays it as literal text." />
    </>
  );
}
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
    return () => window.removeEventListener("hashchange", update);
  }, []);
  function submit(e) {
    e.preventDefault();
    window.location.hash = `preview=${encodeURIComponent(typed)}`;
  }
  return (
    <>
      <Heading
        tag="03 / DOM-BASED XSS"
        title="Announcement Preview"
        subtitle="The preview reads from the URL fragment (#preview=...), without requesting data from the backend."
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
              placeholder="Enter preview content..."
            />
          </label>
          <button type="submit">Preview announcement</button>
          <p className="muted">You can also edit the URL fragment directly.</p>
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
            <p className="muted">No announcement preview yet.</p>
          )}
        </div>
      </div>
      <DemoNote text="The URL fragment never travels to the server. The difference is strictly in the client-side DOM rendering method." />
    </>
  );
}
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

  async function updateEmail(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const headers = { "Content-Type": "application/json" };
      if (mode === "safe") {
        headers["x-csrf-token"] = csrfToken;
      }
      const result = await fetchJSON(`/api/lab/${mode}/recovery-email`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ recoveryEmail }),
      });
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
        subtitle="Compare recovery-email changes in vulnerable and safe modes using a fictional TA account."
      />
      <div className="two-col">
        <section className="panel stack">
          <h3>Demo TA session</h3>
          <p className="muted">Create a local demo session before updating the profile.</p>
          <button type="button" onClick={startSession} disabled={busy}>
            {busy ? "Please wait..." : "Start Demo Session"}
          </button>
          <button type="button" className="subtle" onClick={loadProfile}>
            <RefreshCw size={15} /> Refresh profile
          </button>
          {profile ? (
            <div className="stack">
              <div><b>Name:</b> {profile.name}</div>
              <div><b>Email:</b> {profile.email}</div>
              <div><b>Current recovery email:</b> {profile.recovery_email}</div>
            </div>
          ) : (
            <p className="muted">No demo profile loaded.</p>
          )}
        </section>
        <form className="panel stack" onSubmit={updateEmail}>
          <h3>Change recovery email</h3>
          <label>
            New recovery email
            <input
              type="email"
              value={recoveryEmail}
              onChange={e => setRecoveryEmail(e.target.value)}
              placeholder="recovery@example.com"
              required
              maxLength={150}
            />
          </label>
          <p className="muted">
            {mode === "safe"
              ? "Safe mode: this request sends your session's CSRF token."
              : "Vulnerable mode: this request does not send a CSRF token."}
          </p>
          <button type="submit" disabled={busy || !profile || (mode === "safe" && !csrfToken)}>
            {busy ? "Saving..." : "Update recovery email"}
          </button>
          {success && <p className="success">{success}</p>}
          {error && <p className="error">{error}</p>}
        </form>
      </div>
      <DemoNote text="This profile form verifies normal updates, not CSRF exploitation. To fulfill the assignment, test a forged request from a separate local page and confirm the vulnerable update succeeds while the safe update is blocked." />
    </>
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
function Overview({ courses, assessments, onNavigate }) {
  return (
    <>
      <Heading
        tag="TA WORKSPACE / OVERVIEW"
        title="Academic workspace"
        subtitle="A minimal UniAssess teaching-assistant portal for the controlled Information Security lab."
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
          <strong>4</strong>
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
          <button onClick={() => onNavigate("search")}>Course Search</button>
          <button onClick={() => onNavigate("discussions")}>Discussions</button>
          <button onClick={() => onNavigate("announcements")}>
            Announcements
          </button>
          <button onClick={() => onNavigate("profile")}>TA Profile / CSRF</button>
        </div>
      </section>
    </>
  );
}
const items = [
  ["overview", "Overview", LayoutDashboard],
  ["search", "Course Search", Search],
  ["discussions", "Discussions", MessageSquare],
  ["announcements", "Announcements", Megaphone],
  ["profile", "TA Profile / CSRF", UserRound],
];
export default function App() {
  const [mode, setMode] = useState("vulnerable");
  const [page, setPage] = useState("overview");
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [serverError, setServerError] = useState("");
  useEffect(() => {
    Promise.all([fetchJSON("/api/courses"), fetchJSON("/api/assessments")])
      .then(([c, a]) => {
        setCourses(c);
        setAssessments(a);
      })
      .catch((e) =>
        setServerError(e.message + " — Is the backend/database running?"),
      );
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
              className={"nav-item " + (page === id ? "active" : "")}
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
            TA Workspace <span>/</span> {items.find((i) => i[0] === page)?.[1]}
          </div>
          <div className="user-chip">
            <span className="avatar">TA</span> Demo Teaching Assistant
          </div>
        </header>
        <main className="content">
          <div className="modebar">
            <div className="mode-description">
              <b>Security comparison mode</b>
              <span>Use the same test content in both modes.</span>
            </div>
            <div className="mode-toggle">
              {modes.map((m) => (
                <button
                  key={m}
                  className={mode === m ? "selected " + m : ""}
                  onClick={() => setMode(m)}
                >
                  {m === "vulnerable" ? (
                    <ShieldAlert size={16} />
                  ) : (
                    <ShieldCheck size={16} />
                  )}{" "}
                  {m === "vulnerable" ? "Vulnerable" : "Safe"}
                </button>
              ))}
            </div>
          </div>
          {serverError && <div className="error-banner">{serverError}</div>}
          {page === "overview" && (
            <Overview
              courses={courses}
              assessments={assessments}
              onNavigate={setPage}
            />
          )}
          {page === "search" && <SearchDemo mode={mode} courses={courses} />}
          {page === "discussions" && (
            <Discussions mode={mode} courses={courses} />
          )}
          {page === "announcements" && <DomDemo mode={mode} />}
          {page === "profile" && <ProfileDemo mode={mode} />}
        </main>
      </div>
    </div>
  );
}
