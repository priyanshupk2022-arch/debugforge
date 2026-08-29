/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#090d16',
          darkCard: '#111726',
          darkBorder: '#1e293b',
          accent: '#e5533c',
          accentHover: '#cc422c',
          accentLight: '#fff1f0',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -4px rgba(0, 0, 0, 0.02)',
        'float': '0 20px 40px -15px rgba(0, 0, 0, 0.07)',
        'glow': '0 0 30px -5px rgba(229, 83, 60, 0.25)',
      }
    },
  },
  plugins: [],
}
