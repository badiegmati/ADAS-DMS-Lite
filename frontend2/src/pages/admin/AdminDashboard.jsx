import { motion } from 'framer-motion'
import { Activity, Car, UserCog, Users } from 'lucide-react'
import { admin } from '../../api/endpoints'
import usePolling from '../../hooks/usePolling'
import PageHeader from '../../components/layout/PageHeader'
import RefreshBar from '../../components/layout/RefreshBar'
import KpiCard from '../../components/data/KpiCard'
import { SkeletonCards } from '../../components/feedback/Skeleton'
import ErrorState from '../../components/feedback/ErrorState'
import { listContainer } from '../../design/motion'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const { data, loading, error, retry, refresh, refreshing, updatedAt } = usePolling(admin.stats, { interval: 30000 })

  return (
    <>
      <PageHeader title="Tableau de bord administrateur" subtitle="Vue globale de la plateforme"
                  actions={<RefreshBar updatedAt={updatedAt} refreshing={refreshing} onRefresh={refresh} every={30} />} />
      {loading ? <SkeletonCards /> : error ? <ErrorState message={error} onRetry={retry} /> : (
        <>
          <motion.section aria-label="Indicateurs globaux" variants={listContainer} initial="hidden" animate="show"
                          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard icon={UserCog} label="Gestionnaires" value={data.gestionnaires} />
            <KpiCard icon={Users} label="Conducteurs" value={data.conducteurs} />
            <KpiCard icon={Car} label="Véhicules" value={data.vehicules} />
            <KpiCard icon={Activity} label="Alertes (24 h)" value={data.alertes24h} />
          </motion.section>
          <div className="glass mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
            <p className="text-muted">Créez et gérez les comptes des gestionnaires de flotte.</p>
            <Link to="/admin/gestionnaires" className="btn-primary">Gérer les gestionnaires</Link>
          </div>
        </>
      )}
    </>
  )
}
