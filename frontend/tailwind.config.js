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
          DEFAULT: '#0D6EFD',
          hover: '#0b5ed7',
          light: '#e7f1ff',
          dark: '#0a58ca',
        },
        success: '#198754',
        warning: '#FFC107',
        danger: '#DC3545',
        pulseBg: '#0B0F19',
        pulseCard: 'rgba(255, 255, 255, 0.03)',
        pulseBorder: 'rgba(255, 255, 255, 0.08)',
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
