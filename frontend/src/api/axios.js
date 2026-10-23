import axios from 'axios'

// Instance unique utilisée par toute l'application pour parler au backend
// Spring Boot (jamais à Supabase directement). Le cookie JWT httpOnly est
// envoyé automatiquement grâce à `withCredentials`.
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Permet à AuthContext de s'abonner à la déconnexion automatique sur 401,
// sans créer de dépendance circulaire entre axios.js et le contexte React.
let unauthorizedHandler = null
export function registerUnauthorizedHandler(fn) {
  unauthorizedHandler = fn
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      unauthorizedHandler?.()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api