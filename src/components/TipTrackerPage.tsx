'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { todayInCentralTime, dateInCentralTime } from '@/lib/dates';

/**
 * TipTrackerPage — private per-employee tip tracker.
 *
 * Privacy contract: every read/write uses the request-bound supabase
 * client. Postgres RLS enforces owner-only access at the database level.
 * Nothing rendered here ever shows up in admin views.
 *
 * UI structure:
 *   • Summary cards (week, month, last 30 days)
 *   • Big "+ Add tonight's tips" CTA
 *   • Reverse-chronological list of recent shifts
 *   • Tap a row → edit modal
 *   • Trash icon in edit modal → delete with confirm
 */

type ShiftType = 'lunch' | 'mid' | 'dinner' | 'other';

interface TipEntry {
  id: string;
  shift_date: string; // YYYY-MM-DD
  shift_type: ShiftType;
  cash_tips: number | string; // Postgres numeric comes back as string sometimes
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const SHIFT_LABEL: Record<ShiftType, string> = {
  lunch: 'Lunch',
  mid: 'Mid',
  dinner: 'Dinner',
  other: 'Other',
};

const SHIFT_EMOJI: Record<ShiftType, string> = {
  lunch: '🥢',
  mid: '☕',
  dinner: '🌙',
  other: '⏱️',
};

interface Props {
  onClose: () => void;
}

export default function TipTrackerPage({ onClose }: Props) {
  const [entries, setEntries] = useState<TipEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TipEntry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tips', { cache: 'no-store' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to load tips');
      }
      const j = await res.json();
      setEntries(j.entries ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tips');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Summary calculations (Central Time aware) ──
  const summaries = useMemo(() => {
    const today = todayInCentralTime();
    const weekAgo = dateInCentralTime(-6); // includes today + 6 prior = 7-day window
    const monthAgo = dateInCentralTime(-29); // 30-day window
    const monthStart = today.slice(0, 7) + '-01'; // YYYY-MM-01 for "this calendar month"

    let week = 0, weekCount = 0;
    let month = 0, monthCount = 0;
    let rolling30 = 0, rolling30Count = 0;

    for (const e of entries) {
      const amount = Number(e.cash_tips) || 0;
      if (e.shift_date >= monthStart) { month += amount; monthCount++; }
      if (e.shift_date >= weekAgo) { week += amount; weekCount++; }
      if (e.shift_date >= monthAgo) { rolling30 += amount; rolling30Count++; }
    }

    return {
      week: { total: week, count: weekCount, avg: weekCount ? week / weekCount : 0 },
      month: { total: month, count: monthCount, avg: monthCount ? month / monthCount : 0 },
      rolling30: { total: rolling30, count: rolling30Count, avg: rolling30Count ? rolling30 / rolling30Count : 0 },
    };
  }, [entries]);

  return (
    <div className="fixed inset-0 z-40 bg-gradient-to-b from-[#C5D3E2] via-[#CDDAE7] to-[#D5E0EB] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-sm font-semibold text-[#1B3A6B] hover:text-[#2C4F8A]"
        >
          ← Back
        </button>
        <h1 className="text-base font-bold text-[#1B3A6B] flex items-center gap-1.5">
          <span>💰</span> My Tips
        </h1>
        <div className="w-12" />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Privacy banner */}
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl px-3 py-2">
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              🔒 <strong>Private to you.</strong> Only you can see and edit your tip entries. Owners, managers, and admins do NOT have access.
            </p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-2">
            <SummaryCard label="This Week" {...summaries.week} />
            <SummaryCard label="This Month" {...summaries.month} />
            <SummaryCard label="Last 30 Days" {...summaries.rolling30} />
          </div>

          {/* Add CTA */}
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="w-full bg-[#1B3A6B] hover:bg-[#2C4F8A] text-white font-bold py-4 rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2 text-base"
          >
            <span className="text-lg">＋</span> Add tonight&rsquo;s tips
          </button>

          {/* Recent shifts list */}
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 mt-4">
              Recent Shifts
            </h2>
            {loading ? (
              <div className="bg-white rounded-2xl shadow-sm p-6 text-center text-sm text-gray-400">Loading…</div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">{error}</div>
            ) : entries.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <div className="text-4xl mb-2">💰</div>
                <p className="text-sm font-semibold text-gray-700">No tip entries yet.</p>
                <p className="text-xs text-gray-500 mt-1">Tap the button above to log tonight&rsquo;s tips.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((e) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    onTap={() => { setEditing(e); setShowForm(true); }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add / edit modal */}
      {showForm && (
        <TipEntryForm
          entry={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); load(); }}
          onDeleted={() => { setShowForm(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

/* ───────── Summary card ───────── */
function SummaryCard({ label, total, count, avg }: { label: string; total: number; count: number; avg: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-3 text-center">
      <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1">{label}</p>
      <p className="text-lg md:text-xl font-bold text-[#1B3A6B] leading-tight">${total.toFixed(0)}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">
        {count} shift{count === 1 ? '' : 's'} {count > 0 && `· $${avg.toFixed(0)}/shift`}
      </p>
    </div>
  );
}

/* ───────── Entry row ───────── */
function EntryRow({ entry, onTap }: { entry: TipEntry; onTap: () => void }) {
  const amount = Number(entry.cash_tips) || 0;
  const dt = new Date(entry.shift_date + 'T00:00:00');
  const dateLabel = dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <button
      onClick={onTap}
      className="w-full bg-white rounded-xl shadow-sm hover:shadow-md hover:border-[#1B3A6B] transition-all border border-transparent px-4 py-3 flex items-center gap-3 text-left"
    >
      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-base flex-shrink-0" aria-hidden>
        {SHIFT_EMOJI[entry.shift_type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {dateLabel} <span className="text-gray-400">·</span> {SHIFT_LABEL[entry.shift_type]}
        </p>
        {entry.notes && (
          <p className="text-[11px] text-gray-500 truncate">{entry.notes}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-base font-bold text-[#1B3A6B]">${amount.toFixed(2)}</p>
      </div>
    </button>
  );
}

/* ───────── Add / Edit modal ───────── */
function TipEntryForm({
  entry,
  onClose,
  onSaved,
  onDeleted,
}: {
  entry: TipEntry | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const isEdit = !!entry;
  const [shiftDate, setShiftDate] = useState(entry?.shift_date || todayInCentralTime());
  const [shiftType, setShiftType] = useState<ShiftType>(entry?.shift_type || 'dinner');
  const [cashTips, setCashTips] = useState<string>(
    entry ? String(Number(entry.cash_tips).toFixed(2)) : ''
  );
  const [notes, setNotes] = useState(entry?.notes || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave() {
    setErr(null);
    const amount = parseFloat(cashTips);
    if (!Number.isFinite(amount) || amount < 0) {
      setErr('Enter a valid cash amount.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        shift_date: shiftDate,
        shift_type: shiftType,
        cash_tips: amount,
        notes: notes.trim() || null,
      };
      const url = isEdit ? `/api/tips/${entry!.id}` : '/api/tips';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed to save');
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!entry) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tips/${entry.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to delete');
      }
      onDeleted();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-md flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1B3A6B]">{isEdit ? 'Edit shift' : 'Add tonight’s tips'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">×</button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Date</label>
            <input
              type="date"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              max={todayInCentralTime()}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1] bg-white"
            />
          </div>

          {/* Shift pills */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Shift</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['lunch', 'mid', 'dinner', 'other'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setShiftType(s)}
                  className={`px-2 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                    shiftType === s
                      ? 'bg-[#1B3A6B] border-[#1B3A6B] text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-base block leading-none mb-0.5" aria-hidden>{SHIFT_EMOJI[s]}</span>
                  <span>{SHIFT_LABEL[s]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cash amount */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Cash Tips</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={cashTips}
                onChange={(e) => setCashTips(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl text-2xl font-bold text-[#1B3A6B] focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
                autoFocus
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
              Notes <span className="text-gray-300 font-normal normal-case">(optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Big party at 8, slow Tuesday…"
              maxLength={200}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
            />
          </div>

          {err && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-2.5 rounded-lg">{err}</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
          {isEdit && (
            confirmDelete ? (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-2.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Tap again to delete'}
              </button>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-2.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                🗑️ Delete
              </button>
            )
          )}
          <button
            onClick={handleSave}
            disabled={saving || !cashTips}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-bold bg-[#1B3A6B] text-white hover:bg-[#2C4F8A] shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
