import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import ToastContainer from './components/Toast';

// Pages publiques
import Login from './pages/Login';

// Pages admin
import AdminDashboard from './pages/admin/AdminDashboard';
import GestionnairesPage from './pages/admin/GestionnairesPage';

// Pages gestionnaire
import FleetDashboard from './pages/gestionnaire/FleetDashboard';
import ConducteursPage from './pages/gestionnaire/ConducteursPage';
import DriverDetail from './pages/gestionnaire/DriverDetail';
import VehiculesPage from './pages/gestionnaire/VehiculesPage';
import GestionnaireMessagesPage from './pages/gestionnaire/MessagesPage';

// Pages conducteur
import DriverDashboard from './pages/conducteur/DriverDashboard';
import HistoriquePage from './pages/conducteur/HistoriquePage';
import CartePage from './pages/conducteur/CartePage';
import ConseilsPage from './pages/conducteur/ConseilsPage';
import ConducteurMessagesPage from './pages/conducteur/MessagesPage';
import ProfilPage from './pages/conducteur/ProfilPage';

// Redirige automatiquement vers le bon dashboard selon le rôle de l'utilisateur connecté
function RedirectHome() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'ADMIN':
      return <Navigate to="/admin/dashboard" replace />;
    case 'GESTIONNAIRE':
      return <Navigate to="/gestionnaire/dashboard" replace />;
    case 'CONDUCTEUR':
      return <Navigate to="/conducteur/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

// Empêche un utilisateur déjà connecté de revoir l'écran de connexion
function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <RedirectHome />;

  return children;
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Route publique */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />

        {/* Racine : redirige selon le rôle */}
        <Route path="/" element={<RedirectHome />} />

        {/* Espace ADMIN */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/gestionnaires" element={<GestionnairesPage />} />
        </Route>

        {/* Espace GESTIONNAIRE */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['GESTIONNAIRE']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/gestionnaire/dashboard" element={<FleetDashboard />} />
          <Route path="/gestionnaire/conducteurs" element={<ConducteursPage />} />
          <Route path="/gestionnaire/conducteurs/:id" element={<DriverDetail />} />
          <Route path="/gestionnaire/vehicules" element={<VehiculesPage />} />
          <Route path="/gestionnaire/messages" element={<GestionnaireMessagesPage />} />
        </Route>

        {/* Espace CONDUCTEUR */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['CONDUCTEUR']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/conducteur/dashboard" element={<DriverDashboard />} />
          <Route path="/conducteur/historique" element={<HistoriquePage />} />
          <Route path="/conducteur/carte" element={<CartePage />} />
          <Route path="/conducteur/conseils" element={<ConseilsPage />} />
          <Route path="/conducteur/messages" element={<ConducteurMessagesPage />} />
          <Route path="/conducteur/profil" element={<ProfilPage />} />
        </Route>

        {/* Toute route inconnue -> racine (qui redirige elle-même proprement) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Monté une seule fois : affiche les notifications déclenchées via toast.success/error/info */}
      <ToastContainer />
    </>
  );
}