import { useAnnouncementPreview } from '../hooks/useAnnouncementPreview.js';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import React, { useState } from 'react';

import Heading from '../components/ui/Heading.jsx';
import SecurityExplanation from '../components/security/SecurityExplanation.jsx';
import HtmlOrText from '../components/security/HtmlOrText.jsx';

export default function Announcements({ mode }) {
  const { fragment, preview } = useAnnouncementPreview();
  const [typed, setTyped] = useState('');
  function submit(e) { e.preventDefault(); preview(typed); }

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

          <Button type="submit">
            Preview announcement
          </Button>
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

      <SecurityExplanation text="The URL fragment is handled in the browser without sending it to the backend." />
    </>
  );
}

