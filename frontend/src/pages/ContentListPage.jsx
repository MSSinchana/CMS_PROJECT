import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import ContentTable from '../components/ContentTable.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const categories = ['General', 'Technology', 'News', 'Tutorial', 'Other'];
const statuses = ['published', 'draft', 'archived'];

export default function ContentListPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const queryParams = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      search,
      category,
      status
    }),
    [pagination.page, pagination.limit, search, category, status]
  );

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);

      try {
        const response = await api.get('/content', { params: queryParams });
        setItems(response.data.data.items);
        setPagination(response.data.data.pagination);
      } catch (error) {
        toast.error('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [queryParams]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this content item?')) {
      return;
    }

    try {
      await api.delete(`/content/${id}`);
      toast.success('Content deleted');
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete content');
    }
  };

  const handleStatusChange = async (id, nextStatus) => {
    setUpdatingStatus(true);

    try {
      await api.patch(`/content/${id}/status`, { status: nextStatus });
      toast.success('Status updated');
      setItems((current) => current.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="panel-heading">Content library</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">All content</h2>
          </div>

          <Link to="/content/new" className="btn-primary w-fit">
            Add Content
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="label">Search title</label>
            <input className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title" />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="field" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All categories</option>
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="field" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              {statuses.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Page size</label>
            <select
              className="field"
              value={pagination.limit}
              onChange={(event) => setPagination((current) => ({ ...current, page: 1, limit: Number(event.target.value) }))}
            >
              {[5, 10, 20].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <ContentTable
        content={loading ? [] : items}
        role={user?.role}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        isUpdatingStatus={updatingStatus}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
        <p>
          Showing page {pagination.page} of {pagination.totalPages} · {pagination.total} total records
        </p>
        <div className="flex gap-2">
          <button
            className="btn-secondary"
            disabled={pagination.page <= 1}
            onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}
            type="button"
          >
            Previous
          </button>
          <button
            className="btn-secondary"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}