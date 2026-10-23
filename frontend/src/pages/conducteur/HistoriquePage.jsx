import { useCallback, useEffect, useState } from 'react';
import api from '../../api/axios';
import ScoreLineChart from '../../components/ScoreLineChart';
import AlertTable from '../../components/AlertTable';
import { toast } from '../../components/Toast';

function severiteVersNiveau(a) {
  if (a.critique) return 'CRITIQUE';
  if (a.severite >= 3) return 'ELEVE';
  if (a.severite === 2) return 'MODERE';
  return 'FAIBLE';
}

export default function HistoriquePage() {
  const [range, setRange] = useState('24h');
  const [points, setPoints] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);

  const fetchHistorique = useCallback(async (plage) => {
    setChartLoading(true);
    try {
      const { data } = await api.get('/conducteur/me/score/historique', { params: { plage } });
      setPoints(data.map((p) => ({ horodatage: p.instant, score: p.valeur })));
    } catch {
      toast.error("Impossible de charger l'historique du score.");
    } finally {
      setChartLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistorique(range);
  }, [range, fetchHistorique]);

  useEffect(() => {
    // L'API ne permet pas de filtrer les alertes par plage temporelle : on affiche la première page disponible.
    async function fetchAlertes() {
      try {
        const { data } = await api.get('/conducteur/me/alertes', { params: { page: 0 } });
        setAlertes(
          data.contenu.map((a) => ({
            id: a.id,
            libelle: a.description || a.type,
            niveau: severiteVersNiveau(a),
            dateHeure: a.horodatage,
          }))
        );
      } catch {
        toast.error('Impossible de charger les alertes.');
      } finally {
        setTableLoading(false);
      }
    }
    fetchAlertes();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Mon historique</h1>
        <p className="text-slate-400 text-sm">Évolution de votre score et détail de vos événements</p>
      </div>

      <ScoreLineChart points={points} range={range} onRangeChange={setRange} accent="#10B981" loading={chartLoading} />

      <AlertTable alertes={alertes} showConducteur={false} loading={tableLoading} />
    </div>
  );
}