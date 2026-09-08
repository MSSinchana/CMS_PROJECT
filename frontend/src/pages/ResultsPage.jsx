import FindingsList from '../components/FindingsList';

export default function ResultsPage({ analysisResult }) {
  return (
    <div className="stack">
      <section className="card">
        <h2>Analysis Results</h2>
        {!analysisResult ? (
          <p className="empty">Run analysis to see results.</p>
        ) : (
          <>
            <p><strong>Analysis ID:</strong> {analysisResult.analysis_id}</p>
            <p><strong>Status:</strong> {analysisResult.parse_ok ? 'Valid Python' : 'Invalid Python'}</p>
            <p>{analysisResult.summary}</p>
            <p><strong>Issues:</strong> {analysisResult.issue_count}</p>
            <p><strong>Optimization Opportunities:</strong> {analysisResult.optimization_opportunities}</p>
          </>
        )}
      </section>
      <FindingsList findings={analysisResult?.findings || []} />
    </div>
  );
}
