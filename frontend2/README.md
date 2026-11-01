# ADAS-DMS Lite — Frontend

React 18 · Vite · Tailwind CSS · Framer Motion · Chart.js · Leaflet. Trois interfaces selon le rôle (administrateur, gestionnaire, conducteur). Le frontend parle uniquement au backend Spring Boot (cookies httpOnly).

## Démarrage
```bash
npm install
npm run dev     # http://localhost:5173 (le proxy relaie /api vers http://localhost:8080)
npm run build
```
Démarrer d'abord le backend (port 8080).

## Production (Vercel)
Définir `VITE_API_URL` avec l'URL publique du backend. `vercel.json` réécrit les routes vers l'application monopage. Côté backend : `CORS_ORIGINS` = domaine exact du frontend, cookie `SameSite=None; Secure` si les domaines diffèrent.

## Documentation IHM
Voir `docs/` : API utilisée, justifications IHM, limites, plan de test utilisateur.
