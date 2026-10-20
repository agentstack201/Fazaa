/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        crimson: { DEFAULT: '#9E1B20', dark: '#7A1418', soft: '#F6E7E8' },
        obsidian: { DEFAULT: '#121316', 2: '#1C1E22', 3: '#2A2D33' },
        silver: '#E5E7EB',
      },
      fontFamily: {
        ar: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        en: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
