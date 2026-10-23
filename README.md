# ADAS-DMS Lite

Version simplifiée de mon PFE de supervision de conducteurs : **uniquement le DMS**
(surveillance du conducteur) sur la webcam d'un PC, une base **Supabase**, une API
**Spring Boot** et une application web **React** pour trois rôles
(administrateur, gestionnaire de flotte, conducteur).

> Statut : client PC ✅ · backend Spring Boot ✅ · frontend React ⏳ (étapes 5–6)

## Architecture

```
CAM1 (webcam PC)
   │  Python : MediaPipe + OpenCV (+ YOLOv8n pour le téléphone)
   ▼
Supabase (PostgreSQL)  ◄──────────────┐
   ▲  INSERT direct via REST (clé anon, table alertes uniquement)
   │                                   │ JDBC (rôle postgres, pooler 6543)
   └── triggers SQL : résolution du conducteur, déduplication, score automatique
                                       │
                              Spring Boot 3 (API REST, JWT cookie httpOnly)
                              • lit toutes les données
                              • écrit : admin→gestionnaires, gestionnaire→conducteurs/véhicules,
                                messages, conseils IA (Gemini)
                                       │
                                       ▼
                         React 18 + Vite + Tailwind (3 rôles)
```

* Aucun stockage local : tout est dans Supabase.
* Le navigateur ne parle **jamais** à Supabase, uniquement à Spring Boot.
* Le score de risque (0–100) est calculé **en SQL** (trigger + fonction `calculer_score`) :
  somme des pénalités avec décroissance exponentielle (demi-vie 2 h, fenêtre 24 h).
  Un événement grave isolé (téléphone, yeux fermés > 2 s) force le niveau CRITIQUE (≥ 75).
* Niveaux : FAIBLE [0;25[ · MODÉRÉ [25;50[ · ÉLEVÉ [50;75[ · CRITIQUE [75;100].
* Gemini (offre gratuite) : message d'alerte quand le score dépasse 75, conseils personnalisés
  quand l'historique des 7 jours est mauvais. Appelé uniquement par le backend.

## Structure

```
adas-dms-lite/
├── supabase/      schema.sql (tables, triggers, RLS) · seed.sql (données de test)
├── dms-client/    client PC Python (webcam → Supabase)
├── backend/       API Spring Boot (Java 17, Maven)
└── frontend/      React 18 + Vite + Tailwind (à venir)
```

## Installation

### 1. Base de données (Supabase > SQL Editor)

1. Exécuter `supabase/schema.sql`.
2. Exécuter `supabase/seed.sql` (gestionnaire, véhicule, conducteur `C10`, mot de passe `Test1234!`).

### 2. Client PC (voir `dms-client/README.md`)

```
cd dms-client
py -3.11 -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py --simulate --count 6 --interval 3
```

### 3. Backend (Java 17+ et Maven 3.9+)

1. Dans `backend/.env` : renseigner `DB_URL` (région du pooler), `DB_PASSWORD` (mot de passe de la
   base). `JWT_SECRET`, `GEMINI_API_KEY` et `ADMIN_DEFAULT_PASSWORD` sont déjà remplis.
   Où trouver la chaîne de connexion : Supabase › Project Settings › Database › Connection
   string › *Transaction pooler*.
2. Lancer :

```
cd backend
mvn test
mvn spring-boot:run
```

Si le démarrage échoue avec « Schema-validation: wrong column type », ajoute `JPA_DDL_AUTO=none`
dans `backend/.env` (le schéma est de toute façon géré par `supabase/schema.sql`).

L'API écoute sur http://localhost:8080 (test : http://localhost:8080/api/health).
`backend/requests.http` contient une requête d'exemple pour chaque endpoint.

### Comptes de test

| Rôle | Identifiant | Mot de passe |
|---|---|---|
| Administrateur | `admin` | `Admin@12345` (variable `ADMIN_DEFAULT_PASSWORD`) |
| Gestionnaire | `gestionnaire@test.tn` | `Test1234!` |
| Conducteur | `C10` ou `karim.benali@test.tn` | `Test1234!` |

### Vérifier toute la chaîne

1. Backend lancé, se connecter en conducteur (`requests.http`).
2. `python main.py --simulate --type PHONE --count 1` dans `dms-client`.
3. `GET /api/conducteur/me/dashboard` : le score passe à CRITIQUE (≥ 75) et, dans les
   15 secondes, un message d'alerte Gemini apparaît dans `GET /api/conducteur/me/conseils`.

## API (préfixe `/api`)

| Rôle | Endpoints |
|---|---|
| Public | `GET /health`, `POST /auth/{admin\|gestionnaire\|conducteur}/login`, `POST /auth/logout`, `GET /auth/me` |
| Admin | `GET/POST /admin/gestionnaires`, `PUT/DELETE /admin/gestionnaires/{id}`, `GET /admin/stats` |
| Gestionnaire | `GET/POST /gestionnaire/conducteurs`, `PUT/DELETE /gestionnaire/conducteurs/{id}`, `GET/POST /gestionnaire/vehicules`, `PUT/DELETE /gestionnaire/vehicules/{id}`, `GET /gestionnaire/dashboard`, `GET /gestionnaire/conducteurs/{id}/detail` |
| Conducteur | `GET /conducteur/me/dashboard`, `/alertes`, `/carte`, `/score/historique`, `/profil` (PUT), `/conseils`, `POST /conseils/generer`, `PUT /conseils/lus` |
| Messagerie | `GET /messages/{conducteurId}`, `POST /messages`, `PUT /messages/{conducteurId}/lus` |

Erreurs : `{ "message", "status", "timestamp" }` — 401 token absent/invalide, 403 accès à la
ressource d'un autre utilisateur, 409 doublon, 429 génération IA trop fréquente.

## Sécurité

* Mots de passe hachés en BCrypt, JWT HS256 (24 h) dans un cookie `httpOnly` `SameSite=Lax`.
* Le PC n'a que la clé **anon** : RLS n'autorise que `INSERT` dans `alertes`.
* Ne jamais publier `.env`, ni la clé `service_role` (inutile dans ce projet), ni la clé Gemini.
