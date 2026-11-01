import { conducteur } from '../../api/endpoints'
import usePolling from '../../hooks/usePolling'
import PageHeader from '../../components/layout/PageHeader'
import RefreshBar from '../../components/layout/RefreshBar'
import AlertMap from '../../components/map/AlertMap'
import ErrorState from '../../components/feedback/ErrorState'
import Skeleton from '../../components/feedback/Skeleton'

export default function CartePage() {
  const { data, loading, error, retry, refresh, refreshing, updatedAt } = usePolling(conducteur.carte, { interval: 30000 })
  return (
    <>
      <PageHeader title="Carte de mes alertes" subtitle="Où se sont produits vos événements récents"
        breadcrumbs={[{ label: 'Mon score', to: '/conducteur' }, { label: 'Carte' }]}
        actions={<RefreshBar updatedAt={updatedAt} refreshing={refreshing} onRefresh={refresh} every={30} />} />
      <div className="glass p-5">
        {loading ? <Skeleton className="h-96" /> : error ? <ErrorState message={error} onRetry={retry} /> : <AlertMap alertes={data} height={520} />}
      </div>
    </>
  )
}
