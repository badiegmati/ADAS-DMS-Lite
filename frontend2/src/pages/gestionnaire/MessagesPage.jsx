import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MessageSquare, Search } from 'lucide-react'
import { gestionnaire, messages } from '../../api/endpoints'
import { errorMessage } from '../../api/axios'
import usePolling from '../../hooks/usePolling'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/layout/PageHeader'
import ChatPanel from '../../components/ai/ChatPanel'
import RiskBadge from '../../components/data/RiskBadge'
import EmptyState from '../../components/feedback/EmptyState'
import ErrorState from '../../components/feedback/ErrorState'
import Skeleton from '../../components/feedback/Skeleton'
import { nomComplet } from '../../lib/format'

/** Tâche T3 : contacter un conducteur. */
export default function MessagesPage() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [sending, setSending] = useState(false)
  const selectedId = params.get('c')
  const liste = usePolling(gestionnaire.conducteurs)
  const chat = usePolling(() => messages.lister(selectedId), { interval: 8000, deps: [selectedId], enabled: !!selectedId })

  const selected = liste.data?.find((c) => c.id === selectedId)
  const filtres = useMemo(() => {
    const n = q.trim().toLowerCase()
    return (liste.data ?? []).filter((c) => !n || nomComplet(c).toLowerCase().includes(n))
  }, [liste.data, q])

  // Marque comme lus les messages reçus à l'ouverture de la conversation.
  useEffect(() => { if (selectedId) messages.marquerLus(selectedId).catch(() => {}) }, [selectedId])

  const envoyer = async (texte) => {
    setSending(true)
    try {
      const m = await messages.envoyer(selectedId, texte)
      chat.setData((d) => [...(d ?? []), m])
      toast.success('Message envoyé.')
      return true
    } catch (err) { toast.error(errorMessage(err)); return false } finally { setSending(false) }
  }

  return (
    <>
      <PageHeader title="Messages" subtitle="Échangez avec vos conducteurs"
        breadcrumbs={[{ label: 'Tableau de bord', to: '/gestionnaire' }, { label: 'Messages' }]} />
      {liste.loading ? <Skeleton className="h-96" /> : liste.error ? <ErrorState message={liste.error} onRetry={liste.retry} /> : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <section className="glass p-4" aria-label="Choisir un conducteur">
            <label htmlFor="rech-m" className="label">Rechercher</label>
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input id="rech-m" type="search" className="field pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom du conducteur" />
            </div>
            <ul className="max-h-[55vh] space-y-1 overflow-y-auto">
              {filtres.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => setParams({ c: c.id })} aria-current={c.id === selectedId ? 'true' : undefined}
                    className={`flex min-h-[56px] w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition-colors ${c.id === selectedId ? 'bg-accent/15 text-accent' : 'hover:bg-white/5'}`}>
                    <span><span className="block font-semibold">{nomComplet(c)}</span><span className="block text-xs text-muted">{c.codeConducteur}</span></span>
                    <RiskBadge niveau={c.score?.niveau} />
                  </button>
                </li>
              ))}
              {!filtres.length && <li className="p-4 text-center text-sm text-muted">Aucun conducteur trouvé.</li>}
            </ul>
          </section>

          {!selectedId ? (
            <div className="glass"><EmptyState icon={MessageSquare} title="Choisissez un conducteur" text="Sélectionnez un conducteur dans la liste pour afficher la conversation." /></div>
          ) : chat.loading ? <Skeleton className="h-96" /> : chat.error ? <ErrorState message={chat.error} onRetry={chat.retry} /> : (
            <ChatPanel titre={`Conversation avec ${selected ? nomComplet(selected) : 'le conducteur'}`}
              messages={chat.data ?? []} moi="GESTIONNAIRE" onSend={envoyer} sending={sending} />
          )}
        </div>
      )}
    </>
  )
}
