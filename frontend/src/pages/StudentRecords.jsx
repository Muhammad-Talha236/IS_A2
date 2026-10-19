import StatusMessage from '../components/ui/StatusMessage.jsx';
import Card from '../components/ui/Card.jsx';
import DataTable from '../components/ui/DataTable.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Heading from '../components/ui/Heading.jsx';
import SecurityExplanation from '../components/security/SecurityExplanation.jsx';
import HtmlOrText from '../components/security/HtmlOrText.jsx';
import { securityService } from '../services/securityService.js';

export default function StudentRecords({ mode }) {
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
      const data = await securityService.studentRecords(mode, rollNo);

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
        tag="07 / SQL INJECTION â€” ADVANCED"
        title="Student Records Lookup"
        subtitle="Analyze multi-stage SQL injection against fictional records and database metadata."
      />

      <form className="searchbar" onSubmit={submit}>
        <Search size={18} />

        <Input
          type="text"
          value={rollNo}
          onChange={(e) => setRollNo(e.target.value)}
          placeholder="Enter student roll number"
          required
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search Records"}
        </Button>
      </form>

      {error && <StatusMessage tone="error">{error}</StatusMessage>}

      <Card className="stack">
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
          <DataTable columns={[{ key: 'roll_no', label: 'Roll No / Field 1' }, { key: 'student_name', label: 'Student / Field 2' }, { key: 'result', label: 'Result / Field 3' }]} rows={records} />
        )}
      </Card>

      <SecurityExplanation text="Advanced lab stages cover query columns, schema metadata, table structure and fictional data. Safe mode treats the submitted roll number as a literal value." />
    </>
  );
}

