import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import Toast from '../components/feedback/Toast'
import { AnimatePresence } from 'framer-motion'

const ToastContext = createContext(null)
let compteur = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const push = useCallback((type, message) => {
    const id = ++compteur
    setToasts((t) => [...t.slice(-3), { id, type, message }])
    return id
  }, [])

  const api = useMemo(() => ({
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  }), [push])

  const erreurs = toasts.filter((t) => t.type === 'error')
  const autres = toasts.filter((t) => t.type !== 'error')

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Deux régions live : les erreurs sont annoncées de façon assertive */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
        <div role="status" aria-live="polite" className="flex flex-col gap-2">
          <AnimatePresence>
            {autres.map((t) => <Toast key={t.id} toast={t} onClose={remove} />)}
          </AnimatePresence>
        </div>
        <div role="alert" aria-live="assertive" className="flex flex-col gap-2">
          <AnimatePresence>
            {erreurs.map((t) => <Toast key={t.id} toast={t} onClose={remove} />)}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
