'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import MenuTab from './MenuTab';
import QuizzesTab from './QuizzesTab';
import TrainingPathTab from './TrainingPathTab';
import type { Pillar } from '@/lib/menu-constants';
import { buildVideoUrl, copyText, type TrainingLink, type TrainingZone } from '@/lib/training-links';

// Management only — its own chunk, so staff never download it.
const ManagerAcademyTab = dynamic(() => import('./ManagerAcademyTab'), { ssr: false });

/* ───────── Types ───────── */
export interface Video {
  id: string;
  title: string;
  description: string | null;
  youtube_id: string;
  duration: string | null;
  sort_order: number;
}

export interface Series {
  id: string;
  title: string;
  blurb: string | null;
  sort_order: number;
  /** 'mgmt' series only reach management — the API already filters. */
  audience?: 'all' | 'mgmt';
  /** Manager Academy pillar (manager series). */
  pillar?: Pillar | null;
  videos: Video[];
}

type Sub = 'path' | 'academy' | 'videos' | 'menu' | 'systems' | 'quizzes';

interface Props {
  language: 'en' | 'es';
  /** Owner's master switcher — scopes the Menu sub-tab to this restaurant. */
  viewRestaurantId?: string | null;
  /** Management (admin / manager / assistant manager, or the mgmt
   *  onboarding category) — unlocks 🎓 Academy and lesson links. */
  isMgmt?: boolean;
  /** A shared link to open (?lesson=… / ?video=…), parsed by the dashboard. */
  link?: TrainingLink | null;
  onLinkHandled?: () => void;
}

/* ───────── Employee Training Tab ─────────
 *
 * Lists all active training series, each containing videos.
 * Tap a video → opens a full-screen player with the YouTube embed.
 * The series list itself is collapsible; long lists stay scannable.
 *
 * Management also gets 🎓 Academy — manager videos, lessons, and practice
 * calculators grouped into Leadership / Operations / Administration.
 */
export default function TrainingTab({ language, viewRestaurantId = null, isMgmt = false, link = null, onLinkHandled }: Props) {
  const isES = language === 'es';
  // "My Path" is the landing view — each person's position-based ladder.
  // Videos / Menu / Systems / Quizzes are the open library behind it.
  const [sub, setSub] = useState<Sub>('path');
  // One section (and optionally one card) to open — from a Path module or a
  // shared link. Cleared when you switch sub-tabs yourself.
  const [lessonTarget, setLessonTarget] = useState<{ id: string; zone: TrainingZone; card: string | null } | null>(null);
  const [pendingVideoId, setPendingVideoId] = useState<string | null>(null);
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

  // Shared links: jump to the lesson's sub-tab, or queue the video until the
  // library has loaded. Academy links only open for management.
  useEffect(() => {
    if (!link) return;
    if (link.kind === 'video') {
      setSub('videos');
      setPendingVideoId(link.id);
    } else if (link.zone !== 'academy' || isMgmt) {
      setLessonTarget({ id: link.id, zone: link.zone, card: link.card });
      setSub(link.zone);
    }
    onLinkHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link]);

  useEffect(() => {
    if (!pendingVideoId || loading) return;
    for (const s of series) {
      const v = s.videos.find((x) => x.id === pendingVideoId);
      if (v) {
        setOpenSeries((prev) => new Set(prev).add(s.id));
        setActiveVideo({ video: v, seriesTitle: s.title });
        break;
      }
    }
    setPendingVideoId(null);
  }, [pendingVideoId, loading, series]);

  const targetFor = (z: TrainingZone) => (lessonTarget?.zone === z ? lessonTarget : null);
  const goSub = (s: Sub) => {
    setLessonTarget(null);
    setSub(s);
  };

  const toggleSeries = (id: string) => {
    setOpenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-whg-night via-[#101B2E] to-whg-night2">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-whg-snow">
          {isES ? 'Capacitación' : 'Training'}
        </h1>
        <p className="text-sm text-whg-dim mt-1 mb-4">
          {sub === 'path'
            ? (isES
                ? 'Tu escalera de entrenamiento — construida para tu posición.'
                : 'Your training ladder — built for your position.')
            : sub === 'academy'
            ? (isES
                ? 'Liderazgo, operaciones y el negocio detrás del restaurante.'
                : 'Leadership, operations, and the business behind the restaurant.')
            : sub === 'videos'
            ? (isES
                ? 'Videos del equipo WHG y de invitados para ayudarte a crecer.'
                : 'Videos from the WHG team and trusted voices to help you grow.')
            : sub === 'menu'
              ? (isES
                  ? 'Conoce cada platillo de tu restaurante — foto, ingredientes y alérgenos.'
                  : 'Know every dish at your restaurant — photo, ingredients, and allergens.')
              : sub === 'systems'
              ? (isES
                  ? 'Las herramientas del trabajo — OpenTable, Toast, 7shifts y más, una sección por sistema.'
                  : 'The tools of the job — OpenTable, Toast, 7shifts, and more, one section per system.')
              : (isES
                  ? 'Demuestra lo que sabes. Los exámenes te ponen en piso; los cuestionarios refuerzan lo aprendido.'
                  : 'Show what you know. Exams get you floor-ready; quizzes keep it sharp.')}
        </p>

        {/* Sub-tab pills: My Path | Academy (mgmt) | Videos | Menu | Systems | Quizzes */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {([
            { key: 'path' as const, label: isES ? '🧗 Mi Camino' : '🧗 My Path' },
            ...(isMgmt ? [{ key: 'academy' as const, label: isES ? '🎓 Academia' : '🎓 Academy' }] : []),
            { key: 'videos' as const, label: isES ? '🎬 Videos' : '🎬 Videos' },
            { key: 'menu' as const, label: isES ? '🍣 Menú' : '🍣 Menu' },
            { key: 'systems' as const, label: isES ? '🧰 Sistemas' : '🧰 Systems' },
            { key: 'quizzes' as const, label: isES ? '📝 Cuestionarios' : '📝 Quizzes' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => goSub(tab.key)}
              className={`tap-highlight flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                sub === tab.key
                  ? 'bg-whg-gold text-whg-goldink shadow-sm'
                  : 'bg-white/10 text-whg-dim hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {sub === 'path' ? (
          <TrainingPathTab
            language={language}
            onGoTo={(s, refId) => {
              if (s === 'menu' || s === 'systems' || s === 'academy') {
                setLessonTarget(refId ? { id: refId, zone: s, card: null } : null);
                setSub(s === 'academy' && !isMgmt ? 'menu' : s);
              } else {
                goSub(s);
              }
            }}
          />
        ) : sub === 'academy' && isMgmt ? (
          <ManagerAcademyTab
            language={language}
            viewRestaurantId={viewRestaurantId}
            series={series}
            seriesLoading={loading}
            initialCategoryId={targetFor('academy')?.id ?? null}
            initialItemId={targetFor('academy')?.card ?? null}
            onPlayVideo={(video, seriesTitle) => setActiveVideo({ video, seriesTitle })}
            onGoToPath={() => goSub('path')}
          />
        ) : sub === 'menu' ? (
          <MenuTab
            language={language}
            initialCategoryId={targetFor('menu')?.id ?? null}
            initialItemId={targetFor('menu')?.card ?? null}
            viewRestaurantId={viewRestaurantId}
            canShare={isMgmt}
          />
        ) : sub === 'systems' ? (
          <MenuTab
            language={language}
            initialCategoryId={targetFor('systems')?.id ?? null}
            initialItemId={targetFor('systems')?.card ?? null}
            viewRestaurantId={viewRestaurantId}
            zone="systems"
            canShare={isMgmt}
          />
        ) : sub === 'quizzes' ? (
          <QuizzesTab language={language} />
        ) : loading ? (
          <div className="text-center text-sm text-whg-dim py-12">
            {isES ? 'Cargando…' : 'Loading…'}
          </div>
        ) : series.length === 0 ? (
          <div className="text-center py-12 bg-whg-card/60 rounded-2xl border border-whg-line">
            <div className="text-4xl mb-3">📺</div>
            <p className="text-sm text-whg-dim font-medium">
              {isES ? 'Aún no hay videos.' : 'No videos yet.'}
            </p>
            <p className="text-xs text-whg-dim/70 mt-1">
              {isES ? 'Vuelve pronto.' : 'Check back soon.'}
            </p>
          </div>
        ) : (
          (() => {
            // Managers see their own band first — the API only sends
            // 'mgmt' series to management, so this renders for them alone.
            const mgmtSeries = series.filter((s) => s.audience === 'mgmt');
            const teamSeries = series.filter((s) => s.audience !== 'mgmt');
            const renderSeries = (s: Series) => {
              const isOpen = openSeries.has(s.id);
              return (
                <div
                  key={s.id}
                  className="bg-whg-card rounded-2xl border border-whg-line shadow-sm overflow-hidden"
                >
                  {/* Series header (tap to toggle) */}
                  <button
                    onClick={() => toggleSeries(s.id)}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm md:text-base font-bold text-whg-snow truncate">
                        {s.title}
                      </h2>
                      {s.blurb && (
                        <p className="text-[11px] md:text-xs text-whg-dim mt-0.5 line-clamp-2">
                          {s.blurb}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-whg-dim/70 uppercase tracking-wide">
                        {s.videos.length} {s.videos.length === 1 ? (isES ? 'video' : 'video') : (isES ? 'videos' : 'videos')}
                      </span>
                      <svg
                        width="16" height="16" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round"
                        className={`text-whg-dim transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </button>

                  {/* Video list */}
                  {isOpen && (
                    <div className="border-t border-whg-line divide-y divide-whg-line">
                      {s.videos.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-whg-dim">
                          {isES ? 'Aún no hay videos en esta serie.' : 'No videos in this series yet.'}
                        </div>
                      ) : (
                        s.videos.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => setActiveVideo({ video: v, seriesTitle: s.title })}
                            className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
                          >
                            {/* Thumbnail from YouTube */}
                            <div className="relative flex-shrink-0 w-24 h-14 rounded-lg overflow-hidden bg-whg-card2">
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
                              <p className="text-sm font-semibold text-whg-snow/90 line-clamp-2">
                                {v.title}
                              </p>
                              {v.description && (
                                <p className="text-[11px] text-whg-dim mt-0.5 line-clamp-1">
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
            };
            return (
              <div className="space-y-4">
                {mgmtSeries.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-whg-gold">
                      🔒 {isES ? 'Capacitación de Gerentes' : 'Manager Training'}
                    </p>
                    {mgmtSeries.map(renderSeries)}
                    {teamSeries.length > 0 && (
                      <p className="text-[10px] font-bold uppercase tracking-widest text-whg-dim pt-2">
                        {isES ? 'Biblioteca del Equipo' : 'Team Library'}
                      </p>
                    )}
                  </>
                )}
                {teamSeries.map(renderSeries)}
              </div>
            );
          })()
        )}
      </div>

      {/* Full-screen player */}
      {activeVideo && (
        <VideoPlayer
          video={activeVideo.video}
          seriesTitle={activeVideo.seriesTitle}
          isES={isES}
          shareUrl={isMgmt ? buildVideoUrl(activeVideo.video.id) : null}
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
  shareUrl = null,
  onClose,
}: {
  video: Video;
  seriesTitle: string;
  isES: boolean;
  /** Management: copy a link that opens this video (for Asana tasks). */
  shareUrl?: string | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
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
        {shareUrl && (
          <button
            onClick={async () => {
              if (await copyText(shareUrl)) {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }
            }}
            className="tap-highlight flex-shrink-0 text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full px-3 py-1.5"
          >
            {copied ? (isES ? '✓ Copiado' : '✓ Copied') : (isES ? '🔗 Enlace' : '🔗 Link')}
          </button>
        )}
      </div>

      {/* Player.
          Portrait: 16:9 player at top of screen, description scrollable below.
          Landscape: 16:9 lock is dropped — the player flex-1's to fill the
          full remaining height (the video itself stays 16:9, with letter-
          boxing handled by the YouTube embed). Description is hidden
          because there's no vertical room for it. This avoids the iOS
          zoom-in artifact where rotating from portrait kept the iframe at
          the old portrait size and YouTube's player CSS cropped to fit. */}
      <div className="flex-1 flex flex-col items-stretch overflow-y-auto landscape:overflow-hidden">
        <div className="w-full max-w-4xl mx-auto aspect-video landscape:aspect-auto landscape:flex-1 landscape:max-w-none bg-black">
          <iframe
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        {video.description && (
          <div className="w-full max-w-4xl mx-auto px-4 py-4 text-sm text-white/80 leading-relaxed whitespace-pre-wrap landscape:hidden">
            {video.description}
          </div>
        )}
      </div>
    </div>
  );
}
