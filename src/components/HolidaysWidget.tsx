'use client';

import { useEffect, useState } from 'react';

interface Holiday {
  id: string;
  restaurant_id: string | null;
  date: string;
  name: string;
  name_es: string | null;
  type: 'closed' | 'all_hands';
  notes: string | null;
  notes_es: string | null;
  restaurants: { name: string } | null;
}

interface Props {
  language: 'en' | 'es';
}

/**
 * Upcoming Holidays widget — shows the next ~90 days of holidays relevant to
 * the user's restaurant(s). Color-coded:
 *   🟢 closed     — we close, rest with family
 *   🔴 all_hands  — busy day, no PTO requests, plan to work
 */
export default function HolidaysWidget({ language }: Props) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const isES = language === 'es';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/holidays', { cache: 'no-store' });
        if (!r.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const d = await r.json();
        if (!cancelled) setHolidays(d.holidays || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || holidays.length === 0) return null;

  const formatDate = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(isES ? 'es-MX' : undefined, {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const daysUntil = (iso: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(iso + 'T00:00:00');
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getName = (h: Holiday) => (isES && h.name_es ? h.name_es : h.name);
  const getNotes = (h: Holiday) => (isES && h.notes_es ? h.notes_es : h.notes);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
          <span className="text-base">📅</span>
          {isES ? 'Días Importantes' : 'Upcoming Holidays'}
        </h2>
      </div>

      <div className="space-y-2">
        {holidays.map((h) => {
          const isClosed = h.type === 'closed';
          const days = daysUntil(h.date);
          const dayLabel =
            days === 0 ? (isES ? 'Hoy' : 'Today!') :
            days === 1 ? (isES ? 'Mañana' : 'Tomorrow') :
            (isES ? `en ${days} días` : `in ${days} days`);

          return (
            <div
              key={h.id}
              className={`rounded-2xl px-4 py-3 border-l-4 shadow-sm flex items-start gap-3 ${
                isClosed
                  ? 'bg-emerald-50 border-emerald-400'
                  : 'bg-rose-50 border-rose-400'
              }`}
            >
              <span className="text-xl mt-0.5">{isClosed ? '🟢' : '🔴'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <p className={`font-bold text-sm ${isClosed ? 'text-emerald-900' : 'text-rose-900'}`}>
                    {getName(h)}
                  </p>
                  <p className={`text-xs ${isClosed ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatDate(h.date)} · {dayLabel}
                  </p>
                </div>
                <p className={`text-[11px] font-bold uppercase tracking-wide mt-0.5 ${isClosed ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isClosed
                    ? (isES ? '🌿 Cerrado — descanso con familia' : '🌿 Closed — rest with family')
                    : (isES ? '⚡ Día ocupado — todos trabajando' : '⚡ Big day — all hands on deck')}
                </p>
                {h.restaurants && h.restaurant_id && (
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {h.restaurants.name}
                  </p>
                )}
                {getNotes(h) && (
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{getNotes(h)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
