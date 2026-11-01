/** Design tokens : les couleurs viennent de variables CSS (voir src/index.css). */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0D0D1A',
        surface: '#12121F',
        raised: '#1A1A2E',
        ink: '#F1F5F9',
        muted: '#A9B4C7',
        line: 'rgb(255 255 255 / 0.10)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        risk: {
          faible: '#34D399',
          modere: '#FBBF24',
          eleve: '#FB923C',
          critique: '#F87171',
        },
      },
      fontFamily: {
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: { card: '1rem' },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--accent) / 0.35), 0 8px 32px -8px rgb(var(--accent) / 0.35)',
        card: '0 8px 32px -12px rgb(0 0 0 / 0.6)',
      },
      keyframes: {
        glow: { '0%, 100%': { filter: 'drop-shadow(0 0 4px var(--glow))' }, '50%': { filter: 'drop-shadow(0 0 16px var(--glow))' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } },
        blink: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.35 } },
        pulseRing: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(248 113 113 / 0.55)' },
          '50%': { boxShadow: '0 0 0 10px rgb(248 113 113 / 0)' },
        },
      },
      animation: {
        pulseRing: 'pulseRing 2s ease-out infinite',
        glow: 'glow 2.4s ease-in-out infinite',
        float: 'float 9s ease-in-out infinite',
        blink: 'blink 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
