import { useEffect, useState } from 'react'
import { messages } from '../../api/endpoints'
import { errorMessage } from '../../api/axios'
import usePolling from '../../hooks/usePolling'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/layout/PageHeader'
import ChatPanel from '../../components/ai/ChatPanel'
import ErrorState from '../../components/feedback/ErrorState'
import Skeleton from '../../components/feedback/Skeleton'

export default function MessagesPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [sending, setSending] = useState(false)
  const chat = usePolling(() => messages.lister(user.id), { interval: 8000 })
  useEffect(() => { messages.marquerLus(user.id).catch(() => {}) }, [user.id])

  const envoyer = async (texte) => {
    setSending(true)
    try { const m = await messages.envoyer(user.id, texte); chat.setData((d) => [...(d ?? []), m]); return true }
    catch (e) { toast.error(errorMessage(e)); return false } finally { setSending(false) }
  }

  return (
    <>
      <PageHeader title="Messages" subtitle="Échangez avec votre gestionnaire de flotte"
        breadcrumbs={[{ label: 'Mon score', to: '/conducteur' }, { label: 'Messages' }]} />
      {chat.loading ? <Skeleton className="h-96" /> : chat.error ? <ErrorState message={chat.error} onRetry={chat.retry} />
        : <ChatPanel titre="Conversation avec mon gestionnaire" messages={chat.data ?? []} moi="CONDUCTEUR" onSend={envoyer} sending={sending} />}
    </>
  )
}
