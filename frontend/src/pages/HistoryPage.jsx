import { useEffect, useState } from 'react';
import api from '../api/client';

export default function HistoryPage({ selectedProjectId }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!selectedProjectId) return;
      try {
        const { data } = await api.get(`/api/history/${selectedProjectId}`);
        setItems(data.analyses);
      } catch {
        setError('Failed to load history.');
      }
    };
    load();
  }, [selectedProjectId]);

  return (
    <section className="card">
      <h2>Analysis History</h2>
      {error ? <p className="error">{error}</p> : null}
      {!selectedProjectId ? <p className="empty">Select a project first.</p> : null}
      {!items.length ? (
        <p className="empty">No history available.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Analysis ID</th>
              <th>Created At</th>
              <th>Issues</th>
              <th>Green Score</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.analysis_id}>
                <td>{item.analysis_id}</td>
                <td>{new Date(item.created_at).toLocaleString()}</td>
                <td>{item.issue_count}</td>
                <td>{item.green_score ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
