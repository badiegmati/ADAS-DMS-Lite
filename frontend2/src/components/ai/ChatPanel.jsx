import { useEffect, useId, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { dayTime } from '../../lib/format'
import EmptyState from '../feedback/EmptyState'

/** Messagerie : journal annoncé (role=log), saisie avec étiquette, envoi par bouton ou Ctrl+Entrée. */
export default function ChatPanel({ messages = [], moi, onSend, sending, disabled, titre }) {
  const [texte, setTexte] = useState('')
  const fin = useRef(null)
  const id = useId()

  useEffect(() => { fin.current?.scrollIntoView({ block: 'end' }) }, [messages.length])

  const submit = async (e) => {
    e?.preventDefault()
    const t = texte.trim()
    if (!t || sending) return
    const ok = await onSend(t)
    if (ok !== false) setTexte('')
  }

  return (
    <section className="glass flex h-[70vh] min-h-[420px] flex-col" aria-label={titre}>
      <div role="log" aria-live="polite" aria-relevant="additions" tabIndex={0}
           aria-label="Historique des messages" className="flex-1 space-y-3 overflow-y-auto p-4">
        {!messages.length && (
          <EmptyState title="Aucun message" text="Écrivez le premier message pour démarrer la conversation." />
        )}
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const mien = m.expediteurRole === moi
            return (
              <motion.div key={m.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className={`flex ${mien ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${mien ? 'rounded-br-sm bg-accent text-bg' : 'rounded-bl-sm bg-white/10'}`}>
                  <p className="sr-only">{mien ? 'Vous' : 'Votre interlocuteur'} :</p>
                  <p className="whitespace-pre-line break-words">{m.contenu}</p>
                  <p className={`mt-1 text-xs ${mien ? 'text-bg/80' : 'text-muted'}`}>{dayTime(m.createdAt)}</p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={fin} />
      </div>
      <form onSubmit={submit} className="flex items-end gap-3 border-t border-line p-3">
        <div className="flex-1">
          <label htmlFor={id} className="label">Votre message</label>
          <textarea id={id} rows={2} maxLength={2000} className="field resize-none" value={texte}
                    disabled={disabled} placeholder="Écrivez votre message…"
                    onChange={(e) => setTexte(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(e) }} />
          <p className="mt-1 text-xs text-muted">Ctrl + Entrée pour envoyer · {texte.length}/2000</p>
        </div>
        <button type="submit" className="btn-primary" disabled={disabled || sending || !texte.trim()}>
          <Send className="h-4 w-4" aria-hidden="true" /> {sending ? 'Envoi…' : 'Envoyer'}
        </button>
      </form>
    </section>
  )
}
