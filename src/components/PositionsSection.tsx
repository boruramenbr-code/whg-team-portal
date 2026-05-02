'use client';

import { useEffect, useState } from 'react';

interface Position {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  department: 'FOH' | 'BOH' | 'Management';
  description: string | null;
  sort_order: number;
}

interface Props {
  language: 'en' | 'es';
}

/**
 * PositionsSection — full-page tab content showing the position catalog.
 *
 * Renders the entire FOH / BOH / Management grid as the active tab.
 * Tapping a position opens PositionDetailModal with the description.
 *
 * This is the staff-facing "Team Positions" tab in the bottom nav,
 * placed next to Home. It's intentionally a separate tab so daily
 * content (pre-shift, owner messages, birthdays) stays uncluttered
 * on the Home feed while position browsing is one tap away.
 */
export default function PositionsSection({ language }: Props) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Position | null>(null);
  const isES = language === 'es';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/positions', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setPositions(data.positions || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const byDept = {
    FOH: positions.filter((p) => p.department === 'FOH'),
    BOH: positions.filter((p) => p.department === 'BOH'),
    Management: positions.filter((p) => p.department === 'Management'),
  };
  const deptLabels = isES
    ? { FOH: 'Frente de Casa', BOH: 'Cocina', Management: 'Gerencia' }
    : { FOH: 'Front of House', BOH: 'Back of House', Management: 'Management' };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#C5D3E2] via-[#CDDAE7] to-[#D5E0EB]">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-4">

        {/* ── Header ── */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-[#1B3A6B] flex items-center gap-2">
            <span>🧭</span>
            {isES ? 'Posiciones del Equipo' : 'Team Positions'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isES
              ? 'Toca una posición para ver qué hace.'
              : 'Tap a position to see what it does.'}
          </p>
        </div>

        {/* ── Loading / empty states ── */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-sm text-gray-500">
            {isES ? 'Cargando…' : 'Loading…'}
          </div>
        )}

        {!loading && positions.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-sm text-gray-500">
            {isES ? 'No hay posiciones todavía.' : 'No positions yet.'}
          </div>
        )}

        {/* ── Department-grouped grids ── */}
        {!loading && positions.length > 0 && (['FOH', 'BOH', 'Management'] as const).map((dept) => {
          const items = byDept[dept];
          if (items.length === 0) return null;
          return (
            <div key={dept} className="bg-white rounded-2xl shadow-sm p-4">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-3 px-1">
                {deptLabels[dept]}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {items.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActive(p)}
                    className="tap-highlight text-left bg-gray-50 hover:bg-[#EEF3F9] active:bg-[#DCE6F1] border border-gray-200 rounded-xl px-3 py-3 transition-colors flex items-center gap-2.5"
                  >
                    <span className="text-2xl flex-shrink-0">{p.emoji}</span>
                    <span className="text-sm font-semibold text-[#1B3A6B] leading-tight">
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Detail modal ── */}
      {active && (
        <PositionDetailModal
          position={active}
          language={language}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}

/* ───────── Position detail modal ───────── */
function PositionDetailModal({
  position,
  language,
  onClose,
}: {
  position: Position;
  language: 'en' | 'es';
  onClose: () => void;
}) {
  const isES = language === 'es';
  const hasDescription = !!position.description?.trim();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const deptLabel = (() => {
    const map = isES
      ? { FOH: 'Frente de Casa', BOH: 'Cocina', Management: 'Gerencia' }
      : { FOH: 'Front of House', BOH: 'Back of House', Management: 'Management' };
    return map[position.department];
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[88vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-4xl flex-shrink-0">{position.emoji}</span>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-[#1B3A6B] leading-tight truncate">
                {position.name}
              </h3>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mt-0.5">
                {deptLabel}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
            aria-label={isES ? 'Cerrar' : 'Close'}
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 flex-1">
          {hasDescription ? (
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {position.description}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-3xl mb-2">📝</div>
              <p className="text-sm font-medium">
                {isES ? 'Descripción próximamente.' : 'Description coming soon.'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {isES
                  ? 'Habla con tu gerente si tienes preguntas sobre esta posición.'
                  : 'Talk to your manager if you have questions about this position.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
