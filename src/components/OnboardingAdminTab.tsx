'use client';

import { useEffect, useState, useCallback } from 'react';
import OnboardingChecklist from './OnboardingChecklist';

interface HireSummary {
  user_id: string;
  full_name: string;
  restaurant_id: string | null;
  restaurant_name: string | null;
  onboarding_category: string | null;
  hire_date: string | null;
  welcome_until: string | null;
  progress: {
    total: number;
    employee_checked: number;
    manager_checked: number;
    fully_complete: number;
    pct_complete: number;
  };
}

interface RestaurantOpt {
  id: string;
  name: string;
}

const VIEW_RESTAURANT_KEY = 'whg_view_restaurant_id';

/**
 * Manager-only onboarding hub. Lists active hires (welcome_until in the
 * future or hire_date within 90 days) with progress bars, plus restaurant
 * filter chips. Click a hire to drill into their checklist in manager mode.
 */
export default function OnboardingAdminTab() {
  const [hires, setHires] = useState<HireSummary[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantOpt[]>([]);
  const [restaurantFilter, setRestaurantFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'in_progress' | 'all'>('in_progress');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drillUser, setDrillUser] = useState<HireSummary | null>(null);

  // Restore restaurant filter from shared localStorage key
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(VIEW_RESTAURANT_KEY);
    if (stored) setRestaurantFilter(stored);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (restaurantFilter !== 'all') params.set('restaurantId', restaurantFilter);
      params.set('status', statusFilter);
      const res = await fetch(`/api/onboarding/users?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to load hires');
      }
      const j = await res.json();
      setHires(j.hires ?? []);
      setRestaurants(j.available_restaurants ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [restaurantFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  function changeRestaurant(id: string) {
    setRestaurantFilter(id);
    if (typeof window !== 'undefined') {
      if (id === 'all') window.localStorage.removeItem(VIEW_RESTAURANT_KEY);
      else window.localStorage.setItem(VIEW_RESTAURANT_KEY, id);
    }
  }

  /* ── Drill-in view: render the checklist for one hire ── */
  if (drillUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-4 md:py-6">
        <button
          onClick={() => { setDrillUser(null); load(); }}
          className="text-sm text-[#1B3A6B] hover:underline mb-4 flex items-center gap-1"
        >
          ← Back to hires
        </button>
        <OnboardingChecklist
          endpoint={`/api/onboarding/users/${drillUser.user_id}`}
          managerMode
          targetUserId={drillUser.user_id}
        />
      </div>
    );
  }

  /* ── List view ── */
  return (
    <div className="max-w-4xl mx-auto px-4 py-4 md:py-6">
      <h1 className="text-2xl md:text-3xl font-bold text-[#1B3A6B] mb-1">Onboarding</h1>
      <p className="text-sm text-gray-600 mb-4">
        Active hires across your restaurants. Tap a name to walk their checklist with them or confirm completed items.
      </p>

      {/* Restaurant filter */}
      {restaurants.length > 1 && (
        <div className="bg-white rounded-2xl shadow-sm p-3 mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Restaurant</p>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => changeRestaurant('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                restaurantFilter === 'all'
                  ? 'bg-[#1B3A6B] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {restaurants.map((r) => (
              <button
                key={r.id}
                onClick={() => changeRestaurant(r.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  restaurantFilter === r.id
                    ? 'bg-[#1B3A6B] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status toggle */}
      <div className="flex items-center gap-2 mb-3 text-xs">
        <span className="text-gray-500 font-semibold uppercase tracking-wider">Show:</span>
        <button
          onClick={() => setStatusFilter('in_progress')}
          className={`px-2.5 py-1 rounded-full font-semibold border ${
            statusFilter === 'in_progress'
              ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          In progress
        </button>
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-2.5 py-1 rounded-full font-semibold border ${
            statusFilter === 'all'
              ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          All recent hires
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <div className="text-gray-400 text-sm animate-pulse">Loading hires…</div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">{error}</div>
      ) : hires.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="text-3xl mb-2">✨</div>
          <p className="text-sm font-semibold text-gray-700">No active onboarding right now.</p>
          <p className="text-xs text-gray-500 mt-1">
            Hires show up here once they&rsquo;re added with a hire date in the last 90 days or a welcome highlight period.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {hires.map((h) => (
            <button
              key={h.user_id}
              onClick={() => setDrillUser(h)}
              className="w-full bg-white rounded-2xl shadow-sm p-4 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#1B3A6B] truncate">{h.full_name}</p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {h.restaurant_name ?? 'No restaurant'}
                    {h.onboarding_category ? ` · ${h.onboarding_category.toUpperCase()}` : ' · category not set'}
                    {h.hire_date && ` · Hired ${new Date(h.hire_date).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className={`text-lg font-bold ${h.progress.pct_complete === 100 ? 'text-green-600' : 'text-[#1B3A6B]'}`}>
                    {h.progress.pct_complete}%
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">complete</div>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full ${h.progress.pct_complete === 100 ? 'bg-green-500' : 'bg-[#1B3A6B]'}`}
                  style={{ width: `${h.progress.pct_complete}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1.5">
                {h.progress.fully_complete}/{h.progress.total} items fully done · {h.progress.employee_checked} employee · {h.progress.manager_checked} manager
              </p>
              {!h.onboarding_category && (
                <p className="text-[10px] text-amber-700 mt-1 font-semibold">
                  ⚠ Set FOH/BOH/MGMT to show position-specific items
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
