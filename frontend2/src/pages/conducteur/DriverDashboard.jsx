import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, MessageSquare, ShieldAlert, Sparkles } from 'lucide-react'
import { conducteur } from '../../api/endpoints'
import { errorMessage } from '../../api/axios'
import usePolling from '../../hooks/usePolling'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/layout/PageHeader'
import RefreshBar from '../../components/layout/RefreshBar'
import ScoreGauge from '../../components/data/ScoreGauge'
import RiskBadge from '../../components/data/RiskBadge'
import KpiCard from '../../components/data/KpiCard'
import AiAdviceCard from '../../components/ai/AiAdviceCard'
import ErrorState from '../../components/feedback/ErrorState'
import EmptyState from '../../components/feedback/EmptyState'
import Skeleton, { SkeletonCards } from '../../components/feedback/Skeleton'
import { listContainer } from '../../design/motion'
import { dateTime } from '../../lib/format'
import { NIVEAUX, typeLabel } from '../../design/tokens'

const MESSAGES = {
  FAIBLE: 'Votre conduite est sûre. Continuez ainsi !',
  MODERE: 'Quelques signaux de fatigue ou de distraction. Restez vigilant.',
  ELEVE: 'Risque élevé : pensez à faire une pause bientôt.',
  CRITIQUE: 'Niveau critique : arrêtez-vous dès que possible et reposez-vous.',
}

export default function DriverDashboard() {
  const toast = useToast()
  const { data, loading, error, retry, refresh, refreshing, updatedAt } = usePolling(conducteur.dashboard, { interval: 15000 })
  const [gen, setGen] = useState(false)

  const generer = async () => {
    setGen(true)
    try { await conducteur.genererConseil(); toast.success('Nouveau conseil généré.'); refresh() }
    catch (e) { toast.error(errorMessage(e)) } finally { setGen(false) }
  }

  return (
    <>
      <PageHeader title="Mon score de risque" subtitle="Votre niveau de vigilance sur les dernières 24 heures"
        actions={<RefreshBar updatedAt={updatedAt} refreshing={refreshing} onRefresh={refresh} every={15} />} />
      {loading ? (<><Skeleton className="h-64" /><div className="mt-6"><SkeletonCards /></div></>) : error ? <ErrorState message={error} onRetry={retry} /> : (
        <div className="space-y-6">
          <section className="glass grid items-center gap-6 p-6 md:grid-cols-[auto_1fr]" aria-label="Score actuel">
            <div className="mx-auto"><ScoreGauge valeur={data.score.valeur} niveau={data.score.niveau} size={200} /></div>
            <div className="space-y-3">
              <RiskBadge niveau={data.score.niveau} className="!text-sm" />
              <p className="text-xl font-semibold" role={data.score.niveau === 'CRITIQUE' ? 'alert' : undefined}>{MESSAGES[data.score.niveau]}</p>
              <p className="text-sm text-muted">Véhicule : {data.profil.vehiculeMatricule ?? 'non affecté'} · {data.alertes24h} alerte(s) sur 24 h</p>
            </div>
          </section>

          <motion.section aria-label="Indicateurs" variants={listContainer} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard icon={Activity} label="Alertes (24 h)" value={data.alertes24h} />
            <KpiCard icon={ShieldAlert} label="Critiques (24 h)" value={data.critiques24h} tone={data.critiques24h ? NIVEAUX.CRITIQUE.color : undefined} />
            <KpiCard icon={Sparkles} label="Conseils non lus" value={data.conseilsNonLus} />
            <KpiCard icon={MessageSquare} label="Messages non lus" value={data.messagesNonLus} />
          </motion.section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="glass p-5" aria-labelledby="h-dern">
              <h2 id="h-dern" className="mb-4 text-lg font-semibold">Dernières alertes</h2>
              {!data.dernieresAlertes.length ? <EmptyState title="Aucune alerte" text="Bonne nouvelle : aucun événement à risque récent." /> : (
                <ul className="space-y-2">
                  {data.dernieresAlertes.map((a) => (
                    <li key={a.id} className="glass-raised flex items-center justify-between gap-3 px-3 py-2">
                      <span>
                        <span className="font-semibold">{typeLabel(a.type)}</span>
                        {a.critique && <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-risk-critique"><ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />Critique</span>}
                      </span>
                      <span className="text-xs text-muted tabular-nums">{dateTime(a.horodatage)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/conducteur/historique" className="btn-ghost mt-4">Voir tout l’historique</Link>
            </section>

            <section className="space-y-3" aria-labelledby="h-conseil">
              <div className="flex items-center justify-between gap-3">
                <h2 id="h-conseil" className="text-lg font-semibold">Conseil du moment</h2>
                <button type="button" className="btn-primary" onClick={generer} disabled={gen}><Sparkles className="h-4 w-4" aria-hidden="true" />{gen ? 'Génération…' : 'Nouveau conseil'}</button>
              </div>
              {data.conseilEnAvant ? <AiAdviceCard conseil={data.conseilEnAvant} />
                : <div className="glass"><EmptyState icon={Sparkles} title="Pas encore de conseil" text="Demandez un conseil personnalisé basé sur votre historique d’alertes." /></div>}
            </section>
          </div>
        </div>
      )}
    </>
  )
}
