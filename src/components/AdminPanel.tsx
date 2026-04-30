'use client';

import { useState, useEffect, useCallback } from 'react';
import { Profile, Restaurant, UserRole } from '@/lib/types';
import BulkImportModal from './BulkImportModal';

interface BarCardSummary {
  id: string;
  expiration_date: string;
  archived: boolean;
}

interface ProfileWithRestaurant extends Profile {
  restaurants?: Restaurant;
  bar_cards?: BarCardSummary[];
}

interface UserLocation {
  id: string;
  restaurant_id: string;
  restaurants: { id: string; name: string; slug: string } | null;
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

/* ── PIN Input ── */
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
    const v = e.target.value.replace(/\D/g, '').slice(0, 8);
    onChange(v);
  };
  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        pattern="\d{4,8}"
        maxLength={8}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder="0000"
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-[#2E86C1] text-center text-gray-800 bg-gray-50 disabled:opacity-60"
        required
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
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

/* ── Main Component ── */
export default function AdminPanel({ currentUser, restaurants }: AdminPanelProps) {
  const [users, setUsers] = useState<ProfileWithRestaurant[]>([]);
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const [restaurantFilter, setRestaurantFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Expanded edit row
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editRestaurantId, setEditRestaurantId] = useState<string>('');
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);

  // Helper: today + 30 days as YYYY-MM-DD
  const defaultWelcomeUntil = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  })();
  const todayStr = new Date().toISOString().split('T')[0];

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
    date_of_birth: '',
    hire_date: todayStr,
    welcome_until: defaultWelcomeUntil,
    requires_bar_card: false,
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

  // Password reset modal (managers / asst managers / admins)
  const [resetPwTarget, setResetPwTarget] = useState<ProfileWithRestaurant | null>(null);
  const [newPw, setNewPw] = useState('');
  const [resetPwLoading, setResetPwLoading] = useState(false);
  const [resetPwError, setResetPwError] = useState('');
  const [resetPwSuccess, setResetPwSuccess] = useState('');

  // Bulk import modal
  const [showBulkImport, setShowBulkImport] = useState(false);

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

  // Fetch extra locations for expanded user
  const fetchUserLocations = useCallback(async (profileId: string) => {
    setLocationsLoading(true);
    try {
      const res = await fetch(`/api/admin/manager-locations?profile_id=${profileId}`);
      const data = await res.json();
      setUserLocations(data.locations || []);
    } catch {
      setUserLocations([]);
    }
    setLocationsLoading(false);
  }, []);

  const handleExpand = (user: ProfileWithRestaurant) => {
    if (expandedId === user.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(user.id);
    setEditRestaurantId(user.restaurant_id || '');
    if (isAdmin) {
      fetchUserLocations(user.id);
    }
  };

  const handleChangeRestaurant = async (userId: string, newRestaurantId: string) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurant_id: newRestaurantId }),
    });
    setEditRestaurantId(newRestaurantId);
    fetchUsers();
  };

  const handleAddLocation = async (userId: string, restaurantId: string) => {
    await fetch('/api/admin/manager-locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: userId, restaurant_id: restaurantId }),
    });
    fetchUserLocations(userId);
  };

  const handleRemoveLocation = async (userId: string, restaurantId: string) => {
    await fetch('/api/admin/manager-locations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: userId, restaurant_id: restaurantId }),
    });
    fetchUserLocations(userId);
  };

  const resetForm = () => {
    setForm({
      full_name: '',
      pin: '',
      email: '',
      password: '',
      restaurant_id: currentUser.restaurant_id || '',
      role: 'employee',
      preferred_language: 'en',
      date_of_birth: '',
      hire_date: todayStr,
      welcome_until: defaultWelcomeUntil,
      requires_bar_card: false,
    });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.role === 'employee' && (form.pin.length < 4 || form.pin.length > 8)) {
      setFormError('PIN must be 4 to 8 digits.');
      return;
    }
    if (isElevatedRole && (!form.email || form.password.length < 8)) {
      setFormError('Email and a password of at least 8 characters are required.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    // Strip empty dates so we send null instead of ""
    const payload = {
      ...form,
      date_of_birth: form.date_of_birth || null,
      hire_date: form.hire_date || null,
      welcome_until: form.welcome_until || null,
    };

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setFormError(data.error || 'Failed to create account.');
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
    if (!resetTarget || newPin.length < 4 || newPin.length > 8) {
      setResetError('PIN must be 4 to 8 digits.');
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

  const openResetPassword = (u: ProfileWithRestaurant) => {
    setResetPwTarget(u);
    setNewPw('');
    setResetPwError('');
    setResetPwSuccess('');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwTarget || newPw.length < 8) {
      setResetPwError('Password must be at least 8 characters.');
      return;
    }
    setResetPwLoading(true);
    setResetPwError('');
    setResetPwSuccess('');

    const res = await fetch(`/api/admin/users/${resetPwTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPw }),
    });

    const data = await res.json();
    if (!res.ok) {
      setResetPwError(data.error || 'Failed to reset password.');
      setResetPwLoading(false);
    } else {
      setResetPwSuccess(`Password updated for ${resetPwTarget.full_name}!`);
      setResetPwLoading(false);
      // Don't auto-close — admin needs time to copy the password to share
    }
  };

  const visibleRestaurants = isAdmin
    ? restaurants
    : restaurants.filter((r) => r.id === currentUser.restaurant_id);

  // Apply restaurant filter
  const filteredUsers = restaurantFilter === 'all'
    ? users
    : users.filter((u) => u.restaurant_id === restaurantFilter);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-[#1B3A6B]">Team Members</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {isAdmin
              ? `${filteredUsers.length} ${filter} members${restaurantFilter !== 'all' ? '' : ' across all restaurants'}`
              : (currentUser as ProfileWithRestaurant).restaurants?.name}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowBulkImport(true)}
              className="bg-white hover:bg-gray-50 border border-gray-200 text-[#1B3A6B] text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
              title="Paste from a spreadsheet to add many staff at once"
            >
              <span className="text-base leading-none">📥</span> Bulk Import
            </button>
          )}
          <button
            onClick={() => {
              setShowForm(true);
              setFormError('');
              setFormSuccess('');
            }}
            className="bg-[#1B3A6B] hover:bg-[#2E86C1] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span className="text-base leading-none">+</span> Add Member
          </button>
        </div>
      </div>

      {/* Restaurant filter pills — admin only */}
      {isAdmin && restaurants.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setRestaurantFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              restaurantFilter === 'all'
                ? 'bg-[#1B3A6B] text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {restaurants.map((r) => (
            <button
              key={r.id}
              onClick={() => setRestaurantFilter(r.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                restaurantFilter === r.id
                  ? 'bg-[#1B3A6B] text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['active', 'archived'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
              filter === s
                ? 'bg-[#2E86C1] text-white'
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
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No {filter} team members found.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((u) => {
            const isExpanded = expandedId === u.id;
            const isSelf = u.id === currentUser.id;

            return (
              <div key={u.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-sm">
                {/* Main row */}
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <button
                    onClick={() => !isSelf && handleExpand(u)}
                    className="min-w-0 text-left flex-1"
                    disabled={isSelf}
                  >
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {u.full_name}
                      {isSelf && <span className="text-gray-400 font-normal ml-1">(You)</span>}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {u.restaurants?.name || '—'}
                    </p>
                  </button>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Role badge */}
                    <span
                      className={`text-[10px] px-2 py-1 rounded-full font-semibold uppercase tracking-wide ${
                        ROLE_STYLES[u.role] || ROLE_STYLES.employee
                      }`}
                    >
                      {ROLE_LABELS[u.role] || u.role}
                    </span>

                    {/* Expand/collapse chevron */}
                    {!isSelf && (
                      <button
                        onClick={() => handleExpand(u)}
                        className="text-gray-300 hover:text-gray-500 transition-colors p-1"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded edit row */}
                {isExpanded && !isSelf && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Change Primary Restaurant */}
                      {isAdmin && (
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                            Primary Restaurant
                          </label>
                          <select
                            value={editRestaurantId}
                            onChange={(e) => handleChangeRestaurant(u.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1] bg-white"
                          >
                            {restaurants.map((r) => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Change Role — admin only */}
                      {isAdmin && (
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                            Role
                          </label>
                          <select
                            value={u.role}
                            onChange={(e) => updateRole(u.id, e.target.value as UserRole)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1] bg-white"
                          >
                            <option value="employee">Employee</option>
                            <option value="assistant_manager">Asst. Manager</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Birthday + Hire Date */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                          Birthday
                        </label>
                        <input
                          type="date"
                          defaultValue={u.date_of_birth || ''}
                          onBlur={(e) => {
                            const val = e.target.value || null;
                            if (val !== (u.date_of_birth || null)) {
                              fetch(`/api/admin/users/${u.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ date_of_birth: val }),
                              }).then(() => fetchUsers());
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                          🎂 Hire Date
                        </label>
                        <input
                          type="date"
                          defaultValue={u.hire_date || ''}
                          onBlur={(e) => {
                            const val = e.target.value || null;
                            if (val !== (u.hire_date || null)) {
                              fetch(`/api/admin/users/${u.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ hire_date: val }),
                              }).then(() => fetchUsers());
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1] bg-white"
                        />
                        {!u.hire_date && (
                          <p className="text-[10px] text-amber-600 mt-1">Set this to enable anniversary alerts</p>
                        )}
                      </div>
                    </div>

                    {/* Highlight on home — welcome_until */}
                    <div className="mt-4">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                        🎉 Highlight on Home Until
                      </label>
                      <div className="flex flex-wrap gap-2 items-center">
                        <input
                          type="date"
                          value={u.welcome_until || ''}
                          min={todayStr}
                          onChange={(e) => {
                            const val = e.target.value || null;
                            fetch(`/api/admin/users/${u.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ welcome_until: val }),
                            }).then(() => fetchUsers());
                          }}
                          className="w-full md:w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            fetch(`/api/admin/users/${u.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ welcome_until: defaultWelcomeUntil }),
                            }).then(() => fetchUsers());
                          }}
                          className="px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                        >
                          🎉 Highlight 30 days
                        </button>
                        {u.welcome_until && (
                          <button
                            type="button"
                            onClick={() => {
                              fetch(`/api/admin/users/${u.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ welcome_until: null }),
                              }).then(() => fetchUsers());
                            }}
                            className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-200 rounded-lg transition-colors"
                          >
                            Stop highlighting
                          </button>
                        )}
                      </div>
                      {u.welcome_until && u.welcome_until >= todayStr ? (
                        <p className="text-[10px] text-amber-600 mt-1 font-semibold">
                          ✓ Featured on home tab through {new Date(u.welcome_until + 'T00:00:00').toLocaleDateString()}
                        </p>
                      ) : (
                        <p className="text-[10px] text-gray-400 mt-1">
                          Not currently featured. Use a date or the 30-day button to spotlight them.
                        </p>
                      )}
                    </div>

                    {/* Requires bar card toggle + card status */}
                    <div className="mt-4">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                        🍷 Handles Alcohol
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !u.requires_bar_card;
                          fetch(`/api/admin/users/${u.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ requires_bar_card: next }),
                          }).then(() => fetchUsers());
                        }}
                        className={`w-full md:w-auto md:min-w-[16rem] px-3 py-2 rounded-lg text-xs font-semibold border-2 transition-all flex items-center justify-between gap-3 ${
                          u.requires_bar_card
                            ? 'border-rose-300 bg-rose-50 text-rose-800'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <span>
                          {u.requires_bar_card ? 'Yes — handles alcohol' : 'Does not handle alcohol'}
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                          u.requires_bar_card ? 'bg-rose-200 text-rose-900' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {u.requires_bar_card ? 'YES' : 'NO'}
                        </span>
                      </button>

                      {/* Status block — only when person handles alcohol */}
                      {u.requires_bar_card && (() => {
                        const activeCards = (u.bar_cards || []).filter((c) => !c.archived);
                        // Most recent expiration wins
                        const latest = activeCards.length > 0
                          ? activeCards.reduce((a, b) => (a.expiration_date > b.expiration_date ? a : b))
                          : null;
                        if (!latest) {
                          return (
                            <div className="mt-2 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-xs">
                              <span className="font-bold">⚠️ No bar card on file</span>
                              <span className="block text-[11px] mt-0.5 opacity-90">
                                They&apos;re seeing &quot;Action needed&quot; on their home tab. Upload their card from the Bar Cards tab.
                              </span>
                            </div>
                          );
                        }
                        const today = new Date(); today.setHours(0, 0, 0, 0);
                        const exp = new Date(latest.expiration_date + 'T00:00:00');
                        const days = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        const expFormatted = exp.toLocaleDateString();
                        if (days < 0) {
                          return (
                            <div className="mt-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
                              <span className="font-bold">⚠️ Card EXPIRED on {expFormatted}</span>
                              <span className="block text-[11px] mt-0.5">
                                Expired {Math.abs(days)} day{Math.abs(days) === 1 ? '' : 's'} ago. They&apos;re seeing a critical alert on their home tab.
                              </span>
                            </div>
                          );
                        }
                        if (days <= 7) {
                          return (
                            <div className="mt-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
                              <span className="font-bold">🚨 Card expires in {days} day{days === 1 ? '' : 's'} ({expFormatted})</span>
                              <span className="block text-[11px] mt-0.5">They&apos;re seeing a red alert on their home tab.</span>
                            </div>
                          );
                        }
                        if (days <= 30) {
                          return (
                            <div className="mt-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                              <span className="font-bold">⚠️ Card expires in {days} days ({expFormatted})</span>
                              <span className="block text-[11px] mt-0.5">They&apos;re seeing a yellow renewal reminder on their home tab.</span>
                            </div>
                          );
                        }
                        return (
                          <div className="mt-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                            <span className="font-bold">✓ Card on file</span>
                            <span className="ml-1.5">— expires {expFormatted} ({days} days)</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Multi-location assignments — admin only */}
                    {isAdmin && (
                      <div className="mt-4">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                          Additional Locations
                        </label>
                        {locationsLoading ? (
                          <p className="text-xs text-gray-400">Loading...</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {restaurants
                              .filter((r) => r.id !== editRestaurantId)
                              .map((r) => {
                                const isAssigned = userLocations.some(
                                  (ul) => ul.restaurant_id === r.id
                                );
                                return (
                                  <button
                                    key={r.id}
                                    onClick={() =>
                                      isAssigned
                                        ? handleRemoveLocation(u.id, r.id)
                                        : handleAddLocation(u.id, r.id)
                                    }
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                                      isAssigned
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                        : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                                    }`}
                                  >
                                    {isAssigned ? '✓ ' : '+ '}{r.name}
                                  </button>
                                );
                              })}
                          </div>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1.5">
                          Tap to add or remove access to other locations.
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
                      {/* PIN Reset — employees only */}
                      {u.role === 'employee' && (
                        <button
                          onClick={() => openResetPin(u)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                        >
                          Reset PIN
                        </button>
                      )}

                      {/* Password Reset — managers / asst managers / admins (admin only) */}
                      {isAdmin && u.role !== 'employee' && (
                        <button
                          onClick={() => openResetPassword(u)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                        >
                          🔑 Reset Password
                        </button>
                      )}

                      {/* Archive / Restore */}
                      <button
                        onClick={() => toggleArchive(u.id, u.status)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                          u.status === 'active'
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {u.status === 'active' ? 'Archive' : 'Restore'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
                {/* Role — shown first so the form adapts */}
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

                {/* Birthday + Hire Date — applies to every role */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                      Birthday <span className="text-gray-300 font-normal">(opt)</span>
                    </label>
                    <input
                      type="date"
                      value={form.date_of_birth}
                      onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                      🎂 Hire Date
                    </label>
                    <input
                      type="date"
                      value={form.hire_date}
                      onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1] bg-white"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 -mt-2">
                  Birthday powers reminders. Hire date powers anniversary alerts on Mission Control.
                </p>

                {/* Highlight as new — until what date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    🎉 Highlight on home until
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="date"
                      value={form.welcome_until}
                      min={todayStr}
                      onChange={(e) => setForm({ ...form, welcome_until: e.target.value })}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, welcome_until: '' })}
                      className="px-3 py-2.5 text-xs font-semibold text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-200 rounded-xl transition-colors"
                      title="Don't highlight this person on the home tab"
                    >
                      Off
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Featured in the &quot;Welcome to the team&quot; spotlight on the home tab. Default: 30 days.
                  </p>
                </div>

                {/* Requires bar card toggle */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    🍷 Bar Card Required
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, requires_bar_card: !form.requires_bar_card })}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all flex items-center justify-between ${
                      form.requires_bar_card
                        ? 'border-rose-300 bg-rose-50 text-rose-800'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <span>
                      {form.requires_bar_card
                        ? '✓ This person handles alcohol — bar card required'
                        : 'Tap if this person handles alcohol'}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                      form.requires_bar_card ? 'bg-rose-200 text-rose-900' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {form.requires_bar_card ? 'YES' : 'NO'}
                    </span>
                  </button>
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Servers, bartenders, hosts. They&apos;ll see a reminder on their home tab when their card is missing or expiring.
                  </p>
                </div>

                {/* EMPLOYEE: PIN + Language */}
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

                {/* MANAGER+: email + password */}
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
                        They&apos;ll use this to sign in under Manager / Owner login.
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
                      (isEmployeeRole && (form.pin.length < 4 || form.pin.length > 8)) ||
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
                    disabled={resetLoading || newPin.length < 4 || newPin.length > 8}
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

      {/* ─── PASSWORD RESET MODAL (managers / admins) ─── */}
      {resetPwTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-[#1B3A6B] mb-1">🔑 Reset Password</h3>
            <p className="text-xs text-gray-500 mb-5">
              Setting a new password for{' '}
              <span className="font-semibold text-gray-700">{resetPwTarget.full_name}</span>
              <span className="block text-[11px] text-gray-400 mt-1">
                Their current sessions will be signed out immediately.
              </span>
            </p>

            {resetPwSuccess ? (
              <div className="space-y-4">
                <div className="text-center py-2">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-green-700 font-semibold">{resetPwSuccess}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wide mb-1">
                    New Password
                  </p>
                  <p className="font-mono text-sm text-amber-900 break-all select-all">
                    {newPw}
                  </p>
                  <p className="text-[11px] text-amber-700 mt-2">
                    Copy this and share it with {resetPwTarget.full_name.split(' ')[0]} securely (in person, phone call, or encrypted message). It won&apos;t be shown again.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setResetPwTarget(null);
                    setNewPw('');
                    setResetPwSuccess('');
                  }}
                  className="w-full py-2.5 bg-[#1B3A6B] hover:bg-[#2E86C1] text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    New Password
                  </label>
                  <input
                    type="text"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Min. 8 characters"
                    minLength={8}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 font-mono"
                    autoFocus
                    required
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Visible so you can copy it. Tell them to change it after first login if you want.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    // Generate a memorable but secure password: WHG-Word-####
                    const words = ['River', 'Sushi', 'Ramen', 'Bayou', 'Tiger', 'Magnolia', 'Cypress', 'Pelican'];
                    const word = words[Math.floor(Math.random() * words.length)];
                    const num = Math.floor(1000 + Math.random() * 9000);
                    setNewPw(`WHG-${word}-${num}`);
                  }}
                  className="w-full py-2 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  🎲 Generate a password
                </button>

                {resetPwError && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                    {resetPwError}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setResetPwTarget(null)}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetPwLoading || newPw.length < 8}
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors"
                  >
                    {resetPwLoading ? 'Saving...' : 'Save Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── BULK IMPORT MODAL ─── */}
      {showBulkImport && (
        <BulkImportModal
          restaurants={restaurants}
          onClose={() => setShowBulkImport(false)}
          onComplete={fetchUsers}
        />
      )}
    </div>
  );
}
