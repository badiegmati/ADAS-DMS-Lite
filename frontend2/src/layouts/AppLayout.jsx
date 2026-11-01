import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Car, ClipboardList, FileClock, Gauge, LayoutDashboard, LogOut, MapPinned, Menu,
  MessageSquare, Sparkles, UserCog, UserRound, Users, X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../design/tokens'
import { pageVariants } from '../design/motion'
import SkipLink from '../components/a11y/SkipLink'
import { AuroraBackground } from './AuthLayout'
import TopProgress from '../components/layout/TopProgress'
import useSpotlight from '../hooks/useSpotlight'

const NAV = {
  ADMIN: [
    { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/admin/gestionnaires', label: 'Gestionnaires', icon: UserCog },
  ],
  GESTIONNAIRE: [
    { to: '/gestionnaire', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/gestionnaire/conducteurs', label: 'Conducteurs', icon: Users },
    { to: '/gestionnaire/vehicules', label: 'Véhicules', icon: Car },
    { to: '/gestionnaire/messages', label: 'Messages', icon: MessageSquare },
  ],
  CONDUCTEUR: [
    { to: '/conducteur', label: 'Mon score', icon: Gauge, end: true },
    { to: '/conducteur/historique', label: 'Historique', icon: FileClock },
    { to: '/conducteur/carte', label: 'Carte', icon: MapPinned },
    { to: '/conducteur/conseils', label: 'Conseils IA', icon: Sparkles },
    { to: '/conducteur/messages', label: 'Messages', icon: MessageSquare },
    { to: '/conducteur/profil', label: 'Profil', icon: UserRound },
  ],
}

function NavList({ items, onNavigate, group }) {
  return (
    <ul className="space-y-1">
      {items.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink to={to} end={end} onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'text-accent' : 'text-muted hover:text-ink'}`}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span layoutId={`nav-pill-${group}`} aria-hidden="true"
                    className="absolute inset-0 rounded-xl bg-accent/15 shadow-[inset_3px_0_0_rgb(var(--accent))]"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
                )}
                <span className="absolute inset-0 rounded-xl bg-white/5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                <Icon className="relative h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
                <span className="relative">{label}</span>
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const role = ROLES[user.role]
  useSpotlight()
  const initiales = user.nom.split(' ').map((m) => m[0]).slice(0, 2).join('').toUpperCase()
  const items = NAV[user.role] ?? []

  useEffect(() => { setOpen(false) }, [location.pathname])
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const sidebar = (
    <>
      <div className="mb-8 flex items-center gap-3 px-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-accent to-[rgb(var(--accent-2))] text-bg shadow-glow transition-transform duration-300 hover:rotate-6 hover:scale-105">
          <ClipboardList className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-bold leading-tight">ADAS-DMS</p>
          <p className="text-xs text-muted">{role.label}</p>
        </div>
      </div>
      <nav aria-label="Navigation principale"><NavList items={items} group="d" onNavigate={() => setOpen(false)} /></nav>
      <div className="mt-auto flex items-center gap-3 rounded-xl border border-line bg-white/5 p-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-[rgb(var(--accent-2))] font-bold text-bg" aria-hidden="true">{initiales}</span>
        <div className="min-w-0"><p className="truncate text-sm font-semibold">{user.nom}</p><p className="truncate text-xs text-muted">{role.label}</p></div>
      </div>
    </>
  )

  return (
    <div data-role={user.role} className="relative min-h-screen">
      <SkipLink />
      <TopProgress />
      <AuroraBackground color1={role.accent} color2={role.accent2} />

      {/* Barre latérale (desktop) */}
      <aside className="glass fixed inset-y-3 left-3 z-20 hidden w-64 flex-col p-4 lg:flex">{sidebar}</aside>

      {/* Tiroir (mobile) */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-30 bg-black/60 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside id="menu-mobile" className="glass fixed inset-y-3 left-3 z-40 flex w-72 flex-col p-4 lg:hidden"
                          initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 36 }}>
              <button type="button" className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-lg hover:bg-white/10"
                      aria-label="Fermer le menu" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="relative z-10 lg:pl-72">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-bg/70 px-4 py-3 backdrop-blur-xl sm:px-8">
          <button type="button" className="btn-ghost lg:hidden" aria-expanded={open} aria-controls="menu-mobile"
                  onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" aria-hidden="true" /> Menu
          </button>
          <p className="hidden text-sm text-muted lg:block">Connecté en tant que <strong className="text-ink">{user.nom}</strong></p>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-muted lg:hidden">{user.nom}</span>
            <button type="button" className="btn-ghost" onClick={logout}>
              <LogOut className="h-4 w-4" aria-hidden="true" /> Se déconnecter
            </button>
          </div>
        </header>

        <main id="contenu" tabIndex={-1} className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
