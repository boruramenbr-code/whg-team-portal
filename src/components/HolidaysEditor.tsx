'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Restaurant } from '@/lib/types';
import { getHolidayStyle } from '@/lib/holiday-types';

interface Holiday {
  id: string;
  restaurant_id: string | null;
  start_date: string;
  end_date: string;
  name: string;
  name_es: string | null;
  type: 'closed' | 'slow' | 'normal' | 'busy' | 'all_hands';
  notes: string | null;
  notes_es: string | null;
  restaurants: { name: string } | null;
}

interface FormState {
  id: string | null;
  restaurant_id: string;
  start_date: string;
  end_date: string;
  name: string;
  name_es: string;
  type: 'closed' | 'slow' | 'normal' | 'busy' | 'all_hands';
  notes: string;
  notes_es: string;
}

interface Props {
  restaurants: Restaurant[];
}

const TODAY = new Date().toISOString().split('T')[0];

const EMPTY: FormState = {
  id: null,
  restaurant_id: '',
  start_date: TODAY,
  end_date: TODAY,
  name: '',
  name_es: '',
  type: 'all_hands',
  notes: '',
  notes_es: '',
};

/**
 * Admin editor for holidays. Lists upcoming + past, allows add/edit/delete.
 */
export default function HolidaysEditor({ restaurants }: Props) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const formRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/holidays?all=true', { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      setHolidays(d.holidays || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (h: Holiday) => {
    setForm({
      id: h.id,
      restaurant_id: h.restaurant_id || '',
      start_date: h.start_date,
      end_date: h.end_date,
      name: h.name,
      name_es: h.name_es || '',
      type: h.type,
      notes: h.notes || '',
      notes_es: h.notes_es || '',
    });
    setError('');
    // Smooth-scroll the form into view so the editor doesn't have to scroll up
    // manually after clicking Edit on a holiday far down the list.
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Focus the name field so they can immediately start typing
      setTimeout(() => nameInputRef.current?.focus({ preventScroll: true }), 350);
    });
  };

  const resetForm = () => {
    setForm(EMPTY);
    setError('');
  };

  const handleSave = async () => {
    if (!form.start_date || !form.name.trim()) {
      setError('Start date and name are required.');
      return;
    }
    if (form.end_date && form.end_date < form.start_date) {
      setError('End date must be on or after start date.');
      return;
    }
    setSaving(true);
    setError('');
    setSaved(false);

    const payload = {
      restaurant_id: form.restaurant_id || null,
      start_date: form.start_date,
      end_date: form.end_date || form.start_date,
      name: form.name,
      name_es: form.name_es,
      type: form.type,
      notes: form.notes,
      notes_es: form.notes_es,
    };

    try {
      const url = form.id ? `/api/holidays?id=${form.id}` : '/api/holidays';
      const method = form.id ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save');
      } else {
        setSaved(true);
        resetForm();
        await load();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this holiday? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/holidays?id=${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to delete');
        return;
      }
      await load();
    } catch {
      setError('Connection error.');
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const today = new Date().toISOString().split('T')[0];
  // Currently active OR upcoming = end_date >= today
  const upcoming = holidays.filter((h) => h.end_date >= today);
  const past = holidays.filter((h) => h.end_date < today);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 to-rose-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">📅</span>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Upcoming Holidays and Events</h3>
            <p className="text-[11px] text-gray-500">
              Closures (we shut), all-hands days (busiest days, no PTO).
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Form */}
        <div ref={formRef} className={`space-y-3 border rounded-xl p-4 transition-all ${
          form.id
            ? 'bg-amber-50/60 border-amber-200 ring-2 ring-amber-200/40'
            : 'bg-gray-50 border-gray-100'
        }`}>
          <p className={`text-xs font-bold uppercase tracking-wide ${
            form.id ? 'text-amber-800' : 'text-gray-600'
          }`}>
            {form.id ? `✏️ Editing: ${form.name || 'Holiday'}` : '➕ Add Holiday'}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => {
                  const newStart = e.target.value;
                  // Auto-bump end_date if it's now before start_date
                  setForm({
                    ...form,
                    start_date: newStart,
                    end_date: form.end_date < newStart ? newStart : form.end_date,
                  });
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">End Date</label>
              <input
                type="date"
                value={form.end_date}
                min={form.start_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                {form.start_date === form.end_date
                  ? 'Single day'
                  : `Multi-day (${Math.round((new Date(form.end_date + 'T00:00:00').getTime() - new Date(form.start_date + 'T00:00:00').getTime()) / 86400000) + 1} days)`}
              </p>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as FormState['type'] })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="closed">🌿 Closed — rest with family</option>
              <option value="slow">🌤️ Slower than usual</option>
              <option value="normal">📅 Mark your calendar</option>
              <option value="busy">⚡ Heads up — busier than usual</option>
              <option value="all_hands">🔥 All hands on deck</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Restaurant</label>
            <select
              value={form.restaurant_id}
              onChange={(e) => setForm({ ...form, restaurant_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">All locations (company-wide)</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Name (English)</label>
              <input
                ref={nameInputRef}
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Mother's Day"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Name (Spanish)</label>
              <input
                type="text"
                value={form.name_es}
                onChange={(e) => setForm({ ...form, name_es: e.target.value })}
                placeholder="Día de las Madres"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Notes (English)</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Optional context for staff"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Notes (Spanish)</label>
              <textarea
                value={form.notes_es}
                onChange={(e) => setForm({ ...form, notes_es: e.target.value })}
                rows={2}
                placeholder="Notas opcionales"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}
          {saved && (
            <div className="bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-2.5 rounded-xl">
              Holiday saved.
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm"
            >
              {saving ? 'Saving...' : form.id ? 'Update Holiday' : 'Add Holiday'}
            </button>
            {form.id && (
              <button
                onClick={resetForm}
                className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm font-semibold"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Upcoming list */}
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
        ) : (
          <>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                Upcoming ({upcoming.length})
              </p>
              {upcoming.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">No upcoming holidays.</p>
              ) : (
                <div className="space-y-2">
                  {upcoming.map((h) => (
                    <HolidayRow key={h.id} h={h} onEdit={startEdit} onDelete={handleDelete} formatDate={formatDate} />
                  ))}
                </div>
              )}
            </div>

            {past.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                  Past ({past.length})
                </p>
                <div className="space-y-2 opacity-50">
                  {past.slice(0, 5).map((h) => (
                    <HolidayRow key={h.id} h={h} onEdit={startEdit} onDelete={handleDelete} formatDate={formatDate} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function HolidayRow({
  h,
  onEdit,
  onDelete,
  formatDate,
}: {
  h: Holiday;
  onEdit: (h: Holiday) => void;
  onDelete: (id: string) => void;
  formatDate: (iso: string) => string;
}) {
  const style = getHolidayStyle(h.type);
  return (
    <div className={`flex items-start gap-3 p-3 border rounded-lg ${style.bgClass} ${style.borderClass.replace('border-', 'border-')}/40`}>
      <span className="text-base" aria-hidden>{style.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${style.textClass}`}>{h.name}</p>
        <p className={`text-[11px] ${style.subTextClass}`}>
          {h.start_date === h.end_date
            ? formatDate(h.start_date)
            : `${formatDate(h.start_date)} – ${formatDate(h.end_date)}`}
          {' · '}
          {h.restaurants?.name || 'All locations'}
          {' · '}
          {style.shortEn}
        </p>
        {h.notes && <p className="text-xs text-gray-600 mt-1">{h.notes}</p>}
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onEdit(h)}
          className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(h.id)}
          className="text-xs text-gray-400 hover:text-red-500 px-2 py-1"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
