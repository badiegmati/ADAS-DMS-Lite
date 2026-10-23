import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api, { registerUnauthorizedHandler } from '../api/axios'

const AuthContext = createContext(null)

/**
 * Fournit l'utilisateur connecté (id, role, nom) à toute l'application.
 * La session est entièrement gérée par le cookie JWT httpOnly posé par
 * le backend : ce contexte ne stocke jamais de token côté client.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Déconnexion automatique si le backend répond 401 (token invalide/expiré)
  useEffect(() => {
    registerUnauthorizedHandler(() => setUser(null))
  }, [])

  // role attendu : 'admin' | 'gestionnaire' | 'conducteur'
  const login = async (role, identifiant, motDePasse) => {
    const { data } = await api.post(`/auth/${role}/login`, { identifiant, motDePasse })
    setUser(data)
    return data
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé à l’intérieur de <AuthProvider>')
  return ctx
}