import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const RANGES = [
  { key: '1h', label: '1 h' },
  { key: '6h', label: '6 h' },
  { key: '24h', label: '24 h' },
  { key: '7j', label: '7 j' },
];

/**
 * Courbe d'évolution du score de risque.
 * points: [{ horodatage: string|Date, score: number }]
 * onRangeChange est appelé avec la clé de plage sélectionnée ('1h' | '6h' | '24h' | '7j'),
 * à la charge de la page parente de refaire l'appel API correspondant.
 */
export default function ScoreLineChart({ points = [], range = '24h', onRangeChange, accent = '#06B6D4', loading = false }) {
  const chartData = useMemo(() => {
    const labels = points.map((p) =>
      new Date(p.horodatage).toLocaleString('fr-FR', {
        day: range === '7j' ? '2-digit' : undefined,
        month: range === '7j' ? '2-digit' : undefined,
        hour: '2-digit',
        minute: '2-digit',
      })
    );

    return {
      labels,
      datasets: [
        {
          label: 'Score de risque',
          data: points.map((p) => p.score),
          borderColor: accent,
          backgroundColor: `${accent}33`,
          pointBackgroundColor: accent,
          pointBorderColor: '#0D0D1A',
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.35,
          fill: true,
          borderWidth: 2,
        },
      ],
    };
  }, [points, accent, range]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#12121F',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#E2E8F0',
        bodyColor: '#CBD5E1',
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#64748B', maxTicksLimit: 8 },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#64748B', stepSize: 25 },
      },
    },
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-200 font-semibold">Évolution du score</h3>
        <div className="flex gap-1 bg-bg-card2 rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => onRangeChange?.(r.key)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                range === r.key ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
            Chargement...
          </div>
        )}
        {!loading && points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
            Aucune donnée sur cette période
          </div>
        )}
        {!loading && points.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
            <Line data={chartData} options={options} />
          </motion.div>
        )}
      </div>
    </div>
  );
}