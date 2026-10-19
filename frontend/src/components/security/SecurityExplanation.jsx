import React from 'react';
import { Info } from 'lucide-react';
export default function SecurityExplanation({ text }) {
  return (
    <div className="demo-note">
      <Info size={18} />
      <span>{text}</span>
    </div>
  );
}
