'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { convertToJpeg, makeThumbnail, captureVideoPoster } from '@/lib/client-image';

/* ───────── Types (mirror /api/memories) ───────── */
interface Memory {
  id: string;
  restaurant_id: string | null;
  photo_url: string | null;
  video_youtube_id: string | null;
  /** Directly-uploaded video file (public bucket URL). */
  video_url: string | null;
  /** ~720px still for tiles (photo thumbnail or video frame). */
  thumb_url: string | null;
  caption: string | null;
  caption_es: string | null;
  taken_label: string | null;
  /** Event card — fronts the wall in the ⭐ Events row. */
  featured: boolean;
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
  const onWall = memories.filter((m) => m.restaurant_id === chip || m.restaurant_id === null);
  // Events front the wall; the collage carries everything else.
  const events = onWall.filter((m) => m.featured);
  const wall = onWall.filter((m) => !m.featured);

  // Locations that haven't opened yet get a Coming Soon sign instead of
  // the plain empty state — it dissolves on its own the moment their
  // first photo lands. Trim this list as places open (harmless if you
  // don't: a wall with photos never shows the sign).
  const UPCOMING = ['shokudo', 'central hub'];
  const chipRestaurant = restaurants.find((r) => r.id === chip) || null;
  const isUpcomingWall =
    !!chipRestaurant && UPCOMING.includes(chipRestaurant.name.toLowerCase().trim());

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
                {UPCOMING.includes(r.name.toLowerCase().trim()) &&
                  !memories.some((m) => m.restaurant_id === r.id) && ' ✨'}
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

        {/* ⭐ Events — the front row: company gatherings and big moments,
            gold-trimmed cinematic cards. Brand-wide events front every
            restaurant's wall. */}
        {!loading && events.length > 0 && (
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-whg-gold mb-2">
              ⭐ {isES ? 'Eventos' : 'Events'}
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
              {events.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setViewer(m)}
                  className="tap-highlight relative flex-shrink-0 w-72 aspect-video rounded-2xl overflow-hidden border border-whg-gold/40 shadow-md text-left bg-whg-card2"
                >
                  {m.thumb_url || m.photo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={(m.thumb_url || m.photo_url)!} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
                  ) : m.video_url ? (
                    <video
                      src={`${m.video_url}#t=0.1`}
                      preload="metadata"
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`https://i.ytimg.com/vi/${m.video_youtube_id}/hqdefault.jpg`}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {(m.video_youtube_id || m.video_url) && (
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-md">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#1B3A6B">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </span>
                  )}
                  {m.restaurant_id === null && (
                    <span className="absolute top-2 right-2 bg-whg-gold/90 text-whg-goldink text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full">
                      WHG
                    </span>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-bold text-sm leading-tight drop-shadow line-clamp-2">
                      {(isES && m.caption_es ? m.caption_es : m.caption) || (isES ? 'Evento' : 'Event')}
                    </p>
                    {m.taken_label && (
                      <p className="text-white/70 text-[11px] font-semibold mt-0.5">{m.taken_label}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="columns-2 md:columns-3 gap-3 [&>*]:mb-3">
            {[160, 220, 140, 200, 170, 190].map((h, i) => (
              <div key={i} className="break-inside-avoid rounded-2xl bg-whg-card/60 animate-pulse" style={{ height: h }} />
            ))}
          </div>
        ) : onWall.length === 0 && isUpcomingWall ? (
          /* Not-yet-open location — hype sign until the first photo */
          <div className="text-center py-16 bg-whg-card/60 rounded-2xl border border-whg-gold/30 relative overflow-hidden">
            <div className="absolute top-3 left-4 text-lg opacity-40 select-none" aria-hidden>✨</div>
            <div className="absolute bottom-3 right-4 text-lg opacity-40 select-none" aria-hidden>✨</div>
            <div className="text-5xl mb-3" aria-hidden>🏗️</div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-whg-gold mb-1.5">
              {isES ? 'Próximamente' : 'Coming Soon'}
            </p>
            <p className="text-lg font-bold text-whg-snow">{chipRestaurant?.name}</p>
            <p className="text-xs text-whg-dim mt-2 max-w-xs mx-auto leading-relaxed">
              {isES
                ? 'Este capítulo de la familia WHG aún no comienza. La primera foto aparecerá aquí cuando abramos las puertas — y tú podrías estar en ella.'
                : 'This chapter of the WHG family hasn’t started yet. The first photo lands here when the doors open — and you might be in it.'}
            </p>
          </div>
        ) : onWall.length === 0 ? (
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
                  {m.thumb_url || m.photo_url ? (
                    /* Tiles show the ~720px thumbnail; the full file loads on tap. */
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={(m.thumb_url || m.photo_url)!} alt={m.caption || ''} className="w-full h-auto" loading="lazy" decoding="async" />
                  ) : m.video_url ? (
                    /* #t=0.1 nudges browsers into painting the first frame */
                    <video
                      src={`${m.video_url}#t=0.1`}
                      preload="metadata"
                      muted
                      playsInline
                      className="w-full h-auto pointer-events-none"
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`https://i.ytimg.com/vi/${m.video_youtube_id}/mqdefault.jpg`}
                      alt={m.caption || ''}
                      className="w-full h-auto"
                      loading="lazy"
                    />
                  )}
                  {(m.video_youtube_id || m.video_url) && (
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/55 backdrop-blur-[2px] ring-2 ring-white/90 flex items-center justify-center shadow-lg">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white" className="ml-0.5">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </span>
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
        {m.video_url ? (
          <video
            src={m.video_url}
            controls
            autoPlay
            playsInline
            className="max-w-full max-h-full rounded-lg"
          />
        ) : m.video_youtube_id ? (
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
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [restaurantId, setRestaurantId] = useState<string>(defaultRestaurantId ?? '');
  const [caption, setCaption] = useState('');
  const [takenLabel, setTakenLabel] = useState('');
  const [featured, setFeatured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  const MAX_VIDEO_MB = 100;

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
    if (files.length === 0 && videoFiles.length === 0 && !videoId) {
      setError(isES ? 'Elige fotos, videos o pega un enlace de YouTube.' : 'Pick photos, videos, or paste a YouTube link.');
      return;
    }
    const tooBig = videoFiles.find((v) => v.size > MAX_VIDEO_MB * 1024 * 1024);
    if (tooBig) {
      setError(isES
        ? `"${tooBig.name}" pasa de ${MAX_VIDEO_MB}MB — recórtalo o compártelo por YouTube.`
        : `"${tooBig.name}" is over ${MAX_VIDEO_MB}MB — trim it down or share it via YouTube.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let done = 0;
      for (const f of files) {
        setProgress(`${done + 1}/${files.length}`);
        const jpeg = await convertToJpeg(f);
        const thumb = await makeThumbnail(jpeg).catch(() => null);
        const form = new FormData();
        form.append('photo', jpeg);
        if (thumb) form.append('thumb', thumb);
        form.append('restaurant_id', restaurantId);
        form.append('caption', caption);
        form.append('taken_label', takenLabel);
        form.append('featured', String(featured));
        const r = await fetch('/api/memories', { method: 'POST', body: form });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error || 'Upload failed.');
        }
        done++;
      }
      // Video files upload STRAIGHT to storage via signed URLs (they're
      // too big for the API route), then a finalize call records them.
      let vdone = 0;
      for (const v of videoFiles) {
        setProgress(`🎬 ${vdone + 1}/${videoFiles.length}`);
        const ext = (v.name.split('.').pop() || 'mp4').toLowerCase() === 'mov' ? 'mov' : 'mp4';
        const signRes = await fetch('/api/memories/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sign', ext }),
        });
        if (!signRes.ok) throw new Error('Could not start the video upload.');
        const { path, token } = await signRes.json();
        const putRes = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/upload/sign/memories/${path}?token=${encodeURIComponent(token)}`,
          { method: 'PUT', headers: { 'Content-Type': ext === 'mov' ? 'video/quicktime' : 'video/mp4' }, body: v }
        );
        if (!putRes.ok) throw new Error(`Video upload failed (${putRes.status}).`);

        // Still frame for the tile, so the wall never has to probe the
        // video file. Best-effort: no poster → tile falls back to video.
        let thumbPath: string | null = null;
        const poster = await captureVideoPoster(v);
        if (poster) {
          const posterSign = await fetch('/api/memories/video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sign', kind: 'poster' }),
          });
          if (posterSign.ok) {
            const { path: posterPath, token: posterToken } = await posterSign.json();
            const posterPut = await fetch(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/upload/sign/memories/${posterPath}?token=${encodeURIComponent(posterToken)}`,
              { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: poster }
            );
            if (posterPut.ok) thumbPath = posterPath;
          }
        }

        const finRes = await fetch('/api/memories/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'finalize', path, thumb_path: thumbPath, restaurant_id: restaurantId, caption, taken_label: takenLabel, featured }),
        });
        if (!finRes.ok) {
          const j = await finRes.json().catch(() => ({}));
          throw new Error(j.error || 'Could not save the video.');
        }
        vdone++;
      }
      if (videoId) {
        const form = new FormData();
        form.append('video_youtube_id', videoId);
        form.append('restaurant_id', restaurantId);
        form.append('caption', caption);
        form.append('taken_label', takenLabel);
        form.append('featured', String(featured));
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
      <div className="relative w-full max-w-md bg-whg-card border border-whg-line rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-whg-card border-b border-whg-line px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-base font-bold text-whg-snow">
            🎞 {isES ? 'Agregar Recuerdos' : 'Add Memories'}
          </h2>
          <button onClick={onClose} disabled={saving} className="text-whg-dim hover:text-whg-snow text-xl disabled:opacity-40">✕</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Photos — bulk picker */}
          <div>
            <label className="block text-[10px] font-bold text-whg-dim uppercase tracking-wide mb-1.5">
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
              className="w-full py-4 border-2 border-dashed border-whg-line hover:border-whg-gold/50 rounded-xl text-sm font-semibold text-whg-snow transition-colors"
            >
              {files.length > 0
                ? `📸 ${files.length} ${isES ? 'seleccionadas' : 'selected'}`
                : `📸 ${isES ? 'Elegir fotos' : 'Choose photos'}`}
            </button>
          </div>

          {/* Videos — straight from the camera roll */}
          <div>
            <label className="block text-[10px] font-bold text-whg-dim uppercase tracking-wide mb-1.5">
              {isES ? `Videos (hasta ${MAX_VIDEO_MB}MB cada uno)` : `Videos (up to ${MAX_VIDEO_MB}MB each)`}
            </label>
            <input
              ref={videoInput}
              type="file"
              accept="video/mp4,video/quicktime"
              multiple
              onChange={(e) => setVideoFiles(Array.from(e.target.files || []))}
              className="hidden"
            />
            <button
              onClick={() => videoInput.current?.click()}
              className="w-full py-4 border-2 border-dashed border-whg-line hover:border-whg-gold/50 rounded-xl text-sm font-semibold text-whg-snow transition-colors"
            >
              {videoFiles.length > 0
                ? `🎬 ${videoFiles.length} ${isES ? 'seleccionados' : 'selected'}`
                : `🎬 ${isES ? 'Elegir videos' : 'Choose videos'}`}
            </button>
          </div>

          {/* Or a YouTube video */}
          <div>
            <label className="block text-[10px] font-bold text-whg-dim uppercase tracking-wide mb-1.5">
              {isES ? 'O un video de YouTube (opcional)' : 'Or a YouTube video (optional)'}
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtu.be/…"
              className="w-full px-3 py-2 bg-whg-card2 border border-whg-line rounded-lg text-base md:text-sm text-whg-snow placeholder:text-whg-dim/60 focus:outline-none focus:border-whg-gold focus:ring-1 focus:ring-whg-gold/20"
            />
          </div>

          {/* Which wall */}
          <div>
            <label className="block text-[10px] font-bold text-whg-dim uppercase tracking-wide mb-1.5">
              {isES ? '¿De qué restaurante?' : 'Whose wall?'}
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {restaurants.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRestaurantId(r.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    restaurantId === r.id ? 'bg-whg-gold text-whg-goldink shadow-sm' : 'bg-white/10 text-whg-dim hover:bg-white/20'
                  }`}
                >
                  {r.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRestaurantId('')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  restaurantId === '' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white/10 text-whg-dim hover:bg-white/20'
                }`}
              >
                🏢 {isES ? 'Toda la familia WHG' : 'All of WHG'}
              </button>
            </div>
            <p className="text-[10px] text-whg-dim/70 mt-1.5">
              {isES
                ? '“Toda la familia WHG” aparece en el muro de cada restaurante.'
                : '“All of WHG” shows on every restaurant’s wall.'}
            </p>
          </div>

          {/* Caption + when — one per batch (usually one event) */}
          <div>
            <label className="block text-[10px] font-bold text-whg-dim uppercase tracking-wide mb-1.5">
              {isES ? 'Título (se aplica a todas)' : 'Caption (applies to the whole batch)'}
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={isES ? 'p. ej. Hervido de cangrejo del equipo' : 'e.g. Team crawfish boil'}
              className="w-full px-3 py-2 bg-whg-card2 border border-whg-line rounded-lg text-base md:text-sm text-whg-snow placeholder:text-whg-dim/60 focus:outline-none focus:border-whg-gold focus:ring-1 focus:ring-whg-gold/20"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-whg-dim uppercase tracking-wide mb-1.5">
              {isES ? '¿Cuándo fue? (texto libre)' : 'When was it? (free text)'}
            </label>
            <input
              type="text"
              value={takenLabel}
              onChange={(e) => setTakenLabel(e.target.value)}
              placeholder={isES ? 'p. ej. Mayo 2023' : 'e.g. May 2023'}
              className="w-full px-3 py-2 bg-whg-card2 border border-whg-line rounded-lg text-base md:text-sm text-whg-snow placeholder:text-whg-dim/60 focus:outline-none focus:border-whg-gold focus:ring-1 focus:ring-whg-gold/20"
            />
          </div>

          {/* ⭐ Event toggle — fronts the wall in the Events row */}
          <button
            type="button"
            onClick={() => setFeatured((v) => !v)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-colors ${
              featured ? 'border-amber-400/60 bg-amber-400/10' : 'border-whg-line bg-whg-card2 hover:border-whg-dim/40'
            }`}
          >
            <span className="text-xl" aria-hidden>⭐</span>
            <span className="min-w-0 flex-1">
              <span className={`block text-xs font-bold ${featured ? 'text-amber-200' : 'text-whg-snow'}`}>
                {isES ? 'Destacar como evento' : 'Feature as an event'}
              </span>
              <span className={`block text-[10px] mt-0.5 ${featured ? 'text-amber-300/80' : 'text-whg-dim/70'}`}>
                {isES
                  ? 'Va en la fila de Eventos, arriba del muro — para fiestas, hervidos y grandes momentos.'
                  : 'Goes in the Events row at the top of the wall — for parties, boils, and big moments.'}
              </span>
            </span>
            <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
              featured ? 'border-amber-500 bg-amber-500 text-white' : 'border-whg-line text-transparent'
            }`}>✓</span>
          </button>

          {error && (
            <div className="bg-red-400/10 border border-red-400/30 rounded-xl px-4 py-3 text-xs text-red-200 font-medium">
              {error}
            </div>
          )}

          <button
            onClick={save}
            disabled={saving || (files.length === 0 && videoFiles.length === 0 && !videoUrl.trim())}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              saving || (files.length === 0 && videoFiles.length === 0 && !videoUrl.trim())
                ? 'bg-white/10 text-whg-dim/50 cursor-not-allowed'
                : 'bg-whg-gold text-whg-goldink hover:bg-whg-gold2'
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
