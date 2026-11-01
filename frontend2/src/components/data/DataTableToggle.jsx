import { useId, useState } from 'react'
import { Table2 } from 'lucide-react'

/**
 * Alternative textuelle à un graphique ou une carte (WCAG 1.1.1) :
 * un bouton déplie un vrai tableau de données.
 */
export default function DataTableToggle({ caption, columns, rows, label = 'Afficher les données sous forme de tableau' }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div className="mt-3">
      <button type="button" className="btn-ghost !min-h-[40px]" aria-expanded={open} aria-controls={id}
              onClick={() => setOpen((o) => !o)}>
        <Table2 className="h-4 w-4" aria-hidden="true" />
        {open ? 'Masquer le tableau de données' : label}
      </button>
      {open && (
        <div id={id} className="mt-3 max-h-64 overflow-auto rounded-xl border border-line">
          <table className="w-full">
            <caption className="sr-only">{caption}</caption>
            <thead className="sticky top-0 bg-raised">
              <tr>{columns.map((c) => <th key={c} scope="col" className="th">{c}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-line">
                  {r.map((cell, j) => <td key={j} className="td">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
