import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { motion } from 'framer-motion'
import useReducedMotion from '../../hooks/useReducedMotion'
import { nomComplet, score } from '../../lib/format'

/** Bannière d'alerte critique (role=alert) : annoncée immédiatement aux lecteurs d'écran. */
export default function CriticalBanner({ conducteurs = [] }) {
  const reduce = useReducedMotion()
  if (!conducteurs.length) return null
  return (
    <motion.section
      role="alert"
      initial={reduce ? false : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-6 rounded-card border border-risk-critique/60 bg-risk-critique/10 p-4 ${reduce ? '' : 'animate-pulseRing'}`}
    >
      <h2 className="flex items-center gap-2 text-lg font-bold text-risk-critique">
        <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        {conducteurs.length === 1 ? '1 conducteur en niveau critique' : `${conducteurs.length} conducteurs en niveau critique`}
      </h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {conducteurs.map((c) => (
          <li key={c.id}>
            <Link to={`/gestionnaire/conducteurs/${c.id}`}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-risk-critique/50 bg-bg/60 px-3 py-2 text-sm font-semibold hover:bg-risk-critique/20">
              {nomComplet(c)} <span className="tabular-nums text-risk-critique">{score(c.score?.valeur)}</span>
              <span className="sr-only">— voir le détail</span>
            </Link>
          </li>
        ))}
      </ul>
    </motion.section>
  )
}
