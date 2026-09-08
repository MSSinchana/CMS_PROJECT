import { useState } from 'react';
import api from '../api/client';

export default function BenchmarkPage({ analysisResult, benchmarkResult, setBenchmarkResult }) {
  const [iterations, setIterations] = useState(500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runBenchmark = async () => {
    if (!analysisResult?.analysis_id) {
      setError('Run analysis and optimization first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/benchmark', {
        analysis_id: analysisResult.analysis_id,
        iterations,
      });
      setBenchmarkResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Benchmark failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>Safe Benchmark</h2>
      <p>Runs in a restricted subprocess with timeout and syntax limits.</p>
      <div className="inline-form">
        <label>Iterations</label>
        <input
          type="number"
          min={50}
          max={5000}
          value={iterations}
          onChange={(e) => setIterations(Number(e.target.value))}
        />
        <button className="btn" onClick={runBenchmark} disabled={loading}>{loading ? 'Running...' : 'Run Benchmark'}</button>
      </div>
      {error ? <p className="error">{error}</p> : null}

      {benchmarkResult ? (
        <div className="grid two-col">
          <div>
            <p><strong>Original Time:</strong> {benchmarkResult.original_time_ms} ms</p>
            <p><strong>Optimized Time:</strong> {benchmarkResult.optimized_time_ms} ms</p>
            <p><strong>Original CPU:</strong> {benchmarkResult.original_cpu_percent}%</p>
            <p><strong>Optimized CPU:</strong> {benchmarkResult.optimized_cpu_percent}%</p>
          </div>
          <div>
            <p><strong>Original Memory:</strong> {benchmarkResult.original_memory_mb} MB</p>
            <p><strong>Optimized Memory:</strong> {benchmarkResult.optimized_memory_mb} MB</p>
            <p><strong>Estimated Energy:</strong> {benchmarkResult.estimated_energy_wh} Wh (estimate)</p>
            <p><strong>Estimated CO₂:</strong> {benchmarkResult.estimated_co2_g} g (estimate)</p>
          </div>
        </div>
      ) : (
        <p className="empty">No benchmark results yet.</p>
      )}
    </section>
  );
}
