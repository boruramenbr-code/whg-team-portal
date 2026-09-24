/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
const colors = require('tailwindcss/colors');

/* ───────── Color system ─────────
 *
 * Every palette color is a CSS variable, so one class can wear two skins:
 *   • Staff app — Midnight Navy & Gold (the defaults below).
 *   • Manager zone (Mission Control + Manager Resources) — Charcoal & Gold,
 *     switched on by wrapping a page in `.mc-theme` (Randy, Sept 2026:
 *     "so my managers know they are in Mission Control").
 *
 * Inside `.mc-theme`, light-authored screens (bg-white, text-gray-900,
 * bg-red-50 …) flip to dark automatically: grays invert onto a warm
 * charcoal ramp, hue tints (50–300) become dark tints, hue inks (700–950)
 * become light, and the old royal navy / bright blue become gold.
 * Screens written for the dark staff side (whg-* tokens) re-tint to
 * charcoal; wrap them in `.mc-native` so their hue classes keep the
 * staff-side meaning (e.g. text-amber-300 stays a light accent).
 */

const HUES = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];
const GRAYS = ['slate', 'gray', 'zinc', 'neutral', 'stone'];
const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const rgbVar = (hex) => hexToRgb(hex).join(' ');
/** `top` laid over `base` at opacity t, as an "r g b" triplet. */
const mix = (top, base, t) => {
  const a = hexToRgb(top);
  const b = hexToRgb(base);
  return a.map((v, i) => Math.round(v * t + b[i] * (1 - t))).join(' ');
};
const ramp = (name) => Object.fromEntries(SHADES.map((s) => [s, `rgb(var(--c-${name}-${s}) / <alpha-value>)`]));

// Staff side — Midnight Navy & Gold (locked July 2026).
const WHG_MIDNIGHT = {
  night: '#0D1522', night2: '#152238', card: '#17253D', card2: '#1C2A44', line: '#26364F',
  snow: '#F2F6FC', dim: '#93A3BC', gold: '#D9A94E', gold2: '#E4BC6B', goldink: '#2A1F08',
};
// Manager zone — Charcoal & Gold (the ground the WHG logo was designed on).
const WHG_CHARCOAL = {
  night: '#141518', night2: '#17181B', card: '#1E2024', card2: '#25272C', line: '#2E3035',
  snow: '#F3F1EC', dim: '#9A9690', gold: '#D9A94E', gold2: '#E4BC6B', goldink: '#1E1608',
};
// Grays inside the manager zone: light-to-dark flipped onto warm charcoal.
const CHARCOAL_GRAYS = {
  50: '#24262B', 100: '#2A2D32', 200: '#34373D', 300: '#43464D', 400: '#7D7A74', 500: '#9A9690',
  600: '#B5B1AA', 700: '#CFCBC4', 800: '#E3E0DA', 900: '#F3F1EC', 950: '#FAF9F6',
};
const CARD = WHG_CHARCOAL.card;

function defaultVars() {
  const v = {};
  for (const n of [...HUES, ...GRAYS]) for (const s of SHADES) v[`--c-${n}-${s}`] = rgbVar(colors[n][s]);
  return v;
}
function managerVars() {
  const v = {};
  for (const n of GRAYS) for (const s of SHADES) v[`--c-${n}-${s}`] = rgbVar(CHARCOAL_GRAYS[s]);
  for (const n of HUES) {
    const c = colors[n];
    Object.assign(v, {
      [`--c-${n}-50`]: mix(c[500], CARD, 0.14),
      [`--c-${n}-100`]: mix(c[500], CARD, 0.22),
      [`--c-${n}-200`]: mix(c[500], CARD, 0.36),
      [`--c-${n}-300`]: mix(c[400], CARD, 0.55),
      [`--c-${n}-400`]: rgbVar(c[400]),
      [`--c-${n}-500`]: rgbVar(c[500]),
      [`--c-${n}-600`]: rgbVar(c[500]),
      [`--c-${n}-700`]: rgbVar(c[400]),
      [`--c-${n}-800`]: rgbVar(c[300]),
      [`--c-${n}-900`]: rgbVar(c[200]),
      [`--c-${n}-950`]: rgbVar(c[100]),
    });
  }
  return v;
}
const whgVars = (t) => Object.fromEntries(Object.entries(t).map(([k, hex]) => [`--whg-${k}`, rgbVar(hex)]));

/* Old light-theme literals used across Mission Control, re-pointed at the
 * Charcoal & Gold roles. (\\[ \\# \\/ \\: escape Tailwind's arbitrary-value class names.) */
const GOLD = '217 169 78';
const GOLD2 = '228 188 107';
const INK = '#1E1608';
const managerOverrides = {
  '.mc-theme ::placeholder': { color: 'rgb(var(--c-gray-400))' },
  // White surfaces → charcoal cards. Low-alpha white (glass on dark) stays white.
  '.mc-theme .bg-white, .mc-theme .hover\\:bg-white:hover': { backgroundColor: 'rgb(var(--whg-card))' },
  '.mc-theme .bg-white\\/40': { backgroundColor: 'rgb(var(--whg-card) / .4)' },
  '.mc-theme .bg-white\\/60, .mc-theme .hover\\:bg-white\\/60:hover': { backgroundColor: 'rgb(var(--whg-card) / .6)' },
  '.mc-theme .bg-white\\/70, .mc-theme .hover\\:bg-white\\/70:hover': { backgroundColor: 'rgb(var(--whg-card) / .7)' },
  '.mc-theme .bg-white\\/80': { backgroundColor: 'rgb(var(--whg-card) / .8)' },
  // Royal navy headings → snow; bright-blue accents → gold.
  '.mc-theme .text-\\[\\#1B3A6B\\], .mc-theme .text-\\[\\#0F1E3C\\]': { color: 'rgb(var(--whg-snow))' },
  '.mc-theme .hover\\:text-\\[\\#1B3A6B\\]:hover, .mc-theme .text-\\[\\#2E86C1\\]': { color: `rgb(${GOLD2})` },
  // Royal navy / bright blue buttons and active pills → gold with dark ink.
  '.mc-theme .bg-\\[\\#1B3A6B\\], .mc-theme .bg-\\[\\#2E86C1\\], .mc-theme .from-\\[\\#1B3A6B\\]': {
    backgroundColor: `rgb(${GOLD})`, backgroundImage: 'none', color: INK,
  },
  '.mc-theme .hover\\:bg-\\[\\#15305A\\]:hover, .mc-theme .hover\\:bg-\\[\\#15305a\\]:hover, .mc-theme .hover\\:bg-\\[\\#2E86C1\\]:hover, .mc-theme .hover\\:bg-\\[\\#256d9f\\]:hover, .mc-theme .hover\\:bg-\\[\\#2C4F8A\\]:hover': {
    backgroundColor: `rgb(${GOLD2})`,
  },
  '.mc-theme .bg-\\[\\#1B3A6B\\]\\/10': { backgroundColor: `rgb(${GOLD} / .12)`, color: `rgb(${GOLD2})` },
  '.mc-theme .bg-\\[\\#1B3A6B\\]\\/25': { backgroundColor: `rgb(${GOLD} / .25)` },
  '.mc-theme .border-\\[\\#1B3A6B\\], .mc-theme .focus\\:border-\\[\\#1B3A6B\\]:focus': { borderColor: `rgb(${GOLD})` },
  '.mc-theme .border-\\[\\#1B3A6B\\]\\/20': { borderColor: `rgb(${GOLD} / .25)` },
  '.mc-theme .hover\\:border-\\[\\#1B3A6B\\]\\/40:hover': { borderColor: `rgb(${GOLD} / .45)` },
  '.mc-theme .focus\\:ring-\\[\\#1B3A6B\\]\\/20:focus, .mc-theme .ring-\\[\\#1B3A6B\\]\\/20': { '--tw-ring-color': `rgb(${GOLD} / .3)` },
  '.mc-theme .focus\\:ring-\\[\\#1B3A6B\\]\\/40:focus': { '--tw-ring-color': `rgb(${GOLD} / .45)` },
  '.mc-theme .focus\\:ring-\\[\\#2E86C1\\]:focus': { '--tw-ring-color': `rgb(${GOLD})` },
  // The old gray-blue page wash → charcoal.
  '.mc-theme .from-\\[\\#C5D3E2\\]': {
    '--tw-gradient-from': 'rgb(var(--whg-night)) var(--tw-gradient-from-position)',
    '--tw-gradient-to': 'rgb(var(--whg-night) / 0) var(--tw-gradient-to-position)',
    '--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to)',
  },
  '.mc-theme .to-\\[\\#D5E0EB\\]': { '--tw-gradient-to': 'rgb(var(--whg-night2)) var(--tw-gradient-to-position)' },
  '.mc-theme .bg-\\[\\#C8D4E1\\], .mc-theme .bg-\\[\\#D0DAE5\\]': { backgroundColor: 'rgb(var(--whg-night))' },
  '.mc-theme .border-\\[\\#D6DEE8\\]\\/60, .mc-theme .border-\\[\\#B8C5D4\\]': { borderColor: 'rgb(var(--whg-line))' },
};

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // Shared style maps (e.g. holiday-types) hold class names too.
    './src/lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ...Object.fromEntries([...HUES, ...GRAYS].map((n) => [n, ramp(n)])),
        whg: {
          navy: '#1B3A6B',
          blue: '#2E86C1',
          lightblue: '#EBF3FB',
          muted: '#7BA7D3',
          // Layered surfaces: night (canvas) → card → card2 (raised chip).
          ...Object.fromEntries(Object.keys(WHG_MIDNIGHT).map((k) => [k, `rgb(var(--whg-${k}) / <alpha-value>)`])),
        },
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': { ...defaultVars(), ...whgVars(WHG_MIDNIGHT) },
        '.mc-theme': { ...managerVars(), ...whgVars(WHG_CHARCOAL), colorScheme: 'dark', color: 'rgb(var(--whg-snow))' },
        // Dark-authored screens shown inside the manager zone keep the
        // default hue/gray meanings (the whg-* tokens stay charcoal).
        '.mc-theme .mc-native': defaultVars(),
        ...managerOverrides,
      });
    }),
  ],
};
