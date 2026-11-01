import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Car, Mail, MessageSquare, Phone } from 'lucide-react'
import { gestionnaire } from '../../api/endpoints'
import usePolling from '../../hooks/usePolling'
import Reveal from '../../components/layout/Reveal'
import PageHeader from '../../components/layout/PageHeader'
import RefreshBar from '../../components/layout/RefreshBar'
import ScoreGauge from '../../components/data/ScoreGauge'
import RiskBadge from '../../components/data/RiskBadge'
import AlertTable from '../../components/data/AlertTable'
import ScoreLineChart from '../../components/charts/ScoreLineChart'
import RiskDoughnut from '../../components/charts/RiskDoughnut'
import AlertMap from '../../components/map/AlertMap'
import AiAdviceCard from '../../components/ai/AiAdviceCard'
import ErrorState from '../../components/feedback/ErrorState'
import Skeleton from '../../components/feedback/Skeleton'
import { PLAGES, TYPES_ALERTE, niveauInfo } from '../../design/tokens'
import { nomComplet } from '../../lib/format'

const PALETTE = ['#06B6D4', '#A855F7', '#EC4899', '#FBBF24', '#34D399', '#F87171']

/** Tâche T2 : consulter le détail des alertes d’un conducteur. */
export default function DriverDetail() {
  const { id } = useParams()
  const [plage, setPlage] = useState('24h')
  const [page, setPage] = useState(0)
  const { data, loading, error, retry, refresh, refreshing, updatedAt } =
    usePolling(() => gestionnaire.detail(id, plage, page), { interval: 15000, deps: [id, plage, page] })

  const parType = useMemo(() => {
    if (!data) return []
    const m = {}
    data.carte.forEach((a) => { m[a.type] = (m[a.type] ?? 0) + 1 })
    return Object.entries(m).map(([t, n], i) => ({ label: TYPES_ALERTE[t] ?? t, value: n, color: PALETTE[i % PALETTE.length] }))
  }, [data])

  const c = data?.conducteur
  const crumbs = [{ label: 'Tableau de bord', to: '/gestionnaire' }, { label: 'Conducteurs', to: '/gestionnaire/conducteurs' }, { label: c ? nomComplet(c) : 'Détail' }]

  return (
    <>
      <PageHeader title={c ? nomComplet(c) : 'Détail du conducteur'} breadcrumbs={crumbs}
        subtitle={c ? `Code ${c.codeConducteur}` : undefined}
        actions={<>
          <RefreshBar updatedAt={updatedAt} refreshing={refreshing} onRefresh={refresh} every={15} />
          {c && <Link to={`/gestionnaire/messages?c=${c.id}`} className="btn-primary"><MessageSquare className="h-4 w-4" aria-hidden="true" />Écrire au conducteur</Link>}
        </>} />

      {loading ? <Skeleton className="h-96" /> : error ? <ErrorState message={error} onRetry={retry} /> : (
        <div className="space-y-6">
          <section className="glass grid gap-6 p-6 md:grid-cols-[auto_1fr]" aria-label="Synthèse du conducteur">
            <ScoreGauge valeur={c.score?.valeur ?? 0} niveau={c.score?.niveau} />
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <RiskBadge niveau={c.score?.niveau} />
                <span className="text-muted">{c.score?.nbAlertes24h ?? 0} alerte(s) sur 24 h</span>
                {!c.actif && <span className="font-semibold text-muted">Compte inactif</span>}
              </div>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2"><Car className="h-4 w-4 text-accent" aria-hidden="true" /><dt className="sr-only">Véhicule</dt><dd>{c.vehiculeMatricule ?? 'Aucun véhicule affecté'}</dd></div>
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent" aria-hidden="true" /><dt className="sr-only">E-mail</dt><dd>{c.email}</dd></div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent" aria-hidden="true" /><dt className="sr-only">Téléphone</dt><dd>{c.telephone || 'Non renseigné'}</dd></div>
              </dl>
              <p className="text-sm text-muted">Niveau actuel : <strong style={{ color: niveauInfo(c.score?.niveau).color }}>{niveauInfo(c.score?.niveau).label}</strong>. Seuils : 25 / 50 / 75.</p>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-5">
            <section className="glass p-5 lg:col-span-3" aria-labelledby="h-courbe">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 id="h-courbe" className="text-lg font-semibold">Évolution du score</h2>
                <div role="group" aria-label="Plage de temps" className="flex gap-1">
                  {PLAGES.map((p) => (
                    <button key={p.value} type="button" aria-pressed={plage === p.value}
                      onClick={() => { setPlage(p.value) }}
                      className={`min-h-[40px] rounded-lg px-3 text-sm font-semibold transition-colors ${plage === p.value ? 'bg-accent text-bg' : 'bg-white/5 text-muted hover:bg-white/10 hover:text-ink'}`}>{p.label}</button>
                  ))}
                </div>
              </div>
              <ScoreLineChart points={data.historique} color="#06B6D4" />
            </section>
            <section className="glass p-5 lg:col-span-2" aria-labelledby="h-types">
              <h2 id="h-types" className="mb-1 text-lg font-semibold">Types d’alertes</h2>
              <p className="mb-4 text-xs text-muted">Alertes géolocalisées récentes</p>
              {parType.length ? <RiskDoughnut items={parType} caption="Répartition des alertes par type" unit="alertes" />
                : <p className="py-8 text-center text-muted">Aucune alerte récente.</p>}
            </section>
          </div>

          <Reveal><section className="glass p-5" aria-labelledby="h-alertes">
            <h2 id="h-alertes" className="mb-4 text-lg font-semibold">Historique des alertes</h2>
            <AlertTable page={data.alertes} onPage={setPage} caption={`Alertes de ${nomComplet(c)}`} />
          </section></Reveal>

          <Reveal><section className="glass p-5" aria-labelledby="h-carte">
            <h2 id="h-carte" className="mb-4 text-lg font-semibold">Positions des alertes</h2>
            <AlertMap alertes={data.carte} />
          </section></Reveal>

          {!!data.conseils.length && (
            <section aria-labelledby="h-conseils">
              <h2 id="h-conseils" className="mb-4 text-lg font-semibold">Conseils générés par l’IA</h2>
              <div className="grid gap-4 md:grid-cols-2">{data.conseils.slice(0, 4).map((k) => <AiAdviceCard key={k.id} conseil={k} compact />)}</div>
            </section>
          )}
        </div>
      )}
    </>
  )
}
