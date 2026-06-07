import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const linkClass = ({ isActive }) =>
  [
    'flex items-center rounded-xl px-4 py-3 text-sm font-medium transition',
    isActive ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:bg-white/5 hover:text-white'
  ].join(' ');

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="glass-panel mx-4 mb-4 w-full p-3 md:mx-0 md:mb-0 md:min-h-[calc(100vh-5rem)] md:w-64">
      <div className="mb-4 rounded-xl border border-white/10 bg-slate-950/50 p-4">
        <p className="panel-heading">Signed in as</p>
        <p className="mt-2 text-lg font-semibold text-white">{user?.username}</p>
        <p className="text-sm text-slate-400">Workspace access</p>
      </div>

      <nav className="space-y-2">
        <NavLink to={user?.role === 'admin' ? '/admin' : '/user'} className={linkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/content" className={linkClass}>
          Content
        </NavLink>
        <NavLink to="/content/new" className={linkClass}>
          Add Content
        </NavLink>
        {user?.role === 'admin' ? (
          <NavLink to="/users" className={linkClass}>
            Manage Users
          </NavLink>
        ) : null}
        {user?.role === 'admin' ? (
          <NavLink to="/activity" className={linkClass}>
            Activity Log
          </NavLink>
        ) : null}
      </nav>
    </aside>
  );
}
