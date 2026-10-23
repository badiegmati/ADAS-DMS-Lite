import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

/**
 * Panneau de messagerie bidirectionnelle gestionnaire <-> conducteur.
 * messages: [{ id, texte, dateEnvoi, expediteurId, lu }]
 * currentUserId: id de l'utilisateur connecté (aligne les bulles à droite/gauche)
 */
export default function ChatPanel({ messages = [], currentUserId, onSend, destinataireNom, loading = false }) {
  const [texte, setTexte] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function handleSubmit(e) {
    e.preventDefault();
    const contenu = texte.trim();
    if (!contenu) return;
    onSend?.(contenu);
    setTexte('');
  }

  return (
    <div className="glass-card flex flex-col h-[520px]">
      <div className="px-5 py-4 border-b border-white/10">
        <h3 className="text-slate-200 font-semibold">{destinataireNom ?? 'Messagerie'}</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {loading ? (
          <p className="text-slate-500 text-sm text-center mt-8">Chargement des messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-slate-500 text-sm text-center mt-8">Aucun message pour le moment</p>
        ) : (
          messages.map((m) => {
            const estMoi = m.expediteurId === currentUserId;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${estMoi ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    estMoi
                      ? 'bg-role-conducteur/20 text-slate-100 rounded-br-sm'
                      : 'bg-bg-card2 text-slate-200 rounded-bl-sm'
                  }`}
                >
                  <p className="leading-relaxed">{m.texte}</p>
                  <p className="text-[10px] text-slate-500 mt-1 text-right">
                    {new Date(m.dateEnvoi).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-white/10 flex gap-2">
        <input
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Écrire un message..."
          className="input-field flex-1"
        />
        <button type="submit" className="btn-primary px-4 flex items-center justify-center" disabled={!texte.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}