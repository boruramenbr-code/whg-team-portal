'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { convertToJpeg } from '@/lib/client-image';

/* ───────── Types (mirror /api/memories) ───────── */
interface Memory {
  id: string;
  restaurant_id: string | null;
  photo_url: string | null;
  video_youtube_id: string | null;
  caption: string | null;
  caption_es: string | null;
  taken_label: string | null;
  created_at: string;
}

interface Props {
  language: 'en' | 'es';
}

/* ───────── 🎞 Memories — the WHG photo wall ─────────
 *
 * Team → Memories. Every employee sees every restaurant's wall
 * (culture is open across the brand — Randy's call); chips divide by
 * restaurant, you land on your own. restaurant_id null = brand-wide
 * WHG moments, shown on every wall. Managers curate: staff hand
 * photos to a manager, managers upload. Removal rule stated on-page.
 */
export default function MemoriesTab({ language }: Props) {
  const isES = language === 'es';
  const [memories, setMemories] = useState<Memory[]>([]);
  const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);
  const [canPost, setCanPost] = useState(false);
  const [chip, setChip] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState<Memory | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/memories');
      if (!r.ok) return;
      const j = await r.json();
      setMemories(j.memories || []);
      setRestaurants(j.restaurants || []);
      setCanPost(!!j.can_post);
      // Land on your own restaurant's wall (focused default, open browsing).
      setChip((prev) => prev ?? j.my_restaurant_id ?? (j.restaurants?.[0]?.id || null));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Brand-wide moments (restaurant_id null) belong to every wall.
  const wall = memories.filter((m) => m.restaurant_id === chip || m.restaurant_id === null);

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-whg-night via-[#101B2E] to-whg-night2">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-whg-snow">
              🎞 {isES ? 'Recuerdos' : 'Memories'}
            </h1>
            <p className="text-sm text-whg-dim mt-1">
              {isES
                ? 'La historia, los juegos y la diversión que hemos vivido — en toda la familia WHG.'
                : 'The history, games, and good times we’ve had — across the whole WHG family.'}
            </p>
          </div>
          {canPost && (
            <button
              onClick={() => setShowUpload(true)}
              className="tap-highlight flex-shrink-0 px-4 py-2.5 rounded-xl bg-whg-gold text-whg-goldink text-xs font-bold shadow-sm hover:bg-whg-gold2 transition-colors"
            >
              + {isES ? 'Agregar' : 'Add Photos'}
            </button>
          )}
        </div>

        {/* Restaurant chips — your wall first, everyone can visit all */}
        {restaurants.length > 1 && (
          <div className="flex gap-1.5 mt-4 mb-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {restaurants.map((r) => (
              <button
                key={r.id}
                onClick={() => setChip(r.id)}
                className={`tap-highlight flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                  chip === r.id
                    ? 'bg-whg-gold text-whg-goldink shadow-sm'
                    : 'bg-white/10 text-whg-dim hover:bg-white/20'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        )}

        {/* Removal rule — one quiet line, always visible */}
        <p className="text-[10px] text-whg-dim/70 italic mt-2 mb-4">
          {isES
            ? '¿Sales en una foto que prefieres no tener aquí? Dile a un gerente — se quita, sin preguntas.'
            : 'Spot yourself in a photo you’d rather not have up? Tell a manager — it comes down, no questions.'}
        </p>

        {loading ? (
          <div className="columns-2 md:columns-3 gap-3 [&>*]:mb-3">
            {[160, 220, 140, 200, 170, 190].map((h, i) => (
              <div key={i} className="break-inside-avoid rounded-2xl bg-whg-card/60 animate-pulse" style={{ height: h }} />
            ))}
          </div>
        ) : wall.length === 0 ? (
          <div className="text-center py-14 bg-whg-card/60 rounded-2xl border border-whg-line">
            <div className="text-4xl mb-3">📸</div>
            <p className="text-sm text-whg-dim font-medium">
              {isES ? 'Este muro apenas comienza.' : 'This wall is just getting started.'}
            </p>
            <p className="text-xs text-whg-dim/70 mt-1 max-w-xs mx-auto">
              {isES
                ? '¿Tienes fotos de eventos, juegos o buenos momentos? Mándaselas a un gerente.'
                : 'Got photos from events, games, or good times? Send them to a manager.'}
            </p>
          </div>
        ) : (
          /* Masonry via CSS columns — polaroid wall, newest first */
          <div className="columns-2 md:columns-3 gap-3 [&>*]:mb-3">
            {wall.map((m) => (
              <button
                key={m.id}
                onClick={() => setViewer(m)}
                className="tap-highlight break-inside-avoid block w-full rounded-2xl overflow-hidden bg-whg-card border border-whg-line shadow-sm hover:shadow-md transition-shadow text-left"
              >
                <div className="relative">
                  {m.photo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={m.photo_url} alt={m.caption || ''} className="w-full h-auto" loading="lazy" />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`https://i.ytimg.com/vi/${m.video_youtube_id}/mqdefault.jpg`}
                      alt={m.caption || ''}
                      className="w-full h-auto"
                      loading="lazy"
                    />
                  )}
                  {m.video_youtube_id && (
                    <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">▶</span>
                  )}
                  {m.restaurant_id === null && (
                    <span className="absolute top-1.5 right-1.5 bg-whg-gold/90 text-whg-goldink text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full">
                      WHG
                    </span>
                  )}
                </div>
                {(m.caption || m.taken_label) && (
                  <div className="px-2.5 py-2">
                    {m.caption && (
                      <p className="text-[11px] font-semibold text-whg-snow/90 leading-snug line-clamp-2">
                        {isES && m.caption_es ? m.caption_es : m.caption}
                      </p>
                    )}
                    {m.taken_label && (
                      <p className="text-[10px] text-whg-dim mt-0.5">{m.taken_label}</p>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {viewer && (
        <MemoryViewer
          memory={viewer}
          isES={isES}
          canDelete={canPost}
          onDeleted={() => { setViewer(null); load(); }}
          onClose={() => setViewer(null)}
        />
      )}

      {showUpload && (
        <UploadModal
          isES={isES}
          restaurants={restaurants}
          defaultRestaurantId={chip}
          onClose={() => setShowUpload(false)}
          onSaved={() => { setShowUpload(false); load(); }}
        />
      )}
    </div>
  );
}

/* ───────── Full-screen viewer ───────── */
function MemoryViewer({
  memory: m, isES, canDelete, onDeleted, onClose,
}: {
  memory: Memory;
  isES: boolean;
  canDelete: boolean;
  onDeleted: () => void;
  onClose: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    if (!confirm(isES ? '¿Quitar esta foto del muro?' : 'Take this one off the wall?')) return;
    setDeleting(true);
    const r = await fetch(`/api/memories?id=${m.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (r.ok) onDeleted();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={onClose}>
      <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3 pt-safe">
        <button
          onClick={onClose}
          className="tap-highlight flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium py-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          {isES ? 'Volver' : 'Back'}
        </button>
        {canDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); remove(); }}
            disabled={deleting}
            className="tap-highlight text-[11px] font-semibold text-red-300 hover:text-red-200 px-2 py-2 disabled:opacity-40"
          >
            {isES ? 'Quitar' : 'Remove'}
          </button>
        )}
      </div>
      <div className="flex-1 flex items-center justify-center px-3 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {m.video_youtube_id ? (
          <div className="w-full max-w-3xl aspect-video bg-black rounded-xl overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${m.video_youtube_id}?rel=0&autoplay=1`}
              title={m.caption || 'Memory'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={m.photo_url!} alt={m.caption || ''} className="max-w-full max-h-full object-contain rounded-lg" />
        )}
      </div>
      <div className="flex-shrink-0 px-5 py-4 pb-safe text-center" onClick={(e) => e.stopPropagation()}>
        {m.caption && (
          <p className="text-sm text-white/90 font-medium">
            {isES && m.caption_es ? m.caption_es : m.caption}
          </p>
        )}
        {m.taken_label && <p className="text-xs text-white/50 mt-1">{m.taken_label}</p>}
      </div>
    </div>
  );
}

/* ───────── Manager upload modal ─────────
 * Bulk-first: pick MANY photos at once (seeding years of camera roll),
 * one shared caption/label per batch (usually one event). Or paste a
 * YouTube link instead. HEIC→JPEG conversion happens client-side.
 */
function UploadModal({
  isES, restaurants, defaultRestaurantId, onClose, onSaved,
}: {
  isES: boolean;
  restaurants: { id: string; name: string }[];
  defaultRestaurantId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [restaurantId, setRestaurantId] = useState<string>(defaultRestaurantId ?? '');
  const [caption, setCaption] = useState('');
  const [takenLabel, setTakenLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const extractYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
    return match ? match[1] : /^[A-Za-z0-9_-]{11}$/.test(url.trim()) ? url.trim() : null;
  };

  const save = async () => {
    const videoId = videoUrl.trim() ? extractYouTubeId(videoUrl) : null;
    if (videoUrl.trim() && !videoId) {
      setError(isES ? 'Ese enlace de YouTube no se ve bien.' : 'That YouTube link doesn’t look right.');
      return;
    }
    if (files.length === 0 && !videoId) {
      setError(isES ? 'Elige fotos o pega un enlace de YouTube.' : 'Pick photos or paste a YouTube link.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let done = 0;
      for (const f of files) {
        setProgress(`${done + 1}/${files.length}`);
        const jpeg = await convertToJpeg(f);
        const form = new FormData();
        form.append('photo', jpeg);
        form.append('restaurant_id', restaurantId);
        form.append('caption', caption);
        form.append('taken_label', takenLabel);
        const r = await fetch('/api/memories', { method: 'POST', body: form });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error || 'Upload failed.');
        }
        done++;
      }
      if (videoId) {
        const form = new FormData();
        form.append('video_youtube_id', videoId);
        form.append('restaurant_id', restaurantId);
        form.append('caption', caption);
        form.append('taken_label', takenLabel);
        const r = await fetch('/api/memories', { method: 'POST', body: form });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error || 'Upload failed.');
        }
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setSaving(false);
      setProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={saving ? undefined : onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-base font-bold text-[#1B3A6B]">
            🎞 {isES ? 'Agregar Recuerdos' : 'Add Memories'}
          </h2>
          <button onClick={onClose} disabled={saving} className="text-gray-400 hover:text-gray-600 text-xl disabled:opacity-40">✕</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Photos — bulk picker */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              {isES ? 'Fotos (elige varias)' : 'Photos (pick as many as you want)'}
            </label>
            <input
              ref={fileInput}
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="hidden"
            />
            <button
              onClick={() => fileInput.current?.click()}
              className="w-full py-4 border-2 border-dashed border-gray-300 hover:border-[#1B3A6B]/40 rounded-xl text-sm font-semibold text-[#1B3A6B] transition-colors"
            >
              {files.length > 0
                ? `📸 ${files.length} ${isES ? 'seleccionadas' : 'selected'}`
                : `📸 ${isES ? 'Elegir fotos' : 'Choose photos'}`}
            </button>
          </div>

          {/* Or a YouTube video */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              {isES ? 'O un video de YouTube (opcional)' : 'Or a YouTube video (optional)'}
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtu.be/…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base md:text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
            />
          </div>

          {/* Which wall */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              {isES ? '¿De qué restaurante?' : 'Whose wall?'}
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {restaurants.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRestaurantId(r.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    restaurantId === r.id ? 'bg-[#1B3A6B] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {r.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRestaurantId('')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  restaurantId === '' ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🏢 {isES ? 'Toda la familia WHG' : 'All of WHG'}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              {isES
                ? '“Toda la familia WHG” aparece en el muro de cada restaurante.'
                : '“All of WHG” shows on every restaurant’s wall.'}
            </p>
          </div>

          {/* Caption + when — one per batch (usually one event) */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              {isES ? 'Título (se aplica a todas)' : 'Caption (applies to the whole batch)'}
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={isES ? 'p. ej. Hervido de cangrejo del equipo' : 'e.g. Team crawfish boil'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base md:text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              {isES ? '¿Cuándo fue? (texto libre)' : 'When was it? (free text)'}
            </label>
            <input
              type="text"
              value={takenLabel}
              onChange={(e) => setTakenLabel(e.target.value)}
              placeholder={isES ? 'p. ej. Mayo 2023' : 'e.g. May 2023'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base md:text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <button
            onClick={save}
            disabled={saving || (files.length === 0 && !videoUrl.trim())}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              saving || (files.length === 0 && !videoUrl.trim())
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#1B3A6B] text-white hover:bg-[#15305A]'
            }`}
          >
            {saving
              ? `${isES ? 'Subiendo' : 'Uploading'}${progress ? ` ${progress}` : ''}…`
              : (isES ? 'Publicar en el muro' : 'Post to the wall')}
          </button>
        </div>
      </div>
    </div>
  );
}
