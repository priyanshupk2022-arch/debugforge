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
          primary: '#17171b',
          secondary: '#56565f',
          tertiary: '#f0f0f5',
          surface: '#ffffff',
          base: '#000000',
          accent: '#e5533c',
          accentDark: '#c23a25',
          raised: '#f7f7f9',
          border: '#e2e2e8',
          darkBg: '#0f0f13',
          darkCard: '#18181f',
        }
      },
      fontFamily: {
        sans: ['Archivo', '-apple-system', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'],
      },
      borderRadius: {
        'xs': '5px',
        'sm': '7px',
        'md': '8px',
        'lg': '9px',
        'xl': '999px',
      },
      boxShadow: {
        'brutal-accent': '2px 2px 0px 0px #c23a25',
        'brutal-dark': '3px 3px 0px 0px #17171b',
        'brutal-sm': '2px 2px 0px 0px #17171b',
        'card': '0 4px 20px -2px rgba(23, 23, 27, 0.05), 0 2px 6px -1px rgba(23, 23, 27, 0.02)',
      }
    },
  },
  plugins: [],
}
