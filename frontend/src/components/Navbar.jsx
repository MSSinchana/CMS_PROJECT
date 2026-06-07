import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:px-6">
        <Link to="/" className="group inline-flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/25 transition group-hover:scale-105">
            <span className="text-lg font-bold">C</span>
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">CMS</p>
            <h1 className="text-lg font-semibold text-white">Content Management System</h1>
          </div>
        </Link>

        <div className="flex flex-1 flex-wrap items-center justify-center gap-8 md:gap-10">
          <NavLink
            to="/"
            className={({ isActive }) =>
              [
                'text-sm font-semibold tracking-[0.02em] transition',
                isActive ? 'text-cyan-300' : 'text-slate-300 hover:text-white'
              ].join(' ')
            }
          >
            Home
          </NavLink>
          {user ? (
            <NavLink
              to={user.role === 'admin' ? '/admin' : '/user'}
              className={({ isActive }) =>
                [
                  'inline-flex items-center gap-2 text-sm font-semibold tracking-[0.02em] transition',
                  isActive ? 'text-cyan-300' : 'text-slate-300 hover:text-white'
                ].join(' ')
              }
            >
              Dashboard
            </NavLink>
          ) : null}
          <NavLink
            to="/blogs"
            className={({ isActive }) =>
              [
                'text-sm font-semibold tracking-[0.02em] transition',
                isActive ? 'text-cyan-300' : 'text-slate-300 hover:text-white'
              ].join(' ')
            }
          >
            Blogs
          </NavLink>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:ml-auto">
          {user ? (
            <>
              <NavLink
                to="/profile"
                className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10 sm:flex"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-semibold text-cyan-200">
                  {getInitials(user.username)}
                </span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{user.username}</p>
                  <p className="text-xs text-slate-400">Welcome back</p>
                </div>
              </NavLink>
              <button className="btn-primary gap-2" onClick={handleLogout} type="button">
                <span aria-hidden="true">↗</span>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn-secondary gap-2">
                <span aria-hidden="true">↪</span>
                Sign in
              </NavLink>
              <NavLink to="/register" className="btn-primary gap-2">
                <span aria-hidden="true">＋</span>
                Create account
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function getInitials(username = '') {
  const parts = username.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'U';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
