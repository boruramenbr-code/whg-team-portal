'use client';

import { useEffect, useState } from 'react';
import { getHolidayStyle, HolidayType } from '@/lib/holiday-types';

interface Holiday {
  id: string;
  restaurant_id: string | null;
  start_date: string;
  end_date: string;
  name: string;
  name_es: string | null;
  type: HolidayType;
  notes: string | null;
  notes_es: string | null;
  restaurants: { name: string } | null;
}

interface Props {
  language: 'en' | 'es';
}

/**
 * Upcoming Holidays and Events — shows the next ~90 days of dates relevant to
 * the user's restaurant(s). Five types, color-coded:
 *   🌿 closed     — we shut, rest with family (green)
 *   🌤️ slow       — lighter than usual (sky blue)
 *   📅 normal     — mark your calendar (gray)
 *   ⚡ busy       — heads up, busier than usual (amber)
 *   🔥 all_hands  — all hands on deck (red)
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

  const fmtShort = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(isES ? 'es-MX' : undefined, {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  };
  const fmtDayOnly = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(isES ? 'es-MX' : undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const dayDelta = (iso: string) => {
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
          {isES ? 'Días Importantes y Eventos' : 'Upcoming Holidays and Events'}
        </h2>
      </div>

      <div className="space-y-2">
        {holidays.map((h) => {
          const style = getHolidayStyle(h.type);
          const isMultiDay = h.start_date !== h.end_date;
          const startDelta = dayDelta(h.start_date);
          const endDelta = dayDelta(h.end_date);
          const isActive = startDelta <= 0 && endDelta >= 0;

          // Date range display
          const dateLabel = isMultiDay
            ? `${fmtDayOnly(h.start_date)} – ${fmtDayOnly(h.end_date)}`
            : fmtShort(h.start_date);

          // Status label — different for active vs upcoming, single vs multi-day
          let statusLabel: string;
          if (isActive && isMultiDay) {
            const totalDays = endDelta - startDelta + 1;
            const dayN = -startDelta + 1; // which day of the event we're on
            statusLabel = isES
              ? `Día ${dayN} de ${totalDays}`
              : `Day ${dayN} of ${totalDays}`;
          } else if (isActive) {
            statusLabel = isES ? 'Hoy' : 'Today!';
          } else if (startDelta === 1) {
            statusLabel = isES ? 'Mañana' : 'Tomorrow';
          } else {
            statusLabel = isES ? `en ${startDelta} días` : `in ${startDelta} days`;
          }

          return (
            <div
              key={h.id}
              className={`rounded-2xl px-4 py-3 border-l-4 shadow-sm flex items-start gap-3 ${style.bgClass} ${style.borderClass}`}
            >
              <span className="text-xl mt-0.5" aria-hidden>{style.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <p className={`font-bold text-sm ${style.textClass}`}>
                    {getName(h)}
                  </p>
                  <p className={`text-xs ${style.subTextClass}`}>
                    {dateLabel} · {statusLabel}
                  </p>
                </div>
                <p className={`text-[11px] font-bold uppercase tracking-wide mt-0.5 ${style.subTextClass}`}>
                  {style.emoji} {isES ? style.bannerEs : style.bannerEn}
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
