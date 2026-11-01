import axios from 'axios'

// Le frontend ne parle qu'au backend Spring Boot. Le JWT reste dans un cookie httpOnly :
// il n'est jamais lu ni stocké ici (withCredentials envoie simplement le cookie).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  timeout: 60000,
})

// Activité réseau : alimente la barre de progression en haut de page.
let actives = 0
const listeners = new Set()
const notify = () => listeners.forEach((f) => f(actives))
export const onNetworkActivity = (f) => { listeners.add(f); f(actives); return () => listeners.delete(f) }
api.interceptors.request.use((c) => { actives += 1; notify(); return c })

// 401 global : on prévient AuthContext, qui vide la session et redirige vers /login.
api.interceptors.response.use(
  (res) => { actives = Math.max(0, actives - 1); notify(); return res },
  (err) => {
    actives = Math.max(0, actives - 1); notify()
    const url = err.config?.url ?? ''
    const estAuth = url.includes('/auth/')
    if (err.response?.status === 401 && !estAuth) {
      window.dispatchEvent(new Event('auth:unauthorized'))
    }
    return Promise.reject(err)
  },
)

/** Message lisible pour l'utilisateur (aide à la récupération d'erreur). */
export function errorMessage(err) {
  if (err?.response?.data?.message) return err.response.data.message
  if (err?.response?.status === 403) return "Vous n'avez pas accès à cette ressource."
  if (err?.code === 'ECONNABORTED') return 'Le serveur met trop de temps à répondre. Réessayez.'
  if (!err?.response) return 'Impossible de joindre le serveur. Vérifiez votre connexion.'
  return 'Une erreur est survenue. Réessayez.'
}

export default api
