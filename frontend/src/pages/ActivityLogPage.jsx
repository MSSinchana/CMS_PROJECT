import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';

// ── Action metadata ─────────────────────────────────────────────────────────

const ACTION_LABELS = {
  'user.login':            { label: 'Login',            color: 'text-cyan-300',    bg: 'bg-cyan-400/10 border-cyan-400/30' },
  'user.logout':           { label: 'Logout',           color: 'text-slate-300',   bg: 'bg-slate-400/10 border-slate-400/30' },
  'user.register':         { label: 'Register',         color: 'text-emerald-300', bg: 'bg-emerald-400/10 border-emerald-400/30' },
  'user.password_changed': { label: 'Password Changed', color: 'text-amber-300',   bg: 'bg-amber-400/10 border-amber-400/30' },
  'user.created':          { label: 'User Created',     color: 'text-emerald-300', bg: 'bg-emerald-400/10 border-emerald-400/30' },
  'user.updated':          { label: 'User Updated',     color: 'text-amber-300',   bg: 'bg-amber-400/10 border-amber-400/30' },
  'user.deleted':          { label: 'User Deleted',     color: 'text-rose-300',    bg: 'bg-rose-400/10 border-rose-400/30' },
  'user.account_deleted':  { label: 'Account Deleted',  color: 'text-rose-300',    bg: 'bg-rose-400/10 border-rose-400/30' },
  'content.created':       { label: 'Content Created',  color: 'text-emerald-300', bg: 'bg-emerald-400/10 border-emerald-400/30' },
  'content.updated':       { label: 'Content Updated',  color: 'text-amber-300',   bg: 'bg-amber-400/10 border-amber-400/30' },
  'content.deleted':       { label: 'Content Deleted',  color: 'text-rose-300',    bg: 'bg-rose-400/10 border-rose-400/30' },
  'content.status_changed':{ label: 'Status Changed',   color: 'text-sky-300',     bg: 'bg-sky-400/10 border-sky-400/30' }
};

const ALL_ACTIONS = Object.keys(ACTION_LABELS);

function ActionBadge({ action }) {
  const meta = ACTION_LABELS[action] ?? { label: action, color: 'text-slate-300', bg: 'bg-slate-400/10 border-slate-400/30' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.bg} ${meta.color}`}>
      {meta.label}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filterAction) params.action = filterAction;

      const res = await api.get('/activity', { params });
      setLogs(res.data.data.items);
      setPagination(res.data.data.pagination);
    } catch {
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [page, filterAction]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset to page 1 when filter changes
  const handleFilterChange = (value) => {
    setFilterAction(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="glass-panel p-6 md:p-8">
        <p className="panel-heading">Admin</p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-white">Activity Log</h2>
            <p className="mt-2 text-slate-400">
              A complete audit trail of all actions performed in the CMS.
            </p>
          </div>
          <p className="text-sm text-slate-400">
            {loading ? '...' : `${pagination.total} total entries`}
          </p>
        </div>
      </section>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="field w-auto min-w-[180px]"
          value={filterAction}
          onChange={(e) => handleFilterChange(e.target.value)}
        >
          <option value="">All actions</option>
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a}>{ACTION_LABELS[a].label}</option>
          ))}
        </select>

        {filterAction && (
          <button
            className="btn-secondary text-sm"
            onClick={() => handleFilterChange('')}
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
        <table className="w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-4 py-3 w-10">#</th>
              <th className="px-4 py-3 w-36">Action</th>
              <th className="px-4 py-3 w-32">User</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3 w-44">Date &amp; Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  No activity logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-slate-500 tabular-nums">{log.id}</td>
                  <td className="px-4 py-3">
                    <ActionBadge action={log.action} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-white">{log.username}</span>
                    {log.userId ? (
                      <span className="ml-1 text-slate-500 text-xs">#{log.userId}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {log.details ?? <span className="text-slate-500">—</span>}
                    {log.entityType && log.entityId ? (
                      <span className="ml-2 text-xs text-slate-500">
                        ({log.entityType} #{log.entityId})
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-400 tabular-nums whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              className="btn-secondary text-sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <button
              className="btn-secondary text-sm"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
