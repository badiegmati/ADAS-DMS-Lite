import { RefreshCw } from 'lucide-react'

/** Visibilité de l'état du système : heure de dernière mise à jour + actualisation manuelle. */
export default function RefreshBar({ updatedAt, refreshing, onRefresh, every }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted">
      <span aria-live="polite">
        {updatedAt
          ? `Mis à jour à ${updatedAt.toLocaleTimeString('fr-FR')}`
          : 'Chargement…'}
        {every ? ` · actualisation auto toutes les ${every} s` : ''}
      </span>
      <button type="button" className="btn-ghost !min-h-[40px]" onClick={onRefresh} disabled={refreshing}>
        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
        Actualiser
      </button>
    </div>
  )
}
