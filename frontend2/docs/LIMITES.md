# Limites connues

- **Affectation et maintenance (P21)** : couvertes par l'API existante (`vehiculeId` d'un conducteur ; statut `MAINTENANCE` d'un véhicule). Il n'existe **aucun planning ni historique de maintenance** (dates, coûts, échéances) : le backend ne les expose pas et n'a pas été modifié.
- **Répartition par type d'alerte** (détail conducteur) : calculée à partir des alertes géolocalisées renvoyées par l'API (`carte`), pas sur tout l'historique.
- **Filtre par catégorie** : disponible côté conducteur (paramètre `categorie`) ; absent de la page de détail gestionnaire car l'endpoint `detail` ne le propose pas.
- **Positions GPS** : simulées par le client de détection (autour de Tunis).
- **Temps réel** : actualisation périodique (15 à 30 s), pas de WebSocket ni de notification push.
- **Fond de carte** : tuiles OpenStreetMap rendues en sombre par un filtre CSS (pas de clé API).
- **Conseils IA** : dépendent de l'API Gemini ; message de repli du backend en cas d'indisponibilité.
- **Tests réalisés** : compilation et parcours visuel automatisé (connexion, tableau de bord, détail, véhicules) contre un faux backend. Le frontend n'a pas encore été essayé avec ton backend réel.
- **Accessibilité** : bonnes pratiques WCAG 2.2 AA appliquées dans le code ; un audit outillé (axe, Lighthouse) et un test au lecteur d'écran restent à faire sur le site déployé.
