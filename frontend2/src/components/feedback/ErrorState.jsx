import { RefreshCw, TriangleAlert } from 'lucide-react'

/** État d'erreur avec action de récupération « Réessayer ». */
export default function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="glass flex flex-col items-center gap-3 px-6 py-10 text-center">
      <TriangleAlert className="h-8 w-8 text-risk-critique" aria-hidden="true" />
      <p className="font-semibold">Impossible de charger ces données</p>
      <p className="max-w-md text-muted">{message}</p>
      {onRetry && (
        <button type="button" className="btn-ghost" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Réessayer
        </button>
      )}
    </div>
  )
}
