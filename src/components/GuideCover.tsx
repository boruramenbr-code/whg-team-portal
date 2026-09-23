'use client';

import { useId, type CSSProperties } from 'react';

/* ───────── Quick Guide covers ─────────
 *
 * Drawn, not uploaded (Sept 2026): a line icon for the topic, a subtle
 * Japanese pattern (seigaiha waves, shippō circles, kikkō hexagons), a
 * chapter number, and one accent color per topic on the Midnight Navy
 * canvas. Stays sharp at any size and every new topic gets a cover the
 * moment it exists — no image to make or upload.
 */

const ACCENTS = ['#D9A94E', '#5FB49C', '#E0694A', '#7FA7D9', '#B48CC8', '#E8A0B4', '#4DB6C4'];
const PATTERNS = ['waves', 'circles', 'hexagons'] as const;

const ICON_KEYS = [
  'calendar', 'bulb', 'clock', 'bowl', 'cash', 'shirt', 'cup', 'phone',
  'growth', 'shield', 'alert', 'noglass', 'clipboard', 'lantern', 'book',
  'check', 'x', 'send', 'users', 'plane', 'swap', 'star', 'arrow', 'pin',
  'hand', 'fire', 'camera', 'heart', 'firstaid', 'chat', 'gift', 'lock', 'door', 'percent',
] as const;
type IconKey = (typeof ICON_KEYS)[number];

/** Topic emoji → icon (the emoji is the stable key already on every topic). */
const BY_EMOJI: Record<string, IconKey> = {
  '📅': 'calendar', '💡': 'bulb', '⏰': 'clock', '🍱': 'bowl', '💵': 'cash', '👕': 'shirt',
  '🤝': 'cup', '📱': 'phone', '📈': 'growth', '🛡': 'shield', '🦺': 'alert', '🍺': 'noglass',
  '📋': 'clipboard', '🏮': 'lantern',
};

/** Fallback for topics added later with an emoji not in the map above. */
const BY_WORD: [RegExp, IconKey][] = [
  [/pay|tip|wage|money/i, 'cash'], [/schedul|time off|call.?out|late/i, 'calendar'],
  [/safety|emergenc|injur/i, 'alert'], [/harass|respect|discriminat/i, 'shield'],
  [/meal|food|perk/i, 'bowl'], [/dress|uniform|appearance/i, 'shirt'],
  [/clock|punch|hours/i, 'clock'], [/phone|app/i, 'phone'], [/break|conduct/i, 'cup'],
  [/raise|growth|review|promot/i, 'growth'], [/who we are|story|culture/i, 'lantern'],
  [/alcohol|drug/i, 'noglass'], [/basic|policy|rule/i, 'clipboard'], [/know|tip/i, 'bulb'],
];

function iconFor(emoji: string | null, title: string): IconKey {
  const e = (emoji || '').replace(/\uFE0F/g, '');
  if (BY_EMOJI[e]) return BY_EMOJI[e];
  for (const [re, key] of BY_WORD) if (re.test(title)) return key;
  return 'book';
}

export function guideAccent(index: number) {
  return ACCENTS[((index % ACCENTS.length) + ACCENTS.length) % ACCENTS.length];
}

/* ── Line icons (24×24, stroke = currentColor) ── */
function IconPaths({ icon }: { icon: IconKey }) {
  switch (icon) {
    case 'calendar':
      return (<>
        <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
        <path d="M8 3v4M16 3v4M3.5 10h17" />
        <path d="M9.5 14.5l2 2 3.5-3.5" />
      </>);
    case 'bulb':
      return (<>
        <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.1V17h5v-1.1c0-.8.4-1.6 1.1-2.1A6 6 0 0 0 12 3z" />
        <path d="M9.5 20h5M10.5 22.5h3" />
      </>);
    case 'clock':
      return (<>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </>);
    case 'bowl':
      return (<>
        <path d="M3.5 12h17a8.5 8.5 0 0 1-17 0z" />
        <path d="M9.5 20.5h5" />
        <path d="M13 3.5l-2.5 6.5M18 3.5l-4 6.5" />
      </>);
    case 'cash':
      return (<>
        <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
        <circle cx="12" cy="12" r="2.6" />
        <path d="M6 12h.01M18 12h.01" />
      </>);
    case 'shirt':
      return <path d="M8.5 3.5L3.5 6l1.8 4.2 2.2-1V20.5h9V9.2l2.2 1L20.5 6l-5-2.5a3.5 3.5 0 0 1-7 0z" />;
    case 'cup':
      return (<>
        <path d="M4.5 9h12v4.5a5.5 5.5 0 0 1-5.5 5.5h-1a5.5 5.5 0 0 1-5.5-5.5V9z" />
        <path d="M16.5 10.5h1.2a2.3 2.3 0 0 1 0 4.6h-1.6" />
        <path d="M8.5 3v3M12.5 3v3" />
      </>);
    case 'phone':
      return (<>
        <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
        <path d="M10.5 18.5h3" />
      </>);
    case 'growth':
      return (<>
        <path d="M3.5 17.5l6-6 4 4 7-7.5" />
        <path d="M15 8h5.5v5.5" />
      </>);
    case 'shield':
      return (<>
        <path d="M12 3l7.5 3v6c0 4.7-3.3 8.1-7.5 9-4.2-.9-7.5-4.3-7.5-9V6L12 3z" />
        <path d="M9 12l2.2 2.2L15.5 10" />
      </>);
    case 'alert':
      return (<>
        <path d="M12 3.5l9.5 16.5h-19L12 3.5z" />
        <path d="M12 10v4.5M12 17.5h.01" />
      </>);
    case 'noglass':
      return (<>
        <path d="M7.5 3.5h9l-.8 7a3.7 3.7 0 0 1-7.4 0l-.8-7z" />
        <path d="M12 14.5v6M9 20.5h6" />
        <path d="M4 4l16 16" />
      </>);
    case 'clipboard':
      return (<>
        <rect x="5" y="4.5" width="14" height="17" rx="2.5" />
        <path d="M9 2.5h6v4H9z" />
        <path d="M9 13l2 2 4-4.5" />
      </>);
    case 'lantern':
      return (<>
        <path d="M9.5 2.5h5M12 2.5v2" />
        <path d="M8.2 4.5h7.6c2.4 2.3 2.4 12.7 0 15H8.2c-2.4-2.3-2.4-12.7 0-15z" />
        <path d="M6.6 8.5h10.8M6.3 12h11.4M6.6 15.5h10.8" />
        <path d="M10.5 19.5v2h3v-2" />
      </>);
    case 'check':
      return <path d="M5 12.5l4.5 4.5L19 7.5" />;
    case 'x':
      return <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />;
    case 'send':
      return <path d="M21.5 3L10.5 14M21.5 3l-7 18.5-4-7.5L3 10z" />;
    case 'users':
      return (<>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20.5c0-3.4 2.9-5.8 6.5-5.8s6.5 2.4 6.5 5.8" />
        <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M17.8 14.9c2.2.7 3.7 2.8 3.7 5.6" />
      </>);
    case 'plane':
      return <path d="M12 2.5c.8 0 1.5.7 1.5 1.5v5.2l7.5 4.3v2l-7.5-2.3v4.5l2.2 1.6v1.6L12 20l-3.7.9v-1.6l2.2-1.6v-4.5L3 15.5v-2l7.5-4.3V4c0-.8.7-1.5 1.5-1.5z" />;
    case 'swap':
      return <path d="M4 8h15.5l-3.5-3.5M20 16H4.5L8 19.5" />;
    case 'star':
      return <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />;
    case 'arrow':
      return <path d="M4.5 12h15M13.5 6l6 6-6 6" />;
    case 'hand':
      return <path d="M8.5 13V5.5a1.5 1.5 0 0 1 3 0V11M11.5 10.5V4a1.5 1.5 0 0 1 3 0v6.5M14.5 11V5.5a1.5 1.5 0 0 1 3 0v8.2c0 4.3-2.7 7.3-6.7 7.3-2.6 0-4.3-1.4-5.6-3.5l-2.4-4a1.5 1.5 0 0 1 2.5-1.7l1.7 2.4" />;
    case 'fire':
      return <path d="M12 21.5c-3.6 0-6.5-2.7-6.5-6.3 0-3.2 2.2-5.1 3.5-7.2.4 1.6 1.3 2.6 2.4 3 .2-3.6 1.8-6.3 4.1-8.5.3 3 1.3 4.9 2.6 6.8 1 1.5 1.9 3.3 1.9 5.9 0 3.6-2.9 6.3-6.5 6.3z" />;
    case 'camera':
      return (<>
        <rect x="2.5" y="7" width="19" height="13" rx="2.5" />
        <path d="M8.5 7L10 4.5h4L15.5 7" />
        <circle cx="12" cy="13.5" r="3.5" />
      </>);
    case 'heart':
      return <path d="M12 20.5s-8-4.7-8-10.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 8 2.3c0 5.9-8 10.6-8 10.6z" />;
    case 'firstaid':
      return (<>
        <rect x="3.5" y="6.5" width="17" height="14" rx="2.5" />
        <path d="M9 6.5V4.5h6v2M12 10.5v6M9 13.5h6" />
      </>);
    case 'chat':
      return <path d="M20.5 11.5a8.5 8 0 0 1-12.2 7.2L3.5 20l1.4-4.3A8.5 8 0 1 1 20.5 11.5z" />;
    case 'gift':
      return (<>
        <rect x="3" y="8" width="18" height="4.5" rx="1" />
        <rect x="4.5" y="12.5" width="15" height="8.5" rx="1" />
        <path d="M12 8v13M12 8S10.5 3.5 8 4.5 9.2 8 12 8zM12 8s1.5-4.5 4-3.5S14.8 8 12 8z" />
      </>);
    case 'lock':
      return (<>
        <rect x="5" y="10.5" width="14" height="10.5" rx="2.5" />
        <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5" />
      </>);
    case 'door':
      return <path d="M3.5 21.5h17M6 21.5V3.5h9v18M15 5.5h3v16M12.2 12.5h.01" />;
    case 'percent':
      return (<>
        <path d="M5.5 18.5l13-13" />
        <circle cx="7" cy="7" r="2.3" />
        <circle cx="17" cy="17" r="2.3" />
      </>);
    case 'pin':
      return (<>
        <path d="M12 21.5s-7-6.1-7-11.8a7 7 0 0 1 14 0c0 5.7-7 11.8-7 11.8z" />
        <circle cx="12" cy="9.7" r="2.6" />
      </>);
    default:
      return (<>
        <path d="M3 5.5h5.5a3.5 3.5 0 0 1 3.5 3.5v11a2.5 2.5 0 0 0-2.5-2.5H3z" />
        <path d="M21 5.5h-5.5A3.5 3.5 0 0 0 12 9v11a2.5 2.5 0 0 1 2.5-2.5H21z" />
      </>);
  }
}

/** Any icon from the set, by name (unknown names fall back to a book). */
export function GuideIcon({
  icon, className = 'w-5 h-5', style, strokeWidth = 1.6,
}: { icon: string; className?: string; style?: CSSProperties; strokeWidth?: number }) {
  const key = (ICON_KEYS as readonly string[]).includes(icon) ? (icon as IconKey) : 'book';
  return (
    <svg
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className} style={style}
    >
      <IconPaths icon={key} />
    </svg>
  );
}

/** The topic's line icon — for small spots like headers and search results. */
export function GuideTopicIcon({
  emoji, title, index, className = 'w-4 h-4', style,
}: { emoji: string | null; title: string; index: number; className?: string; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden
      className={className} style={{ color: guideAccent(index), ...style }}
    >
      <IconPaths icon={iconFor(emoji, title)} />
    </svg>
  );
}

/** Full cover — fills its (relative, sized) parent. */
export default function GuideCover({
  emoji, title, index,
}: { emoji: string | null; title: string; index: number }) {
  const uid = useId().replace(/:/g, '');
  const accent = guideAccent(index);
  const pattern = PATTERNS[index % PATTERNS.length];

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      aria-hidden
      style={{
        background: `radial-gradient(120% 95% at 88% 12%, ${accent}33 0%, transparent 58%), linear-gradient(160deg, #1A2944 0%, #0D1522 100%)`,
      }}
    >
      {/* Pattern — strongest on the right, fading out behind the icon */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id={`p${uid}`} patternUnits="userSpaceOnUse"
            width={pattern === 'waves' ? 40 : pattern === 'circles' ? 24 : 28}
            height={pattern === 'waves' ? 20 : pattern === 'circles' ? 24 : 48}>
            <g fill="none" stroke={accent} strokeWidth="1">
              {pattern === 'waves' && [[20, 0], [20, 20], [0, 10], [40, 10]].map(([cx, cy]) =>
                [9.5, 6.5, 3.5].map((r) => <circle key={`${cx}-${cy}-${r}`} cx={cx} cy={cy} r={r} />))}
              {pattern === 'circles' && [[0, 0], [24, 0], [0, 24], [24, 24], [12, 12]].map(([cx, cy]) =>
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={12} />)}
              {pattern === 'hexagons' && <path d="M14 0L28 8v16L14 32 0 24V8zM14 32v16" />}
            </g>
          </pattern>
          <linearGradient id={`f${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0.25" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#fff" stopOpacity="1" />
          </linearGradient>
          <mask id={`m${uid}`}>
            <rect width="100%" height="100%" fill={`url(#f${uid})`} />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill={`url(#p${uid})`} mask={`url(#m${uid})`} opacity="0.22" />
      </svg>

      {/* Hairline, in the topic's accent */}
      <div className="absolute top-0 inset-x-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

      {/* Label */}
      <span className="absolute top-[9%] left-[7%] text-[7px] md:text-[9px] font-bold tracking-[0.22em] text-white/45">
        WHG · HANDBOOK
      </span>

      {/* Icon medallion */}
      <div
        className="absolute left-[7%] top-1/2 -translate-y-[38%] w-11 h-11 md:w-[68px] md:h-[68px] rounded-full flex items-center justify-center"
        style={{ border: `1px solid ${accent}73`, background: `${accent}17`, boxShadow: `0 0 28px ${accent}30` }}
      >
        <svg
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"
          className="w-6 h-6 md:w-9 md:h-9" style={{ color: accent }}
        >
          <IconPaths icon={iconFor(emoji, title)} />
        </svg>
      </div>

      {/* Chapter number */}
      <span
        className="absolute right-[6%] bottom-[5%] text-[30px] md:text-[48px] font-extralight leading-none tabular-nums"
        style={{ color: accent, opacity: 0.6 }}
      >
        {String(index + 1).padStart(2, '0')}
      </span>
    </div>
  );
}
