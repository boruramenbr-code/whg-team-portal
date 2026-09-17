'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { STAGE_META, type GuideStage, type GuideSummary } from '@/lib/guided-training';
import { buildTrainingStartUrl, copyText } from '@/lib/training-links';

/* ───────── Types (mirror /api/training/new-hires + /api/training/guide) ───────── */
interface HireRow {
  id: string;
  full_name: string;
  role: string;
  restaurant_id: string | null;
  restaurant_name: string | null;
  position_slug: string | null;
  position_name: string | null;
  start_date: string | null;
  assigned: boolean;
  trainer_id: string | null;
  trainer_name: string | null;
  summary: GuideSummary;
  current_title: string;
  ready_for_signoff: boolean;
  quiet_days: number;
  stuck: boolean;
}

interface StaffOption {
  id: string;
  full_name: string;
  role: string;
  restaurant_id: string | null;
  restaurant_name: string | null;
  position_slug: string | null;
}

interface PositionOption {
  slug: string;
  name: string;
  emoji: string | null;
  department: string;
}

interface BoardData {
  hires: HireRow[];
  staff: StaffOption[];
  positions: PositionOption[];
  needs_migration: boolean;
}

interface GuideDetail {
  stages?: GuideStage[];
  summary?: GuideSummary;
  position?: { name: string; emoji: string | null } | null;
  restaurant_name?: string | null;
  assignment?: { trainer_id: string | null; trainer_name: string | null; start_date: string } | null;
  floor_ready: {
    ready: boolean;
    ready_for_signoff: boolean;
    via: 'signed_off' | 'override' | null;
    override: { granted_by_name: string | null; note: string | null; created_at: string } | null;
  };
}

const initials = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
const fmtDate = (iso: string | null) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
const today = () => new Date().toLocaleDateString('en-CA');

const field = 'w-full rounded-lg border border-whg-line bg-whg-card px-3 py-2.5 text-base md:text-sm text-whg-snow focus:outline-none focus:border-whg-gold focus:ring-1 focus:ring-whg-gold/30';
const label = 'block text-[10px] font-bold uppercase tracking-wide text-whg-dim mb-1.5';
const goldButton = 'tap-highlight px-4 py-2.5 rounded-xl bg-whg-gold text-whg-goldink text-sm font-bold hover:bg-whg-gold2 transition-colors disabled:opacity-40';
const quietButton = 'tap-highlight px-4 py-2.5 rounded-xl bg-white/10 text-whg-snow/90 text-sm font-semibold hover:bg-white/20 transition-colors disabled:opacity-40';

/* ───────── Mission Control → Training → 🧭 New Hires ─────────
 *
 * The manager's side of guided training. Start training for a new hire
 * (position + trainer + start date), see where everyone is, spot who's
 * stuck, and give the final floor-ready sign-off. Built for the hiring
 * desk on a computer; works on a phone too.
 */
export default function NewHiresTab({
  viewRestaurantId = null,
  onAddPerson,
}: {
  viewRestaurantId?: string | null;
  /** Jump to People → Staff to create someone who isn't in the app yet. */
  onAddPerson?: () => void;
}) {
  const [data, setData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showStart, setShowStart] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const url = viewRestaurantId
        ? `/api/training/new-hires?restaurant_id=${encodeURIComponent(viewRestaurantId)}`
        : '/api/training/new-hires';
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) {
        setError('Couldn’t load new hires. Try refreshing.');
        return;
      }
      setData(await r.json());
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [viewRestaurantId]);

  useEffect(() => { load(); }, [load]);

  const copyStartLink = async () => {
    if (await copyText(buildTrainingStartUrl())) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const selected = data?.hires.find((h) => h.id === selectedId) ?? null;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="rounded-3xl bg-gradient-to-b from-whg-night via-[#101B2E] to-whg-night2 p-4 md:p-6 text-whg-snow">
        {selected && data ? (
          <HireDetail
            hire={selected}
            staff={data.staff}
            onBack={() => { setSelectedId(null); load(); }}
            onChanged={load}
          />
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold">🧭 New hires in training</h1>
                <p className="text-sm text-whg-dim mt-1 max-w-2xl">
                  Set their position and trainer here. They follow the steps in the app, their trainer marks each shadow shift, and you give the final floor-ready sign-off.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 flex-shrink-0">
                <button onClick={() => setShowStart(true)} disabled={!data || data.needs_migration} className={goldButton}>
                  + Start training
                </button>
                <button onClick={copyStartLink} className={quietButton}>
                  {copied ? '✓ Link copied' : '🔗 Day-one link'}
                </button>
              </div>
            </div>

            <p className="mt-3 text-xs text-whg-dim bg-white/5 border border-whg-line rounded-xl px-3 py-2">
              <span className="font-bold text-whg-snow/90">Day one:</span> sit with them for 10 minutes. Have them sign in on this computer or their phone and open <span className="font-semibold text-whg-snow/90">Training → My Path</span> — or text them the day-one link. The app walks them from there.
            </p>

            {data?.needs_migration && (
              <p className="mt-3 text-xs text-amber-200 bg-amber-400/10 border border-amber-400/30 rounded-xl px-3 py-2">
                Training setup needs database update 081 before you can assign trainers.
              </p>
            )}
            {error && (
              <p className="mt-3 text-xs text-red-200 bg-red-400/10 border border-red-400/30 rounded-xl px-3 py-2">{error}</p>
            )}

            <div className="mt-5">
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />)}
                </div>
              ) : !data || data.hires.length === 0 ? (
                <div className="text-center py-10 rounded-2xl border border-whg-line bg-white/5">
                  <div className="text-4xl mb-2">🧭</div>
                  <p className="text-sm font-semibold">No one is in training right now</p>
                  <p className="text-xs text-whg-dim mt-1">Hired someone? Start their training and they’ll get a step-by-step path in the app.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="hidden md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.5fr)_minmax(0,1fr)_150px] gap-4 px-4 text-[10px] font-bold uppercase tracking-widest text-whg-dim">
                    <span>New hire</span><span>Where they are</span><span>Trainer</span><span className="text-right">Status</span>
                  </div>
                  {data.hires.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => setSelectedId(h.id)}
                      className="tap-highlight w-full text-left rounded-2xl border border-whg-line bg-whg-card hover:bg-whg-card2 transition-colors px-4 py-3 md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.5fr)_minmax(0,1fr)_150px] md:gap-4 md:items-center"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-whg-gold/15 text-whg-gold font-bold text-xs flex items-center justify-center">
                          {initials(h.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{h.full_name}</p>
                          <p className="text-[11px] text-whg-dim truncate">
                            {[h.position_name ?? 'No position set', h.restaurant_name, h.start_date ? `started ${fmtDate(h.start_date)}` : null].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 md:mt-0 min-w-0">
                        <p className="text-xs font-semibold truncate">
                          {h.summary.complete ? 'All stages done' : `Step ${h.summary.step} of ${h.summary.of} · ${h.current_title}`}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-whg-gold" style={{ width: `${h.summary.pct}%` }} />
                          </div>
                          <span className="text-[10px] text-whg-dim">{h.summary.done}/{h.summary.total}</span>
                        </div>
                      </div>
                      <p className={`mt-2 md:mt-0 text-xs truncate ${h.trainer_name ? 'text-whg-snow/90' : 'text-amber-200'}`}>
                        {h.trainer_name ? `🤝 ${h.trainer_name}` : 'No trainer yet'}
                      </p>
                      <div className="mt-2 md:mt-0 md:text-right">
                        {h.ready_for_signoff ? (
                          <span className="inline-block rounded-full bg-emerald-400/15 border border-emerald-400/40 px-2.5 py-1 text-[10px] font-bold text-emerald-200">✍️ Ready for sign-off</span>
                        ) : h.stuck ? (
                          <span className="inline-block rounded-full bg-amber-400/10 border border-amber-400/40 px-2.5 py-1 text-[10px] font-bold text-amber-200">Stuck {h.quiet_days} days</span>
                        ) : !h.assigned ? (
                          <span className="inline-block rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-whg-dim">Not set up</span>
                        ) : (
                          <span className="inline-block rounded-full bg-sky-400/10 border border-sky-400/30 px-2.5 py-1 text-[10px] font-bold text-sky-200">On track</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showStart && data && (
        <StartTrainingSheet
          data={data}
          onAddPerson={onAddPerson}
          onClose={() => setShowStart(false)}
          onStarted={async (userId) => {
            setShowStart(false);
            await load();
            setSelectedId(userId);
          }}
        />
      )}
    </div>
  );
}

/* ───────── Start training form ───────── */
function StartTrainingSheet({
  data, onClose, onStarted, onAddPerson,
}: {
  data: BoardData;
  onClose: () => void;
  onStarted: (userId: string) => void;
  onAddPerson?: () => void;
}) {
  const [search, setSearch] = useState('');
  const [personId, setPersonId] = useState('');
  const [positionSlug, setPositionSlug] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [startDate, setStartDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const person = data.staff.find((s) => s.id === personId) ?? null;
  const q = search.trim().toLowerCase();
  const matches = useMemo(
    () => (q ? data.staff.filter((s) => s.full_name.toLowerCase().includes(q)) : data.staff).slice(0, 8),
    [data.staff, q]
  );
  const trainers = data.staff.filter((s) => s.id !== personId && (!person || s.restaurant_id === person.restaurant_id));
  const departments = ['FOH', 'BOH', 'Management'];

  const pick = (s: StaffOption) => {
    setPersonId(s.id);
    setSearch(s.full_name);
    setPositionSlug(s.position_slug ?? '');
    setTrainerId('');
  };

  const save = async () => {
    if (!personId) { setError('Pick the new hire first.'); return; }
    if (!positionSlug) { setError('Pick their position — it decides what they train on.'); return; }
    setSaving(true);
    setError(null);
    try {
      const r = await fetch('/api/training/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: personId,
          position_slug: positionSlug,
          trainer_id: trainerId || null,
          start_date: startDate,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error || 'That didn’t save. Try again.');
        return;
      }
      onStarted(personId);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl md:rounded-3xl bg-whg-night border border-whg-line text-whg-snow shadow-2xl animate-sheet-up">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-whg-night border-b border-whg-line px-5 py-4">
          <h2 className="text-base font-bold">Start training</h2>
          <button onClick={onClose} aria-label="Close" className="text-whg-dim hover:text-whg-snow text-xl px-2">✕</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className={label}>New hire</label>
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPersonId(''); }}
              placeholder="Type their name"
              className={field}
              autoFocus
            />
            {!personId && (
              <div className="mt-2 rounded-xl border border-whg-line divide-y divide-whg-line overflow-hidden">
                {matches.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-whg-dim">No one by that name.</p>
                ) : matches.map((s) => (
                  <button key={s.id} onClick={() => pick(s)} className="tap-highlight w-full text-left px-3 py-2.5 hover:bg-white/5">
                    <span className="text-sm font-semibold">{s.full_name}</span>
                    <span className="text-[11px] text-whg-dim"> · {s.restaurant_name ?? 'No restaurant'}</span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-[11px] text-whg-dim mt-1.5">
              Not in the app yet?{' '}
              {onAddPerson ? (
                <button onClick={() => { onClose(); onAddPerson(); }} className="text-sky-300 hover:underline">Add them in People → Staff</button>
              ) : 'Add them in People → Staff'}
              {' '}first, then come back.
            </p>
          </div>

          <div>
            <label className={label}>Position</label>
            <select value={positionSlug} onChange={(e) => setPositionSlug(e.target.value)} className={field}>
              <option value="">Pick a position</option>
              {departments.map((d) => (
                <optgroup key={d} label={d}>
                  {data.positions.filter((p) => p.department === d).map((p) => (
                    <option key={p.slug} value={p.slug}>{p.emoji ? `${p.emoji} ` : ''}{p.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-[11px] text-whg-dim mt-1.5">Decides which videos, lessons, and floor steps they get.</p>
          </div>

          <div>
            <label className={label}>Trainer</label>
            <select value={trainerId} onChange={(e) => setTrainerId(e.target.value)} className={field} disabled={!personId}>
              <option value="">Assign later</option>
              {trainers.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
            <p className="text-[11px] text-whg-dim mt-1.5">Their trainer marks each shadow shift done on their own phone.</p>
          </div>

          <div>
            <label className={label}>Start date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={field} />
          </div>

          {error && <p className="text-xs text-red-200 bg-red-400/10 border border-red-400/30 rounded-xl px-3 py-2">{error}</p>}

          <button onClick={save} disabled={saving} className={`${goldButton} w-full`}>
            {saving ? 'Starting…' : 'Start their training'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── One new hire ───────── */
function HireDetail({
  hire, staff, onBack, onChanged,
}: {
  hire: HireRow;
  staff: StaffOption[];
  onBack: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<GuideDetail | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const r = await fetch(`/api/training/guide?user_id=${hire.id}`, { cache: 'no-store' });
    if (!r.ok) {
      setError('Couldn’t load their training.');
      return;
    }
    setDetail(await r.json());
  }, [hire.id]);

  useEffect(() => { load(); }, [load]);

  const run = async (key: string, url: string, method: string, body: unknown) => {
    setBusy(key);
    setError(null);
    try {
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error || 'That didn’t save. Try again.');
        return false;
      }
      await load();
      onChanged();
      return true;
    } finally {
      setBusy(null);
    }
  };

  const currentTrainerId = detail?.assignment?.trainer_id ?? hire.trainer_id ?? null;
  const currentTrainerName = detail?.assignment?.trainer_name ?? hire.trainer_name ?? null;
  const trainers = staff.filter((s) => s.id !== hire.id && s.restaurant_id === hire.restaurant_id);
  // Keep a trainer from another restaurant visible in the picker.
  if (currentTrainerId && currentTrainerName && !trainers.some((s) => s.id === currentTrainerId)) {
    trainers.unshift({ id: currentTrainerId, full_name: currentTrainerName, role: '', restaurant_id: null, restaurant_name: null, position_slug: null });
  }
  const floor = detail?.floor_ready;

  return (
    <div>
      <button onClick={onBack} className="text-sm font-semibold text-whg-gold hover:underline mb-3">← All new hires</button>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 flex-shrink-0 rounded-full bg-whg-gold/15 text-whg-gold font-bold flex items-center justify-center">
            {initials(hire.full_name)}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold truncate">{hire.full_name}</h2>
            <p className="text-xs text-whg-dim">
              {[detail?.position ? `${detail.position.emoji ? `${detail.position.emoji} ` : ''}${detail.position.name}` : hire.position_name, hire.restaurant_name, hire.start_date ? `started ${fmtDate(hire.start_date)}` : null].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div className="md:w-72">
          <label className={label}>Trainer</label>
          <select
            value={currentTrainerId ?? ''}
            onChange={(e) => run('trainer', '/api/training/assignments', 'POST', { user_id: hire.id, trainer_id: e.target.value || null })}
            disabled={busy === 'trainer'}
            className={field}
          >
            <option value="">No trainer yet</option>
            {trainers.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-200 bg-red-400/10 border border-red-400/30 rounded-xl px-3 py-2">{error}</p>}

      {!detail ? (
        <div className="mt-5 grid md:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Final sign-off */}
          <div className={`mt-5 rounded-2xl border p-4 ${
            floor?.ready ? 'border-emerald-400/40 bg-emerald-400/10' : floor?.ready_for_signoff ? 'border-whg-gold/60 bg-whg-gold/10' : 'border-whg-line bg-white/5'
          }`}>
            <p className="text-sm font-bold">
              {floor?.ready
                ? `🎯 Floor-ready — signed off by ${floor.override?.granted_by_name ?? 'a manager'}${floor.via === 'override' ? ' (early, judgment call)' : ''}`
                : floor?.ready_for_signoff
                  ? '✍️ Every step is done — ready for your sign-off'
                  : `Not ready yet — ${detail.summary && !detail.summary.complete ? `step ${detail.summary.step} of ${detail.summary.of}` : 'in progress'}`}
            </p>
            {floor?.override?.note && <p className="text-[11px] text-whg-dim mt-1">“{floor.override.note}”</p>}
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              {!floor?.ready && (
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={floor?.ready_for_signoff ? 'Optional note' : 'Why sign off early? (required for a judgment call)'}
                  className={`${field} sm:flex-1`}
                />
              )}
              <button
                onClick={async () => {
                  if (!floor?.ready && !floor?.ready_for_signoff && !note.trim()) {
                    setError('Add a quick note when signing off before every step is done.');
                    return;
                  }
                  const ok = await run('signoff', '/api/training/floor-ready', floor?.ready ? 'DELETE' : 'POST', { user_id: hire.id, note: note.trim() || undefined });
                  if (ok) setNote('');
                }}
                disabled={busy === 'signoff'}
                className={floor?.ready_for_signoff && !floor.ready ? goldButton : quietButton}
              >
                {busy === 'signoff' ? '…' : floor?.ready ? 'Undo sign-off' : floor?.ready_for_signoff ? '🎯 Sign off floor-ready' : 'Sign off early'}
              </button>
            </div>
          </div>

          {/* Stages */}
          <div className="mt-4 grid md:grid-cols-2 gap-3">
            {(detail.stages ?? []).map((stage, i) => {
              const meta = STAGE_META[stage.key];
              if (stage.key === 'ready') return null;
              return (
                <section key={stage.key} className="rounded-2xl border border-whg-line bg-whg-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">{i + 1}. {meta.emoji} {meta.en}</p>
                    <span className={`text-[10px] font-bold ${stage.status === 'done' ? 'text-emerald-300' : stage.status === 'locked' ? 'text-whg-dim' : 'text-whg-gold'}`}>
                      {stage.total === 0 ? 'Nothing set up' : `${stage.done}/${stage.total}`}
                    </span>
                  </div>
                  {stage.steps.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {stage.steps.map((step) => {
                        const signable = step.kind === 'module' && (step.completion === 'manager' || step.completion === 'trainer');
                        const confirmable = step.kind === 'checklist' && step.done && !step.manager_confirmed;
                        return (
                          <li key={step.id} className="flex items-center gap-2">
                            <span className={`w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center text-[10px] ${step.done ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/10 text-whg-dim'}`} aria-hidden>
                              {step.done ? '✓' : '•'}
                            </span>
                            <span className={`flex-1 text-xs ${step.done ? 'text-whg-dim' : 'text-whg-snow/90'}`}>{step.title}</span>
                            {signable && (
                              <button
                                onClick={() => run(step.id, '/api/training/path', step.done ? 'DELETE' : 'POST', { module_id: step.id, user_id: hire.id })}
                                disabled={busy === step.id}
                                className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-40 ${
                                  step.done ? 'bg-white/10 text-whg-dim hover:bg-white/20' : 'bg-emerald-500 text-white hover:bg-emerald-600'
                                }`}
                              >
                                {busy === step.id ? '…' : step.done ? 'Undo' : 'Sign off'}
                              </button>
                            )}
                            {confirmable && (
                              <button
                                onClick={() => run(step.id, '/api/onboarding/check', 'POST', { user_id: hire.id, item_id: step.id, column: 'manager', checked: true })}
                                disabled={busy === step.id}
                                className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/10 text-whg-snow/90 hover:bg-white/20 disabled:opacity-40"
                              >
                                {busy === step.id ? '…' : 'Confirm'}
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>

          <div className="mt-4 text-right">
            <button
              onClick={async () => {
                if (!confirm(`Stop guided training for ${hire.full_name}? Their progress stays saved.`)) return;
                const ok = await run('end', '/api/training/assignments', 'DELETE', { user_id: hire.id });
                if (ok) onBack();
              }}
              disabled={busy === 'end'}
              className="text-[11px] text-whg-dim hover:text-red-200"
            >
              Stop guided training for this person
            </button>
          </div>
        </>
      )}
    </div>
  );
}
