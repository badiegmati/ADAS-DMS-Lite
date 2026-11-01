import SoftAurora from '../components/background/SoftAurora'
import useReducedMotion from '../hooks/useReducedMotion'
import { useEffect, useState } from 'react'

/** Hook : true quand l'onglet est visible (on suspend le fond WebGL sinon). */
export function usePageVisible() {
  const [v, setV] = useState(document.visibilityState === 'visible')
  useEffect(() => {
    const f = () => setV(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', f)
    return () => document.removeEventListener('visibilitychange', f)
  }, [])
  return v
}

/** Fond animé SoftAurora, avec repli en dégradé statique si animations réduites. */
export function AuroraBackground({ color1, color2 }) {
  const reduce = useReducedMotion()
  const visible = usePageVisible()
  return (
    <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden" aria-hidden="true">
      <div className="bg-grid absolute inset-0" />
      <div className="absolute inset-0" style={{
        background: `radial-gradient(60% 50% at 20% 10%, ${color1}33, transparent 70%), radial-gradient(50% 50% at 85% 90%, ${color2}2A, transparent 70%)`,
      }} />
      {!reduce && visible && (
        <div className="absolute inset-0 opacity-40">
          <SoftAurora color1={color1} color2={color2} speed={0.5} brightness={0.9} enableMouseInteraction={false} />
        </div>
      )}
    </div>
  )
}

export default function AuthLayout({ children }) {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10" data-role="GESTIONNAIRE">
      <AuroraBackground color1="#06B6D4" color2="#A855F7" />
      <main id="contenu" className="relative z-10 w-full max-w-5xl">{children}</main>
    </div>
  )
}
