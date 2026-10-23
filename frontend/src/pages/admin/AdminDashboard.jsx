import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Car, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import usePolling from '../../hooks/usePolling';
import KpiCard from '../../components/KpiCard';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import { toast } from '../../components/Toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [gestionnaires, setGestionnaires] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, gestRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/gestionnaires'),
      ]);
      setStats(statsRes.data);
      setGestionnaires(gestRes.data);
    } catch {
      toast.error('Impossible de charger les statistiques globales.');
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(fetchAll, 5000);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-white">Supervision globale</h1>
        <p className="text-slate-400 text-sm">Vue d'ensemble de toutes les entreprises clientes</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height={96} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={Building2} label="Gestionnaires" value={stats?.gestionnaires ?? 0} accent="admin" />
          <KpiCard icon={Users} label="Conducteurs" value={stats?.conducteurs ?? 0} accent="gestionnaire" />
          <KpiCard icon={Car} label="Véhicules" value={stats?.vehicules ?? 0} accent="conducteur" />
          <KpiCard icon={AlertTriangle} label="Alertes (24h)" value={stats?.alertes24h ?? 0} accent="eleve" />
        </div>
      )}

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-200 font-semibold">Entreprises clientes</h3>
          <Link to="/admin/gestionnaires" className="text-sm text-role-admin hover:underline">
            Gérer tout
          </Link>
        </div>

        {loading ? (
          <Skeleton variant="rect" height={48} count={3} />
        ) : gestionnaires.length === 0 ? (
          <EmptyState icon={Building2} title="Aucun gestionnaire" description="Créez le premier compte gestionnaire d'entreprise." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/5">
                <th className="pb-2 font-medium">Entreprise</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Conducteurs</th>
                <th className="pb-2 font-medium">Véhicules</th>
              </tr>
            </thead>
            <tbody>
              {gestionnaires.slice(0, 6).map((g) => (
                <tr key={g.id} className="border-b border-white/5 last:border-0">
                  <td className="py-2.5 text-slate-200 font-medium">{g.entreprise}</td>
                  <td className="py-2.5 text-slate-400">{g.email}</td>
                  <td className="py-2.5 text-slate-400">{g.nbConducteurs}</td>
                  <td className="py-2.5 text-slate-400">{g.nbVehicules}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}