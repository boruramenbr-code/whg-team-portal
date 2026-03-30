'use client';

import { useState, useEffect, useCallback } from 'react';
import { Profile, Restaurant, UserRole } from '@/lib/types';

interface ProfileWithRestaurant extends Profile {
  restaurants?: Restaurant;
}

interface AdminPanelProps {
  currentUser: Profile;
  restaurants: Restaurant[];
}

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  assistant_manager: 'bg-sky-100 text-sky-700',
  employee: 'bg-gray-100 text-gray-600',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  assistant_manager: 'Asst. Manager',
  employee: 'Employee',
};

function PinInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
    onChange(v);
  };
  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        pattern="\d{4}"
        maxLength={4}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder="0000"
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-[#2E86C1] text-center text-gray-800 bg-gray-50 disabled:opacity-60"
        required
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i < value.length ? 'bg-[#1B3A6B]' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function AdminPanel({ currentUser, restaurants }: AdminPanelProps) {
  const [users, setUsers] = useState<ProfileWithRestaurant[]>([]);
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const [loading, setLoading] = useState(true);

  // Add member modal
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    pin: '',
    email: '',
    password: '',
    restaurant_id: currentUser.restaurant_id || '',
    role: 'employee' as UserRole,
    preferred_language: 'en' as 'en' | 'es',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const isEmployeeRole = form.role === 'employee';
  const isElevatedRole = ['manager', 'assistant_manager', 'admin'].includes(form.role);

  // PIN reset modal
  const [resetTarget, setResetTarget] = useState<ProfileWithRestaurant | null>(null);
  const [newPin, setNewPin] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

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

  const resetForm = () => {
    setForm({
      full_name: '',
      pin: '',
      email: '',
      password: '',
      restaurant_id: currentUser.restaurant_id || '',
      role: 'employee',
      preferred_language: 'en',
    });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation by role type
    if (form.role === 'employee' && form.pin.length !== 4) {
      setFormError('PIN must be exactly 4 digits.');
      return;
    }
    if (isElevatedRole && (!form.email || form.password.length < 8)) {
      setFormError('Email and a password of at least 8 characters are required.');
      return;
    }

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
      setFormSuccess(`${form.full_name} has been added!`);
      resetForm();
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
    const confirmed = window.confirm(
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

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    if (newPin.length !== 4) {
      setResetError('PIN must be exactly 4 digits.');
      return;
    }
    setResetLoading(true);
    setResetError('');
    setResetSuccess('');

    const res = await fetch(`/api/admin/users/${resetTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: newPin }),
    });

    const data = await res.json();

    if (!res.ok) {
      setResetError(data.error || 'Failed to reset PIN.');
      setResetLoading(false);
    } else {
      setResetSuccess(`PIN updated for ${resetTarget.full_name}!`);
      setResetLoading(false);
      setTimeout(() => {
        setResetTarget(null);
        setNewPin('');
        setResetSuccess('');
        fetchUsers();
      }, 1500);
    }
  };

  const openResetPin = (u: ProfileWithRestaurant) => {
    setResetTarget(u);
    setNewPin('');
    setResetError('');
    setResetSuccess('');
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
            {isAdmin
              ? 'All restaurants'
              : (currentUser as ProfileWithRestaurant).restaurants?.name}
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setFormError('');
            setFormSuccess('');
          }}
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
                  {u.restaurants?.name || '—'}
                  {u.id === currentUser.id ? ' · You' : ''}
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
                    <option value="assistant_manager">Asst. Manager</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span
                    className={`text-[10px] px-2 py-1 rounded-full font-semibold uppercase tracking-wide ${
                      ROLE_STYLES[u.role] || ROLE_STYLES.employee
                    }`}
                  >
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                )}

                {/* PIN Reset — only for employees, shown to managers */}
                {u.role === 'employee' && u.id !== currentUser.id && (
                  <button
                    onClick={() => openResetPin(u)}
                    className="text-xs px-3 py-1 rounded-lg font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                    title="Reset PIN"
                  >
                    PIN
                  </button>
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

      {/* ─── ADD MEMBER MODAL ─── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl my-auto">
            <h3 className="text-lg font-bold text-[#1B3A6B] mb-1">Add Team Member</h3>
            <p className="text-xs text-gray-500 mb-5">
              {isElevatedRole
                ? 'Manager accounts use email + password to sign in.'
                : 'Staff will select their name and enter their PIN to sign in.'}
            </p>

            {formSuccess ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-green-700 font-semibold">{formSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleAddUser} className="space-y-4">

                {/* Role — shown first so the form adapts immediately */}
                {isAdmin && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                      Role
                    </label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value as UserRole, pin: '', email: '', password: '' })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1] bg-white"
                    >
                      <option value="employee">Employee</option>
                      <option value="assistant_manager">Assistant Manager</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
                    placeholder="e.g. Sarah Johnson"
                    required
                  />
                </div>

                {/* Restaurant */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
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
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* EMPLOYEE: 4-digit PIN + Language */}
                {isEmployeeRole && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                        4-Digit PIN
                      </label>
                      <PinInput
                        value={form.pin}
                        onChange={(v) => setForm({ ...form, pin: v })}
                        disabled={formLoading}
                      />
                      <p className="text-[11px] text-gray-400 mt-1.5">
                        Share this PIN with them after adding.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                        Language
                      </label>
                      <div className="flex gap-2">
                        {[
                          { value: 'en', label: '🇺🇸 English' },
                          { value: 'es', label: '🇲🇽 Español' },
                        ].map((lang) => (
                          <button
                            key={lang.value}
                            type="button"
                            onClick={() => setForm({ ...form, preferred_language: lang.value as 'en' | 'es' })}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                              form.preferred_language === lang.value
                                ? 'border-[#1B3A6B] bg-[#1B3A6B] text-white'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1.5">
                        The app will respond in their preferred language automatically.
                      </p>
                    </div>
                  </>
                )}

                {/* MANAGER / ASST. MANAGER / ADMIN: email + password */}
                {isElevatedRole && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
                        placeholder="manager@email.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                        Temporary Password
                      </label>
                      <input
                        type="text"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1] font-mono"
                        placeholder="Min. 8 characters"
                        minLength={8}
                        required
                      />
                      <p className="text-[11px] text-gray-400 mt-1.5">
                        They'll use this to sign in under Manager / Owner login.
                      </p>
                    </div>
                  </>
                )}

                {formError && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                    {formError}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); resetForm(); }}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      formLoading ||
                      (isEmployeeRole && form.pin.length !== 4) ||
                      (isElevatedRole && (!form.email || form.password.length < 8))
                    }
                    className="flex-1 py-2.5 bg-[#1B3A6B] hover:bg-[#2E86C1] text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors"
                  >
                    {formLoading ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── PIN RESET MODAL ─── */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-[#1B3A6B] mb-1">Reset PIN</h3>
            <p className="text-xs text-gray-500 mb-5">
              Setting a new PIN for{' '}
              <span className="font-semibold text-gray-700">{resetTarget.full_name}</span>
            </p>

            {resetSuccess ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-green-700 font-semibold">{resetSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleResetPin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    New 4-Digit PIN
                  </label>
                  <PinInput
                    value={newPin}
                    onChange={setNewPin}
                    disabled={resetLoading}
                  />
                </div>

                {resetError && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                    {resetError}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setResetTarget(null)}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading || newPin.length !== 4}
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors"
                  >
                    {resetLoading ? 'Saving...' : 'Save PIN'}
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
