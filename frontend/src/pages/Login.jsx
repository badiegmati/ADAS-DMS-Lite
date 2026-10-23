import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Users, Car, Eye, EyeOff, LogIn } from 'lucide-react';
import SoftAurora from '../components/SoftAurora';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  {
    key: 'admin',
    label: 'Admin',
    icon: ShieldCheck,
    color: '#A855F7',
    placeholder: 'admin',
    dashboard: '/admin/dashboard',
  },
  {
    key: 'gestionnaire',
    label: 'Gestionnaire',
    icon: Users,
    color: '#06B6D4',
    placeholder: 'gestionnaire@entreprise.tn',
    dashboard: '/gestionnaire/dashboard',
  },
  {
    key: 'conducteur',
    label: 'Conducteur',
    icon: Car,
    color: '#10B981',
    placeholder: 'Code conducteur (ex: C10)',
    dashboard: '/conducteur/dashboard',
  },
];

export default function Login() {
  const [roleKey, setRoleKey] = useState('conducteur');
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [erreur, setErreur] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const role = ROLES.find((r) => r.key === roleKey);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');

    if (!identifiant.trim() || !motDePasse) {
      setErreur('Veuillez renseigner tous les champs.');
      return;
    }

    setLoading(true);
    try {
      await login(roleKey, identifiant.trim(), motDePasse);
      navigate(role.dashboard, { replace: true });
    } catch (err) {
      const message = err?.response?.data?.message;
      setErreur(message || 'Identifiant ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-bg px-4">
      <div className="absolute inset-0">
        <SoftAurora
          color1={role.color}
          color2="#0D0D1A"
          speed={0.6}
          scale={1.2}
          brightness={0.9}
          enableMouseInteraction
        />
      </div>
      <div className="absolute inset-0 bg-bg/60" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ backgroundColor: `${role.color}22`, boxShadow: `0 0 30px ${role.color}44` }}
          >
            <role.icon size={28} style={{ color: role.color }} />
          </motion.div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ADAS-DMS Lite</h1>
          <p className="text-slate-400 text-sm mt-1">Supervision intelligente de la conduite</p>
        </div>

        <div className="glass-card p-6">
          <div className="grid grid-cols-3 gap-2 mb-6 bg-bg-card2 rounded-xl p-1">
            {ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => {
                  setRoleKey(r.key);
                  setErreur('');
                }}
                className={`relative flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  roleKey === r.key ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {roleKey === r.key && (
                  <motion.div
                    layoutId="role-active-bg"
                    className="absolute inset-0 rounded-lg"
                    style={{ backgroundColor: `${r.color}26`, border: `1px solid ${r.color}55` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <r.icon size={16} className="relative" style={{ color: roleKey === r.key ? r.color : undefined }} />
                <span className="relative">{r.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Identifiant</label>
              <input
                type="text"
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                placeholder={role.placeholder}
                className="input-field w-full"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="••••••••"
                  className="input-field w-full pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {erreur && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-risk-critique text-sm bg-risk-critique/10 border border-risk-critique/30 rounded-lg px-3 py-2"
                >
                  {erreur}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: role.color }}
            >
              {loading ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                />
              ) : (
                <>
                  <LogIn size={16} />
                  Se connecter
                </>
              )}
            </motion.button>
          </form>
        </div>

        
      </motion.div>
    </div>
  );
}