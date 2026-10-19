import StatusMessage from '../components/ui/StatusMessage.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Heading from '../components/ui/Heading.jsx';
import SecurityExplanation from '../components/security/SecurityExplanation.jsx';
import HtmlOrText from '../components/security/HtmlOrText.jsx';
import { securityService } from '../services/securityService.js';

export default function GradeAvailability({ mode }) {
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
      const data = await securityService.gradeAvailability(mode, courseCode);

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
        tag="06 / SQL INJECTION â€” INTERMEDIATE"
        title="Grade Availability"
        subtitle="Investigate boolean-based SQL injection through different query outcomes."
      />

      <div className="two-col">
        <form className="panel stack" onSubmit={submit}>
          <h3>Check Grade Availability</h3>

          <label>
            Course code
            <Input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="e.g. CS301"
              required
            />
          </label>

          <Button type="submit" disabled={loading}>
            <Search size={17} />
            {loading ? "Checking..." : "Check Availability"}
          </Button>

          {error && <StatusMessage tone="error">{error}</StatusMessage>}
        </form>

        <Card className="stack">
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
        </Card>
      </div>

      <SecurityExplanation text="Compare TRUE and FALSE query conditions in the isolated vulnerable lab. Parameterized queries prevent input from modifying SQL conditions." />
    </>
  );
}

