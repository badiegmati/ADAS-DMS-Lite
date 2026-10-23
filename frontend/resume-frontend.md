# Résumé technique — Frontend ADAS-DMS Lite (React + Vite + Tailwind)

Ce document explique en détail l'architecture du frontend, le rôle de chaque fichier,
et comment les différentes couches communiquent entre elles. Il complète le `resume.md`
du backend Spring Boot (étapes 1-4).

---

## 1. Vue d'ensemble de l'architecture

Le frontend est une application **React 18 + Vite** qui ne parle **jamais** directement
à Supabase. Elle communique uniquement avec le backend Spring Boot via des appels REST
HTTP (axios), authentifiés par un **cookie JWT httpOnly** posé par le backend lors du login.
Navigateur (React) ──HTTP/JSON──> Spring Boot (port 8080) ──JDBC──> Supabase Postgres
│
└── cookie JWT httpOnly (posé par le backend, jamais lu en JS)

text


Trois interfaces distinctes partagent la même base de code, séparées par rôle :
- **ADMIN** (violet) : gestion des gestionnaires.
- **GESTIONNAIRE** (cyan) : gestion de sa flotte (conducteurs, véhicules, messages).
- **CONDUCTEUR** (vert émeraude) : consultation de son propre score, historique,
  carte, conseils IA, messagerie, profil.

Le routing, le layout (sidebar/topbar) et les composants visuels s'adaptent
dynamiquement à la couleur d'accent du rôle connecté.

---

## 2. Structure des dossiers
frontend/
├── package.json # dépendances : react, react-router-dom, axios, framer-motion,
│ # chart.js + react-chartjs-2, leaflet + react-leaflet,
│ # lucide-react, ogl (fond WebGL), tailwindcss
├── vite.config.js # proxy /api -> http://localhost:8080 en dev
├── tailwind.config.js # thème (couleurs néon, glassmorphism)
├── postcss.config.js
├── index.html # point d'entrée HTML, div#root
└── src/
├── main.jsx # bootstrap React (ReactDOM.createRoot)
├── App.jsx # déclaration de toutes les routes
├── index.css # Tailwind + styles globaux + keyframes custom
├── api/
│ └── axios.js # instance axios configurée (baseURL, withCredentials, intercepteurs)
├── context/
│ └── AuthContext.jsx # état d'authentification global (utilisateur courant, login/logout)
├── hooks/
│ └── usePolling.js # hook générique de rafraîchissement périodique
├── routes/
│ └── ProtectedRoute.jsx # garde d'accès par rôle
├── layouts/
│ └── AppLayout.jsx # sidebar + topbar + zone de contenu (Outlet)
├── components/ # composants réutilisables (détaillés section 6)
└── pages/
├── Login.jsx
├── admin/
├── gestionnaire/
└── conducteur/

text


---

## 3. Démarrage de l'application

### `main.jsx`
Point d'entrée minimal : monte `<App />` dans `#root`, enveloppé dans
`<BrowserRouter>` (routing) et `<AuthProvider>` (contexte d'authentification).
C'est le seul fichier qui appelle `ReactDOM.createRoot`.

### `App.jsx`
Déclare **toutes les routes** de l'application avec `react-router-dom` v6,
en utilisant un pattern de **routes imbriquées** :

```jsx
<Routes>
  <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />

  <Route element={<ProtectedRoute roles={["ADMIN"]}><AppLayout /></ProtectedRoute>}>
    <Route path="/admin/dashboard" element={<AdminDashboard />} />
    <Route path="/admin/gestionnaires" element={<GestionnairesPage />} />
  </Route>

  <Route element={<ProtectedRoute roles={["GESTIONNAIRE"]}><AppLayout /></ProtectedRoute>}>
    <Route path="/gestionnaire/dashboard" element={<FleetDashboard />} />
    <Route path="/gestionnaire/conducteurs" element={<ConducteursPage />} />
    <Route path="/gestionnaire/conducteurs/:id" element={<DriverDetail />} />
    <Route path="/gestionnaire/vehicules" element={<VehiculesPage />} />
    <Route path="/gestionnaire/messages" element={<MessagesPage />} />
  </Route>

  <Route element={<ProtectedRoute roles={["CONDUCTEUR"]}><AppLayout /></ProtectedRoute>}>
    <Route path="/conducteur/dashboard" element={<DriverDashboard />} />
    <Route path="/conducteur/historique" element={<HistoriquePage />} />
    <Route path="/conducteur/carte" element={<CartePage />} />
    <Route path="/conducteur/conseils" element={<ConseilsPage />} />
    <Route path="/conducteur/messages" element={<MessagesPage />} />
    <Route path="/conducteur/profil" element={<ProfilPage />} />
  </Route>

  <Route path="/" element={<RedirectHome />} />
</Routes>
<ToastContainer />
Points clés :

Chaque groupe de routes « protégées » partage un layout commun
(AppLayout) via l'<Outlet /> de react-router : la sidebar/topbar
ne se remonte pas à chaque navigation, seule la zone de contenu change.
ProtectedRoute encapsule AppLayout : si l'utilisateur n'a pas le
bon rôle (ou n'est pas connecté), il est redirigé avant même que
AppLayout ne soit monté.
PublicOnlyRoute empêche un utilisateur déjà connecté de revoir
l'écran de login (redirection automatique vers son dashboard).
RedirectHome gère la route racine / : redirige vers le bon
dashboard selon le rôle, ou vers /login si non connecté.
<ToastContainer /> est monté une seule fois ici, en dehors du
routing, pour que les notifications (succès/erreur/info) survivent
à la navigation entre pages.
index.css
Importe les directives Tailwind (@tailwind base/components/utilities),
définit les keyframes custom (glow néon, pulsation des marqueurs
critiques sur la carte, animation du fond SoftAurora), et quelques
classes utilitaires globales (scrollbar stylée, .glass pour l'effet
glassmorphism réutilisé partout).

4. Couche de communication avec le backend
api/axios.js
Instance axios unique partagée par toute l'application :

JavaScript

const api = axios.create({
  baseURL: "/api",        // proxifié vers http://localhost:8080/api en dev (vite.config.js)
  withCredentials: true,  // indispensable : envoie le cookie JWT httpOnly à chaque requête
});

// Intercepteur de réponse : redirige vers /login si 401 (token absent/expiré)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
Toutes les pages importent cette instance (import api from "../../api/axios")
plutôt que d'utiliser fetch ou une nouvelle instance axios — garantit que
le cookie est toujours envoyé et que la gestion du 401 est centralisée.

Le 403 (accès à une ressource d'un autre rôle/tenant) n'est pas
intercepté globalement : chaque page l'affiche via un toast.error au
niveau de son catch local, car la réaction attendue diffère selon le
contexte (ex. retour à la liste, message spécifique).

context/AuthContext.jsx
Fournit un contexte React avec :

user : objet { id, role, nom } (correspond exactement à AuthUserDto
renvoyé par GET /api/auth/me), ou null si non connecté.
loading : true pendant la vérification initiale de session (appel
à /auth/me au montage de l'application, pour savoir si le cookie
existant est encore valide).
login(role, identifiant, motDePasse) : appelle
POST /api/auth/{role}/login, met à jour user en cas de succès.
logout() : appelle POST /api/auth/logout, vide user, redirige
vers /login.
AppLayout, ProtectedRoute, Login et toutes les pages affichant le
nom de l'utilisateur consomment ce contexte via useAuth() (hook
exporté par le même fichier), évitant de passer user en props à
travers toute l'arborescence.

routes/ProtectedRoute.jsx
Composant de garde :

React

<ProtectedRoute roles={["GESTIONNAIRE"]}>
  <AppLayout />
</ProtectedRoute>
Si loading (vérification de session en cours) → affiche un
spinner/skeleton plutôt que de rediriger trop tôt (évite un flash
de redirection vers /login au rechargement de page).
Si user === null → redirige vers /login.
Si user.role n'est pas dans roles → redirige vers le dashboard
correspondant à son vrai rôle (isolation stricte, reproduisant côté
UI le 403 appliqué côté backend).
Sinon → rend les children (ici AppLayout, qui contient lui-même
l'<Outlet /> vers la page réelle).
hooks/usePolling.js
Hook générique utilisé par les pages qui ont besoin de données
quasi-temps-réel (dashboards notamment) :

JavaScript

usePolling(callback, intervalleMs);
Exécute callback immédiatement puis toutes les intervalleMs
millisecondes, et nettoie l'intervalle au démontage du composant.
Utilisé avec un intervalle de l'ordre de 15-30 secondes sur les
dashboards (pas plus agressif, pour rester cohérent avec le cache de
5 secondes de calculer_score() côté backend et ne pas marteler l'API).

5. Layout applicatif
layouts/AppLayout.jsx
Structure commune aux trois rôles :

text

┌─────────────┬──────────────────────────────┐
│             │  Topbar (nom utilisateur,     │
│   Sidebar   │  bouton déconnexion, badge    │
│  (navigation│  rôle coloré)                 │
│   par rôle) ├──────────────────────────────┤
│             │                               │
│             │   <Outlet />  (page active)   │
│             │                               │
└─────────────┴──────────────────────────────┘
La sidebar construit dynamiquement ses liens selon user.role
(trois tableaux de liens différents : admin/gestionnaire/conducteur),
avec icônes lucide-react et surbrillance du lien actif
(useLocation + comparaison de pathname).
La couleur d'accent (violet/cyan/émeraude) est dérivée du rôle et
appliquée via des classes Tailwind conditionnelles sur la sidebar,
les liens actifs, et transmise en prop aux composants qui en ont
besoin (ex. SoftAurora).
<Outlet /> est l'élément essentiel qui rend la page de la route
enfant active (cf. bug corrigé en section Historique des corrections).
Le fond SoftAurora (WebGL via ogl) est monté en arrière-plan fixe,
teinté selon le rôle.
6. Composants réutilisables (src/components/)
Fichier	Rôle
SoftAurora.jsx	Fond animé WebGL (bibliothèque ogl), dégradé de type aurore boréale, couleur paramétrable par prop accent. Purement décoratif, aucune logique métier.
ScoreGauge.jsx	Jauge SVG semi-circulaire animée (Framer Motion) affichant le score de risque (0-100) avec dégradé de couleur selon le niveau (vert→jaune→orange→rouge). Utilisée sur les dashboards conducteur et le détail conducteur côté gestionnaire.
RiskBadge.jsx	Petit badge coloré (FAIBLE/MODERE/ELEVE/CRITIQUE) réutilisé dans tous les tableaux et listes d'alertes.
KpiCard.jsx	Carte KPI avec compteur animé (AnimatedNumber, basé sur useMotionValue/animate de Framer Motion). Robuste aux valeurs non numériques (undefined/NaN → traité comme 0, correctif appliqué suite à un crash observé en test).
ScoreLineChart.jsx	Courbe d'évolution du score dans le temps (Chart.js via react-chartjs-2), consomme un tableau de ScorePointDto.
RiskDoughnut.jsx	Graphique en anneau de répartition des conducteurs par niveau de risque (Chart.js), consomme la Map<String,Long> repartition du dashboard gestionnaire.
AlertTable.jsx	Tableau paginé côté client des alertes (AlerteDto), avec tri par date, badge de risque, pagination simple (toutes les données étant déjà chargées pour la page courante côté serveur).
AlertMap.jsx	Carte Leaflet (fond sombre CartoDB dark_all) affichant les alertes géolocalisées sous forme de marqueurs colorés par niveau de risque, avec halo pulsant CSS pour les alertes critiques, popup détaillé, auto-ajustement de la vue (fitBounds/flyTo). Exporte aussi la fonction utilitaire severiteVersNiveau(alerte) qui déduit un niveau lisible (CRITIQUE/ELEVE/MODERE/FAIBLE) à partir des champs réels critique (bool) et severite (int) d'AlerteDto — ce DTO n'a pas de champ niveau natif.
CriticalBanner.jsx	Bandeau d'alerte plein écran/en-tête, affiché quand une situation critique est détectée (ex. score ≥ 75 suite à la règle PHONE/FATIGUE), animation d'entrée marquée.
AiAdviceCard.jsx	Carte présentant un conseil IA généré par Gemini (ConseilDto), avec indicateur « lu/non lu », type de conseil, score au moment de la génération.
ChatPanel.jsx	Zone de messagerie type chat (liste de bulles alignées gauche/droite selon l'expéditeur, champ de saisie, envoi). Reçoit expediteurId (en réalité la chaîne de rôle "GESTIONNAIRE"/"CONDUCTEUR", faute d'identifiant utilisateur sur MessageDto) et currentUserId (rôle codé en dur selon la page qui l'utilise) pour déterminer l'alignement des bulles.
ConfirmDialog.jsx	Modale de confirmation générique (suppression de gestionnaire/conducteur/véhicule), avec overlay animé.
Toast.jsx	Système de notifications : exporte toast.success/error/info(message) (fonctions impératives utilisables depuis n'importe quel fichier, y compris api/axios.js) ainsi qu'un composant <ToastContainer /> à monter une seule fois dans App.jsx.
Skeleton.jsx	Blocs de chargement animés (effet shimmer), utilisés systématiquement pendant les appels API avant affichage du contenu réel.
EmptyState.jsx	État vide générique (icône + titre + description), affiché quand une liste/collection est vide (aucun conducteur, aucune alerte géolocalisée, etc.).
Principe commun à tous les composants : ils ne font aucun appel
réseau eux-mêmes — ils reçoivent leurs données en props depuis les
pages, qui sont seules responsables des appels à api/axios.js. Cette
séparation stricte rend les composants testables indépendamment et
réutilisables entre les trois rôles.

7. Pages — logique métier par rôle
Chaque page suit le même schéma :

useState pour les données, l'état de chargement, les filtres/pagination.
useEffect (ou usePolling pour les dashboards) qui appelle l'endpoint
réel via api.get/post/put/delete.
Affichage d'un Skeleton pendant le chargement, d'un EmptyState si
la collection est vide, sinon le contenu réel animé (Framer Motion,
initial/animate/transition systématiques sur les conteneurs).
Gestion des erreurs via toast.error dans les blocs catch.
7.1 Login (pages/Login.jsx)
Formulaire unique avec sélecteur de rôle animé (3 boutons ADMIN/GESTIONNAIRE/
CONDUCTEUR, chacun teinté de sa couleur d'accent), champs identifiant/
motDePasse, appelle login() du AuthContext qui route vers
/api/auth/{role}/login. En cas de succès, redirection automatique vers
le dashboard du rôle (gérée par RedirectHome/navigation programmatique).
Fond SoftAurora dont la couleur change dynamiquement selon le rôle
survolé/sélectionné.

7.2 Pages Admin
admin/AdminDashboard.jsx

Appelle GET /api/admin/stats → AdminStatsDto(gestionnaires, conducteurs, vehicules, alertes24h).
Affiche 4 KpiCard.
Appelle aussi GET /api/admin/gestionnaires pour un aperçu en tableau
(les 5 derniers gestionnaires créés, triés par createdAt).
Décision : pas de graphique de répartition ni de liste d'alertes
globale, ces données n'étant pas exposées par l'API admin.
admin/GestionnairesPage.jsx

CRUD complet sur GET/POST/PUT/DELETE /api/admin/gestionnaires[/{id}].
Formulaire GestionnaireRequest(entreprise, email, motDePasse, actif) —
pas de champ nom, contrairement à une première version erronée.
ConfirmDialog avant suppression.
Table avec nbConducteurs/nbVehicules affichés tels que renvoyés par
GestionnaireDto (calculés côté backend).
7.3 Pages Gestionnaire
gestionnaire/FleetDashboard.jsx

Appelle GET /api/gestionnaire/dashboard →
GestionnaireDashboardDto(kpi, repartition, topRisque, conducteurs).
4 KpiCard (conducteursActifs, vehicules, scoreMoyen, conducteursCritiques).
RiskDoughnut alimenté par repartition (Map niveau→nombre).
Liste « top risque » (les conducteurs les plus à risque), avec lien
vers DriverDetail.
Décision : pas de courbe globale ni de tableau d'alertes flotte
entière, non fournis par cet endpoint unique.
gestionnaire/ConducteursPage.jsx

CRUD sur GET/POST/PUT/DELETE /api/gestionnaire/conducteurs[/{id}].
Formulaire ConducteurRequest(codeConducteur, nom, prenom, email, telephone, motDePasse, vehiculeId, actif) — le champ vehiculeId
est un <select> alimenté par GET /api/gestionnaire/vehicules
(c'est ici, et non dans VehiculeRequest, que se fait l'assignation
conducteur↔véhicule).
Clic sur une ligne → navigation vers /gestionnaire/conducteurs/:id.
gestionnaire/DriverDetail.jsx

Appelle un seul endpoint : GET /api/gestionnaire/conducteurs/{id}/ detail?plage=24h&page=0, qui renvoie en une fois
DriverDetailDto(conducteur, alertes:PageDto<AlerteDto>, historique: List<ScorePointDto>, carte:List<AlerteDto>, conseils:List<ConseilDto>).
Affiche : fiche conducteur (ScoreGauge), ScoreLineChart (historique),
AlertTable (alertes paginées), AlertMap (carte), liste de
AiAdviceCard (conseils).
Décision : simplifié pour utiliser cet appel unique plutôt que de
reproduire 3-4 appels séparés comme deviné initialement.
gestionnaire/VehiculesPage.jsx

CRUD sur GET/POST/PUT/DELETE /api/gestionnaire/vehicules[/{id}].
Formulaire VehiculeRequest(matricule, marque, modele, statut) —
pas de champ d'assignation conducteur ici (voir ConducteursPage).
statut contraint à ACTIF|INACTIF|MAINTENANCE via <select>.
Colonne conducteurNom affichée en lecture seule (calculée côté
backend dans VehiculeDto).
gestionnaire/MessagesPage.jsx

Sélection d'un conducteur (liste déroulante alimentée par
GET /api/gestionnaire/conducteurs), puis GET /api/messages/ {conducteurId} pour charger la conversation.
Envoi via POST /api/messages avec MessageRequest(conducteurId, contenu).
Marquage lu via PUT /api/messages/{conducteurId}/lus.
ChatPanel reçoit currentUserId="GESTIONNAIRE" codé en dur.
7.4 Pages Conducteur
conducteur/DriverDashboard.jsx

Appelle GET /api/conducteur/me/dashboard →
DriverDashboardDto(profil, score, alertes24h, critiques24h, conseilsNonLus, messagesNonLus, dernieresAlertes, conseilEnAvant).
ScoreGauge (score), 4 KpiCard, CriticalBanner affiché si
score.niveau === "CRITIQUE" ou critiques24h > 0, AiAdviceCard
pour conseilEnAvant, AlertTable compacte pour dernieresAlertes.
Polling via usePolling pour garder le score à jour sans rechargement
manuel (cohérent avec le cache 5s de calculer_score() côté backend).
conducteur/HistoriquePage.jsx

GET /api/conducteur/me/score/historique?plage=24h (sélecteur de
plage : 24h/7j/30j) → ScoreLineChart.
GET /api/conducteur/me/alertes?categorie=&page= → AlertTable
paginée avec filtre par type d'événement.
conducteur/CartePage.jsx

GET /api/conducteur/me/carte (pas de paramètre de plage, endpoint
renvoie l'ensemble des alertes géolocalisées disponibles).
KPI (alertes géolocalisées, critiques, type le plus fréquent, dernière
alerte), filtres par niveau de risque, AlertMap pleine largeur avec
liste latérale synchronisée (clic sur un item → flyTo sur la carte).
conducteur/ConseilsPage.jsx

GET /api/conducteur/me/conseils → liste de AiAdviceCard.
Bouton « Générer un conseil » → POST /api/conducteur/me/conseils/ generer ; si réponse 429 (limite 1x/6h), affiche
toast.info("Vous avez déjà généré un conseil récemment, réessayez plus tard.")
plutôt qu'une erreur.
Bouton « Tout marquer comme lu » → PUT /api/conducteur/me/conseils/lus
(pas de marquage individuel possible, endpoint global uniquement).
conducteur/MessagesPage.jsx

GET /api/messages/{monPropreId} et POST /api/messages avec
MessageRequest(contenu) (le conducteurId est auto-déduit côté
backend pour un conducteur authentifié).
ChatPanel avec currentUserId="CONDUCTEUR" codé en dur.
conducteur/ProfilPage.jsx

GET /api/conducteur/me/profil → pré-remplit le formulaire.
PUT /api/conducteur/me/profil avec ProfilRequest(email, telephone, motDePasse) — champ mot de passe optionnel (laissé vide = inchangé),
pas de champ ancienMotDePasse contrairement à une première
version erronée.
8. Thème visuel et animations
Glassmorphism : fond semi-transparent + backdrop-blur-xl +
bordure border-white/10, appliqué systématiquement aux cartes,
panneaux, modales.
Couleur d'accent par rôle : violet (admin), cyan (gestionnaire),
émeraude (conducteur) — propagée à la sidebar, aux boutons primaires,
au fond SoftAurora, aux graphiques.
Framer Motion : utilisé pour
les transitions d'entrée de page (initial={{opacity:0,y:12}}),
les compteurs animés (KpiCard),
les listes avec AnimatePresence (apparition/disparition d'éléments
filtrés, ex. liste d'alertes sur CartePage),
les modales/toasts (scale + fade).
SoftAurora (ogl, WebGL léger) : fond animé en arrière-plan de
AppLayout et Login, teinte dynamique selon le rôle.
Chart.js (ScoreLineChart, RiskDoughnut) : thème sombre custom
(grilles discrètes, dégradés de couleur sous la courbe).
Leaflet (AlertMap) : fond de carte sombre CartoDB dark_all,
marqueurs divIcon colorés avec halo CSS pulsant pour les alertes
critiques (@keyframes adas-pulse dans index.css).
9. Décisions d'adaptation prises face aux DTO réels
Le cahier des charges initial avait conduit à deviner certains endpoints
et noms de champs avant d'avoir accès au code réel des contrôleurs. Une
fois les vrais DTO/contrôleurs fournis, plusieurs ajustements ont été
nécessaires et sont documentés ici pour traçabilité :

AlerteDto n'a pas de champ niveau : une fonction utilitaire
severiteVersNiveau(alerte) (dans AlertMap.jsx) déduit un niveau
lisible à partir de critique (bool) et severite (int) :
critique=true → CRITIQUE, severite≥3 → ELEVE, severite===2 → MODERE, sinon FAIBLE. Seuils arbitraires, ajustables si besoin.
DriverDetail.jsx utilise un seul appel /detail au lieu de
plusieurs appels séparés.
FleetDashboard.jsx et AdminDashboard.jsx n'ont pas de graphique
global ni de tableau d'alertes flotte entière (non exposés par
l'API), remplacés par des KPI et des listes/aperçus pertinents.
GestionnairesPage.jsx et VehiculesPage.jsx n'ont pas certains
champs devinés initialement (nom gestionnaire, assignation
conducteur sur véhicule) — corrigés selon les vrais *Request.
ChatPanel utilise le rôle en chaîne ("GESTIONNAIRE"/"CONDUCTEUR")
comme identifiant d'expéditeur, faute d'ID numérique sur MessageDto.
ConseilsPage.jsx ne propose qu'un marquage global « tout lu »,
l'API ne permettant pas de marquage individuel.
ProfilPage.jsx conducteur n'a pas de champ « ancien mot de passe ».
CartePage.jsx conducteur n'a pas de sélecteur de plage temporelle
(/conducteur/me/carte ne prend pas de paramètre de plage).
Pagination simplifiée : toujours page=0 côté requête serveur,
pagination visuelle gérée côté client par AlertTable sur le lot
reçu.
10. Identifiants de test (vérifiés et fixés en base)
Rôle	Identifiant	Mot de passe
ADMIN	admin	Admin@12345
GESTIONNAIRE (Alpha Transport)	gestionnaire@test.tn	Test1234!
CONDUCTEUR (C10 — Karim Ben Ali)	C10	Test1234!
(Ces mots de passe ont été re-fixés explicitement via l'API admin
pendant les tests, après divergence constatée entre la documentation
initiale et le contenu réel de la base — voir historique de
développement pour le détail.)

11. Lancement et vérification
PowerShell

# Terminal 1 — backend (attendre impérativement "Tomcat started on port 8080")
cd backend
mvn spring-boot:run

# Terminal 2 — frontend
cd frontend
npm run dev
Puis ouvrir http://localhost:5173 et tester successivement les trois
rôles avec les identifiants ci-dessus. Le proxy Vite (vite.config.js)
redirige automatiquement toute requête /api/* vers
http://localhost:8080/api/*, le frontend n'a donc jamais besoin de
connaître l'URL absolue du backend en développement.

text


Je l'ai gardé auto-suffisant (il peut être lu indépendamment du `resume.md` backend). Veux-tu que je le fusionne avec celui du backend en un seul `resume.md` global couvrant tout le projet, ou préfères-tu garder deux fichiers séparés (`resume-backend.md` / `resume-frontend.md`) ?




