/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        whg: {
          navy: '#1B3A6B',
          blue: '#2E86C1',
          lightblue: '#EBF3FB',
          muted: '#7BA7D3',
        },
      },
    },
  },
  plugins: [],
};
