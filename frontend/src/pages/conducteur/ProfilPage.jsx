import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Hash, Car, Lock, Phone } from 'lucide-react';
import api from '../../api/axios';
import usePolling from '../../hooks/usePolling';
import RiskBadge from '../../components/RiskBadge';
import Skeleton from '../../components/Skeleton';
import { toast } from '../../components/Toast';

export default function ProfilPage() {
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: '', telephone: '', motDePasse: '' });
  const [saving, setSaving] = useState(false);

  const fetchProfil = useCallback(async () => {
    try {
      const { data } = await api.get('/conducteur/me/profil');
      setProfil(data);
      setForm((prev) => ({ ...prev, email: data.email, telephone: data.telephone ?? '' }));
    } catch {
      toast.error('Impossible de charger votre profil.');
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(fetchProfil, 30000);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/conducteur/me/profil', {
        email: form.email,
        telephone: form.telephone,
        motDePasse: form.motDePasse || null,
      });
      toast.success('Profil mis à jour.');
      setForm((prev) => ({ ...prev, motDePasse: '' }));
      fetchProfil();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Échec de la mise à jour du profil.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white">Mon profil</h1>
        <p className="text-slate-400 text-sm">Vos informations personnelles</p>
      </div>

      {loading ? (
        <Skeleton variant="rect" height={160} />
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-role-conducteur/15 flex items-center justify-center text-role-conducteur text-xl font-bold">
              {profil?.prenom?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{profil?.prenom} {profil?.nom}</p>
              <RiskBadge niveau={profil?.score?.niveau ?? 'FAIBLE'} size="sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <p className="flex items-center gap-2 text-slate-300">
              <Hash size={14} className="text-slate-500" /> {profil?.codeConducteur}
            </p>
            <p className="flex items-center gap-2 text-slate-300">
              <Car size={14} className="text-slate-500" /> {profil?.vehiculeMatricule ?? 'Aucun véhicule assigné'}
            </p>
            <p className="flex items-center gap-2 text-slate-300">
              <User size={14} className="text-slate-500" /> Membre depuis{' '}
              {profil?.createdAt ? new Date(profil.createdAt).toLocaleDateString('fr-FR') : '—'}
            </p>
          </div>
        </motion.div>
      )}

      <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <Lock size={16} /> Modifier mes informations
        </h3>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
            <Mail size={12} /> Email
          </label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field w-full" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
            <Phone size={12} /> Téléphone
          </label>
          <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className="input-field w-full" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">
            Nouveau mot de passe <span className="text-slate-600">(laisser vide pour ne pas changer)</span>
          </label>
          <input type="password" value={form.motDePasse} onChange={(e) => setForm({ ...form, motDePasse: e.target.value })} className="input-field w-full" />
        </div>

        <button type="submit" disabled={saving} className="btn-primary px-5 py-2 text-sm disabled:opacity-60">
          {saving ? 'Mise à jour...' : 'Enregistrer'}
        </button>
      </motion.form>
    </div>
  );
}