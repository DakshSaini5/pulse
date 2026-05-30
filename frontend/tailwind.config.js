/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enables toggleable dark mode support
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB', // Medical blue
          hover: '#1D4ED8',
          light: '#DBEAFE',
          dark: '#1E40AF',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        pulseBg: '#F8FAFC', // slate-50
        pulseCard: '#FFFFFF',
        pulseBorder: '#E2E8F0', // slate-200
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
