import { useReducedMotion } from 'framer-motion'

/** true si l'utilisateur a demandé de réduire les animations (prefers-reduced-motion). */
export default function usePrefersReducedMotion() {
  return !!useReducedMotion()
}
