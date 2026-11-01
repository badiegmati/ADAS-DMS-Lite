import { useEffect } from 'react'

/** Pose --mx / --my sur la carte .glass survolée : le halo suit le curseur (délégation d'événement). */
export default function useSpotlight() {
  useEffect(() => {
    const onMove = (e) => {
      const el = e.target.closest?.('.glass')
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    document.addEventListener('pointermove', onMove, { passive: true })
    return () => document.removeEventListener('pointermove', onMove)
  }, [])
}
