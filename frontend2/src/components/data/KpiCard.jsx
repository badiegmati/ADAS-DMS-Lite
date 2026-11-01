import { motion } from 'framer-motion'
import { listItem } from '../../design/motion'
import AnimatedNumber from './AnimatedNumber'

export default function KpiCard({ icon: Icon, label, value, decimals = 0, suffix = '', hint, tone }) {
  return (
    <motion.article variants={listItem} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                    className="glass group relative overflow-hidden p-5 transition-shadow hover:shadow-glow">
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent/20 blur-3xl transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
      <div className="relative flex items-center gap-3">
        {Icon && (
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-accent/30 to-accent/5 text-accent ring-1 ring-accent/30 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
        <h3 className="text-sm font-medium text-muted">{label}</h3>
      </div>
      <p className="relative mt-4 font-display text-4xl font-bold tabular-nums" style={tone ? { color: tone } : undefined}>
        <AnimatedNumber value={value} decimals={decimals} /><span className="ml-1 text-lg font-semibold text-muted">{suffix}</span>
      </p>
      {hint && <p className="relative mt-1 text-xs text-muted">{hint}</p>}
      <span className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-accent to-transparent transition-transform duration-500 group-hover:scale-x-100" aria-hidden="true" />
    </motion.article>
  )
}
