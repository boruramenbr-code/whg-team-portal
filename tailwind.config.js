/** @type {import('tailwindcss').Config} */
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
        whg: {
          navy: '#1B3A6B',
          blue: '#2E86C1',
          lightblue: '#EBF3FB',
          muted: '#7BA7D3',
          // Midnight Navy & Gold — the dark theme (locked July 2026).
          // Layered surfaces: night (canvas) → card → card2 (raised chip).
          night: '#0D1522',
          night2: '#152238',
          card: '#17253D',
          card2: '#1C2A44',
          line: '#26364F',
          snow: '#F2F6FC',
          dim: '#93A3BC',
          gold: '#D9A94E',
          gold2: '#E4BC6B',
          goldink: '#2A1F08',
        },
      },
    },
  },
  plugins: [],
};
