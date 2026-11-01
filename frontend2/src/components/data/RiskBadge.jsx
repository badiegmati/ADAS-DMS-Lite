import { CircleCheck, CircleAlert, TriangleAlert, ShieldAlert } from 'lucide-react'
import { niveauInfo } from '../../design/tokens'

const ICONS = { FAIBLE: CircleCheck, MODERE: CircleAlert, ELEVE: TriangleAlert, CRITIQUE: ShieldAlert }

/**
 * Le niveau de risque n'est JAMAIS indiqué par la couleur seule :
 * texte + icône (forme différente par niveau) + couleur (WCAG 1.4.1).
 */
export default function RiskBadge({ niveau, className = '' }) {
  const info = niveauInfo(niveau)
  const Icon = ICONS[niveau] ?? CircleCheck
  return (
    <span
      className={`relative inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${className}`}
      style={{ color: info.color, borderColor: `${info.color}66`, backgroundColor: `${info.color}1F` }}
    >
      {niveau === 'CRITIQUE' ? (
        <span className="relative grid h-3.5 w-3.5 place-items-center" aria-hidden="true">
          <span className="absolute h-3.5 w-3.5 animate-ping rounded-full opacity-40" style={{ backgroundColor: info.color }} />
          <Icon className="relative h-3.5 w-3.5" />
        </span>
      ) : <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      <span className="sr-only">Niveau de risque : </span>
      {info.label}
    </span>
  )
}
