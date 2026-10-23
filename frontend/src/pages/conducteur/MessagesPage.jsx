import { useCallback, useEffect, useState } from 'react';
import api from '../../api/axios';
import usePolling from '../../hooks/usePolling';
import { useAuth } from '../../context/AuthContext';
import ChatPanel from '../../components/ChatPanel';
import { toast } from '../../components/Toast';

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await api.get(`/messages/${user.id}`);
      setMessages(data);
    } catch {
      toast.error('Impossible de charger vos messages.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  usePolling(fetchMessages, 5000);

  useEffect(() => {
    if (user?.id) {
      api.put(`/messages/${user.id}/lus`).catch(() => {});
    }
  }, [user?.id]);

  async function handleSend(contenu) {
    try {
      await api.post('/messages', { conducteurId: null, contenu });
      fetchMessages();
    } catch {
      toast.error("Échec de l'envoi du message.");
    }
  }

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
        <p className="text-slate-400 text-sm">Échangez avec votre gestionnaire de flotte</p>
      </div>

      <ChatPanel
        messages={messagesAdaptes}
        currentUserId="CONDUCTEUR"
        onSend={handleSend}
        destinataireNom="Mon gestionnaire"
        loading={loading}
      />
    </div>
  );
}