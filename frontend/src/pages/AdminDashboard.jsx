import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import ContentCard from '../components/ContentCard.jsx';
import ContentTable from '../components/ContentTable.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const ACTION_LABELS = {
  'user.login':            'Login',
  'user.logout':           'Logout',
  'user.register':         'Register',
  'user.password_changed': 'Password Changed',
  'user.created':          'User Created',
  'user.updated':          'User Updated',
  'user.deleted':          'User Deleted',
  'user.account_deleted':  'Account Deleted',
  'content.created':       'Content Created',
  'content.updated':       'Content Updated',
  'content.deleted':       'Content Deleted',
  'content.status_changed':'Status Changed'
};

const ACTION_COLORS = {
  'user.login':            'bg-cyan-400/10 border-cyan-400/30 text-cyan-300',
  'user.logout':           'bg-slate-400/10 border-slate-400/30 text-slate-300',
  'user.register':         'bg-emerald-400/10 border-emerald-400/30 text-emerald-300',
  'user.password_changed': 'bg-amber-400/10 border-amber-400/30 text-amber-300',
  'user.created':          'bg-emerald-400/10 border-emerald-400/30 text-emerald-300',
  'user.updated':          'bg-amber-400/10 border-amber-400/30 text-amber-300',
  'user.deleted':          'bg-rose-400/10 border-rose-400/30 text-rose-300',
  'user.account_deleted':  'bg-rose-400/10 border-rose-400/30 text-rose-300',
  'content.created':       'bg-emerald-400/10 border-emerald-400/30 text-emerald-300',
  'content.updated':       'bg-amber-400/10 border-amber-400/30 text-amber-300',
  'content.deleted':       'bg-rose-400/10 border-rose-400/30 text-rose-300',
  'content.status_changed':'bg-sky-400/10 border-sky-400/30 text-sky-300'
};

function formatRelative(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentContent, setRecentContent] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      try {
        const [statsResponse, contentResponse, activityResponse] = await Promise.all([
          api.get('/content/stats'),
          api.get('/content', { params: { page: 1, limit: 5 } }),
          api.get('/activity/recent', { params: { limit: 8 } })
        ]);

        setStats(statsResponse.data.data);
        setRecentContent(contentResponse.data.data.items);
        setRecentActivity(activityResponse.data.data);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this content item?')) {
      return;
    }

    try {
      await api.delete(`/content/${id}`);
      toast.success('Content deleted');
      setRecentContent((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete content');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/content/${id}/status`, { status });
      toast.success('Status updated');
      setRecentContent((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update status');
    }
  };

  const cards = [
    { title: 'Total Content', value: stats?.totalContent ?? 0 },
    { title: 'Published', value: stats?.publishedContent ?? 0 },
    { title: 'Drafts', value: stats?.draftContent ?? 0 },
    { title: 'Total Users', value: stats?.totalUsers ?? 0 }
  ];

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 md:p-8">
        <p className="panel-heading">Admin dashboard</p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-white">Welcome, {user?.username}</h2>
            <p className="mt-2 text-slate-400">Monitor publishing activity and manage users from one place.</p>
          </div>

          <div className="flex gap-3">
            <Link to="/content/new" className="btn-primary">
              Add Content
            </Link>
            <Link to="/users" className="btn-secondary">
              Manage Users
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <ContentCard key={card.title} title={card.title} value={loading ? '...' : card.value} />
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Recent Content</h3>
          <Link to="/content" className="text-sm text-cyan-300 hover:text-cyan-200">
            View all
          </Link>
        </div>
        <ContentTable
          content={recentContent}
          role={user?.role}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          isUpdatingStatus={false}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
          <Link to="/activity" className="text-sm text-cyan-300 hover:text-cyan-200">
            View full log
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
          {loading ? (
            <p className="px-4 py-8 text-center text-slate-400">Loading…</p>
          ) : recentActivity.length === 0 ? (
            <p className="px-4 py-8 text-center text-slate-400">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {recentActivity.map((log) => (
                <li key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                  <span
                    className={`mt-0.5 inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${ACTION_COLORS[log.action] ?? 'bg-slate-400/10 border-slate-400/30 text-slate-300'}`}
                  >
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-white">{log.username}</span>
                    {log.details ? (
                      <span className="ml-2 text-sm text-slate-400">{log.details}</span>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs text-slate-500 tabular-nums">
                    {formatRelative(log.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}