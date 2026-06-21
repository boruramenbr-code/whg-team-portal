'use client';

import { useEffect, useState, useCallback } from 'react';

/* ───────── Types ───────── */
interface Video {
  id: string;
  title: string;
  description: string | null;
  youtube_id: string;
  duration: string | null;
  sort_order: number;
}

interface Series {
  id: string;
  title: string;
  blurb: string | null;
  sort_order: number;
  videos: Video[];
}

interface Props {
  language: 'en' | 'es';
}

/* ───────── Employee Training Tab ─────────
 *
 * Lists all active training series, each containing videos.
 * Tap a video → opens a full-screen player with the YouTube embed.
 * The series list itself is collapsible; long lists stay scannable.
 *
 * Phase 1 = browsing + playback. Phase 2 adds inline quizzes.
 * Phase 3 surfaces completion + scores to Mission Control.
 */
export default function TrainingTab({ language }: Props) {
  const isES = language === 'es';
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<{ video: Video; seriesTitle: string } | null>(null);
  // Series IDs that are open; default: first series open, rest collapsed.
  const [openSeries, setOpenSeries] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/training');
      if (!r.ok) {
        setLoading(false);
        return;
      }
      const j = await r.json();
      const list: Series[] = j.series || [];
      setSeries(list);
      // Default open: the first non-empty series
      const firstWithVideos = list.find((s) => s.videos.length > 0);
      if (firstWithVideos) setOpenSeries(new Set([firstWithVideos.id]));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSeries = (id: string) => {
    setOpenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#C5D3E2] via-[#CDDAE7] to-[#D5E0EB]">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1B3A6B]">
          {isES ? 'Capacitación' : 'Training'}
        </h1>
        <p className="text-sm text-gray-600 mt-1 mb-6">
          {isES
            ? 'Videos del equipo WHG y de invitados para ayudarte a crecer.'
            : 'Videos from the WHG team and trusted voices to help you grow.'}
        </p>

        {loading ? (
          <div className="text-center text-sm text-gray-400 py-12">
            {isES ? 'Cargando…' : 'Loading…'}
          </div>
        ) : series.length === 0 ? (
          <div className="text-center py-12 bg-white/60 rounded-2xl border border-white/40">
            <div className="text-4xl mb-3">📺</div>
            <p className="text-sm text-gray-500 font-medium">
              {isES ? 'Aún no hay videos.' : 'No videos yet.'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {isES ? 'Vuelve pronto.' : 'Check back soon.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {series.map((s) => {
              const isOpen = openSeries.has(s.id);
              return (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-white/60 shadow-sm overflow-hidden"
                >
                  {/* Series header (tap to toggle) */}
                  <button
                    onClick={() => toggleSeries(s.id)}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-gray-50/60 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm md:text-base font-bold text-[#1B3A6B] truncate">
                        {s.title}
                      </h2>
                      {s.blurb && (
                        <p className="text-[11px] md:text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {s.blurb}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        {s.videos.length} {s.videos.length === 1 ? (isES ? 'video' : 'video') : (isES ? 'videos' : 'videos')}
                      </span>
                      <svg
                        width="16" height="16" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round"
                        className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </button>

                  {/* Video list */}
                  {isOpen && (
                    <div className="border-t border-gray-100 divide-y divide-gray-100">
                      {s.videos.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-gray-400">
                          {isES ? 'Aún no hay videos en esta serie.' : 'No videos in this series yet.'}
                        </div>
                      ) : (
                        s.videos.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => setActiveVideo({ video: v, seriesTitle: s.title })}
                            className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                          >
                            {/* Thumbnail from YouTube */}
                            <div className="relative flex-shrink-0 w-24 h-14 rounded-lg overflow-hidden bg-gray-200">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`https://i.ytimg.com/vi/${v.youtube_id}/mqdefault.jpg`}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors">
                                <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#1B3A6B">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                  </svg>
                                </div>
                              </div>
                              {v.duration && (
                                <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] font-semibold px-1 rounded">
                                  {v.duration}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-800 line-clamp-2">
                                {v.title}
                              </p>
                              {v.description && (
                                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                                  {v.description}
                                </p>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full-screen player */}
      {activeVideo && (
        <VideoPlayer
          video={activeVideo.video}
          seriesTitle={activeVideo.seriesTitle}
          isES={isES}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </div>
  );
}

/* ───────── Video player overlay ───────── */
function VideoPlayer({
  video,
  seriesTitle,
  isES,
  onClose,
}: {
  video: Video;
  seriesTitle: string;
  isES: boolean;
  onClose: () => void;
}) {
  // rel=0 keeps suggested videos within the same channel where possible —
  // YouTube no longer guarantees zero recommendations but this is the
  // best signal we can give. modestbranding is deprecated but harmless.
  const embedUrl = `https://www.youtube.com/embed/${video.youtube_id}?rel=0&modestbranding=1&autoplay=1`;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar — pt-safe pushes the back button below the iOS status
          bar in portrait mode (clock/battery icons were sitting on top
          of the button before, making it unclickable on iPhone).
          Landscape was unaffected because iOS hides the status bar. */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 pt-safe bg-black/80 backdrop-blur-sm">
        <button
          onClick={onClose}
          className="tap-highlight flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          {isES ? 'Volver' : 'Back'}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-white/50 uppercase tracking-widest truncate">{seriesTitle}</p>
          <p className="text-sm font-semibold text-white truncate">{video.title}</p>
        </div>
      </div>

      {/* Player */}
      <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto">
        <div className="w-full max-w-4xl aspect-video bg-black">
          <iframe
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        {video.description && (
          <div className="w-full max-w-4xl px-4 py-4 text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
            {video.description}
          </div>
        )}
      </div>
    </div>
  );
}
