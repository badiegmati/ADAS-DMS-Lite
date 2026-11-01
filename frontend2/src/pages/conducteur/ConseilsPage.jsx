import { useState } from 'react'
import { CheckCheck, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { conducteur } from '../../api/endpoints'
import { errorMessage } from '../../api/axios'
import usePolling from '../../hooks/usePolling'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/layout/PageHeader'
import AiAdviceCard from '../../components/ai/AiAdviceCard'
import EmptyState from '../../components/feedback/EmptyState'
import ErrorState from '../../components/feedback/ErrorState'
import Skeleton from '../../components/feedback/Skeleton'
import { listContainer, listItem } from '../../design/motion'

export default function ConseilsPage() {
  const toast = useToast()
  const { data, loading, error, retry, refresh } = usePolling(conducteur.conseils)
  const [gen, setGen] = useState(false)
  const nonLus = (data ?? []).filter((c) => !c.lu).length

  const generer = async () => {
    setGen(true)
    try { await conducteur.genererConseil(); toast.success('Nouveau conseil généré.'); refresh() }
    catch (e) { toast.error(errorMessage(e)) } finally { setGen(false) }
  }
  const toutLu = async () => {
    try { await conducteur.marquerConseilsLus(); toast.success('Conseils marqués comme lus.'); refresh() }
    catch (e) { toast.error(errorMessage(e)) }
  }

  return (
    <>
      <PageHeader title="Conseils de l’IA" subtitle="Recommandations personnalisées générées à partir de votre historique"
        breadcrumbs={[{ label: 'Mon score', to: '/conducteur' }, { label: 'Conseils IA' }]}
        actions={<>
          <button type="button" className="btn-ghost" onClick={toutLu} disabled={!nonLus}><CheckCheck className="h-4 w-4" aria-hidden="true" />Tout marquer comme lu</button>
          <button type="button" className="btn-primary" onClick={generer} disabled={gen}><Sparkles className="h-4 w-4" aria-hidden="true" />{gen ? 'Génération…' : 'Nouveau conseil'}</button>
        </>} />
      {loading ? <Skeleton className="h-64" /> : error ? <ErrorState message={error} onRetry={retry} /> : !data.length ? (
        <div className="glass"><EmptyState icon={Sparkles} title="Aucun conseil pour le moment" text="Générez votre premier conseil : l’IA analyse vos alertes récentes." /></div>
      ) : (
        <motion.div variants={listContainer} initial="hidden" animate="show" className="grid gap-4 lg:grid-cols-2">
          {data.map((c) => <motion.div key={c.id} variants={listItem}><AiAdviceCard conseil={c} /></motion.div>)}
        </motion.div>
      )}
    </>
  )
}
