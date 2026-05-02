'use client';

import { useEffect, useState, useCallback } from 'react';
import { Profile } from '@/lib/types';

interface Position {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  department: 'FOH' | 'BOH' | 'Management';
  sort_order: number;
}

interface Restaurant {
  id: string;
  name: string;
}

interface Rate {
  id: string;
  position_id: string;
  restaurant_id: string;
  pay_rate: string;
  notes: string | null;
  effective_date: string;
}

interface PayRatesPayload {
  min_wage: { federal: string; louisiana: string; tipped_minimum: string };
  positions: Position[];
  restaurants: Restaurant[];
  rates: Rate[];
}

interface Props {
  profile: Profile;
}

/**
 * PayRatesTab — manager-only reference for starting pay across restaurants.
 *
 * Layout:
 *   1. Federal/LA minimum wage banner (always visible at top)
 *   2. Department-grouped table: rows = positions, columns = restaurants
 *   3. Admin-only: tap any cell to edit the rate
 *
 * Pay rates are stored as free-text strings ('$13–14/hr', 'Salary + benefits',
 * '$5/hr + 10% tipout') so we can express ranges and qualifiers without
 * forcing numeric structure.
 */
export default function PayRatesTab({ profile }: Props) {
  const isAdmin = profile.role === 'admin';
  const [data, setData] = useState<PayRatesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ position: Position; restaurant: Restaurant; current: Rate | null } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pay-rates', { cache: 'no-store' });
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 text-center text-gray-500">
        Loading pay rates…
      </div>
    );
  }
  if (!data) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 text-center text-red-600">
        Could not load pay rates.
      </div>
    );
  }

  // Build a lookup: rates[positionId][restaurantId] = rate
  const lookup = new Map<string, Map<string, Rate>>();
  for (const r of data.rates) {
    if (!lookup.has(r.position_id)) lookup.set(r.position_id, new Map());
    lookup.get(r.position_id)!.set(r.restaurant_id, r);
  }

  const departments: Array<'FOH' | 'BOH' | 'Management'> = ['FOH', 'BOH', 'Management'];
  const deptLabels = { FOH: 'Front of House', BOH: 'Back of House', Management: 'Management' };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-5">
      {/* ── Header ── */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#1B3A6B] flex items-center gap-2">
              <span>💰</span> Starting Pay Rates
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Manager reference. Edits require owner approval.
            </p>
          </div>
          {isAdmin && (
            <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
              Admin · editable
            </span>
          )}
        </div>
      </div>

      {/* ── Minimum wage banner ── */}
      <div className="bg-gradient-to-br from-[#1B3A6B] to-[#2C4F8A] rounded-2xl shadow-sm p-5 text-white">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🏛️</span>
          <h3 className="text-sm font-bold uppercase tracking-widest text-amber-300">
            Louisiana Minimum Wage
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-widest text-white/70 font-semibold">
              Standard Minimum
            </p>
            <p className="text-3xl font-bold mt-1">{data.min_wage.federal}</p>
            <p className="text-[11px] text-white/60 mt-1 italic">
              {data.min_wage.louisiana}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-widest text-white/70 font-semibold">
              Tipped Minimum (Federal)
            </p>
            <p className="text-3xl font-bold mt-1">{data.min_wage.tipped_minimum}</p>
            <p className="text-[11px] text-white/60 mt-1 italic">
              Plus tips must equal at least standard minimum
            </p>
          </div>
        </div>
      </div>

      {/* ── Pay matrix grouped by department ── */}
      {departments.map((dept) => {
        const deptPositions = data.positions.filter((p) => p.department === dept);
        if (deptPositions.length === 0) return null;
        return (
          <div key={dept} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-bold text-[#1B3A6B] uppercase tracking-wide">
                {deptLabels[dept]}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 text-[11px] uppercase tracking-widest text-gray-500">
                    <th className="text-left px-4 py-2.5 font-semibold w-[36%]">Position</th>
                    {data.restaurants.map((r) => (
                      <th key={r.id} className="text-left px-3 py-2.5 font-semibold">{r.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deptPositions.map((p, idx) => (
                    <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{p.emoji}</span>
                          <span className="font-semibold text-gray-800">{p.name}</span>
                        </div>
                      </td>
                      {data.restaurants.map((r) => {
                        const rate = lookup.get(p.id)?.get(r.id) || null;
                        return (
                          <PayCell
                            key={r.id}
                            position={p}
                            restaurant={r}
                            rate={rate}
                            isAdmin={isAdmin}
                            onEdit={() => setEditing({ position: p, restaurant: r, current: rate })}
                          />
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* ── Footer note ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed">
        <p>
          <strong>Note:</strong> Ranges (e.g., $13–14/hr) reflect experience-based starting pay.
          Use the lower end for new hires without prior experience and the higher end for proven
          candidates. For raises and adjustments above starting pay, refer to the staff handbook.
        </p>
      </div>

      {/* ── Edit modal ── */}
      {editing && isAdmin && (
        <EditRateModal
          position={editing.position}
          restaurant={editing.restaurant}
          current={editing.current}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

/* ───────── Pay cell ───────── */
function PayCell({
  position,
  restaurant,
  rate,
  isAdmin,
  onEdit,
}: {
  position: Position;
  restaurant: Restaurant;
  rate: Rate | null;
  isAdmin: boolean;
  onEdit: () => void;
}) {
  // Suppress unused-prop warnings — these are kept on the signature for
  // potential future use (e.g., per-cell context menus, audit links).
  void position; void restaurant;

  const baseClass = 'px-3 py-3 align-top';

  if (!rate) {
    return (
      <td className={baseClass}>
        {isAdmin ? (
          <button
            onClick={onEdit}
            className="text-xs text-gray-400 italic hover:text-[#1B3A6B] hover:underline"
          >
            + add rate
          </button>
        ) : (
          <span className="text-xs text-gray-400 italic">—</span>
        )}
      </td>
    );
  }
  return (
    <td className={baseClass}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900">{rate.pay_rate}</div>
          {rate.notes && (
            <div className="text-[11px] text-gray-500 italic mt-0.5">{rate.notes}</div>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={onEdit}
            className="flex-shrink-0 text-gray-400 hover:text-[#1B3A6B] text-base leading-none"
            title="Edit"
            aria-label="Edit pay rate"
          >
            ✎
          </button>
        )}
      </div>
    </td>
  );
}

/* ───────── Edit modal ───────── */
function EditRateModal({
  position,
  restaurant,
  current,
  onClose,
  onSaved,
}: {
  position: Position;
  restaurant: Restaurant;
  current: Rate | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [payRate, setPayRate] = useState(current?.pay_rate || '');
  const [notes, setNotes] = useState(current?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!payRate.trim()) {
      setError('Pay rate cannot be empty.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/pay-rates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position_id: position.id,
          restaurant_id: restaurant.id,
          pay_rate: payRate.trim(),
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save.');
        setSaving(false);
        return;
      }
      onSaved();
    } catch {
      setError('Network error.');
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!current) return;
    if (!confirm(`Remove the ${position.name} rate at ${restaurant.name}?`)) return;
    setSaving(true);
    setError(null);
    try {
      const url = `/api/pay-rates?position_id=${position.id}&restaurant_id=${restaurant.id}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to remove.');
        setSaving(false);
        return;
      }
      onSaved();
    } catch {
      setError('Network error.');
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-[#1B3A6B] flex items-center gap-2">
            <span>{position.emoji}</span>
            {position.name} — {restaurant.name}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Edit starting pay rate.</p>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">
              Pay rate
            </label>
            <input
              type="text"
              value={payRate}
              onChange={(e) => setPayRate(e.target.value)}
              placeholder="e.g. $13/hr  or  $13–14/hr  or  Salary + benefits"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/40"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Free text — supports ranges, percentages, and qualifiers.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">
              Notes <span className="text-gray-400 font-normal normal-case">(optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. *Part-time, Ramen Line"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/40"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex justify-between gap-3">
          {current ? (
            <button
              onClick={remove}
              disabled={saving}
              className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              Remove
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold bg-[#1B3A6B] text-white rounded-lg hover:bg-[#2C4F8A] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
