import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { isImageType, isVideoType } from '../utils/media.js';

const categories = ['General', 'Technology', 'News', 'Tutorial', 'Other'];

export default function BlogFeedPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 6, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBlogs = async () => {
      setLoading(true);

      try {
        const response = await api.get('/blogs', {
          params: {
            page: pagination.page,
            limit: pagination.limit,
            search,
            category
          }
        });

        setItems(response.data.data.items);
        setPagination(response.data.data.pagination);
      } catch (error) {
        toast.error('Failed to load blogs');
      } finally {
        setLoading(false);
      }
    };

    loadBlogs();
  }, [pagination.page, pagination.limit, search, category]);

  return (
    <div className="min-h-screen text-slate-100">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <section className="glass-panel p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="panel-heading">Public blog feed</p>
              <h2 className="mt-2 text-4xl font-semibold text-white">Read what the community is publishing</h2>
              <p className="mt-3 max-w-2xl text-slate-400">
                Every published post shows the author&apos;s account name, so readers always know who wrote it.
              </p>
            </div>

            {user ? (
              <Link to="/content/new" className="btn-primary w-fit">
                Write a post
              </Link>
            ) : (
              <Link to="/register" className="btn-primary w-fit">
                Join to publish
              </Link>
            )}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="label">Search</label>
              <input
                className="field"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPagination((current) => ({ ...current, page: 1 }));
                }}
                placeholder="Search posts"
              />
            </div>
            <div>
              <label className="label">Category</label>
              <select
                className="field"
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setPagination((current) => ({ ...current, page: 1 }));
                }}
              >
                <option value="">All categories</option>
                {categories.map((option) => (
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
                {[6, 9, 12].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="mt-8">
          {loading ? (
            <div className="glass-panel p-6 text-slate-300">Loading blogs...</div>
          ) : items.length === 0 ? (
            <div className="glass-panel flex flex-col items-center justify-center px-6 py-12 text-center md:px-8 md:py-16">
              <h3 className="text-2xl font-semibold text-white">No published posts yet</h3>
              <p className="mt-2 text-slate-400">
                When writers publish their first blog, it will appear here automatically.
              </p>
              {user ? (
                <Link to="/content/new" className="btn-primary mt-6">
                  Write the first post
                </Link>
              ) : (
                <Link to="/register" className="btn-primary mt-6">
                  Create an account to publish
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {items.map((post) => (
                <article key={post.id} className="glass-panel flex h-full flex-col p-6">
                  <div className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-2">
                    {post.media?.[0] ? (
                      isVideoType(post.media[0].type) ? (
                        <video className="h-56 w-full rounded-[1.25rem] object-cover" controls src={post.media[0].dataUrl} />
                      ) : isImageType(post.media[0].type) ? (
                        <img
                          className="h-56 w-full rounded-[1.25rem] object-cover"
                          src={post.media[0].dataUrl}
                          alt={post.media[0].name}
                        />
                      ) : (
                        <div className="flex h-56 w-full items-center justify-center rounded-[1.25rem] border border-dashed border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-500">
                          Media unavailable
                        </div>
                      )
                    ) : (
                      <div className="flex h-56 w-full items-center justify-center rounded-[1.25rem] border border-dashed border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
                        <div className="text-center">
                          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300/70">Text post</p>
                          <p className="mt-2 text-sm text-slate-500">No media attached</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge border-cyan-400/20 bg-cyan-400/10 text-cyan-200">{post.category}</span>
                      {post.isFeatured ? (
                        <span className="badge border-amber-400/20 bg-amber-400/10 text-amber-200">Featured</span>
                      ) : null}
                    </div>
                    <span className="text-xs text-slate-400">{new Date(post.dateCreated).toLocaleDateString()}</span>
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold text-white">{post.title}</h3>
                  <p className="mt-3 line-clamp-5 flex-1 text-sm leading-7 text-slate-300">{post.description}</p>
                  {post.tags?.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="badge border-white/10 bg-white/5 text-slate-300 normal-case tracking-normal">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
                    <span>By {post.createdByUsername}</span>
                    <span>{post.commentCount} comments · {post.reactionCount} reactions</span>
                  </div>
                  <Link to={`/blogs/${post.id}`} className="btn-secondary mt-5 w-fit">
                    Read post
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        {!loading && items.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
          <p>
            Showing page {pagination.page} of {pagination.totalPages} · {pagination.total} total posts
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
        )}
      </main>
    </div>
  );
}
