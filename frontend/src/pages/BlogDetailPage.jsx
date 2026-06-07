import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { isImageType, isVideoType } from '../utils/media.js';

const reactions = [
  { key: 'like', label: 'Like', icon: '👍' },
  { key: 'love', label: 'Love', icon: '❤️' },
  { key: 'insightful', label: 'Insightful', icon: '💡' },
  { key: 'celebrate', label: 'Celebrate', icon: '🎉' }
];

export default function BlogDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [reactionCounts, setReactionCounts] = useState({});
  const [commentBody, setCommentBody] = useState('');
  const [replyToId, setReplyToId] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const commentsTree = useMemo(() => buildCommentTree(comments), [comments]);
  const replyTarget = useMemo(
    () => comments.find((comment) => comment.id === replyToId) || null,
    [comments, replyToId]
  );

  useEffect(() => {
    const loadBlog = async () => {
      setLoading(true);

      try {
        const response = await api.get(`/blogs/${id}`);
        setBlog(response.data.data.blog);
        setComments(response.data.data.comments || []);
        setReactionCounts(response.data.data.reactions || {});
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to load blog');
      } finally {
        setLoading(false);
      }
    };

    loadBlog();
  }, [id]);

  const handleReaction = async (reactionType) => {
    if (!user) {
      toast.error('Sign in to react to this post');
      return;
    }

    try {
      const response = await api.post(`/blogs/${id}/reactions`, { reactionType });
      setReactionCounts(response.data.data);
      toast.success('Reaction saved');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save reaction');
    }
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();

    if (!user) {
      toast.error('Sign in to leave a comment');
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post(`/blogs/${id}/comments`, { body: commentBody });
      setComments((current) => [...current, response.data.data]);
      setCommentBody('');
      toast.success('Comment added');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (event) => {
    event.preventDefault();

    if (!user) {
      toast.error('Sign in to reply');
      return;
    }

    if (!replyToId) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post(`/blogs/${id}/comments`, {
        body: replyBody,
        parentCommentId: replyToId
      });

      setComments((current) => [...current, response.data.data]);
      setReplyBody('');
      setReplyToId(null);
      toast.success('Reply added');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied');
    } catch (error) {
      toast.error('Unable to copy link');
    }
  };

  return (
    <div className="min-h-screen text-slate-100">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 md:py-12">
        {loading ? (
          <div className="glass-panel p-6 text-slate-300">Loading blog...</div>
        ) : blog ? (
          <article className="space-y-8">
            <section className="glass-panel p-6 md:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <span className="badge border-cyan-400/20 bg-cyan-400/10 text-cyan-200">{blog.category}</span>
                {blog.isFeatured ? (
                  <span className="badge border-amber-400/20 bg-amber-400/10 text-amber-200">Featured</span>
                ) : null}
                <span className="text-xs text-slate-400">Published {new Date(blog.dateCreated).toLocaleDateString()}</span>
                <span className="text-xs text-slate-400">By {blog.createdByUsername}</span>
              </div>

              {blog.media?.length > 0 ? (
                <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-2">
                  {isVideoType(blog.media[0].type) ? (
                    <video className="max-h-[32rem] w-full rounded-[1.5rem] object-contain" controls src={blog.media[0].dataUrl} />
                  ) : isImageType(blog.media[0].type) ? (
                    <img
                      className="max-h-[32rem] w-full rounded-[1.5rem] object-contain"
                      src={blog.media[0].dataUrl}
                      alt={blog.media[0].name}
                    />
                  ) : null}
                </div>
              ) : null}

              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-white md:text-5xl">
                {blog.title}
              </h1>
              <p className="mt-5 whitespace-pre-line text-lg leading-8 text-slate-300">{blog.description}</p>
              {blog.tags?.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {blog.tags.map((tag) => (
                    <span key={tag} className="badge border-white/10 bg-white/5 text-slate-300 normal-case tracking-normal">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
              {blog.media?.length > 1 ? (
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {blog.media.slice(1).map((item) => (
                    <div key={item.id || item.name} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
                      {isVideoType(item.type) ? (
                        <video className="h-72 w-full object-cover" controls src={item.dataUrl} />
                      ) : isImageType(item.type) ? (
                        <img className="h-72 w-full object-cover" src={item.dataUrl} alt={item.name} />
                      ) : null}
                      <div className="border-t border-white/10 p-4">
                        <p className="text-sm font-semibold text-white">{item.name}</p>
                        <p className="text-xs text-slate-400 capitalize">{item.kind}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                {reactions.map((reaction) => (
                  <button
                    key={reaction.key}
                    className="btn-secondary gap-2"
                    onClick={() => handleReaction(reaction.key)}
                    type="button"
                  >
                    <span aria-hidden="true">{reaction.icon}</span>
                    <span>
                      {reaction.label} {reactionCounts[reaction.key] ? `(${reactionCounts[reaction.key]})` : ''}
                    </span>
                  </button>
                ))}
                <button className="btn-primary" onClick={handleShare} type="button">
                  Share post
                </button>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Total reactions</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{blog.reactionCount}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Total comments</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{blog.commentCount}</p>
                </div>
              </div>
            </section>

            <section className="grid items-start gap-6 lg:grid-cols-[0.88fr_1.12fr]">
              <div className="glass-panel self-start h-fit p-6 lg:sticky lg:top-24">
                <p className="panel-heading">Leave a reply</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Join the conversation</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Write a top-level comment here, or choose Reply on a comment to respond in-thread.
                </p>
                {user ? (
                  <div className="mt-6 space-y-5">
                    <form className="space-y-4" onSubmit={handleCommentSubmit}>
                      <textarea
                        className="field min-h-40"
                        value={commentBody}
                        onChange={(event) => setCommentBody(event.target.value)}
                        placeholder="Write a thoughtful comment..."
                      />
                      <button className="btn-primary" disabled={submitting} type="submit">
                        {submitting && !replyToId ? 'Posting...' : 'Post comment'}
                      </button>
                    </form>

                    {replyToId ? (
                      <form className="rounded-2xl border border-white/10 bg-white/5 p-4" onSubmit={handleReplySubmit}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">Replying to @{replyTarget?.authorUsername || 'comment'}</p>
                            <p className="mt-1 text-xs text-slate-400">Your reply will appear under this comment.</p>
                          </div>
                          <button
                            className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                            type="button"
                            onClick={() => {
                              setReplyToId(null);
                              setReplyBody('');
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                        <textarea
                          className="field mt-4 min-h-28"
                          value={replyBody}
                          onChange={(event) => setReplyBody(event.target.value)}
                          placeholder={`Write a reply to ${replyTarget?.authorUsername || 'this comment'}...`}
                        />
                        <button className="btn-primary mt-4" disabled={submitting} type="submit">
                          {submitting ? 'Posting...' : 'Post reply'}
                        </button>
                      </form>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4">
                        <p className="text-sm font-semibold text-white">Reply mode is idle</p>
                        <p className="mt-1 text-sm leading-6 text-slate-400">
                          Click <span className="font-semibold text-cyan-300">Reply</span> on a comment to open a tagged response box.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5 text-slate-200">
                    <p className="font-semibold text-white">Sign in to react and comment</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Create an account or sign in to add your voice to this blog.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link to="/login" className="btn-secondary">
                        Sign in
                      </Link>
                      <Link to="/register" className="btn-primary">
                        Create account
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="glass-panel self-start p-6">
                <p className="panel-heading">Comments</p>
                <div className="mt-5 space-y-4">
                  {commentsTree.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-400">
                      No comments yet. Be the first to reply.
                    </div>
                  ) : (
                    commentsTree.map((comment) => (
                      <CommentThread
                        key={comment.id}
                        comment={comment}
                        depth={0}
                        onReply={(commentId) => setReplyToId(commentId)}
                      />
                    ))
                  )}
                </div>
              </div>
            </section>
          </article>
        ) : (
          <div className="glass-panel p-6 text-slate-300">Blog not found.</div>
        )}
      </main>
    </div>
  );
}

function CommentThread({ comment, depth, onReply }) {
  return (
    <div className={`${depth > 0 ? 'ml-6 border-l border-white/10 pl-4' : ''} rounded-2xl border border-white/10 bg-white/5 p-5`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{comment.authorUsername}</p>
          <p className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleString()}</p>
        </div>
        <button className="text-sm font-semibold text-cyan-300 hover:text-cyan-200" type="button" onClick={() => onReply(comment.id)}>
          Reply
        </button>
      </div>

      {comment.parentCommentId ? (
        <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100">
          <p className="font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
            Reply to @{comment.parentAuthorUsername || 'comment'}
          </p>
          <p className="mt-1 line-clamp-2 text-cyan-50/90">
            {comment.parentCommentBody || 'Original comment'}
          </p>
        </div>
      ) : null}

      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300">{comment.body}</p>

      {comment.replies?.length > 0 ? (
        <div className="mt-4 space-y-3">
          {comment.replies.map((reply) => (
            <CommentThread key={reply.id} comment={reply} depth={depth + 1} onReply={onReply} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function buildCommentTree(comments) {
  const sorted = [...comments].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const byId = new Map();
  const roots = [];

  for (const comment of sorted) {
    byId.set(comment.id, { ...comment, replies: [] });
  }

  for (const comment of byId.values()) {
    if (comment.parentCommentId && byId.has(comment.parentCommentId)) {
      byId.get(comment.parentCommentId).replies.push(comment);
    } else {
      roots.push(comment);
    }
  }

  return roots;
}
