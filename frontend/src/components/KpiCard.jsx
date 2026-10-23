// src/components/KpiCard.jsx
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

/**
 * Compteur animé robuste : accepte n'importe quoi en entrée (number, string,
 * undefined, null, NaN) et anime toujours depuis 0 vers une valeur numérique
 * sûre, sans jamais lever d'exception.
 */
function AnimatedNumber({ value, decimals = 0 }) {
  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;

  const motionVal = useMotionValue(0);
  const display = useTransform(motionVal, (latest) =>
    Number.isFinite(latest) ? latest.toFixed(decimals) : (0).toFixed(decimals)
  );

  useEffect(() => {
    const controls = animate(motionVal, safeValue, {
      duration: 0.8,
      ease: "easeOut",
    });
    return controls.stop;
  }, [safeValue]);

  return <motion.span>{display}</motion.span>;
}

export default function KpiCard({
  label,
  value,
  suffix = "",
  decimals = 0,
  icon: Icon,
  accent = "cyan",
}) {
  const accents = {
    cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-300",
    violet: "from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-300",
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-300",
    red: "from-red-500/20 to-red-500/5 border-red-500/30 text-red-300",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-300",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-xl p-5 shadow-lg ${
        accents[accent] || accents.cyan
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        {Icon && <Icon size={20} className="opacity-70" />}
      </div>
      <p className="mt-2 text-3xl font-bold text-white">
        <AnimatedNumber value={value} decimals={decimals} />
        <span className="ml-1 text-base font-normal text-slate-400">{suffix}</span>
      </p>
    </motion.div>
  );
}