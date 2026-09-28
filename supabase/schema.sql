-- Estructura de la base de datos del Tour Distrito Creativo de Usaquén.
-- Se ejecuta UNA vez en Supabase: SQL Editor > New query > pegar > Run.
-- Ver docs/PLAN_TECNICO.md, sección 3.
--
-- Acceso: la app lee con la clave publicable (solo lo publicado). Nadie
-- escribe desde la app; el contenido se edita en el panel de Supabase
-- (Table Editor) o con scripts/subir_contenido_supabase.py.

-- ─── Tablas ────────────────────────────────────────────────────────────

create table if not exists places (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  name                text not null,
  category            text not null,
  latitude            double precision not null,
  longitude           double precision not null,
  activation_radius   integer not null default 30,    -- metros
  summary             text,                            -- 1-2 líneas
  history             text,
  architecture        text,
  did_you_know        text,
  observation_prompt  text,                            -- "Mira hacia arriba..."
  image_path          text,                            -- ruta dentro del bucket media
  image_credit        text,
  audio_path          text,
  audio_title         text,
  audio_credit        text,
  sources             text,                            -- de dónde sale la información
  published           boolean not null default false,
  updated_at          timestamptz not null default now()
);

create table if not exists routes (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  name                text not null,
  description         text,
  duration_min        integer,
  distance_m          integer,
  cover_image_path    text,
  map_image_path      text,        -- mapa ilustrado de la ruta
  map_bounds          jsonb,       -- [[lat_norte, lon_oeste], [lat_sur, lon_este]]
  version             integer not null default 1,  -- subirla al cambiar contenido
  published           boolean not null default false,
  updated_at          timestamptz not null default now()
);

create table if not exists route_places (
  route_id   uuid not null references routes(id) on delete cascade,
  place_id   uuid not null references places(id) on delete cascade,
  position   integer not null,
  primary key (route_id, place_id),
  unique (route_id, position)
);

-- ─── Acceso público de solo lectura ───────────────────────────────────

alter table places enable row level security;
alter table routes enable row level security;
alter table route_places enable row level security;

drop policy if exists "public read places" on places;
create policy "public read places" on places for select using (published);

drop policy if exists "public read routes" on routes;
create policy "public read routes" on routes for select using (published);

drop policy if exists "public read route_places" on route_places;
create policy "public read route_places" on route_places for select using (true);

-- ─── Archivos (imágenes, audios, mapas) ──────────────────────────────
-- Bucket público "media": cualquiera puede descargar, nadie puede subir
-- desde la app. Se sube desde el panel o con el script.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;
