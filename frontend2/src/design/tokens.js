// Couleurs et libellés centralisés : aucun composant n'écrit de couleur en dur.
export const ROLES = {
  ADMIN:        { label: 'Administrateur',      accent: '#A855F7', accent2: '#EC4899', home: '/admin' },
  GESTIONNAIRE: { label: 'Gestionnaire de flotte', accent: '#06B6D4', accent2: '#A855F7', home: '/gestionnaire' },
  CONDUCTEUR:   { label: 'Conducteur',          accent: '#10B981', accent2: '#06B6D4', home: '/conducteur' },
}

export const NIVEAUX = {
  FAIBLE:   { label: 'Faible',   color: '#34D399', rank: 0 },
  MODERE:   { label: 'Modéré',   color: '#FBBF24', rank: 1 },
  ELEVE:    { label: 'Élevé',    color: '#FB923C', rank: 2 },
  CRITIQUE: { label: 'Critique', color: '#F87171', rank: 3 },
}

export const TYPES_ALERTE = {
  DISTRACTION:         'Regard détourné',
  FATIGUE_YAWN:        'Bâillement',
  FATIGUE_DROP:        'Tête qui tombe',
  FATIGUE_EYES_DROWSY: 'Somnolence',
  FATIGUE_EYES_CLOSED: 'Yeux fermés',
  PHONE:               'Téléphone au volant',
}

export const CATEGORIES = [
  { value: '',            label: 'Toutes les alertes' },
  { value: 'FATIGUE',     label: 'Fatigue' },
  { value: 'DISTRACTION', label: 'Distraction' },
  { value: 'PHONE',       label: 'Téléphone' },
]

export const STATUTS_VEHICULE = {
  ACTIF:       { label: 'Actif',       color: '#34D399' },
  INACTIF:     { label: 'Inactif',     color: '#A9B4C7' },
  MAINTENANCE: { label: 'Maintenance', color: '#FBBF24' },
}

export const PLAGES = [
  { value: '1h',  label: '1 h' },
  { value: '6h',  label: '6 h' },
  { value: '24h', label: '24 h' },
  { value: '7j',  label: '7 jours' },
]

export const niveauInfo = (n) => NIVEAUX[n] ?? NIVEAUX.FAIBLE
export const typeLabel = (t) => TYPES_ALERTE[t] ?? t
