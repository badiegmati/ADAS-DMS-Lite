import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';

/**
 * État vide générique (liste vide, aucun résultat de filtre, etc.)
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Aucune donnée',
  description = '',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex flex-col items-center justify-center text-center py-10 px-4 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-bg-card2 flex items-center justify-center mb-4 animate-float">
        <Icon size={26} className="text-slate-500" />
      </div>
      <p className="text-slate-300 font-medium">{title}</p>
      {description && <p className="text-slate-500 text-sm mt-1 max-w-xs">{description}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary mt-4 px-4 py-2 text-sm">
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}