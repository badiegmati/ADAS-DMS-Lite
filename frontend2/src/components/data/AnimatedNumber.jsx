import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import useReducedMotion from '../../hooks/useReducedMotion'

/** Compteur animé (désactivé si l'utilisateur réduit les animations). */
export default function AnimatedNumber({ value, decimals = 0, duration = 0.9 }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? value : 0)
  const from = useRef(0)

  useEffect(() => {
    const target = Number(value) || 0
    if (reduce) { setShown(target); return undefined }
    const controls = animate(from.current, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(v),
      onComplete: () => { from.current = target },
    })
    return () => { from.current = target; controls.stop() }
  }, [value, reduce, duration])

  return <>{Number(shown).toFixed(decimals)}</>
}
