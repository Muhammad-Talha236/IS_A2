import React from 'react';
export default function DataTable({ columns, rows, empty = 'No records to display.' }) {
  if (!rows.length) return <p className="muted">{empty}</p>;
  return <div className="table-scroll"><table><thead><tr>{columns.map(c => <th key={c.key} scope="col">{c.label}</th>)}</tr></thead>
    <tbody>{rows.map((row, i) => <tr key={row.id ?? i}>{columns.map(c => <td key={c.key}>{row[c.key] ?? '-'}</td>)}</tr>)}</tbody></table></div>;
}
