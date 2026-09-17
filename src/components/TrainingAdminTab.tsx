'use client';

import { useEffect, useState, useCallback } from 'react';
import MenuAdminTab from './MenuAdminTab';
import TrainingProgressTab from './TrainingProgressTab';
import TrackBuilderTab from './TrackBuilderTab';
import QuizzesAdminTab from './QuizzesAdminTab';
import { PILLARS, type Pillar } from '@/lib/menu-constants';
import NewHiresTab from './NewHiresTab';
import { AcademyInMissionControl } from './ManagerAcademyTab';
import type { TrainingLink } from '@/lib/training-links';

type AdminSub = 'newhires' | 'academy' | 'videos' | 'menu' | 'quizzes' | 'progress' | 'builder';

/* ───────── Types ───────── */
interface Video {
  id: string;
  title: string;
  description: string | null;
  youtube_id: string;
  duration: string | null;
  sort_order: number;
  /** Review info (migration 080) — for videos on software, rules, or law. */
  last_reviewed_at?: string | null;
  review_due_at?: string | null;
  sources?: string | null;
}

interface Series {
  id: string;
  title: string;
  blurb: string | null;
  sort_order: number;
  /** 'mgmt' = management only; 'all' = whole team (default). */
  audience?: 'all' | 'mgmt';
  /** Manager Academy pillar (managers-only series). */
  pillar?: Pillar | null;
  videos: Video[];
}

/* ───────── Admin Training Tab ─────────
 *
 * Authoring surface. Lets managers/admins create training series and add
 * YouTube videos to them. Paste any YouTube URL — the server extracts the
 * 11-char ID. Reorder via the sort_order number (low → high).
 *
 * Architecture mirrors HolidaysEditor / OwnerMessageEditor — list view +
 * inline modal forms, optimistic refetch after each save.
 */
export default function TrainingAdminTab({
  viewRestaurantId = null,
  isAdmin = false,
  link = null,
  onNavigate,
}: {
  viewRestaurantId?: string | null;
  isAdmin?: boolean;
  /** A shared Academy lesson / manager video link — opens the Academy. */
  link?: TrainingLink | null;
  /** Jump to another Mission Control tab (e.g. People → Staff). */
  onNavigate?: (target: string) => void;
} = {}) {
  // Sub-tabs: New Hires (landing) | Academy | Videos | Menu | Quizzes | Progress | Builder.
  const [sub, setSub] = useState<AdminSub>(link ? 'academy' : 'newhires');
  useEffect(() => { if (link) setSub('academy'); }, [link]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [editingSeries, setEditingSeries] = useState<Partial<Series> | null>(null);
  const [editingVideo, setEditingVideo] = useState<{ video: Partial<Video>; seriesId: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/training');
      if (!r.ok) {
        setError('Failed to load training content.');
        return;
      }
      const j = await r.json();
      setSeries(j.series || []);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deleteSeries = async (id: string) => {
    if (!confirm('Delete this series? All videos inside it will also be removed. This cannot be undone.')) return;
    const r = await fetch(`/api/training/series?id=${id}`, { method: 'DELETE' });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      alert(j.error || 'Delete failed.');
      return;
    }
    load();
  };

  const deleteVideo = async (id: string) => {
    if (!confirm('Delete this video? This cannot be undone.')) return;
    const r = await fetch(`/api/training/videos?id=${id}`, { method: 'DELETE' });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      alert(j.error || 'Delete failed.');
      return;
    }
    load();
  };

  // Guided new-hire training — the manager's side.
  if (sub === 'newhires') {
    return (
      <div>
        <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6 md:pt-8">
          <SubTabPills sub={sub} onChange={setSub} showBuilder={isAdmin} />
        </div>
        <NewHiresTab viewRestaurantId={viewRestaurantId} onAddPerson={() => onNavigate?.('staff')} />
      </div>
    );
  }

  // Manager Academy — videos, lessons, and practice tools for management.
  if (sub === 'academy') {
    return (
      <div>
        <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6 md:pt-8">
          <SubTabPills sub={sub} onChange={setSub} showBuilder={isAdmin} />
        </div>
        <AcademyInMissionControl viewRestaurantId={viewRestaurantId} link={link} />
      </div>
    );
  }

  // Menu authoring gets the whole surface — it renders its own header.
  if (sub === 'menu') {
    return (
      <div>
        <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 md:pt-8">
          <SubTabPills sub={sub} onChange={setSub} showBuilder={isAdmin} />
        </div>
        <MenuAdminTab viewRestaurantId={viewRestaurantId} />
      </div>
    );
  }

  // Quiz authoring gets the whole surface too — its own header + list.
  if (sub === 'quizzes') {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <SubTabPills sub={sub} onChange={setSub} showBuilder={isAdmin} />
        <QuizzesAdminTab />
      </div>
    );
  }

  // Track Builder — create a block once, point positions at it (admin).
  if (sub === 'builder') {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <SubTabPills sub={sub} onChange={setSub} showBuilder={isAdmin} />
        <TrackBuilderTab />
      </div>
    );
  }

  // Progress board — per-person ladders with skill sign-offs.
  if (sub === 'progress') {
    return (
      <div>
        <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 md:pt-8">
          <SubTabPills sub={sub} onChange={setSub} showBuilder={isAdmin} />
        </div>
        <TrainingProgressTab viewRestaurantId={viewRestaurantId} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <SubTabPills sub={sub} onChange={setSub} showBuilder={isAdmin} />
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1B3A6B]">Training</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            Build the video library. Series group related videos; videos embed straight from YouTube.
          </p>
        </div>
        <button
          onClick={() => setEditingSeries({ title: '', blurb: '', sort_order: (series.length + 1) * 100 })}
          className="flex-shrink-0 px-3 py-2 rounded-lg bg-[#1B3A6B] text-white text-xs font-semibold hover:bg-[#15305A] transition-colors"
        >
          + New Series
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-sm text-gray-400">Loading…</div>
      ) : series.length === 0 ? (
        <div className="text-center py-12 bg-white/60 rounded-2xl border border-white/40">
          <div className="text-4xl mb-3">📺</div>
          <p className="text-sm text-gray-500 font-medium">No series yet.</p>
          <p className="text-xs text-gray-400 mt-1">Create your first series to start adding videos.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {series.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Series header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm md:text-base font-bold text-[#1B3A6B] truncate">{s.title}</h2>
                    {s.audience === 'mgmt' && (
                      <span className="text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        🔒 Managers
                      </span>
                    )}
                    {s.pillar && (
                      <span className="text-[9px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        🎓 {PILLARS.find((p) => p.key === s.pillar)?.en}
                      </span>
                    )}
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex-shrink-0">
                      #{s.sort_order}
                    </span>
                  </div>
                  {s.blurb && (
                    <p className="text-[11px] md:text-xs text-gray-500 mt-0.5 line-clamp-2">{s.blurb}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setEditingSeries(s)}
                    className="px-2 py-1 text-[11px] font-semibold text-[#2E86C1] hover:bg-blue-50 rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteSeries(s.id)}
                    className="px-2 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Videos */}
              <div className="divide-y divide-gray-100">
                {s.videos.length === 0 ? (
                  <div className="px-4 py-4 text-center text-xs text-gray-400">No videos yet.</div>
                ) : (
                  s.videos.map((v) => (
                    <div key={v.id} className="px-4 py-2.5 flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://i.ytimg.com/vi/${v.youtube_id}/mqdefault.jpg`}
                        alt=""
                        className="flex-shrink-0 w-20 h-12 object-cover rounded bg-gray-200"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-800 truncate">{v.title}</p>
                          <span className="text-[9px] font-bold text-gray-400 uppercase flex-shrink-0">
                            #{v.sort_order}
                          </span>
                          {v.duration && (
                            <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex-shrink-0">
                              {v.duration}
                            </span>
                          )}
                          {v.review_due_at && v.review_due_at <= new Date().toLocaleDateString('en-CA') && (
                            <span className="text-[9px] font-bold bg-red-50 text-red-700 px-1.5 py-0.5 rounded flex-shrink-0">
                              ⚠️ Review due
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 truncate font-mono">{v.youtube_id}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => setEditingVideo({ video: v, seriesId: s.id })}
                          className="px-2 py-1 text-[11px] font-semibold text-[#2E86C1] hover:bg-blue-50 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteVideo(v.id)}
                          className="px-2 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add video button */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() =>
                    setEditingVideo({
                      video: { title: '', sort_order: (s.videos.length + 1) * 100 },
                      seriesId: s.id,
                    })
                  }
                  className="w-full py-2 text-xs font-semibold text-[#1B3A6B] hover:bg-white border-2 border-dashed border-gray-300 hover:border-[#1B3A6B]/40 rounded-lg transition-colors"
                >
                  + Add Video to "{s.title}"
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Series editor modal */}
      {editingSeries && (
        <SeriesEditor
          initial={editingSeries}
          onClose={() => setEditingSeries(null)}
          onSaved={() => {
            setEditingSeries(null);
            load();
          }}
        />
      )}

      {/* Video editor modal */}
      {editingVideo && (
        <VideoEditor
          initial={editingVideo.video}
          seriesId={editingVideo.seriesId}
          onClose={() => setEditingVideo(null)}
          onSaved={() => {
            setEditingVideo(null);
            load();
          }}
        />
      )}
    </div>
  );
}

/* ───────── Sub-tab pills: Videos | Menu ───────── */
function SubTabPills({ sub, onChange, showBuilder = false }: { sub: AdminSub; onChange: (s: AdminSub) => void; showBuilder?: boolean }) {
  return (
    <div className="flex gap-1.5 mb-5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
      {([
        { key: 'newhires' as const, label: '🧭 New Hires' },
        { key: 'academy' as const, label: '🎓 Academy' },
        { key: 'videos' as const, label: '🎬 Videos' },
        { key: 'menu' as const, label: '🍣 Menu' },
        { key: 'quizzes' as const, label: '📝 Quizzes' },
        { key: 'progress' as const, label: '🧗 Progress' },
        ...(showBuilder ? [{ key: 'builder' as const, label: '🛠 Builder' }] : []),
      ]).map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`tap-highlight flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-colors ${
            sub === t.key
              ? 'bg-[#1B3A6B] text-white shadow-sm'
              : 'bg-white/70 text-gray-600 hover:bg-white'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ───────── Series editor modal ───────── */
function SeriesEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: Partial<Series>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial.id;
  const [title, setTitle] = useState(initial.title || '');
  const [blurb, setBlurb] = useState(initial.blurb || '');
  const [sortOrder, setSortOrder] = useState<string>(String(initial.sort_order ?? 100));
  const [audience, setAudience] = useState<'all' | 'mgmt'>(initial.audience ?? 'all');
  const [pillar, setPillar] = useState<Pillar | ''>(initial.pillar ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError(null);
    const url = isEdit ? `/api/training/series?id=${initial.id}` : '/api/training/series';
    const method = isEdit ? 'PATCH' : 'POST';
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        blurb: blurb.trim() || null,
        sort_order: Number(sortOrder) || 100,
        audience,
        pillar: audience === 'mgmt' ? (pillar || null) : null,
      }),
    });
    setSaving(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setError(j.error || 'Save failed.');
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-base font-bold text-[#1B3A6B]">{isEdit ? 'Edit Series' : 'New Series'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Preston Lee's 30% Rule"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Blurb (optional)</label>
            <textarea
              value={blurb}
              onChange={(e) => setBlurb(e.target.value)}
              placeholder="One-line description shown under the series title."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Who sees this series?</label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setAudience('all')}
                className={`px-3.5 py-2 rounded-full text-xs font-bold transition-colors ${
                  audience === 'all' ? 'bg-[#1B3A6B] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                👥 Whole team
              </button>
              <button
                type="button"
                onClick={() => setAudience('mgmt')}
                className={`px-3.5 py-2 rounded-full text-xs font-bold transition-colors ${
                  audience === 'mgmt' ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🔒 Managers only
              </button>
            </div>
            {audience === 'mgmt' && (
              <p className="text-[10px] text-gray-400 mt-1.5">
                Only management sees this series — staff never know it exists.
              </p>
            )}
          </div>
          {audience === 'mgmt' && (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Manager Academy pillar</label>
              <div className="flex flex-wrap gap-1.5">
                {PILLARS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPillar(pillar === p.key ? '' : p.key)}
                    className={`px-3 py-2 rounded-full text-xs font-bold transition-colors ${
                      pillar === p.key ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {p.emoji} {p.en}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                Groups these videos under 🎓 Academy. Tap again to clear.
              </p>
            </div>
          )}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Sort Order <span className="text-gray-300 normal-case font-normal">(lower = first)</span>
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <button
            onClick={save}
            disabled={saving || !title.trim()}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              saving || !title.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#1B3A6B] text-white hover:bg-[#15305A]'
            }`}
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Series'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Video editor modal ───────── */
function VideoEditor({
  initial,
  seriesId,
  onClose,
  onSaved,
}: {
  initial: Partial<Video>;
  seriesId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial.id;
  const [title, setTitle] = useState(initial.title || '');
  const [description, setDescription] = useState(initial.description || '');
  const [youtubeUrl, setYoutubeUrl] = useState(initial.youtube_id || '');
  const [duration, setDuration] = useState(initial.duration || '');
  const [lastReviewed, setLastReviewed] = useState(initial.last_reviewed_at ?? '');
  const [reviewDue, setReviewDue] = useState(initial.review_due_at ?? '');
  const [sources, setSources] = useState(initial.sources ?? '');
  const [sortOrder, setSortOrder] = useState<string>(String(initial.sort_order ?? 100));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!title.trim() || !youtubeUrl.trim()) {
      setError('Title and YouTube URL are required.');
      return;
    }
    setSaving(true);
    setError(null);
    const url = isEdit ? `/api/training/videos?id=${initial.id}` : '/api/training/videos';
    const method = isEdit ? 'PATCH' : 'POST';
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        series_id: seriesId,
        title: title.trim(),
        description: description.trim() || null,
        youtube_url: youtubeUrl.trim(),
        duration: duration.trim() || null,
        sort_order: Number(sortOrder) || 100,
        last_reviewed_at: lastReviewed || null,
        review_due_at: reviewDue || null,
        sources: sources.trim() || null,
      }),
    });
    setSaving(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setError(j.error || 'Save failed.');
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-base font-bold text-[#1B3A6B]">{isEdit ? 'Edit Video' : 'Add Video'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              YouTube URL or ID
            </label>
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtu.be/dQw4w9WgXcQ"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Paste the full link from YouTube. We pull the video ID automatically.
            </p>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Episode 1 — Welcome to the 30% Rule"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this video covers, why it matters."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Duration <span className="text-gray-300 normal-case font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="12:34"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Sort Order
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
              />
            </div>
          </div>

          {/* Review info — for videos on software, rules, or law */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-3">
            <p className="text-[11px] font-bold text-[#1B3A6B]">
              Review info <span className="font-normal text-gray-400">(optional — for videos on software, rules, or law)</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Last reviewed</label>
                <input
                  type="date"
                  value={lastReviewed}
                  onChange={(e) => setLastReviewed(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base md:text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Next review due</label>
                <input
                  type="date"
                  value={reviewDue}
                  onChange={(e) => setReviewDue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base md:text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Sources</label>
              <textarea
                rows={2}
                value={sources}
                onChange={(e) => setSources(e.target.value)}
                placeholder="Where the facts in this video come from"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base md:text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <button
            onClick={save}
            disabled={saving || !title.trim() || !youtubeUrl.trim()}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              saving || !title.trim() || !youtubeUrl.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#1B3A6B] text-white hover:bg-[#15305A]'
            }`}
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Video'}
          </button>
        </div>
      </div>
    </div>
  );
}
