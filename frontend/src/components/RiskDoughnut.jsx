import { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';

ChartJS.register(ArcElement, Tooltip, Legend);

const NIVEAUX = [
  { key: 'FAIBLE', label: 'Faible', color: '#10B981' },
  { key: 'MODERE', label: 'Modéré', color: '#EAB308' },
  { key: 'ELEVE', label: 'Élevé', color: '#F97316' },
  { key: 'CRITIQUE', label: 'Critique', color: '#EF4444' },
];

/**
 * Répartition des conducteurs/alertes par niveau de risque.
 * repartition: { FAIBLE: n, MODERE: n, ELEVE: n, CRITIQUE: n }
 */
export default function RiskDoughnut({ repartition = {}, title = 'Répartition des risques' }) {
  const total = NIVEAUX.reduce((sum, n) => sum + (repartition[n.key] ?? 0), 0);

  const data = useMemo(
    () => ({
      labels: NIVEAUX.map((n) => n.label),
      datasets: [
        {
          data: NIVEAUX.map((n) => repartition[n.key] ?? 0),
          backgroundColor: NIVEAUX.map((n) => n.color),
          borderColor: '#12121F',
          borderWidth: 3,
          hoverOffset: 8,
        },
      ],
    }),
    [repartition]
  );

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#12121F',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#E2E8F0',
        bodyColor: '#CBD5E1',
      },
    },
  };

  return (
    <div className="glass-card p-5">
      <h3 className="text-slate-200 font-semibold mb-4">{title}</h3>

      {total === 0 ? (
        <p className="text-slate-500 text-sm text-center py-8">Aucune donnée disponible</p>
      ) : (
        <div className="flex items-center gap-6">
          <div className="relative w-36 h-36 shrink-0">
            <Doughnut data={data} options={options} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{total}</span>
              <span className="text-[10px] text-slate-500 uppercase">total</span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {NIVEAUX.map((n, i) => (
              <motion.div
                key={n.key}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: n.color }} />
                  {n.label}
                </span>
                <span className="font-semibold text-slate-200">{repartition[n.key] ?? 0}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}