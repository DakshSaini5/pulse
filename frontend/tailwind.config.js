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
          DEFAULT: '#1A3BAA', // Pulse Blue
          hover: '#142E86',   // Blue hover
          tint: '#EEF2FC',    // Blue tint
          light: '#EEF2FC',
          dark: '#0F1E4A',
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: '#4B5563', // Text secondary
          hover: '#374151',
          light: '#F3F4F6',
          dark: '#1F2937',
          foreground: "var(--secondary-foreground)",
        },
        tertiary: {
          DEFAULT: '#1A3BAA',
          hover: '#142E86',
          light: '#EEF2FC',
          dark: '#0F1E4A',
        },
        surface: {
          DEFAULT: '#F5F7FA', // Surface
          dim: '#E5E7EB',
          bright: '#FFFFFF',
          variant: '#E5E7EB',
          dark: '#181c1e',
        },
        success: '#12805C',
        warning: '#B45309',
        danger: '#C62828',
        pulseRed: '#E7373A',
        footerBg: '#0F1E4A',
        pulseBg: '#FFFFFF',
        pulseCard: '#FFFFFF',
        pulseBorder: '#E5E7EB',
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'ambient': '0 1px 3px rgba(0, 0, 0, 0.06)',
        'ambient-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
        'ambient-dark': '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
      },
      borderRadius: {
        '4xl': '2rem',
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      transitionDuration: {
        '4000': '4000ms',
        '6000': '6000ms',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
