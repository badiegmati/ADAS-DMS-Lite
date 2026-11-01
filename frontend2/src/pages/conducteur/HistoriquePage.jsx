import { useState } from 'react'
import { conducteur } from '../../api/endpoints'
import usePolling from '../../hooks/usePolling'
import PageHeader from '../../components/layout/PageHeader'
import AlertTable from '../../components/data/AlertTable'
import ScoreLineChart from '../../components/charts/ScoreLineChart'
import ErrorState from '../../components/feedback/ErrorState'
import Skeleton from '../../components/feedback/Skeleton'
import { CATEGORIES, PLAGES } from '../../design/tokens'

export default function HistoriquePage() {
  const [plage, setPlage] = useState('24h')
  const [categorie, setCategorie] = useState('')
  const [page, setPage] = useState(0)
  const hist = usePolling(() => conducteur.historique(plage), { deps: [plage] })
  const al = usePolling(() => conducteur.alertes(categorie, page), { deps: [categorie, page] })

  return (
    <>
      <PageHeader title="Historique" subtitle="Évolution de votre score et liste de vos alertes"
        breadcrumbs={[{ label: 'Mon score', to: '/conducteur' }, { label: 'Historique' }]} />
      <div className="space-y-6">
        <section className="glass p-5" aria-labelledby="h-c">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="h-c" className="text-lg font-semibold">Évolution du score</h2>
            <div role="group" aria-label="Plage de temps" className="flex gap-1">
              {PLAGES.map((p) => (
                <button key={p.value} type="button" aria-pressed={plage === p.value} onClick={() => setPlage(p.value)}
                  className={`min-h-[40px] rounded-lg px-3 text-sm font-semibold ${plage === p.value ? 'bg-accent text-bg' : 'bg-white/5 text-muted hover:bg-white/10 hover:text-ink'}`}>{p.label}</button>
              ))}
            </div>
          </div>
          {hist.loading ? <Skeleton className="h-64" /> : hist.error ? <ErrorState message={hist.error} onRetry={hist.retry} /> : <ScoreLineChart points={hist.data} color="#10B981" />}
        </section>

        <section className="glass p-5" aria-labelledby="h-a">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 id="h-a" className="text-lg font-semibold">Mes alertes</h2>
            <div className="w-full sm:w-64">
              <label htmlFor="cat" className="label">Catégorie</label>
              <select id="cat" className="field" value={categorie} onChange={(e) => { setCategorie(e.target.value); setPage(0) }}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          {al.loading ? <Skeleton className="h-64" /> : al.error ? <ErrorState message={al.error} onRetry={al.retry} /> : <AlertTable page={al.data} onPage={setPage} />}
        </section>
      </div>
    </>
  )
}
