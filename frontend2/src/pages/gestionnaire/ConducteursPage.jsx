import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
import { gestionnaire } from '../../api/endpoints'
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
import RiskBadge from '../../components/data/RiskBadge'
import { listContainer, listItem } from '../../design/motion'
import { nomComplet } from '../../lib/format'

const VIDE = { codeConducteur: '', nom: '', prenom: '', email: '', telephone: '', motDePasse: '', vehiculeId: '', actif: true }

function validate(f, creation) {
  const e = {}
  if (!f.nom.trim()) e.nom = 'Indiquez le nom.'
  if (!f.prenom.trim()) e.prenom = 'Indiquez le prénom.'
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Saisissez une adresse e-mail valide.'
  if (creation && f.motDePasse.length < 8) e.motDePasse = 'Au moins 8 caractères.'
  if (!creation && f.motDePasse && f.motDePasse.length < 8) e.motDePasse = 'Au moins 8 caractères (ou laissez vide).'
  return e
}

export default function ConducteursPage() {
  const toast = useToast()
  const cond = usePolling(gestionnaire.conducteurs)
  const veh = usePolling(gestionnaire.vehicules)
  const [q, setQ] = useState('')
  const [edition, setEdition] = useState(null)
  const [errs, setErrs] = useState({})
  const [suppr, setSuppr] = useState(null)
  const [busy, setBusy] = useState(false)

  const liste = useMemo(() => {
    const n = q.trim().toLowerCase()
    return (cond.data ?? []).filter((c) => !n || `${nomComplet(c)} ${c.codeConducteur} ${c.email}`.toLowerCase().includes(n))
  }, [cond.data, q])

  // Véhicules affectables : libres, ou celui déjà affecté au conducteur édité.
  const options = (veh.data ?? []).filter((v) => !v.conducteurNom || v.id === edition?.vehiculeActuel)

  const ouvrir = (c) => {
    setErrs({})
    setEdition(c ? { id: c.id, codeConducteur: c.codeConducteur ?? '', nom: c.nom, prenom: c.prenom, email: c.email,
      telephone: c.telephone ?? '', motDePasse: '', vehiculeId: c.vehiculeId ?? '', vehiculeActuel: c.vehiculeId, actif: c.actif } : { ...VIDE })
  }
  const set = (k) => (e) => setEdition((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const reload = () => { cond.refresh(); veh.refresh() }

  const enregistrer = async (e) => {
    e.preventDefault()
    const creation = !edition.id
    const v = validate(edition, creation)
    setErrs(v)
    if (Object.keys(v).length) return
    setBusy(true)
    try {
      const body = {
        codeConducteur: edition.codeConducteur.trim() || null, nom: edition.nom.trim(), prenom: edition.prenom.trim(),
        email: edition.email.trim(), telephone: edition.telephone.trim() || null, motDePasse: edition.motDePasse || null,
        vehiculeId: edition.vehiculeId || null, actif: edition.actif,
      }
      if (creation) await gestionnaire.creerConducteur(body); else await gestionnaire.modifierConducteur(edition.id, body)
      toast.success(creation ? 'Conducteur créé.' : 'Conducteur mis à jour.')
      setEdition(null); reload()
    } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }

  const supprimer = async () => {
    setBusy(true)
    try { await gestionnaire.supprimerConducteur(suppr.id); toast.success('Conducteur supprimé.'); setSuppr(null); reload() }
    catch (err) { toast.error(errorMessage(err)); setSuppr(null) } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader title="Conducteurs" subtitle="Gérez vos conducteurs et l’affectation de leur véhicule"
        breadcrumbs={[{ label: 'Tableau de bord', to: '/gestionnaire' }, { label: 'Conducteurs' }]}
        actions={<button type="button" className="btn-primary" onClick={() => ouvrir(null)}><Plus className="h-4 w-4" aria-hidden="true" />Nouveau conducteur</button>} />

      {cond.loading ? <Skeleton className="h-64" /> : cond.error ? <ErrorState message={cond.error} onRetry={cond.retry} /> : (
        <div className="glass p-5">
          <label htmlFor="rech-c" className="label">Rechercher un conducteur</label>
          <div className="relative mb-4 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input id="rech-c" type="search" className="field pl-9" placeholder="Nom, code ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {!cond.data.length ? (
            <EmptyState icon={Users} title="Aucun conducteur" text="Créez votre premier conducteur pour commencer le suivi."
              action={<button type="button" className="btn-primary" onClick={() => ouvrir(null)}>Créer un conducteur</button>} />
          ) : !liste.length ? <EmptyState icon={Search} title="Aucun résultat" text="Aucun conducteur ne correspond à votre recherche." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <caption className="sr-only">Liste des conducteurs</caption>
                <thead><tr className="border-b border-line">
                  <th scope="col" className="th">Conducteur</th><th scope="col" className="th">Contact</th>
                  <th scope="col" className="th">Véhicule</th><th scope="col" className="th">Niveau</th>
                  <th scope="col" className="th">Statut</th><th scope="col" className="th"><span className="sr-only">Actions</span></th>
                </tr></thead>
                <motion.tbody variants={listContainer} initial="hidden" animate="show">
                  {liste.map((c) => (
                    <motion.tr key={c.id} variants={listItem} className="border-b border-line/60 hover:bg-white/5">
                      <th scope="row" className="td text-left">
                        <Link to={`/gestionnaire/conducteurs/${c.id}`} className="font-semibold underline-offset-4 hover:text-accent hover:underline">{nomComplet(c)}</Link>
                        <span className="block text-xs font-normal text-muted">{c.codeConducteur}</span>
                      </th>
                      <td className="td text-muted">{c.email}<span className="block text-xs">{c.telephone}</span></td>
                      <td className="td">{c.vehiculeMatricule ?? <span className="text-muted">Non affecté</span>}</td>
                      <td className="td"><RiskBadge niveau={c.score?.niveau} /></td>
                      <td className="td">{c.actif ? <span className="font-semibold text-risk-faible">Actif</span> : <span className="text-muted">Inactif</span>}</td>
                      <td className="td"><div className="flex justify-end gap-2">
                        <button type="button" className="btn-ghost" onClick={() => ouvrir(c)} aria-label={`Modifier ${nomComplet(c)}`}><Pencil className="h-4 w-4" aria-hidden="true" /></button>
                        <button type="button" className="btn-ghost text-risk-critique" onClick={() => setSuppr(c)} aria-label={`Supprimer ${nomComplet(c)}`}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                      </div></td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal open={!!edition} onClose={() => setEdition(null)} size="lg" title={edition?.id ? 'Modifier le conducteur' : 'Nouveau conducteur'}>
        {edition && (
          <form onSubmit={enregistrer} noValidate>
            <div className="grid gap-x-4 sm:grid-cols-2">
              <Field label="Prénom" required error={errs.prenom}><input className="field" value={edition.prenom} onChange={set('prenom')} autoComplete="off" /></Field>
              <Field label="Nom" required error={errs.nom}><input className="field" value={edition.nom} onChange={set('nom')} autoComplete="off" /></Field>
              <Field label="Adresse e-mail" required error={errs.email}><input className="field" type="email" value={edition.email} onChange={set('email')} autoComplete="off" /></Field>
              <Field label="Téléphone"><input className="field" type="tel" value={edition.telephone} onChange={set('telephone')} autoComplete="off" /></Field>
              <Field label="Code conducteur" hint="Laissez vide pour une génération automatique."><input className="field" value={edition.codeConducteur} onChange={set('codeConducteur')} autoComplete="off" /></Field>
              <Field label="Mot de passe" required={!edition.id} error={errs.motDePasse} hint={edition.id ? 'Laissez vide pour conserver le mot de passe.' : '8 caractères minimum.'}>
                <input className="field" type="password" autoComplete="new-password" value={edition.motDePasse} onChange={set('motDePasse')} />
              </Field>
            </div>
            <Field label="Véhicule affecté" hint="Seuls les véhicules libres sont proposés.">
              <select className="field" value={edition.vehiculeId} onChange={set('vehiculeId')}>
                <option value="">Aucun véhicule</option>
                {options.map((v) => <option key={v.id} value={v.id}>{v.matricule}{v.marque ? ` — ${v.marque} ${v.modele ?? ''}` : ''}{v.statut === 'MAINTENANCE' ? ' (en maintenance)' : ''}</option>)}
              </select>
            </Field>
            <label className="mb-6 flex min-h-[44px] items-center gap-3"><input type="checkbox" className="h-5 w-5 accent-[rgb(var(--accent))]" checked={edition.actif} onChange={set('actif')} />Compte actif</label>
            <div className="flex justify-end gap-3">
              <button type="button" className="btn-ghost" onClick={() => setEdition(null)}>Annuler</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          </form>
        )}
      </Modal>
      <ConfirmDialog open={!!suppr} danger busy={busy} title="Supprimer ce conducteur ?" confirmLabel="Supprimer"
        message={suppr ? `${nomComplet(suppr)} et son historique d’alertes seront supprimés définitivement. Cette action est irréversible.` : ''}
        onConfirm={supprimer} onCancel={() => setSuppr(null)} />
    </>
  )
}
