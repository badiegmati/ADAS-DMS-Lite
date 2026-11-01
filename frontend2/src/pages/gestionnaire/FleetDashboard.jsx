import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Car, Gauge, MessageSquare, Search, ShieldAlert, Users } from 'lucide-react'
import { gestionnaire } from '../../api/endpoints'
import usePolling from '../../hooks/usePolling'
import PageHeader from '../../components/layout/PageHeader'
import RefreshBar from '../../components/layout/RefreshBar'
import KpiCard from '../../components/data/KpiCard'
import RiskBadge from '../../components/data/RiskBadge'
import ScoreBar from '../../components/data/ScoreBar'
import RiskDoughnut from '../../components/charts/RiskDoughnut'
import Reveal from '../../components/layout/Reveal'
import CriticalBanner from '../../components/alerts/CriticalBanner'
import EmptyState from '../../components/feedback/EmptyState'
import ErrorState from '../../components/feedback/ErrorState'
import Skeleton, { SkeletonCards } from '../../components/feedback/Skeleton'
import { NIVEAUX, niveauInfo } from '../../design/tokens'
import { listContainer, listItem } from '../../design/motion'
import { nomComplet, relatif } from '../../lib/format'

const TRIS = {
  score: { label: 'Score (le plus élevé d’abord)', fn: (a, b) => (b.score?.valeur ?? 0) - (a.score?.valeur ?? 0) },
  nom: { label: 'Nom (A → Z)', fn: (a, b) => nomComplet(a).localeCompare(nomComplet(b), 'fr') },
}

/** Tâche T1 : repérer rapidement le conducteur le plus à risque. */
export default function FleetDashboard() {
  const { data, loading, error, retry, refresh, refreshing, updatedAt } = usePolling(gestionnaire.dashboard, { interval: 15000 })
  const [q, setQ] = useState('')
  const [niveau, setNiveau] = useState('')
  const [tri, setTri] = useState('score')

  const lignes = useMemo(() => {
    if (!data) return []
    const needle = q.trim().toLowerCase()
    return data.conducteurs
      .filter((c) => !niveau || c.score?.niveau === niveau)
      .filter((c) => !needle || `${nomComplet(c)} ${c.codeConducteur} ${c.vehiculeMatricule ?? ''}`.toLowerCase().includes(needle))
      .sort(TRIS[tri].fn)
  }, [data, q, niveau, tri])

  const critiques = data?.conducteurs.filter((c) => c.actif && c.score?.niveau === 'CRITIQUE') ?? []

  return (
    <>
      <PageHeader title="Tableau de bord de la flotte" subtitle="Repérez en un coup d’œil les conducteurs à surveiller"
                  actions={<RefreshBar updatedAt={updatedAt} refreshing={refreshing} onRefresh={refresh} every={15} />} />

      {loading ? (<><SkeletonCards /><Skeleton className="mt-6 h-80" /></>) : error ? <ErrorState message={error} onRetry={retry} /> : (
        <>
          <CriticalBanner conducteurs={critiques} />

          <motion.section aria-label="Indicateurs de la flotte" variants={listContainer} initial="hidden" animate="show"
                          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard icon={Users} label="Conducteurs actifs" value={data.kpi.conducteursActifs} />
            <KpiCard icon={Car} label="Véhicules" value={data.kpi.vehicules} />
            <KpiCard icon={Gauge} label="Score moyen" value={data.kpi.scoreMoyen} decimals={1} suffix=" / 100" />
            <KpiCard icon={ShieldAlert} label="Conducteurs critiques" value={data.kpi.conducteursCritiques}
                     tone={data.kpi.conducteursCritiques ? NIVEAUX.CRITIQUE.color : undefined} />
          </motion.section>

          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <section className="glass p-5 lg:col-span-2" aria-labelledby="h-repartition">
              <h2 id="h-repartition" className="mb-4 text-lg font-semibold">Répartition par niveau de risque</h2>
              <RiskDoughnut caption="Répartition des conducteurs par niveau de risque" unit="conducteurs"
                items={Object.entries(NIVEAUX).map(([k, v]) => ({ label: v.label, value: data.repartition[k] ?? 0, color: v.color }))} />
            </section>

            <section className="glass p-5 lg:col-span-3" aria-labelledby="h-top">
              <h2 id="h-top" className="mb-4 text-lg font-semibold">À surveiller en priorité</h2>
              {!data.topRisque.length ? <EmptyState title="Aucun conducteur actif" text="Ajoutez des conducteurs pour suivre leur score de risque." /> : (
                <ol className="space-y-3">
                  {data.topRisque.map((c, i) => (
                    <li key={c.id} className="glass-raised flex flex-wrap items-center justify-between gap-3 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{nomComplet(c)}</p>
                          <p className="text-xs text-muted">{c.vehiculeMatricule ?? 'Sans véhicule'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <ScoreBar valeur={c.score?.valeur} niveau={c.score?.niveau} />
                        <RiskBadge niveau={c.score?.niveau} />
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/gestionnaire/conducteurs/${c.id}`} className="btn-primary !min-h-[40px]">Voir le détail</Link>
                        <Link to={`/gestionnaire/messages?c=${c.id}`} className="btn-ghost !min-h-[40px]" aria-label={`Écrire à ${nomComplet(c)}`}>
                          <MessageSquare className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          <Reveal className="mt-6"><section className="glass p-5" aria-labelledby="h-liste">
            <h2 id="h-liste" className="mb-4 text-lg font-semibold">Tous les conducteurs</h2>
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="rech" className="label">Rechercher</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                  <input id="rech" type="search" className="field pl-9" placeholder="Nom, code, matricule…" value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
              </div>
              <div>
                <label htmlFor="niv" className="label">Niveau de risque</label>
                <select id="niv" className="field" value={niveau} onChange={(e) => setNiveau(e.target.value)}>
                  <option value="">Tous les niveaux</option>
                  {Object.entries(NIVEAUX).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="tri" className="label">Trier par</label>
                <select id="tri" className="field" value={tri} onChange={(e) => setTri(e.target.value)}>
                  {Object.entries(TRIS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            <p className="mb-2 text-sm text-muted" aria-live="polite">{lignes.length} conducteur{lignes.length > 1 ? 's' : ''} affiché{lignes.length > 1 ? 's' : ''}</p>

            {!lignes.length ? (
              <EmptyState icon={Search} title="Aucun résultat" text="Aucun conducteur ne correspond à ces critères. Modifiez la recherche ou le filtre."
                action={<button type="button" className="btn-ghost" onClick={() => { setQ(''); setNiveau('') }}>Réinitialiser les filtres</button>} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <caption className="sr-only">Conducteurs de la flotte avec score et niveau de risque</caption>
                  <thead><tr className="border-b border-line">
                    <th scope="col" className="th">Conducteur</th><th scope="col" className="th">Véhicule</th>
                    <th scope="col" className="th">Score</th><th scope="col" className="th">Niveau</th>
                    <th scope="col" className="th">Alertes 24 h</th><th scope="col" className="th">Mise à jour</th>
                    <th scope="col" className="th"><span className="sr-only">Actions</span></th>
                  </tr></thead>
                  <motion.tbody variants={listContainer} initial="hidden" animate="show" key={`${niveau}-${tri}-${q}`}>
                    {lignes.map((c) => (
                      <motion.tr key={c.id} variants={listItem} className="border-b border-line/60 transition-colors hover:bg-white/5"
                          style={c.score?.niveau === 'CRITIQUE' ? { boxShadow: `inset 3px 0 0 ${niveauInfo('CRITIQUE').color}` } : undefined}>
                        <th scope="row" className="td text-left">
                          <Link to={`/gestionnaire/conducteurs/${c.id}`} className="font-semibold underline-offset-4 hover:text-accent hover:underline">{nomComplet(c)}</Link>
                          <span className="block text-xs font-normal text-muted">{c.codeConducteur}{!c.actif && ' · Inactif'}</span>
                        </th>
                        <td className="td text-muted">{c.vehiculeMatricule ?? '—'}</td>
                        <td className="td"><ScoreBar valeur={c.score?.valeur} niveau={c.score?.niveau} /></td>
                        <td className="td"><RiskBadge niveau={c.score?.niveau} /></td>
                        <td className="td tabular-nums">{c.score?.nbAlertes24h ?? 0}</td>
                        <td className="td text-muted">{relatif(c.score?.derniereMaj)}</td>
                        <td className="td"><div className="flex justify-end gap-2">
                          <Link to={`/gestionnaire/conducteurs/${c.id}`} className="btn-ghost !min-h-[40px]">Détail<span className="sr-only"> de {nomComplet(c)}</span></Link>
                        </div></td>
                      </motion.tr>
                    ))}
                  </motion.tbody>
                </table>
              </div>
            )}
          </section></Reveal>
        </>
      )}
    </>
  )
}
