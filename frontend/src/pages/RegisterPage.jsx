import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const user = await register(username, email, password);
      toast.success('Account created');
      navigate(user.role === 'admin' ? '/admin' : '/user', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100">
      <Navbar />
      <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 md:grid-cols-[0.9fr_1.1fr] md:px-6 md:py-12">
        <section className="hero-shell rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl md:p-10">
          <p className="panel-heading">Start publishing</p>
          <h2 className="mt-4 max-w-xl text-5xl font-semibold leading-tight text-white">
            Create your account and join the blog community.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            Your username becomes the author identity on every post you publish. After signing up, you can create posts,
            grow an audience, and let readers react and comment in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login" className="btn-secondary">
              I already have an account
            </Link>
            <Link to="/blogs" className="btn-secondary">
              Browse blogs
            </Link>
          </div>
        </section>

        <section className="glass-panel p-6 md:p-10">
          <p className="panel-heading">Create account</p>
          <h3 className="mt-3 text-3xl font-semibold text-white">Register a new user</h3>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="label">Username</label>
              <input className="field" value={username} onChange={(event) => setUsername(event.target.value)} />
            </div>

            <div>
              <label className="label">Email</label>
              <input className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                className="field"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <button className="btn-primary w-full" disabled={loading} type="submit">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
