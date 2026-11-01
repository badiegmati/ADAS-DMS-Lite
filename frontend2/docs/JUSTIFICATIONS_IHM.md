# Justification des choix de conception

| Choix | Où | Principe / critère |
|---|---|---|
| Bannière d'alerte critique en tête, `role="alert"`, pulsation douce | `CriticalBanner` | Nielsen 1 (visibilité de l'état du système) ; WCAG 4.1.3 |
| Niveau de risque = texte + icône (forme différente) + couleur | `RiskBadge`, `ScoreBar` | WCAG 1.4.1 ; Nielsen 4 (cohérence) |
| Heure de dernière mise à jour, bouton Actualiser, actualisation auto | `RefreshBar`, `usePolling` | Nielsen 1 et 3 (contrôle) |
| Top des conducteurs à surveiller avec « Voir le détail » / « Écrire » | `FleetDashboard` | Nielsen 7 (efficacité) ; T1 en 1 clic, T2 et T3 en 2 clics |
| Recherche, filtre par niveau, tri | `FleetDashboard`, `ConducteursPage` | Nielsen 6 et 7 |
| Fil d'Ariane, page active (`aria-current`), titre de document dynamique | `Breadcrumbs`, `AppLayout`, `useDocumentTitle` | Nielsen 6 ; WCAG 2.4.2, 2.4.8 |
| Confirmation avant suppression, focus initial sur « Annuler » | `ConfirmDialog` | Nielsen 5 (prévention des erreurs) |
| Validation de formulaire avec message lié au champ (`aria-describedby`) | `Field` | Nielsen 9 ; WCAG 3.3.1, 3.3.3 |
| Toasts de succès / erreur dans des régions `aria-live` | `ToastContext` | Nielsen 1 ; WCAG 4.1.3 |
| Squelettes, états vides pédagogiques, états d'erreur avec « Réessayer » | `Skeleton`, `EmptyState`, `ErrorState` | Nielsen 1 et 9 |
| Alternative en tableau aux graphiques et à la carte | `DataTableToggle` | WCAG 1.1.1 |
| Légende des graphiques en texte (valeurs, pourcentages) | `RiskDoughnut` | WCAG 1.4.1 |
| Lien d'évitement, clavier, focus visible, piège de focus dans les dialogues | `SkipLink`, `index.css`, `Modal` | WCAG 2.1.1, 2.1.2, 2.4.1, 2.4.7 |
| Cibles ≥ 44 px, responsive dès 320 px | `index.css`, grilles | WCAG 2.5.8, 1.4.10 |
| Animations coupées avec `prefers-reduced-motion`, fond WebGL remplacé par un dégradé | `MotionConfig`, `AuroraBackground` | WCAG 2.3.3 |
| Thème sombre, couleurs de risque éclaircies pour le texte | `tokens.js`, `tailwind.config.js` | WCAG 1.4.3, 1.4.11 |
| Un seul `h1` par page, tableaux avec `caption` et `th scope` | `PageHeader`, tableaux | WCAG 1.3.1 |
| Vocabulaire métier en français | partout | Nielsen 2 |
| Couleur d'accent par rôle | `[data-role]` dans `index.css` | Cohérence, repérage du contexte |
| Barre de progression fine pendant les appels réseau | `TopProgress`, `api/axios.js` | Nielsen 1 (visibilité de l'état du système) |
| Pastille de navigation animée (ressort) entre les pages | `AppLayout` (`layoutId`) | Nielsen 6 (repérage), continuité visuelle |
| Halo lumineux qui suit le curseur sur les cartes | `useSpotlight`, `.glass::before` | Retour d'interaction (affordance), purement décoratif |
| Point clignotant sur le badge « Critique » (arrêté si animations réduites) | `RiskBadge` | Hiérarchie visuelle de l'urgence, doublée du texte |
| Apparition des sections au défilement | `Reveal` | Guidage du regard, désactivée si animations réduites |
| Jauge à graduations et dégradé | `ScoreGauge` | Lisibilité de la valeur (chiffre + graduations + alternative textuelle) |
