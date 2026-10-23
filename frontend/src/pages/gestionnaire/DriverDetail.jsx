import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Car, Hash } from 'lucide-react';
import api from '../../api/axios';
import usePolling from '../../hooks/usePolling';
import ScoreGauge from '../../components/ScoreGauge';
import RiskBadge from '../../components/RiskBadge';
import ScoreLineChart from '../../components/ScoreLineChart';
import AlertTable from '../../components/AlertTable';
import AlertMap from '../../components/AlertMap';
import CriticalBanner from '../../components/CriticalBanner';
import AiAdviceCard from '../../components/AiAdviceCard';
import Skeleton from '../../components/Skeleton';
import { toast } from '../../components/Toast';

// AlerteDto n'a pas de champ "niveau" : on le dérive de severite/critique (seuils arbitraires, à ajuster)
function severiteVersNiveau(a) {
  if (a.critique) return 'CRITIQUE';
  if (a.severite >= 3) return 'ELEVE';
  if (a.severite === 2) return 'MODERE';
  return 'FAIBLE';
}

function adapterAlerte(a) {
  return { id: a.id, libelle: a.description || a.type, niveau: severiteVersNiveau(a), dateHeure: a.horodatage };
}

export default function DriverDetail() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('24h');

  const fetchDetail = useCallback(
    async (plage) => {
      try {
        const { data } = await api.get(`/gestionnaire/conducteurs/${id}/detail`, { params: { plage, page: 0 } });
        setDetail(data);
      } catch {
        toast.error('Impossible de charger ce conducteur.');
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchDetail(range);
  }, [range, fetchDetail]);

  usePolling(() => fetchDetail(range), 5000);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton variant="rect" height={32} width={200} />
        <Skeleton variant="rect" height={160} />
        <Skeleton variant="rect" height={240} />
      </div>
    );
  }

  const conducteur = detail?.conducteur;
  const historiquePoints = (detail?.historique ?? []).map((p) => ({ horodatage: p.instant, score: p.valeur }));
  const alertesAdaptees = (detail?.alertes?.contenu ?? []).map(adapterAlerte);
  const carteAdaptee = (detail?.carte ?? []).map((a) => ({ ...adapterAlerte(a), latitude: a.latitude, longitude: a.longitude }));

  return (
    <div className="space-y-6">
      <Link to="/gestionnaire/conducteurs" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={14} /> Retour aux conducteurs
      </Link>

      <CriticalBanner
        visible={conducteur?.score?.niveau === 'CRITIQUE'}
        conducteurNom={`${conducteur?.prenom} ${conducteur?.nom}`}
        score={conducteur?.score?.valeur}
      />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 flex flex-col md:flex-row items-center gap-6">
        <ScoreGauge score={conducteur?.score?.valeur ?? 0} niveau={conducteur?.score?.niveau ?? 'FAIBLE'} size={160} label="Score actuel" />

        <div className="flex-1 w-full space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">{conducteur?.prenom} {conducteur?.nom}</h1>
            <RiskBadge niveau={conducteur?.score?.niveau ?? 'FAIBLE'} />
          </div>
          <p className="flex items-center gap-2 text-sm text-slate-400">
            <Hash size={14} /> {conducteur?.codeConducteur}
          </p>
          <p className="flex items-center gap-2 text-sm text-slate-400">
            <Mail size={14} /> {conducteur?.email}
          </p>
          <p className="flex items-center gap-2 text-sm text-slate-400">
            <Car size={14} /> {conducteur?.vehiculeMatricule ?? 'Aucun véhicule assigné'}
          </p>
        </div>
      </motion.div>

      <ScoreLineChart points={historiquePoints} range={range} onRangeChange={setRange} accent="#06B6D4" loading={false} />

      <AlertMap alertes={carteAdaptee} />

      <AlertTable alertes={alertesAdaptees} showConducteur={false} />

      {(detail?.conseils ?? []).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-slate-200 font-semibold">Conseils IA reçus</h3>
          {detail.conseils.map((c) => (
            <AiAdviceCard key={c.id} conseil={{ id: c.id, texte: c.contenu, dateCreation: c.createdAt, lu: c.lu }} />
          ))}
        </div>
      )}
    </div>
  );
}