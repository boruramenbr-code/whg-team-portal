'use client';

import { useEffect, useState } from 'react';
import MenuTab from './MenuTab';
import { PILLARS, type Pillar } from '@/lib/menu-constants';
import { CALCULATORS, CalculatorSheet, type CalculatorKey } from './ManagerCalculators';
import { VideoPlayer, type Series, type Video } from './TrainingTab';
import { buildVideoUrl, type TrainingLink } from '@/lib/training-links';

/* ───────── Manager Resources → 🎓 Academy ─────────
 * Loads the video library itself and hosts the player, so the Academy
 * lives in Manager Resources (moved from Mission Control, Sept 2026). Opens a shared
 * Academy lesson or manager video link when one arrives. */
export function AcademyInMissionControl({
  viewRestaurantId = null,
  link = null,
}: {
  viewRestaurantId?: string | null;
  link?: TrainingLink | null;
}) {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<{ video: Video; seriesTitle: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/training');
        if (!r.ok) return;
        const j = await r.json();
        if (cancelled) return;
        const list: Series[] = j.series || [];
        setSeries(list);
        if (link?.kind === 'video') {
          for (const s of list) {
            const v = s.videos.find((x) => x.id === link.id);
            if (v) { setActive({ video: v, seriesTitle: s.title }); break; }
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [link]);

  const lesson = link?.kind === 'lesson' && link.zone === 'academy' ? link : null;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="rounded-3xl bg-gradient-to-b from-whg-card to-whg-night2 border border-whg-line p-4 md:p-6">
        <ManagerAcademyTab
          language="en"
          viewRestaurantId={viewRestaurantId}
          series={series}
          seriesLoading={loading}
          initialCategoryId={lesson?.id ?? null}
          initialItemId={lesson?.card ?? null}
          onPlayVideo={(video, seriesTitle) => setActive({ video, seriesTitle })}
          onGoToPath={() => { window.location.href = '/dashboard'; }}
        />
      </div>
      {active && (
        <VideoPlayer
          video={active.video}
          seriesTitle={active.seriesTitle}
          isES={false}
          shareUrl={buildVideoUrl(active.video.id, 'resources')}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}

interface Props {
  language: 'en' | 'es';
  viewRestaurantId?: string | null;
  /** The Training video library (the API only sends manager series to management). */
  series: Series[];
  seriesLoading: boolean;
  /** Shared link / Path module: open this lesson (and card). */
  initialCategoryId?: string | null;
  initialItemId?: string | null;
  onPlayVideo: (video: Video, seriesTitle: string) => void;
  onGoToPath: () => void;
}

type PillarFilter = Pillar | 'all';

/* ───────── 🎓 Manager Academy (Manager Resources → Academy, management only) ─────────
 *
 * "Teach it once. Build it into the system. Use it everywhere." Not a new
 * training system — a manager-facing view over what already exists:
 *   • Watch  — managers-only video series, grouped by pillar
 *   • Learn  — Academy lesson sections (menu_categories zone 'academy')
 *   • Practice — the two calculators
 * Completion still lives on My Path (Management tracks); execution lives in
 * Asana, whose tasks link straight to a lesson here.
 */
export default function ManagerAcademyTab({
  language,
  viewRestaurantId = null,
  series,
  seriesLoading,
  initialCategoryId = null,
  initialItemId = null,
  onPlayVideo,
  onGoToPath,
}: Props) {
  const isES = language === 'es';
  const t = (en: string, es: string) => (isES ? es : en);
  const [pillar, setPillar] = useState<PillarFilter>('all');
  const [tool, setTool] = useState<CalculatorKey | null>(null);
  const [path, setPath] = useState<{ done: number; total: number; hasRoleTrack: boolean } | null>(null);

  // Manager path progress = department + position tracks on My Path.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/training/path');
        if (!r.ok) return;
        const j = await r.json();
        const tracks: { level: string; required_total: number; required_done: number }[] = j.tracks || [];
        const role = tracks.filter((tr) => tr.level === 'department' || tr.level === 'position');
        if (!cancelled) {
          setPath({
            done: role.reduce((n, tr) => n + tr.required_done, 0),
            total: role.reduce((n, tr) => n + tr.required_total, 0),
            hasRoleTrack: role.length > 0,
          });
        }
      } catch { /* the card just skips the progress line */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const managerSeries = series.filter((s) => s.audience === 'mgmt');
  const shownVideos = managerSeries
    .filter((s) => pillar === 'all' || s.pillar === pillar)
    .flatMap((s) => s.videos.map((v) => ({ v, s })));
  const shownTools = CALCULATORS.filter((c) => pillar === 'all' || c.pillar === pillar);
  const activePillar = PILLARS.find((p) => p.key === pillar);
  const pathPct = path && path.total > 0 ? Math.round((path.done / path.total) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Intro */}
      <div className="rounded-2xl p-4 bg-whg-card2 border border-whg-gold/30 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-widest text-whg-gold">
          🎓 {t('Manager Academy', 'Academia de Gerentes')} · 🔒 {t('Managers only', 'Solo gerentes')}
        </p>
        <p className="text-lg font-bold text-whg-snow mt-0.5 leading-snug">
          {t('Teach it once. Learn it here. Use it everywhere.', 'Se enseña una vez. Se aprende aquí. Se usa en todas partes.')}
        </p>
        <p className="text-xs text-whg-dim mt-1">
          {t(
            'Watch it, read it, practice it — and come back whenever you need a refresher.',
            'Míralo, léelo, practícalo — y regresa cuando necesites repasar.'
          )}
        </p>
        {path && (path.hasRoleTrack ? (
          <button onClick={onGoToPath} className="tap-highlight mt-3 w-full text-left">
            <div className="flex items-center justify-between text-[11px] font-bold text-whg-dim">
              <span>{t('Your manager path', 'Tu camino de gerente')}</span>
              <span className="text-whg-snow">{path.done}/{path.total} →</span>
            </div>
            <div className="mt-1.5 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-whg-gold transition-all" style={{ width: `${pathPct}%` }} />
            </div>
          </button>
        ) : (
          <p className="mt-3 text-[11px] text-whg-dim/80">
            {t(
              'No manager path yet — a management position hasn’t been set for you in People.',
              'Aún no hay camino de gerente — falta asignarte un puesto de gerencia en Personal.'
            )}
          </p>
        ))}
      </div>

      {/* Pillars */}
      <div>
        <div className="flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {([{ key: 'all' as const, emoji: '✨', en: 'All', es: 'Todo' }, ...PILLARS]).map((p) => (
            <button
              key={p.key}
              onClick={() => setPillar(p.key)}
              className={`tap-highlight flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition-colors ${
                pillar === p.key
                  ? 'bg-whg-gold text-whg-goldink shadow-sm'
                  : 'bg-white/10 text-whg-dim hover:bg-white/20'
              }`}
            >
              {p.emoji} {isES ? p.es : p.en}
            </button>
          ))}
        </div>
        {activePillar && (
          <p className="text-xs text-whg-dim mt-2">{isES ? activePillar.blurbEs : activePillar.blurb}</p>
        )}
      </div>

      {/* Watch */}
      <section>
        <p className="text-[10px] font-bold uppercase tracking-widest text-whg-dim mb-2">▶ {t('Watch', 'Mira')}</p>
        {seriesLoading ? (
          <div className="flex gap-3 overflow-hidden">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-48 animate-pulse">
                <div className="aspect-video rounded-xl bg-white/10" />
                <div className="h-3 bg-white/10 rounded w-3/4 mt-2" />
              </div>
            ))}
          </div>
        ) : shownVideos.length === 0 ? (
          <p className="text-xs text-whg-dim/80 bg-whg-card/60 border border-whg-line rounded-xl px-3 py-3">
            {pillar === 'all'
              ? t('No manager videos yet.', 'Aún no hay videos para gerentes.')
              : t('No videos for this pillar yet.', 'Aún no hay videos en este pilar.')}
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
            {shownVideos.map(({ v, s }) => (
              <button
                key={v.id}
                onClick={() => onPlayVideo(v, s.title)}
                className="tap-highlight flex-shrink-0 w-48 text-left"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-whg-card2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://i.ytimg.com/vi/${v.youtube_id}/mqdefault.jpg`}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#1B3A6B">
                        <polygon points="6 3 20 12 6 21 6 3" />
                      </svg>
                    </div>
                  </div>
                  {v.duration && (
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-semibold px-1 rounded">
                      {v.duration}
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-whg-snow/90 mt-1.5 line-clamp-2">{v.title}</p>
                <p className="text-[10px] text-whg-dim truncate">{s.title}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Learn */}
      <section>
        <p className="text-[10px] font-bold uppercase tracking-widest text-whg-dim mb-2">📚 {t('Learn', 'Aprende')}</p>
        <MenuTab
          language={language}
          zone="academy"
          pillar={pillar}
          viewRestaurantId={viewRestaurantId}
          initialCategoryId={initialCategoryId}
          initialItemId={initialItemId}
          canShare
        />
      </section>

      {/* Practice */}
      {shownTools.length > 0 && (
        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest text-whg-dim mb-2">🧮 {t('Practice', 'Practica')}</p>
          <div className="grid grid-cols-2 gap-3">
            {shownTools.map((c) => (
              <button
                key={c.key}
                onClick={() => setTool(c.key)}
                className="tap-highlight bg-whg-card border border-whg-line rounded-2xl p-3 text-left hover:bg-whg-card2 transition-colors"
              >
                <div className="text-2xl" aria-hidden>{c.emoji}</div>
                <p className="text-sm font-bold text-whg-snow mt-1 leading-snug">{isES ? c.titleEs : c.title}</p>
                <p className="text-[11px] text-whg-dim mt-0.5 leading-snug">{isES ? c.blurbEs : c.blurb}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <p className="text-[11px] text-whg-dim/70 text-center">
        {t(
          'Lessons on payroll, taxes, software, and the law show when they were last reviewed. Something look out of date? Tell the owner.',
          'Las lecciones de nómina, impuestos, sistemas y leyes muestran cuándo se revisaron. ¿Algo parece viejo? Avísale al dueño.'
        )}
      </p>

      {tool && <CalculatorSheet which={tool} language={language} onClose={() => setTool(null)} />}
    </div>
  );
}
