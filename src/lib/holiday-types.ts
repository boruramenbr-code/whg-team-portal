/**
 * Shared style/copy lookup for holiday types — keep editor row and public
 * widget in sync. If we add a 6th type later, only this file needs updating.
 */

export type HolidayType = 'closed' | 'slow' | 'normal' | 'busy' | 'all_hands';

interface HolidayTypeStyle {
  emoji: string;
  shortEn: string;       // Short label for editor list rows ("All hands")
  shortEs: string;
  bannerEn: string;      // Long label for the home widget ("All hands on deck — busiest day, no PTO")
  bannerEs: string;
  // Tailwind classes scoped per type — bg + border + text
  bgClass: string;
  borderClass: string;
  textClass: string;     // Title text color
  subTextClass: string;  // Subtitle / banner text color
  iconClass: string;     // For colored dots in list rows
  /** Same roles on the dark (Midnight Navy & Gold) staff side. */
  dark: { bgClass: string; borderClass: string; textClass: string; subTextClass: string };
}

export const HOLIDAY_TYPES: Record<HolidayType, HolidayTypeStyle> = {
  closed: {
    emoji: '🌿',
    shortEn: 'Closed',
    shortEs: 'Cerrado',
    bannerEn: 'Closed — rest with family',
    bannerEs: 'Cerrado — descanso con familia',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-400',
    textClass: 'text-emerald-900',
    subTextClass: 'text-emerald-700',
    iconClass: 'text-emerald-600',
    dark: { bgClass: 'bg-emerald-400/10', borderClass: 'border-emerald-400', textClass: 'text-emerald-100', subTextClass: 'text-emerald-300/90' },
  },
  slow: {
    emoji: '🌤️',
    shortEn: 'Slow day',
    shortEs: 'Día tranquilo',
    bannerEn: 'Slower than usual',
    bannerEs: 'Más tranquilo de lo normal',
    bgClass: 'bg-sky-50',
    borderClass: 'border-sky-400',
    textClass: 'text-sky-900',
    subTextClass: 'text-sky-700',
    iconClass: 'text-sky-600',
    dark: { bgClass: 'bg-sky-400/10', borderClass: 'border-sky-400', textClass: 'text-sky-100', subTextClass: 'text-sky-300/90' },
  },
  normal: {
    emoji: '📅',
    shortEn: 'Mark your calendar',
    shortEs: 'Anota la fecha',
    bannerEn: 'Mark your calendar',
    bannerEs: 'Anota la fecha',
    bgClass: 'bg-gray-50',
    borderClass: 'border-gray-400',
    textClass: 'text-gray-800',
    subTextClass: 'text-gray-600',
    iconClass: 'text-gray-500',
    dark: { bgClass: 'bg-whg-card2', borderClass: 'border-whg-dim', textClass: 'text-whg-snow', subTextClass: 'text-whg-dim' },
  },
  busy: {
    emoji: '⚡',
    shortEn: 'Busier',
    shortEs: 'Más ocupado',
    bannerEn: 'Heads up — busier than usual',
    bannerEs: 'Atención — más ocupado de lo normal',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-400',
    textClass: 'text-amber-900',
    subTextClass: 'text-amber-700',
    iconClass: 'text-amber-600',
    dark: { bgClass: 'bg-whg-gold/10', borderClass: 'border-whg-gold', textClass: 'text-whg-gold2', subTextClass: 'text-whg-gold/85' },
  },
  all_hands: {
    emoji: '🔥',
    shortEn: 'All hands',
    shortEs: 'Todos en cubierta',
    bannerEn: 'All hands on deck — busiest day, no PTO',
    bannerEs: 'Todos en cubierta — el día más ocupado, sin PTO',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-400',
    textClass: 'text-rose-900',
    subTextClass: 'text-rose-700',
    iconClass: 'text-rose-600',
    dark: { bgClass: 'bg-rose-400/10', borderClass: 'border-rose-400', textClass: 'text-rose-100', subTextClass: 'text-rose-300/90' },
  },
};

/** Convenience: get the style block for any type, falling back to 'normal'. */
export function getHolidayStyle(type: string): HolidayTypeStyle {
  return HOLIDAY_TYPES[type as HolidayType] ?? HOLIDAY_TYPES.normal;
}
