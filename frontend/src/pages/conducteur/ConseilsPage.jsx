import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Wand2, CheckCheck } from 'lucide-react';
import api from '../../api/axios';
import usePolling from '../../hooks/usePolling';
import AiAdviceCard from '../../components/AiAdviceCard';
import EmptyState from '../../components/EmptyState';
import Skeleton from '../../components/Skeleton';
import { toast } from '../../components/Toast';

export default function ConseilsPage() {
  const [conseils, setConseils] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchConseils = useCallback(async () => {
    try {
      const { data } = await api.get('/conducteur/me/conseils');
      setConseils(data);
    } catch {
      toast.error('Impossible de charger vos conseils.');
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(fetchConseils, 10000);

  async function handleGenerer() {
    setGenerating(true);
    try {
      await api.post('/conducteur/me/conseils/generer');
      toast.success('Nouveau conseil généré.');
      fetchConseils();
    } catch (err) {
      if (err?.response?.status === 429) {
        toast.info('Un conseil a déjà été généré récemment. Réessayez plus tard.');
      } else {
        toast.error('Impossible de générer un conseil pour le moment.');
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handleMarquerTousLus() {
    try {
      await api.put('/conducteur/me/conseils/lus');
      setConseils((prev) => prev.map((c) => ({ ...c, lu: true })));
      toast.success('Tous les conseils ont été marqués comme lus.');
    } catch {
      toast.error('Échec de la mise à jour.');
    }
  }

  const nonLus = conseils.filter((c) => !c.lu).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Conseils personnalisés</h1>
          <p className="text-slate-400 text-sm">Recommandations générées automatiquement selon votre conduite</p>
        </div>
        <div className="flex gap-2">
          {nonLus > 0 && (
            <button onClick={handleMarquerTousLus} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5">
              <CheckCheck size={16} /> Tout marquer lu
            </button>
          )}
          <button onClick={handleGenerer} disabled={generating} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60">
            <Wand2 size={16} /> {generating ? 'Génération...' : 'Générer un conseil'}
          </button>
        </div>
      </div>

      {loading ? (
        <Skeleton variant="rect" height={100} count={3} />
      ) : conseils.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Aucun conseil pour le moment"
          description="Cliquez sur « Générer un conseil » ou continuez à conduire prudemment."
        />
      ) : (
        <div className="space-y-3">
          {conseils.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <AiAdviceCard conseil={{ id: c.id, texte: c.contenu, dateCreation: c.createdAt, lu: c.lu }} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}