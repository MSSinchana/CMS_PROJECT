export default function MetricCard({ label, value, note }) {
  return (
    <div className="metric-card">
      <p className="metric-label">{label}</p>
      <h3>{value ?? '—'}</h3>
      {note ? <p className="metric-note">{note}</p> : null}
    </div>
  );
}
