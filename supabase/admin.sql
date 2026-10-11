-- Administración desde la app y cuentas de visitantes.
-- Se ejecuta UNA vez, después de schema.sql: SQL Editor > New query > Run.
-- Se puede volver a ejecutar sin romper nada.
--
-- 1. Admins: solo los correos de la tabla `admins` pueden crear, editar y
--    borrar rutas, paradas y archivos. La regla vive aquí, en la base de
--    datos: aunque alguien modifique la app, sin ese correo no escribe nada.
-- 2. Versión automática: cualquier cambio en una ruta o en sus paradas sube
--    `routes.version`, así los celulares con la ruta descargada ven
--    "Actualizar" (antes había que subirla a mano).
-- 3. Progreso por cuenta: quien entra con Google guarda sus paradas
--    descubiertas en `user_progress` (cada quien solo ve las suyas).

-- ─── Admins ────────────────────────────────────────────────────────────

create table if not exists admins (
  email text primary key
);
alter table admins enable row level security;  -- sin políticas: nadie la lee por la API

insert into admins (email) values ('lychee.zzz.art@gmail.com')
on conflict (email) do nothing;

-- ¿La sesión actual es de un admin? security definer: puede leer `admins`
-- aunque la tabla no tenga políticas.
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where email = lower(auth.jwt() ->> 'email'));
$$;
grant execute on function is_admin() to anon, authenticated;

-- ─── Escritura solo para admins ───────────────────────────────────────

drop policy if exists "admin all places" on places;
create policy "admin all places" on places for all to authenticated
  using (is_admin()) with check (is_admin());

drop policy if exists "admin all routes" on routes;
create policy "admin all routes" on routes for all to authenticated
  using (is_admin()) with check (is_admin());

drop policy if exists "admin all route_places" on route_places;
create policy "admin all route_places" on route_places for all to authenticated
  using (is_admin()) with check (is_admin());

-- Archivos del bucket media: subir, reemplazar y borrar.
drop policy if exists "admin insert media" on storage.objects;
create policy "admin insert media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and is_admin());
drop policy if exists "admin update media" on storage.objects;
create policy "admin update media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and is_admin());
drop policy if exists "admin delete media" on storage.objects;
create policy "admin delete media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and is_admin());
drop policy if exists "admin read media" on storage.objects;
create policy "admin read media" on storage.objects for select to authenticated
  using (bucket_id = 'media' and is_admin());

-- ─── Versión y fecha automáticas ──────────────────────────────────────

-- Ruta editada: la versión siempre sube. Si el cambio trae una versión
-- mayor (el script de carga), se respeta; si trae una menor o igual, se usa
-- la siguiente, para que nunca baje y los celulares no se queden atrás.
create or replace function bump_route_version() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.version := greatest(new.version, old.version + 1);
  return new;
end $$;

drop trigger if exists routes_bump_version on routes;
create trigger routes_bump_version before update on routes
  for each row execute function bump_route_version();

-- Parada editada: sube la versión de las rutas que la incluyen.
create or replace function bump_routes_of_place() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  update routes set version = version + 1
    where id in (select route_id from route_places where place_id = new.id);
  return new;
end $$;

drop trigger if exists places_bump_routes on places;
create trigger places_bump_routes before update on places
  for each row execute function bump_routes_of_place();

-- Paradas agregadas, quitadas o reordenadas en una ruta.
create or replace function bump_route_of_link() returns trigger
language plpgsql as $$
begin
  update routes set version = version + 1
    where id = coalesce(new.route_id, old.route_id);
  return null;
end $$;

drop trigger if exists route_places_bump on route_places;
create trigger route_places_bump after insert or update or delete on route_places
  for each row execute function bump_route_of_link();

-- ─── Progreso de cada cuenta ──────────────────────────────────────────

create table if not exists user_progress (
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  place_id      uuid not null references places(id) on delete cascade,
  discovered_at timestamptz not null default now(),
  primary key (user_id, place_id)
);
alter table user_progress enable row level security;

drop policy if exists "own progress" on user_progress;
create policy "own progress" on user_progress for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
