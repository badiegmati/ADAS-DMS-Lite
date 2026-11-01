import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { onNetworkActivity } from '../../api/axios'

/** Fine barre animée en haut de page pendant les appels réseau (visibilité de l'état du système). */
export default function TopProgress() {
  const [busy, setBusy] = useState(false)
  useEffect(() => onNetworkActivity((n) => setBusy(n > 0)), [])
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-[3px]" aria-hidden="true">
      <AnimatePresence>
        {busy && (
          <motion.div key="bar" className="h-full w-1/3 rounded-r-full bg-gradient-to-r from-transparent via-accent to-accent shadow-glow"
            initial={{ x: '-100%', opacity: 0 }} animate={{ x: '320%', opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ x: { duration: 1.1, ease: 'easeInOut', repeat: Infinity }, opacity: { duration: 0.2 } }} />
        )}
      </AnimatePresence>
    </div>
  )
}
