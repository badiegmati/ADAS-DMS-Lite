-- =====================================================================
--  ADAS-DMS Lite — Schéma Supabase (PostgreSQL)
--  À exécuter dans : Supabase > SQL Editor
--  Aucune Edge Function : le score est calculé par un trigger SQL.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Référentiel des types d'alerte (pénalités pilotées par les données)
-- ---------------------------------------------------------------------
create table if not exists types_alerte (
  code      text primary key,
  libelle   text    not null,
  severite  int     not null check (severite > 0),   -- points de pénalité
  critique  boolean not null default false           -- événement isolé grave
);

insert into types_alerte (code, libelle, severite, critique) values
  ('DISTRACTION',         'Regard détourné de la route',      4, false),
  ('FATIGUE_YAWN',        'Bâillement',                       6, false),
  ('FATIGUE_DROP',        'Tête qui tombe',                   8, false),
  ('FATIGUE_EYES_DROWSY', 'Yeux mi-clos (somnolence)',       15, false),
  ('FATIGUE_EYES_CLOSED', 'Yeux fermés plus de 2 secondes',  25, true),
  ('PHONE',               'Téléphone au volant',             20, true)
on conflict (code) do update
  set libelle = excluded.libelle,
      severite = excluded.severite,
      critique = excluded.critique;

-- ---------------------------------------------------------------------
-- 2. Utilisateurs et flotte (écrits par Spring Boot)
-- ---------------------------------------------------------------------
create table if not exists admins (
  id            uuid primary key default gen_random_uuid(),
  identifiant   text unique not null,
  mot_de_passe  text not null,                       -- hash BCrypt
  created_at    timestamptz not null default now()
);

create table if not exists gestionnaires (
  id            uuid primary key default gen_random_uuid(),
  entreprise    text unique not null,
  email         text unique not null,
  mot_de_passe  text not null,                       -- hash BCrypt
  actif         boolean not null default true,
  admin_id      uuid references admins(id) on delete set null,
  created_at    timestamptz not null default now()
);

create table if not exists vehicules (
  id               uuid primary key default gen_random_uuid(),
  matricule        text unique not null,
  marque           text,
  modele           text,
  statut           text not null default 'ACTIF' check (statut in ('ACTIF','INACTIF','MAINTENANCE')),
  gestionnaire_id  uuid not null references gestionnaires(id) on delete cascade,
  created_at       timestamptz not null default now()
);

create table if not exists conducteurs (
  id                uuid primary key default gen_random_uuid(),
  code_conducteur   text unique not null,            -- ex. C10 : utilisé par le client PC
  nom               text not null,
  prenom            text not null,
  email             text unique not null,
  telephone         text,
  mot_de_passe      text not null,                   -- hash BCrypt
  actif             boolean not null default true,
  gestionnaire_id   uuid not null references gestionnaires(id) on delete cascade,
  vehicule_id       uuid unique references vehicules(id) on delete set null,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Alertes (écrites directement par le PC via l'API REST Supabase)
-- ---------------------------------------------------------------------
create table if not exists alertes (
  id               bigint generated always as identity primary key,
  event_uid        uuid unique not null default gen_random_uuid(),  -- idempotence des renvois
  conducteur_code  text not null,                     -- envoyé par le PC
  conducteur_id    uuid references conducteurs(id) on delete cascade,  -- résolu par trigger
  type_alerte      text not null references types_alerte(code),
  severite         int  not null,                     -- rempli par trigger
  critique         boolean not null default false,    -- rempli par trigger
  description      text,
  latitude         double precision,                  -- GPS simulé
  longitude        double precision,
  horodatage       timestamptz not null default now(),
  created_at       timestamptz not null default now()
);
create index if not exists idx_alertes_conducteur_time on alertes (conducteur_id, horodatage desc);

-- ---------------------------------------------------------------------
-- 4. Scores (mis à jour automatiquement par trigger)
-- ---------------------------------------------------------------------
create table if not exists scores_risque (            -- score courant, 1 ligne / conducteur
  conducteur_id   uuid primary key references conducteurs(id) on delete cascade,
  valeur          numeric(5,2) not null,
  niveau          text not null check (niveau in ('FAIBLE','MODERE','ELEVE','CRITIQUE')),
  nb_alertes_24h  int not null default 0,
  derniere_maj    timestamptz not null default now()
);

create table if not exists scores_historique (        -- courbe d'évolution
  id              bigint generated always as identity primary key,
  conducteur_id   uuid not null references conducteurs(id) on delete cascade,
  valeur          numeric(5,2) not null,
  niveau          text not null,
  calcule_le      timestamptz not null default now()
);
create index if not exists idx_scores_hist on scores_historique (conducteur_id, calcule_le desc);

-- ---------------------------------------------------------------------
-- 5. Conseils IA (écrits par Spring Boot via Gemini)
-- ---------------------------------------------------------------------
create table if not exists conseils_ia (
  id              bigint generated always as identity primary key,
  conducteur_id   uuid not null references conducteurs(id) on delete cascade,
  type            text not null check (type in ('ALERTE','CONSEIL')),
  contenu         text not null,
  score_moment    numeric(5,2),
  modele          text,
  lu              boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists idx_conseils on conseils_ia (conducteur_id, created_at desc);

-- ---------------------------------------------------------------------
-- 6. Messagerie gestionnaire <-> conducteur
-- ---------------------------------------------------------------------
create table if not exists messages (
  id               bigint generated always as identity primary key,
  conducteur_id    uuid not null references conducteurs(id) on delete cascade,
  gestionnaire_id  uuid not null references gestionnaires(id) on delete cascade,
  expediteur_role  text not null check (expediteur_role in ('GESTIONNAIRE','CONDUCTEUR')),
  contenu          text not null,
  lu               boolean not null default false,
  created_at       timestamptz not null default now()
);
create index if not exists idx_messages_conv on messages (conducteur_id, gestionnaire_id, created_at);

-- =====================================================================
--  CALCUL DU SCORE (professionnel, sans Edge Function)
--  Modèle : somme des pénalités avec décroissance exponentielle
--           dans le temps (demi-vie), fenêtre de 24 h, plafond 100.
--  Règle critique : un événement grave (PHONE, FATIGUE_EYES_CLOSED)
--           dans les 15 dernières minutes force le score à >= 75.
--  Paramètres modifiables : v_demi_vie_min, v_fenetre, v_fenetre_crit.
-- =====================================================================
create or replace function niveau_from_score(s numeric)
returns text language sql immutable as $$
  select case
    when s < 25 then 'FAIBLE'
    when s < 50 then 'MODERE'
    when s < 75 then 'ELEVE'
    else 'CRITIQUE'
  end
$$;

create or replace function calculer_score(p_conducteur uuid, p_at timestamptz default now())
returns numeric
language plpgsql stable
security definer set search_path = public
as $$
declare
  v_demi_vie_min  constant numeric  := 120;                  -- demi-vie en minutes
  v_fenetre       constant interval := interval '24 hours';
  v_fenetre_crit  constant interval := interval '15 minutes';
  v_somme   numeric;
  v_crit    boolean;
  v_score   numeric;
begin
  select coalesce(sum(
           severite * power(0.5, (extract(epoch from (p_at - horodatage)) / 60.0) / v_demi_vie_min)
         ), 0)
    into v_somme
    from alertes
   where conducteur_id = p_conducteur
     and horodatage >  p_at - v_fenetre
     and horodatage <= p_at;

  select exists (
           select 1 from alertes
            where conducteur_id = p_conducteur
              and critique
              and horodatage >  p_at - v_fenetre_crit
              and horodatage <= p_at)
    into v_crit;

  v_score := least(100, v_somme);
  if v_crit then
    v_score := greatest(v_score, 75);
  end if;

  return round(v_score, 2);
end
$$;

-- ---------------------------------------------------------------------
--  TRIGGER 1 (BEFORE INSERT) : résolution du conducteur, pénalité,
--  déduplication ±2 s. Retourne NULL => insertion silencieusement ignorée.
-- ---------------------------------------------------------------------
create or replace function trg_alerte_before()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_cid   uuid;
  v_type  types_alerte%rowtype;
  v_ts    timestamptz := coalesce(new.horodatage, now());
begin
  select id into v_cid
    from conducteurs
   where code_conducteur = new.conducteur_code and actif;
  if v_cid is null then
    return null;                                   -- conducteur inconnu ou inactif
  end if;

  select * into v_type from types_alerte where code = new.type_alerte;
  if not found then
    return null;
  end if;

  if exists (select 1 from alertes
              where conducteur_id = v_cid
                and type_alerte = new.type_alerte
                and horodatage between v_ts - interval '2 seconds' and v_ts + interval '2 seconds') then
    return null;                                   -- doublon
  end if;

  new.conducteur_id := v_cid;
  new.severite      := v_type.severite;
  new.critique      := v_type.critique;
  new.horodatage    := v_ts;
  return new;
end
$$;

drop trigger if exists trg_alerte_before on alertes;
create trigger trg_alerte_before
  before insert on alertes
  for each row execute function trg_alerte_before();

-- ---------------------------------------------------------------------
--  TRIGGER 2 (AFTER INSERT) : recalcul automatique du score
-- ---------------------------------------------------------------------
create or replace function trg_alerte_after()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_score numeric;
  v_nb    int;
begin
  v_score := calculer_score(new.conducteur_id);
  select count(*) into v_nb
    from alertes
   where conducteur_id = new.conducteur_id
     and horodatage > now() - interval '24 hours';

  insert into scores_risque (conducteur_id, valeur, niveau, nb_alertes_24h, derniere_maj)
  values (new.conducteur_id, v_score, niveau_from_score(v_score), v_nb, now())
  on conflict (conducteur_id) do update
    set valeur         = excluded.valeur,
        niveau         = excluded.niveau,
        nb_alertes_24h = excluded.nb_alertes_24h,
        derniere_maj   = excluded.derniere_maj;

  insert into scores_historique (conducteur_id, valeur, niveau)
  values (new.conducteur_id, v_score, niveau_from_score(v_score));

  return null;
end
$$;

drop trigger if exists trg_alerte_after on alertes;
create trigger trg_alerte_after
  after insert on alertes
  for each row execute function trg_alerte_after();

-- =====================================================================
--  SÉCURITÉ (RLS)
--  - Le PC (clé anon) peut UNIQUEMENT insérer dans alertes.
--  - Spring Boot se connecte avec le rôle postgres (contourne RLS).
--  - Le navigateur ne parle jamais à Supabase : uniquement à Spring Boot.
--  NB : le PC doit envoyer l'en-tête  Prefer: return=minimal
--       (anon n'a pas le droit de lire alertes).
-- =====================================================================
alter table types_alerte      enable row level security;
alter table admins            enable row level security;
alter table gestionnaires     enable row level security;
alter table vehicules         enable row level security;
alter table conducteurs       enable row level security;
alter table alertes           enable row level security;
alter table scores_risque     enable row level security;
alter table scores_historique enable row level security;
alter table conseils_ia       enable row level security;
alter table messages          enable row level security;

drop policy if exists anon_insert_alertes on alertes;
create policy anon_insert_alertes on alertes
  for insert to anon with check (true);

revoke all on all tables in schema public from anon;
grant insert on alertes to anon;
grant usage, select on all sequences in schema public to anon;
