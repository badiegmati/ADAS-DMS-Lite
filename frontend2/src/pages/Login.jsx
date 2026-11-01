import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Eye, LogIn, MapPinned, ShieldCheck, Truck, UserRound } from 'lucide-react'
import AuthLayout from '../layouts/AuthLayout'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../api/axios'
import { ROLES } from '../design/tokens'
import Field from '../components/layout/Field'
import ScoreGauge from '../components/data/ScoreGauge'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { listContainer, listItem } from '../design/motion'

const CHOIX = [
  { role: 'GESTIONNAIRE', icon: Truck, ident: 'Adresse e-mail', ph: 'gestionnaire@test.tn', type: 'email' },
  { role: 'CONDUCTEUR', icon: UserRound, ident: 'Code conducteur ou e-mail', ph: 'C10', type: 'text' },
  { role: 'ADMIN', icon: ShieldCheck, ident: 'Identifiant', ph: 'admin', type: 'text' },
]
const DEMO = { GESTIONNAIRE: ['gestionnaire@test.tn', 'Test1234!'], CONDUCTEUR: ['C10', 'Test1234!'], ADMIN: ['admin', 'Admin@12345'] }
const RGB = { ADMIN: '168 85 247', GESTIONNAIRE: '6 182 212', CONDUCTEUR: '16 185 129' }
const SHOW_DEMO = import.meta.env.VITE_SHOW_DEMO !== 'false'

const ATOUTS = [
  { icon: Eye, titre: 'Détection en temps réel', texte: 'Somnolence, distraction et téléphone détectés par webcam.' },
  { icon: Brain, titre: 'Conseils personnalisés', texte: 'Des recommandations générées par IA à partir de l’historique.' },
  { icon: MapPinned, titre: 'Suivi de flotte', texte: 'Scores, alertes et positions sur un seul tableau de bord.' },
]

export default function Login() {
  useDocumentTitle('Connexion')
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [role, setRole] = useState('GESTIONNAIRE')
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [busy, setBusy] = useState(false)
  const choix = CHOIX.find((c) => c.role === role)

  if (user) return <Navigate to={ROLES[user.role].home} replace />

  const changerRole = (r) => { setRole(r); setErreur('') }
  const remplirDemo = () => { setIdentifiant(DEMO[role][0]); setMotDePasse(DEMO[role][1]); setErreur('') }

  const submit = async (e) => {
    e.preventDefault()
    if (!identifiant.trim() || !motDePasse) { setErreur('Renseignez votre identifiant et votre mot de passe.'); return }
    setBusy(true); setErreur('')
    try {
      const u = await login(role, identifiant.trim(), motDePasse)
      const from = location.state?.from
      navigate(from && from.startsWith(ROLES[u.role].home) ? from : ROLES[u.role].home, { replace: true })
    } catch (err) {
      setErreur(err?.response?.status === 401 ? 'Identifiant ou mot de passe incorrect.' : errorMessage(err))
    } finally { setBusy(false) }
  }

  return (
    <AuthLayout>
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        {/* ── Présentation ── */}
        <motion.section variants={listContainer} initial="hidden" animate="show" aria-label="Présentation" className="hidden lg:block">
          <motion.p variants={listItem} className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
            <span className="h-2 w-2 animate-blink rounded-full bg-accent" aria-hidden="true" /> Supervision du conducteur
          </motion.p>
          <motion.h1 variants={listItem} className="text-gradient font-display text-5xl font-extrabold leading-tight">ADAS-DMS Lite</motion.h1>
          <motion.p variants={listItem} className="mt-4 max-w-md text-lg text-muted">
            Anticipez la fatigue et la distraction au volant, et pilotez votre flotte avec des indicateurs clairs.
          </motion.p>
          <ul className="mt-8 space-y-4">
            {ATOUTS.map(({ icon: Icon, titre, texte }) => (
              <motion.li key={titre} variants={listItem} className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent ring-1 ring-accent/30"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <span><span className="block font-semibold">{titre}</span><span className="text-sm text-muted">{texte}</span></span>
              </motion.li>
            ))}
          </ul>
          <motion.div variants={listItem} className="mt-10 hidden animate-float items-center gap-5 xl:flex" aria-hidden="true">
            <ScoreGauge valeur={34} niveau="MODERE" size={120} stroke={10} />
            <p className="max-w-[14rem] text-sm text-muted">Exemple de score de risque, mis à jour en continu.</p>
          </motion.div>
        </motion.section>

        {/* ── Formulaire ── */}
        <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="glass mx-auto w-full max-w-md p-6 shadow-glow sm:p-8" data-role={role}>
          <h2 className="font-display text-2xl font-bold">Connexion</h2>
          <p className="mb-6 mt-1 text-muted lg:hidden">ADAS-DMS Lite — supervision du conducteur</p>
          <p className="mb-6 mt-1 hidden text-muted lg:block">Choisissez votre profil puis identifiez-vous.</p>

          <div role="radiogroup" aria-label="Choisissez votre profil" className="relative mb-6 grid grid-cols-3 gap-1 rounded-2xl border border-line bg-bg/50 p-1">
            {CHOIX.map(({ role: r, icon: Icon }) => {
              const actif = r === role
              return (
                <button key={r} type="button" role="radio" aria-checked={actif} onClick={() => changerRole(r)}
                  className={`relative flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold transition-colors ${actif ? 'text-bg' : 'text-muted hover:text-ink'}`}>
                  {actif && (
                    <motion.span layoutId="role-pill" aria-hidden="true" className="absolute inset-0 rounded-xl shadow-glow"
                      style={{ backgroundColor: `rgb(${RGB[r]})` }} transition={{ type: 'spring', stiffness: 420, damping: 32 }} />
                  )}
                  <Icon className="relative h-5 w-5" aria-hidden="true" />
                  <span className="relative">{ROLES[r].label.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>

          <form onSubmit={submit} noValidate>
            <Field label={choix.ident} required>
              <input className="field" type={choix.type} autoComplete="username" placeholder={choix.ph}
                     value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} />
            </Field>
            <Field label="Mot de passe" required>
              <input className="field" type="password" autoComplete="current-password"
                     value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
            </Field>

            {erreur && (
              <motion.p role="alert" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }} transition={{ duration: 0.4 }}
                className="mb-4 rounded-xl border border-risk-critique/50 bg-risk-critique/10 px-3 py-2 text-sm font-medium text-risk-critique">
                {erreur}
              </motion.p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              <LogIn className="h-4 w-4" aria-hidden="true" /> {busy ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          {SHOW_DEMO && (
            <button type="button" onClick={remplirDemo} className="mt-4 w-full rounded-lg py-2 text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
              Remplir avec le compte de démonstration ({ROLES[role].label.toLowerCase()})
            </button>
          )}
        </motion.div>
      </div>
    </AuthLayout>
  )
}
