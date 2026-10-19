import React from 'react';
export default function Heading({ tag, title, subtitle }) {
  return (
    <div className="section-heading">
      <div className="eyebrow">{tag}</div>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}
