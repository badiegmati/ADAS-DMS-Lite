# Plan de test utilisateur

Comptes de démonstration (données de test du dépôt) : gestionnaire `gestionnaire@test.tn`, conducteur `C10`, administrateur `admin` (mots de passe dans le README du dépôt). Le bouton « Remplir avec le compte de démonstration » de la page de connexion les saisit.

Participants : au moins 3, représentatifs. Anonymiser (P1, P2, P3) et recueillir leur accord.
Avant le test : `python main.py --simulate` (dms-client) pour faire varier les scores.

## Tâches (profil gestionnaire)
| N° | Consigne | Succès si… |
|---|---|---|
| T1 | « Trouvez quel conducteur présente le risque le plus élevé. » | Il désigne le conducteur de score le plus élevé |
| T2 | « Consultez le détail de ses alertes et dites quel type est le plus fréquent. » | Il ouvre le détail et lit la répartition ou le tableau |
| T3 | « Envoyez-lui un message lui demandant de faire une pause. » | Le message apparaît dans la conversation |
| T4 (option) | « Mettez le véhicule XXX en maintenance. » | Le statut passe à « Maintenance » |

## Grille d'observation
| Participant | Tâche | Réussite (oui / avec aide / non) | Temps (s) | Erreurs | Difficultés | Citation |
|---|---|---|---|---|---|---|

## Questionnaire SUS (1 = pas du tout d'accord … 5 = tout à fait d'accord)
1. Je pense que j'aimerais utiliser ce système fréquemment.
2. J'ai trouvé ce système inutilement complexe.
3. J'ai trouvé ce système facile à utiliser.
4. Je pense que j'aurais besoin du soutien d'un technicien pour utiliser ce système.
5. J'ai trouvé que les différentes fonctions de ce système étaient bien intégrées.
6. J'ai trouvé qu'il y avait trop d'incohérences dans ce système.
7. Je pense que la plupart des gens apprendraient très vite à utiliser ce système.
8. J'ai trouvé ce système très lourd à utiliser.
9. Je me suis senti(e) très confiant(e) en utilisant ce système.
10. J'ai eu besoin d'apprendre beaucoup de choses avant de pouvoir utiliser ce système.

Calcul : items impairs = réponse − 1 ; items pairs = 5 − réponse ; somme × 2,5 = score SUS sur 100 (moyenne indicative : 68).

## Débriefing
Le plus facile ? le plus difficile ? Une surprise ? Une information difficile à lire ou à repérer ? Qu'aimeriez-vous ajouter ?

## Analyse
Lister les problèmes, leur gravité (mineure, majeure, bloquante) et la recommandation. Corriger, puis refaire un test rapide pour montrer l'avant / après.
