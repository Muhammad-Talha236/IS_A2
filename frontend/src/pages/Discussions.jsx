import StatusMessage from '../components/ui/StatusMessage.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Heading from '../components/ui/Heading.jsx';
import SecurityExplanation from '../components/security/SecurityExplanation.jsx';
import HtmlOrText from '../components/security/HtmlOrText.jsx';
import { courseService } from '../services/courseService.js';

export default function Discussions({ mode, courses }) {
  const [posts, setPosts] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [author, setAuthor] = useState("Demo TA");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    try {
      setPosts(await courseService.discussions());
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
      await courseService.postDiscussion({ courseId: Number(courseId), author, body });

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
                  {c.code} â€” {c.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            Author
            <Input
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

          <Button type="submit">Post message</Button>

          {success && <StatusMessage tone="success">{success}</StatusMessage>}
          {error && <StatusMessage tone="error">{error}</StatusMessage>}
        </form>

        <div className="panel stack">
          <div className="panel-top">
            <h3>Recent messages</h3>
            <Button
              type="button"
              className="subtle"
              onClick={load}
            >
              <RefreshCw size={15} />
              Refresh
            </Button>
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

      <SecurityExplanation text="Vulnerable mode interprets stored HTML; safe mode displays message content as text." />
    </>
  );
}

