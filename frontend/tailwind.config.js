/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        klee: {
          bg: '#1C1A17',
          surface: '#2C2820',
          accent: '#C8391A',
          available: '#D4941A',
          taken: '#8B2E1A',
          error: '#C4821A',
          text: '#F5F0E8',
          muted: '#9A9488',
        }
      },
      fontFamily: {
        heading: ['Josefin Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        'none': '0',
      }
    },
  },
  plugins: [],
}
