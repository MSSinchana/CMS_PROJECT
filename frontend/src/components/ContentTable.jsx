import { Link } from 'react-router-dom';
import { isImageType, isVideoType } from '../utils/media.js';

const statusStyles = {
  draft: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  published: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  archived: 'border-slate-400/30 bg-slate-500/10 text-slate-300'
};

export default function ContentTable({
  content,
  role,
  onDelete,
  onStatusChange,
  isUpdatingStatus
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
      <table className="w-full table-fixed divide-y divide-white/10 text-left text-sm">
        <thead className="bg-white/5 text-slate-300">
          <tr>
            <th className="w-12 px-4 py-3">ID</th>
            <th className="w-[30%] px-4 py-3">Title</th>
            <th className="w-[12%] px-4 py-3">Category</th>
            <th className="w-[12%] px-4 py-3">Status</th>
            <th className="w-[12%] px-4 py-3">Date Created</th>
            <th className="w-[14%] px-4 py-3">Created By</th>
            <th className="w-[20%] px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {content.map((item) => (
            <tr key={item.id} className="hover:bg-white/5">
              <td className="px-4 py-4 text-slate-300">{item.id}</td>
              <td className="px-4 py-4">
                <div className="flex min-w-0 items-start gap-3">
                  {item.media?.[0] ? (
                    <div className="mt-0.5 h-14 w-14 overflow-hidden rounded-xl border border-white/10 bg-slate-950/60">
                      {isVideoType(item.media[0].type) ? (
                        <video className="h-full w-full object-cover" src={item.media[0].dataUrl} />
                      ) : isImageType(item.media[0].type) ? (
                        <img className="h-full w-full object-cover" src={item.media[0].dataUrl} alt={item.media[0].name} />
                      ) : null}
                    </div>
                  ) : null}
                  <div className="min-w-0">
                    <div className="font-medium text-white">{item.title}</div>
                    <p className="mt-1 line-clamp-2 max-w-xl text-xs text-slate-400">{item.description}</p>
                    {item.tags?.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="badge border-white/10 bg-white/5 text-slate-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-slate-300">{item.category}</td>
              <td className="px-4 py-4">
                <span className={`badge ${statusStyles[item.status] || statusStyles.archived}`}>{item.status}</span>
              </td>
              <td className="px-4 py-4 text-slate-300">{new Date(item.dateCreated).toLocaleDateString()}</td>
              <td className="px-4 py-4 text-slate-300">{item.createdByUsername || 'Unknown'}</td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  {item.isFeatured ? (
                    <span className="badge border-amber-400/20 bg-amber-400/10 text-amber-200">Featured</span>
                  ) : null}
                  {item.mediaCount ? (
                    <span className="badge border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                      {item.mediaCount} media
                    </span>
                  ) : null}
                  <Link to={`/content/${item.id}/edit`} className="btn-secondary py-2">
                    Edit
                  </Link>
                  {role === 'admin' ? (
                    <select
                      className="field w-[8.5rem] shrink-0 py-2"
                      value={item.status}
                      onChange={(event) => onStatusChange(item.id, event.target.value)}
                      disabled={isUpdatingStatus}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  ) : null}
                  {onDelete ? (
                    <button className="btn-danger shrink-0 py-2" onClick={() => onDelete(item.id)} type="button">
                      Delete
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {content.length === 0 ? <div className="px-4 py-12 text-center text-slate-400">No content found.</div> : null}
    </div>
  );
}
