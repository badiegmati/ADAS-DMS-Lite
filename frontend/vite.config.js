import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Le frontend ne parle jamais directement à Supabase : toutes les requêtes
// /api sont proxyées vers le backend Spring Boot (seul point d'entrée autorisé).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})