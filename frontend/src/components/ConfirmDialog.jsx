import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

/**
 * Boîte de dialogue de confirmation générique (suppression, action sensible...).
 */
export default function ConfirmDialog({
  open,
  title = "Confirmer l'action",
  message = 'Êtes-vous sûr de vouloir continuer ?',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  danger = false,
  onConfirm,
  onCancel,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card max-w-sm w-full p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  danger ? 'bg-risk-critique/15' : 'bg-role-admin/15'
                }`}
              >
                <AlertTriangle size={20} className={danger ? 'text-risk-critique' : 'text-role-admin'} />
              </div>
              <h3 className="font-semibold text-slate-100">{title}</h3>
            </div>

            <p className="text-sm text-slate-400 mb-6">{message}</p>

            <div className="flex justify-end gap-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  danger
                    ? 'bg-risk-critique text-white hover:bg-risk-critique/80'
                    : 'bg-role-admin text-white hover:bg-role-admin/80'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}