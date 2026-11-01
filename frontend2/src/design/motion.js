// Variants Framer Motion partagés. Durées courtes, easing sortant, jamais décoratif seul.
const ease = [0.22, 1, 0.36, 1]

export const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18, ease } },
}

export const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}

export const listItem = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease } },
}

export const dialogVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show:   { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease } },
  exit:   { opacity: 0, scale: 0.97, transition: { duration: 0.15 } },
}

export const toastVariants = {
  hidden: { opacity: 0, x: 40 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.25, ease } },
  exit:   { opacity: 0, x: 40, transition: { duration: 0.18 } },
}
