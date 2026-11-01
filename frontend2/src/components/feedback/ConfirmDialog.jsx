import Modal from './Modal'

/** Confirmation avant action destructrice (prévention des erreurs, contrôle et liberté). */
export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirmer', danger = false, busy = false, onConfirm, onCancel,
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel} role="alertdialog" initialFocus="[data-cancel]">
      <p className="mb-6 text-muted">{message}</p>
      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" data-cancel className="btn-ghost" onClick={onCancel}>Annuler</button>
        <button type="button" className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={busy}>
          {busy ? 'En cours…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
