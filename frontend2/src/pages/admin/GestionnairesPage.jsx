import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Plus, Trash2, UserCog } from 'lucide-react'
import { admin } from '../../api/endpoints'
import { errorMessage } from '../../api/axios'
import usePolling from '../../hooks/usePolling'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/layout/PageHeader'
import Field from '../../components/layout/Field'
import Modal from '../../components/feedback/Modal'
import ConfirmDialog from '../../components/feedback/ConfirmDialog'
import EmptyState from '../../components/feedback/EmptyState'
import ErrorState from '../../components/feedback/ErrorState'
import Skeleton from '../../components/feedback/Skeleton'
import { listContainer, listItem } from '../../design/motion'

const VIDE = { entreprise: '', email: '', motDePasse: '', actif: true }

function validate(f, creation) {
  const e = {}
  if (!f.entreprise.trim()) e.entreprise = "Indiquez le nom de l'entreprise."
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Saisissez une adresse e-mail valide.'
  if (creation && f.motDePasse.length < 8) e.motDePasse = 'Au moins 8 caractères.'
  if (!creation && f.motDePasse && f.motDePasse.length < 8) e.motDePasse = 'Au moins 8 caractères (ou laissez vide).'
  return e
}

export default function GestionnairesPage() {
  const toast = useToast()
  const { data, loading, error, retry, refresh } = usePolling(admin.gestionnaires)
  const [edition, setEdition] = useState(null)      // null | { id?, ...form }
  const [errs, setErrs] = useState({})
  const [suppr, setSuppr] = useState(null)
  const [busy, setBusy] = useState(false)

  const ouvrir = (g) => { setErrs({}); setEdition(g ? { id: g.id, entreprise: g.entreprise, email: g.email, motDePasse: '', actif: g.actif } : { ...VIDE }) }
  const set = (k) => (e) => setEdition((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const enregistrer = async (e) => {
    e.preventDefault()
    const creation = !edition.id
    const v = validate(edition, creation)
    setErrs(v)
    if (Object.keys(v).length) return
    setBusy(true)
    try {
      const body = { entreprise: edition.entreprise.trim(), email: edition.email.trim(), motDePasse: edition.motDePasse || null, actif: edition.actif }
      if (creation) await admin.creerGestionnaire(body); else await admin.modifierGestionnaire(edition.id, body)
      toast.success(creation ? 'Gestionnaire créé.' : 'Gestionnaire mis à jour.')
      setEdition(null); refresh()
    } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }

  const supprimer = async () => {
    setBusy(true)
    try { await admin.supprimerGestionnaire(suppr.id); toast.success('Gestionnaire supprimé.'); setSuppr(null); refresh() }
    catch (err) { toast.error(errorMessage(err)); setSuppr(null) } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader title="Gestionnaires" breadcrumbs={[{ label: 'Tableau de bord', to: '/admin' }, { label: 'Gestionnaires' }]}
                  subtitle="Comptes des gestionnaires de flotte"
                  actions={<button type="button" className="btn-primary" onClick={() => ouvrir(null)}><Plus className="h-4 w-4" aria-hidden="true" />Nouveau gestionnaire</button>} />

      {loading ? <Skeleton className="h-64" /> : error ? <ErrorState message={error} onRetry={retry} /> : !data.length ? (
        <div className="glass"><EmptyState icon={UserCog} title="Aucun gestionnaire" text="Créez le premier compte gestionnaire pour qu'il puisse superviser sa flotte."
          action={<button type="button" className="btn-primary" onClick={() => ouvrir(null)}>Créer un gestionnaire</button>} /></div>
      ) : (
        <div className="glass overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <caption className="sr-only">Liste des gestionnaires de flotte</caption>
            <thead><tr className="border-b border-line">
              <th scope="col" className="th">Entreprise</th><th scope="col" className="th">E-mail</th>
              <th scope="col" className="th">Conducteurs</th><th scope="col" className="th">Véhicules</th>
              <th scope="col" className="th">Statut</th><th scope="col" className="th"><span className="sr-only">Actions</span></th>
            </tr></thead>
            <motion.tbody variants={listContainer} initial="hidden" animate="show">
              {data.map((g) => (
                <motion.tr key={g.id} variants={listItem} className="border-b border-line/60 hover:bg-white/5">
                  <th scope="row" className="td text-left font-semibold">{g.entreprise}</th>
                  <td className="td text-muted">{g.email}</td>
                  <td className="td tabular-nums">{g.nbConducteurs}</td>
                  <td className="td tabular-nums">{g.nbVehicules}</td>
                  <td className="td">{g.actif ? <span className="font-semibold text-risk-faible">Actif</span> : <span className="text-muted">Inactif</span>}</td>
                  <td className="td"><div className="flex justify-end gap-2">
                    <button type="button" className="btn-ghost" onClick={() => ouvrir(g)} aria-label={`Modifier ${g.entreprise}`}><Pencil className="h-4 w-4" aria-hidden="true" /></button>
                    <button type="button" className="btn-ghost text-risk-critique" onClick={() => setSuppr(g)} aria-label={`Supprimer ${g.entreprise}`}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                  </div></td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      )}

      <Modal open={!!edition} onClose={() => setEdition(null)} title={edition?.id ? 'Modifier le gestionnaire' : 'Nouveau gestionnaire'}>
        {edition && (
          <form onSubmit={enregistrer} noValidate>
            <Field label="Entreprise" required error={errs.entreprise}><input className="field" value={edition.entreprise} onChange={set('entreprise')} /></Field>
            <Field label="Adresse e-mail" required error={errs.email}><input className="field" type="email" autoComplete="off" value={edition.email} onChange={set('email')} /></Field>
            <Field label="Mot de passe" required={!edition.id} error={errs.motDePasse} hint={edition.id ? 'Laissez vide pour conserver le mot de passe actuel.' : '8 caractères minimum.'}>
              <input className="field" type="password" autoComplete="new-password" value={edition.motDePasse} onChange={set('motDePasse')} />
            </Field>
            <label className="mb-6 flex min-h-[44px] items-center gap-3"><input type="checkbox" className="h-5 w-5 accent-[rgb(var(--accent))]" checked={edition.actif} onChange={set('actif')} />Compte actif</label>
            <div className="flex justify-end gap-3">
              <button type="button" className="btn-ghost" onClick={() => setEdition(null)}>Annuler</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          </form>
        )}
      </Modal>
      <ConfirmDialog open={!!suppr} danger busy={busy} title="Supprimer ce gestionnaire ?" confirmLabel="Supprimer"
        message={suppr ? `« ${suppr.entreprise} » sera supprimé définitivement. Cette action est irréversible.` : ''}
        onConfirm={supprimer} onCancel={() => setSuppr(null)} />
    </>
  )
}
