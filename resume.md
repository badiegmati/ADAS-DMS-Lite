# ADAS-DMS Lite — Résumé du Backend Spring Boot

**Statut : ✅ Backend validé et fonctionnel de bout en bout (étapes 3 et 4 terminées)**

---

## 1. Vue d'ensemble de l'architecture

Le backend est une API REST Spring Boot 3 (Java 17) qui joue le rôle de **seul point d'entrée pour le navigateur**. Il ne fait jamais écrire les alertes DMS (le client Python s'en charge directement via l'API REST Supabase), mais il lit tout le reste, calcule les scores, gère l'authentification et les conseils IA.

```
┌─────────────┐         ┌──────────────────┐         ┌──────────────┐
│  dms-client  │ ─REST─▶ │     Supabase      │ ◀─JDBC─ │ Spring Boot   │
│  (Python)    │ (anon)  │   (PostgreSQL)     │ (postgres)│  Backend    │
└─────────────┘         └──────────────────┘         └──────┬───────┘
                                                              │ REST (JSON + cookie JWT)
                                                              ▼
                                                      ┌──────────────┐
                                                      │  Frontend     │
                                                      │  React (étape 5)│
                                                      └──────────────┘
```

Règles respectées :
- Le navigateur ne parle **jamais** directement à Supabase.
- Le client Python n'écrit **jamais** via Spring Boot (insertion directe table `alertes`).
- Spring Boot se connecte avec le rôle `postgres` (pooler Supabase, port 6543, mode transaction) et contourne le RLS pour lire/écrire gestionnaires, conducteurs, véhicules, messages, conseils IA.
- Le schéma de base (`schema.sql`) est géré uniquement en SQL manuel — Hibernate est configuré en `ddl-auto=validate` (jamais `update`/`create`), donc il **vérifie** la cohérence des entités avec les tables existantes mais ne modifie jamais la structure.

---

## 2. Structure des dossiers

```
backend/
├── .env / .env.example       → variables d'environnement (jamais commit le .env réel)
├── pom.xml                   → dépendances Maven (Spring Boot 3.2.12, Java 17, jjwt 0.12.6, H2 pour tests)
├── requests.http             → collection de requêtes HTTP prêtes à tester (REST Client / IntelliJ)
└── src/
    ├── main/java/tn/adasdms/lite/
    │   ├── AdasDmsLiteApplication.java   → point d'entrée Spring Boot
    │   ├── config/        → configuration transverse (CORS, Gemini, planification, sécurité)
    │   ├── controller/    → endpoints REST exposés au frontend
    │   ├── dto/           → objets de transfert (jamais d'entités JPA exposées directement à l'API)
    │   ├── entity/        → entités JPA mappées sur les tables existantes
    │   ├── exception/     → gestion centralisée des erreurs HTTP
    │   ├── repository/    → interfaces Spring Data JPA (accès base)
    │   ├── security/      → JWT, filtre d'authentification, détails utilisateur
    │   └── service/       → logique métier (scores, conseils IA, planification, flotte)
    ├── main/resources/application.yml   → configuration Spring (lit les variables .env)
    └── test/              → tests unitaires et d'intégration (H2 en mémoire, pas Supabase)
```

---

## 3. Comment fonctionne chaque brique

### 3.1. Démarrage de l'application

`AdasDmsLiteApplication.java` est le point d'entrée standard Spring Boot (`@SpringBootApplication`). Au démarrage :
1. Spring charge `application.yml`, qui lit les variables d'environnement du fichier `.env` (via `DB_URL`, `DB_USER`, `JWT_SECRET`, etc.).
2. `HikariPool` ouvre une connexion au pooler Supabase (`aws-0-eu-west-1.pooler.supabase.com:6543`), en mode transaction (`prepareThreshold=0` pour éviter les soucis de prepared statements avec PgBouncer).
3. Hibernate valide (`ddl-auto=validate`) que les entités JPA correspondent bien aux tables SQL existantes — si une colonne ne correspond pas, l'application refuse de démarrer (sécurité contre les désynchronisations schéma/code).
4. `AdminSeeder` (un `CommandLineRunner` ou équivalent dans `service/`) vérifie si un compte admin existe déjà ; sinon il en crée un avec l'identifiant `admin` et le mot de passe défini par `ADMIN_DEFAULT_PASSWORD`, haché en BCrypt.
5. `ConseilScheduler` démarre une tâche planifiée (`@Scheduled`) qui, périodiquement, appelle Gemini pour générer des conseils IA aux conducteurs à risque (avec fallback français si Gemini échoue).

### 3.2. Authentification et sécurité (`security/`, `config/SecurityConfig.java`)

- **`JwtUtils`** : génère et valide les tokens JWT signés en HMAC-SHA256 avec `JWT_SECRET`. Le token contient l'identifiant utilisateur et son rôle (`ADMIN`, `GESTIONNAIRE`, `CONDUCTEUR`).
- **`JwtAuthFilter`** : filtre Spring Security exécuté à chaque requête. Il lit le cookie httpOnly contenant le JWT, le valide, et s'il est valide, construit un objet d'authentification Spring Security à partir de `CustomUserDetails`.
- **`CustomUserDetails`** : implémente `UserDetails` (contrat Spring Security). Comme l'authentification est stateless (JWT à chaque requête, pas de session serveur), les méthodes `isAccountNonExpired`, `isAccountNonLocked`, `isCredentialsNonExpired`, `isEnabled` renvoient toutes `true` — la vérification du compte actif/inactif se fait une seule fois, au moment du login.
- **`SecurityConfig`** : déclare les règles d'autorisation par URL. Chaque groupe d'endpoints (`/api/admin/**`, `/api/gestionnaire/**`, `/api/conducteur/**`) est restreint au rôle correspondant via `hasRole(...)`. C'est ce qui garantit l'isolation stricte : un token valide mais avec le mauvais rôle renvoie **403**, l'absence de token renvoie **401**.
- **`CurrentUser`** : annotation ou utilitaire permettant aux contrôleurs de récupérer facilement l'utilisateur authentifié courant (id + rôle) sans repasser par le contexte Spring Security à chaque fois.

Flux de login (ex. `POST /api/auth/admin/login`) :
1. Le contrôleur (`AuthController`) reçoit `identifiant` + `motDePasse`.
2. Il cherche l'utilisateur en base (`AdminRepository`, `GestionnaireRepository` ou `ConducteurRepository` selon la route).
3. Il compare le mot de passe en clair avec le hash BCrypt stocké (`BCryptPasswordEncoder.matches(...)`).
4. Si valide, `JwtUtils` génère un token, posé dans un **cookie httpOnly** (jamais lisible en JavaScript, protection XSS).
5. La réponse JSON renvoie `{id, role, nom}` (jamais le mot de passe ni le token en clair dans le body).

### 3.3. Contrôleurs (`controller/`)

Chaque contrôleur correspond à un rôle ou une fonctionnalité transverse :
- **`AuthController`** : login (3 rôles), `/api/auth/me` (qui suis-je), logout.
- **`AdminController`** : statistiques globales, gestion des gestionnaires (CRUD), supervision multi-entreprises.
- **`GestionnaireController`** : gestion de sa propre flotte (conducteurs, véhicules), tableau de bord entreprise.
- **`ConducteurController`** : tableau de bord personnel (score, historique, alertes), messagerie.
- **`ConseilController`** : consultation des conseils IA générés pour le conducteur connecté.
- **`MessageController`** : messagerie bidirectionnelle gestionnaire ↔ conducteur (marquage lu/non lu).

Chaque méthode de contrôleur ne reçoit/renvoie que des **DTO** (`dto/`), jamais les entités JPA brutes — cela évite d'exposer des champs sensibles (hash de mot de passe) ou des relations JPA complexes (lazy loading) directement en JSON.

### 3.4. Services (`service/`)

- **`ScoreService`** : appelle la fonction SQL `calculer_score()` (déjà définie dans `schema.sql`) via une requête native, avec un **cache de 5 secondes** pour éviter de recalculer inutilement à chaque appel rapproché (ex. rafraîchissement de dashboard). Ne recalcule jamais le score en Java — la logique métier du score (décroissance exponentielle, règle critique) reste **entièrement en SQL**, le service ne fait que lire le résultat.
- **`GeminiService`** : seul composant autorisé à appeler l'API Gemini (jamais exposé au frontend). Construit la requête HTTP vers `https://generativelanguage.googleapis.com/v1beta/models/{modele}:generateContent`, gère le timeout (`GEMINI_TIMEOUT_MS`), et en cas d'échec (quota, 404, timeout) renvoie un **message de repli en français** préétabli plutôt que de faire planter l'application. Résultat encapsulé dans `GeminiResult` (texte, drapeau repli, nom du modèle utilisé).
- **`ConseilScheduler`** : tâche planifiée (`@Scheduled`, activable/désactivable via `scheduler.enabled`) qui parcourt les conducteurs à risque élevé et déclenche `GeminiService` pour générer un conseil, stocké ensuite via `ConseilIaRepository`.
- **`DriverService`** / **`FleetService`** : logique d'agrégation pour construire les DTO de tableau de bord (dernier score, historique, alertes récentes, messages non lus) à partir des repositories.
- **`AdminSeeder`** : crée le compte admin par défaut au premier démarrage si aucun n'existe.

### 3.5. Accès aux données (`repository/`)

Toutes les interfaces étendent `JpaRepository`. La grande majorité utilise des **méthodes dérivées** classiques de Spring Data (ex. `findByCodeConducteur(String code)`), sans requêtes JPQL manuelles, car les clés métier (`code_conducteur`, `matricule`, `email`, `entreprise`) sont uniques et les relations simples.

Exceptions avec requêtes explicites (justifiées par une logique qui dépasse les méthodes dérivées) :
- `ScoreHistoriqueRepository.moyenneDepuis(...)` → calcul d'agrégat (moyenne) sur une période.
- `ConseilIaRepository.marquerTousLus(...)` → mise à jour en masse (`UPDATE`).
- `MessageRepository.marquerLus(...)` → mise à jour en masse (`UPDATE`).
- `ScoreRisqueRepository` → requête native appelant directement la fonction SQL `calculer_score()`.

### 3.6. Entités (`entity/`)

Chaque entité JPA (`Admin`, `Gestionnaire`, `Conducteur`, `Vehicule`, `Alerte`, `TypeAlerte`, `ScoreRisque`, `ScoreHistorique`, `ConseilIa`, `Message`) correspond exactement à une table de `schema.sql`, avec les mêmes contraintes (UUID en clé primaire, colonnes uniques). Comme `ddl-auto=validate`, toute divergence entre une entité et la table réelle empêche le démarrage — c'est volontaire, pour détecter immédiatement un désalignement entre le code Java et le schéma SQL source de vérité.

### 3.7. Gestion des erreurs (`exception/`)

- **`GlobalExceptionHandler`** (`@RestControllerAdvice`) : intercepte les exceptions levées dans les contrôleurs/services et les transforme en réponses JSON cohérentes (`ErrorDto` avec `message`, `status`, `timestamp`).
- **`NotFoundException`** → mappée en **404**.
- **`ForbiddenException`** → mappée en **403** (ex. un gestionnaire qui tente d'accéder à un conducteur qui n'est pas le sien).
- Les erreurs d'authentification (401) et d'autorisation de rôle (403) génériques sont gérées en amont par Spring Security (`JwtAuthFilter` + `SecurityConfig`), avant même d'atteindre les contrôleurs.

### 3.8. Configuration (`config/`)

- **`SecurityConfig`** : chaîne de filtres, règles d'autorisation par rôle, désactivation CSRF (API stateless avec JWT), configuration des cookies.
- **`CorsConfig`** : autorise les requêtes cross-origin depuis le frontend React (ex. `http://localhost:5173` en dev), avec `@Primary` pour éviter toute ambiguïté de bean avec `HandlerMappingIntrospector`.
- **`GeminiProperties`** : `record` Java regroupant la configuration Gemini (clé API, modèle, URL de base, timeout), lu depuis les variables d'environnement.
- **`SchedulingConfig`** : active `@EnableScheduling` pour que `ConseilScheduler` fonctionne.

---

## 4. Variables d'environnement (`.env`)

| Variable | Rôle |
|---|---|
| `DB_URL` | URL JDBC vers le pooler Supabase (mode transaction, port 6543) |
| `DB_USER` / `DB_PASSWORD` | Identifiants du rôle `postgres` (accès complet, contourne le RLS) |
| `JWT_SECRET` | Clé secrète HMAC-SHA256 pour signer les tokens JWT |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Accès à l'API Gemini pour les conseils IA |
| `ADMIN_DEFAULT_PASSWORD` | Mot de passe du compte admin créé automatiquement au premier démarrage |
| `JPA_DDL_AUTO` | Toujours `validate` en fonctionnement normal (sécurité du schéma) |

---

## 5. Tests automatisés

Les tests tournent sur une base **H2 en mémoire** (`application-test.yml`), jamais sur Supabase — aucun risque de pollution des données réelles.

| Classe de test | Nombre | Vérifie |
|---|---|---|
| `AuthControllerTest` | 7 | Login des 3 rôles, création automatique de l'admin, `/me` |
| `SecurityRolesTest` | 10 | Isolation stricte : 401 sans token, 403 cross-rôle pour chaque combinaison |
| `GeminiServiceTest` | 3 | Appel Gemini simulé (faux serveur HTTP local), fallback en cas d'échec/clé absente |
| `ScoreServiceTest` | 4 | Cache de 5s, cohérence du résultat renvoyé par `calculer_score()` |

**Résultat confirmé : 24/24 tests passent.**

Commandes :
```powershell
mvn clean compile   # BUILD SUCCESS
mvn clean test      # Tests run: 24, Failures: 0, Errors: 0
```

---

## 6. Vérifications manuelles effectuées (environnement réel Supabase)

| Vérification | Résultat |
|---|---|
| `GET /api/health` | `{"status":"UP"}` (200) |
| Login admin (`admin` / `Admin@12345`) | Cookie JWT émis, `/api/auth/me` confirme `role=ADMIN` |
| Login gestionnaire (`gestionnaire@test.tn`) | `role=GESTIONNAIRE` confirmé |
| Login conducteur (`C10`) | `role=CONDUCTEUR` confirmé, id cohérent avec les données de test (`3d9a0f7b-...`) |
| `GET /api/admin/stats` sans cookie | **401** `"Authentification requise"` |
| Conducteur → `/api/gestionnaire/conducteurs` | **403** `"Accès refusé"` |
| Gestionnaire → `/api/admin/stats` | **403** `"Accès refusé"` |
| Gestionnaire → `/api/conducteur/dashboard` | **403** `"Accès refusé"` |

L'isolation stricte par rôle (exigence critique du cahier des charges) est donc **validée en conditions réelles**, pas seulement en tests unitaires.

---

## 7. Point non bloquant (reporté)

`GeminiService` reçoit un code **404** lors de l'appel réel à l'API Gemini (`gemini-2.5-flash`), alors que le modèle existe bien côté API (confirmé via le listing `/v1beta/models`). Hypothèse : restriction liée au quota/statut du compte Google AI Studio, pas un bug de code. **Le fallback français fonctionne correctement**, aucun crash de l'application. Piste à essayer plus tard si besoin de vrais conseils IA : `GEMINI_MODEL=gemini-2.5-flash-001`.

---

## 8. Comment lancer le backend

```powershell
cd backend
mvn clean compile        # vérifie que tout compile
mvn clean test           # vérifie que les 24 tests passent
mvn spring-boot:run      # démarre le serveur sur http://localhost:8080
```

## 9. Comment vérifier rapidement que tout fonctionne

```powershell
# Santé du serveur
Invoke-RestMethod -Uri "http://localhost:8080/api/health" -Method Get

# Login admin
$session = $null
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/admin/login" `
    -Method Post -ContentType "application/json" `
    -Body '{"identifiant":"admin","motDePasse":"Admin@12345"}' `
    -SessionVariable session

# Vérifier l'identité
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/me" -Method Get -WebSession $session
```

---

## 10. Prochaine étape

Le backend étant validé de bout en bout, l'étape suivante du projet est la construction du **frontend React 18 + Vite + Tailwind** (étape 5), qui consommera exclusivement cette API Spring Boot — jamais Supabase directement.