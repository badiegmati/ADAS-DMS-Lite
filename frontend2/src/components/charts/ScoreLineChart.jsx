import { Line } from 'react-chartjs-2'
import './chartSetup'
import useReducedMotion from '../../hooks/useReducedMotion'
import { niveauInfo } from '../../design/tokens'
import { dayTime, score } from '../../lib/format'
import DataTableToggle from '../data/DataTableToggle'
import EmptyState from '../feedback/EmptyState'

export default function ScoreLineChart({ points = [], color = '#06B6D4' }) {
  const reduce = useReducedMotion()
  if (!points.length) {
    return <EmptyState title="Pas encore d'historique" text="La courbe apparaîtra dès que des alertes auront été enregistrées." />
  }
  const last = points[points.length - 1]
  const max = Math.max(...points.map((p) => p.valeur))
  const data = {
    labels: points.map((p) => dayTime(p.instant)),
    datasets: [{
      label: 'Score de risque',
      data: points.map((p) => p.valeur),
      borderColor: color,
      backgroundColor: `${color}26`,
      fill: true, tension: 0.35, pointRadius: points.length > 40 ? 0 : 3, borderWidth: 2.5,
    }],
  }
  const options = {
    responsive: true, maintainAspectRatio: false,
    animation: reduce ? false : { duration: 900 },
    scales: { y: { min: 0, max: 100, ticks: { stepSize: 25 } }, x: { ticks: { maxTicksLimit: 6 } } },
    plugins: { legend: { display: false } },
  }
  return (
    <div>
      <div className="h-64" role="img"
           aria-label={`Évolution du score de risque : ${points.length} mesures, maximum ${max.toFixed(0)}, dernière valeur ${last.valeur.toFixed(0)} (niveau ${niveauInfo(last.niveau).label}).`}>
        <Line data={data} options={options} />
      </div>
      <DataTableToggle
        caption="Évolution du score de risque"
        columns={['Instant', 'Score', 'Niveau']}
        rows={points.map((p) => [dayTime(p.instant), score(p.valeur), niveauInfo(p.niveau).label])}
      />
    </div>
  )
}
