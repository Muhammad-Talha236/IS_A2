import StatusMessage from '../components/ui/StatusMessage.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Heading from '../components/ui/Heading.jsx';
import SecurityExplanation from '../components/security/SecurityExplanation.jsx';
import HtmlOrText from '../components/security/HtmlOrText.jsx';
import { courseService } from '../services/courseService.js';

export default function CourseSearch({ mode }) {
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");

    try {
      setData(
        await courseService.search(mode, q)
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
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search course code or title"
        />
        <Button type="submit">Search</Button>
      </form>

      {error && <StatusMessage tone="error">{error}</StatusMessage>}

      {data && (
        <Card>
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
                  {c.program} Â· Section {c.section}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <SecurityExplanation text="Submit the same input in both modes and compare HTML execution with safe text rendering." />
    </>
  );
}

