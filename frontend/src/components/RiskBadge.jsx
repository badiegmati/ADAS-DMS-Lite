import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, AlertTriangle, Siren } from 'lucide-react';

// Configuration visuelle par niveau de risque (couleurs alignées sur tailwind.config.js -> risk.*)
const NIVEAU_CONFIG = {
  FAIBLE: {
    label: 'Faible',
    icon: ShieldCheck,
    text: 'text-risk-faible',
    bg: 'bg-risk-faible/15',
    border: 'border-risk-faible/40',
    pulse: false,
  },
  MODERE: {
    label: 'Modéré',
    icon: ShieldAlert,
    text: 'text-risk-modere',
    bg: 'bg-risk-modere/15',
    border: 'border-risk-modere/40',
    pulse: false,
  },
  ELEVE: {
    label: 'Élevé',
    icon: AlertTriangle,
    text: 'text-risk-eleve',
    bg: 'bg-risk-eleve/15',
    border: 'border-risk-eleve/40',
    pulse: false,
  },
  CRITIQUE: {
    label: 'Critique',
    icon: Siren,
    text: 'text-risk-critique',
    bg: 'bg-risk-critique/15',
    border: 'border-risk-critique/50',
    pulse: true,
  },
};

const SIZE_CONFIG = {
  sm: { pad: 'px-2 py-0.5 text-xs gap-1', icon: 12 },
  md: { pad: 'px-3 py-1 text-sm gap-1.5', icon: 14 },
  lg: { pad: 'px-4 py-1.5 text-base gap-2', icon: 18 },
};

/**
 * Badge de niveau de risque conducteur.
 * niveau: 'FAIBLE' | 'MODERE' | 'ELEVE' | 'CRITIQUE'
 */
export default function RiskBadge({ niveau = 'FAIBLE', size = 'md', className = '' }) {
  const config = NIVEAU_CONFIG[niveau] ?? NIVEAU_CONFIG.FAIBLE;
  const sizeConfig = SIZE_CONFIG[size] ?? SIZE_CONFIG.md;
  const Icon = config.icon;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center rounded-full border font-medium
        ${config.text} ${config.bg} ${config.border} ${sizeConfig.pad}
        ${config.pulse ? 'animate-pulse-neon' : ''} ${className}`}
    >
      <Icon size={sizeConfig.icon} />
      {config.label}
    </motion.span>
  );
}