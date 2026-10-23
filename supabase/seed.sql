-- =====================================================================
-- Données de test (idempotent) — à exécuter APRÈS schema.sql
-- Mot de passe de TOUS les comptes de test : Test1234!
--   Gestionnaire : gestionnaire@test.tn
--   Conducteur   : C10  (ou karim.benali@test.tn)
-- Si tu avais déjà inséré les données de l'étape 1, ce script remplace
-- simplement le faux hash par un vrai hash BCrypt.
-- =====================================================================

insert into gestionnaires (entreprise, email, mot_de_passe, actif)
values ('Alpha Transport', 'gestionnaire@test.tn',
        '$2a$10$a8LmVfDazFthzXLqqVaCoegcRaGWSYj.v3Gt9mucQC8XF6P0bSvFa', true)
on conflict (entreprise) do update set mot_de_passe = excluded.mot_de_passe;

insert into vehicules (matricule, marque, modele, statut, gestionnaire_id)
select '123 TUN 4567', 'Renault', 'Clio', 'ACTIF', g.id
from gestionnaires g where g.entreprise = 'Alpha Transport'
on conflict (matricule) do nothing;

insert into conducteurs (code_conducteur, nom, prenom, email, telephone,
                         mot_de_passe, actif, gestionnaire_id, vehicule_id)
select 'C10', 'Ben Ali', 'Karim', 'karim.benali@test.tn', '20123456',
       '$2a$10$a8LmVfDazFthzXLqqVaCoegcRaGWSYj.v3Gt9mucQC8XF6P0bSvFa', true, g.id, v.id
from gestionnaires g
join vehicules v on v.matricule = '123 TUN 4567'
where g.entreprise = 'Alpha Transport'
on conflict (code_conducteur) do update set mot_de_passe = excluded.mot_de_passe;
