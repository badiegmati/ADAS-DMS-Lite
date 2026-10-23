import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

// Petit bus d'événements pour déclencher des toasts depuis n'importe où dans l'app,
// sans Context ni provider. <ToastContainer /> doit être monté une seule fois (dans App.jsx),
// puis on appelle toast.success('...') / toast.error('...') / toast.info('...') partout.
const listeners = new Set();
let idCounter = 0;

function emit(type, message, duration = 4000) {
  const id = ++idCounter;
  listeners.forEach((listener) => listener({ id, type, message, duration }));
}

export const toast = {
  success: (message, duration) => emit('success', message, duration),
  error: (message, duration) => emit('error', message, duration),
  info: (message, duration) => emit('info', message, duration),
};

const TYPE_CONFIG = {
  success: { icon: CheckCircle2, text: 'text-risk-faible', border: 'border-risk-faible/40' },
  error: { icon: XCircle, text: 'text-risk-critique', border: 'border-risk-critique/40' },
  info: { icon: Info, text: 'text-role-gestionnaire', border: 'border-role-gestionnaire/40' },
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const listener = (t) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== t.id));
      }, t.duration);
    };
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  function close(id) {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[90vw]">
      <AnimatePresence>
        {toasts.map((t) => {
          const config = TYPE_CONFIG[t.type] ?? TYPE_CONFIG.info;
          const Icon = config.icon;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              className={`glass-card border ${config.border} px-4 py-3 flex items-start gap-3`}
            >
              <Icon size={18} className={`${config.text} shrink-0 mt-0.5`} />
              <p className="text-sm text-slate-200 flex-1">{t.message}</p>
              <button onClick={() => close(t.id)} className="text-slate-500 hover:text-white shrink-0">
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}