import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const user = await login(username, password);
      toast.success('Login successful');
      navigate(user.role === 'admin' ? '/admin' : '/user', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="glass-panel grid w-full max-w-7xl overflow-hidden md:grid-cols-[1.35fr_0.75fr]">
        <div className="hidden flex-col justify-between border-r border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_40%)] p-10 lg:flex">
          <div>
            <p className="panel-heading">Content Management Studio</p>
            <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-tight text-white xl:text-6xl">
              A modern publishing workspace for stories, media, and community engagement.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              Create posts, upload photos and videos, and let readers react and comment from one polished dashboard.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm text-slate-300 xl:max-w-2xl">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Publish posts</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Upload media</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">React and comment</div>
          </div>
        </div>

        <div className="p-6 md:p-10">
          <p className="panel-heading">Sign in</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Welcome back</h2>
          <p className="mt-2 text-sm text-slate-400">Use your CMS credentials to continue.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="label">Username</label>
              <input className="field" value={username} onChange={(event) => setUsername(event.target.value)} />
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
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            New here?{' '}
            <Link to="/register" className="font-semibold text-cyan-300 hover:text-cyan-200">
              Create an account
            </Link>{' '}
            to publish your own blog posts.
          </div>
        </div>
      </div>
    </div>
  );
}
