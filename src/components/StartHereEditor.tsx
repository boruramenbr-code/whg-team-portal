'use client';

import { useCallback, useEffect, useState } from 'react';
import WelcomeVideo from './WelcomeVideo';
import { youtubeId } from '@/lib/youtube';

/**
 * Mission Control → Pre-Shift → 📍 Start Here.
 *
 * Two things feed the new hire's Welcome page:
 *   1) The owner's welcome video (owner only) — an unlisted YouTube link.
 *      Also opens step 1 of guided training.
 *   2) Each restaurant's first-day details (managers, their own
 *      restaurants) — address, phone, hours, parking, where to enter, and
 *      first-day notes, in English + Spanish. Empty fields don't show.
 */

interface Props {
  isAdmin: boolean;
}

type Info = Record<string, string>;

const FIELDS: { key: string; label: string; placeholder: string; rows?: number; es?: boolean; hint?: string }[] = [
  { key: 'address', label: 'Address', placeholder: '123 Main St, Gonzales, LA 70737' },
  { key: 'maps_url', label: 'Map link (optional)', placeholder: 'https://maps.app.goo.gl/…', hint: 'Leave blank and the address opens in Google Maps.' },
  { key: 'phone', label: 'Restaurant phone', placeholder: '(225) 555-0123' },
  { key: 'hours', label: 'Hours', placeholder: 'Mon–Thu 11–9 · Fri–Sat 11–10 · Sun 11–9', rows: 2, es: true },
  { key: 'parking', label: 'Where staff park', placeholder: 'Back of the lot, facing the fence — leave the front for guests.', rows: 2, es: true },
  { key: 'entrance', label: 'Where to enter', placeholder: 'Staff door on the left side of the building. Knock if it’s locked.', rows: 2, es: true },
  { key: 'first_day', label: 'On your first day', placeholder: 'Arrive 15 minutes early. Wear black non-slip shoes. Ask for the manager on duty.', rows: 3, es: true, hint: 'The gold box at the bottom of the card.' },
];

export default function StartHereEditor({ isAdmin }: Props) {
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [info, setInfo] = useState<Info>({});
  const [videoUrl, setVideoUrl] = useState('');
  const [savedVideoUrl, setSavedVideoUrl] = useState('');
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'' | 'video' | 'info'>('');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string; where: 'video' | 'info' } | null>(null);

  // Restaurants this person can edit.
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/my-locations', { cache: 'no-store' });
        const j = r.ok ? await r.json() : { locations: [] };
        const locs: { id: string; name: string }[] = j.locations || [];
        setLocations(locs);
        let saved: string | null = null;
        try { saved = localStorage.getItem('whg_view_restaurant_id'); } catch { /* private mode */ }
        setRestaurantId((saved && locs.some((l) => l.id === saved) ? saved : locs[0]?.id) || '');
      } catch { setLoading(false); }
    })();
  }, []);

  const load = useCallback(async (rid: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/start-here?editor=1&restaurant_id=${encodeURIComponent(rid)}`, { cache: 'no-store' });
      if (!r.ok) return;
      const j = await r.json();
      const next: Info = {};
      for (const [k, v] of Object.entries(j.info || {})) if (typeof v === 'string') next[k] = v;
      setInfo(next);
      setVideoUrl(j.welcome_video_url || '');
      setSavedVideoUrl(j.welcome_video_url || '');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (restaurantId) load(restaurantId); }, [restaurantId, load]);

  const patch = async (where: 'video' | 'info', body: object, okText: string) => {
    setSaving(where);
    setMsg(null);
    try {
      const r = await fetch('/api/start-here', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setMsg({ kind: 'err', text: j.error || 'Couldn’t save. Try again.', where });
      else {
        setMsg({ kind: 'ok', text: okText, where });
        if (where === 'video') setSavedVideoUrl(videoUrl.trim());
      }
    } catch {
      setMsg({ kind: 'err', text: 'Connection error. Try again.', where });
    } finally {
      setSaving('');
    }
  };

  const vid = youtubeId(videoUrl);
  const videoInvalid = videoUrl.trim() !== '' && !vid;
  const restaurantName = locations.find((l) => l.id === restaurantId)?.name || 'this restaurant';

  const Banner = ({ where }: { where: 'video' | 'info' }) =>
    msg && msg.where === where ? (
      <div className={`text-sm px-4 py-2.5 rounded-xl border ${msg.kind === 'ok' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
        {msg.text}
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      {/* ── Owner's welcome video ── */}
      {isAdmin && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
            <h3 className="font-bold text-gray-900 text-sm">🎥 Your welcome video</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Opens the Welcome page for every new hire, and step 1 of their training. Upload to YouTube as <b>Unlisted</b>, then paste the link.
            </p>
          </div>
          <div className="p-5 space-y-3">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtu.be/…"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${videoInvalid ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-amber-200'}`}
            />
            {videoInvalid && <p className="text-[11px] text-red-600">That doesn’t look like a YouTube link.</p>}
            {vid && <WelcomeVideo id={vid} isES={false} title="Welcome video preview" />}
            <p className="text-[11px] text-gray-400">
              Spanish speakers see YouTube’s Spanish captions turned on automatically — add or auto-translate captions in YouTube Studio.
            </p>
            <Banner where="video" />
            <button
              onClick={() => patch('video', { welcome_video_url: videoUrl.trim() }, videoUrl.trim() ? 'Video saved — new hires will see it on Start Here.' : 'Video removed.')}
              disabled={saving !== '' || videoInvalid || videoUrl.trim() === savedVideoUrl}
              className="w-full bg-[#1B3A6B] hover:bg-[#15305A] text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {saving === 'video' ? 'Saving…' : videoUrl.trim() || !savedVideoUrl ? 'Save video' : 'Remove video'}
            </button>
          </div>
        </div>
      )}

      {/* ── Restaurant first-day details ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm">📍 Your restaurant — first-day details</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            What a new hire needs before they walk in. Shows on their Welcome page; blank fields are hidden.
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {locations.length > 1 && (
              <select
                value={restaurantId}
                onChange={(e) => { setMsg(null); setRestaurantId(e.target.value); }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 bg-white"
              >
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            )}
            <div className="flex gap-1.5 ml-auto">
              {(['en', 'es'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${lang === l ? 'bg-[#1B3A6B] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {l === 'en' ? '🇺🇸 English' : '🇲🇽 Español'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">Loading…</p>
          ) : !restaurantId ? (
            <p className="text-sm text-gray-500 text-center py-6">No restaurant assigned to your account.</p>
          ) : (
            <>
              {FIELDS.filter((f) => lang === 'en' || f.es).map((f) => {
                const key = lang === 'es' ? `${f.key}_es` : f.key;
                return (
                  <div key={key}>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                      {f.label}{lang === 'es' ? ' — Español' : ''}
                    </label>
                    {f.rows ? (
                      <textarea
                        value={info[key] || ''}
                        onChange={(e) => setInfo((p) => ({ ...p, [key]: e.target.value }))}
                        rows={f.rows}
                        placeholder={lang === 'es' ? info[f.key] || 'Versión en español…' : f.placeholder}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 leading-relaxed"
                      />
                    ) : (
                      <input
                        value={info[key] || ''}
                        onChange={(e) => setInfo((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    )}
                    {f.hint && lang === 'en' && <p className="text-[11px] text-gray-400 mt-1">{f.hint}</p>}
                  </div>
                );
              })}
              {lang === 'es' && (
                <p className="text-[11px] text-gray-400">Address, map link, and phone are the same in both languages. Any Spanish field left blank shows the English.</p>
              )}
              <Banner where="info" />
              <button
                onClick={() => patch('info', { restaurant_id: restaurantId, info }, `Saved — ${restaurantName}’s new hires will see this on Start Here.`)}
                disabled={saving !== ''}
                className="w-full bg-[#1B3A6B] hover:bg-[#15305A] text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm"
              >
                {saving === 'info' ? 'Saving…' : `Save ${restaurantName} details`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
