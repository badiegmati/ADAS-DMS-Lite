import { motion } from 'framer-motion';
import { Sparkles, BadgeInfo } from 'lucide-react';

/**
 * Carte de conseil généré par IA (Gemini, côté backend uniquement) pour un conducteur à risque.
 * conseil: { id, texte, dateCreation, estRepli, lu }
 */
export default function AiAdviceCard({ conseil, onMarquerLu }) {
  if (!conseil) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-5 border-l-4 ${
        conseil.lu ? 'border-l-muted' : 'border-l-role-conducteur'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-role-conducteur/15 flex items-center justify-center shrink-0">
          <Sparkles size={18} className="text-role-conducteur" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-slate-200">Conseil personnalisé</p>
            {!conseil.lu && (
              <span className="w-2 h-2 rounded-full bg-role-conducteur animate-pulse-neon shrink-0" />
            )}
          </div>

          <p className="text-sm text-slate-300 mt-1 leading-relaxed">{conseil.texte}</p>

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-500">
              {new Date(conseil.dateCreation).toLocaleString('fr-FR')}
              {conseil.estRepli && (
                <span className="inline-flex items-center gap-1 ml-2 text-slate-600">
                  <BadgeInfo size={12} /> message générique
                </span>
              )}
            </span>

            {!conseil.lu && onMarquerLu && (
              <button
                onClick={() => onMarquerLu(conseil.id)}
                className="text-xs text-role-conducteur hover:underline"
              >
                Marquer comme lu
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}