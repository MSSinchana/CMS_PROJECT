export default function SettingsPage() {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  return (
    <section className="card">
      <h2>Settings</h2>
      <p><strong>Frontend API URL:</strong> {apiUrl}</p>
      <p>
        Configure backend environment variables for database, LLM, benchmark limits, and carbon assumptions.
        If no LLM key is set, rule-based recommendations are used automatically.
      </p>
    </section>
  );
}
