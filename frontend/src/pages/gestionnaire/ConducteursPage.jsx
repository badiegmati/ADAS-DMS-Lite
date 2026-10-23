import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, X, Users } from 'lucide-react';
import api from '../../api/axios';
import usePolling from '../../hooks/usePolling';
import RiskBadge from '../../components/RiskBadge';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const EMPTY_FORM = { codeConducteur: '', nom: '', prenom: '', email: '', telephone: '', motDePasse: '', vehiculeId: '', actif: true };

export default function ConducteursPage() {
  const [conducteurs, setConducteurs] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  async function fetchConducteurs() {
    try {
      const { data } = await api.get('/gestionnaire/conducteurs');
      setConducteurs(data);
    } catch {
      toast.error('Impossible de charger les conducteurs.');
    } finally {
      setLoading(false);
    }
  }

  usePolling(fetchConducteurs, 5000);

  async function fetchVehicules() {
    try {
      const { data } = await api.get('/gestionnaire/vehicules');
      setVehicules(data);
    } catch {
      // silencieux : liste utilisée uniquement pour l'assignation dans le formulaire
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    fetchVehicules();
    setModalOpen(true);
  }

  function openEdit(c) {
    setEditing(c);
    setForm({
      codeConducteur: c.codeConducteur,
      nom: c.nom,
      prenom: c.prenom,
      email: c.email,
      telephone: c.telephone ?? '',
      motDePasse: '',
      vehiculeId: c.vehiculeId ?? '',
      actif: c.actif,
    });
    fetchVehicules();
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, vehiculeId: form.vehiculeId || null, motDePasse: form.motDePasse || null };
      if (editing) {
        await api.put(`/gestionnaire/conducteurs/${editing.id}`, payload);
        toast.success('Conducteur mis à jour.');
      } else {
        await api.post('/gestionnaire/conducteurs', payload);
        toast.success('Conducteur créé.');
      }
      setModalOpen(false);
      fetchConducteurs();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`/gestionnaire/conducteurs/${confirmDelete.id}`);
      toast.success('Conducteur supprimé.');
      setConfirmDelete(null);
      fetchConducteurs();
    } catch {
      toast.error('Échec de la suppression.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Conducteurs</h1>
          <p className="text-slate-400 text-sm">Gestion des comptes conducteurs de votre flotte</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
          <Plus size={16} /> Nouveau conducteur
        </button>
      </div>

      <div className="glass-card p-5">
        {loading ? (
          <Skeleton variant="rect" height={48} count={5} />
        ) : conducteurs.length === 0 ? (
          <EmptyState icon={Users} title="Aucun conducteur" description="Ajoutez votre premier conducteur à la flotte." actionLabel="Créer" onAction={openCreate} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/5">
                <th className="pb-2 font-medium">Code</th>
                <th className="pb-2 font-medium">Nom</th>
                <th className="pb-2 font-medium">Véhicule</th>
                <th className="pb-2 font-medium">Score</th>
                <th className="pb-2 font-medium">Niveau</th>
                <th className="pb-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {conducteurs.map((c) => (
                <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                  <td className="py-3 text-slate-300 font-mono text-xs">{c.codeConducteur}</td>
                  <td className="py-3">
                    <Link to={`/gestionnaire/conducteurs/${c.id}`} className="text-slate-200 font-medium hover:underline">
                      {c.prenom} {c.nom}
                    </Link>
                  </td>
                  <td className="py-3 text-slate-400">{c.vehiculeMatricule ?? '—'}</td>
                  <td className="py-3 text-slate-300">{c.score?.valeur?.toFixed(0) ?? '—'}/100</td>
                  <td className="py-3">
                    <RiskBadge niveau={c.score?.niveau ?? 'FAIBLE'} size="sm" />
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(c)}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 overflow-y-auto py-8"
            onClick={() => setModalOpen(false)}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleSubmit}
              className="glass-card max-w-md w-full p-6 space-y-4 my-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-100">{editing ? 'Modifier le conducteur' : 'Nouveau conducteur'}</h3>
                <button type="button" onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Code conducteur</label>
                  <input required value={form.codeConducteur} onChange={(e) => setForm({ ...form, codeConducteur: e.target.value })} className="input-field w-full" placeholder="ex: C10" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Téléphone</label>
                  <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className="input-field w-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Prénom</label>
                  <input required value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Nom</label>
                  <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="input-field w-full" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Email</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Véhicule assigné</label>
                <select value={form.vehiculeId} onChange={(e) => setForm({ ...form, vehiculeId: e.target.value })} className="input-field w-full">
                  <option value="">Aucun</option>
                  {vehicules.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.matricule} — {v.modele}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Mot de passe {editing && <span className="text-slate-600">(laisser vide pour ne pas changer)</span>}
                </label>
                <input type="password" value={form.motDePasse} onChange={(e) => setForm({ ...form, motDePasse: e.target.value })} className="input-field w-full" required={!editing} />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} className="rounded" />
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
        title="Supprimer ce conducteur ?"
        message={`Cette action supprimera définitivement le compte de "${confirmDelete?.prenom} ${confirmDelete?.nom}".`}
        confirmLabel="Supprimer"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}