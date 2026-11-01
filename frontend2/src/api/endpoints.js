// Une fonction par route du backend. Aucune URL en dur ailleurs dans l'application.
import api from './axios'

const d = (p) => p.then((r) => r.data)

export const auth = {
  login: (role, identifiant, motDePasse) =>
    d(api.post(`/api/auth/${role.toLowerCase()}/login`, { identifiant, motDePasse })),
  logout: () => d(api.post('/api/auth/logout')),
  me: () => d(api.get('/api/auth/me')),
}

export const admin = {
  stats: () => d(api.get('/api/admin/stats')),
  gestionnaires: () => d(api.get('/api/admin/gestionnaires')),
  creerGestionnaire: (b) => d(api.post('/api/admin/gestionnaires', b)),
  modifierGestionnaire: (id, b) => d(api.put(`/api/admin/gestionnaires/${id}`, b)),
  supprimerGestionnaire: (id) => d(api.delete(`/api/admin/gestionnaires/${id}`)),
}

export const gestionnaire = {
  dashboard: () => d(api.get('/api/gestionnaire/dashboard')),
  conducteurs: () => d(api.get('/api/gestionnaire/conducteurs')),
  creerConducteur: (b) => d(api.post('/api/gestionnaire/conducteurs', b)),
  modifierConducteur: (id, b) => d(api.put(`/api/gestionnaire/conducteurs/${id}`, b)),
  supprimerConducteur: (id) => d(api.delete(`/api/gestionnaire/conducteurs/${id}`)),
  detail: (id, plage = '24h', page = 0) =>
    d(api.get(`/api/gestionnaire/conducteurs/${id}/detail`, { params: { plage, page } })),
  vehicules: () => d(api.get('/api/gestionnaire/vehicules')),
  creerVehicule: (b) => d(api.post('/api/gestionnaire/vehicules', b)),
  modifierVehicule: (id, b) => d(api.put(`/api/gestionnaire/vehicules/${id}`, b)),
  supprimerVehicule: (id) => d(api.delete(`/api/gestionnaire/vehicules/${id}`)),
}

export const conducteur = {
  dashboard: () => d(api.get('/api/conducteur/me/dashboard')),
  alertes: (categorie = '', page = 0) =>
    d(api.get('/api/conducteur/me/alertes', { params: { categorie: categorie || undefined, page } })),
  carte: () => d(api.get('/api/conducteur/me/carte')),
  historique: (plage = '24h') => d(api.get('/api/conducteur/me/score/historique', { params: { plage } })),
  profil: () => d(api.get('/api/conducteur/me/profil')),
  majProfil: (b) => d(api.put('/api/conducteur/me/profil', b)),
  conseils: () => d(api.get('/api/conducteur/me/conseils')),
  genererConseil: () => d(api.post('/api/conducteur/me/conseils/generer')),
  marquerConseilsLus: () => d(api.put('/api/conducteur/me/conseils/lus')),
}

export const messages = {
  lister: (conducteurId) => d(api.get(`/api/messages/${conducteurId}`)),
  envoyer: (conducteurId, contenu) => d(api.post('/api/messages', { conducteurId, contenu })),
  marquerLus: (conducteurId) => d(api.put(`/api/messages/${conducteurId}/lus`)),
}
