import { Doughnut } from 'react-chartjs-2'
import './chartSetup'
import useReducedMotion from '../../hooks/useReducedMotion'
import DataTableToggle from '../data/DataTableToggle'

/**
 * Anneau de répartition. La légende est un vrai tableau de texte (valeurs + pourcentages) :
 * l'information ne dépend jamais de la couleur seule.
 * items = [{ label, value, color }]
 */
export default function RiskDoughnut({ items = [], caption = 'Répartition', unit = '' }) {
  const reduce = useReducedMotion()
  const total = items.reduce((s, i) => s + i.value, 0)
  const data = {
    labels: items.map((i) => i.label),
    datasets: [{
      data: items.map((i) => i.value),
      backgroundColor: items.map((i) => i.color),
      borderColor: '#12121F', borderWidth: 3, hoverOffset: 6,
    }],
  }
  const options = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    animation: reduce ? false : { duration: 900 },
    plugins: { legend: { display: false } },
  }
  const resume = items.map((i) => `${i.label} : ${i.value}`).join(', ')
  return (
    <div>
      <div className="grid items-center gap-4 sm:grid-cols-[180px_1fr]">
        <div className="relative mx-auto h-44 w-44" role="img" aria-label={`${caption}. ${resume}.`}>
          <Doughnut data={data} options={options} />
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center" aria-hidden="true">
            <div><p className="text-2xl font-bold tabular-nums">{total}</p><p className="text-xs text-muted">{unit}</p></div>
          </div>
        </div>
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: i.color }} aria-hidden="true" />
                {i.label}
              </span>
              <span className="whitespace-nowrap font-semibold tabular-nums">
                {i.value}{total ? <span className="ml-1 font-normal text-muted">({Math.round((i.value / total) * 100)} %)</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <DataTableToggle
        caption={caption}
        columns={['Catégorie', 'Valeur']}
        rows={items.map((i) => [i.label, i.value])}
      />
    </div>
  )
}
