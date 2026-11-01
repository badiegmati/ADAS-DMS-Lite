import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { auth } from '../api/endpoints'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)   // { id, role, nom }
  const [loading, setLoading] = useState(true)

  // Restaure la session à partir du cookie httpOnly (le JWT n'est jamais lu côté JS).
  useEffect(() => {
    let actif = true
    auth.me()
      .then((u) => actif && setUser(u))
      .catch(() => actif && setUser(null))
      .finally(() => actif && setLoading(false))
    return () => { actif = false }
  }, [])

  // 401 reçu de n'importe quel appel : on vide la session (ProtectedRoute redirige vers /login).
  useEffect(() => {
    const onExpire = () => setUser(null)
    window.addEventListener('auth:unauthorized', onExpire)
    return () => window.removeEventListener('auth:unauthorized', onExpire)
  }, [])

  const login = useCallback(async (role, identifiant, motDePasse) => {
    const u = await auth.login(role, identifiant, motDePasse)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(async () => {
    try { await auth.logout() } finally { setUser(null) }
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
