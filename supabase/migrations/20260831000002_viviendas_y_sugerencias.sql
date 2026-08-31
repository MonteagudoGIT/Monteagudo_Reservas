-- Fase 3 (add.) · Semilla de viviendas + bloqueo por impago + buzón de sugerencias
-- Añadidos sobre la spec original, pedidos por el cliente.

-- ---------------------------------------------------------------------------
-- Bloqueo de vivienda (p. ej. por impago de cuota).
-- La aplicación del bloqueo (impedir reservar) se hace en la capa de reservas (Fase 4).
-- ---------------------------------------------------------------------------
alter table public.viviendas
  add column bloqueada     boolean not null default false,
  add column motivo_bloqueo text,
  add column bloqueada_en  timestamptz;

-- La lista de viviendas se muestra en el registro (usuario aún no autenticado).
drop policy if exists "viviendas_select" on public.viviendas;
create policy "viviendas_select" on public.viviendas
  for select using (true);

-- ---------------------------------------------------------------------------
-- Semilla: Urbanización Monteagudo — Monasterio de las Huelgas, 14
-- Portales A–E · plantas 1–4 · puertas A y B  => 40 viviendas
-- ---------------------------------------------------------------------------
insert into public.viviendas (etiqueta, portal, planta, puerta)
select
  'Portal ' || portal || ' · ' || planta || '.º ' || puerta,
  portal,
  planta::text,
  puerta
from (values ('A'), ('B'), ('C'), ('D'), ('E')) as portales(portal)
cross join generate_series(1, 4) as plantas(planta)
cross join (values ('A'), ('B')) as puertas(puerta);

-- ---------------------------------------------------------------------------
-- Buzón de sugerencias (vecino -> administración).
-- El reenvío por email al administrador se hará desde la app cuando haya Resend.
-- ---------------------------------------------------------------------------
create type public.estado_sugerencia as enum ('nueva', 'leida', 'gestionada');

create table public.sugerencias (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid references auth.users (id) on delete set null,
  vivienda_id uuid references public.viviendas (id) on delete set null,
  texto       text not null check (char_length(texto) between 3 and 4000),
  estado      public.estado_sugerencia not null default 'nueva',
  creada_en   timestamptz not null default now()
);

create index sugerencias_estado_idx on public.sugerencias (estado);

alter table public.sugerencias enable row level security;

create policy "sugerencias_insert" on public.sugerencias
  for insert with check (usuario_id = auth.uid());

create policy "sugerencias_select" on public.sugerencias
  for select using (usuario_id = auth.uid() or public.es_admin());

create policy "sugerencias_admin_update" on public.sugerencias
  for update using (public.es_admin()) with check (public.es_admin());
