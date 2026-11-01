import { niveauInfo } from '../../design/tokens'

/** Mini barre de score pour les tableaux ; la valeur est toujours écrite en chiffres. */
export default function ScoreBar({ valeur = 0, niveau }) {
  const info = niveauInfo(niveau)
  return (
    <div className="flex min-w-[120px] items-center gap-2">
      <span className="w-10 text-right font-semibold tabular-nums">{Number(valeur).toFixed(1)}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
        <div className="h-full rounded-full transition-[width] duration-500"
             style={{ width: `${Math.min(100, valeur)}%`, backgroundColor: info.color }} />
      </div>
    </div>
  )
}
