import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import ContentCard from '../components/ContentCard.jsx';
import ContentTable from '../components/ContentTable.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentContent, setRecentContent] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsResponse, contentResponse] = await Promise.all([
          api.get('/content/stats'),
          api.get('/content', { params: { page: 1, limit: 5 } })
        ]);

        setStats(statsResponse.data.data);
        setRecentContent(contentResponse.data.data.items);
      } catch (error) {
        toast.error('Failed to load dashboard data');
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

  const cards = [
    { title: 'My Total Content', value: stats?.totalContent ?? 0 },
    { title: 'My Published Content', value: stats?.publishedContent ?? 0 }
  ];

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 md:p-8">
        <p className="panel-heading">User dashboard</p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-white">Welcome, {user?.username}</h2>
            <p className="mt-2 text-slate-400">Create and manage your own content.</p>
          </div>

          <Link to="/content/new" className="btn-primary w-fit">
            Add Content
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <ContentCard key={card.title} title={card.title} value={card.value} />
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-white">My Recent Content</h3>
        <ContentTable content={recentContent} role={user?.role} onDelete={handleDelete} />
      </section>
    </div>
  );
}
