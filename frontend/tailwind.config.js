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
          DEFAULT: '#1E60D5', // primary_container
          hover: '#0048af', // primary
          light: '#b1c5ff', // primary_fixed_dim
          dark: '#001946', // on_primary_fixed
        },
        secondary: {
          DEFAULT: '#505f76',
          hover: '#38485d',
          light: '#d0e1fb',
          dark: '#0b1c30',
        },
        tertiary: {
          DEFAULT: '#005479',
          hover: '#004c6e',
          light: '#cfe9ff',
          dark: '#001e2f',
        },
        surface: {
          DEFAULT: '#ffffff',
          dim: '#d7dadd',
          bright: '#f7fafd',
          variant: '#e0e3e6',
          dark: '#181c1e', // In dark mode, background becomes darker
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        pulseBg: '#f7fafd', // Background
        pulseCard: '#ffffff',
        pulseBorder: '#e0e3e6', // outline_variant
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'ambient': '0px 4px 20px rgba(30, 96, 213, 0.05)',
        'ambient-lg': '0px 8px 30px rgba(30, 96, 213, 0.08)',
        'ambient-dark': '0px 4px 20px rgba(0, 0, 0, 0.4)',
      },
      borderRadius: {
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
