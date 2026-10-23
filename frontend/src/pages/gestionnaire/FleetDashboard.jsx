import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Car, Gauge, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import usePolling from '../../hooks/usePolling';
import KpiCard from '../../components/KpiCard';
import RiskDoughnut from '../../components/RiskDoughnut';
import CriticalBanner from '../../components/CriticalBanner';
import RiskBadge from '../../components/RiskBadge';
import Skeleton from '../../components/Skeleton';
import { toast } from '../../components/Toast';

export default function FleetDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const { data } = await api.get('/gestionnaire/dashboard');
      setDashboard(data);
    } catch {
      toast.error('Impossible de charger le tableau de bord de la flotte.');
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(fetchDashboard, 5000);

  const conducteurCritique = dashboard?.topRisque?.find((c) => c.score?.niveau === 'CRITIQUE');

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-white">Tableau de bord de la flotte</h1>
        <p className="text-slate-400 text-sm">Supervision en temps réel de vos conducteurs</p>
      </motion.div>

      <CriticalBanner
        visible={!!conducteurCritique}
        conducteurNom={conducteurCritique ? `${conducteurCritique.prenom} ${conducteurCritique.nom}` : ''}
        score={conducteurCritique?.score?.valeur}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height={96} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={Users} label="Conducteurs actifs" value={dashboard?.kpi?.conducteursActifs ?? 0} accent="gestionnaire" />
          <KpiCard icon={Car} label="Véhicules" value={dashboard?.kpi?.vehicules ?? 0} accent="gestionnaire" />
          <KpiCard icon={Gauge} label="Score moyen" value={dashboard?.kpi?.scoreMoyen?.toFixed(1) ?? 0} suffix="/100" accent="faible" decimals={1} />
          <KpiCard icon={AlertTriangle} label="Conducteurs critiques" value={dashboard?.kpi?.conducteursCritiques ?? 0} accent="critique" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RiskDoughnut repartition={dashboard?.repartition ?? {}} />

        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-slate-200 font-semibold mb-4">Conducteurs les plus à risque</h3>
          {(dashboard?.topRisque ?? []).length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">Aucun conducteur à risque actuellement</p>
          ) : (
            <div className="space-y-2">
              {dashboard.topRisque.map((c) => (
                <Link
                  key={c.id}
                  to={`/gestionnaire/conducteurs/${c.id}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
                >
                  <span className="text-slate-200 text-sm font-medium">{c.prenom} {c.nom}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-sm">{c.score?.valeur?.toFixed(0) ?? '—'}/100</span>
                    <RiskBadge niveau={c.score?.niveau ?? 'FAIBLE'} size="sm" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}