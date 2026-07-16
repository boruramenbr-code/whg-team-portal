'use client';

import { useEffect, useState, useCallback } from 'react';

/* ───────── Types (mirror /api/training/path) ───────── */
export interface PathModule {
  id: string;
  title: string;
  title_es: string | null;
  description: string | null;
  description_es: string | null;
  module_type: 'video_series' | 'menu_category' | 'quiz' | 'photo_test' | 'skill' | 'note';
  ref_id: string | null;
  completion: 'self' | 'exam' | 'manager';
  required: boolean;
  done: boolean;
  completed_at: string | null;
  signed_off: boolean;
  available: boolean;
}

export interface PathTrack {
  id: string;
  title: string;
  title_es: string | null;
  description: string | null;
  description_es: string | null;
  emoji: string | null;
  level: 'foundations' | 'department' | 'position' | 'certification' | 'ongoing';
  modules: PathModule[];
  required_total: number;
  required_done: number;
  pct: number;
}

interface PathResponse {
  user: { id: string; full_name: string; onboarding_category: string | null; position_slug: string | null };
  tracks: PathTrack[];
  floor_ready?: {
    ready: boolean;
    via: 'completed' | 'override' | null;
    override: { granted_by_name: string | null; note: string | null; created_at: string } | null;
  };
}

interface Props {
  language: 'en' | 'es';
  /** Jump to a sibling Training sub-tab. refId deep-links (e.g. a menu
   *  module opens directly inside its category). */
  onGoTo: (sub: 'videos' | 'menu' | 'quizzes', refId?: string | null) => void;
}

const LEVEL_META: Record<PathTrack['level'], { en: string; es: string }> = {
  foundations: { en: 'Level 1 · Foundations', es: 'Nivel 1 · Fundamentos' },
  department: { en: 'Level 2 · Department Core', es: 'Nivel 2 · Núcleo de Departamento' },
  position: { en: 'Level 3 · Your Position', es: 'Nivel 3 · Tu Posición' },
  certification: { en: 'Level 4 · Certifications', es: 'Nivel 4 · Certificaciones' },
  ongoing: { en: 'Always · Ongoing Growth', es: 'Siempre · Crecimiento Continuo' },
};

/* ───────── My Path — the staff training ladder ─────────
 * Personal view: foundations → department core → position track →
 * certifications, each with a progress bar. Self modules check off in
 * place; exam modules deep-link to Quizzes; skills tell you to grab a
 * manager. The Library (Videos | Menu | Quizzes) stays open to everyone —
 * this page only decides what's REQUIRED for you.
 */
export default function TrainingPathTab({ language, onGoTo }: Props) {
  const isES = language === 'es';
  const [data, setData] = useState<PathResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/training/path');
      if (!r.ok) return;
      setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const label = (en: string, es: string | null | undefined) => (isES && es ? es : en);

  const markDone = async (m: PathModule) => {
    setBusy(m.id);
    try {
      const r = await fetch('/api/training/path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: m.id }),
      });
      if (r.ok) await load();
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white/60 rounded-2xl p-4 animate-pulse">
            <div className="h-4 bg-gray-200/60 rounded w-1/3 mb-3" />
            <div className="h-2 bg-gray-200/60 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.tracks.length === 0) {
    return (
      <div className="text-center py-12 bg-white/60 rounded-2xl border border-white/40">
        <div className="text-4xl mb-3">🧗</div>
        <p className="text-sm text-gray-500 font-medium">
          {isES ? 'Tu camino de entrenamiento se está construyendo.' : 'Your training path is being built.'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {isES
            ? 'Mientras tanto, explora los Videos, el Menú y los Cuestionarios.'
            : 'In the meantime, explore Videos, Menu, and Quizzes above.'}
        </p>
      </div>
    );
  }

  // Overall progress across required modules of every track.
  const totalReq = data.tracks.reduce((n, t) => n + t.required_total, 0);
  const totalDone = data.tracks.reduce((n, t) => n + t.required_done, 0);
  const overallPct = totalReq === 0 ? 0 : Math.round((totalDone / totalReq) * 100);
  const allDone = totalReq > 0 && totalDone === totalReq;

  // The next thing to do — first incomplete required module top-down.
  const nextModule = data.tracks.flatMap((t) => t.modules.filter((m) => m.required && !m.done && m.available))[0];

  let lastLevel: string | null = null;

  return (
    <div className="space-y-4">
      {/* Overall header */}
      <div className={`rounded-2xl p-4 shadow-sm ${allDone ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white' : 'bg-[#1B3A6B] text-white'}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
              {isES ? 'Tu Camino' : 'Your Path'}
            </p>
            <p className="text-lg font-bold truncate">
              {allDone
                ? (isES ? '¡Entrenamiento estándar completo! 🏆' : 'Standard training complete! 🏆')
                : nextModule
                  ? `${isES ? 'Siguiente' : 'Up next'}: ${label(nextModule.title, nextModule.title_es)}`
                  : (isES ? 'Sigue así' : 'Keep climbing')}
            </p>
            {allDone && (
              <p className="text-[11px] text-white/80 mt-0.5">
                {isES
                  ? 'Aquí el crecimiento no termina — sigue afilando, sigue subiendo.'
                  : 'Growth doesn’t stop here — keep sharpening, keep climbing.'}
              </p>
            )}
            {!allDone && data.floor_ready?.via === 'override' && (
              <p className="text-[11px] text-emerald-200 mt-0.5">
                🎯 {isES
                  ? 'Listo para el piso por decisión de tu gerente — termina tu camino de todos modos 💪'
                  : 'Floor-Ready by your manager’s call — finish your path anyway 💪'}
              </p>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-2xl font-bold">{overallPct}%</p>
            <p className="text-[10px] text-white/60">{totalDone}/{totalReq} {isES ? 'requeridos' : 'required'}</p>
          </div>
        </div>
        <div className="mt-3 w-full bg-white/20 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-amber-400 transition-all" style={{ width: `${overallPct}%` }} />
        </div>
      </div>

      {/* Tracks grouped by level */}
      {data.tracks.map((t) => {
        const levelHeader = t.level !== lastLevel;
        lastLevel = t.level;
        return (
          <div key={t.id}>
            {levelHeader && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 mt-1">
                {isES ? LEVEL_META[t.level].es : LEVEL_META[t.level].en}
              </p>
            )}
            <TrackCard
              track={t}
              isES={isES}
              label={label}
              busy={busy}
              onMarkDone={markDone}
              onGoTo={onGoTo}
            />
          </div>
        );
      })}

      <p className="text-[11px] text-gray-400 text-center pt-1">
        {isES
          ? 'Todo el contenido sigue abierto en Videos · Menú · Cuestionarios — tu camino solo marca lo requerido para tu posición.'
          : 'Everything stays open under Videos · Menu · Quizzes — your path just marks what’s required for your position.'}
      </p>
    </div>
  );
}

/* ───────── One track (collapsible) ───────── */
function TrackCard({
  track, isES, label, busy, onMarkDone, onGoTo,
}: {
  track: PathTrack;
  isES: boolean;
  label: (en: string, es: string | null | undefined) => string;
  busy: string | null;
  onMarkDone: (m: PathModule) => void;
  onGoTo: (sub: 'videos' | 'menu' | 'quizzes', refId?: string | null) => void;
}) {
  const complete = track.required_total > 0 && track.required_done === track.required_total;
  const [open, setOpen] = useState(!complete);
  const empty = track.modules.length === 0;

  return (
    <div className="bg-white rounded-2xl border border-white/60 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="tap-highlight w-full px-4 py-3 flex items-center gap-3 text-left"
      >
        <span className="text-xl flex-shrink-0" aria-hidden>{track.emoji || '🎯'}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#1B3A6B] truncate">{label(track.title, track.title_es)}</p>
          {empty ? (
            <p className="text-[11px] text-gray-400 mt-0.5">
              {isES ? 'Contenido en camino.' : 'Content on the way.'}
            </p>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all ${complete ? 'bg-emerald-500' : 'bg-[#2E86C1]'}`}
                  style={{ width: `${track.pct}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-gray-400 flex-shrink-0">
                {track.required_done}/{track.required_total}
              </span>
            </div>
          )}
        </div>
        <div className="flex-shrink-0 flex items-center gap-1.5">
          {complete && <span className="text-emerald-500 text-base" aria-hidden>✓</span>}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {open && !empty && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {track.modules.map((m) => (
            <ModuleRow key={m.id} m={m} isES={isES} label={label} busy={busy} onMarkDone={onMarkDone} onGoTo={onGoTo} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────── One module row ───────── */
function ModuleRow({
  m, isES, label, busy, onMarkDone, onGoTo,
}: {
  m: PathModule;
  isES: boolean;
  label: (en: string, es: string | null | undefined) => string;
  busy: string | null;
  onMarkDone: (m: PathModule) => void;
  onGoTo: (sub: 'videos' | 'menu' | 'quizzes', refId?: string | null) => void;
}) {
  const [showDesc, setShowDesc] = useState(false);

  const typeIcon =
    m.module_type === 'video_series' ? '🎬' :
    m.module_type === 'menu_category' ? '🍣' :
    m.module_type === 'quiz' || m.module_type === 'photo_test' ? '📝' :
    m.module_type === 'skill' ? '🤝' : '📖';

  const action = (() => {
    if (m.done) return null;
    if (m.module_type === 'menu_category') {
      return (
        <button onClick={() => onGoTo('menu', m.ref_id)} className="text-[11px] font-bold text-[#2E86C1] hover:underline flex-shrink-0 px-2 py-2">
          {isES ? 'Abrir Sección →' : 'Open Section →'}
        </button>
      );
    }
    if (m.module_type === 'video_series') {
      return (
        <button onClick={() => onGoTo('videos')} className="text-[11px] font-bold text-[#2E86C1] hover:underline flex-shrink-0 px-2 py-2">
          {isES ? 'Ver Videos →' : 'Watch →'}
        </button>
      );
    }
    if (m.module_type === 'quiz' || m.module_type === 'photo_test') {
      return m.available ? (
        <button onClick={() => onGoTo('quizzes')} className="text-[11px] font-bold text-amber-600 hover:underline flex-shrink-0 px-2 py-2">
          {isES ? 'Tomar Examen →' : 'Take Exam →'}
        </button>
      ) : (
        <span className="text-[10px] text-gray-400 flex-shrink-0">{isES ? 'Examen en camino' : 'Exam coming'}</span>
      );
    }
    if (m.completion === 'manager') {
      return (
        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-1 flex-shrink-0">
          {isES ? 'Firma de gerente' : 'Manager sign-off'}
        </span>
      );
    }
    return null;
  })();

  return (
    <div className="px-4 py-2.5">
      <div className="flex items-center gap-2.5">
        {/* Status circle — self modules are tappable */}
        {m.completion === 'self' && !m.done ? (
          <button
            onClick={() => onMarkDone(m)}
            disabled={busy === m.id}
            aria-label={isES ? 'Marcar como hecho' : 'Mark as done'}
            className="tap-highlight flex-shrink-0 w-7 h-7 rounded-full border-2 border-gray-300 hover:border-emerald-500 transition-colors flex items-center justify-center disabled:opacity-40"
          >
            {busy === m.id && <span className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" />}
          </button>
        ) : (
          <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm ${
            m.done ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
          }`} aria-hidden>
            {m.done ? '✓' : typeIcon}
          </span>
        )}

        <button onClick={() => setShowDesc((v) => !v)} className="min-w-0 flex-1 text-left">
          <p className={`text-sm leading-snug ${m.done ? 'text-gray-400 line-through' : 'text-gray-800 font-medium'}`}>
            {label(m.title, m.title_es)}
            {!m.required && (
              <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide text-gray-400 no-underline">
                {isES ? 'opcional' : 'optional'}
              </span>
            )}
          </p>
          {m.done && m.signed_off && (
            <p className="text-[10px] text-emerald-600">{isES ? '✓ Firmado por gerente' : '✓ Manager signed off'}</p>
          )}
        </button>

        {action}
      </div>
      {showDesc && (m.description || m.description_es) && (
        <p className="text-xs text-gray-500 leading-relaxed mt-1.5 ml-9">
          {label(m.description ?? '', m.description_es)}
        </p>
      )}
    </div>
  );
}
