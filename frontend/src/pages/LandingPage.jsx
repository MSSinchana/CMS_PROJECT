import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <section className="hero card">
      <h1>GreenCode AI</h1>
      <p>
        Analyze Python code for inefficiency patterns, get optimization suggestions, benchmark safely,
        and estimate energy and CO₂ impact.
      </p>
      <div className="hero-actions">
        <Link className="btn" to="/projects">Create Project</Link>
        <Link className="btn secondary" to="/analyze">Analyze Code</Link>
      </div>
    </section>
  );
}
