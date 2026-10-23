import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import api from '../../api/axios';
import usePolling from '../../hooks/usePolling';
import { useAuth } from '../../context/AuthContext';
import ChatPanel from '../../components/ChatPanel';
import EmptyState from '../../components/EmptyState';
import Skeleton from '../../components/Skeleton';
import { toast } from '../../components/Toast';

export default function MessagesPage() {
  const { user } = useAuth();
  const [conducteurs, setConducteurs] = useState([]);
  const [loadingListe, setLoadingListe] = useState(true);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const fetchConducteurs = useCallback(async () => {
    try {
      const { data } = await api.get('/gestionnaire/conducteurs');
      setConducteurs(data);
      setSelected((prev) => prev ?? data[0] ?? null);
    } catch {
      toast.error('Impossible de charger la liste des conducteurs.');
    } finally {
      setLoadingListe(false);
    }
  }, []);

  usePolling(fetchConducteurs, 10000);

  const fetchMessages = useCallback(async () => {
    if (!selected) return;
    try {
      const { data } = await api.get(`/messages/${selected.id}`);
      setMessages(data);
    } catch {
      toast.error('Impossible de charger les messages.');
    } finally {
      setLoadingMessages(false);
    }
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    setLoadingMessages(true);
    fetchMessages();
    api.put(`/messages/${selected.id}/lus`).catch(() => {});
  }, [selected]);

  usePolling(fetchMessages, 5000, !!selected);

  async function handleSend(contenu) {
    try {
      await api.post('/messages', { conducteurId: selected.id, contenu });
      fetchMessages();
    } catch {
      toast.error("Échec de l'envoi du message.");
    }
  }

  // ChatPanel aligne les bulles via expediteurId === currentUserId : on utilise le rôle
  // (expediteurId) faute d'un vrai id utilisateur côté MessageDto.
  const messagesAdaptes = messages.map((m) => ({
    id: m.id,
    texte: m.contenu,
    dateEnvoi: m.createdAt,
    expediteurId: m.expediteurRole,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Messagerie</h1>
        <p className="text-slate-400 text-sm">Communiquez directement avec vos conducteurs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
        <div className="glass-card p-3 h-[520px] overflow-y-auto">
          {loadingListe ? (
            <Skeleton variant="rect" height={48} count={5} />
          ) : conducteurs.length === 0 ? (
            <EmptyState icon={MessageSquare} title="Aucun conducteur" description="" />
          ) : (
            <div className="space-y-1">
              {conducteurs.map((c) => (
                <motion.button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  whileHover={{ x: 2 }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    selected?.id === c.id ? 'bg-role-gestionnaire/15 text-white' : 'text-slate-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <p className="font-medium">{c.prenom} {c.nom}</p>
                  <p className="text-xs text-slate-500">{c.codeConducteur}</p>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {selected ? (
          <ChatPanel
            messages={messagesAdaptes}
            currentUserId="GESTIONNAIRE"
            onSend={handleSend}
            destinataireNom={`${selected.prenom} ${selected.nom}`}
            loading={loadingMessages}
          />
        ) : (
          <div className="glass-card flex items-center justify-center h-[520px]">
            <EmptyState icon={MessageSquare} title="Sélectionnez un conducteur" description="Choisissez un conducteur dans la liste pour afficher la conversation." />
          </div>
        )}
      </div>
    </div>
  );
}