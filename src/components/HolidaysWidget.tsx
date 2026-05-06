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
 * the user's restaurant(s).
 *
 * Layout:
 *   • Section "Happening Today" — events whose date range covers today.
 *     Calendar box uses amber to flag today; cards in this section also
 *     show the pulsing "TODAY" pill so today's stuff is unmissable.
 *   • Section "Coming Up" — everything else (tomorrow + later).
 *     Tomorrow's calendar box is red as the next-up alert.
 *   • Multi-day events get a "MULTI-DAY" pill so they're easy to spot at
 *     a glance, paired with the existing "Day N of M" status label.
 *
 * Five color-coded types:
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

  const dayDelta = (iso: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(iso + 'T00:00:00');
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Split into "today" vs "upcoming" so each gets its own section header.
  // An event is "today" if its date range covers today (start ≤ 0 ≤ end).
  const todayHolidays = holidays.filter(
    (h) => dayDelta(h.start_date) <= 0 && dayDelta(h.end_date) >= 0
  );
  const upcomingHolidays = holidays.filter(
    (h) => dayDelta(h.start_date) > 0
  );

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
          <span className="text-base">📅</span>
          {isES ? 'Días Importantes y Eventos' : 'Upcoming Holidays and Events'}
        </h2>
      </div>

      {/* ── Section: Happening Today ── */}
      {todayHolidays.length > 0 && (
        <>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-amber-700 flex items-center gap-1.5 mb-2 mt-1">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {isES ? 'Sucediendo Hoy' : 'Happening Today'}
          </h3>
          <div className="space-y-2 mb-4">
            {todayHolidays.map((h) => (
              <HolidayCard key={h.id} holiday={h} language={language} dayDelta={dayDelta} />
            ))}
          </div>
        </>
      )}

      {/* ── Section: Coming Up ── */}
      {upcomingHolidays.length > 0 && (
        <>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1.5 mb-2">
            <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
            {isES ? 'Próximamente' : 'Coming Up'}
          </h3>
          <div className="space-y-2">
            {upcomingHolidays.map((h) => (
              <HolidayCard key={h.id} holiday={h} language={language} dayDelta={dayDelta} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/* ───────── Single holiday card ───────── */
function HolidayCard({
  holiday: h,
  language,
  dayDelta,
}: {
  holiday: Holiday;
  language: 'en' | 'es';
  dayDelta: (iso: string) => number;
}) {
  const isES = language === 'es';
  const style = getHolidayStyle(h.type);
  const isMultiDay = h.start_date !== h.end_date;
  const startDelta = dayDelta(h.start_date);
  const endDelta = dayDelta(h.end_date);
  const isActive = startDelta <= 0 && endDelta >= 0;
  const isTomorrow = startDelta === 1;
  const isPast = endDelta < 0;

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

  // Calendar-box visuals: highlight today (amber), tomorrow (red),
  // fade past events. Future events use a neutral gray box.
  const startDate = new Date(h.start_date + 'T00:00:00');
  const monthNames = isES
    ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthAbbr = monthNames[startDate.getMonth()];
  const dayNum = startDate.getDate();

  let calBg = 'bg-white border-gray-200';
  let calMonth = 'text-gray-400';
  let calDay = 'text-gray-700';
  if (isActive) {
    calBg = 'bg-amber-100 border-amber-400';
    calMonth = 'text-amber-700';
    calDay = 'text-amber-800';
  } else if (isTomorrow) {
    calBg = 'bg-red-50 border-red-400';
    calMonth = 'text-red-600';
    calDay = 'text-red-700';
  } else if (isPast) {
    calBg = 'bg-gray-50 border-gray-200 opacity-70';
    calMonth = 'text-gray-400';
    calDay = 'text-gray-500';
  }

  // Active "today" cards get a slightly stronger shadow + ring so they
  // pop above the surrounding feed content.
  const cardClass = isActive
    ? `rounded-2xl px-3 py-3 border-l-4 shadow-md ring-2 ring-amber-200 flex items-center gap-3 ${style.bgClass} ${style.borderClass}`
    : `rounded-2xl px-3 py-3 border-l-4 shadow-sm flex items-center gap-3 ${style.bgClass} ${style.borderClass}`;

  return (
    <div className={cardClass}>
      {/* Calendar date box */}
      <div
        className={`flex-shrink-0 w-11 h-11 rounded-xl border flex flex-col items-center justify-center ${calBg}`}
        aria-hidden
      >
        <span className={`text-[10px] font-bold uppercase leading-none ${calMonth}`}>
          {monthAbbr}
        </span>
        <span className={`text-base font-bold leading-tight ${calDay}`}>
          {dayNum}
        </span>
      </div>

      {/* Type emoji */}
      <span className="text-xl flex-shrink-0" aria-hidden>{style.emoji}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className={`font-bold text-sm ${style.textClass}`}>
            {h.name && (isES && h.name_es ? h.name_es : h.name)}
          </p>
          {/* Multi-day pill — only for events spanning more than one day */}
          {isMultiDay && (
            <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-white/60 ${style.subTextClass}`}>
              {isES ? 'Varios días' : 'Multi-day'}
            </span>
          )}
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
        {(isES && h.notes_es ? h.notes_es : h.notes) && (
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            {isES && h.notes_es ? h.notes_es : h.notes}
          </p>
        )}
      </div>
    </div>
  );
}
