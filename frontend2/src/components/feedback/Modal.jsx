import { useEffect, useId, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { dialogVariants } from '../../design/motion'

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Boîte de dialogue accessible : role=dialog, aria-modal, piège de focus,
 * fermeture par Échap, focus rendu à l'élément déclencheur à la fermeture.
 */
export default function Modal({ open, title, onClose, children, role = 'dialog', size = 'md', initialFocus }) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return undefined
    const previous = document.activeElement
    const node = ref.current
    const target = (initialFocus && node?.querySelector(initialFocus)) || node?.querySelector(FOCUSABLE)
    target?.focus()
    document.body.style.overflow = 'hidden'

    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
      if (e.key !== 'Tab' || !node) return
      const items = [...node.querySelectorAll(FOCUSABLE)]
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previous?.focus?.()
    }
  }, [open, onClose, initialFocus])

  const width = size === 'lg' ? 'max-w-2xl' : 'max-w-md'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            ref={ref}
            role={role}
            aria-modal="true"
            aria-labelledby={titleId}
            variants={dialogVariants}
            initial="hidden" animate="show" exit="exit"
            className={`glass-raised w-full ${width} p-6 shadow-glow`}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 id={titleId} className="text-xl font-bold">{title}</h2>
              <button type="button" onClick={onClose} aria-label="Fermer la fenêtre"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-white/10 hover:text-ink">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
