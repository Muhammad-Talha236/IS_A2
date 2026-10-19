import StatusMessage from '../components/ui/StatusMessage.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Heading from '../components/ui/Heading.jsx';
import SecurityExplanation from '../components/security/SecurityExplanation.jsx';
import HtmlOrText from '../components/security/HtmlOrText.jsx';
import { securityService } from '../services/securityService.js';

export default function Profile({ mode }) {
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
      const data = await securityService.profileSession();

      setProfile(data.profile);
      setRecoveryEmail(data.profile.recovery_email);
      setCsrfToken(data.csrfToken);
      setSuccess("Account information loaded.");
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
      const data = await securityService.profile();

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
      const result = await securityService.updateRecoveryEmail(mode, recoveryEmail, csrfToken);

      setProfile(result.profile);
      setRecoveryEmail(result.profile.recovery_email);
      setSuccess("Recovery email updated successfully.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { startSession(); }, [mode]);

  return (
    <>
      <Heading
        tag="04 / CSRF"
        title="TA Profile & Recovery Email"
        subtitle="Demonstrate recovery-email changes using a fictional TA account."
      />

      <div className="two-col">
        <Card className="stack">
          <h3>Account information</h3>

          <Button
            type="button"
            onClick={startSession}
            disabled={busy}
          >
            Reload account
          </Button>

          <Button
            type="button"
            className="subtle"
            onClick={loadProfile}
          >
            <RefreshCw size={15} />
            Refresh profile
          </Button>

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
        </Card>

        <form className="panel stack" onSubmit={updateEmail}>
          <h3>Change recovery email</h3>

          <label>
            New recovery email
            <Input
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

          <Button
            type="submit"
            disabled={
              busy ||
              !profile ||
              (mode === "safe" && !csrfToken)
            }
          >
            Update recovery email
          </Button>

          {success && <StatusMessage tone="success">{success}</StatusMessage>}
          {error && <StatusMessage tone="error">{error}</StatusMessage>}
        </form>
      </div>

      <SecurityExplanation text="CSRF testing requires the separate local attacker page. Compare unauthorized recovery-email changes in both modes." />
    </>
  );
}

