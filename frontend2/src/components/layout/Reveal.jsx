import { motion } from 'framer-motion'

/** Apparition au défilement (une seule fois). Respecte prefers-reduced-motion via MotionConfig. */
export default function Reveal({ children, delay = 0, y = 24, className = '', as = 'div' }) {
  const Tag = motion[as] ?? motion.div
  return (
    <Tag className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }}
         viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </Tag>
  )
}
