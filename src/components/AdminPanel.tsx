'use client';

import { useState, useEffect, useCallback } from 'react';
import { Profile, Restaurant, UserRole } from '@/lib/types';

interface ProfileWithRestaurant extends Profile {
  restaurants?: { name: string; slug: string };
}

interface AdminPanelProps {
  currentUser: Profile;
  restaurants: Restaurant[];
}

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  employee: 'bg-gray-100 text-gray-600',
};

export default function AdminPanel({ currentUser, restaurants }: AdminPanelProps) {
  const [users, setUsers] = useState<ProfileWithRestaurant[]>([]);
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    restaurant_id: currentUser.restaurant_id || '',
    role: 'employee' as UserRole,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const isAdmin = currentUser.role === 'admin';

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?status=${filter}`);
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setFormError(data.error || 'Failed to create account. Please try again.');
      setFormLoading(false);
    } else {
      setFormSuccess(`Account created for ${form.full_name}!`);
      setForm({
        full_name: '',
        email: '',
        password: '',
        restaurant_id: currentUser.restaurant_id || '',
        role: 'employee',
      });
      setFormLoading(false);
      setTimeout(() => {
        setShowForm(false);
        setFormSuccess('');
        fetchUsers();
      }, 1500);
    }
  };

  const toggleArchive = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'archived' : 'active';
    const confirmed = confirm(
      newStatus === 'archived'
        ? 'Archive this team member? They will immediately lose access.'
        : 'Restore access for this team member?'
    );
    if (!confirmed) return;

    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchUsers();
  };

  const updateRole = async (userId: string, role: UserRole) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    fetchUsers();
  };

  const visibleRestaurants = isAdmin
    ? restaurants
    : restaurants.filter((r) => r.id === currentUser.restaurant_id);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-[#1B3A6B]">Team Members</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {isAdmin ? 'All restaurants' : (currentUser as ProfileWithRestaurant).restaurants?.name}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setFormError(''); setFormSuccess(''); }}
          className="bg-[#1B3A6B] hover:bg-[#2E86C1] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Member
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['active', 'archived'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
              filter === s
                ? 'bg-[#1B3A6B] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* User list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No {filter} team members found.
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{u.full_name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {u.restaurants?.name || '—'} · {u.id === currentUser.id ? 'You' : u.role}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Role badge / selector */}
                {isAdmin && u.id !== currentUser.id ? (
                  <select
                    value={u.role}
                    onChange={(e) => updateRole(u.id, e.target.value as UserRole)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#2E86C1] bg-white"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span
                    className={`text-[10px] px-2 py-1 rounded-full font-semibold uppercase tracking-wide ${
                      ROLE_STYLES[u.role] || ROLE_STYLES.employee
                    }`}
                  >
                    {u.role}
                  </span>
                )}

                {/* Archive / Restore */}
                {u.id !== currentUser.id && (
                  <button
                    onClick={() => toggleArchive(u.id, u.status)}
                    className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                      u.status === 'active'
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {u.status === 'active' ? 'Archive' : 'Restore'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-[#1B3A6B] mb-4">Add Team Member</h3>

            {formSuccess ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-green-700 font-semibold">{formSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Temporary Password
                  </label>
                  <input
                    type="text"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
                    placeholder="Min. 8 characters — share this with them"
                    minLength={8}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Restaurant
                  </label>
                  <select
                    value={form.restaurant_id}
                    onChange={(e) => setForm({ ...form, restaurant_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1] bg-white"
                    required
                  >
                    <option value="">Select a restaurant...</option>
                    {visibleRestaurants.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {isAdmin && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Role
                    </label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1] bg-white"
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                )}

                {formError && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                    {formError}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 py-2.5 bg-[#1B3A6B] hover:bg-[#2E86C1] text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors"
                  >
                    {formLoading ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
