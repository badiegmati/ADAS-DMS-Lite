import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

const NIVEAU_COLORS = {
  FAIBLE: '#10B981',
  MODERE: '#EAB308',
  ELEVE: '#F97316',
  CRITIQUE: '#EF4444',
}

/**
 * Jauge SVG semi-circulaire animée représentant le score de risque (0-100).
 * L'arc et le chiffre central s'animent en douceur à chaque changement de score.
 */
export default function ScoreGauge({ score = 0, niveau = 'FAIBLE', size = 180, label = 'Score de risque' }) {
  const couleur = NIVEAU_COLORS[niveau] ?? NIVEAU_COLORS.FAIBLE
  const radius = size / 2 - 14
  const circumference = Math.PI * radius
  const clamped = Math.min(100, Math.max(0, score))
  const center = size / 2

  const progress = useSpring(0, { stiffness: 60, damping: 16 })
  const [displayed, setDisplayed] = useState(0)
  const dashOffset = useTransform(progress, (v) => circumference - (v / 100) * circumference)

  useEffect(() => {
    progress.set(clamped)
    const unsubscribe = progress.on('change', (v) => setDisplayed(Math.round(v)))
    return unsubscribe
  }, [clamped, progress, circumference])

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {/* Fond de la jauge */}
        <path
          d={`M 14 ${center} A ${radius} ${radius} 0 0 1 ${size - 14} ${center}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={12}
          strokeLinecap="round"
        />
        {/* Arc de progression animé */}
        <motion.path
          d={`M 14 ${center} A ${radius} ${radius} 0 0 1 ${size - 14} ${center}`}
          fill="none"
          stroke={couleur}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset, filter: `drop-shadow(0 0 6px ${couleur}88)` }}
        />
      </svg>

      <div className="-mt-10 flex flex-col items-center">
        <span className="text-3xl font-extrabold" style={{ color: couleur, textShadow: `0 0 20px ${couleur}66` }}>
          {displayed}%
        </span>
        <span className="mt-1 text-xs font-semibold tracking-wide text-slate-400">{niveau}</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">{label}</p>
    </div>
  )
}