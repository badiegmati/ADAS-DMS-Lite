import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../design/tokens'

/** Réserve un groupe de routes à un rôle ; sinon redirige vers /login ou vers l'accueil du rôle. */
export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center" role="status" aria-live="polite">
        <span className="text-muted">Chargement de la session…</span>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.role !== role) return <Navigate to={ROLES[user.role]?.home ?? '/login'} replace />
  return <Outlet />
}
