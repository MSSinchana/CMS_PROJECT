import { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import UserTable from '../components/UserTable.jsx';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'user' });
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);

    try {
      const response = await api.get('/users');
      setUsers(response.data.data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreateDialog = () => {
    setEditingUser(null);
    setForm({ username: '', email: '', password: '', role: 'user' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (user) => {
    setEditingUser(user);
    setForm({ username: user.username, email: user.email || '', password: '', role: user.role });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, form);
        toast.success('User updated');
      } else {
        await api.post('/users', form);
        toast.success('User created');
      }

      setIsDialogOpen(false);
      await loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) {
      return;
    }

    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted');
      setUsers((current) => current.filter((user) => user.id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete user');
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="panel-heading">User administration</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Manage users</h2>
          </div>

          <button className="btn-primary w-fit" onClick={openCreateDialog} type="button">
            Add User
          </button>
        </div>
      </section>

      {loading ? <div className="glass-panel p-6 text-slate-300">Loading users...</div> : <UserTable users={users} onDelete={handleDelete} onEdit={openEditDialog} />}

      <Dialog open={isDialogOpen} onClose={setIsDialogOpen} className="relative z-30">
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="glass-panel w-full max-w-lg p-6 md:p-8">
              <Dialog.Title className="text-2xl font-semibold text-white">{editingUser ? 'Edit User' : 'Add User'}</Dialog.Title>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="label">Username</label>
                  <input
                    className="field"
                    value={form.username}
                    onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  />
                </div>

                <div>
                  <label className="label">Email</label>
                  <input
                    className="field"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </div>

                <div>
                  <label className="label">Password {editingUser ? '(leave blank to keep existing)' : ''}</label>
                  <input
                    className="field"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  />
                </div>

                <div>
                  <label className="label">Role</label>
                  <select
                    className="field"
                    value={form.role}
                    onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button className="btn-secondary" type="button" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </button>
                  <button className="btn-primary" disabled={saving} type="submit">
                    {saving ? 'Saving...' : 'Save User'}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </div>
  );
}