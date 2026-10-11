-- Endova — schéma de base.
--
-- À exécuter une fois dans l'éditeur SQL de Supabase. Le fichier est
-- idempotent : le rejouer ne casse rien.
--
-- Trois principes.
--
-- 1. Le cabinet est l'unité d'isolement. Un praticien ne voit que les dossiers
--    de son cabinet, et cette règle est portée par la base, pas par
--    l'application. Si le code du navigateur est contourné, les données
--    restent closes.
--
-- 2. Les champs sur lesquels on filtre sont de vraies colonnes — date et type
--    d'examen, cabinet, numéro, jeton. Le reste reste en jsonb : l'application
--    manipule déjà ces blocs comme des objets, et les normaliser entièrement
--    aurait demandé de réécrire l'interface sans rien gagner aujourd'hui.
--
-- 3. Le journal est en append-only. Une traçabilité qu'on peut réécrire ne
--    vaut rien : aucune politique de modification ni de suppression n'est
--    accordée sur `evenements`.

create extension if not exists "pgcrypto";

-- ───────────────────────────────────────────────────────── cabinets

create table if not exists public.cabinets (
  id             uuid primary key default gen_random_uuid(),
  nom            text not null,
  nom_court      text not null,
  expediteur     text not null check (char_length(expediteur) <= 11),
  telephone      text not null default '',
  praticiens     jsonb not null default '[]'::jsonb,
  lieux          jsonb not null default '[]'::jsonb,
  valeur_creneau integer not null default 0,
  delai_resultats text not null default 'quinze jours',
  cree_le        timestamptz not null default now()
);

comment on column public.cabinets.expediteur is
  'Nom court de l''expéditeur SMS : onze caractères au plus, contrainte des opérateurs.';

-- ───────────────────────────────────────── qui appartient à quel cabinet

create table if not exists public.membres (
  utilisateur uuid not null references auth.users (id) on delete cascade,
  cabinet_id  uuid not null references public.cabinets (id) on delete cascade,
  role        text not null default 'secretariat'
                check (role in ('secretariat', 'praticien', 'admin')),
  cree_le     timestamptz not null default now(),
  primary key (utilisateur, cabinet_id)
);

-- Le cabinet de l'utilisateur courant. Marquée `stable` et `security definer`
-- pour que les politiques puissent l'appeler sans retomber dans leurs propres
-- règles — sinon la lecture de `membres` se déclencherait récursivement.
create or replace function public.mon_cabinet()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select cabinet_id from public.membres where utilisateur = auth.uid() limit 1;
$$;

-- ───────────────────────────────────────────────────────── dossiers

create table if not exists public.dossiers (
  id                uuid primary key default gen_random_uuid(),
  cabinet_id        uuid not null references public.cabinets (id) on delete cascade,
  numero            text not null,
  -- Le jeton voyage dans le SMS. Il ne suffit pas à ouvrir le dossier :
  -- l'année de naissance est demandée en seconde preuve.
  jeton             text not null unique,
  examen_date       timestamptz not null,
  examen_type       text not null,
  identite          jsonb not null default '{}'::jsonb,
  examen            jsonb not null default '{}'::jsonb,
  terrain           jsonb not null default '{}'::jsonb,
  administratif     jsonb not null default '{}'::jsonb,
  etapes            jsonb not null default '{}'::jsonb,
  alertes_traitees  jsonb not null default '{}'::jsonb,
  cree_le           timestamptz not null default now(),
  modifie_le        timestamptz not null default now(),
  unique (cabinet_id, numero)
);

create index if not exists dossiers_cabinet_date_idx
  on public.dossiers (cabinet_id, examen_date);

create or replace function public.toucher_modifie_le()
returns trigger
language plpgsql
as $$
begin
  new.modifie_le := now();
  return new;
end;
$$;

drop trigger if exists dossiers_modifie_le on public.dossiers;
create trigger dossiers_modifie_le
  before update on public.dossiers
  for each row execute function public.toucher_modifie_le();

-- ───────────────────────────────────── journal, en écriture seule

create table if not exists public.evenements (
  id         bigint generated always as identity primary key,
  dossier_id uuid not null references public.dossiers (id) on delete cascade,
  type       text not null,
  auteur     text not null default '',
  etape      text,
  detail     jsonb not null default '{}'::jsonb,
  survenu_le timestamptz not null default now()
);

create index if not exists evenements_dossier_idx
  on public.evenements (dossier_id, survenu_le desc);

-- ───────────────────────────────────────────────────────── RLS

alter table public.cabinets   enable row level security;
alter table public.membres    enable row level security;
alter table public.dossiers   enable row level security;
alter table public.evenements enable row level security;

drop policy if exists cabinets_lecture on public.cabinets;
create policy cabinets_lecture on public.cabinets
  for select to authenticated
  using (id = public.mon_cabinet());

drop policy if exists cabinets_maj on public.cabinets;
create policy cabinets_maj on public.cabinets
  for update to authenticated
  using (id = public.mon_cabinet())
  with check (id = public.mon_cabinet());

drop policy if exists membres_lecture on public.membres;
create policy membres_lecture on public.membres
  for select to authenticated
  using (utilisateur = auth.uid());

drop policy if exists dossiers_lecture on public.dossiers;
create policy dossiers_lecture on public.dossiers
  for select to authenticated
  using (cabinet_id = public.mon_cabinet());

drop policy if exists dossiers_creation on public.dossiers;
create policy dossiers_creation on public.dossiers
  for insert to authenticated
  with check (cabinet_id = public.mon_cabinet());

drop policy if exists dossiers_maj on public.dossiers;
create policy dossiers_maj on public.dossiers
  for update to authenticated
  using (cabinet_id = public.mon_cabinet())
  with check (cabinet_id = public.mon_cabinet());

drop policy if exists dossiers_suppression on public.dossiers;
create policy dossiers_suppression on public.dossiers
  for delete to authenticated
  using (cabinet_id = public.mon_cabinet());

drop policy if exists evenements_lecture on public.evenements;
create policy evenements_lecture on public.evenements
  for select to authenticated
  using (exists (
    select 1 from public.dossiers d
    where d.id = evenements.dossier_id and d.cabinet_id = public.mon_cabinet()
  ));

drop policy if exists evenements_ajout on public.evenements;
create policy evenements_ajout on public.evenements
  for insert to authenticated
  with check (exists (
    select 1 from public.dossiers d
    where d.id = evenements.dossier_id and d.cabinet_id = public.mon_cabinet()
  ));

-- Aucune politique d'update ni de delete sur `evenements` : le journal ne se
-- réécrit pas. C'est volontaire, et c'est la seule garantie qui vaille.

-- ───────────────────────────── rattacher le premier utilisateur

-- À lancer une fois, connecté, pour créer le cabinet et s'y rattacher.
-- Exemple :
--   select public.installer_cabinet('Cabinet de gastro-entérologie des Tilleuls',
--                                   'Cabinet des Tilleuls', 'TILLEULS-GE');
create or replace function public.installer_cabinet(
  p_nom text, p_nom_court text, p_expediteur text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cabinet uuid;
begin
  if auth.uid() is null then
    raise exception 'Il faut être connecté pour installer un cabinet.';
  end if;
  if public.mon_cabinet() is not null then
    raise exception 'Cet utilisateur appartient déjà à un cabinet.';
  end if;

  insert into public.cabinets (nom, nom_court, expediteur)
  values (p_nom, p_nom_court, p_expediteur)
  returning id into v_cabinet;

  insert into public.membres (utilisateur, cabinet_id, role)
  values (auth.uid(), v_cabinet, 'admin');

  return v_cabinet;
end;
$$;

revoke all on function public.installer_cabinet(text, text, text) from public;
grant execute on function public.installer_cabinet(text, text, text) to authenticated;
