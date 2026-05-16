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

/** Per-shift color palette — keyed for instant visual scanning of the
 *  history list and the shift selector pills. Lunch is warm amber,
 *  Mid is a cool cyan between, Dinner is evening indigo, Other is neutral. */
const SHIFT_COLOR: Record<ShiftType, {
  stripe: string;     // left-edge bar background
  avatarBg: string;   // emoji circle background
  avatarText: string; // emoji color (mostly emoji's own color but used for text fallback)
  pillActive: string; // active state for the shift selector pills
  pillBorder: string; // border tint of active pill
  badge: string;      // small shift label chip in the row
}> = {
  lunch: {
    stripe: 'bg-amber-400',
    avatarBg: 'bg-amber-50',
    avatarText: 'text-amber-700',
    pillActive: 'bg-amber-500 text-white',
    pillBorder: 'border-amber-500',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  mid: {
    stripe: 'bg-cyan-400',
    avatarBg: 'bg-cyan-50',
    avatarText: 'text-cyan-700',
    pillActive: 'bg-cyan-500 text-white',
    pillBorder: 'border-cyan-500',
    badge: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  },
  dinner: {
    stripe: 'bg-indigo-500',
    avatarBg: 'bg-indigo-50',
    avatarText: 'text-indigo-700',
    pillActive: 'bg-indigo-600 text-white',
    pillBorder: 'border-indigo-600',
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  other: {
    stripe: 'bg-gray-300',
    avatarBg: 'bg-gray-100',
    avatarText: 'text-gray-700',
    pillActive: 'bg-gray-700 text-white',
    pillBorder: 'border-gray-700',
    badge: 'bg-gray-100 text-gray-700 border-gray-200',
  },
};

interface Props {
  onClose: () => void;
}

/** Returns "YYYY-MM" for today in Central Time. */
function currentYearMonth(): string {
  return todayInCentralTime().slice(0, 7);
}

/** Increment / decrement a YYYY-MM string by N months. */
function shiftYearMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Pretty month name from YYYY-MM. */
function formatYearMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function TipTrackerPage({ onClose }: Props) {
  const [entries, setEntries] = useState<TipEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TipEntry | null>(null);
  // Month being viewed (YYYY-MM). Default = current month.
  const [viewedMonth, setViewedMonth] = useState<string>(() => currentYearMonth());
  const isCurrentMonth = viewedMonth === currentYearMonth();
  // Chart view options — each one mirrors a summary card so users can
  // see what's behind the headline number:
  //   • 'week'      = last 7 days rolling      (matches "This Week" card)
  //   • 'rolling30' = last 30 days rolling     (matches "Last 30 Days" card)
  //   • 'month'     = all days in viewed month (matches "This Month" card)
  // Past months always render 'month' (the other two are relative-to-today).
  const [chartMode, setChartMode] = useState<'week' | 'rolling30' | 'month'>('week');

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

  // ── Summary + filtering calculations (Central Time aware) ──
  const summaries = useMemo(() => {
    const today = todayInCentralTime();
    const weekAgo = dateInCentralTime(-6); // 7-day window inclusive of today
    const monthAgo = dateInCentralTime(-29); // 30-day rolling

    let week = 0, weekCount = 0;
    let rolling30 = 0, rolling30Count = 0;
    let viewedMonthTotal = 0, viewedMonthCount = 0;
    let allTime = 0, allTimeCount = 0;
    // Per-day stacked totals for the 7-day chart (last 7 days, today inclusive).
    const sevenDay: Record<string, Record<ShiftType, number>> = {};
    const sevenDayList: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = dateInCentralTime(-i);
      sevenDay[d] = { lunch: 0, mid: 0, dinner: 0, other: 0 };
      sevenDayList.push(d);
    }

    // Per-day stacked totals for the rolling 30-day chart.
    const thirtyDay: Record<string, Record<ShiftType, number>> = {};
    const thirtyDayList: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = dateInCentralTime(-i);
      thirtyDay[d] = { lunch: 0, mid: 0, dinner: 0, other: 0 };
      thirtyDayList.push(d);
    }

    // Per-day buckets for the entire viewed month. Sized by the actual
    // number of days in that calendar month so the chart renders a full
    // month even if no entries exist yet.
    const [vy, vm] = viewedMonth.split('-').map(Number);
    const daysInMonth = new Date(Date.UTC(vy, vm, 0)).getUTCDate();
    const monthDays: Record<string, Record<ShiftType, number>> = {};
    const monthDayList: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${viewedMonth}-${String(d).padStart(2, '0')}`;
      monthDays[ds] = { lunch: 0, mid: 0, dinner: 0, other: 0 };
      monthDayList.push(ds);
    }

    const viewedFiltered: TipEntry[] = [];

    for (const e of entries) {
      const amount = Number(e.cash_tips) || 0;
      allTime += amount; allTimeCount++;
      if (e.shift_date >= weekAgo) { week += amount; weekCount++; }
      if (e.shift_date >= monthAgo) { rolling30 += amount; rolling30Count++; }
      if (e.shift_date.startsWith(viewedMonth)) {
        viewedMonthTotal += amount;
        viewedMonthCount++;
        viewedFiltered.push(e);
        if (monthDays[e.shift_date]) {
          monthDays[e.shift_date][e.shift_type] += amount;
        }
      }
      if (sevenDay[e.shift_date]) {
        sevenDay[e.shift_date][e.shift_type] += amount;
      }
      if (thirtyDay[e.shift_date]) {
        thirtyDay[e.shift_date][e.shift_type] += amount;
      }
    }

    return {
      week: { total: week, count: weekCount, avg: weekCount ? week / weekCount : 0 },
      viewedMonth: { total: viewedMonthTotal, count: viewedMonthCount, avg: viewedMonthCount ? viewedMonthTotal / viewedMonthCount : 0 },
      rolling30: { total: rolling30, count: rolling30Count, avg: rolling30Count ? rolling30 / rolling30Count : 0 },
      allTime: { total: allTime, count: allTimeCount },
      sevenDay,
      sevenDayList,
      thirtyDay,
      thirtyDayList,
      monthDays,
      monthDayList,
      viewedEntries: viewedFiltered,
      today,
    };
  }, [entries, viewedMonth]);

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

          {/* Month navigator — arrows to scroll back/forward through history */}
          <div className="bg-white rounded-2xl shadow-sm flex items-center justify-between px-2 py-2">
            <button
              onClick={() => setViewedMonth((m) => shiftYearMonth(m, -1))}
              className="px-3 py-2 text-[#1B3A6B] hover:bg-gray-50 rounded-lg font-bold text-base"
              aria-label="Previous month"
            >
              ←
            </button>
            <div className="text-center min-w-0">
              <div className="text-sm font-bold text-[#1B3A6B] truncate">{formatYearMonth(viewedMonth)}</div>
              {!isCurrentMonth && (
                <button
                  onClick={() => setViewedMonth(currentYearMonth())}
                  className="text-[10px] text-[#2E86C1] hover:underline font-semibold"
                >
                  ↻ Jump to current month
                </button>
              )}
            </div>
            <button
              onClick={() => setViewedMonth((m) => shiftYearMonth(m, 1))}
              disabled={isCurrentMonth}
              className="px-3 py-2 text-[#1B3A6B] hover:bg-gray-50 rounded-lg font-bold text-base disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next month"
            >
              →
            </button>
          </div>

          {/* Summary cards
              • Current month: 3 windows (This Week / This Month / Last 30 Days)
              • Past month:    one big card with that month's total */}
          {isCurrentMonth ? (
            <div className="grid grid-cols-3 gap-2">
              <SummaryCard label="This Week" {...summaries.week} />
              <SummaryCard label="This Month" {...summaries.viewedMonth} />
              <SummaryCard label="Last 30 Days" {...summaries.rolling30} />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">
                {formatYearMonth(viewedMonth)} Total
              </p>
              <p className="text-3xl font-bold text-[#1B3A6B] leading-tight">
                ${summaries.viewedMonth.total.toFixed(2)}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                {summaries.viewedMonth.count} shift{summaries.viewedMonth.count === 1 ? '' : 's'}
                {summaries.viewedMonth.count > 0 && ` · $${summaries.viewedMonth.avg.toFixed(0)}/shift avg`}
              </p>
            </div>
          )}

          {/* Bar chart — each mode mirrors a summary card on current month.
              Past months always render 'month' (only mode that's calendar-anchored). */}
          {isCurrentMonth ? (
            <TipBarChart
              days={
                chartMode === 'week'
                  ? summaries.sevenDayList
                  : chartMode === 'rolling30'
                  ? summaries.thirtyDayList
                  : summaries.monthDayList
              }
              dailyTotals={
                chartMode === 'week'
                  ? summaries.sevenDay
                  : chartMode === 'rolling30'
                  ? summaries.thirtyDay
                  : summaries.monthDays
              }
              today={summaries.today}
              mode={chartMode}
              onChangeMode={setChartMode}
            />
          ) : (
            <TipBarChart
              days={summaries.monthDayList}
              dailyTotals={summaries.monthDays}
              today={summaries.today}
              mode="month"
            />
          )}

          {/* Add CTA — only on current month (can't add to a past month easily) */}
          {isCurrentMonth && (
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="w-full bg-[#1B3A6B] hover:bg-[#2C4F8A] text-white font-bold py-4 rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2 text-base"
            >
              <span className="text-lg">＋</span> Add tonight&rsquo;s tips
            </button>
          )}

          {/* Shift list — scoped to viewed month */}
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 mt-4">
              {isCurrentMonth ? 'This Month’s Shifts' : 'Shifts'}
            </h2>
            {loading ? (
              <div className="bg-white rounded-2xl shadow-sm p-6 text-center text-sm text-gray-400">Loading…</div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">{error}</div>
            ) : summaries.viewedEntries.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <div className="text-4xl mb-2">💰</div>
                <p className="text-sm font-semibold text-gray-700">
                  {isCurrentMonth ? 'No tip entries yet this month.' : 'No tip entries for this month.'}
                </p>
                {isCurrentMonth && (
                  <p className="text-xs text-gray-500 mt-1">Tap the button above to log tonight&rsquo;s tips.</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {summaries.viewedEntries.map((e) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    onTap={() => { setEditing(e); setShowForm(true); }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* All-time total footer */}
          {summaries.allTime.count > 0 && (
            <div className="bg-gradient-to-br from-[#1B3A6B] to-[#2C4F8A] rounded-2xl shadow-md p-4 text-center text-white mt-4">
              <p className="text-[10px] uppercase tracking-widest text-amber-300 font-bold mb-1">All-Time Total</p>
              <p className="text-2xl font-bold leading-tight">${summaries.allTime.total.toFixed(2)}</p>
              <p className="text-[11px] text-white/70 mt-0.5">
                Across {summaries.allTime.count} shift{summaries.allTime.count === 1 ? '' : 's'}
              </p>
            </div>
          )}
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

/* ───────── Bar chart ─────────
 * Stacked bar chart, generalized for both 7-day and full-month views.
 *
 * Pass `days` (ordered date strings) and `dailyTotals` (map of date → shift
 * sums). Mode controls label density:
 *   • 'week'  — every bar has a $ amount above and a 3-letter weekday below.
 *   • 'month' — bars are skinny (no $ labels), with date numbers shown at
 *               regular intervals plus today's date.
 *
 * If `onChangeMode` is passed, a Week / Month toggle renders in the header.
 *
 * Pure CSS flex — no chart library dependency. */
type ChartMode = 'week' | 'rolling30' | 'month';

function TipBarChart({
  days,
  dailyTotals,
  today,
  mode,
  onChangeMode,
}: {
  days: string[];
  dailyTotals: Record<string, Record<ShiftType, number>>;
  today: string;
  mode: ChartMode;
  onChangeMode?: (m: ChartMode) => void;
}) {
  const dayTotals = days.map((d) => {
    const b = dailyTotals[d];
    return b ? b.lunch + b.mid + b.dinner + b.other : 0;
  });
  const max = Math.max(...dayTotals, 0);
  const allZero = max === 0;

  const showAmountLabels = mode === 'week';
  // Dense modes — 30+ bars — get tighter spacing and sparse labels.
  const isDense = mode === 'rolling30' || mode === 'month';

  const headerLabel =
    mode === 'week' ? 'Last 7 Days' :
    mode === 'rolling30' ? 'Last 30 Days' :
    'This Month';

  // For dense modes, only label every 5th day plus today plus the 1st and last.
  function denseLabel(idx: number, d: string): string {
    if (!isDense) return '';
    const dayNum = Number(d.split('-')[2]);
    const isFirst = idx === 0;
    const isLast = idx === days.length - 1;
    if (isFirst || isLast || dayNum % 5 === 0 || d === today) return String(dayNum);
    return '';
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{headerLabel}</h3>
        {onChangeMode && (
          <div className="flex bg-gray-100 rounded-full p-0.5">
            {([
              { id: 'week' as const, label: '7 Days' },
              { id: 'rolling30' as const, label: '30 Days' },
              { id: 'month' as const, label: 'Month' },
            ]).map((opt) => (
              <button
                key={opt.id}
                onClick={() => onChangeMode(opt.id)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                  mode === opt.id ? 'bg-[#1B3A6B] text-white' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 text-[9px] text-gray-500 mb-2">
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Lunch</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" />Mid</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" />Dinner</span>
      </div>

      {allZero ? (
        <div className="text-center text-xs text-gray-400 py-8">
          {mode === 'week'
            ? 'No tips logged in the last 7 days. Add one to start filling in your chart.'
            : mode === 'rolling30'
            ? 'No tips logged in the last 30 days yet.'
            : 'No tips logged this month yet.'}
        </div>
      ) : (
        <div className={`flex items-end justify-between h-36 ${isDense ? 'gap-0.5' : 'gap-1.5'}`}>
          {days.map((d, idx) => {
            const buckets = dailyTotals[d];
            const total = dayTotals[idx];
            const heightPct = max > 0 ? (total / max) * 100 : 0;
            const dt = new Date(d + 'T00:00:00');
            const isToday = d === today;
            const dayLabel = isDense ? denseLabel(idx, d) : dt.toLocaleDateString(undefined, { weekday: 'short' });
            return (
              <div key={d} className="flex-1 flex flex-col items-center min-w-0 gap-1 h-full">
                {/* Amount label above bar — only in week mode (too crowded otherwise) */}
                {showAmountLabels && (
                  <div className="text-[9px] font-bold text-gray-700 leading-none h-3">
                    {total > 0 ? `$${Math.round(total)}` : ''}
                  </div>
                )}
                {/* Bar area */}
                <div className="flex-1 w-full flex items-end">
                  <div
                    className={`w-full ${isDense ? 'rounded-sm' : 'rounded-t'} overflow-hidden flex flex-col-reverse transition-all ${
                      isToday ? 'ring-1 ring-[#1B3A6B]' : ''
                    }`}
                    style={{
                      height: total > 0 ? `${Math.max(heightPct, 4)}%` : 0,
                      minHeight: total > 0 ? (isDense ? 4 : 6) : 0,
                    }}
                  >
                    {buckets?.lunch > 0 && <div className="bg-amber-400" style={{ flex: buckets.lunch }} />}
                    {buckets?.mid > 0 && <div className="bg-cyan-400" style={{ flex: buckets.mid }} />}
                    {buckets?.dinner > 0 && <div className="bg-indigo-500" style={{ flex: buckets.dinner }} />}
                    {buckets?.other > 0 && <div className="bg-gray-300" style={{ flex: buckets.other }} />}
                  </div>
                </div>
                {/* Day label below bar */}
                <div className={`text-[9px] font-semibold leading-none ${isToday ? 'text-[#1B3A6B]' : 'text-gray-500'}`}>
                  {dayLabel || ''}
                </div>
              </div>
            );
          })}
        </div>
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
  const color = SHIFT_COLOR[entry.shift_type];

  return (
    <button
      onClick={onTap}
      className="w-full bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden flex items-stretch text-left"
    >
      {/* Shift color stripe — instant visual cue for which shift this was */}
      <div className={`w-1.5 flex-shrink-0 ${color.stripe}`} />
      <div className="flex-1 flex items-center gap-3 px-4 py-3 min-w-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${color.avatarBg}`} aria-hidden>
          {SHIFT_EMOJI[entry.shift_type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-sm font-semibold text-gray-800 truncate">{dateLabel}</p>
            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${color.badge} shrink-0`}>
              {SHIFT_LABEL[entry.shift_type]}
            </span>
          </div>
          {entry.notes && (
            <p className="text-[11px] text-gray-500 truncate">{entry.notes}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-base font-bold text-[#1B3A6B]">${amount.toFixed(2)}</p>
        </div>
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

          {/* Shift pills — colored to match the history list */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Shift</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['lunch', 'mid', 'dinner', 'other'] as const).map((s) => {
                const color = SHIFT_COLOR[s];
                const active = shiftType === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setShiftType(s)}
                    className={`px-2 py-2 rounded-xl border-2 text-xs font-semibold transition-colors ${
                      active
                        ? `${color.pillActive} ${color.pillBorder} shadow-sm`
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-base block leading-none mb-0.5" aria-hidden>{SHIFT_EMOJI[s]}</span>
                    <span>{SHIFT_LABEL[s]}</span>
                  </button>
                );
              })}
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
