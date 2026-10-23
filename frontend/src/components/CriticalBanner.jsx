import { AnimatePresence, motion } from 'framer-motion';
import { Siren, X } from 'lucide-react';

/**
 * Bandeau d'alerte critique pulsant, affiché quand un conducteur passe en niveau CRITIQUE.
 */
export default function CriticalBanner({ visible, conducteurNom, score, onDismiss }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative overflow-hidden rounded-xl border border-risk-critique/50 bg-risk-critique/10 px-5 py-4 mb-4 flex items-center gap-4 animate-pulse-neon"
        >
          <div className="relative w-10 h-10 rounded-full bg-risk-critique/20 flex items-center justify-center shrink-0">
            <Siren size={20} className="text-risk-critique" />
          </div>

          <div className="relative flex-1">
            <p className="font-semibold text-risk-critique">Niveau de risque critique détecté</p>
            <p className="text-sm text-slate-300">
              {conducteurNom ? `${conducteurNom} — ` : ''}Score actuel : <span className="font-bold">{score}</span>/100.
              Une intervention immédiate est recommandée.
            </p>
          </div>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="relative p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}