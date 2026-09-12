import { useState } from 'react';
import api from '../api/client';
import FindingsList from '../components/FindingsList';

const starterCode = `def target():
    numbers = list(range(200))
    out = ""
    for i in numbers:
        out += str(i)
    return out`;

export default function AnalyzePage({ selectedProjectId, analysisResult, setAnalysisResult }) {
  const [code, setCode] = useState(starterCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async () => {
    setError('');
    if (!selectedProjectId) {
      setError('Create and select a project first.');
      return;
    }
    if (!code.trim()) {
      setError('Code input cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/api/analyze', {
        project_id: selectedProjectId,
        code,
        language: 'python',
      });
      setAnalysisResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack">
      <section className="card">
        <h2>Analyze Python Code</h2>
        <p>Benchmarking is restricted to safe code that defines <code>target()</code>.</p>
        <textarea className="editor" value={code} onChange={(e) => setCode(e.target.value)} rows={18} />
        <button className="btn" onClick={analyze} disabled={loading}>{loading ? 'Analyzing...' : 'Analyze Code'}</button>
        {error ? <p className="error">{error}</p> : null}
      </section>

      <FindingsList findings={analysisResult?.findings || []} />
    </div>
  );
}
