import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Car } from 'lucide-react';
import api from '../../api/axios';
import usePolling from '../../hooks/usePolling';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const EMPTY_FORM = { matricule: '', marque: '', modele: '', statut: 'ACTIF' };

export default function VehiculesPage() {
  const [vehicules, setVehicules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  async function fetchVehicules() {
    try {
      const { data } = await api.get('/gestionnaire/vehicules');
      setVehicules(data);
    } catch {
      toast.error('Impossible de charger les véhicules.');
    } finally {
      setLoading(false);
    }
  }

  usePolling(fetchVehicules, 10000);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(v) {
    setEditing(v);
    setForm({ matricule: v.matricule, marque: v.marque ?? '', modele: v.modele ?? '', statut: v.statut });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/gestionnaire/vehicules/${editing.id}`, form);
        toast.success('Véhicule mis à jour.');
      } else {
        await api.post('/gestionnaire/vehicules', form);
        toast.success('Véhicule ajouté.');
      }
      setModalOpen(false);
      fetchVehicules();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`/gestionnaire/vehicules/${confirmDelete.id}`);
      toast.success('Véhicule supprimé.');
      setConfirmDelete(null);
      fetchVehicules();
    } catch {
      toast.error('Échec de la suppression.');
    }
  }

  const STATUT_STYLE = {
    ACTIF: 'text-risk-faible bg-risk-faible/10',
    INACTIF: 'text-slate-500 bg-slate-500/10',
    MAINTENANCE: 'text-risk-modere bg-risk-modere/10',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Véhicules</h1>
          <p className="text-slate-400 text-sm">Parc automobile de votre entreprise</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
          <Plus size={16} /> Nouveau véhicule
        </button>
      </div>

      <div className="glass-card p-5">
        {loading ? (
          <Skeleton variant="rect" height={48} count={4} />
        ) : vehicules.length === 0 ? (
          <EmptyState icon={Car} title="Aucun véhicule" description="Ajoutez votre premier véhicule à la flotte." actionLabel="Créer" onAction={openCreate} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/5">
                <th className="pb-2 font-medium">Matricule</th>
                <th className="pb-2 font-medium">Marque / Modèle</th>
                <th className="pb-2 font-medium">Statut</th>
                <th className="pb-2 font-medium">Conducteur assigné</th>
                <th className="pb-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicules.map((v) => (
                <motion.tr key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                  <td className="py-3 text-slate-200 font-mono text-xs">{v.matricule}</td>
                  <td className="py-3 text-slate-300">{v.marque} {v.modele}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUT_STYLE[v.statut] ?? ''}`}>{v.statut}</span>
                  </td>
                  <td className="py-3 text-slate-400">{v.conducteurNom ?? '—'}</td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(v)}
                        className="p-1.5 rounded-lg hover:bg-risk-critique/20 text-slate-400 hover:text-risk-critique"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleSubmit}
              className="glass-card max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-100">{editing ? 'Modifier le véhicule' : 'Nouveau véhicule'}</h3>
                <button type="button" onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Matricule</label>
                <input required value={form.matricule} onChange={(e) => setForm({ ...form, matricule: e.target.value })} className="input-field w-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Marque</label>
                  <input value={form.marque} onChange={(e) => setForm({ ...form, marque: e.target.value })} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Modèle</label>
                  <input value={form.modele} onChange={(e) => setForm({ ...form, modele: e.target.value })} className="input-field w-full" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Statut</label>
                <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })} className="input-field w-full">
                  <option value="ACTIF">Actif</option>
                  <option value="INACTIF">Inactif</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-sm disabled:opacity-60">
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Supprimer ce véhicule ?"
        message={`Cette action supprimera définitivement le véhicule "${confirmDelete?.matricule}".`}
        confirmLabel="Supprimer"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}