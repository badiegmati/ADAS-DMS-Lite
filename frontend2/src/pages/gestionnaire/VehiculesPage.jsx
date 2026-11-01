import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CircleCheck, CircleSlash, Car, Pencil, Plus, Trash2, Wrench } from 'lucide-react'
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
import { STATUTS_VEHICULE } from '../../design/tokens'
import { listContainer, listItem } from '../../design/motion'

const ICONS = { ACTIF: CircleCheck, INACTIF: CircleSlash, MAINTENANCE: Wrench }
const VIDE = { matricule: '', marque: '', modele: '', statut: 'ACTIF' }

function StatutBadge({ statut }) {
  const s = STATUTS_VEHICULE[statut] ?? STATUTS_VEHICULE.ACTIF
  const Icon = ICONS[statut] ?? CircleCheck
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold"
          style={{ color: s.color, borderColor: `${s.color}66`, backgroundColor: `${s.color}1F` }}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />{s.label}
    </span>
  )
}

export default function VehiculesPage() {
  const toast = useToast()
  const { data, loading, error, retry, refresh } = usePolling(gestionnaire.vehicules)
  const [filtre, setFiltre] = useState('')
  const [edition, setEdition] = useState(null)
  const [errs, setErrs] = useState({})
  const [suppr, setSuppr] = useState(null)
  const [busy, setBusy] = useState(false)

  const compte = useMemo(() => {
    const c = { ACTIF: 0, INACTIF: 0, MAINTENANCE: 0 }
    ;(data ?? []).forEach((v) => { c[v.statut] = (c[v.statut] ?? 0) + 1 })
    return c
  }, [data])
  const liste = (data ?? []).filter((v) => !filtre || v.statut === filtre)

  const ouvrir = (v) => { setErrs({}); setEdition(v ? { id: v.id, matricule: v.matricule, marque: v.marque ?? '', modele: v.modele ?? '', statut: v.statut } : { ...VIDE }) }
  const set = (k) => (e) => setEdition((f) => ({ ...f, [k]: e.target.value }))

  const enregistrer = async (e) => {
    e.preventDefault()
    if (!edition.matricule.trim()) { setErrs({ matricule: 'Indiquez la matricule.' }); return }
    setBusy(true)
    try {
      const body = { matricule: edition.matricule.trim(), marque: edition.marque.trim() || null, modele: edition.modele.trim() || null, statut: edition.statut }
      if (edition.id) await gestionnaire.modifierVehicule(edition.id, body); else await gestionnaire.creerVehicule(body)
      toast.success(edition.id ? 'Véhicule mis à jour.' : 'Véhicule ajouté.')
      setEdition(null); refresh()
    } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }

  /** Action rapide : bascule en maintenance / remise en service. */
  const basculer = async (v) => {
    const statut = v.statut === 'MAINTENANCE' ? 'ACTIF' : 'MAINTENANCE'
    try {
      await gestionnaire.modifierVehicule(v.id, { matricule: v.matricule, marque: v.marque, modele: v.modele, statut })
      toast.success(statut === 'MAINTENANCE' ? `${v.matricule} est en maintenance.` : `${v.matricule} est remis en service.`)
      refresh()
    } catch (err) { toast.error(errorMessage(err)) }
  }

  const supprimer = async () => {
    setBusy(true)
    try { await gestionnaire.supprimerVehicule(suppr.id); toast.success('Véhicule supprimé.'); setSuppr(null); refresh() }
    catch (err) { toast.error(errorMessage(err)); setSuppr(null) } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader title="Véhicules" subtitle="Suivi du parc, de l’affectation et de la maintenance"
        breadcrumbs={[{ label: 'Tableau de bord', to: '/gestionnaire' }, { label: 'Véhicules' }]}
        actions={<button type="button" className="btn-primary" onClick={() => ouvrir(null)}><Plus className="h-4 w-4" aria-hidden="true" />Nouveau véhicule</button>} />

      {loading ? <Skeleton className="h-64" /> : error ? <ErrorState message={error} onRetry={retry} /> : (
        <>
          <div role="group" aria-label="Filtrer par statut" className="mb-4 flex flex-wrap gap-2">
            <button type="button" aria-pressed={filtre === ''} onClick={() => setFiltre('')}
              className={`min-h-[44px] rounded-xl px-4 text-sm font-semibold ${filtre === '' ? 'bg-accent text-bg' : 'bg-white/5 text-muted hover:bg-white/10 hover:text-ink'}`}>
              Tous ({data.length})
            </button>
            {Object.entries(STATUTS_VEHICULE).map(([k, v]) => (
              <button key={k} type="button" aria-pressed={filtre === k} onClick={() => setFiltre(k)}
                className={`min-h-[44px] rounded-xl px-4 text-sm font-semibold ${filtre === k ? 'bg-accent text-bg' : 'bg-white/5 text-muted hover:bg-white/10 hover:text-ink'}`}>
                {v.label} ({compte[k] ?? 0})
              </button>
            ))}
          </div>

          <div className="glass">
            {!data.length ? (
              <EmptyState icon={Car} title="Aucun véhicule" text="Ajoutez vos véhicules pour pouvoir les affecter à vos conducteurs."
                action={<button type="button" className="btn-primary" onClick={() => ouvrir(null)}>Ajouter un véhicule</button>} />
            ) : !liste.length ? <EmptyState title="Aucun véhicule avec ce statut" text="Choisissez un autre filtre pour voir le reste du parc." /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <caption className="sr-only">Parc de véhicules</caption>
                  <thead><tr className="border-b border-line">
                    <th scope="col" className="th">Matricule</th><th scope="col" className="th">Véhicule</th>
                    <th scope="col" className="th">Statut</th><th scope="col" className="th">Conducteur affecté</th>
                    <th scope="col" className="th"><span className="sr-only">Actions</span></th>
                  </tr></thead>
                  <motion.tbody variants={listContainer} initial="hidden" animate="show">
                    {liste.map((v) => (
                      <motion.tr key={v.id} variants={listItem} className="border-b border-line/60 hover:bg-white/5">
                        <th scope="row" className="td text-left font-semibold">{v.matricule}</th>
                        <td className="td text-muted">{[v.marque, v.modele].filter(Boolean).join(' ') || '—'}</td>
                        <td className="td"><StatutBadge statut={v.statut} /></td>
                        <td className="td">{v.conducteurNom ?? <span className="text-muted">Libre</span>}</td>
                        <td className="td"><div className="flex flex-wrap justify-end gap-2">
                          {v.statut !== 'INACTIF' && (
                            <button type="button" className="btn-ghost !min-h-[40px]" onClick={() => basculer(v)}>
                              <Wrench className="h-4 w-4" aria-hidden="true" />{v.statut === 'MAINTENANCE' ? 'Remettre en service' : 'Mettre en maintenance'}
                              <span className="sr-only"> {v.matricule}</span>
                            </button>
                          )}
                          <button type="button" className="btn-ghost" onClick={() => ouvrir(v)} aria-label={`Modifier ${v.matricule}`}><Pencil className="h-4 w-4" aria-hidden="true" /></button>
                          <button type="button" className="btn-ghost text-risk-critique" onClick={() => setSuppr(v)} aria-label={`Supprimer ${v.matricule}`}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                        </div></td>
                      </motion.tr>
                    ))}
                  </motion.tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <Modal open={!!edition} onClose={() => setEdition(null)} title={edition?.id ? 'Modifier le véhicule' : 'Nouveau véhicule'}>
        {edition && (
          <form onSubmit={enregistrer} noValidate>
            <Field label="Matricule" required error={errs.matricule}><input className="field" value={edition.matricule} onChange={set('matricule')} placeholder="123 TUN 4567" /></Field>
            <Field label="Marque"><input className="field" value={edition.marque} onChange={set('marque')} /></Field>
            <Field label="Modèle"><input className="field" value={edition.modele} onChange={set('modele')} /></Field>
            <Field label="Statut"><select className="field" value={edition.statut} onChange={set('statut')}>
              {Object.entries(STATUTS_VEHICULE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select></Field>
            <div className="mt-2 flex justify-end gap-3">
              <button type="button" className="btn-ghost" onClick={() => setEdition(null)}>Annuler</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          </form>
        )}
      </Modal>
      <ConfirmDialog open={!!suppr} danger busy={busy} title="Supprimer ce véhicule ?" confirmLabel="Supprimer"
        message={suppr ? `Le véhicule ${suppr.matricule} sera supprimé définitivement.` : ''}
        onConfirm={supprimer} onCancel={() => setSuppr(null)} />
    </>
  )
}
