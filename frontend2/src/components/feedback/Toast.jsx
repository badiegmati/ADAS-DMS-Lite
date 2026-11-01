import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { toastVariants } from '../../design/motion'

const STYLES = {
  success: { Icon: CheckCircle2, color: 'text-risk-faible', label: 'Succès' },
  error:   { Icon: XCircle,      color: 'text-risk-critique', label: 'Erreur' },
  info:    { Icon: Info,         color: 'text-accent', label: 'Information' },
}

export default function Toast({ toast, onClose }) {
  const { Icon, color, label } = STYLES[toast.type] ?? STYLES.info

  useEffect(() => {
    const t = setTimeout(() => onClose(toast.id), toast.type === 'error' ? 8000 : 5000)
    return () => clearTimeout(t)
  }, [toast.id, toast.type, onClose])

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="glass-raised pointer-events-auto relative flex items-start gap-3 overflow-hidden p-3 shadow-card"
    >
      <motion.span aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-[3px] origin-left ${toast.type === 'error' ? 'bg-risk-critique' : toast.type === 'success' ? 'bg-risk-faible' : 'bg-accent'}`}
        initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: toast.type === 'error' ? 8 : 5, ease: 'linear' }} />
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} aria-hidden="true" />
      <p className="flex-1 text-sm">
        <span className="sr-only">{label} : </span>
        {toast.message}
      </p>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-white/10 hover:text-ink"
        aria-label="Fermer la notification"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </motion.div>
  )
}
