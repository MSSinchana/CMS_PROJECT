import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api/client';
import MetricCard from '../components/MetricCard';

export default function DashboardPage({ selectedProjectId, benchmarkResult }) {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!selectedProjectId) return;
      try {
        const { data } = await api.get(`/api/dashboard/${selectedProjectId}`);
        setDashboard(data);
      } catch {
        setError('Failed to load dashboard.');
      }
    };
    load();
  }, [selectedProjectId, benchmarkResult?.benchmark_id]);

  const chartData = useMemo(() => {
    if (!benchmarkResult) return [];
    return [
      {
        metric: 'Time (ms)',
        original: benchmarkResult.original_time_ms,
        optimized: benchmarkResult.optimized_time_ms,
      },
      {
        metric: 'CPU (%)',
        original: benchmarkResult.original_cpu_percent,
        optimized: benchmarkResult.optimized_cpu_percent,
      },
      {
        metric: 'Memory (MB)',
        original: benchmarkResult.original_memory_mb,
        optimized: benchmarkResult.optimized_memory_mb,
      },
    ];
  }, [benchmarkResult]);

  if (!selectedProjectId) {
    return <section className="card"><h2>Dashboard</h2><p className="empty">Create/select a project to view dashboard metrics.</p></section>;
  }

  return (
    <div className="stack">
      <section className="card">
        <h2>Dashboard</h2>
        {error ? <p className="error">{error}</p> : null}
        <div className="metrics-grid">
          <MetricCard label="Green Score" value={dashboard?.green_score} />
          <MetricCard label="Execution Time" value={dashboard?.execution_time_ms ? `${dashboard.execution_time_ms} ms` : '—'} />
          <MetricCard label="CPU Usage" value={dashboard?.cpu_usage_percent ? `${dashboard.cpu_usage_percent}%` : '—'} />
          <MetricCard label="Memory Usage" value={dashboard?.memory_usage_mb ? `${dashboard.memory_usage_mb} MB` : '—'} />
          <MetricCard label="Estimated Energy" value={dashboard?.estimated_energy_wh ? `${dashboard.estimated_energy_wh} Wh` : '—'} note="Estimate" />
          <MetricCard label="Estimated CO₂" value={dashboard?.estimated_co2_g ? `${dashboard.estimated_co2_g} g` : '—'} note="Estimate" />
          <MetricCard label="Detected Issues" value={dashboard?.issue_count ?? 0} />
          <MetricCard label="Optimization Opportunities" value={dashboard?.optimization_opportunities ?? 0} />
        </div>
      </section>

      <section className="card">
        <h3>Before vs After Benchmark</h3>
        {!chartData.length ? (
          <p className="empty">Run benchmark to render charts.</p>
        ) : (
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="original" fill="#ef4444" />
                <Bar dataKey="optimized" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
