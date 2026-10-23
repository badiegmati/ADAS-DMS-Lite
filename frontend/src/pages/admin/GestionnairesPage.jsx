import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Building2, X, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../api/axios';
import usePolling from '../../hooks/usePolling';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const EMPTY_FORM = { entreprise: '', email: '', motDePasse: '', actif: true };

export default function GestionnairesPage() {
  const [gestionnaires, setGestionnaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  async function fetchGestionnaires() {
    try {
      const { data } = await api.get('/admin/gestionnaires');
      setGestionnaires(data);
    } catch {
      toast.error('Impossible de charger les gestionnaires.');
    } finally {
      setLoading(false);
    }
  }

  usePolling(fetchGestionnaires, 10000);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(g) {
    setEditing(g);
    setForm({ entreprise: g.entreprise, email: g.email, motDePasse: '', actif: g.actif });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        entreprise: form.entreprise,
        email: form.email,
        motDePasse: form.motDePasse || null,
        actif: form.actif,
      };
      if (editing) {
        await api.put(`/admin/gestionnaires/${editing.id}`, payload);
        toast.success('Gestionnaire mis à jour.');
      } else {
        await api.post('/admin/gestionnaires', payload);
        toast.success('Gestionnaire créé.');
      }
      setModalOpen(false);
      fetchGestionnaires();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`/admin/gestionnaires/${confirmDelete.id}`);
      toast.success('Gestionnaire supprimé.');
      setConfirmDelete(null);
      fetchGestionnaires();
    } catch {
      toast.error('Échec de la suppression.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Gestionnaires</h1>
          <p className="text-slate-400 text-sm">Entreprises clientes et leurs comptes gestionnaire</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
          <Plus size={16} /> Nouveau gestionnaire
        </button>
      </div>

      <div className="glass-card p-5">
        {loading ? (
          <Skeleton variant="rect" height={48} count={4} />
        ) : gestionnaires.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Aucun gestionnaire"
            description="Créez le premier compte gestionnaire d'entreprise."
            actionLabel="Créer"
            onAction={openCreate}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/5">
                <th className="pb-2 font-medium">Entreprise</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Conducteurs</th>
                <th className="pb-2 font-medium">Véhicules</th>
                <th className="pb-2 font-medium">Statut</th>
                <th className="pb-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {gestionnaires.map((g) => (
                <motion.tr
                  key={g.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="py-3 text-slate-200 font-medium">{g.entreprise}</td>
                  <td className="py-3 text-slate-400">{g.email}</td>
                  <td className="py-3 text-slate-400">{g.nbConducteurs}</td>
                  <td className="py-3 text-slate-400">{g.nbVehicules}</td>
                  <td className="py-3">
                    {g.actif ? (
                      <span className="inline-flex items-center gap-1 text-risk-faible text-xs">
                        <CheckCircle2 size={14} /> Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-500 text-xs">
                        <XCircle size={14} /> Inactif
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(g)}
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
                <h3 className="font-semibold text-slate-100">
                  {editing ? 'Modifier le gestionnaire' : 'Nouveau gestionnaire'}
                </h3>
                <button type="button" onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Entreprise</label>
                <input
                  required
                  value={form.entreprise}
                  onChange={(e) => setForm({ ...form, entreprise: e.target.value })}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Mot de passe {editing && <span className="text-slate-600">(laisser vide pour ne pas changer)</span>}
                </label>
                <input
                  type="password"
                  value={form.motDePasse}
                  onChange={(e) => setForm({ ...form, motDePasse: e.target.value })}
                  className="input-field w-full"
                  required={!editing}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.actif}
                  onChange={(e) => setForm({ ...form, actif: e.target.checked })}
                  className="rounded"
                />
                Compte actif
              </label>

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
        title="Supprimer ce gestionnaire ?"
        message={`Cette action supprimera définitivement "${confirmDelete?.entreprise}", ses conducteurs, véhicules et messages.`}
        confirmLabel="Supprimer"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}