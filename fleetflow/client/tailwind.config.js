/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        sidebar: {
          bg: '#0f172a',
          hover: '#1e293b',
          active: '#1e40af',
          text: '#94a3b8',
          textActive: '#ffffff',
        },
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f8f9fb',
          border: 'rgba(0,0,0,0.06)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'dropdown': '0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.04)',
        'topbar': '0 1px 3px rgba(0,0,0,0.05)',
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
