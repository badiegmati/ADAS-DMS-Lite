import { useEffect, useState } from 'react'
import { conducteur } from '../../api/endpoints'
import { errorMessage } from '../../api/axios'
import usePolling from '../../hooks/usePolling'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/layout/PageHeader'
import Field from '../../components/layout/Field'
import ErrorState from '../../components/feedback/ErrorState'
import Skeleton from '../../components/feedback/Skeleton'
import { nomComplet } from '../../lib/format'

export default function ProfilPage() {
  const toast = useToast()
  const { data, loading, error, retry } = usePolling(conducteur.profil)
  const [f, setF] = useState({ email: '', telephone: '', motDePasse: '' })
  const [errs, setErrs] = useState({})
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (data) setF({ email: data.email, telephone: data.telephone ?? '', motDePasse: '' }) }, [data])
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    const v = {}
    if (!/^\S+@\S+\.\S+$/.test(f.email)) v.email = 'Saisissez une adresse e-mail valide.'
    if (f.motDePasse && f.motDePasse.length < 8) v.motDePasse = 'Au moins 8 caractères (ou laissez vide).'
    setErrs(v)
    if (Object.keys(v).length) return
    setBusy(true)
    try {
      await conducteur.majProfil({ email: f.email.trim(), telephone: f.telephone.trim() || null, motDePasse: f.motDePasse || null })
      toast.success('Profil mis à jour.')
      setF((x) => ({ ...x, motDePasse: '' }))
    } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader title="Mon profil" subtitle="Vos informations personnelles" breadcrumbs={[{ label: 'Mon score', to: '/conducteur' }, { label: 'Profil' }]} />
      {loading ? <Skeleton className="h-80" /> : error ? <ErrorState message={error} onRetry={retry} /> : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="glass p-6" aria-labelledby="h-id">
            <h2 id="h-id" className="mb-4 text-lg font-semibold">Identité</h2>
            <dl className="space-y-3">
              <div><dt className="text-sm text-muted">Nom</dt><dd className="font-semibold">{nomComplet(data)}</dd></div>
              <div><dt className="text-sm text-muted">Code conducteur</dt><dd className="font-semibold">{data.codeConducteur}</dd></div>
              <div><dt className="text-sm text-muted">Véhicule</dt><dd className="font-semibold">{data.vehiculeMatricule ?? 'Non affecté'}</dd></div>
            </dl>
            <p className="mt-4 text-xs text-muted">Ces informations sont gérées par votre gestionnaire de flotte.</p>
          </section>
          <section className="glass p-6" aria-labelledby="h-mod">
            <h2 id="h-mod" className="mb-4 text-lg font-semibold">Modifier mes coordonnées</h2>
            <form onSubmit={submit} noValidate>
              <Field label="Adresse e-mail" required error={errs.email}><input className="field" type="email" autoComplete="email" value={f.email} onChange={set('email')} /></Field>
              <Field label="Téléphone"><input className="field" type="tel" autoComplete="tel" value={f.telephone} onChange={set('telephone')} /></Field>
              <Field label="Nouveau mot de passe" error={errs.motDePasse} hint="Laissez vide pour conserver le mot de passe actuel."><input className="field" type="password" autoComplete="new-password" value={f.motDePasse} onChange={set('motDePasse')} /></Field>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
            </form>
          </section>
        </div>
      )}
    </>
  )
}
