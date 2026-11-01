# API utilisée (route → composant)

Le frontend n'appelle que le backend Spring Boot (`src/api/endpoints.js`). Aucun appel direct à Supabase. Le backend n'a pas été modifié.

| Route | Utilisée par |
|---|---|
| `POST /api/auth/{role}/login` | `Login.jsx` via `AuthContext` |
| `GET /api/auth/me` | `AuthContext` (restauration de session) |
| `POST /api/auth/logout` | `AppLayout` (bouton « Se déconnecter ») |
| `GET /api/admin/stats` | `AdminDashboard.jsx` |
| `GET/POST/PUT/DELETE /api/admin/gestionnaires` | `GestionnairesPage.jsx` |
| `GET /api/gestionnaire/dashboard` | `FleetDashboard.jsx` (T1) |
| `GET /api/gestionnaire/conducteurs/{id}/detail` | `DriverDetail.jsx` (T2) |
| `GET/POST/PUT/DELETE /api/gestionnaire/conducteurs` | `ConducteursPage.jsx` (affectation via `vehiculeId`), `MessagesPage.jsx` (liste) |
| `GET/POST/PUT/DELETE /api/gestionnaire/vehicules` | `VehiculesPage.jsx` (statut ACTIF / INACTIF / MAINTENANCE) |
| `GET/POST /api/messages/{id}`, `PUT /api/messages/{id}/lus` | `MessagesPage.jsx` gestionnaire et conducteur (T3) |
| `GET /api/conducteur/me/dashboard` | `DriverDashboard.jsx` |
| `GET /api/conducteur/me/alertes` | `HistoriquePage.jsx` |
| `GET /api/conducteur/me/carte` | `CartePage.jsx` |
| `GET /api/conducteur/me/score/historique` | `HistoriquePage.jsx` |
| `GET/PUT /api/conducteur/me/profil` | `ProfilPage.jsx` |
| `GET/POST/PUT /api/conducteur/me/conseils…` | `ConseilsPage.jsx`, `DriverDashboard.jsx` |
