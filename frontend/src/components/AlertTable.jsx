import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import RiskBadge from './RiskBadge';
import EmptyState from './EmptyState';

const PAGE_SIZE = 8;

/**
 * Tableau paginé des alertes DMS avec filtres (niveau + recherche libre).
 * alertes: [{ id, type, libelle, niveau, dateHeure, conducteurNom, vehicule }]
 */
export default function AlertTable({ alertes = [], showConducteur = true, loading = false }) {
  const [niveauFiltre, setNiveauFiltre] = useState('TOUS');
  const [recherche, setRecherche] = useState('');
  const [page, setPage] = useState(0);

  const filtrees = useMemo(() => {
    return alertes.filter((a) => {
      const okNiveau = niveauFiltre === 'TOUS' || a.niveau === niveauFiltre;
      const okRecherche =
        recherche.trim() === '' ||
        a.libelle?.toLowerCase().includes(recherche.toLowerCase()) ||
        a.conducteurNom?.toLowerCase().includes(recherche.toLowerCase());
      return okNiveau && okRecherche;
    });
  }, [alertes, niveauFiltre, recherche]);

  const pageCount = Math.max(1, Math.ceil(filtrees.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount - 1);
  const pageItems = filtrees.slice(pageSafe * PAGE_SIZE, pageSafe * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="glass-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-slate-200 font-semibold">Historique des alertes</h3>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={recherche}
              onChange={(e) => {
                setRecherche(e.target.value);
                setPage(0);
              }}
              placeholder="Rechercher..."
              className="input-field pl-8 py-1.5 text-sm w-40"
            />
          </div>

          <select
            value={niveauFiltre}
            onChange={(e) => {
              setNiveauFiltre(e.target.value);
              setPage(0);
            }}
            className="input-field py-1.5 text-sm"
          >
            <option value="TOUS">Tous niveaux</option>
            <option value="FAIBLE">Faible</option>
            <option value="MODERE">Modéré</option>
            <option value="ELEVE">Élevé</option>
            <option value="CRITIQUE">Critique</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm py-8 text-center">Chargement...</p>
      ) : filtrees.length === 0 ? (
        <EmptyState title="Aucune alerte" description="Aucun événement ne correspond aux filtres actuels." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-white/5">
                  <th className="pb-2 font-medium">Événement</th>
                  {showConducteur && <th className="pb-2 font-medium">Conducteur</th>}
                  <th className="pb-2 font-medium">Véhicule</th>
                  <th className="pb-2 font-medium">Niveau</th>
                  <th className="pb-2 font-medium text-right">Date / heure</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {pageItems.map((a) => (
                    <motion.tr
                      key={a.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-2.5 text-slate-200">{a.libelle ?? a.type}</td>
                      {showConducteur && <td className="py-2.5 text-slate-400">{a.conducteurNom ?? '—'}</td>}
                      <td className="py-2.5 text-slate-400">{a.vehicule ?? '—'}</td>
                      <td className="py-2.5">
                        <RiskBadge niveau={a.niveau} size="sm" />
                      </td>
                      <td className="py-2.5 text-right text-slate-500">
                        {new Date(a.dateHeure).toLocaleString('fr-FR')}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
            <span>
              Page {pageSafe + 1} / {pageCount} — {filtrees.length} résultat(s)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={pageSafe === 0}
                className="p-1.5 rounded-lg bg-bg-card2 disabled:opacity-30 hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={pageSafe >= pageCount - 1}
                className="p-1.5 rounded-lg bg-bg-card2 disabled:opacity-30 hover:bg-white/10 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}