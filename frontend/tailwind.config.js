/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Fond de l'application (glassmorphism sombre)
        bg: {
          DEFAULT: '#0D0D1A',
          card: '#12121F',
          card2: '#1A1A2E',
        },
        // Couleur d'accent par rôle (utilisée dans la sidebar, le fond SoftAurora, etc.)
        role: {
          admin: '#A855F7',        // violet
          gestionnaire: '#06B6D4', // cyan
          conducteur: '#10B981',   // vert émeraude
        },
        // Couleurs des niveaux de risque (score conducteur)
        risk: {
          faible: '#10B981',
          modere: '#EAB308',
          eleve: '#F97316',
          critique: '#EF4444',
        },
        muted: '#475569',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'slide-up': {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        'pulse-neon': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.6)' },
          '50%': { boxShadow: '0 0 0 8px rgba(239,68,68,0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'pulse-neon': 'pulse-neon 2s infinite',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}