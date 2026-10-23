import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, LayoutDashboard, Building2, Users, Car, MessageSquare, History, Map, Sparkles, UserCircle } from 'lucide-react';
import SoftAurora from '../components/SoftAurora';
import { useAuth } from '../context/AuthContext';

// Configuration par rôle : couleur d'accent + éléments de navigation
const ROLE_CONFIG = {
  ADMIN: {
    label: 'Administrateur',
    color: '#A855F7',
    items: [
      { to: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { to: '/admin/gestionnaires', label: 'Gestionnaires', icon: Building2 },
    ],
  },
  GESTIONNAIRE: {
    label: 'Gestionnaire',
    color: '#06B6D4',
    items: [
      { to: '/gestionnaire/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { to: '/gestionnaire/conducteurs', label: 'Conducteurs', icon: Users },
      { to: '/gestionnaire/vehicules', label: 'Véhicules', icon: Car },
      { to: '/gestionnaire/messages', label: 'Messagerie', icon: MessageSquare },
    ],
  },
  CONDUCTEUR: {
    label: 'Conducteur',
    color: '#10B981',
    items: [
      { to: '/conducteur/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { to: '/conducteur/historique', label: 'Historique', icon: History },
      { to: '/conducteur/carte', label: 'Carte', icon: Map },
      { to: '/conducteur/conseils', label: 'Conseils', icon: Sparkles },
      { to: '/conducteur/messages', label: 'Messagerie', icon: MessageSquare },
      { to: '/conducteur/profil', label: 'Profil', icon: UserCircle },
    ],
  },
};

// Liste de navigation réutilisée en desktop (sidebar fixe) et mobile (drawer)
function SidebarNav({ items, accent, onNavigate }) {
  return (
    <nav className="flex-1 px-3 space-y-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`
          }
          style={({ isActive }) =>
            isActive ? { backgroundColor: `${accent}26`, border: `1px solid ${accent}55` } : undefined
          }
        >
          <item.icon size={18} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const config = ROLE_CONFIG[user?.role] ?? ROLE_CONFIG.CONDUCTEUR;

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen relative bg-bg text-slate-200">
      {/* Fond animé, accent dynamique selon le rôle connecté */}
      <div className="fixed inset-0 -z-10 opacity-40">
        <SoftAurora color1={config.color} color2="#0D0D1A" speed={0.3} scale={1.4} brightness={0.6} />
      </div>

      <div className="flex min-h-screen">
        {/* Sidebar desktop fixe */}
        <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-white/10 bg-bg-card/60 backdrop-blur-xl">
          <div className="h-16 flex items-center px-5 border-b border-white/10">
            <span className="font-bold text-white tracking-tight">ADAS-DMS Lite</span>
          </div>
          <SidebarNav items={config.items} accent={config.color} />
          <div className="p-3 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-risk-critique hover:bg-risk-critique/10 transition-colors"
            >
              <LogOut size={18} /> Déconnexion
            </button>
          </div>
        </aside>

        {/* Drawer mobile animé */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/60 md:hidden"
                onClick={() => setDrawerOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-bg-card border-r border-white/10 md:hidden"
              >
                <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
                  <span className="font-bold text-white tracking-tight">ADAS-DMS Lite</span>
                  <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                <SidebarNav items={config.items} accent={config.color} onNavigate={() => setDrawerOpen(false)} />
                <div className="p-3 border-t border-white/10">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-risk-critique hover:bg-risk-critique/10 transition-colors"
                  >
                    <LogOut size={18} /> Déconnexion
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Zone principale */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <header className="h-16 shrink-0 flex items-center justify-between px-4 md:px-6 border-b border-white/10 bg-bg-card/60 backdrop-blur-xl">
            <button onClick={() => setDrawerOpen(true)} className="md:hidden text-slate-300 hover:text-white">
              <Menu size={22} />
            </button>

            <div className="hidden md:block">
              <p className="text-sm text-slate-400">{config.label}</p>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: config.color }}
              >
                {user?.nom?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <span className="hidden sm:block text-sm text-slate-300">{user?.nom}</span>
            </div>
          </header>

          {/* Contenu de la page active (injecté par react-router via les routes imbriquées) */}
          <main className="flex-1 p-4 md:p-6 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}