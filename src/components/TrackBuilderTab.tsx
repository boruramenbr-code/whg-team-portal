'use client';

import { useEffect, useState, useCallback } from 'react';

/* ───────── Track Builder (admin only) ─────────
 * Randy's model, self-serve: create a training block ONCE, checkbox the
 * tracks (positions, cores, certifications) that should carry it, done.
 * Blocks point at shared content — menu sections, video series, quizzes
 * — or stand alone as hands-on skills and read-&-acknowledge notes.
 */

interface BuilderModule {
  id: string;
  track_id: string;
  title: string;
  title_es: string | null;
  description: string | null;
  module_type: string;
  ref_id: string | null;
  completion: 'self' | 'exam' | 'manager';
  required: boolean;
  sort_order: number;
}

interface BuilderTrack {
  id: string;
  title: string;
  level: 'foundations' | 'department' | 'position' | 'certification' | 'ongoing';
  applies_to: string;
  position_slugs: string[];
  restaurant_id: string | null;
  modules: BuilderModule[];
}

interface BuilderData {
  tracks: BuilderTrack[];
  refs: {
    categories: { id: string; name: string; restaurant_id: string | null; is_knowledge: boolean }[];
    series: { id: string; title: string }[];
    quizzes: { id: string; title: string; kind: string; restaurant_id: string | null }[];
  };
  restaurants: { id: string; name: string }[];
}

const TYPE_META: Record<string, { label: string; icon: string; defaultCompletion: 'self' | 'exam' | 'manager'; titlePrefix: string }> = {
  menu_category: { label: 'Study section (menu/knowledge)', icon: '📚', defaultCompletion: 'self', titlePrefix: 'Study: ' },
  video_series: { label: 'Video series', icon: '🎬', defaultCompletion: 'self', titlePrefix: 'Watch: ' },
  quiz: { label: 'Quiz / Exam', icon: '📝', defaultCompletion: 'exam', titlePrefix: 'Quiz: ' },
  photo_test: { label: 'Menu Photo Test (live version)', icon: '📸', defaultCompletion: 'exam', titlePrefix: '📸 Pass the Menu Photo Test' },
  skill: { label: 'Hands-on skill (manager sign-off)', icon: '🤝', defaultCompletion: 'manager', titlePrefix: 'Skill: ' },
  note: { label: 'Read & acknowledge', icon: '📖', defaultCompletion: 'self', titlePrefix: '' },
};

const COMPLETION_LABEL: Record<string, string> = {
  self: 'Self check-off',
  exam: 'Must pass the exam',
  manager: 'Manager sign-off',
};

export default function TrackBuilderTab() {
  const [data, setData] = useState<BuilderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [browseTrackId, setBrowseTrackId] = useState<string>('');
  const [editModule, setEditModule] = useState<BuilderModule | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/training/builder');
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error || 'Failed to load the builder.');
        return;
      }
      setData(await r.json());
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const removeModule = async (m: BuilderModule) => {
    if (!confirm(`Remove "${m.title}" from this track? Staff completion records for this block will be deleted too.`)) return;
    const r = await fetch(`/api/training/builder/modules?id=${m.id}`, { method: 'DELETE' });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setError(j.error || 'Remove failed.');
      return;
    }
    load();
  };

  if (loading) return <div className="text-center py-12 text-sm text-gray-400">Loading…</div>;
  if (error && !data) return <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-medium">{error}</div>;
  if (!data) return null;

  const restName = (id: string | null) =>
    id === null ? 'All restaurants' : data.restaurants.find((r) => r.id === id)?.name || 'Unknown';

  const browseTrack = data.tracks.find((t) => t.id === browseTrackId) || null;

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1B3A6B]">Track Builder</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            Create a training block once, point any positions at it. Content lives in one place — every track that points at it stays in sync.
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex-shrink-0 px-3 py-2 rounded-lg bg-[#1B3A6B] text-white text-xs font-semibold hover:bg-[#15305A] transition-colors"
        >
          + New Training Block
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-medium">{error}</div>
      )}

      {/* Browse & edit a track's blocks */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
            Browse a track&rsquo;s blocks
          </label>
          <select
            value={browseTrackId}
            onChange={(e) => setBrowseTrackId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B] bg-white"
          >
            <option value="">Pick a track…</option>
            {(['foundations', 'department', 'position', 'certification', 'ongoing'] as const).map((level) => (
              <optgroup key={level} label={level.toUpperCase()}>
                {data.tracks.filter((t) => t.level === level).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} · {restName(t.restaurant_id)} ({t.modules.length})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {browseTrack && (
          <div className="divide-y divide-gray-50">
            {browseTrack.modules.length === 0 ? (
              <p className="px-4 py-4 text-xs text-gray-400">No blocks on this track yet.</p>
            ) : (
              [...browseTrack.modules].sort((a, b) => a.sort_order - b.sort_order).map((m) => (
                <div key={m.id} className="px-4 py-2.5 flex items-center gap-3">
                  <span className="flex-shrink-0 text-base" aria-hidden>{TYPE_META[m.module_type]?.icon || '·'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {m.title}
                      {!m.required && <span className="ml-1.5 text-[9px] font-bold uppercase text-gray-400">optional</span>}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {COMPLETION_LABEL[m.completion]} · sort #{m.sort_order}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditModule(m)}
                    className="flex-shrink-0 px-2 py-1 text-[11px] font-semibold text-[#2E86C1] hover:bg-blue-50 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeModule(m)}
                    className="flex-shrink-0 px-2 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-50 rounded"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showNew && (
        <BlockModal
          data={data}
          restName={restName}
          onClose={() => setShowNew(false)}
          onSaved={() => { setShowNew(false); load(); }}
        />
      )}

      {editModule && (
        <EditModal
          module={editModule}
          onClose={() => setEditModule(null)}
          onSaved={() => { setEditModule(null); load(); }}
        />
      )}
    </div>
  );
}

/* ───────── New block: create once, point positions at it ───────── */
function BlockModal({
  data, restName, onClose, onSaved,
}: {
  data: BuilderData;
  restName: (id: string | null) => string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [moduleType, setModuleType] = useState<string>('menu_category');
  const [refId, setRefId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [titleEs, setTitleEs] = useState('');
  const [description, setDescription] = useState('');
  const [completion, setCompletion] = useState<'self' | 'exam' | 'manager'>('self');
  const [required, setRequired] = useState(true);
  const [sortOrder, setSortOrder] = useState('100');
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = TYPE_META[moduleType];
  const needsRef = ['menu_category', 'video_series', 'quiz'].includes(moduleType);

  const onTypeChange = (t: string) => {
    setModuleType(t);
    setRefId('');
    setCompletion(TYPE_META[t].defaultCompletion);
    if (t === 'photo_test') setTitle(TYPE_META[t].titlePrefix);
  };

  const onRefChange = (id: string) => {
    setRefId(id);
    // Auto-title from the picked content, if the admin hasn't typed one.
    if (!title || Object.values(TYPE_META).some((m) => title === m.titlePrefix)) {
      const name =
        moduleType === 'menu_category' ? data.refs.categories.find((c) => c.id === id)?.name :
        moduleType === 'video_series' ? data.refs.series.find((s) => s.id === id)?.title :
        data.refs.quizzes.find((q) => q.id === id)?.title;
      if (name) setTitle(`${meta.titlePrefix}${name}`);
    }
  };

  const toggleTrack = (id: string) => {
    setSelectedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const r = await fetch('/api/training/builder/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        track_ids: Array.from(selectedTracks),
        title, title_es: titleEs, description,
        module_type: moduleType,
        ref_id: needsRef ? refId : null,
        completion, required,
        sort_order: Number(sortOrder) || 100,
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

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B]';
  const labelCls = 'block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5';

  const trackGroups: { label: string; tracks: BuilderTrack[] }[] = [
    { label: 'Foundations & Cores', tracks: data.tracks.filter((t) => t.level === 'foundations' || t.level === 'department') },
    { label: 'Positions', tracks: data.tracks.filter((t) => t.level === 'position') },
    { label: 'Certifications & Ongoing', tracks: data.tracks.filter((t) => t.level === 'certification' || t.level === 'ongoing') },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-base font-bold text-[#1B3A6B]">New Training Block</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 text-xl px-2 py-1">✕</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className={labelCls}>What kind of block?</label>
            <select value={moduleType} onChange={(e) => onTypeChange(e.target.value)} className={inputCls}>
              {Object.entries(TYPE_META).map(([k, m]) => (
                <option key={k} value={k}>{m.icon} {m.label}</option>
              ))}
            </select>
          </div>

          {needsRef && (
            <div>
              <label className={labelCls}>Points at</label>
              <select value={refId} onChange={(e) => onRefChange(e.target.value)} className={inputCls}>
                <option value="">Pick the content…</option>
                {moduleType === 'menu_category' && data.refs.categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.is_knowledge ? '📚' : '🍽️'} {c.name} · {restName(c.restaurant_id)}</option>
                ))}
                {moduleType === 'video_series' && data.refs.series.map((s) => (
                  <option key={s.id} value={s.id}>🎬 {s.title}</option>
                ))}
                {moduleType === 'quiz' && data.refs.quizzes.map((q) => (
                  <option key={q.id} value={q.id}>{q.kind === 'exam' ? '🎯' : '📝'} {q.title} · {restName(q.restaurant_id)}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelCls}>Title (what staff see on their path)</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder='e.g. Skill: Espresso machine close-down' className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Title (Spanish, optional)</label>
            <input type="text" value={titleEs} onChange={(e) => setTitleEs(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description — what to do / what to demonstrate</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className={labelCls}>Completes by</label>
              <select value={completion} onChange={(e) => setCompletion(e.target.value as 'self' | 'exam' | 'manager')} className={inputCls}>
                <option value="self">Self check</option>
                <option value="manager">Manager sign-off</option>
                <option value="exam">Pass exam</option>
              </select>
            </div>
            <div className="col-span-1">
              <label className={labelCls}>Sort order</label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={inputCls} />
            </div>
            <div className="col-span-1 flex items-end pb-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
                Required
              </label>
            </div>
          </div>

          <div>
            <label className={labelCls}>Point these tracks at it</label>
            <div className="border border-gray-200 rounded-xl max-h-56 overflow-y-auto divide-y divide-gray-50">
              {trackGroups.map((g) => g.tracks.length > 0 && (
                <div key={g.label} className="px-3 py-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{g.label}</p>
                  <div className="space-y-1">
                    {g.tracks.map((t) => (
                      <label key={t.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={selectedTracks.has(t.id)}
                          onChange={() => toggleTrack(t.id)}
                        />
                        <span className="truncate">{t.title}</span>
                        <span className="text-[9px] text-gray-400 flex-shrink-0">· {restName(t.restaurant_id)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {selectedTracks.size} track{selectedTracks.size === 1 ? '' : 's'} selected
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-medium">{error}</div>
          )}

          <button
            onClick={save}
            disabled={saving || !title.trim() || selectedTracks.size === 0 || (needsRef && !refId)}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              saving || !title.trim() || selectedTracks.size === 0 || (needsRef && !refId)
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#1B3A6B] text-white hover:bg-[#15305A]'
            }`}
          >
            {saving ? 'Creating…' : `Create on ${selectedTracks.size || '…'} track${selectedTracks.size === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Edit one module row ───────── */
function EditModal({
  module, onClose, onSaved,
}: {
  module: BuilderModule;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(module.title);
  const [description, setDescription] = useState(module.description || '');
  const [completion, setCompletion] = useState(module.completion);
  const [required, setRequired] = useState(module.required);
  const [sortOrder, setSortOrder] = useState(String(module.sort_order));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    const r = await fetch(`/api/training/builder/modules?id=${module.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, completion, required, sort_order: Number(sortOrder) || 100 }),
    });
    setSaving(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setError(j.error || 'Save failed.');
      return;
    }
    onSaved();
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B]';
  const labelCls = 'block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-base font-bold text-[#1B3A6B]">Edit Block</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 text-xl px-2 py-1">✕</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className={labelCls}>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Completes by</label>
              <select value={completion} onChange={(e) => setCompletion(e.target.value as 'self' | 'exam' | 'manager')} className={inputCls}>
                <option value="self">Self check</option>
                <option value="manager">Manager</option>
                <option value="exam">Exam</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Sort</label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={inputCls} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
                Required
              </label>
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-medium">{error}</div>
          )}
          <button
            onClick={save}
            disabled={saving || !title.trim()}
            className={`w-full py-3 rounded-xl font-semibold text-sm ${
              saving || !title.trim() ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#1B3A6B] text-white hover:bg-[#15305A]'
            }`}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
