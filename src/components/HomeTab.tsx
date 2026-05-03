'use client';

import { useState, useEffect, useCallback } from 'react';
import WelcomeNoteModal from './WelcomeNoteModal';
import HolidaysWidget from './HolidaysWidget';
import NewHiresSection from './NewHiresSection';
import MyBarCardWidget from './MyBarCardWidget';
import CardingDateWidget from './CardingDateWidget';

/* ───────── Types (mirrored from PreshiftTab) ───────── */
interface TaggedItem {
  id: string;
  text: string;
  by: string | null;
  at: string;
}

interface PreshiftNote {
  id: string;
  message: string | null;
  specials: TaggedItem[];
  eighty_sixed: TaggedItem[];
  focus_items: TaggedItem[];
  shift_date: string;
  created_at: string;
  updated_at: string;
  creator_name?: string | null;
}

interface OwnerMessage {
  id: string;
  message: string;
  start_date: string;
  end_date: string;
}

interface Props {
  firstName: string;
  restaurantName: string | null;
  language: 'en' | 'es';
  onNavigate: (tab: string) => void;
}

/* ───────── Restaurant logo mapping ───────── */
const RESTAURANT_LOGO: Record<string, string> = {
  'ichiban sushi': '/logos/ichiban-black.png',
  'boru ramen': '/logos/boru-black.png',
  'shokudo': '/logos/shokudo-black.png',
};

function getRestaurantLogo(name: string | null): string | null {
  if (!name) return null;
  const lower = name.toLowerCase();
  for (const [key, path] of Object.entries(RESTAURANT_LOGO)) {
    if (lower.includes(key)) return path;
  }
  return null;
}

/* ───────── Tab guide data ───────── */
const TAB_GUIDE = [
  {
    key: 'handbook',
    emoji: '📘',
    title: 'Handbook & Policies',
    titleEs: 'Manual y Políticas',
    description: 'Read the employee handbook, review company policies, or ask questions and get instant answers.',
    descriptionEs: 'Lee el manual del empleado, revisa las políticas de la empresa, o haz preguntas y obtén respuestas al instante.',
  },
  {
    key: 'ourteam',
    emoji: '👥',
    title: 'Our Team',
    titleEs: 'Nuestro Equipo',
    description: 'See the org chart — who does what, who reports to whom, and how the team is structured.',
    descriptionEs: 'Ve el organigrama — quién hace qué, quién reporta a quién y cómo está estructurado el equipo.',
  },
  {
    key: 'preshift',
    emoji: '📋',
    title: 'Pre-Shift Notes',
    titleEs: 'Notas Pre-Turno',
    description: "Full history of daily pre-shift notes, today's specials, 86'd items, and focus areas.",
    descriptionEs: 'Historial completo de notas pre-turno, especiales del día, artículos 86 y áreas de enfoque.',
  },
];

/* ───────── Birthday types ───────── */
interface Birthday {
  id: string;
  full_name: string;
  date_of_birth: string;
  birth_month: number;
  birth_day: number;
  days_until: number;
  restaurant_name: string | null;
}

/* ───────── Component ───────── */
export default function HomeTab({ firstName, restaurantName, language, onNavigate }: Props) {
  const [note, setNote] = useState<PreshiftNote | null>(null);
  const [ownerMessages, setOwnerMessages] = useState<OwnerMessage[]>([]);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);
  // Toggle to force-reopen the welcome note when user taps the ℹ️ icon
  const [reopenWelcome, setReopenWelcome] = useState(false);
  const isES = language === 'es';

  const loadPreshift = useCallback(async () => {
    setLoading(true);
    try {
      const [noteRes, ownerRes, bdayRes] = await Promise.all([
        fetch(`/api/preshift-notes?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/owner-messages?audience=staff&t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/birthdays?t=${Date.now()}`, { cache: 'no-store' }),
      ]);
      const noteData = await noteRes.json();
      const ownerData = await ownerRes.json();
      setNote(noteData.note || null);
      setOwnerMessages(ownerData.messages || []);

      if (bdayRes.ok) {
        const bdayData = await bdayRes.json();
        setBirthdays(bdayData.birthdays || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreshift();
  }, [loadPreshift]);

  const hasSpecials = (note?.specials?.length ?? 0) > 0;
  const has86 = (note?.eighty_sixed?.length ?? 0) > 0;
  const hasFocus = (note?.focus_items?.length ?? 0) > 0;
  const hasMessage = !!note?.message?.trim();
  const hasAnyContent = hasSpecials || has86 || hasFocus || hasMessage;

  const logo = getRestaurantLogo(restaurantName);

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return isES ? 'Buenos días' : 'Good morning';
    if (hour < 17) return isES ? 'Buenas tardes' : 'Good afternoon';
    return isES ? 'Buenas noches' : 'Good evening';
  })();

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#C5D3E2] via-[#CDDAE7] to-[#D5E0EB]">
      {/* Welcome note modal — shows on first login OR when user taps ℹ️ */}
      <WelcomeNoteModal
        forceOpen={reopenWelcome}
        onClose={() => setReopenWelcome(false)}
      />

      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6">

        {/* ── Hero greeting ── */}
        <div className="relative text-center pb-2 bg-white/50 rounded-2xl py-6 -mx-1 px-1">
          {/* Info icon — re-opens welcome note */}
          <button
            onClick={() => setReopenWelcome(true)}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/60 hover:bg-white text-[#1B3A6B] text-base font-bold transition-colors flex items-center justify-center shadow-sm"
            title={isES ? 'Sobre esta app' : 'About this app'}
            aria-label={isES ? 'Sobre esta app' : 'About this app'}
          >
            ℹ️
          </button>
          {logo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logo}
              alt={restaurantName || 'Restaurant'}
              className="mx-auto mb-3 h-12 md:h-16 w-auto object-contain"
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src="/logos/whg.png"
              alt="WHG"
              className="mx-auto mb-3 h-12 md:h-16 w-auto object-contain rounded-lg"
            />
          )}
          <h1 className="text-xl md:text-2xl font-bold text-[#1B3A6B]">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-gray-400 mt-1">{todayLabel}</p>
        </div>

        {/* ── Welcome New Teammates (Position #2 — top of feed for 30 days) ── */}
        <NewHiresSection language={language} />

        {/* ── Personal Bar Card alert (only renders when actionable) ── */}
        <MyBarCardWidget language={language} />

        {/* ── Age-verification cutoff (only renders for staff who serve alcohol) ── */}
        <CardingDateWidget language={language} />

        {/* ── Owner's Message (pinned, if any) ── */}
        {ownerMessages.length > 0 && (
          <div className="space-y-2">
            {ownerMessages.map((m) => (
              <div
                key={m.id}
                className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/60 rounded-2xl px-5 py-4 flex items-start gap-3 shadow-sm"
              >
                <span className="text-xl mt-0.5">💙</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">
                    {isES ? 'Mensaje del Dueño' : "Owner's Message"}
                  </p>
                  <p className="text-sm text-indigo-900 leading-relaxed whitespace-pre-wrap">
                    {m.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Pre-Shift Notes (live) ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <span className="text-base">📋</span>
              {isES ? 'Notas del Turno de Hoy' : "Today's Pre-Shift"}
            </h2>
            <button
              onClick={() => onNavigate('preshift')}
              className="text-[11px] font-semibold text-[#2E86C1] hover:underline"
            >
              {isES ? 'Ver todo' : 'View all'}  →
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-white/80 p-6 text-center shadow-sm">
              <div className="text-gray-400 text-sm animate-pulse">Loading...</div>
            </div>
          ) : hasAnyContent ? (
            <div className="bg-white rounded-2xl border border-white/80 shadow-sm overflow-hidden">
              <div className="px-5 py-4 space-y-3">
                {/* Manager message */}
                {hasMessage && (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {note!.message}
                  </p>
                )}

                {/* Specials */}
                {hasSpecials && (
                  <div>
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <span>⭐</span> {isES ? 'Especiales' : 'Specials'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {note!.specials.map((item, i) => (
                        <span
                          key={item.id || i}
                          className="bg-amber-50 border border-amber-200/80 text-amber-800 text-xs px-2.5 py-1 rounded-lg"
                        >
                          {item.text}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 86'd */}
                {has86 && (
                  <div>
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <span>🚫</span> 86&apos;d
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {note!.eighty_sixed.map((item, i) => (
                        <span
                          key={item.id || i}
                          className="bg-red-50 border border-red-200/80 text-red-700 text-xs px-2.5 py-1 rounded-lg font-medium"
                        >
                          {item.text}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Focus Items */}
                {hasFocus && (
                  <div>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <span>🎯</span> {isES ? 'Enfoque' : 'Focus'}
                    </p>
                    <div className="space-y-1">
                      {note!.focus_items.map((item, i) => (
                        <p key={item.id || i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span>{item.text}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <div className="px-5 py-2 bg-gray-50 border-t border-gray-100">
                <span className="text-[10px] text-gray-400">
                  {isES ? 'Actualizado' : 'Updated'}{' '}
                  {new Date(note!.updated_at || note!.created_at).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-white/80 p-6 text-center shadow-sm">
              <p className="text-gray-500 text-sm">
                {isES
                  ? 'No hay notas pre-turno todavía. Revisa antes de tu turno.'
                  : 'No pre-shift notes yet. Check back before your shift.'}
              </p>
            </div>
          )}
        </section>

        {/* ── Upcoming Birthdays ── */}
        {birthdays.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="text-base">🎂</span>
              {isES ? 'Cumpleaños Próximos' : 'Upcoming Birthdays'}
            </h2>
            <div className="bg-white rounded-2xl border border-white/80 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {birthdays.map((b) => {
                  const isToday = b.days_until === 0;
                  const isPast = b.days_until < 0;
                  const isYesterday = b.days_until === -1;
                  const monthNames = isES
                    ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
                    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                  return (
                    <div
                      key={b.id}
                      className={`px-4 py-3 flex items-center gap-3 ${
                        isToday ? 'bg-amber-50' : isPast ? 'bg-gray-50/60' : ''
                      }`}
                    >
                      {/* Date badge */}
                      <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center ${
                        isToday
                          ? 'bg-amber-100 border border-amber-200'
                          : isPast
                          ? 'bg-gray-100 border border-gray-200 opacity-70'
                          : 'bg-gray-50 border border-gray-100'
                      }`}>
                        <span className={`text-[10px] font-bold uppercase leading-none ${
                          isToday ? 'text-amber-600' : isPast ? 'text-gray-400' : 'text-gray-400'
                        }`}>
                          {monthNames[b.birth_month - 1]}
                        </span>
                        <span className={`text-base font-bold leading-tight ${
                          isToday ? 'text-amber-700' : isPast ? 'text-gray-500' : 'text-gray-600'
                        }`}>
                          {b.birth_day}
                        </span>
                      </div>

                      {/* Name + restaurant */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${
                          isPast ? 'text-gray-500' : 'text-[#1B3A6B]'
                        }`}>
                          {b.full_name}
                          {isToday && <span className="ml-1.5">🎉</span>}
                          {isPast && <span className="ml-1.5 text-xs">🎂</span>}
                        </p>
                        {b.restaurant_name && (
                          <p className="text-[11px] text-gray-400 truncate">{b.restaurant_name}</p>
                        )}
                      </div>

                      {/* Days until / since */}
                      <div className="flex-shrink-0 text-right">
                        {isToday ? (
                          <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full">
                            {isES ? '¡Hoy!' : 'Today!'}
                          </span>
                        ) : b.days_until === 1 ? (
                          <span className="text-xs font-semibold text-amber-600">
                            {isES ? 'Mañana' : 'Tomorrow'}
                          </span>
                        ) : isYesterday ? (
                          <span className="text-xs font-medium text-gray-500">
                            {isES ? 'Ayer' : 'Yesterday'}
                          </span>
                        ) : isPast ? (
                          <span className="text-xs font-medium text-gray-400">
                            {isES ? `hace ${Math.abs(b.days_until)} días` : `${Math.abs(b.days_until)} days ago`}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-gray-400">
                            {isES ? `en ${b.days_until} días` : `in ${b.days_until} days`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── Upcoming Holidays and Events ── */}
        <HolidaysWidget language={language} />

        {/* ── Two-column: Latest Review + Leaderboard ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Latest Review Spotlight */}
          <section className="bg-white rounded-2xl border border-white/80 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <span className="text-base">⭐</span>
                {isES ? 'Última Reseña' : 'Latest Review'}
              </h2>
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">
                {isES ? 'Próximamente' : 'Coming Soon'}
              </span>
            </div>
            <div className="px-5 py-8 text-center">
              <div className="text-4xl mb-3 opacity-30">⭐</div>
              <p className="text-sm text-gray-400">
                {isES
                  ? 'Las reseñas de Google y Yelp aparecerán aquí.'
                  : 'Google & Yelp reviews will show up here.'}
              </p>
              <p className="text-xs text-gray-300 mt-1">
                {isES
                  ? 'Destaca lo que nuestros clientes dicen.'
                  : 'Spotlight what our guests are saying.'}
              </p>
            </div>
          </section>

          {/* Leaderboard / Callouts */}
          <section className="bg-white rounded-2xl border border-white/80 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <span className="text-base">🏆</span>
                {isES ? 'Reconocimientos' : 'Shout-Outs'}
              </h2>
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">
                {isES ? 'Próximamente' : 'Coming Soon'}
              </span>
            </div>
            <div className="px-5 py-8 text-center">
              <div className="text-4xl mb-3 opacity-30">🏆</div>
              <p className="text-sm text-gray-400">
                {isES
                  ? 'Reconocimientos del equipo y líderes en reseñas.'
                  : 'Team shout-outs and review leaders will appear here.'}
              </p>
              <p className="text-xs text-gray-300 mt-1">
                {isES
                  ? 'Celebra a los que marcan la diferencia.'
                  : 'Celebrate the ones making a difference.'}
              </p>
            </div>
          </section>
        </div>

        {/* ── Tab Guide ── */}
        <section>
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="text-base">🧭</span>
            {isES ? 'Explora el Portal' : 'Explore the Portal'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TAB_GUIDE.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onNavigate(tab.key)}
                className="bg-white rounded-2xl border border-white/80 shadow-sm p-4 text-left hover:shadow-md hover:scale-[1.02] transition-all group"
              >
                <div className="text-2xl mb-2">{tab.emoji}</div>
                <p className="text-sm font-bold text-[#1B3A6B] group-hover:text-[#2E86C1] transition-colors">
                  {isES ? tab.titleEs : tab.title}
                </p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  {isES ? tab.descriptionEs : tab.description}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* ── Reviews Hub placeholder ── */}
        <section className="bg-white rounded-2xl border border-white/80 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <span className="text-base">💬</span>
              {isES ? 'Centro de Reseñas' : 'Reviews Hub'}
            </h2>
            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">
              {isES ? 'Próximamente' : 'Coming Soon'}
            </span>
          </div>
          <div className="px-5 py-6 text-center">
            <p className="text-sm text-gray-400">
              {isES
                ? 'Todas las reseñas de Google y Yelp en un solo lugar. Filtra por calificación, fecha o menciones de empleados.'
                : 'All Google & Yelp reviews in one place. Filter by rating, date, or employee mentions.'}
            </p>
          </div>
        </section>

        {/* Footer spacer */}
        <div className="h-4" />
      </div>
    </div>
  );
}
