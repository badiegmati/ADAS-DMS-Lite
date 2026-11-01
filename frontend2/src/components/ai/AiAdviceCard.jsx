import { Sparkles } from 'lucide-react'
import { dateTime } from '../../lib/format'

/** Carte de conseil IA (Gemini). Le type ALERTE est signalé en texte, pas seulement en couleur. */
export default function AiAdviceCard({ conseil, compact = false }) {
  if (!conseil) return null
  const alerte = conseil.type === 'ALERTE'
  return (
    <article className={`glass-raised p-5 ${alerte ? 'border-risk-critique/50' : ''}`}>
      <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
          {alerte ? 'Message d’alerte' : 'Conseil personnalisé'}
          {!conseil.lu && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-bg">Nouveau</span>}
        </h3>
        <span className="text-xs text-muted">
          {dateTime(conseil.createdAt)}{conseil.scoreMoment != null ? ` · score ${Number(conseil.scoreMoment).toFixed(0)}` : ''}
        </span>
      </header>
      <p className={`whitespace-pre-line text-ink/90 ${compact ? 'line-clamp-4' : ''}`}>{conseil.contenu}</p>
      {conseil.modele && <p className="mt-2 text-xs text-muted">Généré par : {conseil.modele}</p>}
    </article>
  )
}
