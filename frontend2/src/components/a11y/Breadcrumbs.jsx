import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

/** Fil d'Ariane : aide à situer l'utilisateur (reconnaissance plutôt que rappel). */
export default function Breadcrumbs({ items = [] }) {
  if (!items.length) return null
  return (
    <nav aria-label="Fil d'Ariane" className="mb-2">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
        {items.map((it, i) => {
          const last = i === items.length - 1
          return (
            <li key={it.label} className="flex items-center gap-1">
              {it.to && !last
                ? <Link to={it.to} className="rounded underline-offset-4 hover:text-ink hover:underline">{it.label}</Link>
                : <span aria-current={last ? 'page' : undefined} className={last ? 'text-ink' : ''}>{it.label}</span>}
              {!last && <ChevronRight className="h-4 w-4" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
