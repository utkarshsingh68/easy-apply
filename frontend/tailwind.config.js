/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: '#0f172a',
          card: '#111827',
          hover: '#1e293b',
          border: 'rgba(255,255,255,0.07)',
        },
        brand: {
          primary: '#6366f1',
          'primary-hover': '#4f46e5',
          secondary: '#22c55e',
          'secondary-hover': '#16a34a',
        },
      },
      boxShadow: {
        card: '0 0 0 1px rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.4)',
        'card-hover': '0 0 0 1px rgba(99,102,241,0.25), 0 8px 32px rgba(0,0,0,0.5)',
        glow: '0 0 24px rgba(99,102,241,0.2)',
        'glow-green': '0 0 24px rgba(34,197,94,0.15)',
      },
      backgroundImage: {
        'card-gradient': 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(30,41,59,0) 50%)',
        'sidebar-gradient': 'linear-gradient(180deg, rgba(99,102,241,0.05) 0%, rgba(15,23,42,0) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease',
        'slide-up': 'slideUp 0.3s ease',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
