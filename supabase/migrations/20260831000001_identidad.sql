-- Fase 3 · Identidad y acceso
-- Viviendas, perfiles (1:1 con auth.users), roles y estado de cuenta.
-- El resto del modelo (espacios, reservas, pagos...) llega en la Fase 4.

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.rol_usuario as enum ('usuario', 'admin');
create type public.estado_cuenta as enum ('activa', 'desactivada');

-- ---------------------------------------------------------------------------
-- Viviendas
-- ---------------------------------------------------------------------------
create table public.viviendas (
  id         uuid primary key default gen_random_uuid(),
  etiqueta   text not null,            -- p. ej. "Portal 2 · 3.º B"
  portal     text,
  planta     text,
  puerta     text,
  activa     boolean not null default true,
  creada_en  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Perfiles
-- ---------------------------------------------------------------------------
create table public.perfiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  nombre         text not null default '',
  apellidos      text not null default '',
  telefono       text,
  vivienda_id    uuid references public.viviendas (id) on delete set null,
  vivienda_texto text,                 -- texto libre hasta que se enlace a una vivienda
  rol            public.rol_usuario  not null default 'usuario',
  estado         public.estado_cuenta not null default 'activa',
  creado_en      timestamptz not null default now()
);

create index perfiles_rol_idx on public.perfiles (rol);
create index perfiles_vivienda_idx on public.perfiles (vivienda_id);

-- ---------------------------------------------------------------------------
-- Helper: ¿el usuario actual es admin activo?  (SECURITY DEFINER para no
-- recursar sobre las políticas RLS de "perfiles")
-- ---------------------------------------------------------------------------
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid()
      and rol = 'admin'
      and estado = 'activa'
  );
$$;

grant execute on function public.es_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Al crear un usuario en auth.users -> crear su perfil
-- ---------------------------------------------------------------------------
create or replace function public.crear_perfil_para_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, apellidos, vivienda_texto)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    coalesce(new.raw_user_meta_data ->> 'apellidos', ''),
    nullif(new.raw_user_meta_data ->> 'vivienda_texto', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.crear_perfil_para_usuario();

-- ---------------------------------------------------------------------------
-- Un vecino no puede cambiarse a sí mismo el rol ni el estado
-- ---------------------------------------------------------------------------
create or replace function public.proteger_campos_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    new.rol := old.rol;
    new.estado := old.estado;
  end if;
  return new;
end;
$$;

create trigger perfiles_proteger_campos
  before update on public.perfiles
  for each row execute function public.proteger_campos_perfil();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.perfiles  enable row level security;
alter table public.viviendas enable row level security;

-- Perfiles: cada uno ve/edita el suyo; los admin, todos.
create policy "perfiles_select" on public.perfiles
  for select using (id = auth.uid() or public.es_admin());

create policy "perfiles_update" on public.perfiles
  for update using (id = auth.uid() or public.es_admin())
  with check (id = auth.uid() or public.es_admin());
-- El INSERT lo hace el trigger (SECURITY DEFINER); no se expone a los usuarios.

-- Viviendas: cualquier autenticado las lee; solo los admin las gestionan.
create policy "viviendas_select" on public.viviendas
  for select using (auth.role() = 'authenticated');

create policy "viviendas_admin_write" on public.viviendas
  for all using (public.es_admin()) with check (public.es_admin());

-- ---------------------------------------------------------------------------
-- Primer administrador (ejecutar DESPUÉS de que adiaz@sietefam.es se registre
-- y verifique el correo):
--
--   update public.perfiles set rol = 'admin'
--   where id = (select id from auth.users where email = 'adiaz@sietefam.es');
-- ---------------------------------------------------------------------------
