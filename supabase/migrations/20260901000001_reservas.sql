-- Fase 4 · Espacios, tarifas, reservas y saldo

create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.modo_reserva  as enum ('sala', 'ping_pong');
create type public.estado_reserva as enum ('retenida', 'confirmada', 'cancelada', 'caducada', 'completada');
create type public.metodo_pago    as enum ('transferencia', 'saldo', 'gestion_admin');

-- ---------------------------------------------------------------------------
-- Espacios (por ahora solo la Sala; arquitectura lista para más)
-- ---------------------------------------------------------------------------
create table public.espacios (
  id          uuid primary key default gen_random_uuid(),
  clave       text unique not null,
  nombre      text not null,
  descripcion text,
  activo      boolean not null default true,
  creado_en   timestamptz not null default now()
);

insert into public.espacios (clave, nombre, descripcion)
values ('sala', 'Sala', 'Sala común de la comunidad. Se reserva como Sala o como Ping Pong.');

-- ---------------------------------------------------------------------------
-- Tarifas (precio por modo, en céntimos de euro; editables por el administrador)
-- ---------------------------------------------------------------------------
create table public.tarifas (
  id              uuid primary key default gen_random_uuid(),
  espacio_id      uuid not null references public.espacios (id) on delete cascade,
  modo            public.modo_reserva not null,
  precio_cent     integer not null default 0 check (precio_cent >= 0),
  actualizado_por uuid references auth.users (id) on delete set null,
  actualizado_en  timestamptz not null default now(),
  unique (espacio_id, modo)
);

-- Valores de partida: 0 €. El administrador pone los precios reales.
insert into public.tarifas (espacio_id, modo, precio_cent)
select id, m, 0
from public.espacios, (values ('sala'::public.modo_reserva), ('ping_pong'::public.modo_reserva)) as v(m)
where clave = 'sala';

-- ---------------------------------------------------------------------------
-- Reservas
-- ---------------------------------------------------------------------------
create table public.reservas (
  id           uuid primary key default gen_random_uuid(),
  espacio_id   uuid not null references public.espacios (id),
  vivienda_id  uuid not null references public.viviendas (id),
  usuario_id   uuid references auth.users (id) on delete set null,
  modo         public.modo_reserva not null,
  fecha        date not null,
  inicio       timestamptz not null,
  fin          timestamptz not null,
  durante      tstzrange not null,
  estado       public.estado_reserva not null default 'retenida',
  importe_cent integer not null default 0 check (importe_cent >= 0),
  metodo_pago  public.metodo_pago,
  referencia_transferencia text,
  retenida_hasta timestamptz,
  creada_por        uuid references auth.users (id) on delete set null,
  creada_por_admin  boolean not null default false,
  creada_en        timestamptz not null default now(),
  confirmada_en    timestamptz,
  cancelada_en     timestamptz,
  cancelada_por    uuid references auth.users (id) on delete set null,
  cancelada_motivo text,
  constraint reservas_fin_mayor check (fin > inicio),
  constraint reservas_durante_ok check (durante = tstzrange(inicio, fin, '[)'))
);

-- No puede haber dos reservas activas solapadas en el mismo espacio físico.
alter table public.reservas
  add constraint reservas_no_solape
  exclude using gist (espacio_id with =, durante with &&)
  where (estado in ('retenida', 'confirmada', 'completada'));

create index reservas_fecha_idx    on public.reservas (fecha);
create index reservas_vivienda_idx on public.reservas (vivienda_id);
create index reservas_estado_idx   on public.reservas (estado);

-- ---------------------------------------------------------------------------
-- Saldo de la vivienda (solo se genera por cancelaciones; se gasta al reservar)
-- ---------------------------------------------------------------------------
create table public.saldo_movimientos (
  id           uuid primary key default gen_random_uuid(),
  vivienda_id  uuid not null references public.viviendas (id) on delete cascade,
  tipo         text not null check (tipo in ('abono', 'consumo')),
  importe_cent integer not null check (importe_cent > 0),
  reserva_id   uuid references public.reservas (id) on delete set null,
  motivo       text,
  creado_por   uuid references auth.users (id) on delete set null,
  creado_en    timestamptz not null default now()
);
create index saldo_mov_vivienda_idx on public.saldo_movimientos (vivienda_id);

create or replace function public.saldo_vivienda(p_vivienda uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    sum(case when tipo = 'abono' then importe_cent else -importe_cent end), 0
  )::int
  from public.saldo_movimientos
  where vivienda_id = p_vivienda;
$$;
grant execute on function public.saldo_vivienda(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Intentos de reserva de una vivienda bloqueada por impago (aviso al admin)
-- ---------------------------------------------------------------------------
create table public.intentos_bloqueados (
  id          uuid primary key default gen_random_uuid(),
  vivienda_id uuid not null references public.viviendas (id) on delete cascade,
  usuario_id  uuid references auth.users (id) on delete set null,
  detalle     text,
  avisado     boolean not null default false,
  creado_en   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS  (las escrituras de negocio van por server actions con service_role;
--       aquí solo abrimos lo que el cliente necesita leer)
-- ---------------------------------------------------------------------------
alter table public.espacios            enable row level security;
alter table public.tarifas             enable row level security;
alter table public.reservas            enable row level security;
alter table public.saldo_movimientos   enable row level security;
alter table public.intentos_bloqueados enable row level security;

create policy "espacios_select" on public.espacios
  for select using (auth.role() = 'authenticated');
create policy "espacios_admin" on public.espacios
  for all using (public.es_admin()) with check (public.es_admin());

create policy "tarifas_select" on public.tarifas
  for select using (auth.role() = 'authenticated');
create policy "tarifas_admin" on public.tarifas
  for all using (public.es_admin()) with check (public.es_admin());

create policy "reservas_select" on public.reservas
  for select using (
    public.es_admin()
    or vivienda_id = (select vivienda_id from public.perfiles where id = auth.uid())
  );

create policy "saldo_select" on public.saldo_movimientos
  for select using (
    public.es_admin()
    or vivienda_id = (select vivienda_id from public.perfiles where id = auth.uid())
  );

create policy "intentos_admin_select" on public.intentos_bloqueados
  for select using (public.es_admin());
