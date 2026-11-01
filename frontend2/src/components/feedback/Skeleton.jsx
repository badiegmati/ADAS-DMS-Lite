/** Squelette de chargement : annonce « chargement » aux lecteurs d'écran, anime un balayage doux. */
export default function Skeleton({ className = '', label = 'Chargement…' }) {
  return (
    <div role="status" aria-live="polite" className={`relative overflow-hidden rounded-xl bg-white/5 ${className}`}>
      <span className="sr-only">{label}</span>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <style>{'@keyframes shimmer{100%{transform:translateX(100%)}}'}</style>
    </div>
  )
}

export function SkeletonCards({ n = 4 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
      {Array.from({ length: n }).map((_, i) => <Skeleton key={i} className="h-28" />)}
    </div>
  )
}
