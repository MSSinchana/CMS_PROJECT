import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import Navbar from '../components/Navbar.jsx';
import { isImageType, isVideoType } from '../utils/media.js';

const featureCards = [
  {
    title: 'Publish stories',
    description: 'Turn drafts into polished articles that appear on the public blog feed with author attribution.'
  },
  {
    title: 'Build community',
    description: 'Readers can react, comment, and share posts so every article feels alive instead of static.'
  },
  {
    title: 'Manage everything',
    description: 'Create accounts, manage content, and keep the whole publishing workflow in one place.'
  }
];

export default function HomePage() {
  const [featuredPosts, setFeaturedPosts] = useState([]);

  useEffect(() => {
    const loadFeaturedPosts = async () => {
      try {
        const response = await api.get('/blogs', { params: { page: 1, limit: 3 } });
        setFeaturedPosts(response.data.data.items);
      } catch (error) {
        setFeaturedPosts([]);
      }
    };

    loadFeaturedPosts();
  }, []);

  return (
    <div className="min-h-screen text-slate-100">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-4 py-8 md:px-6 md:py-12">
        <section className="hero-shell overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl md:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-6">
              <p className="panel-heading">Publishing made social</p>
              <h2 className="max-w-3xl text-5xl font-semibold leading-tight text-white md:text-6xl">
                A modern CMS where every post becomes a blog story with a real audience.
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                Create an account, write content, publish it to the blog feed, and let readers react, comment, and share.
                Built for creators, editors, and communities that want a smoother publishing experience.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to="/register" className="btn-primary">
                  Create account
                </Link>
                <Link to="/login" className="btn-secondary">
                  Sign in
                </Link>
                <Link to="/blogs" className="btn-secondary">
                  Explore blogs
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-6">
                <p className="panel-heading">What this does</p>
                <div className="mt-5 space-y-4">
                  {[
                    ['User accounts', 'Visitors can register and get their own publishing identity.'],
                    ['Public blog feed', 'Published posts appear with the author name and category.'],
                    ['Community actions', 'Reactions and comments keep the conversation going.']
                  ].map(([title, description]) => (
                    <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="font-semibold text-white">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[1.5rem] border border-cyan-400/20 bg-cyan-400/10 p-5">
                  <p className="text-sm text-cyan-100/80">Public stories</p>
                  <p className="mt-2 text-3xl font-semibold text-white">Live</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-400">Community</p>
                  <p className="mt-2 text-3xl font-semibold text-white">Social</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {featureCards.map((card) => (
            <article key={card.title} className="glass-panel p-6">
              <p className="panel-heading">{card.title}</p>
              <p className="mt-4 text-sm leading-7 text-slate-300">{card.description}</p>
            </article>
          ))}
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="panel-heading">Featured posts</p>
              <h3 className="mt-2 text-3xl font-semibold text-white">Recent writing from the blog feed</h3>
            </div>
            <Link to="/blogs" className="btn-secondary w-fit">
              View all posts
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {featuredPosts.length > 0 ? (
              featuredPosts.map((post) => (
                <article key={post.id} className="glass-panel overflow-hidden p-6">
                  {post.media?.[0] ? (
                    <div className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70">
                      {isVideoType(post.media[0].type) ? (
                        <video className="h-44 w-full object-cover" controls src={post.media[0].dataUrl} />
                      ) : isImageType(post.media[0].type) ? (
                        <img className="h-44 w-full object-cover" src={post.media[0].dataUrl} alt={post.media[0].name} />
                      ) : null}
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge border-cyan-400/20 bg-cyan-400/10 text-cyan-200">{post.category}</span>
                      {post.isFeatured ? (
                        <span className="badge border-amber-400/20 bg-amber-400/10 text-amber-200">Featured</span>
                      ) : null}
                    </div>
                    <span className="text-xs text-slate-400">{new Date(post.dateCreated).toLocaleDateString()}</span>
                  </div>
                  <h4 className="mt-4 text-2xl font-semibold text-white">{post.title}</h4>
                  <p className="mt-3 line-clamp-4 text-sm leading-7 text-slate-300">{post.description}</p>
                  {post.tags?.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="badge border-white/10 bg-white/5 text-slate-300 normal-case tracking-normal">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
                    <span>By {post.createdByUsername}</span>
                    <span>{post.commentCount} comments</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="glass-panel col-span-full rounded-[1.75rem] border border-dashed border-white/10 bg-white/5 p-8 text-center">
                <p className="text-lg font-semibold text-white">No published posts yet</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  When writers publish their first blog, it will appear here automatically.
                </p>
                <div className="mt-5 flex justify-center">
                  <Link to="/register" className="btn-primary">
                    Create an account
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
