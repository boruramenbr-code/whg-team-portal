'use client';

import { useEffect, useMemo, useState } from 'react';

type Status = 'all_signed' | 'behind' | 'overdue' | 'not_required';

interface MissingPolicy {
  policy_id: string;
  title: string;
  effective_date: string;
  days_outstanding: number;
  needs_resign: boolean;
}

interface EmployeeCompliance {
  user_id: string;
  full_name: string;
  role: string;
  restaurant_id: string;
  restaurant_name: string | null;
  total_required: number;
  signed_count: number;
  missing_count: number;
  oldest_unsigned_days: number | null;
  status: Status;
  missing: MissingPolicy[];
}

interface Summary {
  total_employees: number;
  all_signed: number;
  behind: number;
  overdue: number;
  not_required: number;
  overdue_after_days: number;
}

interface ComplianceResponse {
  employees: EmployeeCompliance[];
  summary: Summary;
  viewer: { is_admin: boolean; restaurant_id: string };
}

type Filter = 'all' | 'overdue' | 'behind' | 'all_signed';

export default function ComplianceTab() {
  const [data, setData] = useState<ComplianceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<EmployeeCompliance | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/compliance');
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Request failed (${res.status})`);
        }
        const json: ComplianceResponse = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.employees.filter((e) => {
      if (filter === 'overdue' && e.status !== 'overdue') return false;
      if (filter === 'behind' && e.status !== 'behind') return false;
      if (filter === 'all_signed' && e.status !== 'all_signed') return false;
      // 'all' also hides not_required (noise)
      if (filter === 'all' && e.status === 'not_required') return false;
      if (q && !e.full_name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, filter, search]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
        Loading compliance…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <p className="text-sm text-red-600 font-semibold">Couldn&apos;t load compliance</p>
          <p className="text-xs text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, viewer } = data;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#E8EEF4] to-[#F0F4F9]">
      {/* Header + summary */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex-shrink-0">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-lg font-bold text-[#1B3A6B]">Compliance</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {viewer.is_admin
                  ? 'All locations'
                  : 'Your location'} · Overdue after {summary.overdue_after_days} days
              </p>
            </div>
          </div>

          {/* Summary chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            <SummaryChip
              label="Overdue"
              value={summary.overdue}
              tone="red"
              active={filter === 'overdue'}
              onClick={() => setFilter(filter === 'overdue' ? 'all' : 'overdue')}
            />
            <SummaryChip
              label="Behind"
              value={summary.behind}
              tone="amber"
              active={filter === 'behind'}
              onClick={() => setFilter(filter === 'behind' ? 'all' : 'behind')}
            />
            <SummaryChip
              label="All signed"
              value={summary.all_signed}
              tone="green"
              active={filter === 'all_signed'}
              onClick={() => setFilter(filter === 'all_signed' ? 'all' : 'all_signed')}
            />
            <SummaryChip
              label="Total"
              value={summary.total_employees}
              tone="slate"
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            />
          </div>

          {/* Search */}
          <div className="mt-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="w-full md:max-w-sm px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86C1] bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Employee list */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-500">
              No employees match this view.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {filtered.map((e, idx) => (
                <button
                  key={e.user_id}
                  onClick={() => setSelected(e)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    idx !== filtered.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-[#1B3A6B] truncate">{e.full_name}</span>
                      <StatusChip status={e.status} />
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {e.role}
                      {viewer.is_admin && e.restaurant_name ? ` · ${e.restaurant_name}` : ''}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-semibold text-gray-700">
                      {e.signed_count}/{e.total_required}
                    </div>
                    {e.oldest_unsigned_days !== null && (
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {e.oldest_unsigned_days}d outstanding
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drill-in modal */}
      {selected && (
        <EmployeeDetailModal employee={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function SummaryChip({
  label,
  value,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  tone: 'red' | 'amber' | 'green' | 'slate';
  active: boolean;
  onClick: () => void;
}) {
  const tones: Record<typeof tone, { active: string; idle: string }> = {
    red:   { active: 'bg-red-600 text-white',    idle: 'bg-red-50 text-red-700 border-red-200' },
    amber: { active: 'bg-amber-600 text-white',  idle: 'bg-amber-50 text-amber-700 border-amber-200' },
    green: { active: 'bg-emerald-600 text-white',idle: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    slate: { active: 'bg-[#1B3A6B] text-white',  idle: 'bg-white text-gray-700 border-gray-200' },
  };
  const cls = active ? tones[tone].active : tones[tone].idle;
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-bold border ${active ? 'border-transparent' : ''} ${cls} transition-colors`}
    >
      {label} · {value}
    </button>
  );
}

function StatusChip({ status }: { status: Status }) {
  if (status === 'overdue') {
    return <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">Overdue</span>;
  }
  if (status === 'behind') {
    return <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Behind</span>;
  }
  if (status === 'all_signed') {
    return <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">All signed</span>;
  }
  return <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">N/A</span>;
}

function EmployeeDetailModal({
  employee,
  onClose,
}: {
  employee: EmployeeCompliance;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col pointer-events-auto">
          <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3 flex-shrink-0">
            <div>
              <h3 className="font-bold text-[#1B3A6B]">{employee.full_name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {employee.role}
                {employee.restaurant_name ? ` · ${employee.restaurant_name}` : ''}
              </p>
              <p className="text-xs text-gray-600 mt-1.5 font-semibold">
                Signed {employee.signed_count} of {employee.total_required} policies
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none font-light -mt-1">×</button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {employee.missing.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm font-semibold text-emerald-700">All required policies signed ✓</p>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Unsigned ({employee.missing.length})
                </p>
                <ul className="space-y-2">
                  {employee.missing.map((m) => (
                    <li key={m.policy_id} className="border border-gray-200 rounded-lg px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-800 truncate">{m.title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Effective {m.effective_date} · {m.days_outstanding}d outstanding
                          </p>
                        </div>
                        {m.needs_resign && (
                          <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            Re-sign
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="px-5 py-3 border-t border-gray-100 flex justify-end flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
