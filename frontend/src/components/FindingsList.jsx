export default function FindingsList({ findings = [] }) {
  if (!findings.length) {
    return <p className="empty">No findings yet.</p>;
  }

  return (
    <div className="card">
      <h3>Detected Findings</h3>
      <ul className="finding-list">
        {findings.map((finding, idx) => (
          <li key={`${finding.category}-${idx}`}>
            <span className={`badge ${finding.severity}`}>{finding.severity}</span>
            <span className="badge certainty">{finding.certainty}</span>
            <strong>{finding.category}</strong>
            <p>{finding.message}</p>
            {finding.line_number ? <small>Line {finding.line_number}</small> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
