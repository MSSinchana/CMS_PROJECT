export default function UserTable({ users, onDelete, onEdit }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-4 py-3">User ID</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Date Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-white/5">
                <td className="px-4 py-4 text-slate-300">{user.id}</td>
                <td className="px-4 py-4 font-medium text-white">{user.username}</td>
                <td className="px-4 py-4 text-slate-300">{user.email || '—'}</td>
                <td className="px-4 py-4 text-slate-300 capitalize">{user.role}</td>
                <td className="px-4 py-4 text-slate-300">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <button className="btn-secondary py-2" onClick={() => onEdit(user)} type="button">
                      Edit
                    </button>
                    <button className="btn-danger py-2" onClick={() => onDelete(user.id)} type="button">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 ? <div className="px-4 py-12 text-center text-slate-400">No users found.</div> : null}
    </div>
  );
}