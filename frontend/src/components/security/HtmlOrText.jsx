import React from 'react';
export default function HtmlOrText({ value, mode, className = "" }) {
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
