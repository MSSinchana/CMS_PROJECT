import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProfilePage() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [profile, setProfile] = useState(user);
  const [people, setPeople] = useState([]);
  const [followingId, setFollowingId] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      setLoadingPeople(true);

      try {
        const [profileResponse, peopleResponse] = await Promise.all([api.get('/auth/me'), api.get('/users/people')]);
        setProfile(profileResponse.data.data);
        setPeople(peopleResponse.data.data || []);
        setUser(profileResponse.data.data);
      } catch (error) {
        toast.error('Unable to load profile details');
      } finally {
        setLoadingProfile(false);
        setLoadingPeople(false);
      }
    };

    loadProfile();
  }, [setUser]);

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setSaving(true);

    try {
      await api.put('/auth/me/password', {
        currentPassword,
        newPassword
      });
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Delete your account permanently? This cannot be undone.');

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await api.delete('/auth/me');
      toast.success('Account deleted');
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const handleFollowToggle = async (person) => {
    setFollowingId(person.id);

    try {
      if (person.isFollowing) {
        await api.delete(`/users/${person.id}/follow`);
      } else {
        await api.post(`/users/${person.id}/follow`);
      }

      const [profileResponse, peopleResponse] = await Promise.all([api.get('/auth/me'), api.get('/users/people')]);
      setProfile(profileResponse.data.data);
      setPeople(peopleResponse.data.data || []);
      setUser(profileResponse.data.data);
      toast.success(person.isFollowing ? 'Unfollowed user' : 'Following user');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update follow state');
    } finally {
      setFollowingId(null);
    }
  };

  return (
    <div className="space-y-8 text-slate-100">
      <section className="glass-panel p-6 md:p-10">
        <p className="panel-heading">Profile</p>
        <h2 className="mt-3 text-4xl font-semibold text-white">{loadingProfile ? 'Loading your account...' : 'Your account'}</h2>
        <p className="mt-3 max-w-2xl text-slate-400">
          Review your account details, see who follows you, manage who you follow, change your password, or delete your account from one place.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Username</p>
            <p className="mt-2 text-xl font-semibold text-white">{profile?.username}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Email</p>
            <p className="mt-2 text-xl font-semibold text-white">{profile?.email || 'Not set'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Role</p>
            <p className="mt-2 text-xl font-semibold text-white capitalize">{profile?.role}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
            <p className="text-sm text-slate-400">Followers</p>
            <p className="mt-2 text-3xl font-semibold text-white">{profile?.followerCount ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
            <p className="text-sm text-slate-400">Following</p>
            <p className="mt-2 text-3xl font-semibold text-white">{profile?.followingCount ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
            <p className="text-sm text-slate-400">Connections</p>
            <p className="mt-2 text-3xl font-semibold text-white">{profile?.connectionCount ?? 0}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
        <div className="glass-panel p-6 md:p-8">
          <p className="panel-heading">Security</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">Change password</h3>

          <form className="mt-6 space-y-5" onSubmit={handlePasswordChange}>
            <div>
              <label className="label">Current password</label>
              <input
                className="field"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </div>
            <div>
              <label className="label">New password</label>
              <input
                className="field"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input
                className="field"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>

            <button className="btn-primary" disabled={saving} type="submit">
              {saving ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>

        <div className="glass-panel p-6 md:p-8">
          <p className="panel-heading">Account</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">Delete account</h3>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Deleting your account will remove your profile and associated content. This action cannot be undone.
          </p>

          <button className="btn-danger mt-6 w-full" disabled={deleting} onClick={handleDeleteAccount} type="button">
            {deleting ? 'Deleting...' : 'Delete account'}
          </button>
        </div>
      </section>

      <section className="glass-panel p-6 md:p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="panel-heading">People</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">Connect with other users</h3>
          </div>
          <p className="text-sm text-slate-400">Follow someone to keep track of their content and build mutual connections.</p>
        </div>

        {loadingPeople ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-300">Loading people...</div>
        ) : people.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-400">No other users found yet.</div>
        ) : (
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {people
              .filter((person) => person.role !== 'admin' && !person.isAnonymous)
              .map((person) => (
              <article key={person.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold text-white">
                      {person.isAnonymous ? 'Anonymous' : person.username}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                      {person.isAnonymous ? 'Anonymous' : person.role}
                    </p>
                  </div>
                  {person.isConnected ? (
                    <span className="badge border-emerald-400/20 bg-emerald-400/10 text-emerald-200">Connected</span>
                  ) : person.isFollowing ? (
                    <span className="badge border-cyan-400/20 bg-cyan-400/10 text-cyan-200">Following</span>
                  ) : (
                    <span className="badge border-white/10 bg-white/5 text-slate-300">New</span>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl border border-white/10 bg-slate-950/50 p-2.5">
                    <p className="text-[11px] text-slate-400">Followers</p>
                    <p className="mt-1 text-base font-semibold text-white">{person.followerCount}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/50 p-2.5">
                    <p className="text-[11px] text-slate-400">Following</p>
                    <p className="mt-1 text-base font-semibold text-white">{person.followingCount}</p>
                  </div>
                </div>

                <button
                  className={person.isFollowing ? 'btn-secondary mt-3 w-full py-2.5' : 'btn-primary mt-3 w-full py-2.5'}
                  disabled={followingId === person.id}
                  onClick={() => handleFollowToggle(person)}
                  type="button"
                >
                  {followingId === person.id ? 'Updating...' : person.isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
