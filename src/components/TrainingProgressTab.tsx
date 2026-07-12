'use client';

import { useEffect, useState, useCallback } from 'react';
import type { PathTrack, PathModule } from './TrainingPathTab';

/* ───────── Manager view: Training Progress ─────────
 * Staff list → tap a person → their full ladder with sign-off buttons
 * on manager-completion skills. This is where "can actually carry a
 * tray" gets verified by a human.
 */

interface StaffRow {
  id: string;
  full_name: string;
  position_slug: string | null;
  onboarding_category: string | null;
  role: string;
  restaurant_name: string | null;
}

export default function TrainingProgressTab() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StaffRow | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/training/path/users');
        if (!r.ok) return;
        const j = await r.json();
        setStaff(j.staff || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = q ? staff.filter((s) => s.full_name.toLowerCase().includes(q)) : staff;

  if (selected) {
    return <PersonPath person={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <h1 className="text-xl md:text-2xl font-bold text-[#1B3A6B]">Training Progress</h1>
      <p className="text-xs md:text-sm text-gray-500 mt-0.5 mb-4">
        Tap a person to see their ladder and sign off hands-on skills.
      </p>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Find a teammate…"
        className="w-full mb-4 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
      />

      {loading ? (
        <div className="text-center py-12 text-sm text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white/60 rounded-2xl border border-white/40 text-sm text-gray-500">
          No one found.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#1B3A6B]/10 text-[#1B3A6B] font-bold text-xs flex items-center justify-center">
                {s.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate">{s.full_name}</p>
                <p className="text-[11px] text-gray-400 truncate">
                  {[s.position_slug?.replace(/_/g, ' '), s.restaurant_name].filter(Boolean).join(' · ') || 'No position set'}
                </p>
              </div>
              <span className="text-gray-300 flex-shrink-0">›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────── One person's ladder with sign-off controls ───────── */
function PersonPath({ person, onBack }: { person: StaffRow; onBack: () => void }) {
  const [tracks, setTracks] = useState<PathTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/training/path?user_id=${person.id}`);
      if (!r.ok) {
        setError('Failed to load this person’s path.');
        return;
      }
      const j = await r.json();
      setTracks(j.tracks || []);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [person.id]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (m: PathModule) => {
    setBusy(m.id);
    setError(null);
    try {
      const r = await fetch('/api/training/path', {
        method: m.done ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: m.id, user_id: person.id }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error || 'Update failed.');
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  };

  const totalReq = tracks.reduce((n, t) => n + t.required_total, 0);
  const totalDone = tracks.reduce((n, t) => n + t.required_done, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <button onClick={onBack} className="text-sm text-[#1B3A6B] hover:underline mb-3 flex items-center gap-1">
        ← All staff
      </button>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1B3A6B]">{person.full_name}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {[person.position_slug?.replace(/_/g, ' '), person.restaurant_name].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-2xl font-bold text-[#1B3A6B]">
            {totalReq === 0 ? '—' : `${Math.round((totalDone / totalReq) * 100)}%`}
          </p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">{totalDone}/{totalReq} required</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-sm text-gray-400">Loading…</div>
      ) : (
        <div className="space-y-3">
          {tracks.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <span aria-hidden>{t.emoji || '🎯'}</span>
                <p className="text-sm font-bold text-[#1B3A6B] flex-1 truncate">{t.title}</p>
                <span className="text-[10px] font-bold text-gray-400">{t.required_done}/{t.required_total}</span>
              </div>
              {t.modules.length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400">No modules yet.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {t.modules.map((m) => (
                    <div key={m.id} className="px-4 py-2.5 flex items-center gap-3">
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        m.done ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                      }`} aria-hidden>
                        {m.done ? '✓' : '·'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${m.done ? 'text-gray-400' : 'text-gray-800'}`}>
                          {m.title}
                          {!m.required && <span className="ml-1.5 text-[9px] uppercase font-bold text-gray-400">optional</span>}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {m.completion === 'manager' ? 'Manager sign-off' : m.completion === 'exam' ? 'Exam' : 'Self check'}
                          {m.done && m.signed_off ? ' · signed off' : ''}
                        </p>
                      </div>
                      {m.completion === 'manager' && (
                        <button
                          onClick={() => toggle(m)}
                          disabled={busy === m.id}
                          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-40 ${
                            m.done
                              ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {busy === m.id ? '…' : m.done ? 'Undo' : 'Sign off'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
