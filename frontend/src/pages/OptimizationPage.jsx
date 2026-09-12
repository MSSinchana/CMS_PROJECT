import { useState } from 'react';
import api from '../api/client';

export default function OptimizationPage({ analysisResult, optimizationResult, setOptimizationResult }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const optimize = async () => {
    if (!analysisResult?.analysis_id) {
      setError('Run analysis first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/optimize', {
        analysis_id: analysisResult.analysis_id,
      });
      setOptimizationResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Optimization failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack">
      <section className="card">
        <h2>Optimization Suggestions</h2>
        <button className="btn" onClick={optimize} disabled={loading}>{loading ? 'Optimizing...' : 'Generate Optimization'}</button>
        {error ? <p className="error">{error}</p> : null}
        {optimizationResult ? (
          <>
            <p><strong>Source:</strong> {optimizationResult.source}</p>
            <p>{optimizationResult.explanation}</p>
          </>
        ) : (
          <p className="empty">No optimization result yet.</p>
        )}
      </section>

      {optimizationResult ? (
        <div className="grid two-col">
          <section className="card">
            <h3>Original Code</h3>
            <pre className="code-block">{optimizationResult.original_code}</pre>
          </section>
          <section className="card">
            <h3>Optimized Code</h3>
            <pre className="code-block">{optimizationResult.optimized_code}</pre>
          </section>
        </div>
      ) : null}
    </div>
  );
}
