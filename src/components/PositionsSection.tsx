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
 * PositionsSection — staff-facing position catalog.
 *
 * 2-column grid of icon buttons grouped by department (FOH / BOH / Management).
 * Tapping a button opens a modal with the position description.
 *
 * Pay rates are NOT shown here — they live in the manager-only Pay Rates tab.
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

  if (loading || positions.length === 0) return null;

  // Group by department
  const byDept = {
    FOH: positions.filter((p) => p.department === 'FOH'),
    BOH: positions.filter((p) => p.department === 'BOH'),
    Management: positions.filter((p) => p.department === 'Management'),
  };

  const deptLabels = isES
    ? { FOH: 'Frente de Casa', BOH: 'Cocina', Management: 'Gerencia' }
    : { FOH: 'Front of House', BOH: 'Back of House', Management: 'Management' };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2C4F8A] px-5 py-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>🧭</span>
            {isES ? 'Posiciones del Equipo' : 'Team Positions'}
          </h2>
          <p className="text-xs text-white/80 mt-0.5">
            {isES
              ? 'Toca una posición para ver qué hace.'
              : 'Tap a position to see what it does.'}
          </p>
        </div>

        <div className="p-4 space-y-5">
          {(['FOH', 'BOH', 'Management'] as const).map((dept) => {
            const items = byDept[dept];
            if (items.length === 0) return null;
            return (
              <div key={dept}>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 px-1">
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
      </div>

      {active && (
        <PositionDetailModal
          position={active}
          language={language}
          onClose={() => setActive(null)}
        />
      )}
    </>
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

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
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
        {/* Drag handle on mobile */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
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

        {/* Body */}
        <div className="overflow-y-auto px-5 py-5 flex-1">
          {hasDescription ? (
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {position.description}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-3xl mb-2">📝</div>
              <p className="text-sm font-medium">
                {isES
                  ? 'Descripción próximamente.'
                  : 'Description coming soon.'}
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
