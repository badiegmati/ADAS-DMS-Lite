import { Navigate, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { useAuth } from './context/AuthContext'
import { ROLES } from './design/tokens'
import ProtectedRoute from './routes/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import Login from './pages/Login'

import AdminDashboard from './pages/admin/AdminDashboard'
import GestionnairesPage from './pages/admin/GestionnairesPage'
import FleetDashboard from './pages/gestionnaire/FleetDashboard'
import DriverDetail from './pages/gestionnaire/DriverDetail'
import ConducteursPage from './pages/gestionnaire/ConducteursPage'
import VehiculesPage from './pages/gestionnaire/VehiculesPage'
import GestMessagesPage from './pages/gestionnaire/MessagesPage'
import DriverDashboard from './pages/conducteur/DriverDashboard'
import HistoriquePage from './pages/conducteur/HistoriquePage'
import CartePage from './pages/conducteur/CartePage'
import ConseilsPage from './pages/conducteur/ConseilsPage'
import ConduMessagesPage from './pages/conducteur/MessagesPage'
import ProfilPage from './pages/conducteur/ProfilPage'

function Accueil() {
  const { user, loading } = useAuth()
  if (loading) return null
  return <Navigate to={user ? ROLES[user.role]?.home ?? '/login' : '/login'} replace />
}

export default function App() {
  return (
    // reducedMotion="user" : Framer Motion respecte prefers-reduced-motion pour tout le site
    <MotionConfig reducedMotion="user">
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute role="ADMIN" />}>
          <Route element={<AppLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/gestionnaires" element={<GestionnairesPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute role="GESTIONNAIRE" />}>
          <Route element={<AppLayout />}>
            <Route path="/gestionnaire" element={<FleetDashboard />} />
            <Route path="/gestionnaire/conducteurs" element={<ConducteursPage />} />
            <Route path="/gestionnaire/conducteurs/:id" element={<DriverDetail />} />
            <Route path="/gestionnaire/vehicules" element={<VehiculesPage />} />
            <Route path="/gestionnaire/messages" element={<GestMessagesPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute role="CONDUCTEUR" />}>
          <Route element={<AppLayout />}>
            <Route path="/conducteur" element={<DriverDashboard />} />
            <Route path="/conducteur/historique" element={<HistoriquePage />} />
            <Route path="/conducteur/carte" element={<CartePage />} />
            <Route path="/conducteur/conseils" element={<ConseilsPage />} />
            <Route path="/conducteur/messages" element={<ConduMessagesPage />} />
            <Route path="/conducteur/profil" element={<ProfilPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Accueil />} />
      </Routes>
    </MotionConfig>
  )
}
