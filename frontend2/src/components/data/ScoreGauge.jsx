import { useEffect, useId, useState } from 'react'
import { animate } from 'framer-motion'
import useReducedMotion from '../../hooks/useReducedMotion'
import { niveauInfo } from '../../design/tokens'

/** Jauge circulaire du score (0–100) : dégradé, graduations, halo pulsant si critique. */
export default function ScoreGauge({ valeur = 0, niveau = 'FAIBLE', size = 180, stroke = 14 }) {
  const reduce = useReducedMotion()
  const [v, setV] = useState(reduce ? valeur : 0)
  const info = niveauInfo(niveau)
  const gid = useId().replace(/:/g, '')

  useEffect(() => {
    if (reduce) { setV(valeur); return undefined }
    const c = animate(0, valeur, { duration: 1.3, ease: [0.22, 1, 0.36, 1], onUpdate: setV })
    return () => c.stop()
  }, [valeur, reduce])

  const r = (size - stroke) / 2 - 8
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(100, Math.max(0, v)) / 100)
  const ticks = Array.from({ length: 40 }, (_, i) => i)
  const R = size / 2 - 1

  return (
    <div role="img" aria-label={`Score de risque ${Number(valeur).toFixed(0)} sur 100, niveau ${info.label}`}
         className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id={`g${gid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={info.color} stopOpacity="0.55" />
            <stop offset="100%" stopColor={info.color} />
          </linearGradient>
        </defs>
        {ticks.map((i) => {
          const a = (i / ticks.length) * 2 * Math.PI
          const major = i % 10 === 0
          const r1 = R - (major ? 7 : 3.5)
          return <line key={i} x1={size / 2 + R * Math.sin(a)} y1={size / 2 - R * Math.cos(a)}
                       x2={size / 2 + r1 * Math.sin(a)} y2={size / 2 - r1 * Math.cos(a)}
                       stroke="rgba(255,255,255,0.28)" strokeWidth={major ? 2 : 1} />
        })}
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#g${gid})`} strokeWidth={stroke}
                  strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                  className={niveau === 'CRITIQUE' ? 'animate-glow' : ''}
                  style={{ '--glow': `${info.color}AA`, filter: niveau === 'CRITIQUE' ? undefined : `drop-shadow(0 0 8px ${info.color}77)` }} />
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <span className="font-display text-5xl font-extrabold tabular-nums" style={{ color: info.color }}>{Math.round(v)}</span>
        <span className="text-xs uppercase tracking-widest text-muted">sur 100</span>
      </div>
    </div>
  )
}
