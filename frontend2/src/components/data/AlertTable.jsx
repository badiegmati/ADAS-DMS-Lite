import { ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react'
import { dateTime } from '../../lib/format'
import { typeLabel } from '../../design/tokens'
import EmptyState from '../feedback/EmptyState'

/** Tableau d'alertes sémantique (caption, th scope) avec pagination. */
export default function AlertTable({ page, onPage, caption = 'Historique des alertes' }) {
  const items = page?.contenu ?? []
  if (!items.length) {
    return (
      <EmptyState
        title="Aucune alerte"
        text="Aucun événement n'a été enregistré pour ces critères. Lancez le client de détection ou modifiez le filtre."
      />
    )
  }
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="th">Date</th>
              <th scope="col" className="th">Type</th>
              <th scope="col" className="th">Sévérité</th>
              <th scope="col" className="th">Gravité</th>
              <th scope="col" className="th">Description</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-b border-line/60 transition-colors hover:bg-white/5">
                <td className="td whitespace-nowrap tabular-nums">{dateTime(a.horodatage)}</td>
                <td className="td font-medium">{typeLabel(a.type)}</td>
                <td className="td tabular-nums">{a.severite}</td>
                <td className="td">
                  {a.critique
                    ? <span className="inline-flex items-center gap-1 font-semibold text-risk-critique"><ShieldAlert className="h-4 w-4" aria-hidden="true" />Critique</span>
                    : <span className="text-muted">Standard</span>}
                </td>
                <td className="td text-muted">{a.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {page.totalPages > 1 && (
        <nav aria-label="Pagination des alertes" className="mt-4 flex items-center justify-between gap-3">
          <button type="button" className="btn-ghost" disabled={page.page <= 0} onClick={() => onPage(page.page - 1)}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Précédent
          </button>
          <span className="text-sm text-muted" aria-live="polite">
            Page {page.page + 1} sur {page.totalPages} · {page.total} alertes
          </span>
          <button type="button" className="btn-ghost" disabled={page.page + 1 >= page.totalPages} onClick={() => onPage(page.page + 1)}>
            Suivant <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  )
}
